import { apiresponse } from "../../core/types/api.type";

import { EmailNotification } from "../emailnotification/email.notification";
import {template} from "../../core/notification/template"
import { Notifier } from "../../core/notification/notifier";
import { prisma } from "../../core/prisma";
import { DoctorApiResponse } from "../doctor/doctor.type";
import { send } from "process";

export async function getpendingdoctors( req:any, res:any ):Promise<void>{

    try{
        const pendingdoctors= await prisma.doctor.findMany({
            where: {
                status: "PENDING"
            } as any
            
        })
        const payload: DoctorApiResponse<typeof pendingdoctors>={
            message: "Pending doctors retrieved successfully",
            success: true,
            data:pendingdoctors,  
        }
        res.status(200).json(payload);
        return ;
        }
      
        catch(error){
            const payload: apiresponse={
                message:"Internal server error",
                success:false
            }
            res.status(500).json(payload);
        }
    }


export async  function approvedoctor(req:any,res:any):Promise<void>{
    try{
         const id = req.params.id;
         const approveddoctor = await prisma.doctor.findUnique({
            where: { id },
    });
    if(!approveddoctor){
        const payload:apiresponse={
            message :"Doctor not found",
            success:false
        }
        res.status(404).json(payload)
       return 
    }
    if((approveddoctor as any).status !== "PENDING"){
        const payload:apiresponse={
            message :"Doctor is already accepted",
            success:false
        }
        res.status(400).json(payload)
        return
    }
    await prisma.doctor.update({
        where: { id },
        data: { status: "APPROVED" } as any,
    });
        const t = template.approveDoctor(approveddoctor.firstName, approveddoctor.email);
        await new Notifier(new EmailNotification(approveddoctor.email, t.subject, t.html)).send();
    const payload:apiresponse={
        message:"Doctor approve succesfully",
        success:true
    }
    res.status(200).json(payload);
    return;
}
    catch(error){
          const payload: apiresponse={
            message:"Internal server error",
            success:false
          };
          res.status(500).json(payload);
    }
}
export async function rejectdoctor(req:any,res:any):Promise<void>{
    try{
      const id = req.params.id;
      const rejectdoctor= await prisma.doctor.findUnique({
        where:{id},
      });
      if(!rejectdoctor){
        const payload:apiresponse={
            message:"Doctor not found",
            success:false
        }
        res.status(404).json(payload);
        return;
      }
    if((rejectdoctor as any)!== "REJECTED"){
        const payload:apiresponse={
            message:"Doctor is already rejected",
            success:false
        }
        res.status(400).json(payload);
        return;
    }
    await prisma.doctor.update({

        where:{id},
        data:{status:"REJECTED"} as any,
        
    });
    const t = template.rejectDoctor(rejectdoctor.firstName, rejectdoctor.email);
    await new Notifier(new EmailNotification(rejectdoctor.email,t.subject,t.html))
    .send();

    const payload:apiresponse={
        message:"Doctor rejected successfully",
        success:true,
    }
    res.status(200).json(payload);
    return ;
}
    catch(error){
        const payload:apiresponse={
            message:"Server Error",
            success:false
        }
        res.status(500).json(payload);
        return ;
    }
}
    