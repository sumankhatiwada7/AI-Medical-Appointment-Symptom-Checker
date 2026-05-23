import type { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { apiresponse } from "../../core/types/api.type";
dotenv.config();



export interface AuthRequest extends Request
{
user?:{
   id: string;
    email: string;
    role: string;
};
}
export const authMiddleware = (req:AuthRequest,res:Response,next:NextFunction):void=>{
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
      req.user=decoded;
      next();
    }
    catch(error){
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
