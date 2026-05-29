import "dotenv/config";
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma";
import {
  Symptominput,
  Symptomoutput,
  ErrorResponse,
  UrgencyLevel,
  Gender,
  Severity,
  PredictedCondition,
  DoctorRecommendation,
} from "./symptom.type";
import { calculateUrgency } from "./utils/riskcalculater";
import { createAiExplanation } from "./utils/aiprompt";

type UserLocation = {
  latitude: number | null;
  longitude: number | null;
};

const normalizeSymptom = (symptom: string) => symptom.toLowerCase().trim();

// Match symptoms to conditions from database
const matchSymptomToConditions = async (symptoms: string[]): Promise<PredictedCondition[]> => {
  const conditionScores: Record<string, number> = {};

  for (const symptom of symptoms) {
    const relations = await prisma.symptomConditionRelation.findMany({
      where: {
        symptom: {
          name: {
            equals: symptom,
            mode: "insensitive",
          },
        },
      },
      include: {
        condition: true,
      },
    });

    // Accumulate probabilities for each condition
    for (const relation of relations) {
      const conditionName = relation.condition.name;
      conditionScores[conditionName] = (conditionScores[conditionName] || 0) + relation.probability;
    }
  }

  if (Object.keys(conditionScores).length === 0) {
    return [];
  }

  return Object.entries(conditionScores)
    .map(([condition, probability]) => ({
      condition,
      probability: Math.min(probability / symptoms.length, 0.95),
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
};

// Get recommended doctors from database based on conditions
const getRecommendedDoctorsFromDb = async (
  conditions: PredictedCondition[],
  userId?: string,
): Promise<DoctorRecommendation[]> => {
  try {
    // Find specializations related to the conditions
    const specializationConditionRelations = await prisma.specializationCondition.findMany({
      where: {
        condition: {
          name: {
            in: conditions.map((c) => c.condition),
          },
        },
      },
      include: {
        specialization: true,
        condition: true,
      },
    });

    if (specializationConditionRelations.length === 0) {
      // Fallback to general physicians
      const generalPhysicians = await prisma.doctor.findMany({
        where: {
          isAvailable: true,
          isVerified: true,
          specializations: {
            some: {
              specialization: {
                name: "General Physician",
              },
            },
          },
        },
        include: {
          specializations: {
            include: {
              specialization: true,
            },
          },
          reviews: true,
        },
        take: 5,
      });

      return generalPhysicians.map((doctor) => ({
        id: doctor.id,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialization: "General Physician",
        qualifications: doctor.qualifications,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationFee: doctor.consultationFee,
        clinicName: doctor.clinicName || "",
        clinicAddress: doctor.clinicAddress || "",
        clinicCity: doctor.clinicCity || "",
        clinicState: doctor.clinicState || "",
        clinicPincode: doctor.clinicPincode || "",
        ...(doctor.profileImageUrl ? { profileImageUrl: doctor.profileImageUrl } : {}),
        distanceKm: null,
        matchScore: "70.0%",
      }));
    }

    // Calculate specialization scores
    const specializationScores: { [specId: string]: { name: string; score: number } } = {};

    for (const relation of specializationConditionRelations) {
      const matchingCondition = conditions.find((c) => c.condition === relation.condition.name);
      if (matchingCondition) {
        const specId = relation.specializationId;
        if (!specializationScores[specId]) {
          specializationScores[specId] = {
            name: relation.specialization.name,
            score: 0,
          };
        }
        specializationScores[specId].score += matchingCondition.probability * relation.relevanceScore;
      }
    }

    // Get doctors with matching specializations
    const specIds = Object.keys(specializationScores);
    const doctors = await prisma.doctor.findMany({
      where: {
        AND: [
          {
              specializations: {
                some: {
                  specializationId: {
                    in: specIds,
                  },
                },
              },
            },
            {
              isAvailable: true,
              isVerified: true,
            },
          ],
        },
      include: {
        specializations: {
          include: {
            specialization: true,
          },
        },
        reviews: true,
      },
      take: 5,
    });

    // Get user location if available
    let userLocation: UserLocation | null = null;
    if (userId) {
      const locationData = await prisma.user.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true },
      });
      userLocation = locationData || null;
    }

    // Calculate match scores and distance
    return doctors
      .map((doctor) => {
        let matchScore = 0;
        for (const ds of doctor.specializations) {
          const specScore = specializationScores[ds.specializationId];
          if (specScore) {
            matchScore += specScore.score * (ds.isPrimary ? 1.2 : 1);
          }
        }
        matchScore = Math.min(matchScore / doctor.specializations.length, 1);

        // Calculate distance if user location available
        let distanceKm: number | null = null;
        if (
            userLocation &&
            userLocation.latitude !== null &&
            userLocation.longitude !== null &&
            doctor.latitude !== null &&
            doctor.longitude !== null
          ) {
            distanceKm = calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              doctor.latitude,
              doctor.longitude,
            );
        }

        // Calculate average rating
        const avgRating =
          doctor.reviews.length > 0
            ? doctor.reviews.reduce((sum, review) => sum + review.rating, 0) /
              doctor.reviews.length
            : 0;
        return {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.specializations.find((ds) => ds.isPrimary)?.specialization.name || "General Physician",
          qualifications: doctor.qualifications,
          yearsOfExperience: doctor.yearsOfExperience,
          consultationFee: doctor.consultationFee,
          clinicName: doctor.clinicName || "",
          clinicAddress: doctor.clinicAddress || "",
          clinicCity: doctor.clinicCity || "",
          clinicState: doctor.clinicState || "",
          clinicPincode: doctor.clinicPincode || "",
          ...(doctor.profileImageUrl ? { profileImageUrl: doctor.profileImageUrl } : {}),
          distanceKm: distanceKm ? Number(distanceKm.toFixed(1)) : null,
          matchScore: ((matchScore * 100).toFixed(1)) + "%",
          averageRating: parseFloat(avgRating.toFixed(1)),
        };
      })
      .sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) {
          return b.yearsOfExperience - a.yearsOfExperience;
        }
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  } catch (error) {
    console.error("Error getting recommended doctors:", error);
    return [];
  }
};

const calculateDistanceKm = (
  userLatitude: number,
  userLongitude: number,
  doctorLatitude: number,
  doctorLongitude: number,
): number => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(doctorLatitude - userLatitude);
  const longitudeDelta = toRadians(doctorLongitude - userLongitude);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(userLatitude)) *
      Math.cos(toRadians(doctorLatitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Validate symptoms exist in database
const validateSymptoms = async (symptoms: string[]): Promise<boolean> => {
  const validSymptoms = await prisma.symptom.findMany({
    where: {
      name: {
        in: symptoms,
        mode: "insensitive",
      },
    },
  });

  return validSymptoms.length > 0;
};

const isPredictedCondition = (value: unknown): value is PredictedCondition => {
  return (
    typeof value === "object" &&
    value !== null &&
    "condition" in value &&
    "probability" in value &&
    typeof (value as PredictedCondition).condition === "string" &&
    typeof (value as PredictedCondition).probability === "number"
  );
};

const toPredictedConditions = (value: unknown): PredictedCondition[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPredictedCondition);
};

const toSymptomList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((symptom): symptom is string => typeof symptom === "string");
};

export const Symptomanalyze = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Symptominput;
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    if (!userId) {
      const errorResponse: ErrorResponse = {
        message: "Unauthorized",
        success: false,
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!data.symptoms || !Array.isArray(data.symptoms) || data.symptoms.length === 0) {
      const errorResponse: ErrorResponse = {
        message: "Symptoms array is required and cannot be empty",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!data.age || data.age < 0 || data.age > 150) {
      const errorResponse: ErrorResponse = {
        message: "Valid age is required (0-150)",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!data.gender || !Object.values(Gender).includes(data.gender as Gender)) {
      const errorResponse: ErrorResponse = {
        message: "Valid gender is required (male/female)",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const symptoms = data.symptoms.map(normalizeSymptom).filter(Boolean);
    const age = Number(data.age);
    const gender = data.gender as Gender;
    const duration = data.duration || "Unknown";
    const severity = (data.severity || Severity.MILD) as Severity;

    // Validate symptoms exist in database
    if (!(await validateSymptoms(symptoms))) {
      const errorResponse: ErrorResponse = {
        message: "One or more symptoms not found in database. Please check your input.",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Match symptoms to conditions from database
    const conditions = await matchSymptomToConditions(symptoms);
    const topCondition = conditions[0];

    if (conditions.length === 0) {
      const errorResponse: ErrorResponse = {
        message: "No conditions found for the given symptoms",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Generate AI explanation
    const aiExplanation = await createAiExplanation(symptoms, age, gender, duration, severity, conditions);
    const urgencyLevel = calculateUrgency(severity, topCondition?.probability) as UrgencyLevel;

    // Get recommended doctors from database
    const recommendedDoctorsList = await getRecommendedDoctorsFromDb(conditions, userId);
    const recommendedDoctor = recommendedDoctorsList[0]?.name || "General Physician";

    // Prepare data for storage
    const predictedDiseaseJson: Prisma.InputJsonArray = conditions.map(({ condition, probability }) => ({
      condition,
      probability,
    }));

    // Create symptom session
    const session = await prisma.symptomSession.create({
      data: {
        userId,
        symptoms,
        age,
        gender,
        duration,
        severity,
        predictedDisease: predictedDiseaseJson,
        urgencyLevel,
        aiExplanation,
        recommendedDoctor,
      },
    });

    // Save recommended doctors to database
    if (recommendedDoctorsList.length > 0) {
      for (const recommendedDoc of recommendedDoctorsList) {
        await prisma.recommendedDoctor.create({
          data: {
            sessionId: session.id,
            doctorId: recommendedDoc.id,
            symptoms,
            matchScore: parseFloat(recommendedDoc.matchScore.replace("%", "")),
            distance: recommendedDoc.distanceKm ?? null,
          },
        });
      }
    }

    const payload: Symptomoutput = {
      message: "Symptoms analyzed successfully",
      success: true,
      urgencyLevel,
      recommendedDoctor,
      recommendedDoctors: recommendedDoctorsList,
      predictedDisease: conditions,
      aiExplanation,
      session: session as never,
    };

    res.status(200).json(payload);
    return;
  } catch (error) {
    console.error("Error in Symptomanalyze:", error);
    const errorPayload: ErrorResponse = {
      message: "Internal server error",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    res.status(500).json(errorPayload);
    return;
  }
};

export const getRecommendedDoctorsForSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSessionId = req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    if (!sessionId) {
      const errorResponse: ErrorResponse = {
        message: "Session id is required",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const session = await prisma.symptomSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      const errorResponse: ErrorResponse = {
        message: "Session not found",
        success: false,
      };
      res.status(404).json(errorResponse);
      return;
    }

    const conditions = toPredictedConditions(session.predictedDisease);
    const doctorsList = await getRecommendedDoctorsFromDb(conditions, userId);

    const payload = {
      message: "Recommended doctors retrieved successfully",
      success: true,
      doctors: doctorsList,
      sessionId,
    };

    res.status(200).json(payload);
    return;
  } catch (error) {
    console.error("Error fetching recommended doctors:", error);
    const errorPayload: ErrorResponse = {
      message: "Internal server error",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    res.status(500).json(errorPayload);
    return;
  }
};
