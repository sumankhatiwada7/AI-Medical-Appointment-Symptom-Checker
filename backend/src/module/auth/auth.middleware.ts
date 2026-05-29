import type { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { apiresponse } from "../../core/types/api.type";
import { prisma } from "../../core/prisma";
dotenv.config();



export interface AuthRequest extends Request
{
user?:{
   id: string;
    email: string;
    role: string;
};
}
export const authMiddleware = async (req:AuthRequest,res:Response,next:NextFunction):Promise<void>=>{
    try{
      const authHeader = req.headers.authorization?.split(' ')[1];
      if(!authHeader){
        const payload:apiresponse={
          message:"no token provided",
          success:false
        };
        res.status(401).json(payload);
        return;
      }
      const secret = process.env.JWT_SECRET as string;
      const decoded = jwt.verify(authHeader,secret) as {id:string,email:string,role:string};
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        const payload: apiresponse = {
          message: "Invalid or expired token",
          success: false,
        };
        res.status(401).json(payload);
        return;
      }

      req.user={
        id: user.id,
        email: user.email,
        role: user.role,
      };
      next();
    }
    catch(error){
      if (error instanceof Error && ["JsonWebTokenError", "TokenExpiredError"].includes(error.name)) {
        const payload: apiresponse = {
          message: "Invalid or expired token",
          success: false,
        };
        res.status(401).json(payload);
        return;
      }

      const payload:apiresponse={
        message:"SERVER ERROR",
        success:false
    }
    res.status(500).json(payload);
}
}

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
    const payload: apiresponse = {
        message: "Unauthorized",
        success: false
    }
      res.status(401).json(payload);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
        const payload: apiresponse = {
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
            success: false
        };
        res.status(403).json(payload);
        return;
    }

    next();
  };
};
