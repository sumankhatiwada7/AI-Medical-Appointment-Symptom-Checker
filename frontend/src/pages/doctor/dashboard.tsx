import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0_50%,_#cbd5e1_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_24px_100px_rgba(15,23,42,0.16)] backdrop-blur">
        <header className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">Doctor dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back, {user?.name || "Doctor"}</h1>
            <p className="mt-2 text-sm text-slate-600">Your workspace is ready for patient review and follow-up planning.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/register?role=DOCTOR")}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              Register another doctor
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="grid gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Today's patients", value: "12" },
              { label: "Pending reviews", value: "4" },
              { label: "Follow-ups", value: "7" },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">Next actions</p>
            <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                Review new symptom sessions and follow up with the highest-risk patients first.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Keep profile details current so future doctor routes and recommendations stay accurate.
              </div>
              <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-950">
                The backend doctor routes are now mounted, so this dashboard can expand into real profile and recommendation views later.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;