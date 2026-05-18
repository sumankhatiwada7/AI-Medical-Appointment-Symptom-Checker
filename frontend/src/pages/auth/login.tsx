import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type AuthFieldError } from "../../context/AuthContext";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorByField = useMemo(() => {
    return fieldErrors.reduce<Record<string, string>>((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});
  }, [fieldErrors]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setFieldErrors([]);
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });
      setMessage(response.message);
      navigate("/");
    } catch (error) {
      const authError = error as Error & { fieldErrors?: AuthFieldError[] };
      setMessage(authError.message || "Login failed");
      setFieldErrors(authError.fieldErrors ?? []);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#dbeafe_55%,_#bfdbfe)] px-4 py-10 text-slate-900">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur sm:grid-cols-2">
        <div className="flex flex-col justify-between bg-slate-900 p-8 text-white sm:p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Welcome back</p>
            <h2 className="mt-6 max-w-md text-4xl font-semibold leading-tight">Sign in to continue your symptom checks and appointments.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Keep your medical workflow in one place and pick up where you left off.
            </p>
          </div>
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            Backend errors are mapped to the exact field that needs attention.
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">Login</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">Access your account</h3>
            <p className="mt-2 text-sm text-slate-500">No client-side validation. The backend tells us what to display.</p>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.email ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              />
              {errorByField.email && <p className="mt-2 text-sm text-rose-600">{errorByField.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-4 ${errorByField.password ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-100" : "border-slate-200 bg-white focus:border-cyan-500 focus:ring-cyan-100"}`}
              />
              {errorByField.password && <p className="mt-2 text-sm text-rose-600">{errorByField.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
