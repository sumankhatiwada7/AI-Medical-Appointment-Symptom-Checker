// Doctor Types and Interfaces

export enum AvailabilityDay {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
}

export type AvailabilitySchedule = Partial<Record<AvailabilityDay, TimeSlot[]>>;

// Doctor Registration Input
export interface DoctorRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  qualifications: string;
  licenseNumber: string;
  yearsOfExperience: number;
  specializations: string[]; // Array of specialization IDs or names
  
  latitude?: number;
  longitude?: number;
  consultationFee?: number;
  availableHours?: AvailabilitySchedule;
}

// Doctor Profile Response
export interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  qualifications: string;
  licenseNumber: string;
  yearsOfExperience: number;
  specializations: DoctorSpecializationDetail[];
  clinicName?: string;
  latitude?: number;
  longitude?: number;
  consultationFee?: number;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: Date;
}

export interface DoctorSpecializationDetail {
  id: string;
  name: string;
  isPrimary: boolean;
  description?: string;
}

// Doctor Search/Filter Options
export interface DoctorSearchFilter {
  specialization?: string;
  city?: string;
  minRating?: number;
  maxConsultationFee?: number;
  isAvailable?: boolean;
  yearsOfExperience?: {
    min?: number;
    max?: number;
  };
  page?: number;
  limit?: number;
}

// Doctor Search Result
export interface DoctorSearchResult {
  id: string;
  name: string;
  qualifications: string;
  specializations: string[];
  primarySpecialization: string;
  averageRating: number;
  totalReviews: number;
  consultationFee?: number;
  clinicCity?: string;
  distance?: number;
  yearsOfExperience: number;
  isAvailable: boolean;
}

// Recommended Doctor Response
export interface RecommendedDoctorResponse {
  id: string;
  name: string;
  qualifications: string;
  specializations: string[];
  primarySpecialization: string;
  consultationFee?: number;
  phone?: string;
  email: string;
  averageRating: number;
  totalReviews: number;
  yearsOfExperience: number;
  matchScore: number; // Relevance score based on specialization (0-1)
  distance?: number; // Distance from user location
  availableHours?: AvailabilitySchedule;
}

// Doctor Review Input
export interface DoctorReviewInput {
  doctorId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
}

// Doctor Review Response
export interface DoctorReviewResponse {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  createdAt: Date;
}

// Doctor Authentication Input
export interface DoctorLoginInput {
  email: string;
  password: string;
}

// Doctor Authentication Response
export interface DoctorAuthResponse {
  message: string;
  success: boolean;
  token?: string;
  doctor?: DoctorProfile;
}

// API Response for doctor operations
export interface DoctorApiResponse<T> {
  message: string;
  success: boolean;
  data?: T;
  error?: string;
}