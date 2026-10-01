"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BusFront,
  Check,
  Eye,
  EyeOff,
  Headphones,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Snowflake,
  X,
} from "lucide-react";

import { apiPost, getToken, setAuthData } from "@/utils/api";

/* =========================================================
   SST TRAVELS - ADMIN LOGIN

   - No <style jsx> (it caused the hydration error).
   - Sizes use clamp() with vh/vw so it fits a normal laptop
     screen at 100% zoom.
   ========================================================= */

const LOGO_SIZES = {
  header: {
    svg: "w-[clamp(50px,7.2vh,72px)]",
    text: "text-[length:clamp(22px,4.2vh,31px)]",
    tag: "text-[length:clamp(7px,1.35vh,9px)]",
  },
  card: {
    svg: "w-[clamp(54px,8vh,78px)]",
    text: "text-[length:clamp(25px,5vh,36px)]",
    tag: "text-[length:clamp(7px,1.4vh,10px)]",
  },
};

function Logo({ variant = "header", className = "" }) {
  const size = LOGO_SIZES[variant];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 100 70"
        className={`h-auto shrink-0 ${size.svg}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M8 54L39 17L54 35L67 21L94 54"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 54L39 31L50 44L67 27L88 54"
          stroke="#08E3B2"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M35 48L43 40L50 47"
          stroke="#08E3B2"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="-ml-1">
        <div
          className={`whitespace-nowrap font-bold leading-none tracking-[-0.02em] ${size.text}`}
        >
          <span className="text-white">SST</span>{" "}
          <span className="text-[#08E3B2]">Travels</span>
        </div>
        <div
          className={`mt-[5px] whitespace-nowrap font-medium tracking-[0.3em] text-white/80 ${size.tag}`}
        >
          Travel More Worry Less
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: BusFront, title: "10 – 17 Seater", text: "Perfect for Groups" },
  { icon: Snowflake, title: "AC & Comfortable", text: "Relax Your Journey" },
  { icon: ShieldCheck, title: "Well Maintained", text: "Safety First" },
  { icon: Headphones, title: "24/7 Support", text: "Always With You" },
];

export default function AdminLogin() {
  const router = useRouter();

  /* ---------------- FORM STATE ---------------- */

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  /* ---------------- TOAST ---------------- */

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });

  /* ---------------- EXISTING LOGIN CHECK ---------------- */

  useEffect(() => {
    const token = getToken();

    if (token) {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  /* ---------------- AUTO HIDE TOAST ---------------- */

  useEffect(() => {
    if (!toast.show) {
      return;
    }

    const timer = setTimeout(() => {
      setToast({ show: false, message: "", type: "error" });
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.show]);

  function showToast(message, type = "error") {
    setToast({ show: true, message, type });
  }

  function hideToast() {
    setToast({ show: false, message: "", type: "error" });
  }

  /* ---------------- INPUT CHANGE ---------------- */

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  }

  /* ---------------- VALIDATION ---------------- */

  function validateForm() {
    const newErrors = {};

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  /* ---------------- LOGIN ---------------- */

  async function handleSubmit(event) {
    event.preventDefault();

    hideToast();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiPost("/api/admin/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (!response?.success || !response?.token) {
        showToast(response?.message || "Invalid email or password.", "error");
        return;
      }

      const user = response.user || response.admin || null;

      /* KEEP EXISTING AUTH FUNCTIONALITY */
      setAuthData(response.token, user);

      showToast("Login successful. Redirecting...", "success");

      setTimeout(() => {
        router.replace("/admin/dashboard");
      }, 500);
    } catch (error) {
      console.error("Admin login error:", error);

      if (error?.status === 401) {
        showToast("Invalid email or password.", "error");
        return;
      }

      showToast(
        error?.data?.message ||
          error?.message ||
          "Something went wrong. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- FORGOT / CREATE ---------------- */

  function handleForgotPassword(event) {
    event.preventDefault();

    showToast(
      "Please contact the administrator to reset your password.",
      "error"
    );
  }

  function handleCreateAccount(event) {
    event.preventDefault();

    showToast(
      "Administrator accounts are created by the system administrator.",
      "error"
    );
  }

  /* ---------------- INPUT STYLES ---------------- */

  const inputBase =
    "h-[clamp(42px,6.6vh,54px)] w-full rounded-xl border bg-[#021613]/60 pl-[50px] text-sm text-white outline-none transition-all duration-300 placeholder:text-white/55 hover:bg-[#021613]/80";

  const inputOk =
    "border-white/25 hover:border-white/50 focus:border-[#08E3B2] focus:ring-4 focus:ring-[#08E3B2]/10";

  const inputBad =
    "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-400/10";

  const iconClass =
    "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/75 transition-colors duration-300 group-hover:text-white group-focus-within:text-[#08E3B2]";

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#031b18] text-white">
      {/* ===================== BACKGROUND ===================== */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-[position:25%_50%] bg-no-repeat lg:bg-[position:50%_35%]"
          style={{
            backgroundImage: "url('/images/sst-travels-login-bg.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-[#021d1a]/15" />

        {/* top fade: header + heading */}
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[#02141a]/55 via-[#02141a]/15 to-transparent" />

        {/* bottom fade: feature bar */}
        <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#021b18]/70 to-transparent" />

        {/* right fade: login card */}
        <div className="absolute inset-y-0 right-0 w-[50%] bg-gradient-to-l from-[#021b19]/55 via-[#021b19]/20 to-transparent" />
      </div>

      {/* ===================== CONTENT ===================== */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ---------- HEADER ---------- */}
        <header className="flex h-[clamp(64px,9vh,100px)] shrink-0 items-center justify-between px-5 sm:px-8 lg:px-[5%]">
          <Logo variant="header" />

          <div className="hidden items-center gap-5 text-[length:clamp(11px,2vh,13px)] font-medium tracking-[0.12em] text-white/85 sm:flex">
            <span className="cursor-default transition-colors duration-300 hover:text-[#08E3B2]">
              Your Journey
            </span>
            <span className="h-4 w-px bg-white/40" />
            <span className="cursor-default transition-colors duration-300 hover:text-[#08E3B2]">
              Our Priority
            </span>
          </div>
        </header>

        {/* ---------- MAIN ---------- */}
        <section className="mx-auto flex w-full max-w-[1536px] flex-1 px-5 pb-8 sm:px-8 lg:px-[5%] lg:pb-[clamp(16px,4vh,56px)]">
          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_clamp(360px,30vw,450px)] lg:gap-[clamp(32px,5vw,80px)]">
            {/* ============ LEFT ============ */}
            <div className="flex flex-col justify-between gap-8 lg:gap-6">
              {/* Hero */}
              <div className="max-w-[730px] pt-2 lg:pt-[clamp(8px,6vh,48px)]">
                <div className="mb-[clamp(6px,1.4vh,14px)] flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:clamp(10px,1.8vh,12px)] font-medium uppercase tracking-[0.4em] text-white/75">
                  <span>Explore</span>
                  <span className="text-white/60">•</span>
                  <span>Travel</span>
                  <span className="text-white/60">•</span>
                  <span>Discover</span>
                </div>

                <h1 className="text-[length:clamp(34px,min(5vw,7.4vh),72px)] font-bold leading-[1.03] tracking-[-0.035em] text-white drop-shadow-[0_5px_20px_rgba(0,0,0,0.45)]">
                  Travel in Comfort
                  <br />
                  with <span className="text-[#08E3B2]">SST Travels</span>
                </h1>

                <div className="mt-[clamp(12px,2.4vh,24px)] inline-flex cursor-default items-center gap-3 rounded-full border border-[#08E3B2]/70 bg-[#063d35]/55 px-4 py-[clamp(6px,1.2vh,11px)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#08E3B2] hover:bg-[#063d35]/75 hover:shadow-[0_12px_34px_rgba(8,227,178,0.22)] sm:px-5">
                  <BusFront
                    size={18}
                    strokeWidth={2}
                    className="text-[#08E3B2]"
                  />
                  <span className="text-[length:clamp(12px,2.2vh,16px)] font-medium text-white">
                    Comfortable Rides
                  </span>
                  <span className="text-white/70">•</span>
                  <span className="text-[length:clamp(12px,2.2vh,16px)] font-medium text-white">
                    Safe Journeys
                  </span>
                </div>
              </div>

              {/* Feature bar */}
              <div className="w-full max-w-[805px] rounded-2xl border border-[#08E3B2]/20 bg-[#03251f]/75 px-4 py-[clamp(10px,2vh,18px)] shadow-[0_15px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 hover:border-[#08E3B2]/45 sm:px-5">
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 xl:grid-cols-4 xl:gap-y-0">
                  {FEATURES.map(({ icon: Icon, title, text }, index) => (
                    <div
                      key={title}
                      className={`group flex cursor-default items-center gap-2.5 ${
                        index < FEATURES.length - 1
                          ? "xl:border-r xl:border-white/15"
                          : ""
                      } ${index > 0 ? "xl:pl-3" : ""}`}
                    >
                      <div className="flex h-[clamp(34px,5.4vh,44px)] w-[clamp(34px,5.4vh,44px)] shrink-0 items-center justify-center rounded-full border border-[#08E3B2]/30 bg-[#08E3B2]/10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#08E3B2] group-hover:bg-[#08E3B2]/25">
                        <Icon size={18} className="text-[#08E3B2]" />
                      </div>

                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-[12px] font-semibold leading-tight text-white">
                          {title}
                        </p>
                        <p className="mt-0.5 whitespace-nowrap text-[10px] leading-tight text-white/60 transition-colors duration-300 group-hover:text-white/85">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ============ RIGHT ============ */}
            <div className="flex w-full items-center justify-center lg:justify-end">
              {/* Login card */}
              <div className="relative w-full max-w-[460px] overflow-hidden rounded-[20px] border border-[#68dbc4]/30 bg-[#04231e]/75 px-[clamp(24px,3.6vw,48px)] py-[clamp(20px,3.6vh,38px)] shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-[#08E3B2]/55 hover:shadow-[0_30px_90px_rgba(8,227,178,0.14)] lg:max-w-none">
                <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#08E3B2]/10 blur-[90px]" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-cyan-400/5 blur-[90px]" />

                <div className="relative">
                  <Logo variant="card" className="mb-[clamp(12px,2.8vh,32px)]" />

                  <div className="mb-[clamp(14px,2.8vh,28px)]">
                    <h2 className="text-[length:clamp(26px,4.8vh,38px)] font-semibold leading-tight tracking-[-0.03em] text-white">
                      Welcome Back
                    </h2>

                    <p className="mt-[clamp(6px,1.2vh,12px)] max-w-[18.5em] text-[length:clamp(12px,2.2vh,15px)] leading-[1.5] text-white/80">
                      Sign in to your SST Travels account and continue your
                      journey.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-[clamp(10px,2vh,20px)]"
                    noValidate
                  >
                    {/* EMAIL */}
                    <div>
                      <div className="group relative">
                        <Mail size={19} className={iconClass} />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email address"
                          autoComplete="email"
                          disabled={loading}
                          className={`${inputBase} pr-5 ${
                            errors.email ? inputBad : inputOk
                          } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                        />
                      </div>

                      {errors.email && (
                        <p className="mt-1.5 px-1 text-xs text-red-300">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <div className="group relative">
                        <LockKeyhole size={19} className={iconClass} />

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Password"
                          autoComplete="current-password"
                          disabled={loading}
                          className={`${inputBase} pr-[50px] ${
                            errors.password ? inputBad : inputOk
                          } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((previous) => !previous)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/65 transition duration-300 hover:scale-110 hover:text-[#08E3B2]"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {errors.password && (
                        <p className="mt-1.5 px-1 text-xs text-red-300">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* REMEMBER + FORGOT */}
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setRememberMe((previous) => !previous)}
                        className="group flex items-center gap-2.5 text-[length:clamp(12px,2.1vh,14px)] text-white/90 transition-colors hover:text-white"
                      >
                        <span
                          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-all duration-300 group-hover:scale-110 ${
                            rememberMe
                              ? "border-[#08E3B2] bg-[#08E3B2] text-[#03221e]"
                              : "border-white/40 group-hover:border-[#08E3B2]"
                          }`}
                        >
                          {rememberMe && <Check size={13} strokeWidth={3} />}
                        </span>

                        <span>Remember me</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[length:clamp(12px,2.1vh,14px)] font-medium text-[#08E3B2] underline decoration-transparent underline-offset-4 transition-all duration-300 hover:text-[#6ff5d6] hover:decoration-[#6ff5d6]"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* SIGN IN */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex h-[clamp(44px,7vh,58px)] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#08E3B0] to-[#06D6B8] text-[15px] font-semibold text-[#03221e] shadow-[0_12px_30px_rgba(0,227,178,0.2)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_16px_40px_rgba(0,227,178,0.4)] focus:outline-none focus:ring-4 focus:ring-[#08E3B2]/25 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {/* shine sweep on hover */}
                      <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/35 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[450%]" />

                      {loading ? (
                        <span className="relative flex items-center">
                          <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-[#03221e]/30 border-t-[#03221e]" />
                          Signing In...
                        </span>
                      ) : (
                        <span className="relative flex items-center">
                          <span>Sign In</span>
                          <ArrowRight
                            size={19}
                            className="ml-3 transition-transform duration-300 group-hover:translate-x-1.5"
                          />
                        </span>
                      )}
                    </button>
                  </form>

                  {/* OR */}
                  <div className="my-[clamp(10px,2.2vh,24px)] flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/20" />
                    <span className="text-xs font-medium text-white/70">OR</span>
                    <div className="h-px flex-1 bg-white/20" />
                  </div>

                  {/* CREATE ACCOUNT */}
                  <div className="text-center text-[length:clamp(11px,2vh,13px)] text-white/75">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={handleCreateAccount}
                      className="font-medium text-[#08E3B2] underline decoration-[#08E3B2]/60 underline-offset-4 transition-all duration-300 hover:text-[#6ff5d6] hover:decoration-[#6ff5d6]"
                    >
                      Create account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===================== TOAST ===================== */}
      {toast.show && (
        <div
          role="alert"
          className={`fixed right-5 top-5 z-[9999] flex w-[380px] max-w-[calc(100vw-40px)] items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-emerald-400/40 bg-[#062820]/95"
              : "border-red-400/40 bg-[#2a0909]/95"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              toast.type === "success"
                ? "bg-emerald-400/15 text-emerald-300"
                : "bg-red-400/15 text-red-300"
            }`}
          >
            {toast.type === "success" ? <Check size={18} /> : <X size={18} />}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold ${
                toast.type === "success" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {toast.type === "success" ? "Success" : "Login Failed"}
            </p>

            <p className="mt-1 text-sm leading-5 text-white/70">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={hideToast}
            className="text-white/50 transition hover:text-white"
            aria-label="Close notification"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </main>
  );
}