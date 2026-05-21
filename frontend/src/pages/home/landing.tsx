import { useNavigate } from "react-router-dom";

const roleCards = [
  {
    title: "Patient",
    description: "Check symptoms, review likely conditions, and get guidance for the next step.",
    cta: "Register as patient",
    href: "/register?role=PATIENT",
    accent: "from-cyan-500 to-sky-600",
  },
  {
    title: "Doctor",
    description: "Access the doctor dashboard and review the medical workspace for your practice.",
    cta: "Register as doctor",
    href: "/register?role=DOCTOR",
    accent: "from-slate-900 to-slate-700",
  },
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#dbeafe_40%,_#cbd5e1_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_24px_100px_rgba(15,23,42,0.18)] backdrop-blur">
        <header className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">AI Medical Appointment</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Choose your workspace</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
          >
            Login
          </button>
        </header>

        <main className="grid flex-1 gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <section className="flex flex-col justify-between rounded-[1.75rem] bg-slate-950 p-8 text-white shadow-[0_20px_60px_rgba(15,23,42,0.24)] sm:p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Start here</p>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                Register as a patient or doctor, then sign in to the correct dashboard.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Patients go straight to the symptom checker. Doctors are taken to the dashboard after login so the first page matches the workflow.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {roleCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => navigate(card.href)}
                  className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${card.accent}`} />
                  <h3 className="mt-5 text-2xl font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
                  <span className="mt-6 inline-flex text-sm font-semibold text-cyan-300 transition group-hover:text-cyan-200">
                    {card.cta}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[0_16px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-700">What happens next</p>
            <div className="mt-8 space-y-5 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Patient</p>
                <p className="mt-2">Register, log in, and land on the symptom checker with AI-assisted analysis.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Doctor</p>
                <p className="mt-2">Register, log in, and land on the doctor dashboard with role-based access.</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-5 text-cyan-950">
                <p className="font-semibold">Single auth flow</p>
                <p className="mt-2">The login response already carries the user role, so redirects stay automatic.</p>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Landing;