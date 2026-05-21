import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../../../generated/prisma/client.js";
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
import { symptomConditionMap } from "./symptom.data";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type UserLocation = {
  latitude: number | null;
  longitude: number | null;
};

type DoctorRow = {
  id: string;
  name: string;
  qualifications: string;
  yearsOfExperience: number;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicState: string;
  clinicPincode: string;
  latitude: number;
  longitude: number;
  consultationFee: number;
};

const normalizeSymptom = (symptom: string) => symptom.toLowerCase().trim();

const matchSymptomToConditions = (symptoms: string[]): PredictedCondition[] => {
  const conditionScores: Record<string, number> = {};

  for (const symptom of symptoms) {
    const matches = symptomConditionMap[symptom] || [];

    for (const match of matches) {
      conditionScores[match.condition] = (conditionScores[match.condition] || 0) + match.probability;
    }
  }

  return Object.entries(conditionScores)
    .map(([condition, probability]) => ({
      condition,
      probability: Math.min(probability / symptoms.length, 0.95),
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
};

const getRecommendedDoctorType = (symptoms: string[], conditions: PredictedCondition[]): string => {
  const conditionNames = conditions.map((condition) => condition.condition.toLowerCase());

  if (
    symptoms.some((symptom) => symptom.includes("chest") || symptom.includes("heart")) ||
    conditionNames.some((condition) => condition.includes("angina") || condition.includes("heart"))
  ) {
    return "Cardiologist";
  }

  if (symptoms.includes("skin rash") || conditionNames.some((condition) => condition.includes("eczema"))) {
    return "Dermatologist";
  }

  if (
    symptoms.some((symptom) => symptom.includes("anxiety") || symptom.includes("depression")) ||
    conditionNames.some((condition) => condition.includes("anxiety") || condition.includes("depression"))
  ) {
    return "Psychiatrist";
  }

  if (
    symptoms.some((symptom) => symptom.includes("cough") || symptom.includes("fever") || symptom.includes("breath")) ||
    conditionNames.some((condition) => condition.includes("asthma") || condition.includes("bronchitis"))
  ) {
    return "Pulmonologist";
  }

  if (symptoms.some((symptom) => symptom.includes("sore throat") || symptom.includes("headache"))) {
    return "ENT Specialist";
  }

  if (
    symptoms.some((symptom) => symptom.includes("abdominal") || symptom.includes("nausea") || symptom.includes("vomiting")) ||
    conditionNames.some((condition) => condition.includes("gastro") || condition.includes("ulcer"))
  ) {
    return "Gastroenterologist";
  }

  if (symptoms.some((symptom) => symptom.includes("joint") || symptom.includes("back"))) {
    return "Orthopedic Surgeon";
  }

  return "General Physician";
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

const getUserLocation = async (userId: string): Promise<UserLocation | null> => {
  const rows = await prisma.$queryRaw<UserLocation[]>`
    SELECT latitude, longitude
    FROM "user"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows[0] ?? null;
};

const findDoctors = async (recommendedDoctorType: string): Promise<DoctorRow[]> => {
  const searchTerm = `%${recommendedDoctorType.toLowerCase()}%`;
  const matchingDoctors = await prisma.$queryRaw<DoctorRow[]>`
    SELECT
      id,
      name,
      qualifications,
      "yearsOfExperience",
      "clinicName",
      "clinicAddress",
      "clinicCity",
      "clinicState",
      "clinicPincode",
      latitude,
      longitude,
      "consultationFee"
    FROM "Doctor"
    WHERE LOWER(qualifications) LIKE ${searchTerm}
    ORDER BY "yearsOfExperience" DESC, "consultationFee" ASC
    LIMIT 5
  `;

  if (matchingDoctors.length > 0) {
    return matchingDoctors;
  }

  return prisma.$queryRaw<DoctorRow[]>`
    SELECT
      id,
      name,
      qualifications,
      "yearsOfExperience",
      "clinicName",
      "clinicAddress",
      "clinicCity",
      "clinicState",
      "clinicPincode",
      latitude,
      longitude,
      "consultationFee"
    FROM "Doctor"
    ORDER BY "yearsOfExperience" DESC, "consultationFee" ASC
    LIMIT 5
  `;
};

const getRecommendedDoctors = async (
  symptoms: string[],
  conditions: PredictedCondition[],
  userId?: string,
): Promise<DoctorRecommendation[]> => {
  try {
    const recommendedDoctorType = getRecommendedDoctorType(symptoms, conditions);
    const [doctors, userLocation] = await Promise.all([
      findDoctors(recommendedDoctorType),
      userId ? getUserLocation(userId) : Promise.resolve(null),
    ]);

    return doctors
      .map((doctor) => {
        const distanceKm =
          userLocation?.latitude !== null &&
          userLocation?.latitude !== undefined &&
          userLocation?.longitude !== null &&
          userLocation?.longitude !== undefined
            ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, doctor.latitude, doctor.longitude)
            : null;

        const qualificationMatch = doctor.qualifications.toLowerCase().includes(recommendedDoctorType.toLowerCase());

        return {
          id: doctor.id,
          name: doctor.name,
          specialization: recommendedDoctorType,
          qualifications: doctor.qualifications,
          yearsOfExperience: doctor.yearsOfExperience,
          consultationFee: doctor.consultationFee,
          clinicName: doctor.clinicName,
          clinicAddress: doctor.clinicAddress,
          clinicCity: doctor.clinicCity,
          clinicState: doctor.clinicState,
          clinicPincode: doctor.clinicPincode,
          distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(1)),
          matchScore: qualificationMatch ? "100.0%" : "70.0%",
        };
      })
      .sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) {
          return b.yearsOfExperience - a.yearsOfExperience;
        }

        if (a.distanceKm === null) {
          return 1;
        }

        if (b.distanceKm === null) {
          return -1;
        }

        return a.distanceKm - b.distanceKm;
      });
  } catch (error) {
    console.error("Error getting recommended doctors:", error);
    return [];
  }
};

const validateSymptoms = (symptoms: string[]): boolean => {
  return symptoms.some((symptom) => Boolean(symptomConditionMap[symptom]));
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

    if (!validateSymptoms(symptoms)) {
      const errorResponse: ErrorResponse = {
        message: "One or more symptoms not found in database. Please check your input.",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const conditions = matchSymptomToConditions(symptoms);
    const topCondition = conditions[0];

    if (conditions.length === 0) {
      const errorResponse: ErrorResponse = {
        message: "No conditions found for the given symptoms",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const aiExplanation = await createAiExplanation(symptoms, age, gender, duration, severity, conditions);
    const urgencyLevel = calculateUrgency(severity, topCondition?.probability) as UrgencyLevel;
    const recommendedDoctorsList = await getRecommendedDoctors(symptoms, conditions, userId);
    const recommendedDoctor =
      recommendedDoctorsList[0]?.name || getRecommendedDoctorType(symptoms, conditions) || "General Physician";
    const predictedDiseaseJson: Prisma.InputJsonArray = conditions.map(({ condition, probability }) => ({
      condition,
      probability,
    }));

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
    const symptoms = toSymptomList(session.symptoms);
    const doctorsList = await getRecommendedDoctors(symptoms, conditions, userId);

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
