import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../../../generated/prisma/client.js";
import { GoogleGenAI } from "@google/genai";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
import { Symptominput, Symptomoutput, ErrorResponse, UrgencyLevel, Gender, Severity, PredictedCondition } from "./symptom.type";
import { calculateUrgency } from "./utils/riskcalculater";
import { symptomConditionMap } from "./symptom.data";

// Function to find matching conditions from symptoms
const matchSymptomToConditions = (symptoms: string[]): PredictedCondition[] => {
  const conditionScores: Record<string, number> = {};

  for (const symptom of symptoms) {
    const matches = symptomConditionMap[symptom] || [];
    for (const match of matches) {
      conditionScores[match.condition] = (conditionScores[match.condition] || 0) + match.probability;
    }
  }

  // Convert to array and sort by probability
  return Object.entries(conditionScores)
    .map(([condition, probability]) => ({
      condition,
      probability: Math.min(probability / symptoms.length, 0.95), // Normalize
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5); // Top 5 conditions
};

// Helper function to determine recommended doctor
const getRecommendedDoctor = (symptoms: string[]): string => {
  if (symptoms.some(s => s.includes("chest") || s.includes("heart"))) {
    return "Cardiologist";
  }
  if (symptoms.includes("skin rash")) {
    return "Dermatologist";
  }
  if (symptoms.some(s => s.includes("anxiety") || s.includes("depression"))) {
    return "Psychiatrist";
  }
  if (symptoms.some(s => s.includes("cough") || s.includes("fever") || s.includes("shortness of breath"))) {
    return "Pulmonologist";
  }
  if (symptoms.some(s => s.includes("sore throat") || s.includes("headache"))) {
    return "ENT Specialist";
  }
  if (symptoms.some(s => s.includes("abdominal pain") || s.includes("nausea") || s.includes("vomiting"))) {
    return "Gastroenterologist";
  }
  if (symptoms.some(s => s.includes("joint pain") || s.includes("back pain"))) {
    return "Orthopedic Surgeon";
  }
  return "General Physician";
};

export const Symptomanalyze = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Symptominput;
    const userId = (req as Request & { user?: { id: string } }).user?.id;

    // Validate required fields
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

    // Normalize and process input
    const symptoms = data.symptoms.map(symptom => symptom.toLowerCase().trim());
    const age = Number(data.age);
    const gender = data.gender as Gender;
    const duration = data.duration || "Unknown";
    const severity = (data.severity || Severity.MILD) as Severity;

    // Step 1 — Match symptoms to conditions using local database
    const conditions = matchSymptomToConditions(symptoms);
    const topCondition = conditions?.[0];

    // Step 2 — Generate AI explanation using Google Gen AI
    const aiPrompt = `Write a short patient-facing medical guidance note.

Symptoms: ${symptoms.join(", ")}
Patient Age: ${age}
Patient Gender: ${gender}
Symptom Duration: ${duration}
Severity Level: ${severity}

Possible conditions: ${JSON.stringify(conditions)}

Return the final guidance only. Do not describe what you will write. Do not write placeholders.
Use this exact structure:

Educational note: This is not a diagnosis.

Possible causes:
- ...

Precautions:
- ...

Home care:
- ...

See a doctor urgently if:
- ...

Avoid:
- ...

Keep it practical, concise, and specific to the symptoms.`;

    let aiExplanation = "Unable to generate AI explanation at this moment.";

    try {
      const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const ai = new GoogleGenAI(googleApiKey ? { apiKey: googleApiKey } : {});
      const aiResponse = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: aiPrompt,
        config: {
          maxOutputTokens: 900,
          temperature: 0.4,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });

      aiExplanation = aiResponse.text?.trim() || aiExplanation;
    } catch (aiError) {
      console.error("Google Gen AI Error:", aiError);
      // Continue with default explanation if AI API fails
    }

    // Step 3 — Calculate urgency level
    const urgencyLevel = calculateUrgency(severity, topCondition?.probability) as UrgencyLevel;

    // Step 4 — Get recommended doctor
    const recommendedDoctor = getRecommendedDoctor(symptoms);
    const predictedDiseaseJson: Prisma.InputJsonArray = conditions.map(({ condition, probability }) => ({
      condition,
      probability,
    }));

    // Step 5 — Save analysis history to database
    const session = await prisma.symptomSession.create({
      data: {
        userId: userId || "anonymous",
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

    // Step 6 — Return success response
    const payload: Symptomoutput = {
      message: "Symptoms analyzed successfully",
      success: true,
      urgencyLevel,
      recommendedDoctor,
      predictedDisease: conditions,
      aiExplanation,
      session: session as any,
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
