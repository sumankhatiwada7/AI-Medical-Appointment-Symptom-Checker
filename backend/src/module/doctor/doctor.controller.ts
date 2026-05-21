import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.js";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
import bcrypt from "bcryptjs";
import { DoctorRegistrationInput, DoctorApiResponse, DoctorProfile, RecommendedDoctorResponse } from "./doctor.type";
import {PredictedCondition} from "../symptom/symptom.type";
// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Doctor Registration Controller
export const registerDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as DoctorRegistrationInput;

    // Validation
    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Missing required fields",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (data.password !== data.confirmPassword) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Passwords do not match",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Check if email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: data.email },
    });

    if (existingDoctor) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Email already registered",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Check if license number already exists
    const existingLicense = await prisma.doctor.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingLicense) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "License number already registered",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: ({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        qualifications: data.qualifications,
        licenseNumber: data.licenseNumber,
        yearsOfExperience: data.yearsOfExperience,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
        consultationFee: data.consultationFee ?? 0,
      } as any),
    });

    // Link specializations
    if (data.specializations && data.specializations.length > 0) {
      for (let i = 0; i < data.specializations.length; i++) {
        const spec = data.specializations[i];

        // Find specialization by name or ID
        const specialization = await prisma.specialization.findFirst({
          where: {
            OR: [{ id: spec }, { name: spec }],
          },
        });

        if (specialization) {
          await prisma.doctorSpecialization.create({
            data: {
              doctorId: doctor.id,
              specializationId: specialization.id,
              isPrimary: i === 0, // First one is primary
            },
          });
        }
      }
    }

    const successResponse: DoctorApiResponse<DoctorProfile> = {
      message: "Doctor registered successfully",
      success: true,
      data: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone || undefined,
        qualifications: doctor.qualifications,
        licenseNumber: doctor.licenseNumber,
        yearsOfExperience: doctor.yearsOfExperience,
        specializations: [],
        latitude: doctor.latitude || undefined,
        longitude: doctor.longitude || undefined,
        consultationFee: doctor.consultationFee || undefined,
        averageRating: doctor.averageRating,
        totalReviews: doctor.totalReviews,
        isAvailable: doctor.isAvailable,
        createdAt: doctor.createdAt,
      },
    };

    res.status(201).json(successResponse);
    return;
  } catch (error) {
    console.error("Error registering doctor:", error);
    const errorResponse: DoctorApiResponse<null> = {
      message: "Internal server error",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    res.status(500).json(errorResponse);
    return;
  }
};

// Get Doctor Profile
export const getDoctorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const doctorId = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!doctorId) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Invalid doctor id",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: ({
        doctorSpecializations: {
          include: {
            specialization: true,
          },
        },
        doctorReviews: true,
      } as unknown) as any,
    });

    if (!doctor) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Doctor not found",
        success: false,
      };
      res.status(404).json(errorResponse);
      return;
    }

    // Calculate average rating
    const avgRating =
      doctor.doctorReviews.length > 0
        ? doctor.doctorReviews.reduce((sum: any, review: { rating: any; }) => sum + review.rating, 0) / doctor.doctorReviews.length
        : 0;

    const profile: DoctorProfile = {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      phone: doctor.phone || undefined,
      qualifications: doctor.qualifications,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      specializations: doctor.doctorSpecializations.map((ds: { specialization: { id: any; name: any; description: any; }; isPrimary: any; }) => ({
        id: ds.specialization.id,
        name: ds.specialization.name,
        isPrimary: ds.isPrimary,
        description: ds.specialization.description || undefined,
      })),
      latitude: doctor.latitude || undefined,
      longitude: doctor.longitude || undefined,
      consultationFee: doctor.consultationFee || undefined,
      averageRating: avgRating,
      totalReviews: doctor.doctorReviews.length,
      isAvailable: doctor.isAvailable,
      createdAt: doctor.createdAt,
    };

    const successResponse: DoctorApiResponse<DoctorProfile> = {
      message: "Doctor profile retrieved successfully",
      success: true,
      data: profile,
    };

    res.status(200).json(successResponse);
    return;
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    const errorResponse: DoctorApiResponse<null> = {
      message: "Internal server error",
      success: false,
    };
    res.status(500).json(errorResponse);
    return;
  }
};

// Recommend doctors based on symptoms
export const recommendDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conditions, userLat, userLon } = req.body as {
      conditions: PredictedCondition[];
      userLat?: number;
      userLon?: number;
    };
    const sessionId = req.params.sessionId;

    if (!conditions || conditions.length === 0) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Conditions array is required",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Find all relevant specializations for the conditions
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
      },
    });

    // Group by specialization and calculate match score
    const specializationScores: { [specId: string]: { specialization: any; score: number } } = {};

    for (const relation of specializationConditionRelations) {
      const matchingCondition = conditions.find((c) => c.condition === relation.condition.name);
      if (matchingCondition) {
        const key = String(relation.specializationId);
        if (!specializationScores[key]) {
          specializationScores[key] = {
            specialization: relation.specialization,
            score: 0,
          };
        }
        // now guaranteed defined
        specializationScores[key].score += matchingCondition.probability * relation.relevanceScore;
      }
    }

    // Get doctors with these specializations
    const specIds = Object.keys(specializationScores);
    const doctors = await prisma.doctor.findMany({
      where: ({
        AND: [
          {
            doctorSpecializations: {
              some: {
                specializationId: {
                  in: specIds,
                },
              },
            },
          },
        ],
      } as any),
      include: ({
        doctorSpecializations: {
          include: {
            specialization: true,
          },
        },
        doctorReviews: true,
      } as unknown) as any,
    });

    // Calculate match scores and distance
    const recommendedDoctors: RecommendedDoctorResponse[] = doctors
      .map((doctor: { doctorSpecializations: any[]; latitude: number; longitude: number; doctorReviews: any[]; id: any; firstName: any; lastName: any; qualifications: any; clinicName: any; clinicAddress: any; clinicCity: any; consultationFee: any; phone: any; email: any; yearsOfExperience: any; }) => {
        // Calculate match score
        let matchScore = 0;
        for (const ds of doctor.doctorSpecializations) {
          const specializationScore = specializationScores[ds.specializationId];
          if (specializationScore) {
            matchScore += specializationScore.score * (ds.isPrimary ? 1.2 : 1);
          }
        }
        matchScore = Math.min(matchScore / doctor.doctorSpecializations.length, 1); // Normalize to 0-1

        // Calculate distance if user location provided
        let distance: number | undefined;
        if (userLat && userLon && doctor.latitude && doctor.longitude) {
          distance = calculateDistance(userLat, userLon, doctor.latitude, doctor.longitude);
        }

        // Calculate average rating
        const avgRating =
          doctor.doctorReviews.length > 0
            ? doctor.doctorReviews.reduce((sum, review) => sum + review.rating, 0) / doctor.doctorReviews.length
            : 0;

        return {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          qualifications: doctor.qualifications,
          specializations: doctor.doctorSpecializations.map((ds: any) => ds.specialization.name),
          primarySpecialization: doctor.doctorSpecializations.find((ds: any) => ds.isPrimary)?.specialization.name || "",
          consultationFee: doctor.consultationFee || undefined,
          phone: doctor.phone || undefined,
          email: doctor.email,
          averageRating: avgRating,
          totalReviews: doctor.doctorReviews.length,
          yearsOfExperience: doctor.yearsOfExperience,
          matchScore,
          distance,
        };
      })
      .sort((a: { matchScore: number; averageRating: number; }, b: { matchScore: number; averageRating: number; }) => {
        // Sort by match score first, then by rating
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.averageRating - a.averageRating;
      })
      .slice(0, 10); // Return top 10 doctors

    // Save recommendations to database
    if (recommendedDoctors.length > 0) {
      for (const recommendedDoc of recommendedDoctors) {
        await prisma.recommendedDoctor.create({
          data: {
            sessionId,
            doctorId: recommendedDoc.id,
            symptoms: conditions.map((c) => c.condition),
            matchScore: recommendedDoc.matchScore,
            distance: recommendedDoc.distance,
          },
        });
      }
    }

    const successResponse: DoctorApiResponse<RecommendedDoctorResponse[]> = {
      message: "Doctors recommended successfully",
      success: true,
      data: recommendedDoctors,
    };

    res.status(200).json(successResponse);
    return;
  } catch (error) {
    console.error("Error recommending doctors:", error);
    const errorResponse: DoctorApiResponse<null> = {
      message: "Internal server error",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    res.status(500).json(errorResponse);
    return;
  }
};