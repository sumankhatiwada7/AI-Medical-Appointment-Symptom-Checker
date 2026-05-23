// This file should be at: prisma/seed.ts
// Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Symptom to Condition mapping data
const symptomConditionData = [
  {
    symptom: "chest pain",
    conditions: [
      { name: "Angina", probability: 0.45 },
      { name: "Heartburn", probability: 0.35 },
      { name: "Muscle Strain", probability: 0.20 },
    ],
  },
  {
    symptom: "heart pain",
    conditions: [
      { name: "Angina", probability: 0.50 },
      { name: "Myocardial Infarction", probability: 0.30 },
      { name: "Pericarditis", probability: 0.20 },
    ],
  },
  {
    symptom: "headache",
    conditions: [
      { name: "Migraine", probability: 0.35 },
      { name: "Tension Headache", probability: 0.40 },
      { name: "Sinusitis", probability: 0.25 },
    ],
  },
  {
    symptom: "fever",
    conditions: [
      { name: "Common Cold", probability: 0.40 },
      { name: "Flu", probability: 0.35 },
      { name: "Infection", probability: 0.25 },
    ],
  },
  {
    symptom: "cough",
    conditions: [
      { name: "Common Cold", probability: 0.35 },
      { name: "Bronchitis", probability: 0.30 },
      { name: "Asthma", probability: 0.25 },
      { name: "Allergies", probability: 0.10 },
    ],
  },
  {
    symptom: "skin rash",
    conditions: [
      { name: "Dermatitis", probability: 0.35 },
      { name: "Eczema", probability: 0.30 },
      { name: "Psoriasis", probability: 0.20 },
      { name: "Allergic Reaction", probability: 0.15 },
    ],
  },
  {
    symptom: "anxiety",
    conditions: [
      { name: "Anxiety Disorder", probability: 0.60 },
      { name: "Panic Disorder", probability: 0.25 },
      { name: "Stress", probability: 0.15 },
    ],
  },
  {
    symptom: "sore throat",
    conditions: [
      { name: "Pharyngitis", probability: 0.45 },
      { name: "Tonsillitis", probability: 0.40 },
      { name: "Laryngitis", probability: 0.15 },
    ],
  },
  {
    symptom: "nausea",
    conditions: [
      { name: "Gastroenteritis", probability: 0.35 },
      { name: "Indigestion", probability: 0.40 },
      { name: "Migraine", probability: 0.15 },
      { name: "Food Poisoning", probability: 0.10 },
    ],
  },
  {
    symptom: "fatigue",
    conditions: [
      { name: "Anemia", probability: 0.30 },
      { name: "Thyroid Disorder", probability: 0.25 },
      { name: "Depression", probability: 0.25 },
      { name: "Sleep Disorder", probability: 0.20 },
    ],
  },
  {
    symptom: "dizziness",
    conditions: [
      { name: "Vertigo", probability: 0.35 },
      { name: "Low Blood Pressure", probability: 0.30 },
      { name: "Inner Ear Disorder", probability: 0.25 },
      { name: "Anxiety", probability: 0.10 },
    ],
  },
  {
    symptom: "back pain",
    conditions: [
      { name: "Muscle Strain", probability: 0.50 },
      { name: "Herniated Disc", probability: 0.30 },
      { name: "Arthritis", probability: 0.20 },
    ],
  },
  {
    symptom: "abdominal pain",
    conditions: [
      { name: "Gastroenteritis", probability: 0.40 },
      { name: "Appendicitis", probability: 0.30 },
      { name: "Ulcer", probability: 0.20 },
      { name: "IBS", probability: 0.10 },
    ],
  },
  {
    symptom: "vomiting",
    conditions: [
      { name: "Gastroenteritis", probability: 0.45 },
      { name: "Food Poisoning", probability: 0.35 },
      { name: "Migraine", probability: 0.15 },
      { name: "Pregnancy", probability: 0.05 },
    ],
  },
  {
    symptom: "diarrhea",
    conditions: [
      { name: "Gastroenteritis", probability: 0.50 },
      { name: "Food Poisoning", probability: 0.30 },
      { name: "IBS", probability: 0.15 },
      { name: "Allergy", probability: 0.05 },
    ],
  },
  {
    symptom: "shortness of breath",
    conditions: [
      { name: "Asthma", probability: 0.40 },
      { name: "Pneumonia", probability: 0.30 },
      { name: "Heart Disease", probability: 0.20 },
      { name: "Anxiety", probability: 0.10 },
    ],
  },
  {
    symptom: "sore muscles",
    conditions: [
      { name: "Muscle Strain", probability: 0.50 },
      { name: "Flu", probability: 0.35 },
      { name: "Fibromyalgia", probability: 0.15 },
    ],
  },
  {
    symptom: "joint pain",
    conditions: [
      { name: "Arthritis", probability: 0.50 },
      { name: "Injury", probability: 0.30 },
      { name: "Gout", probability: 0.20 },
    ],
  },
  {
    symptom: "loss of appetite",
    conditions: [
      { name: "Depression", probability: 0.35 },
      { name: "Gastroenteritis", probability: 0.30 },
      { name: "Thyroid Disorder", probability: 0.20 },
      { name: "Infection", probability: 0.15 },
    ],
  },
  {
    symptom: "constipation",
    conditions: [
      { name: "IBS", probability: 0.40 },
      { name: "Dehydration", probability: 0.35 },
      { name: "Medication Side Effect", probability: 0.25 },
    ],
  },
  {
    symptom: "insomnia",
    conditions: [
      { name: "Sleep Disorder", probability: 0.50 },
      { name: "Anxiety", probability: 0.30 },
      { name: "Depression", probability: 0.20 },
    ],
  },
  {
    symptom: "depression",
    conditions: [
      { name: "Depression", probability: 0.70 },
      { name: "Bipolar Disorder", probability: 0.20 },
      { name: "Thyroid Disorder", probability: 0.10 },
    ],
  },
  {
    symptom: "high blood pressure",
    conditions: [
      { name: "Hypertension", probability: 0.80 },
      { name: "Stress", probability: 0.15 },
      { name: "Kidney Disease", probability: 0.05 },
    ],
  },
  {
    symptom: "low blood pressure",
    conditions: [
      { name: "Hypotension", probability: 0.70 },
      { name: "Dehydration", probability: 0.20 },
      { name: "Anemia", probability: 0.10 },
    ],
  },
  {
    symptom: "blurred vision",
    conditions: [
      { name: "Eye Strain", probability: 0.40 },
      { name: "Diabetes", probability: 0.30 },
      { name: "Migraine", probability: 0.20 },
      { name: "Hypertension", probability: 0.10 },
    ],
  },
];

// Specializations
const specializations = [
  { name: "General Physician", description: "Primary healthcare provider" },
  { name: "Cardiologist", description: "Heart and cardiovascular specialist" },
  { name: "Dermatologist", description: "Skin specialist" },
  { name: "Psychiatrist", description: "Mental health specialist" },
  { name: "Pulmonologist", description: "Respiratory system specialist" },
  { name: "ENT Specialist", description: "Ear, Nose, and Throat specialist" },
  { name: "Gastroenterologist", description: "Digestive system specialist" },
  { name: "Orthopedic Surgeon", description: "Bone and joint specialist" },
  { name: "Ophthalmologist", description: "Eye specialist" },
  { name: "Neurologist", description: "Nervous system specialist" },
];

// Map specializations to medical conditions
const specializationConditionMap: Record<string, string[]> = {
  "Cardiologist": ["Angina", "Myocardial Infarction", "Heart Disease", "Hypertension"],
  "Dermatologist": ["Dermatitis", "Eczema", "Psoriasis", "Allergic Reaction"],
  "Psychiatrist": ["Anxiety Disorder", "Panic Disorder", "Depression", "Bipolar Disorder"],
  "Pulmonologist": ["Asthma", "Bronchitis", "Pneumonia"],
  "ENT Specialist": ["Pharyngitis", "Tonsillitis", "Laryngitis", "Sinusitis"],
  "Gastroenterologist": ["Gastroenteritis", "Ulcer", "IBS", "Indigestion"],
  "Orthopedic Surgeon": ["Muscle Strain", "Herniated Disc", "Arthritis", "Gout"],
  "Ophthalmologist": ["Eye Strain", "Diabetes"],
  "General Physician": ["Common Cold", "Flu", "Infection", "Fever"],
  "Neurologist": ["Migraine", "Tension Headache", "Vertigo"],
};

// Sample doctors
const sampleDoctors = [
  {
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@medical.com",
    phone: "+977-9841234567",
    password: "doctor123",
    qualifications: "MD, MBBS",
    licenseNumber: "MED-KTM-001",
    yearsOfExperience: 12,
    specializations: ["General Physician"],
    latitude: 27.7172,
    longitude: 85.324,
    consultationFee: 500,
  },
  {
    firstName: "Priya",
    lastName: "Sharma",
    email: "priya.sharma@medical.com",
    phone: "+977-9841234568",
    password: "doctor123",
    qualifications: "MD, DM (Cardiology)",
    licenseNumber: "MED-KTM-002",
    yearsOfExperience: 15,
    specializations: ["Cardiologist"],
    latitude: 27.7195,
    longitude: 85.327,
    consultationFee: 800,
  },
  {
    firstName: "Amit",
    lastName: "Patel",
    email: "amit.patel@medical.com",
    phone: "+977-9841234569",
    password: "doctor123",
    qualifications: "MBBS, MD (Dermatology)",
    licenseNumber: "MED-KTM-003",
    yearsOfExperience: 10,
    specializations: ["Dermatologist"],
    latitude: 27.716,
    longitude: 85.32,
    consultationFee: 600,
  },
  {
    firstName: "Neha",
    lastName: "Singh",
    email: "neha.singh@medical.com",
    phone: "+977-9841234570",
    password: "doctor123",
    qualifications: "MD, DM (Psychiatry)",
    licenseNumber: "MED-KTM-004",
    yearsOfExperience: 11,
    specializations: ["Psychiatrist"],
    latitude: 27.7185,
    longitude: 85.3215,
    consultationFee: 700,
  },
  {
    firstName: "Vikram",
    lastName: "Mishra",
    email: "vikram.mishra@medical.com",
    phone: "+977-9841234571",
    password: "doctor123",
    qualifications: "MBBS, MD (Respiratory Medicine)",
    licenseNumber: "MED-KTM-005",
    yearsOfExperience: 13,
    specializations: ["Pulmonologist"],
    latitude: 27.7175,
    longitude: 85.325,
    consultationFee: 750,
  },
  {
    firstName: "Anita",
    lastName: "Gupta",
    email: "anita.gupta@medical.com",
    phone: "+977-9841234572",
    password: "doctor123",
    qualifications: "MBBS, MD (ENT)",
    licenseNumber: "MED-KTM-006",
    yearsOfExperience: 9,
    specializations: ["ENT Specialist"],
    latitude: 27.7155,
    longitude: 85.3235,
    consultationFee: 650,
  },
  {
    firstName: "Arjun",
    lastName: "Nair",
    email: "arjun.nair@medical.com",
    phone: "+977-9841234573",
    password: "doctor123",
    qualifications: "MBBS, MD (Gastroenterology)",
    licenseNumber: "MED-KTM-007",
    yearsOfExperience: 14,
    specializations: ["Gastroenterologist"],
    latitude: 27.718,
    longitude: 85.326,
    consultationFee: 700,
  },
  {
    firstName: "Sarah",
    lastName: "Khan",
    email: "sarah.khan@medical.com",
    phone: "+977-9841234574",
    password: "doctor123",
    qualifications: "MBBS, MS (Orthopedic Surgery)",
    licenseNumber: "MED-KTM-008",
    yearsOfExperience: 16,
    specializations: ["Orthopedic Surgeon"],
    latitude: 27.719,
    longitude: 85.3225,
    consultationFee: 900,
  },
  {
    firstName: "Ravi",
    lastName: "Bhatt",
    email: "ravi.bhatt@medical.com",
    phone: "+977-9841234575",
    password: "doctor123",
    qualifications: "MBBS, MD (Ophthalmology)",
    licenseNumber: "MED-KTM-009",
    yearsOfExperience: 12,
    specializations: ["Ophthalmologist"],
    latitude: 27.7165,
    longitude: 85.3245,
    consultationFee: 650,
  },
  {
    firstName: "Meera",
    lastName: "Joshi",
    email: "meera.joshi@medical.com",
    phone: "+977-9841234576",
    password: "doctor123",
    qualifications: "MBBS, MD (Neurology)",
    licenseNumber: "MED-KTM-010",
    yearsOfExperience: 14,
    specializations: ["Neurologist"],
    latitude: 27.7180,
    longitude: 85.322,
    consultationFee: 800,
  },
];

async function main() {
  console.log("🌱 Starting comprehensive database seed...\n");

  try {
    // Step 1: Create specializations
    console.log("📋 Creating specializations...");
    const createdSpecializations: { [key: string]: string } = {};

    for (const spec of specializations) {
      const specialization = await prisma.specialization.upsert({
        where: { name: spec.name },
        update: {},
        create: {
          name: spec.name,
          description: spec.description,
        },
      });
      createdSpecializations[spec.name] = specialization.id;
      console.log(`✓ ${spec.name}`);
    }

    // Step 2: Create all unique medical conditions
    console.log("\n🏥 Creating medical conditions...");
    const allConditionNames = new Set<string>();
    for (const item of symptomConditionData) {
      for (const cond of item.conditions) {
        allConditionNames.add(cond.name);
      }
    }

    const createdConditions: { [key: string]: string } = {};
    for (const conditionName of allConditionNames) {
      const condition = await prisma.medicalCondition.upsert({
        where: { name: conditionName },
        update: {},
        create: {
          name: conditionName,
          description: `Medical condition: ${conditionName}`,
        },
      });
      createdConditions[conditionName] = condition.id;
    }
    console.log(`✓ Created ${allConditionNames.size} medical conditions`);

    // Step 3: Link specializations to conditions
    console.log("\n🔗 Linking specializations to medical conditions...");
    for (const [specName, conditions] of Object.entries(specializationConditionMap)) {
      const specializationId = createdSpecializations[specName];
      if (!specializationId) continue;

      for (const conditionName of conditions) {
        const conditionId = createdConditions[conditionName];
        if (conditionId) {
          await prisma.specializationCondition.upsert({
            where: {
              specializationId_conditionId: {
                specializationId,
                conditionId,
              },
            },
            update: {},
            create: {
              specializationId,
              conditionId,
              relevanceScore: 1.0,
            },
          });
        }
      }
    }
    console.log(`✓ Linked all specializations to conditions`);

    // Step 4: Create symptoms and symptom-condition relationships
    console.log("\n💊 Creating symptoms and relationships...");
    for (const item of symptomConditionData) {
      const symptom = await prisma.symptom.upsert({
        where: { name: item.symptom },
        update: {},
        create: {
          name: item.symptom,
          description: `Symptom: ${item.symptom}`,
        },
      });

      // Create symptom-condition relationships
      for (const cond of item.conditions) {
        const conditionId = createdConditions[cond.name];
        if (conditionId) {
          await prisma.symptomConditionRelation.upsert({
            where: {
              symptomId_conditionId: {
                symptomId: symptom.id,
                conditionId: conditionId,
              },
            },
            update: {},
            create: {
              symptomId: symptom.id,
              conditionId: conditionId,
              probability: cond.probability,
            },
          });
        }
      }
    }
    console.log(`✓ Created ${symptomConditionData.length} symptoms with relationships`);

    // Step 5: Create sample doctors
    console.log("\n👨‍⚕️ Creating sample doctors...");
    for (const doctorData of sampleDoctors) {
      const hashedPassword = await bcrypt.hash(doctorData.password, 10);

      const doctor = await prisma.doctor.upsert({
        where: { email: doctorData.email },
        update: {},
        create: {
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          email: doctorData.email,
          phone: doctorData.phone,
          password: hashedPassword,
          qualifications: doctorData.qualifications,
          licenseNumber: doctorData.licenseNumber,
          yearsOfExperience: doctorData.yearsOfExperience,
          latitude: doctorData.latitude,
          longitude: doctorData.longitude,
          consultationFee: doctorData.consultationFee,
          isVerified: true,
          isAvailable: true,
        },
      });

      // Link doctor to specializations
      for (let i = 0; i < doctorData.specializations.length; i++) {
        const specName = doctorData.specializations[i];
        if (!specName) continue;
        const specializationId = createdSpecializations[specName];
        if (specializationId) {
          await prisma.doctorSpecialization.upsert({
            where: {
              doctorId_specializationId: {
                doctorId: doctor.id,
                specializationId: specializationId,
              },
            },
            update: {},
            create: {
              doctorId: doctor.id,
              specializationId: specializationId,
              isPrimary: i === 0,
            },
          });
        }
      }

      console.log(`✓ Dr. ${doctor.firstName} ${doctor.lastName}`);
    }

    console.log("\n✅ Database seed completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   Specializations: ${specializations.length}`);
    console.log(`   Medical Conditions: ${allConditionNames.size}`);
    console.log(`   Symptoms: ${symptomConditionData.length}`);
    console.log(`   Sample Doctors: ${sampleDoctors.length}`);
    console.log(`   Specialization-Condition Links: Multiple`);
    console.log(`   Symptom-Condition Links: Multiple`);
    console.log(`   Doctor-Specialization Links: Multiple\n`);
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();