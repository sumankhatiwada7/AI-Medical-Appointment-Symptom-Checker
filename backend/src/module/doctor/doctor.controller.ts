import "dotenv/config";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../core/prisma";
import { uploadToCloudinary } from "../../core/cloudinary";
import { DoctorRegistrationInput, DoctorApiResponse, DoctorProfile, DoctorSpecializationDetail, RecommendedDoctorResponse } from "./doctor.type";
import { PredictedCondition } from "../symptom/symptom.type";

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
    const dataFromBody = req.body as Partial<DoctorRegistrationInput>;
    const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
    const profileImageFile = files?.profileImage?.[0];
    const validationDocumentFile = files?.validationDocument?.[0];

    const latitude = typeof dataFromBody.latitude === "string" ? parseFloat(dataFromBody.latitude) : dataFromBody.latitude;
    const longitude = typeof dataFromBody.longitude === "string" ? parseFloat(dataFromBody.longitude) : dataFromBody.longitude;
    const consultationFee = typeof dataFromBody.consultationFee === "string" ? parseFloat(dataFromBody.consultationFee) : dataFromBody.consultationFee;
    const yearsOfExperience = typeof dataFromBody.yearsOfExperience === "string" ? parseInt(dataFromBody.yearsOfExperience, 10) : dataFromBody.yearsOfExperience;
    const rawSpecializations = dataFromBody.specializations as string | string[] | undefined;
    const specializations = Array.isArray(rawSpecializations)
      ? rawSpecializations.map((spec) => spec.trim()).filter(Boolean)
      : typeof rawSpecializations === "string"
      ? rawSpecializations.split(",").map((spec) => spec.trim()).filter(Boolean)
      : [];

    // Validation
    if (
      !dataFromBody.firstName ||
      !dataFromBody.lastName ||
      !dataFromBody.email ||
      !dataFromBody.password ||
      !dataFromBody.confirmPassword ||
      !dataFromBody.licenseNumber ||
      !dataFromBody.phone ||
      !yearsOfExperience ||
      specializations.length === 0 ||
      latitude === undefined ||
      longitude === undefined ||
      consultationFee === undefined
    ) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Missing required fields",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (dataFromBody.password !== dataFromBody.confirmPassword) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Passwords do not match",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!profileImageFile || !validationDocumentFile) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Profile image and validation document are required",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedDocumentTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedImageTypes.includes(profileImageFile.mimetype)) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Profile image must be a valid image file",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!allowedDocumentTypes.includes(validationDocumentFile.mimetype)) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Validation document must be a PDF or image file",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Check if email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: dataFromBody.email },
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
      where: { licenseNumber: dataFromBody.licenseNumber },
    });

    if (existingLicense) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "License number already registered",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const profileUpload = await uploadToCloudinary(profileImageFile.buffer, "doctor_profiles", "image");
    const validationUpload = await uploadToCloudinary(validationDocumentFile.buffer, "doctor_validation_documents", "auto");

    // Hash password
    const hashedPassword = await bcrypt.hash(dataFromBody.password, 10);

    // Create doctor
    const doctor = await prisma.doctor.create({
      data: {
        firstName: dataFromBody.firstName,
        lastName: dataFromBody.lastName,
        email: dataFromBody.email,
        phone: dataFromBody.phone,
        password: hashedPassword,
        qualifications: dataFromBody.qualifications ?? "",
        licenseNumber: dataFromBody.licenseNumber,
        yearsOfExperience: yearsOfExperience,
        clinicName: dataFromBody.clinicName ?? null,
        clinicAddress: dataFromBody.clinicAddress ?? null,
        clinicCity: dataFromBody.clinicCity ?? null,
        clinicState: dataFromBody.clinicState ?? null,
        clinicPincode: dataFromBody.clinicPincode ?? null,
        latitude: latitude,
        longitude: longitude,
        consultationFee: consultationFee,
        profileImageUrl: profileUpload.secure_url,
        validationDocumentUrl: validationUpload.secure_url,
      },
    });

    // Link specializations
    if (specializations.length > 0) {
      for (let i = 0; i < specializations.length; i++) {
        const spec = specializations[i];
        if (!spec) continue;

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
              isPrimary: i === 0,
            },
          });
        }
      }
    }

    const profile: DoctorProfile = {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      qualifications: doctor.qualifications,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      specializations: [] as DoctorSpecializationDetail[],
      averageRating: doctor.averageRating,
      totalReviews: doctor.totalReviews,
      isAvailable: doctor.isAvailable,
      createdAt: doctor.createdAt,
    };

    if (doctor.profileImageUrl) {
      profile.profileImageUrl = doctor.profileImageUrl;
    }
    if (doctor.validationDocumentUrl) {
      profile.validationDocumentUrl = doctor.validationDocumentUrl;
    }

    if (doctor.phone) {
      profile.phone = doctor.phone;
    }
    if (doctor.clinicName) {
      profile.clinicName = doctor.clinicName;
    }
    if (doctor.clinicAddress) {
      profile.clinicAddress = doctor.clinicAddress;
    }
    if (doctor.clinicCity) {
      profile.clinicCity = doctor.clinicCity;
    }
    if (doctor.clinicState) {
      profile.clinicState = doctor.clinicState;
    }
    if (doctor.clinicPincode) {
      profile.clinicPincode = doctor.clinicPincode;
    }
    if (doctor.latitude !== null) {
      profile.latitude = doctor.latitude;
    }
    if (doctor.longitude !== null) {
      profile.longitude = doctor.longitude;
    }
    if (doctor.consultationFee !== null) {
      profile.consultationFee = doctor.consultationFee;
    }

    const successResponse: DoctorApiResponse<DoctorProfile> = {
      message: "Doctor registered successfully",
      success: true,
      data: profile,
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
    const doctorId = req.params.id;

    const doctorIdValue = typeof doctorId === "string" ? doctorId : String(doctorId);
    if (!doctorIdValue) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Doctor id is required",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorIdValue },
      include: {
        specializations: {
          include: {
            specialization: true,
          },
        },
        reviews: true,
      },
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
      doctor.reviews.length > 0
        ? doctor.reviews.reduce((sum, review) => sum + review.rating, 0) / doctor.reviews.length
        : 0;

    const profile: DoctorProfile = {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      ...(doctor.phone ? { phone: doctor.phone } : {}),
      qualifications: doctor.qualifications,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: doctor.yearsOfExperience,
      specializations: doctor.specializations.map((ds) => ({
        id: ds.specialization.id,
        name: ds.specialization.name,
        isPrimary: ds.isPrimary,
        ...(ds.specialization.description ? { description: ds.specialization.description } : {}),
      })),
      ...(doctor.clinicName ? { clinicName: doctor.clinicName } : {}),
      ...(doctor.clinicAddress ? { clinicAddress: doctor.clinicAddress } : {}),
      ...(doctor.clinicCity ? { clinicCity: doctor.clinicCity } : {}),
      ...(doctor.clinicState ? { clinicState: doctor.clinicState } : {}),
      ...(doctor.clinicPincode ? { clinicPincode: doctor.clinicPincode } : {}),
      ...(doctor.profileImageUrl ? { profileImageUrl: doctor.profileImageUrl } : {}),
      ...(doctor.validationDocumentUrl ? { validationDocumentUrl: doctor.validationDocumentUrl } : {}),
      ...(doctor.latitude !== null ? { latitude: doctor.latitude } : {}),
      ...(doctor.longitude !== null ? { longitude: doctor.longitude } : {}),
      ...(doctor.consultationFee !== null ? { consultationFee: doctor.consultationFee } : {}),
      averageRating: avgRating,
      totalReviews: doctor.reviews.length,
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
        condition: true,
      },
    });

    // Group by specialization and calculate match score
    const specializationScores: { [specId: string]: { specialization: any; score: number } } = {};

    for (const relation of specializationConditionRelations) {
      const specializationId = relation.specializationId;
      if (!specializationId) continue;

      const matchingCondition = conditions.find((c) => c.condition === relation.condition?.name);
      if (matchingCondition) {
        if (!specializationScores[specializationId]) {
          specializationScores[specializationId] = {
            specialization: relation.specialization,
            score: 0,
          };
        }
        specializationScores[specializationId].score += matchingCondition.probability * relation.relevanceScore;
      }
    }

    // Get doctors with these specializations
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
    });

    // Calculate match scores and distance
    const recommendedDoctors: RecommendedDoctorResponse[] = doctors
      .map((doctor) => {
        // Calculate match score
        let matchScore = 0;
        for (const ds of doctor.specializations) {
          const specScore = ds.specializationId ? specializationScores[ds.specializationId] : undefined;
          if (specScore) {
            matchScore += specScore.score * (ds.isPrimary ? 1.2 : 1);
          }
        }
        matchScore = Math.min(matchScore / doctor.specializations.length, 1); // Normalize to 0-1

        // Calculate distance if user location provided
        let distance: number | undefined;
        if (userLat && userLon && doctor.latitude && doctor.longitude) {
          distance = calculateDistance(userLat, userLon, doctor.latitude, doctor.longitude);
        }

        // Calculate average rating
        const avgRating =
          doctor.reviews.length > 0
            ? doctor.reviews.reduce((sum, review) => sum + review.rating, 0) / doctor.reviews.length
            : 0;

        return {
          id: doctor.id,
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          qualifications: doctor.qualifications,
          specializations: doctor.specializations.map((ds) => ds.specialization.name),
          primarySpecialization: doctor.specializations.find((ds) => ds.isPrimary)?.specialization.name || "",
          ...(doctor.clinicName ? { clinicName: doctor.clinicName } : {}),
          ...(doctor.clinicAddress ? { clinicAddress: doctor.clinicAddress } : {}),
          ...(doctor.clinicCity ? { clinicCity: doctor.clinicCity } : {}),
          ...(doctor.consultationFee !== null ? { consultationFee: doctor.consultationFee } : {}),
          ...(doctor.phone ? { phone: doctor.phone } : {}),
          email: doctor.email,
          averageRating: avgRating,
          totalReviews: doctor.reviews.length,
          yearsOfExperience: doctor.yearsOfExperience,
          matchScore,
          ...(distance !== undefined ? { distance } : {}),
        };
      })
      .sort((a, b) => {
        // Sort by match score first, then by rating
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.averageRating - a.averageRating;
      })
      .slice(0, 10); // Return top 10 doctors

    // Save recommendations to database
    if (!sessionId || Array.isArray(sessionId)) {
      const errorResponse: DoctorApiResponse<null> = {
        message: "Session ID is required",
        success: false,
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (recommendedDoctors.length > 0) {
      for (const recommendedDoc of recommendedDoctors) {
        await prisma.recommendedDoctor.create({
          data: {
            sessionId,
            doctorId: recommendedDoc.id,
            symptoms: conditions.map((c) => c.condition),
            matchScore: recommendedDoc.matchScore,
            distance: recommendedDoc.distance ?? null,
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