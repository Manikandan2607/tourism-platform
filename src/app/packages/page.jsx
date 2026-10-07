"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  MapPin,
  PackageOpen,
  Plane,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

/* =========================================================
   BASIC SAFE VALUE
========================================================= */

function safeString(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeString(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    if (value.name !== undefined) {
      return safeString(value.name);
    }

    if (value.title !== undefined) {
      return safeString(value.title);
    }

    if (value.label !== undefined) {
      return safeString(value.label);
    }

    if (value.value !== undefined) {
      return safeString(value.value);
    }

    if (value.city !== undefined) {
      return safeString(value.city);
    }

    return fallback;
  }

  return fallback;
}

/* =========================================================
   DURATION
========================================================= */

function formatDuration(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return `${value} ${value === 1 ? "Day" : "Days"}`;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const days = value.days;
    const nights = value.nights;

    if (
      days !== undefined &&
      days !== null &&
      nights !== undefined &&
      nights !== null
    ) {
      const dayNumber = Number(days);
      const nightNumber = Number(nights);

      const dayText = Number.isFinite(dayNumber)
        ? `${dayNumber} ${dayNumber === 1 ? "Day" : "Days"}`
        : safeString(days);

      const nightText = Number.isFinite(nightNumber)
        ? `${nightNumber} ${nightNumber === 1 ? "Night" : "Nights"}`
        : safeString(nights);

      return `${dayText} / ${nightText}`;
    }

    if (days !== undefined && days !== null) {
      const dayNumber = Number(days);

      return Number.isFinite(dayNumber)
        ? `${dayNumber} ${dayNumber === 1 ? "Day" : "Days"}`
        : safeString(days);
    }

    if (nights !== undefined && nights !== null) {
      const nightNumber = Number(nights);

      return Number.isFinite(nightNumber)
        ? `${nightNumber} ${nightNumber === 1 ? "Night" : "Nights"}`
        : safeString(nights);
    }

    if (value.duration !== undefined) {
      return formatDuration(value.duration);
    }

    return "";
  }

  return safeString(value);
}

/* =========================================================
   IMAGE
========================================================= */

function normalizeImage(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const url = value.trim();

    if (!url) {
      return "";
    }

    if (
      url.startsWith("/") ||
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:")
    ) {
      return url;
    }

    return `/${url}`;
  }

  if (typeof value === "object") {
    return (
      normalizeImage(value.url) ||
      normalizeImage(value.secure_url) ||
      normalizeImage(value.secureUrl) ||
      normalizeImage(value.src) ||
      normalizeImage(value.image) ||
      normalizeImage(value.imageUrl) ||
      normalizeImage(value.path) ||
      ""
    );
  }

  return "";
}

function getImage(item) {
  if (!item) {
    return "";
  }

  const direct =
    normalizeImage(item.coverImage) ||
    normalizeImage(item.coverImageUrl) ||
    normalizeImage(item.image) ||
    normalizeImage(item.imageUrl) ||
    normalizeImage(item.thumbnail) ||
    normalizeImage(item.thumbnailUrl) ||
    normalizeImage(item.photo) ||
    normalizeImage(item.photoUrl) ||
    normalizeImage(item.bannerImage);

  if (direct) {
    return direct;
  }

  const galleries = [
    item.gallery,
    item.images,
    item.photos,
    item.galleryImages,
  ];

  for (const gallery of galleries) {
    if (!Array.isArray(gallery)) {
      continue;
    }

    for (const image of gallery) {
      const url = normalizeImage(image);

      if (url) {
        return url;
      }
    }
  }

  return "";
}

/* =========================================================
   PRICE
========================================================= */

function getPrice(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  }

  if (typeof value === "object") {
    return getPrice(value.amount ?? value.value ?? value.min ?? value.price);
  }

  return null;
}

/* =========================================================
   DESTINATION
========================================================= */

function getDestination(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      safeString(value.name) ||
      safeString(value.title) ||
      safeString(value.city) ||
      safeString(value.destinationName) ||
      ""
    );
  }

  return safeString(value);
}

/* =========================================================
   EXTRACT API ARRAY
========================================================= */

function extractPackages(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.packages)) {
    return data.packages;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.packages)) {
    return data.data.packages;
  }

  if (Array.isArray(data?.data?.results)) {
    return data.data.results;
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  return [];
}

/* =========================================================
   IMPORTANT:
   NORMALIZE THE WHOLE PACKAGE HERE
========================================================= */

function normalizePackage(item, index) {
  if (!item || typeof item !== "object") {
    return {
      id: `package-${index}`,
      slug: "",
      title: "Travel Package",
      description:
        "Enjoy a carefully planned travel experience with SST Travels.",
      image: "",
      duration: "",
      destination: "",
      capacity: "",
      price: null,
      currency: "INR",
    };
  }

  const id = String(item._id || item.id || item.slug || `package-${index}`);

  const slug = String(item.slug || item._id || item.id || "");

  const title = safeString(
    item.title ?? item.name ?? item.packageName ?? item.packageTitle,
    "Travel Package",
  );

  const description = safeString(
    item.shortDescription ?? item.description ?? item.summary ?? item.details,
    "Enjoy a carefully planned travel experience with SST Travels.",
  );

  /*
   * THIS IS THE IMPORTANT FIX.
   *
   * If API returns:
   *
   * duration: {
   *   days: 5,
   *   nights: 4
   * }
   *
   * normalized duration becomes:
   *
   * "5 Days / 4 Nights"
   */

  const duration = formatDuration(
    item.duration ?? item.durationText ?? item.estimatedDuration,
  );

  const destination =
    getDestination(item.destination) ||
    safeString(item.destinationName) ||
    safeString(item.location) ||
    safeString(item.city);

  const capacity = safeString(
    item.capacity ??
      item.maxGuests ??
      item.guests ??
      item.groupSize ??
      item.maxPeople,
  );

  const price = getPrice(
    item.price ?? item.amount ?? item.startingPrice ?? item.cost,
  );

  const currency = safeString(
    item.currency ?? item.priceCurrency ?? "INR",
    "INR",
  ).toUpperCase();

  const image = getImage(item);

  /*
   * Return a completely flat object.
   *
   * NO duration object survives.
   * NO destination object survives.
   * NO price object survives.
   */

  return {
    id,
    slug,
    title,
    description,
    image,
    duration,
    destination,
    capacity,
    price,
    currency,
  };
}

/* =========================================================
   PACKAGE CARD
========================================================= */

function PackageCard({ item }) {
  /*
   * item is already normalized.
   */

  const {
    id,
    slug,
    title,
    description,
    image,
    duration,
    destination,
    capacity,
    price,
    currency,
  } = item;

  const href = slug ? `/packages/${encodeURIComponent(slug)}` : "/packages";

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-[#dceee8] bg-white shadow-[0_15px_45px_rgba(0,70,55,0.07)] transition-all duration-500 hover:-translate-y-2 hover:border-[#b8dfd3] hover:shadow-[0_25px_65px_rgba(0,70,55,0.14)]"
    >
      {/* IMAGE */}

      <div className="relative h-[250px] overflow-hidden bg-[#dcefe8]">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e5f7f0] to-[#cbe9dd]">
            <PackageOpen
              size={55}
              strokeWidth={1.5}
              className="text-[#07805f]"
            />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
          <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-md">
            SST Travels
          </span>

          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#075847] shadow-sm">
            Explore
          </span>
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <h3 className="text-2xl font-black leading-tight text-white drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>

      {/* CONTENT */}

      <div className="p-6">
        <p className="line-clamp-3 text-sm leading-6 text-[#6d837d]">
          {description}
        </p>

        {(destination || duration || capacity) && (
          <div className="mt-5 space-y-3">
            {destination && (
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#617770]">
                <MapPin size={16} className="shrink-0 text-[#07805f]" />

                <span className="truncate">{destination}</span>
              </div>
            )}

            {duration && (
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#617770]">
                <Clock3 size={16} className="shrink-0 text-[#07805f]" />

                <span>{duration}</span>
              </div>
            )}

            {capacity && (
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#617770]">
                <Users size={16} className="shrink-0 text-[#07805f]" />

                <span>{capacity}</span>
              </div>
            )}
          </div>
        )}

        {/* PRICE */}

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#edf3f0] pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8aa19a]">
              Starting From
            </p>

            <p className="mt-1 text-xl font-black text-[#075847]">
              {price !== null
                ? currency === "USD"
                  ? `$${price.toLocaleString("en-IN")}`
                  : `₹${price.toLocaleString("en-IN")}`
                : "Contact Us"}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e5f7f0] text-[#07805f] transition-all duration-300 group-hover:bg-[#07805f] group-hover:text-white">
            <ArrowRight
              size={19}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadPackages() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/public/packages", {
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load travel packages.");
        }

        const rawPackages = extractPackages(data);

        /*
         * IMPORTANT:
         *
         * The API objects are converted HERE.
         *
         * From this point onward, the UI NEVER
         * receives the original package object.
         */

        const normalizedPackages = rawPackages.map((item, index) =>
          normalizePackage(item, index),
        );

        if (!mounted) {
          return;
        }

        setPackages(normalizedPackages);
      } catch (requestError) {
        console.error("Packages fetch error:", requestError);

        if (mounted) {
          setPackages([]);

          setError(
            requestError?.message ||
              "Travel packages are currently unavailable.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPackages();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return packages;
    }

    return packages.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.destination.toLowerCase().includes(query) ||
        item.duration.toLowerCase().includes(query)
      );
    });
  }, [packages, search]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-x-hidden bg-[#f4faf7]">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden bg-[#064c40]">
          <div className="pointer-events-none absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-[#0a8c6d]/30 blur-[120px]" />

          <div className="pointer-events-none absolute -right-48 top-10 h-[550px] w-[550px] rounded-full bg-[#47d3aa]/15 blur-[130px]" />

          <div className="pointer-events-none absolute bottom-[-220px] left-1/2 h-[400px] w-[900px] -translate-x-1/2 rounded-full bg-[#51d6ae]/10 blur-[120px]" />

          <div className="relative mx-auto max-w-[1450px] px-5 pb-32 pt-28 sm:px-8 lg:px-10">
            {/* =================================================
                BACK TO HOME
            ================================================= */}

            <div className="mb-9">
              <Link
                href="/"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white hover:text-[#075847]"
              >
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />

                <span>Back to Home</span>
              </Link>
            </div>

            {/* HERO */}

            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                <Sparkles size={14} />
                Discover Your Next Journey
              </div>

              <h1 className="text-5xl font-black leading-[1.05] tracking-[-2px] text-white sm:text-6xl lg:text-[72px]">
                Explore Our
                <span className="block text-[#55dfb1]">Travel Packages</span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-emerald-100/90 sm:text-base">
                Discover carefully planned travel experiences, beautiful
                destinations, and unforgettable journeys with SST Travels.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
                  <MapPin size={14} />
                  Beautiful Destinations
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
                  <PackageOpen size={14} />
                  Curated Packages
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
                  <Clock3 size={14} />
                  Flexible Trips
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[-1px] left-[-5%] h-12 w-[110%] rounded-[50%_50%_0_0] bg-[#f4faf7]" />
        </section>

        {/* =================================================
            SEARCH
        ================================================= */}

        <section className="relative z-20 -mt-7 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[770px]">
            <div className="rounded-[24px] border-[9px] border-white bg-white shadow-[0_20px_55px_rgba(0,70,55,0.13)]">
              <div className="flex items-center rounded-[15px] border border-[#dce8e4] bg-[#f8fbfa] px-4">
                <Search size={19} className="shrink-0 text-[#07805f]" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search packages or destinations..."
                  className="h-12 w-full bg-transparent px-4 text-sm text-slate-800 outline-none placeholder:text-[#8aa19a]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            PACKAGES
        ================================================= */}

        <section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1380px]">
            {/* HEADER */}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#07805f]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#07805f]" />
                  Find Your Journey
                </div>

                <h2 className="text-3xl font-black tracking-[-1px] text-[#073f35] sm:text-4xl">
                  Available Packages
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#71857f]">
                  Choose a travel experience that fits your destination,
                  duration, and budget.
                </p>
              </div>

              {!loading && !error && (
                <div className="inline-flex w-fit items-center rounded-full border border-[#d8eae4] bg-white px-4 py-2 text-xs font-bold text-[#07805f] shadow-sm">
                  {filteredPackages.length}{" "}
                  {filteredPackages.length === 1 ? "package" : "packages"} found
                </div>
              )}
            </div>

            {/* LOADING */}

            {loading && (
              <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({
                  length: 3,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[28px] bg-white shadow-sm"
                  >
                    <div className="h-[250px] animate-pulse bg-[#dcefe8]" />

                    <div className="space-y-4 p-6">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-[#e3efeb]" />

                      <div className="h-4 w-full animate-pulse rounded bg-[#edf4f1]" />

                      <div className="h-4 w-5/6 animate-pulse rounded bg-[#edf4f1]" />

                      <div className="h-10 animate-pulse rounded bg-[#edf4f1]" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR */}

            {!loading && error && (
              <div className="mt-12 rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <PackageOpen size={26} />
                </div>

                <h3 className="mt-5 text-xl font-black text-slate-900">
                  Packages unavailable
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  {error}
                </p>

                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#073b32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#05644f]"
                >
                  <ArrowLeft size={17} />
                  Back to Home
                </Link>
              </div>
            )}

            {/* EMPTY */}

            {!loading && !error && filteredPackages.length === 0 && (
              <div className="mt-12 rounded-[28px] border border-[#dceee8] bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf8f3] text-[#07805f]">
                  <Search size={25} />
                </div>

                <h3 className="mt-5 text-xl font-black text-[#073f35]">
                  No packages found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#71857f]">
                  Try searching with a different package name or destination.
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-6 rounded-xl bg-[#073b32] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#05644f]"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* PACKAGE GRID */}

            {!loading && !error && filteredPackages.length > 0 && (
              <div className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
                {filteredPackages.map((item) => (
                  <PackageCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            CTA
        ================================================= */}

        <section className="px-5 pb-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[35px] bg-[#064c40] px-6 py-14 text-center shadow-[0_20px_55px_rgba(0,70,55,0.12)] sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
              <Plane size={25} />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Plan Your Next Adventure
            </p>

            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Ready to explore with SST Travels?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-emerald-100/80">
              Tell us where you want to go and let us help you plan a
              comfortable and memorable journey.
            </p>

            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-[#075847] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-50"
            >
              Plan Your Trip
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
