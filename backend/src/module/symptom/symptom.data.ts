// Local symptom-to-condition mapping database (FREE - no API calls needed)
export const symptomConditionMap: Record<string, Array<{ condition: string; probability: number }>> = {
  "chest pain": [
    { condition: "Angina", probability: 0.45 },
    { condition: "Heartburn", probability: 0.35 },
    { condition: "Muscle Strain", probability: 0.20 },
  ],
  "heart pain": [
    { condition: "Angina", probability: 0.50 },
    { condition: "Myocardial Infarction", probability: 0.30 },
    { condition: "Pericarditis", probability: 0.20 },
  ],
  "headache": [
    { condition: "Migraine", probability: 0.35 },
    { condition: "Tension Headache", probability: 0.40 },
    { condition: "Sinusitis", probability: 0.25 },
  ],
  "fever": [
    { condition: "Common Cold", probability: 0.40 },
    { condition: "Flu", probability: 0.35 },
    { condition: "Infection", probability: 0.25 },
  ],
  "cough": [
    { condition: "Common Cold", probability: 0.35 },
    { condition: "Bronchitis", probability: 0.30 },
    { condition: "Asthma", probability: 0.25 },
    { condition: "Allergies", probability: 0.10 },
  ],
  "skin rash": [
    { condition: "Dermatitis", probability: 0.35 },
    { condition: "Eczema", probability: 0.30 },
    { condition: "Psoriasis", probability: 0.20 },
    { condition: "Allergic Reaction", probability: 0.15 },
  ],
  "anxiety": [
    { condition: "Anxiety Disorder", probability: 0.60 },
    { condition: "Panic Disorder", probability: 0.25 },
    { condition: "Stress", probability: 0.15 },
  ],
  "sore throat": [
    { condition: "Pharyngitis", probability: 0.45 },
    { condition: "Tonsillitis", probability: 0.40 },
    { condition: "Laryngitis", probability: 0.15 },
  ],
  "nausea": [
    { condition: "Gastroenteritis", probability: 0.35 },
    { condition: "Indigestion", probability: 0.40 },
    { condition: "Migraine", probability: 0.15 },
    { condition: "Food Poisoning", probability: 0.10 },
  ],
  "fatigue": [
    { condition: "Anemia", probability: 0.30 },
    { condition: "Thyroid Disorder", probability: 0.25 },
    { condition: "Depression", probability: 0.25 },
    { condition: "Sleep Disorder", probability: 0.20 },
  ],
  "dizziness": [
    { condition: "Vertigo", probability: 0.35 },
    { condition: "Low Blood Pressure", probability: 0.30 },
    { condition: "Inner Ear Disorder", probability: 0.25 },
    { condition: "Anxiety", probability: 0.10 },
  ],
  "back pain": [
    { condition: "Muscle Strain", probability: 0.50 },
    { condition: "Herniated Disc", probability: 0.30 },
    { condition: "Arthritis", probability: 0.20 },
  ],
  "abdominal pain": [
    { condition: "Gastroenteritis", probability: 0.40 },
    { condition: "Appendicitis", probability: 0.30 },
    { condition: "Ulcer", probability: 0.20 },
    { condition: "IBS", probability: 0.10 },
  ],
  "vomiting": [
    { condition: "Gastroenteritis", probability: 0.45 },
    { condition: "Food Poisoning", probability: 0.35 },
    { condition: "Migraine", probability: 0.15 },
    { condition: "Pregnancy", probability: 0.05 },
  ],
  "diarrhea": [
    { condition: "Gastroenteritis", probability: 0.50 },
    { condition: "Food Poisoning", probability: 0.30 },
    { condition: "IBS", probability: 0.15 },
    { condition: "Allergy", probability: 0.05 },
  ],
  "shortness of breath": [
    { condition: "Asthma", probability: 0.40 },
    { condition: "Pneumonia", probability: 0.30 },
    { condition: "Heart Disease", probability: 0.20 },
    { condition: "Anxiety", probability: 0.10 },
  ],
  "sore muscles": [
    { condition: "Muscle Strain", probability: 0.50 },
    { condition: "Flu", probability: 0.35 },
    { condition: "Fibromyalgia", probability: 0.15 },
  ],
  "joint pain": [
    { condition: "Arthritis", probability: 0.50 },
    { condition: "Injury", probability: 0.30 },
    { condition: "Gout", probability: 0.20 },
  ],
  "loss of appetite": [
    { condition: "Depression", probability: 0.35 },
    { condition: "Gastroenteritis", probability: 0.30 },
    { condition: "Thyroid Disorder", probability: 0.20 },
    { condition: "Infection", probability: 0.15 },
  ],
  "constipation": [
    { condition: "IBS", probability: 0.40 },
    { condition: "Dehydration", probability: 0.35 },
    { condition: "Medication Side Effect", probability: 0.25 },
  ],
  "insomnia": [
    { condition: "Sleep Disorder", probability: 0.50 },
    { condition: "Anxiety", probability: 0.30 },
    { condition: "Depression", probability: 0.20 },
  ],
};