"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  PackageOpen,
  Phone,
  Users,
} from "lucide-react";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

/* =========================================================
   SAFE VALUE HELPERS
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

    if (value.text !== undefined) {
      return safeString(value.text);
    }

    if (value.description !== undefined) {
      return safeString(value.description);
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

function normalizeImageUrl(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const url = value.trim();

    if (!url) {
      return "";
    }

    if (
      !url.startsWith("/") &&
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("data:")
    ) {
      return `/${url}`;
    }

    return url;
  }

  if (typeof value === "object") {
    return (
      normalizeImageUrl(value.url) ||
      normalizeImageUrl(value.secure_url) ||
      normalizeImageUrl(value.secureUrl) ||
      normalizeImageUrl(value.src) ||
      normalizeImageUrl(value.image) ||
      normalizeImageUrl(value.imageUrl) ||
      normalizeImageUrl(value.path) ||
      ""
    );
  }

  return "";
}

function getImages(item) {
  if (!item) {
    return [];
  }

  const images = [];

  const directImages = [
    item.coverImage,
    item.coverImageUrl,
    item.image,
    item.imageUrl,
    item.bannerImage,
    item.thumbnail,
    item.thumbnailUrl,
  ];

  for (const image of directImages) {
    const url = normalizeImageUrl(image);

    if (url && !images.includes(url)) {
      images.push(url);
    }
  }

  const collections = [
    item.gallery,
    item.images,
    item.photos,
    item.galleryImages,
    item.media,
  ];

  for (const collection of collections) {
    if (!Array.isArray(collection)) {
      continue;
    }

    for (const image of collection) {
      const url = normalizeImageUrl(image);

      if (url && !images.includes(url)) {
        images.push(url);
      }
    }
  }

  return images;
}

/* =========================================================
   TITLE
========================================================= */

function getPackageTitle(item) {
  return safeString(
    item?.title ?? item?.name ?? item?.packageName ?? item?.packageTitle,
    "Travel Package",
  );
}

/* =========================================================
   DESCRIPTION
========================================================= */

function getPackageDescription(item) {
  return safeString(
    item?.description ?? item?.shortDescription ?? item?.summary,
    "Discover a comfortable and memorable travel experience with SST Travels.",
  );
}

/* =========================================================
   PRICE
========================================================= */

function getPackagePrice(item) {
  const value =
    item?.price ?? item?.amount ?? item?.startingPrice ?? item?.cost ?? null;

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
    return getPackagePrice({
      price: value.amount ?? value.value ?? value.min ?? value.price,
    });
  }

  return null;
}

/* =========================================================
   CURRENCY
========================================================= */

function getCurrency(item) {
  const currency = safeString(
    item?.currency ?? item?.priceCurrency ?? "INR",
    "INR",
  );

  return currency.toUpperCase();
}

/* =========================================================
   DESTINATION
========================================================= */

function getDestinationName(item) {
  const value = item?.destination;

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return (
      safeString(value.name) ||
      safeString(value.title) ||
      safeString(value.city) ||
      safeString(value.destinationName) ||
      ""
    );
  }

  return (
    safeString(item?.destinationName) ||
    safeString(item?.location) ||
    safeString(item?.city)
  );
}

/* =========================================================
   CAPACITY
========================================================= */

function getCapacity(item) {
  const value =
    item?.capacity ??
    item?.maxGuests ??
    item?.guests ??
    item?.groupSize ??
    item?.maxPeople ??
    "";

  return safeString(value);
}

/* =========================================================
   HIGHLIGHTS
========================================================= */

function getHighlights(item) {
  const source = Array.isArray(item?.highlights)
    ? item.highlights
    : Array.isArray(item?.features)
      ? item.features
      : Array.isArray(item?.included)
        ? item.included
        : [];

  return source
    .map((highlight) => {
      if (typeof highlight === "string" || typeof highlight === "number") {
        return String(highlight);
      }

      if (highlight && typeof highlight === "object") {
        return (
          safeString(highlight.title) ||
          safeString(highlight.name) ||
          safeString(highlight.label) ||
          safeString(highlight.description) ||
          safeString(highlight.text)
        );
      }

      return "";
    })
    .filter(Boolean);
}

/* =========================================================
   ITINERARY
========================================================= */

function getItinerary(item) {
  const source = Array.isArray(item?.itinerary)
    ? item.itinerary
    : Array.isArray(item?.days)
      ? item.days
      : [];

  return source.map((day, index) => {
    if (typeof day === "string" || typeof day === "number") {
      return {
        title: `Day ${index + 1}`,
        description: String(day),
      };
    }

    if (day && typeof day === "object") {
      const title =
        safeString(day.title) ||
        safeString(day.day) ||
        safeString(day.name) ||
        `Day ${index + 1}`;

      const descriptionValue =
        day.description ??
        day.details ??
        day.activities ??
        day.activity ??
        day.summary ??
        "";

      return {
        title,
        description: safeString(descriptionValue),
      };
    }

    return {
      title: `Day ${index + 1}`,
      description: "",
    };
  });
}

/* =========================================================
   EXTRACT PACKAGE
========================================================= */

function extractPackage(data) {
  if (!data) {
    return null;
  }

  if (data.package && typeof data.package === "object") {
    return data.package;
  }

  if (data.data?.package && typeof data.data.package === "object") {
    return data.data.package;
  }

  if (data.data && !Array.isArray(data.data) && typeof data.data === "object") {
    return data.data;
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    return data;
  }

  return null;
}

/* =========================================================
   NORMALIZE PACKAGE
========================================================= */

function normalizePackage(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const images = getImages(item);

  return {
    id: safeString(item._id ?? item.id ?? item.slug),

    slug: safeString(item.slug ?? item._id ?? item.id),

    title: getPackageTitle(item),

    description: getPackageDescription(item),

    price: getPackagePrice(item),

    currency: getCurrency(item),

    duration: formatDuration(
      item.duration ?? item.durationText ?? item.estimatedDuration ?? item.days,
    ),

    destination: getDestinationName(item),

    capacity: getCapacity(item),

    images,

    highlights: getHighlights(item),

    itinerary: getItinerary(item),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function PackageDetailPage({ params }) {
  const resolvedParams = use(params);

  const slug = resolvedParams?.slug;

  const [tourPackage, setTourPackage] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  /* =======================================================
     FETCH PACKAGE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadPackage() {
      if (!slug) {
        if (mounted) {
          setError("Package was not found.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/public/packages/${encodeURIComponent(slug)}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load this package.");
        }

        const rawPackage = extractPackage(data);

        if (!rawPackage) {
          throw new Error("Package not found.");
        }

        /*
         * IMPORTANT:
         *
         * Convert the API object into a safe
         * UI object BEFORE putting it into state.
         *
         * Therefore:
         *
         * duration.days/nights
         *
         * becomes:
         *
         * "5 Days / 4 Nights"
         */

        const normalizedPackage = normalizePackage(rawPackage);

        if (!normalizedPackage) {
          throw new Error("Invalid package data.");
        }

        if (mounted) {
          setTourPackage(normalizedPackage);

          setActiveImage(0);
        }
      } catch (requestError) {
        console.error("Package detail fetch error:", requestError);

        if (mounted) {
          setError(requestError?.message || "Unable to load this package.");

          setTourPackage(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPackage();

    return () => {
      mounted = false;
    };
  }, [slug]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#f4faf7] px-5 pb-20 pt-32 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1380px]">
            <div className="flex min-h-[55vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5f7f0] text-[#07805f]">
                  <LoaderCircle size={30} className="animate-spin" />
                </div>

                <h1 className="mt-5 text-xl font-black text-[#073f35]">
                  Loading package...
                </h1>

                <p className="mt-2 text-sm text-[#71857f]">
                  Please wait while we prepare the details.
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !tourPackage) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#f4faf7] px-5 pb-20 pt-32 sm:px-8 lg:px-10">
          <div className="mx-auto flex min-h-[60vh] max-w-[1380px] items-center justify-center">
            <div className="w-full max-w-xl rounded-[30px] border border-[#dceee8] bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,70,55,0.08)] sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf8f3] text-[#07805f]">
                <PackageOpen size={28} />
              </div>

              <h1 className="mt-6 text-2xl font-black text-[#073f35]">
                Package not found
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#71857f]">
                {error ||
                  "The travel package you requested could not be found."}
              </p>

              {/* BACK BUTTON */}

              <Link
                href="/packages"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#07805f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#056f4e]"
              >
                <ArrowLeft size={17} />
                Back to Packages
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </>
    );
  }

  /* =======================================================
     NORMALIZED VALUES
  ======================================================= */

  const images = tourPackage.images || [];

  const title = tourPackage.title;

  const description = tourPackage.description;

  const price = tourPackage.price;

  const currency = tourPackage.currency;

  const duration = tourPackage.duration;

  const destination = tourPackage.destination;

  const capacity = tourPackage.capacity;

  const highlights = tourPackage.highlights || [];

  const itinerary = tourPackage.itinerary || [];

  const currentImage = images[activeImage] || "";

  const packageId = tourPackage.id || tourPackage.slug || slug;

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-x-hidden bg-[#f4faf7]">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden bg-[#064c40]">
          <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-[#0c8b6d]/20 blur-[120px]" />

          <div className="pointer-events-none absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-[#55c8a6]/10 blur-[120px]" />

          <div className="relative mx-auto max-w-[1450px] px-5 pb-28 pt-24 sm:px-8 lg:px-10">
            {/* =================================================
                BACK TO PACKAGES
            ================================================= */}

            <div className="mb-10">
              <Link
                href="/packages"
                className="group inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white hover:text-[#075847]"
              >
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />

                <span>Back to Packages</span>
              </Link>
            </div>

            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-emerald-100 backdrop-blur-md">
                <PackageOpen size={14} />
                SST Travels Package
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-[-1.5px] text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-emerald-100/90 sm:text-base">
                {description}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {destination && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                    <MapPin size={15} />

                    {destination}
                  </div>
                )}

                {duration && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                    <Clock3 size={15} />

                    {duration}
                  </div>
                )}

                {capacity && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                    <Users size={15} />

                    {capacity}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-[-1px] left-[-5%] h-10 w-[110%] rounded-[50%_50%_0_0] bg-[#f4faf7]" />
        </section>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <section className="px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="mx-auto max-w-[1380px]">
            <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
              {/* =================================================
                  IMAGE GALLERY
              ================================================= */}

              <div>
                <div className="overflow-hidden rounded-[30px] border border-[#dceee8] bg-white p-3 shadow-[0_20px_55px_rgba(0,70,55,0.08)]">
                  <div className="relative h-[350px] overflow-hidden rounded-[24px] bg-[#dcefe8] sm:h-[460px] lg:h-[520px]">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#e3f7ef] to-[#c9e8dd]">
                        <PackageOpen
                          size={70}
                          strokeWidth={1.3}
                          className="text-[#07805f]"
                        />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>

                  {images.length > 1 && (
                    <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {images.slice(0, 5).map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          className={`relative h-20 overflow-hidden rounded-xl border-2 transition-all ${
                            activeImage === index
                              ? "border-[#07805f] ring-2 ring-[#07805f]/10"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${title} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                  PACKAGE SUMMARY
              ================================================= */}

              <div>
                <div className="rounded-[30px] border border-[#dceee8] bg-white p-7 shadow-[0_20px_55px_rgba(0,70,55,0.08)] sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07805f]">
                    Package Details
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-[-1px] text-[#073f35]">
                    {title}
                  </h2>

                  {price !== null && (
                    <div className="mt-7 rounded-2xl bg-[#effbf6] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#789088]">
                        Starting From
                      </p>

                      <p className="mt-1 text-3xl font-black text-[#075847]">
                        {currency === "USD"
                          ? `$${Number(price).toLocaleString("en-IN")}`
                          : `₹${Number(price).toLocaleString("en-IN")}`}
                      </p>
                    </div>
                  )}

                  <div className="mt-7 space-y-3">
                    {destination && (
                      <div className="flex items-center gap-3 rounded-2xl border border-[#edf3f0] bg-[#fafcfb] p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f3] text-[#07805f]">
                          <MapPin size={19} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#8aa098]">
                            Destination
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {destination}
                          </p>
                        </div>
                      </div>
                    )}

                    {duration && (
                      <div className="flex items-center gap-3 rounded-2xl border border-[#edf3f0] bg-[#fafcfb] p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f3] text-[#07805f]">
                          <Clock3 size={19} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#8aa098]">
                            Duration
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {duration}
                          </p>
                        </div>
                      </div>
                    )}

                    {capacity && (
                      <div className="flex items-center gap-3 rounded-2xl border border-[#edf3f0] bg-[#fafcfb] p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf8f3] text-[#07805f]">
                          <Users size={19} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#8aa098]">
                            Group Size
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {capacity}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/contact?packageId=${encodeURIComponent(packageId)}`}
                    className="group mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#07805f] px-6 py-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(0,110,80,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#056f4e]"
                  >
                    Plan This Trip
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>

                  <a
                    href="tel:+917708985232"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dceee8] bg-white px-6 py-4 text-sm font-bold text-[#075847] transition hover:border-[#a8d9ca] hover:bg-[#f3fbf8]"
                  >
                    <Phone size={17} />
                    Call SST Travels
                  </a>
                </div>
              </div>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[30px] border border-[#dceee8] bg-white p-7 shadow-[0_15px_45px_rgba(0,70,55,0.06)] sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07805f]">
                  About This Package
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#073f35] sm:text-3xl">
                  Your Journey, Planned With Care
                </h2>

                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#687f77] sm:text-base">
                  {description}
                </p>
              </div>

              {/* =================================================
                  HIGHLIGHTS
              ================================================= */}

              {highlights.length > 0 && (
                <div className="rounded-[30px] border border-[#dceee8] bg-white p-7 shadow-[0_15px_45px_rgba(0,70,55,0.06)] sm:p-9">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07805f]">
                    Highlights
                  </p>

                  <div className="mt-5 space-y-3">
                    {highlights.map((highlight, index) => (
                      <div
                        key={`${highlight}-${index}`}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2
                          size={19}
                          className="mt-0.5 shrink-0 text-[#07805f]"
                        />

                        <span className="text-sm leading-6 text-[#526b63]">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                ITINERARY
            ================================================= */}

            {itinerary.length > 0 && (
              <section className="mt-10 rounded-[30px] border border-[#dceee8] bg-white p-7 shadow-[0_15px_45px_rgba(0,70,55,0.06)] sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#07805f]">
                  Itinerary
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#073f35] sm:text-3xl">
                  Journey Plan
                </h2>

                <div className="mt-7 space-y-4">
                  {itinerary.map((day, index) => (
                    <div
                      key={`${day.title}-${index}`}
                      className="rounded-2xl border border-[#e5f0ec] bg-[#fafcfb] p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#07805f] text-sm font-black text-white">
                          {index + 1}
                        </div>

                        <div>
                          <h3 className="font-black text-[#073f35]">
                            {day.title}
                          </h3>

                          {day.description && (
                            <p className="mt-2 text-sm leading-6 text-[#6b8179]">
                              {day.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* =================================================
                BOTTOM BACK BUTTON
            ================================================= */}

            <div className="mt-10">
              <Link
                href="/packages"
                className="group inline-flex items-center gap-2 rounded-full border border-[#cfe5de] bg-white px-5 py-3 text-sm font-bold text-[#075847] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#07805f] hover:bg-[#effbf6]"
              >
                <ArrowLeft
                  size={17}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />
                Back to Packages
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
