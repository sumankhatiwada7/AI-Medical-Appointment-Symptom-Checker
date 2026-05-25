import { NotificationBase } from "../../core/notification/notification.base";
 
import nodemailer  from 'nodemailer';



export class EmailNotification extends NotificationBase{
    subject:string;

    constructor(receipent:string,message:string,subject:string){
        super(receipent,message);
        this.subject=subject;
    }
    async send():Promise<void>{
        const transporter =nodemailer.createTransport({
            service:'gmail',
            auth:{
                user:process.env.EMAIL_USER,
                pass:process.env.EMAIL_PASS
            }
        });
        await transporter.sendMail({
            from:`"hamrosewa"<${process.env.EMAIL_USER}>`,
            to:this.receipent,
            subject:this.subject,
            text:this.message
        })
    }

}