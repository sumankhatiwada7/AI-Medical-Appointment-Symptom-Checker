import React from 'react'
import { useState } from 'react'
import { registerapi } from './apipath';


type feilderror={
    email?:string;
    name?:string;
    password?:string;
    role?:string;
}
type userrole="PATIENT" | "DOCTOR" | "ADMIN";

export const register = () => {

    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [role,setRole]=useState<userrole>("PATIENT");
    const [experience,setExperience]=useState<number>(0);
    const [specialization,setSpecialization]=useState("");
    const [errors,setErrors]=useState<feilderror>({});
    const [message,setMessage]=useState("");
    const handleSubmit=async (e:React.FormEvent)=>{
        e.preventDefault();
        setErrors({});
        const data: Record<string, any> = {name,email,password,role};
        if(role==="DOCTOR"){
            data.experience=experience;
            data.specialization=specialization;
        }
        try{
        const response = await fetch(registerapi, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const responseData = await response.json();
        if(responseData.success){
          setMessage(responseData.message);
        }
        }
        catch(error){
            console.log(error);
        }

        if (message){
            return(
                <div>
                    <p>{message}</p>
                    <button onClick={()=>{ window.location.href = "/login"; }}>Go to Login</button>
              </div>)
        }
    }
  return (
    <div>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
           <div>
            <input type="text" placeholder='Name' value={name} onChange={(e)=>setName(e.target.value)} />
           </div>
           <div>
            <input type="email" placeholder='Email' value={email} onChange={(e)=>setEmail(e.target.value)} />
           </div>
           <div>
            <input type="password" placeholder='Password' value={password} onChange={(e)=>setPassword(e.target.value)} />
           </div>
           <div>
            <select value={role} onChange={(e)=>setRole(e.target.value as userrole)}>
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="ADMIN">Admin</option>
            </select>
           </div>
           {role==="DOCTOR" && (
             <>
               <div>
                <input type="number" placeholder='Experience' value={experience} onChange={(e)=>setExperience(Number(e.target.value))} />
               </div>
               <div>
                <input type="text" placeholder='Specialization' value={specialization} onChange={(e)=>setSpecialization(e.target.value)} />
               </div>
             </>
           )}
           <button type="submit">Register</button>
        </form>
    </div>
  )
}
export default register;
