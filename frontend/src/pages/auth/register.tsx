import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type AuthFieldError, type UserRole } from "../../context/AuthContext";

const normalizeRole = (value: string | null): UserRole => {
  return value?.toUpperCase() === "DOCTOR" ? "DOCTOR" : "PATIENT";
};
type location ={
  latitude:Float64Array;
  longitude:Float64Array;
}

type DoctorRegisterErrors = Record<string, string>;

export const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const roleParam = searchParams.get("role");
  const [role, setRole] = useState<UserRole>(() => normalizeRole(roleParam));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [location,setlocation]=useState<location | "">("");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicCity, setClinicCity] = useState("");
  const [clinicState, setClinicState] = useState("");
  const [clinicPincode, setClinicPincode] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [validationDocument, setValidationDocument] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldError[]>([]);
  const [doctorFieldErrors, setDoctorFieldErrors] = useState<DoctorRegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,seterror]=useState("")

  useEffect(() => {
    setRole(normalizeRole(roleParam));
  }, [roleParam]);

  const errorByField = useMemo(() => {
    return fieldErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});
  }, [fieldErrors]);
 const getloocation =()=>{
  if(!navigator.geolocation){
      seterror("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition(async(position)=>{
    const cords:location ={
      latitude:new Float64Array([position.coords.latitude]),
      longitude:new Float64Array([position.coords.longitude])
    }
    console.log(cords);
    setlocation(cords);
  });
 }
  const handleDoctorRegister = async (formData: FormData) => {
    const response = await fetch("/api/doctor/register", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.message || "Doctor registration failed") as Error & {
        fieldErrors?: AuthFieldError[];
      };
      error.fieldErrors = data.error;
      throw error;
    }
    return data as { message: string; success: boolean };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setFieldErrors([]);
    setDoctorFieldErrors({});
    setIsSubmitting(true);

    try {
      if (role === "PATIENT") {
        const data = {
          name,
          email,
          password,
          role,
          location: location ? { latitude: location.latitude[0], longitude: location.longitude[0] } : undefined,
        };
        const responseData = await register(data);
        setMessage(responseData.message);
        if (responseData.success) {
          navigate(`/login?role=${role.toLowerCase()}`);
        }
      } else {
        const formData = new FormData();
        formData.append("firstName", doctorFirstName);
        formData.append("lastName", doctorLastName);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("confirmPassword", confirmPassword);
        formData.append("phone", doctorPhone);
        formData.append("qualifications", qualifications);
        formData.append("licenseNumber", licenseNumber);
        formData.append("yearsOfExperience", yearsOfExperience);
        formData.append("specializations", specializations);
        formData.append("clinicName", clinicName);
        formData.append("clinicAddress", clinicAddress);
        formData.append("clinicCity", clinicCity);
        formData.append("clinicState", clinicState);
        formData.append("clinicPincode", clinicPincode);
        formData.append("latitude", location ? location.latitude[0].toString() : "");
        formData.append("longitude", location ? location.longitude[0].toString() : "");
        formData.append("consultationFee", consultationFee);
        if (profileImage) {
          formData.append("profileImage", profileImage);
        }
        if (validationDocument) {
          formData.append("validationDocument", validationDocument);
        }

        const responseData = await handleDoctorRegister(formData);
        setMessage(responseData.message);
        if (responseData.success) {
          navigate(`/login?role=${role.toLowerCase()}`);
        }
      }
    } catch (error) {
      const authError = error as Error & { fieldErrors?: AuthFieldError[] };
      setMessage(authError.message || "Registration failed");
      if (authError.fieldErrors) {
        setFieldErrors(authError.fieldErrors);
      }
      if (role === "DOCTOR") {
        setDoctorFieldErrors((prev) => ({
          ...prev,
          email: authError.message?.toLowerCase().includes("email") ? authError.message : prev.email,
          licenseNumber: authError.message?.toLowerCase().includes("license") ? authError.message : prev.licenseNumber,
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_55%,_#cbd5e1)] px-4 py-10 text-slate-900">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur sm:grid-cols-2">
        <div className="flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">AI Medical Appointment</p>
            <h2 className="mt-6 max-w-md text-4xl font-semibold leading-tight">Create your account and start checking symptoms with structure.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Register as a patient or a doctor using the fields required by each account type.
            </p>
          </div>
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            Doctor registration requires a profile image and a validation document for review.
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">Register as {role.toLowerCase()}</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">Build your profile</h3>
            <p className="mt-2 text-sm text-slate-500">All required fields for your chosen role are shown below.</p>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Account type</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["PATIENT", "DOCTOR"] as UserRole[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${role === option ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                  >
                    {option === "PATIENT" ? "Patient" : "Doctor"}
                  </button>
                ))}
              </div>
            </div>

            {role === "PATIENT" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.name ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                  />
                  {errorByField.name && <p className="mt-2 text-sm text-rose-600">{errorByField.name}</p>}
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
                    <input
                      type="text"
                      placeholder="First name"
                      value={doctorFirstName}
                      onChange={(e) => setDoctorFirstName(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.firstName ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                    />
                    {doctorFieldErrors.firstName && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={doctorLastName}
                      onChange={(e) => setDoctorLastName(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.lastName ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                    />
                    {doctorFieldErrors.lastName && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    placeholder="Doctor contact number"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.phone ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                  />
                  {doctorFieldErrors.phone && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.phone}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.qualifications ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                  />
                  {doctorFieldErrors.qualifications && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.qualifications}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">License number</label>
                    <input
                      type="text"
                      placeholder="Medical license number"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.licenseNumber ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                    />
                    {doctorFieldErrors.licenseNumber && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.licenseNumber}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Years of experience</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.yearsOfExperience ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                    />
                    {doctorFieldErrors.yearsOfExperience && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.yearsOfExperience}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Specializations</label>
                  <input
                    type="text"
                    placeholder="Cardiology, Pediatrics"
                    value={specializations}
                    onChange={(e) => setSpecializations(e.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${doctorFieldErrors.specializations ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                  />
                  <p className="mt-2 text-sm text-slate-500">Separate multiple specializations with commas.</p>
                  {doctorFieldErrors.specializations && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.specializations}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Clinic name</label>
                    <input
                      type="text"
                      placeholder="Clinic or hospital name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Clinic city</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={clinicCity}
                      onChange={(e) => setClinicCity(e.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Clinic address</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={clinicState}
                      onChange={(e) => setClinicState(e.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Pincode</label>
                    <input
                      type="text"
                      placeholder="Postal code"
                      value={clinicPincode}
                      onChange={(e) => setClinicPincode(e.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Consultation fee</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 25"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Profile image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileImage(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                  {doctorFieldErrors.profileImage && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.profileImage}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Validation document</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setValidationDocument(e.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                  {doctorFieldErrors.validationDocument && <p className="mt-2 text-sm text-rose-600">{doctorFieldErrors.validationDocument}</p>}
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.email ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              />
              {errorByField.email && <p className="mt-2 text-sm text-rose-600">{errorByField.email}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Choose a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.password ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
                />
                {errorByField.password && <p className="mt-2 text-sm text-rose-600">{errorByField.password}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>

            <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">location </label>
                  <button type="button" onClick={getloocation} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                    Get Location
                  </button>
                </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Registering..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
