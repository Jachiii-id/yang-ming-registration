// Rute pemasaran: Home / landing. Susunan: hero 2 kolom → langkah → persyaratan → CTA ulang.
import { Link } from "react-router-dom";
import { APP } from "../config/app";
import { Button } from "../components/ui";
import { useAuth } from "../features/auth/AuthContext";

const steps = [
  ["01", "Create your account", "Choose your email and password and enter your company details."],
  ["02", "Verify with a code", "We email a 6-digit code. Enter it to confirm the address is yours."],
  ["03", "Upload and track", "Attach your document once, then follow the review status on your dashboard."],
];

function Cta({ session, className = "" }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row ${className}`}>
      {session ? (
        <Link to="/app"><Button className="w-full sm:w-auto">Open dashboard</Button></Link>
      ) : (
        <>
          <Link to="/register"><Button className="w-full sm:w-auto">Create account</Button></Link>
          <Link to="/login"><Button variant="outline" className="w-full sm:w-auto">Sign in</Button></Link>
        </>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { session } = useAuth();
  return (
    <>
      <section className="grid items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="rise">
          <p className="text-sm font-medium text-accent-strong">Registration portal</p>
          <h1 className="mt-4 text-[2rem] leading-[1.2] sm:text-[2.5rem]">Register once for Yang Ming Indonesia services</h1>
          <p className="mt-6 max-w-[65ch] text-muted">
            Submit your details and required document in one visit. We verify your email, review your registration, and keep you updated on your dashboard.
          </p>
          <Cta session={session} className="mt-8" />
        </div>
        <img src={APP.heroImage} alt="Container ship at sea" width="1344" height="896" fetchpriority="high"
          className="aspect-[4/3] w-full rounded-2xl border border-line object-cover" />
      </section>

      <section aria-labelledby="how" className="border-y border-line bg-surface px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="how" className="text-[1.44rem]">How registration works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <li key={n} className="border-t border-line-strong pt-4">
              <p className="text-sm font-medium text-accent-strong">{n}</p>
              <h3 className="mt-2 text-[1.2rem]">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="need" className="px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="need" className="text-[1.44rem]">What you need</h2>
        <ul className="mt-6 max-w-[65ch] list-disc space-y-2 pl-5 text-muted marker:text-accent">
          <li>An email address you can open right now</li>
          <li>One document as PDF, JPG or PNG, up to {APP.maxFileMB} MB</li>
          <li>Your company name and phone number, if you register for a company</li>
        </ul>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="rounded-2xl border border-line bg-accent-soft p-8 sm:p-12">
          <h2 className="text-[1.44rem]">Ready to register?</h2>
          <p className="mt-2 max-w-[65ch] text-muted">It takes about five minutes with your document at hand.</p>
          <Cta session={session} className="mt-6" />
        </div>
      </section>
    </>
  );
}
