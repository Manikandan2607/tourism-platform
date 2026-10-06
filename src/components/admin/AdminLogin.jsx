"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost, setAuthData } from "@/utils/api";

/* =========================================================
   ADMIN LOGIN
   ========================================================= */

export default function AdminLogin() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  /* =========================================================
     TOAST STATE
     ========================================================= */

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });

  /* =========================================================
     SHOW TOAST
     ========================================================= */

  function showToast(message, type = "error") {
    setToast({
      show: true,
      message,
      type,
    });
  }

  /* =========================================================
     HIDE TOAST
     ========================================================= */

  function hideToast() {
    setToast({
      show: false,
      message: "",
      type: "error",
    });
  }

  /* =========================================================
     AUTO HIDE TOAST
     ========================================================= */

  useEffect(() => {
    if (!toast.show) {
      return;
    }

    const timer = setTimeout(() => {
      hideToast();
    }, 3500);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.show]);

  /* =========================================================
     HANDLE INPUT CHANGE
     ========================================================= */

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

  /* =========================================================
     VALIDATE FORM
     ========================================================= */

  function validateForm() {
    const newErrors = {};

    const email = formData.email.trim();

    const password = formData.password;

    /* -------------------------------------------------------
       EMAIL
       ------------------------------------------------------- */

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    /* -------------------------------------------------------
       PASSWORD
       ------------------------------------------------------- */

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  /* =========================================================
     HANDLE LOGIN
     ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    hideToast();

    /* -------------------------------------------------------
       VALIDATE
       ------------------------------------------------------- */

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      /* -----------------------------------------------------
         LOGIN API
         ----------------------------------------------------- */

      const response = await apiPost("/api/admin/login", {
        email: formData.email.trim().toLowerCase(),

        password: formData.password,
      });

      /* -----------------------------------------------------
         CHECK RESPONSE
         ----------------------------------------------------- */

      if (!response?.success || !response?.token) {
        showToast(response?.message || "Invalid email or password.", "error");

        return;
      }

      /* -----------------------------------------------------
         SAVE AUTH DATA
         ----------------------------------------------------- */

      setAuthData(response.token, response.user);

      /* -----------------------------------------------------
         SUCCESS TOAST
         ----------------------------------------------------- */

      showToast("Login successful. Redirecting...", "success");

      /* -----------------------------------------------------
         REDIRECT
         ----------------------------------------------------- */

      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 800);
    } catch (error) {
      /*
        The API sends 401 when the email/password
        is incorrect.

        This is handled as a normal UI error,
        not a console error.
      */

      if (error?.status === 401) {
        showToast("Invalid email or password.", "error");

        return;
      }

      /* -----------------------------------------------------
         OTHER ERRORS
         ----------------------------------------------------- */

      showToast(
        error?.data?.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      {/* =====================================================
          LOGIN CARD
          ===================================================== */}

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-8 backdrop-blur-xl">
          {/* =================================================
              HEADER
              ================================================= */}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-lg">
              T
            </div>

            <h1 className="text-2xl font-bold text-white">Tourism Admin</h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to manage your tourism platform
            </p>
          </div>

          {/* =================================================
              FORM
              ================================================= */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* =================================================
                EMAIL
                ================================================= */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@tourism.com"
                autoComplete="email"
                disabled={loading}
                className={`w-full rounded-xl border bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.email
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
              />

              {errors.email && (
                <p className="mt-2 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            {/* =================================================
                PASSWORD
                ================================================= */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className={`w-full rounded-xl border bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  errors.password
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
              />

              {errors.password && (
                <p className="mt-2 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            {/* =================================================
                LOGIN BUTTON
                ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* =================================================
              FOOTER
              ================================================= */}

          <p className="mt-6 text-center text-xs text-slate-500">
            Admin access only
          </p>
        </div>
      </div>

      {/* =====================================================
          TOP RIGHT TOAST
          ===================================================== */}

      {toast.show && (
        <div
          className={`fixed right-5 top-5 z-[9999] flex w-[360px] max-w-[calc(100vw-40px)] items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/95"
              : "border-red-500/30 bg-red-950/95"
          }`}
        >
          {/* -------------------------------------------------
              ICON
              ------------------------------------------------- */}

          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              toast.type === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {toast.type === "success" ? "✓" : "!"}
          </div>

          {/* -------------------------------------------------
              MESSAGE
              ------------------------------------------------- */}

          <div className="flex-1">
            <p
              className={`text-sm font-semibold ${
                toast.type === "success" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {toast.type === "success" ? "Success" : "Login Failed"}
            </p>

            <p className="mt-1 text-sm text-slate-300">{toast.message}</p>
          </div>

          {/* -------------------------------------------------
              CLOSE
              ------------------------------------------------- */}

          <button
            type="button"
            onClick={hideToast}
            className="text-lg leading-none text-slate-500 transition hover:text-white"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
