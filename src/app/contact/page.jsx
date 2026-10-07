"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiGet, apiPost } from "@/utils/api";

/* =========================================================
   HELPERS
========================================================= */

function getId(item) {
  return String(item?._id || item?.id || "");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function getDestinationName(destination) {
  return (
    destination?.name ||
    destination?.title ||
    destination?.destinationName ||
    "Unnamed Destination"
  );
}

function getPackageName(tourPackage) {
  return (
    tourPackage?.name ||
    tourPackage?.title ||
    tourPackage?.packageName ||
    "Unnamed Package"
  );
}

function findItem(items, value, nameGetter) {
  if (!value || !Array.isArray(items)) {
    return null;
  }

  const normalizedValue = normalizeText(value);

  return (
    items.find((item) => {
      const id = getId(item);

      if (id && id === String(value)) {
        return true;
      }

      const itemName = normalizeText(nameGetter(item));

      return (
        itemName === normalizedValue ||
        itemName.replace(/\s+/g, "-") === normalizedValue.replace(/\s+/g, "-")
      );
    }) || null
  );
}

/* =========================================================
   CONTACT PAGE
========================================================= */

export default function ContactPage() {
  const searchParams = useSearchParams();

  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    destinationId: "",
    packageId: "",
  });

  /* =========================================================
     LOAD DESTINATIONS + PACKAGES
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);

        const [destinationResponse, packageResponse] = await Promise.all([
          apiGet("/api/public/destinations"),
          apiGet("/api/public/packages"),
        ]);

        if (!isMounted) return;

        const destinationList = Array.isArray(destinationResponse)
          ? destinationResponse
          : destinationResponse?.data ||
            destinationResponse?.destinations ||
            [];

        const packageList = Array.isArray(packageResponse)
          ? packageResponse
          : packageResponse?.data || packageResponse?.packages || [];

        setDestinations(destinationList);
        setPackages(packageList);
      } catch (error) {
        console.error("Failed to load inquiry options:", error);

        if (isMounted) {
          setErrorMessage(
            "Unable to load destinations and packages. Please refresh the page.",
          );
        }
      } finally {
        if (isMounted) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =========================================================
     AUTO SELECT DESTINATION / PACKAGE FROM URL
     
     Supported:
     ?destinationId=123
     ?packageId=456

     Also:
     ?destination=Madurai
     ?package=Temple Tour

     Also:
     ?destinationName=Madurai
     ?packageName=Temple Tour
  ========================================================= */

  useEffect(() => {
    if (loadingOptions) return;

    const destinationIdParam =
      searchParams.get("destinationId") || searchParams.get("destination_id");

    const packageIdParam =
      searchParams.get("packageId") || searchParams.get("package_id");

    const destinationParam =
      destinationIdParam ||
      searchParams.get("destination") ||
      searchParams.get("destinationName");

    const packageParam =
      packageIdParam ||
      searchParams.get("package") ||
      searchParams.get("packageName");

    const matchedDestination = findItem(
      destinations,
      destinationParam,
      getDestinationName,
    );

    const matchedPackage = findItem(packages, packageParam, getPackageName);

    setFormData((previous) => ({
      ...previous,

      destinationId: matchedDestination
        ? getId(matchedDestination)
        : previous.destinationId,

      packageId: matchedPackage ? getId(matchedPackage) : previous.packageId,
    }));
  }, [loadingOptions, destinations, packages, searchParams]);

  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  }

  /* =========================================================
     HANDLE FORM SUBMIT
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    /* -------------------------------------------------------
       REQUIRED FIELD VALIDATION
    ------------------------------------------------------- */

    if (!name || !email || !phone || !message) {
      setErrorMessage("Name, email, phone, and message are required.");
      return;
    }

    /* -------------------------------------------------------
       LENGTH VALIDATION
    ------------------------------------------------------- */

    if (name.length < 2) {
      setErrorMessage("Name must be at least 2 characters.");
      return;
    }

    if (name.length > 100) {
      setErrorMessage("Name must not exceed 100 characters.");
      return;
    }

    if (phone.length > 20) {
      setErrorMessage("Phone number must not exceed 20 characters.");
      return;
    }

    if (subject.length > 150) {
      setErrorMessage("Subject must not exceed 150 characters.");
      return;
    }

    if (message.length < 5) {
      setErrorMessage("Message must be at least 5 characters.");
      return;
    }

    if (message.length > 2000) {
      setErrorMessage("Message must not exceed 2000 characters.");
      return;
    }

    /* -------------------------------------------------------
       EMAIL VALIDATION
    ------------------------------------------------------- */

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    /* -------------------------------------------------------
       SUBMIT
    ------------------------------------------------------- */

    try {
      setSubmitting(true);

      const response = await apiPost("/api/inquiries", {
        name,
        email,
        phone,
        subject,
        message,
        destinationId: formData.destinationId || null,
        packageId: formData.packageId || null,
      });

      if (response?.success === false) {
        throw new Error(response.message || "Failed to submit inquiry.");
      }

      setSuccessMessage(
        response?.message ||
          "Your inquiry was submitted successfully. Our team will contact you soon.",
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        destinationId: "",
        packageId: "",
      });
    } catch (error) {
      console.error("Inquiry submission error:", error);

      setErrorMessage(
        error?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================================
     FIND SELECTED NAMES
  ========================================================= */

  const selectedDestination = destinations.find(
    (item) => getId(item) === formData.destinationId,
  );

  const selectedPackage = packages.find(
    (item) => getId(item) === formData.packageId,
  );

  /* =========================================================
     PAGE UI
  ========================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f8f6] text-slate-900">
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden bg-[#062f2b]">
          {/* Decorative background */}
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>

            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                <Sparkles size={14} />
                Get in Touch
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Plan Your Next
                <span className="block text-emerald-300">Journey With Us</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Tell us where you want to go, choose your package, and our SST
                Travels team will help you plan a comfortable and memorable
                journey.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            {/* =================================================
                LEFT CONTACT INFORMATION
            ================================================= */}

            <div className="h-fit">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-8">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                    SST Travels
                  </span>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    Contact Information
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Have questions about destinations, packages, hotels,
                    transportation, or your upcoming trip? We are here to help.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* EMAIL */}

                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=manikandan.m20060726@gmail.com"
                    className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Mail size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">Email</h3>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        manikandan.m20060726@gmail.com
                      </p>
                    </div>
                  </a>

                  {/* PHONE */}

                  <a
                    href="tel:+917708985232"
                    className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Phone size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">Phone</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        +91 7708985232
                      </p>
                    </div>
                  </a>

                  {/* LOCATION */}

                  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <MapPin size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">Location</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Tamil Nadu, India
                      </p>
                    </div>
                  </div>

                  {/* SUPPORT */}

                  <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <MessageSquare size={19} />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Travel Support
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Ask us about destinations, packages, transport, and trip
                        planning.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected information */}

                {(selectedDestination || selectedPackage) && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 size={17} />
                      Your trip selection
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedDestination && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                            Destination
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {getDestinationName(selectedDestination)}
                          </p>
                        </div>
                      )}

                      {selectedPackage && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                            Package
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {getPackageName(selectedPackage)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                INQUIRY FORM
            ================================================= */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              <div className="mb-8">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
                  Start Your Journey
                </span>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Submit an Inquiry
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Fill in your details and our travel team will contact you with
                  the information you need.
                </p>
              </div>

              {/* SUCCESS */}

              {successMessage && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                  <div>
                    <p className="font-semibold">Inquiry submitted</p>

                    <p className="mt-1">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* ERROR */}

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p className="font-semibold">Unable to submit</p>

                  <p className="mt-1">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {/* NAME + PHONE */}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full Name *
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      minLength={2}
                      maxLength={100}
                      required
                      autoComplete="name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Phone Number *
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      maxLength={20}
                      required
                      autoComplete="tel"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address *
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    maxLength={150}
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* DESTINATION */}

                <div>
                  <label
                    htmlFor="destinationId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Select Destination
                  </label>

                  <div className="relative">
                    <select
                      id="destinationId"
                      name="destinationId"
                      value={formData.destinationId}
                      onChange={handleChange}
                      disabled={loadingOptions || submitting}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {loadingOptions
                          ? "Loading destinations..."
                          : "Choose a destination"}
                      </option>

                      {destinations.map((destination) => (
                        <option
                          key={getId(destination)}
                          value={getId(destination)}
                        >
                          {getDestinationName(destination)}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* PACKAGE */}

                <div>
                  <label
                    htmlFor="packageId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Select Package
                  </label>

                  <div className="relative">
                    <select
                      id="packageId"
                      name="packageId"
                      value={formData.packageId}
                      onChange={handleChange}
                      disabled={loadingOptions || submitting}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        {loadingOptions
                          ? "Loading packages..."
                          : "Choose a package"}
                      </option>

                      {packages.map((tourPackage) => (
                        <option
                          key={getId(tourPackage)}
                          value={getId(tourPackage)}
                        >
                          {getPackageName(tourPackage)}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                {/* SUBJECT */}

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What is your inquiry about?"
                    maxLength={150}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* MESSAGE */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Message *
                    </label>

                    <span className="text-xs text-slate-400">
                      {formData.message.length}/2000
                    </span>
                  </div>

                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your travel requirements..."
                    rows={6}
                    minLength={5}
                    maxLength={2000}
                    required
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:bg-[#066b4d] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={19} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                      Submit Inquiry
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-5 text-slate-400">
                  By submitting this inquiry, our SST Travels team will use your
                  details to respond to your request.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* =====================================================
            BOTTOM CTA
        ===================================================== */}

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#062f2b] px-6 py-10 sm:px-10 lg:px-14">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Travel With SST Travels
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  Your journey starts with a conversation.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Tell us what you need and we will help you plan your trip
                  comfortably.
                </p>
              </div>

              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=manikandan.m20060726@gmail.com"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#062f2b] transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <Mail size={18} />
                Email Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
