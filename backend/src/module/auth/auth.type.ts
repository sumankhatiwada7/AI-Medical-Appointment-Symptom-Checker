export interface usertype{
    id: string;
    email: string;
    name: string;
    password: string;
    role: Role;
    latitude?: number | null;
    longitude?: number | null;
    refreshToken?: string | null;
}
export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export interface RegisterInput {
    email: string;
    name: string;
    password: string;
    role: Role;
    latitude?: number;
    longitude?: number;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface AuthResponse {
    message: string;
    success: boolean;
    token?: string;
    user:Omit<usertype, "password">;
}

