import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, type AuthFieldError, type UserRole } from "../../context/AuthContext";


const normalizeRole = (value: string | null): UserRole => {
  return value?.toUpperCase() === "DOCTOR" ? "DOCTOR" : "PATIENT";
};


export const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { register } = useAuth();
    const roleParam = searchParams.get("role");

    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [role,setRole]=useState<UserRole>(() => normalizeRole(roleParam));
    const [message,setMessage]=useState("");
    const [fieldErrors,setFieldErrors]=useState<AuthFieldError[]>([]);
    const [isSubmitting,setIsSubmitting]=useState(false);

    useEffect(() => {
      setRole(normalizeRole(roleParam));
    }, [roleParam]);

    const errorByField = useMemo(() => {
      return fieldErrors.reduce<Record<string, string>>((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {});
    }, [fieldErrors]);

    const handleSubmit=async (e:FormEvent)=>{
        e.preventDefault();
        setMessage("");
        setFieldErrors([]);
        setIsSubmitting(true);
        const data = {
            name,
            email,
            password,
            role,
        };

        try{
        const responseData = await register(data);
        setMessage(responseData.message);
        if(responseData.success){
          navigate(`/login?role=${role.toLowerCase()}`);
        }
        }
        catch(error){
            const authError = error as Error & { fieldErrors?: AuthFieldError[] };
            setMessage(authError.message || "Registration failed");
            setFieldErrors(authError.fieldErrors ?? []);
        }
        finally{
            setIsSubmitting(false);
        }
    }
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_55%,_#cbd5e1)] px-4 py-10 text-slate-900">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur sm:grid-cols-2">
        <div className="flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">AI Medical Appointment</p>
            <h2 className="mt-6 max-w-md text-4xl font-semibold leading-tight">Create your account and start checking symptoms with structure.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Register once, then continue in the correct workspace for your role.
            </p>
          </div>
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            Backend validation messages appear directly under each field.
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">Register as {role.toLowerCase()}</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">Build your profile</h3>
            <p className="mt-2 text-sm text-slate-500">No client-side validation. Errors come from the backend and show beside the related field.</p>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e)=>setName(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.name ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              />
              {errorByField.name && <p className="mt-2 text-sm text-rose-600">{errorByField.name}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.email ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              />
              {errorByField.email && <p className="mt-2 text-sm text-rose-600">{errorByField.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                placeholder="Choose a secure password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.password ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              />
              {errorByField.password && <p className="mt-2 text-sm text-rose-600">{errorByField.password}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
              <select
                value={role}
                onChange={(e)=>setRole(e.target.value as UserRole)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.role ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              >
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
              {errorByField.role && <p className="mt-2 text-sm text-rose-600">{errorByField.role}</p>}
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
  )
}
export default Register;
