import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { symptomAnalyzeApi } from "../auth/apipath";

type Gender = "male" | "female";
type Severity = "mild" | "moderate" | "severe";
type UrgencyLevel = "low" | "medium" | "high" | "critical";

type PredictedCondition = {
  condition: string;
  probability: number;
};

type RecommendedDoctor = {
  id: string;
  name: string;
  specialization: string;
  qualifications: string;
  yearsOfExperience: number;
  consultationFee: number;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicState: string;
  clinicPincode: string;
  profileImageUrl?: string;
  distanceKm: number | null;
  matchScore: string;
};

type SymptomAnalysisResponse = {
  message: string;
  success: boolean;
  urgencyLevel: UrgencyLevel;
  recommendedDoctor: string;
  recommendedDoctors?: RecommendedDoctor[];
  predictedDisease: PredictedCondition[];
  aiExplanation: string;
};

const commonSymptoms = [
  "fever",
  "cough",
  "headache",
  "sore throat",
  "chest pain",
  "shortness of breath",
  "nausea",
  "abdominal pain",
  "skin rash",
  "joint pain",
  "back pain",
  "anxiety",
];

const durationOptions = ["Today", "1-2 days", "3-5 days", "About a week", "More than a week"];

const urgencyStyles: Record<UrgencyLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-rose-200 bg-rose-50 text-rose-800",
};

async function readSymptomResponse(response: Response): Promise<SymptomAnalysisResponse> {
  const rawBody = await response.text();
  const data = rawBody ? JSON.parse(rawBody) : {};

  if (!response.ok) {
    throw new Error(data.message || response.statusText || "Symptom analysis failed");
  }

  return data as SymptomAnalysisResponse;
}

function getDoctorInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDoctorLocation(doctor: RecommendedDoctor) {
  const cityState = [doctor.clinicCity, doctor.clinicState].filter(Boolean).join(", ");

  return cityState || doctor.clinicAddress || "Location not available";
}

function formatDoctorDistance(distanceKm: number | null) {
  if (distanceKm === null) {
    return "Distance not available";
  }

  return `${distanceKm.toFixed(1)} km away`;
}

export const SymptomChecker = () => {
  const { token, user, logout } = useAuth();
  const [symptomInput, setSymptomInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [duration, setDuration] = useState(durationOptions[1]);
  const [severity, setSeverity] = useState<Severity>("mild");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SymptomAnalysisResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedInput = symptomInput.trim().toLowerCase();
  const canAddSymptom = normalizedInput.length > 0 && !symptoms.includes(normalizedInput);

  const sortedConditions = useMemo(() => {
    return result?.predictedDisease ?? [];
  }, [result]);

  const recommendedDoctors = useMemo(() => {
    return result?.recommendedDoctors ?? [];
  }, [result]);

  const addSymptom = (value: string) => {
    const symptom = value.trim().toLowerCase();

    if (!symptom || symptoms.includes(symptom)) {
      setSymptomInput("");
      return;
    }

    setSymptoms((currentSymptoms) => [...currentSymptoms, symptom]);
    setSymptomInput("");
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms((currentSymptoms) => currentSymptoms.filter((item) => item !== symptom));
  };

  const handleSymptomKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSymptom(symptomInput);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setResult(null);
    setIsSubmitting(true);

    const symptomList =
      normalizedInput && !symptoms.includes(normalizedInput) ? [...symptoms, normalizedInput] : symptoms;

    try {
      const response = await fetch(symptomAnalyzeApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptoms: symptomList,
          age: Number(age),
          gender,
          duration,
          severity,
        }),
      });

      const data = await readSymptomResponse(response);
      setSymptoms(symptomList);
      setSymptomInput("");
      setResult(data);
      setMessage(data.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Symptom analysis failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              AI Medical Appointment
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Symptom checker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-950">Tell us what you feel</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Add one or more symptoms, then include the basic details your backend analyzer needs.
            </p>
          </div>

          {message && !result && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Symptoms</label>
              <div className="rounded-lg border border-slate-200 bg-white p-3 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                <div className="mb-3 flex min-h-9 flex-wrap gap-2">
                  {symptoms.length === 0 ? (
                    <span className="py-2 text-sm text-slate-400">No symptoms added yet</span>
                  ) : (
                    symptoms.map((symptom) => (
                      <button
                        type="button"
                        key={symptom}
                        onClick={() => removeSymptom(symptom)}
                        className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-800 ring-1 ring-cyan-200 transition hover:bg-cyan-100"
                        title="Remove symptom"
                      >
                        {symptom}
                        <span aria-hidden="true" className="text-cyan-600">x</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(event) => setSymptomInput(event.target.value)}
                    onKeyDown={handleSymptomKeyDown}
                    placeholder="Type a symptom and press Enter"
                    className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    disabled={!canAddSymptom}
                    onClick={() => addSymptom(symptomInput)}
                    className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {commonSymptoms.map((symptom) => (
                  <button
                    type="button"
                    key={symptom}
                    onClick={() => addSymptom(symptom)}
                    disabled={symptoms.includes(symptom)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Age</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="Example: 28"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value as Gender)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Duration</label>
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Severity</label>
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
                  {(["mild", "moderate", "severe"] as Severity[]).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setSeverity(item)}
                      className={`rounded-md px-2 py-2 text-sm font-medium capitalize transition ${
                        severity === item
                          ? "bg-white text-cyan-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Analyzing symptoms..." : "Analyze symptoms"}
            </button>
          </form>

          {result && (
            <section className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Recommended doctors</h2>
                {recommendedDoctors.length > 0 && (
                  <span className="text-xs font-medium text-slate-500">{recommendedDoctors.length} matches</span>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {recommendedDoctors.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No doctor recommendations were returned.
                  </p>
                ) : (
                  recommendedDoctors.map((doctor) => (
                    <article
                      key={doctor.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100">
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                            {getDoctorInitials(doctor.name) || "DR"}
                          </div>
                          {doctor.profileImageUrl && (
                            <img
                              src={doctor.profileImageUrl}
                              alt={doctor.name}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-slate-950">{doctor.name}</h3>
                              <p className="truncate text-xs font-medium text-cyan-700">
                                {doctor.specialization}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                              {doctor.matchScore}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <p>
                              <span className="font-semibold text-slate-800">Experience:</span>{" "}
                              {doctor.yearsOfExperience} years
                            </p>
                            <p>
                              <span className="font-semibold text-slate-800">Distance:</span>{" "}
                              {formatDoctorDistance(doctor.distanceKm)}
                            </p>
                            <p className="sm:col-span-2">
                              <span className="font-semibold text-slate-800">Location:</span>{" "}
                              {formatDoctorLocation(doctor)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">Analysis result</h2>
            {!result ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">Your results will appear here.</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The checker can suggest urgency, likely matches, and the type of doctor to contact.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className={`rounded-lg border px-4 py-3 ${urgencyStyles[result.urgencyLevel]}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">Urgency</p>
                  <p className="mt-1 text-xl font-semibold capitalize">{result.urgencyLevel}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Possible matches</h3>
                  <div className="mt-3 space-y-3">
                    {sortedConditions.length === 0 ? (
                      <p className="text-sm text-slate-500">No condition match was returned.</p>
                    ) : (
                      sortedConditions.map((condition) => {
                        const percent = Math.round(condition.probability * 100);

                        return (
                          <div key={condition.condition}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-medium text-slate-700">{condition.condition}</span>
                              <span className="text-slate-500">{percent}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-cyan-600"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {result && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-950">AI guidance</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {result.aiExplanation}
              </p>
            </section>
          )}

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            This tool gives educational guidance only. For severe symptoms, worsening pain, breathing issues,
            chest pain, fainting, or any emergency concern, contact urgent medical care immediately.
          </section>
        </aside>
      </main>
    </div>
  );
};

export default SymptomChecker;
