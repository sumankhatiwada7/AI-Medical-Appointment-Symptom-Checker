// Enums for better type safety and clarity
export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export enum Severity {
  MILD = "mild",
  MODERATE = "moderate",
  SEVERE = "severe",
}

// Type for urgency levels
export enum UrgencyLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Interface for individual condition prediction
export interface PredictedCondition {
  condition: string;
  probability: number;
}

// Interface for symptom session stored in database
export interface SymptomSession {
  id: string;
  userId: string;
  symptoms: string[];
  age: number;
  gender: Gender;
  duration?: string;
  severity?: Severity;
  predictedDisease: PredictedCondition[];
  urgencyLevel: UrgencyLevel;
  aiExplanation: string;
  recommendedDoctor: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input validation interface
export interface Symptominput {
  symptoms: string[];
  age: number;
  gender: Gender | "male" | "female";
  duration?: string;
  severity?: Severity | "mild" | "moderate" | "severe";
}

// Output response interface
export interface Symptomoutput {
  message: string;
  success: boolean;
  urgencyLevel: UrgencyLevel;
  recommendedDoctor: string;
  predictedDisease: PredictedCondition[];
  aiExplanation: string;
  session: SymptomSession;
}

// API Error response interface
export interface ErrorResponse {
  message: string;
  success: false;
  error?: string;
}

// Generic API Response type
export type ApiResponse<T> = T | ErrorResponse;