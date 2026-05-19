import {z} from 'zod';


export const createSymptomSchema = z.object({
    symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
    age:z.number().int().positive('Age must be a positive integer').min(1).max(120),
    gender:z.enum(['male','female']),
    duration: z.string().optional(),
    severity:z.enum(['mild','moderate','severe']).optional(),
})