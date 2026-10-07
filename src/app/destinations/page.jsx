"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Globe2,
  LoaderCircle,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const FALLBACK_IMAGE = "/images/tourism-placeholder.jpg";

/* =========================================================
   IMAGE HELPER
========================================================= */

function getImageUrl(image) {
  if (!image) {
    return FALLBACK_IMAGE;
  }

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    if (image.url) {
      return image.url;
    }

    if (image.secure_url) {
      return image.secure_url;
    }
  }

  return FALLBACK_IMAGE;
}

/* =========================================================
   LOCATION HELPER
========================================================= */

function getLocation(destination) {
  return (
    [destination.state, destination.country].filter(Boolean).join(", ") ||
    "India"
  );
}

/* =========================================================
   DESTINATIONS PAGE
========================================================= */

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* =======================================================
     LOAD DESTINATIONS
  ======================================================= */

  useEffect(() => {
    async function loadDestinations() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/public/destinations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load destinations.");
        }

        setDestinations(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error("Load destinations error:", error);

        setErrorMessage(error?.message || "Unable to load destinations.");
      } finally {
        setLoading(false);
      }
    }

    loadDestinations();
  }, []);

  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  const filteredDestinations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return destinations;
    }

    return destinations.filter((destination) => {
      const name = (destination.name || "").toLowerCase();
      const state = (destination.state || "").toLowerCase();
      const country = (destination.country || "").toLowerCase();
      const description = (destination.description || "").toLowerCase();

      return (
        name.includes(search) ||
        state.includes(search) ||
        country.includes(search) ||
        description.includes(search)
      );
    });
  }, [destinations, searchTerm]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f8f6] text-slate-900">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden bg-[#071510]">
          {/* Decorative Glow */}

          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 text-center sm:py-24 lg:px-8 lg:py-28">
            {/* =================================================
                BACK TO HOME
            ================================================= */}

            <div className="mb-8 flex justify-start">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Link>
            </div>

            {/* =================================================
                ICON
            ================================================= */}

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 shadow-lg shadow-emerald-950/20">
              <Globe2 size={30} className="text-emerald-400" />
            </div>

            {/* =================================================
                SMALL LABEL
            ================================================= */}

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <Sparkles size={13} />
              Explore with SST Travels
            </div>

            {/* =================================================
                HEADING
            ================================================= */}

            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Explore Amazing
              <span className="block text-emerald-400">Destinations</span>
            </h1>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Discover beautiful places, rich culture, breathtaking experiences,
              and unforgettable journeys across incredible destinations.
            </p>
          </div>
        </section>

        {/* =================================================
            SEARCH
        ================================================= */}

        <section className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="-mt-7 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10">
              <Search size={19} className="shrink-0 text-slate-400" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search destinations, states, or countries..."
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="shrink-0 text-xs font-semibold text-slate-400 transition hover:text-emerald-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            DESTINATIONS
        ================================================= */}

        <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          {/* Section Header */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <span className="h-px w-7 bg-emerald-500" />
                Discover New Places
              </div>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Popular Destinations
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Find your next adventure and explore destinations waiting to be
                discovered.
              </p>
            </div>

            {!loading && !errorMessage && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">
                  {filteredDestinations.length}
                </span>
                {filteredDestinations.length === 1
                  ? "destination"
                  : "destinations"}{" "}
                found
              </div>
            )}
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-emerald-600"
                  />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading destinations...
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && errorMessage && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <MapPin size={22} className="text-red-500" />
              </div>

              <h3 className="mt-4 font-bold text-red-700">
                Unable to load destinations
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-600">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading && !errorMessage && filteredDestinations.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <Globe2 size={30} className="text-emerald-500" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                No Destinations Found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn&apos;t find any destination matching your search. Try
                another location.
              </p>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* =================================================
              DESTINATION CARDS
          ================================================= */}

          {!loading && !errorMessage && filteredDestinations.length > 0 && (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDestinations.map((destination) => {
                const slug = destination.slug || destination._id;

                const imageUrl = getImageUrl(
                  destination.coverImage ||
                    destination.image ||
                    destination.imageUrl,
                );

                /*
                    IMPORTANT:
                    This page was opened from the navbar,
                    so tell the detail page that its back
                    button should return here.
                  */
                const detailHref = `/destinations/${encodeURIComponent(
                  slug,
                )}?from=destinations`;

                return (
                  <article
                    key={destination._id}
                    className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-900/10"
                  >
                    {/* ================= IMAGE ================= */}

                    <Link
                      href={detailHref}
                      className="relative block overflow-hidden"
                    >
                      <img
                        src={imageUrl}
                        alt={destination.name || "Travel destination"}
                        className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      {/* Image Gradient */}

                      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Explore Badge */}

                      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                        <Compass size={13} />
                        Explore
                      </div>

                      {/* Location */}

                      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs font-medium text-white">
                        <MapPin size={14} />
                        {getLocation(destination)}
                      </div>
                    </Link>

                    {/* ================= CONTENT ================= */}

                    <div className="p-6">
                      <Link href={detailHref} className="block">
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 transition duration-200 group-hover:text-emerald-600">
                          {destination.name || "Unnamed Destination"}
                        </h3>
                      </Link>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                        {destination.description ||
                          "Discover this beautiful destination and its unique travel experiences."}
                      </p>

                      {/* Divider */}

                      <div className="my-5 h-px bg-slate-100" />

                      {/* Explore Link */}

                      <Link
                        href={detailHref}
                        className="group/link inline-flex items-center gap-2 text-sm font-bold text-emerald-600 transition hover:text-emerald-700"
                      >
                        Explore Destination
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 transition duration-300 group-hover/link:bg-emerald-100">
                          <ArrowRight
                            size={15}
                            className="transition-transform duration-300 group-hover/link:translate-x-0.5"
                          />
                        </span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            BOTTOM TRAVEL MESSAGE
        ================================================= */}

        {!loading && !errorMessage && filteredDestinations.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-[#071510] px-6 py-10 text-center sm:px-10">
              {/* Decorative Glow */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />

              <div className="relative">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Compass size={21} className="text-emerald-400" />
                </div>

                <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                  Your next adventure starts here.
                </h2>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Explore new places, experience new cultures, and create
                  memories that last a lifetime.
                </p>

                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-950/30"
                >
                  Plan Your Trip
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
