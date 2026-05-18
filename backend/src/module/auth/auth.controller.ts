import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import jwt, { type SignOptions } from "jsonwebtoken";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { Request, Response } from "express";
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
import type{ AuthResponse, LoginInput, RegisterInput } from "./auth.type.js";
import type { apiresponse } from "../../core/types/api.type.ts";
import type{ inputerror } from "../../core/types/inputerror.type.ts";
import type { validationerrorresponse } from "../../core/types/inputerror.type.ts";



function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}
function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}
function generateToken(userId: string): string {
    const payload = { id: userId};
    const secret = process.env.JWT_SECRET as string;
    const options: SignOptions = { expiresIn: "1h" };
    const token = jwt.sign(payload, secret, options);
    return token;
}
const Refresh_Cookie_Option={
    httpOnly:true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

function generateRefreshToken(userId: string): string {
    const payload = { id: userId };
    const secret = process.env.REFRESH_TOKEN_SECRET as string;
    const options: SignOptions = { expiresIn: "7d" };
    const token = jwt.sign(payload, secret, options);
    return token;
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try{
        const errors:inputerror[] = [];
         const data= req.body as RegisterInput;
         const name =data.name;
         if(!name || name.trim()===""){
            errors.push({message:"Name is required",field:"name"});
            }
        const emailregix=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const email=data.email;
        if(!email || email.trim()===""){
            errors.push({message:"Email is required",field:"email"});
        }
        else if(!emailregix.test(email)){
            errors.push({message:"Invalid email format",field:"email"});
        }
        const password=data.password;
        const passwordregix=/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if(!password || password.trim()===""){
            errors.push({message:"Password is required",field:"password"});
        }
        else if(!passwordregix.test(password)){
            errors.push({message:"Password must be at least 6 characters long and contain at least one letter and one number",field:"password"});
        }
        const role=data.role;
        if(!role || role.trim()===""){
            errors.push({message:"Role is required",field:"role"});

        }
        else if(!["PATIENT","DOCTOR","ADMIN"].includes(role)){
            errors.push({message:"Role must be either PATIENT, DOCTOR, or ADMIN",field:"role"});
        }
        const experience=data.experience;
        const specialization=data.specialization;
        if(errors.length>0){
            const payload:validationerrorresponse={
                message:"Validation errors",
                error: errors
            }
            res.status(400).json(payload);
            return;
        }
        const existingUser = await prisma.user.findUnique({where:{email}});
        if(existingUser){
            const payload:apiresponse={
                message:"user already exists with this email",
                success:false
            }
            res.status(400).json(payload);
            return;
        }
        const hashedPassword = await hashPassword(password);
        const newuser= await prisma.user.create({
            data:{
                name,
                email,
                password:hashedPassword,
                role,
                ...(experience !== undefined ? { experience } : {}),
                ...(specialization !== undefined ? { specialization } : {})
            }
        })
        const payload:AuthResponse={
            message:"User registered successfully",
            success:true,
            user:newuser
        }
        res.status(201).json(payload);
    }

    catch(error){
        const payload:apiresponse={
            message:"Internal server error",
            success:false
        }
        res.status(500).json(payload);
    }
}


export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors:inputerror[] = [];
        const data = req.body as LoginInput;
        const emailregix=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!data.email || data.email.trim()===""){
            errors.push({message:"Email is required",field:"email"});

        }
        else if(!emailregix.test(data.email)){
            errors.push({message:"Invalid email format",field:"email"});
        }
        const password=data.password;
        if(!password || password.trim()===""){
            errors.push({message:"Password is required",field:"password"});
        }
        if(errors.length>0){
            const payload:validationerrorresponse={
                message:"Validation errors",
                error: errors
            };
            res.status(400).json(payload);
            return;
        }
        const existingUser = await prisma.user.findUnique({where:{email:data.email}});
        if(!existingUser){
            const payload:apiresponse={
                message:"Registered user not found with this email",
                success:false
            }
            res.status(404).json(payload);
            return;
        }
    
        const passwordMatch = await comparePassword(password,existingUser.password);
        if(!passwordMatch){
            const payload:apiresponse={
                message:"Invalid email or password",
                success:false
            }
            res.status(401).json(payload);
            return;
        }
        const accesstoken= await generateToken(existingUser.id,);
        const refreshtoken= await generateRefreshToken(existingUser.id,);
        const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: { refreshToken: refreshtoken },
        });
        res.cookie("refreshToken",refreshtoken,Refresh_Cookie_Option);
        const payload:AuthResponse={
            message:"Login successful",
            success:true,
            token:accesstoken,
            user:updatedUser
        }
        res.status(200).json(payload);

        
    } catch (error) {
        const payload:apiresponse={
            message:"Internal server error",
            success:false
        }
        res.status(500).json(payload);
    }
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try{
      const refreshToken=req.cookies?.refreshToken||req.body?.refreshToken;
        if(!refreshToken){
            const payload:apiresponse={
                message:"Refresh token not provided",
                success:false

            }
            res.status(400).json(payload);
            return;
        }
        const secret = process.env.REFRESH_TOKEN_SECRET as string;
        if(!secret){
            const payload:apiresponse={
                message:"Jwt refresh is not configured",
                success:false
            };
            res.status(400).json(payload);
            return;
        }
        const decoded= jwt.verify(refreshToken,secret) as {id:string};
        const user= await prisma.user.findUnique({where:{id:decoded.id}});
        if(!user || user.refreshToken!==refreshToken){
            const payload:apiresponse={
                message:"Invalid refresh token",
                success:false

            }
            res.status(401).json(payload);
            return;
        }
        const newAccessToken=generateToken(user.id);
        const newRefreshToken=generateRefreshToken(user.id);
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });
        res.cookie("refreshToken",newRefreshToken,Refresh_Cookie_Option);
        const payload:AuthResponse={
            message:"Token refreshed successfully",
            success:true,
            token:newAccessToken,
            user:updatedUser
        };
        res.status(200).json(payload);
    }
    catch(error){
        const payload:apiresponse={
            message:"Internal server error",
            success:false
        };
        res.status(500).json(payload);
    }
}
