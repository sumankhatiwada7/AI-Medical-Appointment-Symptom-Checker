import { GoogleGenAI } from "@google/genai";
import { Gender, PredictedCondition, Severity } from "../symptom.type";

const fallbackExplanation = "Unable to generate AI explanation at this moment.";

const getGeminiApiKey = (): string | undefined => {
	return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
};

const getGeminiModel = (): string => {
	return process.env.GEMINI_MODEL || process.env.GOOGLE_GEMINI_MODEL || "gemini-2.0-flash";
};

const buildSymptomPrompt = (
	symptoms: string[],
	age: number,
	gender: Gender,
	duration: string,
	severity: Severity,
	conditions: PredictedCondition[],
): string => {
	return `You are a medical assistant AI.

Symptoms: ${symptoms.join(", ")}
Patient Age: ${age}
Patient Gender: ${gender}
Symptom Duration: ${duration}
Severity Level: ${severity}

Possible conditions: ${JSON.stringify(conditions)}

Please provide:
- Possible causes of these symptoms
- Recommended precautions
- Home care tips
- When to visit a doctor urgently
- Suggested foods/activities to avoid

IMPORTANT: Do NOT provide a definitive diagnosis. This is educational information only.
Keep the explanation concise and helpful.`;
};

export const createAiExplanation = async (
	symptoms: string[],
	age: number,
	gender: Gender,
	duration: string,
	severity: Severity,
	conditions: PredictedCondition[],
): Promise<string> => {
	const apiKey = getGeminiApiKey();

	if (!apiKey) {
		return fallbackExplanation;
	}

	try {
		const ai = new GoogleGenAI({ apiKey });
		const response = await ai.models.generateContent({
			model: getGeminiModel(),
			contents: buildSymptomPrompt(symptoms, age, gender, duration, severity, conditions),
		});

		return response.text?.trim() || fallbackExplanation;
	} catch (error) {
		console.error("Gemini API Error:", error);
		return fallbackExplanation;
	}
};
