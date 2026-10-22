// Pola halaman: Form (halaman penuh, kolom sempit ~640px).
// Alur: isi form → signUp (email+password) → Supabase kirim kode 6 digit → verifikasi → unggah dokumen + simpan data.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP } from "../config/app";
import { supabase } from "../lib/supabase";
import {
  Button,
  Card,
  Field,
  Input,
  PasswordInput,
  Select,
} from "../components/ui";
import { FileUpload } from "../components/ui/FileUpload";
import { OtpVerify } from "../features/auth/OtpVerify";
import { useAuth } from "../features/auth/AuthContext";

const DRAFT = "ym-register-draft";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Password TIDAK pernah disimpan di draft; hanya field non-sensitif.
const empty = {
  full_name: "",
  email: "",
  company_name: "",
  phone_number: "",
  registration_category: APP.categories[0],
};

const rules = {
  full_name: (v) => (v.trim() ? "" : "Enter your full name."),
  email: (v) => (emailRe.test(v.trim()) ? "" : "Enter a valid email address."),
  phone_number: (v) =>
    !v || /^\+?[0-9\s-]{8,16}$/.test(v) ? "" : "Enter a valid phone number.",
};

export default function RegisterPage() {
  const { session } = useAuth();
  const [f, setF] = useState(() => {
    try {
      return { ...empty, ...JSON.parse(sessionStorage.getItem(DRAFT)) };
    } catch {
      return empty;
    }
  });
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(DRAFT, JSON.stringify(f));
  }, [f]);
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setErrors((x) => ({ ...x, [k]: undefined, form: undefined }));
  };
  const blur = (k) => async (e) => {
    const msg = rules[k]?.(e.target.value) || "";
    setErrors((x) => ({ ...x, [k]: msg || undefined }));
  };

  // Jika user sudah login dengan email yang sama (misal upload sebelumnya gagal), lewati signUp.
  const reuse =
    !!session?.user?.email &&
    session.user.email.toLowerCase() === f.email.trim().toLowerCase();

  const validate = async () => {
    const e = {};
    for (const k of Object.keys(rules)) {
      const m = rules[k](f[k]);
      if (m) e[k] = m;
    }
    if (!reuse && password.length < APP.minPassword)
      e.password = `Use at least ${APP.minPassword} characters.`;
    if (!file) e.file = "Upload the required document.";
    else if (!APP.accept[file.type]) e.file = "Use a PDF, JPG or PNG file.";
    else if (file.size > APP.maxFileMB * 1048576)
      e.file = `File must be ${APP.maxFileMB} MB or smaller.`;
    if (!agree) e.agree = "Agree to the terms and privacy policy to continue.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  // Berjalan hanya setelah email terverifikasi (bucket privat butuh user login).
  const finalize = async (user) => {
    setBusy(true);
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage
      .from(APP.bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) {
      setBusy(false);
      setStep("form");
      return setErrors({
        file: "Upload failed. Check the file type and size, then try again.",
      });
    }
    const { error } = await supabase.from("registrations").insert({
      user_id: user.id,
      full_name: f.full_name.trim(),
      email: user.email,
      company_name: f.company_name.trim() || null,
      phone_number: f.phone_number.trim() || null,
      registration_category: f.registration_category,
      document_path: path,
    });
    if (error) {
      await supabase.storage.from(APP.bucket).remove([path]);
      setBusy(false);
      setStep("form");
      return setErrors({
        form:
          error.code === "23505"
            ? "This account already has an active registration. Sign in to view it."
            : "We could not save your registration. Try again.",
      });
    }
    sessionStorage.removeItem(DRAFT);
    setBusy(false);
    setStep("done");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    if (!(await validate())) return setBusy(false);
    if (reuse) {
      setBusy(false);
      return finalize(session.user);
    }
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password,
      options: { data: { full_name: f.full_name.trim() } },
    });
    setBusy(false);
    if (error) {
      const m = error.message;
      return setErrors(
        /rate|seconds/i.test(m)
          ? { form: "Too many requests. Wait a minute and try again." }
          : /password/i.test(m)
            ? { password: "Choose a stronger password." }
            : {
                form: "We could not create your account. Check your details and try again.",
              },
      );
    }
    if (data.session) {
      // "Confirm email" mati di Supabase → OTP akan terlewati. Hentikan.
      await supabase.auth.signOut();
      return setErrors({
        form: 'Email verification is turned off for this project. Turn on "Confirm email" in Supabase first.',
      });
    }
    if (data.user && data.user.identities?.length === 0)
      return setErrors({
        email: "This email is already registered. Sign in instead.",
      });
    setPassword("");
    setStep("verify");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      {step === "done" ? (
        <Card className="rise text-center">
          <h1 className="text-[1.44rem] font-semibold">
            Registration submitted
          </h1>
          <p className="mx-auto mt-2 max-w-[65ch] text-sm text-muted">
            Your email is verified and your document is saved. We will review
            it, and the status will appear on your dashboard.
          </p>
          <Link to="/dashboard">
            <Button className="mt-6 w-full sm:w-auto">Open dashboard</Button>
          </Link>
        </Card>
      ) : step === "verify" ? (
        <Card className="rise mx-auto max-w-md">
          <h1 className="text-[1.44rem] font-semibold">Verify your email</h1>
          <div className="mt-4">
            <OtpVerify
              email={f.email.trim()}
              type="signup"
              onResend={() =>
                supabase.auth.resend({ type: "signup", email: f.email.trim() })
              }
              onVerified={finalize}
              onBack={() => setStep("form")}
              backLabel="Edit details"
            />
          </div>
          {busy && (
            <p role="status" className="mt-4 text-center text-sm text-muted">
              Saving your registration…
            </p>
          )}
        </Card>
      ) : (
        <Card className="rise">
          <h1 className="text-[1.44rem] font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">
            Fields marked * are required. You sign in with your email and
            password, then confirm with a code sent to your email.
          </p>
          <form onSubmit={submit} noValidate className="mt-6 space-y-6">
            {errors.form && (
              <p
                role="alert"
                className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {errors.form}
              </p>
            )}
            <Field
              id="full_name"
              label="Full name"
              required
              error={errors.full_name}
            >
              <Input
                id="full_name"
                autoComplete="name"
                value={f.full_name}
                onChange={set("full_name")}
                onBlur={blur("full_name")}
                error={errors.full_name}
              />
            </Field>
            <Field
              id="email"
              label="Email address"
              required
              error={errors.email}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={f.email}
                onChange={set("email")}
                onBlur={blur("email")}
                error={errors.email}
              />
            </Field>
            {!reuse && (
              <Field
                id="password"
                label="Password"
                required
                error={errors.password}
                hint={`At least ${APP.minPassword} characters.`}
              >
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((x) => ({ ...x, password: undefined }));
                  }}
                  error={errors.password}
                />
              </Field>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="company_name" label="Company or organization" optional>
                <Input
                  id="company_name"
                  autoComplete="organization"
                  value={f.company_name}
                  onChange={set("company_name")}
                />
              </Field>
              <Field
                id="phone_number"
                label="Phone number"
                optional
                error={errors.phone_number}
              >
                <Input
                  id="phone_number"
                  type="tel"
                  autoComplete="tel"
                  value={f.phone_number}
                  onChange={set("phone_number")}
                  onBlur={blur("phone_number")}
                  error={errors.phone_number}
                />
              </Field>
            </div>
            <Field id="registration_category" label="Registration category">
              <Select
                id="registration_category"
                value={f.registration_category}
                onChange={set("registration_category")}
              >
                {APP.categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field
              id="document"
              label="Required document"
              required
              error={errors.file}
            >
              <FileUpload
                id="document"
                file={file}
                error={errors.file}
                busy={busy}
                onChange={(x) => {
                  setFile(x);
                  setErrors((e) => ({ ...e, file: undefined }));
                }}
              />
            </Field>
            <div>
              <label className="flex min-h-11 items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => {
                    setAgree(e.target.checked);
                    setErrors((x) => ({ ...x, agree: undefined }));
                  }}
                  aria-invalid={!!errors.agree || undefined}
                  className="mt-0.5 size-5 shrink-0 accent-accent"
                />
                <span>I agree to the terms and privacy policy.</span>
              </label>
              {errors.agree && (
                <p role="alert" className="text-xs text-danger">
                  {errors.agree}
                </p>
              )}
            </div>
            <Button
              type="submit"
              loading={busy}
              className="w-full cursor-pointer"
            >
              Send verification code
            </Button>
            <p className="text-center text-sm text-muted">
              Already registered?{" "}
              <Link to="/login" className="font-medium text-accent underline">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      )}
    </div>
  );
}
