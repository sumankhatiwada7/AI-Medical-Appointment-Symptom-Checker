import  bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../core/prisma';

export async function createadmin(){
    try{
   const email =process.env.ADMIN_EMAIL;
   const password =process.env.ADMIN_PASSWORD;
   const adminname=process.env.ADMIN_NAME;
    if(!email || !password || !adminname){
        throw new Error('Admin credentials are not set in environment variables');
    }
    const normalizedEmail = String(email).trim();
    const existingadmin = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if(existingadmin){
        const update: Prisma.UserUpdateInput = {};
        if(existingadmin.role!=="ADMIN"){
            update.role = 'ADMIN';
        }
        if(Object.keys(update).length>0){
            await prisma.user.update({
                where: { email: normalizedEmail },
                data: update
            });
        }
        else{
            console.log('Admin user already exists with correct role');
        }
    }

    const hashpassword= await bcrypt.hash(password,10);
    await prisma.user.create({
        data:
        {
            email:normalizedEmail,
            password:hashpassword,
            name:adminname,
            role:"ADMIN"
        }

    })
    console.log('Admin created successfully');
    }
    catch(err){
        console.error('Error creating admin user:', err);
    }
}

