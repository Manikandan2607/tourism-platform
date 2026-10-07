"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Headphones,
  MapPin,
  PackageOpen,
  Plane,
  Route,
  ShieldCheck,
  Snowflake,
  Users,
} from "lucide-react";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

/* =========================================================
   CONSTANTS
   ========================================================= */

const HERO_BG = "/images/travel-hero-bg.png";

const FALLBACK_DESTINATION_IMAGE = "/images/destination-placeholder.jpg";

/* =========================================================
   IMAGE HELPERS
   ========================================================= */

function normalizeImageUrl(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const url = value.trim();

    if (!url) return "";

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
      normalizeImageUrl(value.src) ||
      normalizeImageUrl(value.image) ||
      normalizeImageUrl(value.imageUrl) ||
      normalizeImageUrl(value.secure_url) ||
      normalizeImageUrl(value.secureUrl) ||
      normalizeImageUrl(value.path) ||
      normalizeImageUrl(value.location) ||
      ""
    );
  }

  return "";
}

function getImageUrl(item) {
  if (!item) return "";

  const directImage =
    normalizeImageUrl(item.image) ||
    normalizeImageUrl(item.imageUrl) ||
    normalizeImageUrl(item.coverImage) ||
    normalizeImageUrl(item.coverImageUrl) ||
    normalizeImageUrl(item.thumbnail) ||
    normalizeImageUrl(item.thumbnailUrl) ||
    normalizeImageUrl(item.photo) ||
    normalizeImageUrl(item.photoUrl) ||
    normalizeImageUrl(item.bannerImage) ||
    normalizeImageUrl(item.destinationImage);

  if (directImage) {
    return directImage;
  }

  const imageArrays = [
    item.images,
    item.photos,
    item.gallery,
    item.galleryImages,
    item.media,
  ];

  for (const collection of imageArrays) {
    if (Array.isArray(collection) && collection.length > 0) {
      for (const image of collection) {
        const resolved = normalizeImageUrl(image);

        if (resolved) {
          return resolved;
        }
      }
    }
  }

  const nestedImage =
    normalizeImageUrl(item.media?.image) ||
    normalizeImageUrl(item.media?.cover) ||
    normalizeImageUrl(item.media?.thumbnail) ||
    normalizeImageUrl(item.cover?.image) ||
    normalizeImageUrl(item.cover?.url);

  if (nestedImage) {
    return nestedImage;
  }

  return "";
}

/* =========================================================
   PACKAGE HELPERS
   ========================================================= */

function getPackageTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.packageName ||
    item?.packageTitle ||
    "Travel Package"
  );
}

function getPackagePrice(item) {
  return (
    item?.price || item?.amount || item?.startingPrice || item?.cost || null
  );
}

/* =========================================================
   API RESPONSE HELPER
   ========================================================= */

function extractItems(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.destinations)) {
    return data.data.destinations;
  }

  if (Array.isArray(data?.data?.packages)) {
    return data.data.packages;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

/* =========================================================
   PAGE
   ========================================================= */

export default function HomePage() {
  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loadingDestinations, setLoadingDestinations] = useState(true);

  const [loadingPackages, setLoadingPackages] = useState(true);

  const [destinationError, setDestinationError] = useState("");

  const [packageError, setPackageError] = useState("");

  /* =======================================================
     FETCH DESTINATIONS
     ======================================================= */

  useEffect(() => {
    async function loadDestinations() {
      try {
        setLoadingDestinations(true);
        setDestinationError("");

        const response = await fetch("/api/public/destinations", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load destinations");
        }

        const data = await response.json();

        const items = extractItems(data, ["destinations", "results"]);

        setDestinations(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Destination fetch error:", error);

        setDestinationError("Destinations are currently unavailable.");

        setDestinations([]);
      } finally {
        setLoadingDestinations(false);
      }
    }

    loadDestinations();
  }, []);

  /* =======================================================
     FETCH PACKAGES
     ======================================================= */

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoadingPackages(true);
        setPackageError("");

        const response = await fetch("/api/public/packages", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load packages");
        }

        const data = await response.json();

        const items = extractItems(data, ["packages", "results"]);

        setPackages(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Package fetch error:", error);

        setPackageError("Packages are currently unavailable.");

        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    }

    loadPackages();
  }, []);

  return (
    <>
      {/* ===================================================
          GLOBAL STYLES
          =================================================== */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* =================================================
               BASIC ANIMATIONS
               ================================================= */

            @keyframes softFloat {
              0%,
              100% {
                transform: translateY(0);
              }

              50% {
                transform: translateY(-9px);
              }
            }

            @keyframes confidenceLoop {
              0% {
                transform: translateY(0) scale(1);
              }

              8% {
                transform: translateY(-8px) scale(1.015);
              }

              18% {
                transform: translateY(0) scale(1);
              }

              100% {
                transform: translateY(0) scale(1);
              }
            }

            @keyframes shineMove {
              0% {
                transform: translateX(-130%);
              }

              100% {
                transform: translateX(130%);
              }
            }

            @keyframes whySstMarqueeLeft {
              0% {
                transform: translate3d(0, 0, 0);
              }

              100% {
                transform: translate3d(-50%, 0, 0);
              }
            }

            /* =================================================
               MARQUEE MOTION
               Interactive JS marquee handles both
               auto-looping and touch / mouse dragging.
               ================================================= */

                        .sst-marquee-viewport {
              position: relative;
              width: 100%;
              overflow: hidden;
              cursor: grab;
              touch-action: pan-y;
              user-select: none;
              -webkit-user-select: none;
              -webkit-tap-highlight-color: transparent;
              overscroll-behavior-x: contain;
              overscroll-behavior-y: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            .sst-marquee-viewport:active {
              cursor: grabbing;
            }

            .sst-marquee-viewport::-webkit-scrollbar {
              display: none;
            }

            .sst-marquee-track {
              display: flex;
              width: max-content;
              user-select: none;
              -webkit-user-select: none;
              will-change: transform;
              transform: translate3d(0, 0, 0);
            }

            .sst-marquee-group {
              display: flex;
              flex-shrink: 0;
              gap: clamp(0.85rem, 1.35vw, 1.25rem);
              padding-right: clamp(0.85rem, 1.35vw, 1.25rem);
            }

            /* =================================================
               VEHICLE
               ================================================= */

            .vehicle-float {
              animation:
                vehicleFloat 5s ease-in-out infinite;
            }

            @keyframes vehicleFloat {
              0%,
              100% {
                transform: translateY(0);
              }

              50% {
                transform: translateY(-10px);
              }
            }

            /* =================================================
               REVEAL
               ================================================= */

            .reveal-hidden {
              opacity: 0;
              transform:
                translateY(35px)
                scale(0.98);
            }

            .reveal-visible {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
            }

            .reveal-transition {
              transition:
                opacity 0.75s ease,
                transform 0.75s
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                );
            }

            .sst-letter {
              display: inline-block;
              opacity: 0;
              transform: translate3d(0, 0.65em, 0) rotateX(-55deg);
              transform-origin: 50% 100%;
              transition: opacity 0.5s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
              will-change: opacity, transform;
            }

            .sst-letter-visible {
              opacity: 1;
              transform: translate3d(0, 0, 0) rotateX(0deg);
            }

            @media (prefers-reduced-motion: reduce) {
              .sst-letter {
                opacity: 1;
                transform: none;
                transition: none;
              }
            }

            /* =================================================
               HOME SYSTEM
               ================================================= */

            .sst-home {
              --sst-gutter:
                clamp(
                  1rem,
                  3.2vw,
                  4rem
                );

              --sst-max: 1380px;
              overflow-x: hidden;
            }

            /* =================================================
               HERO
               ================================================= */

            .sst-hero {
              min-height:
                clamp(
                  720px,
                  62vw,
                  940px
                );
            }

            .sst-hero-content {
              width:
                min(
                  100%,
                  1450px
                );

              padding-left:
                var(--sst-gutter);

              padding-right:
                var(--sst-gutter);

              padding-top:
                clamp(
                  5.5rem,
                  7vw,
                  7rem
                );

              padding-bottom:
                clamp(
                  6rem,
                  10vw,
                  10rem
                );
            }

            .sst-hero-grid {
              min-height:
                clamp(
                  540px,
                  55vw,
                  680px
                );

              column-gap:
                clamp(
                  1rem,
                  2vw,
                  3rem
                );
            }

            .sst-hero-title {
              font-size:
                clamp(
                  2.45rem,
                  5.2vw,
                  4.9rem
                );

              line-height: 0.98;

              letter-spacing:
                clamp(
                  -1.5px,
                  -0.18vw,
                  -2.5px
                );
            }

            .sst-hero-description {
              font-size:
                clamp(
                  0.95rem,
                  1.15vw,
                  1.125rem
                );

              line-height: 1.65;
            }

            .sst-vehicle-stage {
              min-height:
                clamp(
                  300px,
                  42vw,
                  600px
                );

              overflow: visible;
            }

            .sst-vehicle-image {
              width:
                min(
                  100%,
                  clamp(
                    420px,
                    47vw,
                    700px
                  )
                );

              max-width: none;
            }

            /* =================================================
               DESKTOP FEATURE STRIP
               ================================================= */

            .sst-desktop-features {
              padding-left:
                var(--sst-gutter);

              padding-right:
                var(--sst-gutter);
            }

            /* =================================================
               SECTION COMMON
               ================================================= */

            .sst-section {
              padding-left:
                var(--sst-gutter);

              padding-right:
                var(--sst-gutter);

              padding-top:
                clamp(
                  4rem,
                  7vw,
                  6rem
                );

              padding-bottom:
                clamp(
                  4rem,
                  7vw,
                  6rem
                );
            }

            .sst-section-inner {
              width:
                min(
                  100%,
                  var(--sst-max)
                );

              margin-inline: auto;
            }

            .sst-section-title {
              font-size:
                clamp(
                  2rem,
                  4.5vw,
                  3.4rem
                );

              line-height: 1.05;

              letter-spacing:
                -1.5px;
            }

            .sst-section-description {
              font-size:
                clamp(
                  0.95rem,
                  1.25vw,
                  1.125rem
                );

              line-height: 1.75;
            }

            /* =================================================
               DESTINATION CARD
               ================================================= */

            .sst-destination-card {
              position: relative;
              flex:
                0 0
                clamp(
                  255px,
                  24vw,
                  330px
                );

              overflow: hidden;

              border:
                1px solid
                rgba(
                  19,
                  128,
                  101,
                  0.12
                );

              border-radius:
                clamp(
                  22px,
                  2.2vw,
                  32px
                );

              background: white;

              box-shadow: none;
              transition: none;
            }

            .sst-destination-card-image {
              position: relative;

              height:
                clamp(
                  190px,
                  19vw,
                  245px
                );

              overflow: hidden;
            }

            .sst-destination-card-image img {
              width: 100%;
              height: 100%;
              object-fit: cover;

              transition:
                transform 0.8s
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
                filter 0.5s ease;
            }


            .sst-destination-overlay {
              position: absolute;
              inset: 0;

              background:
                linear-gradient(
                  to top,
                  rgba(
                    0,
                    31,
                    25,
                    0.82
                  ),
                  rgba(
                    0,
                    31,
                    25,
                    0.08
                  )
                );
            }

            .sst-destination-content {
              position: absolute;
              left: 0;
              right: 0;
              bottom: 0;

              padding:
                clamp(
                  1rem,
                  2vw,
                  1.5rem
                );
            }

            .sst-destination-name {
              font-size:
                clamp(
                  1.3rem,
                  2vw,
                  1.75rem
                );

              line-height: 1.1;

              font-weight: 900;

              color: white;

              text-transform:
                capitalize;

              text-shadow:
                0
                3px
                12px
                rgba(
                  0,
                  0,
                  0,
                  0.28
                );
            }

            .sst-destination-link {
              display: inline-flex;

              align-items: center;

              gap: 0.45rem;

              margin-top: 0.55rem;

              font-size: 0.78rem;

              font-weight: 700;

              color:
                #b8f3df;

              opacity: 0.9;

              transition:
                opacity 0.3s ease,
                gap 0.3s ease;
            }


            /* =================================================
               PACKAGE CARD
               ================================================= */

            .sst-package-card {
              position: relative;

              flex:
                0 0
                clamp(
                  260px,
                  24vw,
                  330px
                );

              overflow: hidden;

              border:
                1px solid
                rgba(
                  19,
                  128,
                  101,
                  0.12
                );

              border-radius:
                clamp(
                  22px,
                  2.2vw,
                  32px
                );

              background: white;

              box-shadow: none;
              transition: none;
            }

            .sst-package-image {
              position: relative;

              height:
                clamp(
                  185px,
                  18vw,
                  235px
                );

              overflow: hidden;
            }

            .sst-package-image img {
              width: 100%;
              height: 100%;
              object-fit: cover;

              transition:
                transform 0.8s
                cubic-bezier(
                  0.22,
                  1,
                  0.36,
                  1
                ),
                filter 0.5s ease;
            }


            .sst-package-overlay {
              position: absolute;
              inset: 0;

              background:
                linear-gradient(
                  to top,
                  rgba(
                    0,
                    35,
                    27,
                    0.86
                  ),
                  rgba(
                    0,
                    35,
                    27,
                    0.06
                  )
                );
            }

            .sst-package-top {
              position: absolute;
              left: 0;
              right: 0;
              top: 0;

              display: flex;
              justify-content: space-between;
              align-items: center;

              padding:
                1rem
                1.1rem;
            }

            .sst-package-badge {
              display: inline-flex;

              align-items: center;

              border-radius: 999px;

              background:
                rgba(
                  255,
                  255,
                  255,
                  0.16
                );

              border:
                1px solid
                rgba(
                  255,
                  255,
                  255,
                  0.28
                );

              padding:
                0.42rem
                0.7rem;

              color: white;

              font-size: 0.68rem;

              font-weight: 800;

              text-transform: uppercase;

              letter-spacing:
                0.08em;

              backdrop-filter:
                blur(12px);
            }

            .sst-package-content {
              position: absolute;

              left: 0;
              right: 0;
              bottom: 0;

              padding:
                1rem
                1.25rem
                1.25rem;
            }

            .sst-package-title {
              color: white;

              font-size:
                clamp(
                  1.3rem,
                  2vw,
                  1.65rem
                );

              line-height: 1.12;

              font-weight: 900;
            }

            .sst-package-footer {
              display: flex;

              align-items: center;

              justify-content:
                space-between;

              gap: 1rem;

              padding:
                1rem
                1.15rem;
            }

            .sst-package-price-label {
              color:
                #7c9890;

              font-size:
                0.68rem;

              font-weight: 800;

              text-transform:
                uppercase;

              letter-spacing:
                0.08em;
            }

            .sst-package-price {
              margin-top:
                0.25rem;

              color:
                #075847;

              font-size:
                clamp(
                  1.05rem,
                  1.7vw,
                  1.3rem
                );

              font-weight: 900;
            }

            .sst-package-arrow {
              display: flex;

              height: 44px;
              width: 44px;

              flex-shrink: 0;

              align-items: center;
              justify-content: center;

              border-radius: 50%;

              background:
                #e5f7f0;

              color:
                #07875f;

              transition:
                background 0.3s ease,
                color 0.3s ease,
                transform 0.3s ease;
            }


            /* =================================================
               WHY SST
               LEFT LOOP
               ================================================= */

            .sst-why-section {
              --marquee-bg: #ffffff;
            }

            .sst-why-track {
              animation: whySstMarqueeLeft 42s linear infinite;
              will-change: transform;
            }

            .sst-why-track:hover {
              animation-play-state:
                paused;
            }

            .sst-why-card {
              position: relative;

              flex:
                0 0
                clamp(
                  275px,
                  27vw,
                  330px
                );

              min-height:
                235px;

              border:
                1px solid
                #d9eee7;

              border-radius:
                28px;

              background:
                rgba(
                  255,
                  255,
                  255,
                  0.96
                );

              padding:
                clamp(
                  1.25rem,
                  2vw,
                  1.75rem
                );

              box-shadow:
                0
                12px
                35px
                rgba(
                  0,
                  80,
                  60,
                  0.07
                );

              transition:
                transform 0.45s ease,
                box-shadow 0.45s ease,
                border-color 0.45s ease;
            }

            .sst-why-card:hover {
              transform:
                translateY(-9px);

              border-color:
                #a8dccd;

              box-shadow:
                0
                20px
                45px
                rgba(
                  0,
                  80,
                  60,
                  0.13
                ),
                0
                0
                28px
                rgba(
                  7,
                  135,
                  95,
                  0.09
                );
            }

            .sst-why-icon {
              display: flex;

              height: 56px;
              width: 56px;

              align-items: center;
              justify-content: center;

              border-radius:
                18px;

              background:
                #eaf8f3;

              font-size:
                1.55rem;

              transition:
                transform 0.4s ease,
                background 0.4s ease;
            }

            .sst-why-card:hover
              .sst-why-icon {
              transform:
                scale(1.1)
                rotate(3deg);

              background:
                #dff5ec;
            }

            .sst-why-title {
              margin-top:
                1.35rem;

              color:
                #075847;

              font-size:
                1.15rem;

              font-weight:
                900;
            }

            .sst-why-text {
              margin-top:
                0.65rem;

              color:
                #718982;

              font-size:
                0.875rem;

              line-height:
                1.55;
            }

            .sst-why-line {
              margin-top:
                1.2rem;

              height: 4px;

              width: 42px;

              border-radius:
                999px;

              background:
                #07805f;

              transition:
                width 0.4s ease;
            }

            .sst-why-card:hover
              .sst-why-line {
              width: 82px;
            }

            /* =================================================
               CTA
               ================================================= */

            .sst-final-cta {
              width:
                min(
                  100%,
                  var(--sst-max)
                );

              border-radius:
                clamp(
                  24px,
                  3vw,
                  38px
                );

              padding:
                clamp(
                  2.75rem,
                  5vw,
                  4rem
                )
                clamp(
                  1.25rem,
                  5vw,
                  4rem
                );
            }

            .sst-final-cta-title {
              font-size:
                clamp(
                  2rem,
                  5vw,
                  3.75rem
                );

              line-height:
                1.05;

              letter-spacing:
                -1.5px;
            }

            /* =================================================
               TABLET
               ================================================= */

            @media (max-width: 1023px) {
              .sst-hero {
                min-height: auto;
              }

              .sst-hero-content {
                padding-top:
                  6rem;

                padding-bottom:
                  4rem;
              }

              .sst-hero-grid {
                grid-template-columns:
                  1fr;

                min-height: 0;
              }

              .sst-hero-grid > div:first-child {
                max-width:
                  760px;
              }

              .sst-vehicle-stage {
                min-height:
                  clamp(
                    280px,
                    55vw,
                    500px
                  );

                margin-top:
                  0.5rem;
              }

              .sst-vehicle-image {
                width:
                  min(
                    100%,
                    650px
                  );
              }
}

            /* =================================================
               MOBILE
               ================================================= */

            @media (max-width: 767px) {
              .sst-hero-content {
                padding-top:
                  5.5rem;

                padding-bottom:
                  2.5rem;
              }

              .sst-hero-title {
                font-size:
                  clamp(
                    2.15rem,
                    10.5vw,
                    3.35rem
                  );
              }

              .sst-hero-description {
                margin-top:
                  1.1rem;

                font-size:
                  0.98rem;
              }

              .sst-vehicle-stage {
                min-height:
                  clamp(
                    220px,
                    67vw,
                    360px
                  );
              }

              .sst-vehicle-image {
                width:
                  min(
                    112%,
                    520px
                  );
              }

              .sst-section {
                padding-top:
                  3.75rem;

                padding-bottom:
                  3.75rem;
              }

              .sst-section-title {
                font-size:
                  clamp(
                    2rem,
                    8vw,
                    2.65rem
                  );
              }

              .sst-section-description {
                font-size:
                  0.98rem;

                line-height:
                  1.7;
              }
.sst-destination-card {
                flex-basis:
                  min(
                    76vw,
                    300px
                  );
              }

              .sst-package-card {
                flex-basis:
                  min(
                    76vw,
                    300px
                  );
              }

              .sst-destination-card-image {
                height:
                  205px;
              }

              .sst-package-image {
                height:
                  200px;
              }

              .sst-why-track {
                animation-duration:
                  32s;
              }

              .sst-why-card {
                flex-basis:
                  min(
                    78vw,
                    320px
                  );
              }
            }

            /* =================================================
               SMALL MOBILE
               ================================================= */

            @media (max-width: 480px) {
              .sst-hero-content {
                padding-top:
                  5rem;

                padding-bottom:
                  1.75rem;
              }

              .sst-hero-title {
                font-size:
                  clamp(
                    2rem,
                    10.8vw,
                    2.65rem
                  );
              }

              .sst-vehicle-stage {
                min-height:
                  210px;
              }

              .sst-vehicle-image {
                width:
                  118%;

                max-width:
                  500px;
              }

              .sst-destination-card {
                flex-basis:
                  76vw;
              }

              .sst-package-card {
                flex-basis:
                  76vw;
              }

              .sst-destination-card-image {
                height:
                  220px;
              }

              .sst-package-image {
                height:
                  215px;
              }

              .sst-why-card {
                flex-basis:
                  72vw;
              }
            }

            /* =================================================
               REDUCED MOTION
               ================================================= */

            @media (prefers-reduced-motion: reduce) {
              .vehicle-float,
              .sst-destination-track,
              .sst-package-track,
              .sst-why-track {
                animation:
                  none !important;
              }

              .reveal-hidden {
                opacity:
                  1 !important;

                transform:
                  none !important;
              }

              .reveal-transition {
                transition:
                  none !important;
              }
            }
          `,
        }}
      />

      <main className="sst-home min-h-screen bg-[#f4faf7] text-[#073f35]">
        {/* ===================================================
            HERO
            =================================================== */}

        <section className="sst-hero relative overflow-hidden">
          <img
            src={HERO_BG}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#f9fffc]/95 via-[#f9fffc]/72 via-45% to-transparent" />

          <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#063d34]/25 to-transparent" />

          <div className="pointer-events-none absolute -left-40 top-56 h-[550px] w-[550px] rounded-full bg-white/30 blur-[120px]" />

          <div className="relative z-50">
            <Navbar />
          </div>

          <div className="sst-hero-content relative z-20 mx-auto">
            <div className="sst-hero-grid grid items-center lg:grid-cols-[0.92fr_1.08fr]">
              {/* LEFT */}

              <div className="relative z-30 max-w-[610px]">
                <Reveal>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0c8065]/10 bg-[#e6f7f1]/85 px-5 py-2.5 text-sm font-semibold text-[#075847] shadow-sm backdrop-blur-md">
                    <MapPin size={17} strokeWidth={2.5} />

                    <span>Comfortable Rides</span>

                    <span className="h-1 w-1 rounded-full bg-[#0d8067]" />

                    <span>Safe Journeys</span>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <h1 className="sst-hero-title max-w-[650px] font-black text-[#064d3f]">
                    Travel in Comfort
                    <br />
                    with <span className="text-[#08795f]">SST Travels</span>
                  </h1>
                </Reveal>

                <Reveal delay={200}>
                  <p className="sst-hero-description mt-7 max-w-[560px] text-[#164f45]">
                    Experience the best travel with our premium{" "}
                    <strong className="font-extrabold text-[#064d3f]">
                      Force Traveller
                    </strong>{" "}
                    vehicles — spacious, comfortable and perfect for group
                    journeys.
                  </p>
                </Reveal>

                {/* MINI FEATURES */}

                <div className="mt-8 grid max-w-[590px] grid-cols-1 gap-4 sm:grid-cols-3">
                  <Reveal delay={300}>
                    <MiniFeature
                      icon={<Users size={26} />}
                      title="Spacious"
                      subtitle="Seating Capacity"
                    />
                  </Reveal>

                  <Reveal delay={400}>
                    <MiniFeature
                      icon={<ShieldCheck size={27} />}
                      title="Safe & Secure"
                      subtitle="Travel Always"
                    />
                  </Reveal>

                  <Reveal delay={500}>
                    <MiniFeature
                      icon={<CarFront size={27} />}
                      title="Experienced"
                      subtitle="Drivers"
                    />
                  </Reveal>
                </div>

                {/* BUTTONS */}

                <Reveal delay={600}>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="#vehicles"
                      className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#07875f] px-7 py-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(0,100,75,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#056f4e]"
                    >
                      View Our Vehicles
                      <ArrowRight
                        size={19}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Link>

                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-full border border-[#08795f] bg-white/30 px-8 py-4 text-sm font-bold text-[#075847] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/70"
                    >
                      Book Your Trip
                    </Link>
                  </div>
                </Reveal>
              </div>

              {/* VEHICLE */}

              <Reveal delay={250}>
                <div
                  id="vehicles"
                  className="sst-vehicle-stage relative mt-8 flex items-center justify-center lg:mt-0"
                >
                  <div className="absolute bottom-12 left-1/2 h-12 w-[62%] -translate-x-1/2 rounded-full bg-black/25 blur-3xl" />

                  <div className="absolute right-[8%] top-[20%] h-[220px] w-[220px] rounded-full bg-white/20 blur-[85px]" />

                  <img
                    src="/images/force-traveller.png"
                    alt="SST Travels Force Traveller"
                    className="sst-vehicle-image vehicle-float relative z-10 block h-auto object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.28)]"
                  />
                </div>
              </Reveal>
            </div>
          </div>

          {/* DESKTOP FEATURES */}

          <div className="sst-desktop-features absolute bottom-0 left-0 right-0 z-40 hidden lg:block">
            <div className="mx-auto max-w-[1380px]">
              <div className="grid min-h-[125px] grid-cols-[1fr_1fr_1fr_1fr_1.65fr] items-center overflow-hidden rounded-t-[38px] border border-white/70 bg-[#f4fffb]/94 px-7 shadow-[0_-15px_45px_rgba(0,65,50,0.12)] backdrop-blur-xl xl:px-10">
                <BottomFeature
                  icon={<Users size={27} />}
                  title="10 – 17 Seater"
                  subtitle="Multiple Options"
                />

                <BottomFeature
                  icon={<Snowflake size={27} />}
                  title="AC & Comfortable"
                  subtitle="Travel Experience"
                />

                <BottomFeature
                  icon={<Route size={27} />}
                  title="Well Maintained"
                  subtitle="Fleet"
                />

                <BottomFeature
                  icon={<ShieldCheck size={27} />}
                  title="24/7 Support"
                  subtitle="During Your Trip"
                />

                <div className="flex h-full items-center justify-center border-l border-[#16856b]/20 pl-8">
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="font-serif text-[23px] italic leading-6 text-[#086b57]">
                        Your Journey
                      </div>

                      <div className="font-serif text-[23px] italic leading-6 text-[#086b57]">
                        Our Priority
                      </div>

                      <div className="ml-auto mt-2 h-[2px] w-28 rotate-[-5deg] rounded-full bg-[#0c896c]" />
                    </div>

                    <Plane
                      size={38}
                      className="rotate-[12deg] text-[#07875f]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            MOBILE FEATURES
            =================================================== */}

        <section className="bg-[#effbf6] px-5 py-7 lg:hidden">
          <div className="grid grid-cols-2 gap-3">
            <BottomFeature
              icon={<Users size={24} />}
              title="10 – 17 Seater"
              subtitle="Multiple Options"
            />

            <BottomFeature
              icon={<Snowflake size={24} />}
              title="AC & Comfortable"
              subtitle="Travel Experience"
            />

            <BottomFeature
              icon={<Route size={24} />}
              title="Well Maintained"
              subtitle="Fleet"
            />

            <BottomFeature
              icon={<ShieldCheck size={24} />}
              title="24/7 Support"
              subtitle="During Your Trip"
            />
          </div>
        </section>

        {/* ===================================================
            DESTINATIONS
            → → →
            =================================================== */}

        <section className="sst-section bg-[#f4faf7]">
          <div className="sst-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="EXPLORE"
                title="Explore Beautiful Destinations"
                description="Discover memorable places and experience comfortable group travel with SST Travels."
              />
            </Reveal>

            {loadingDestinations ? (
              <LoadingMarquee type="destination" />
            ) : destinationError ? (
              <EmptyState message={destinationError} />
            ) : destinations.length === 0 ? (
              <EmptyState message="No destinations available right now." />
            ) : (
              <DestinationMarquee destinations={destinations} />
            )}
          </div>
        </section>

        {/* ===================================================
            WHY SST
            ← ← ←
            =================================================== */}

        <section
          id="why-sst-travels"
          className="sst-section sst-why-section relative overflow-hidden bg-white scroll-mt-20"
        >
          <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#dff7ed] blur-3xl" />

          <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#e7f8f2] blur-3xl" />

          <div className="sst-section-inner relative">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-[#bde8da] bg-[#effbf6] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#07805f]">
                Why SST Travels
              </div>

              <h2 className="sst-section-title font-black text-[#075847]">
                Travel With Comfort & Confidence
              </h2>

              <p className="sst-section-description mx-auto mt-5 max-w-2xl text-[#648078]">
                We believe every journey should be comfortable, affordable,
                respectful and memorable. That is why SST Travels focuses on
                giving every traveller a better experience from beginning to
                end.
              </p>
            </div>

            <div className="sst-marquee-viewport mt-14 bg-white">
              <div className="sst-marquee-track sst-why-track">
                <div className="sst-marquee-group">
                  <WhySSTCard
                    icon="🛡️"
                    title="Safe & Secure"
                    text="Safety-focused journeys with experienced drivers and well-maintained vehicles."
                  />

                  <WhySSTCard
                    icon="❄️"
                    title="AC Comfort"
                    text="Enjoy comfortable and relaxing travel throughout your journey."
                  />

                  <WhySSTCard
                    icon="👨‍👩‍👧‍👦"
                    title="Group Friendly"
                    text="Comfortable travel options for families, friends and larger groups."
                  />

                  <WhySSTCard
                    icon="🎧"
                    title="24/7 Support"
                    text="Our team is ready to help you whenever you need assistance."
                  />

                  <WhySSTCard
                    icon="💰"
                    title="Budget Friendly"
                    text="Comfortable travel options designed to give you excellent value for your money."
                  />

                  <WhySSTCard
                    icon="🤝"
                    title="Respect Clients"
                    text="We treat every traveller with respect, care and personal attention."
                  />
                </div>

                <div className="sst-marquee-group" aria-hidden="true">
                  <WhySSTCard
                    icon="🛡️"
                    title="Safe & Secure"
                    text="Safety-focused journeys with experienced drivers and well-maintained vehicles."
                  />

                  <WhySSTCard
                    icon="❄️"
                    title="AC Comfort"
                    text="Enjoy comfortable and relaxing travel throughout your journey."
                  />

                  <WhySSTCard
                    icon="👨‍👩‍👧‍👦"
                    title="Group Friendly"
                    text="Comfortable travel options for families, friends and larger groups."
                  />

                  <WhySSTCard
                    icon="🎧"
                    title="24/7 Support"
                    text="Our team is ready to help you whenever you need assistance."
                  />

                  <WhySSTCard
                    icon="💰"
                    title="Budget Friendly"
                    text="Comfortable travel options designed to give you excellent value for your money."
                  />

                  <WhySSTCard
                    icon="🤝"
                    title="Respect Clients"
                    text="We treat every traveller with respect, care and personal attention."
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm font-semibold text-[#07805f]">
                Your comfort matters. Your journey matters.
              </p>

              <p className="mt-1 text-xs text-[#7a938c]">
                Travel with SST Travels and enjoy the difference.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            PACKAGES
            → → →
            =================================================== */}

        <section className="sst-section bg-[#f4faf7]">
          <div className="sst-section-inner">
            <Reveal>
              <SectionHeading
                eyebrow="TRAVEL PACKAGES"
                title="Plan Your Next Journey"
                description="Choose a package and let SST Travels make your journey comfortable and memorable."
              />
            </Reveal>

            {loadingPackages ? (
              <LoadingMarquee type="package" />
            ) : packageError ? (
              <EmptyState message={packageError} />
            ) : packages.length === 0 ? (
              <EmptyState message="No travel packages available right now." />
            ) : (
              <PackageMarquee packages={packages} />
            )}
          </div>
        </section>

        {/* ===================================================
            FINAL CTA
            =================================================== */}

        <section className="bg-[#f4faf7] px-[var(--sst-gutter)] py-10 sm:py-14">
          <Reveal>
            <div className="sst-final-cta relative mx-auto overflow-hidden bg-[#07805e] text-center text-white shadow-[0_25px_70px_rgba(0,90,65,0.2)]">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-[#003e31]/20 blur-3xl" />

              <div className="relative z-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
                  <Plane size={27} />
                </div>

                <h2 className="sst-final-cta-title mx-auto mt-5 max-w-[800px] font-black">
                  Your Journey Starts With SST Travels
                </h2>

                <p className="mx-auto mt-4 max-w-[620px] text-base leading-7 text-white/80 sm:text-[17px]">
                  Comfortable rides, safe journeys and unforgettable travel
                  experiences are just one booking away.
                </p>

                <div className="mt-7">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#075847] shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#effff9]"
                  >
                    Plan Your Trip
                    <ArrowRight size={19} />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <Footer />
      </main>
    </>
  );
}

/* =========================================================
   INTERACTIVE MARQUEE
   ========================================================= */

function InteractiveMarquee({
  items,
  direction = "right",
  renderItem,
  className = "",
  speed = 24,
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  const frameRef = useRef(null);
  const manualFrameRef = useRef(null);
  const resumeTimerRef = useRef(null);

  const groupWidthRef = useRef(0);
  const cardStepRef = useRef(0);
  const offsetRef = useRef(0);
  const lastTimeRef = useRef(0);

  const draggingRef = useRef(false);
  const pointerIdRef = useRef(null);
  const lastPointerXRef = useRef(0);
  const manualAnimatingRef = useRef(false);
  const initializedRef = useRef(false);

  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const isRight = direction === "right";

  const getGroupMetrics = () => {
    const group = groupRef.current;
    if (!group) return { width: 0, step: 0 };

    const width = group.getBoundingClientRect().width;
    const firstCard = group.firstElementChild;
    const cardWidth = firstCard?.getBoundingClientRect().width || 0;

    let gap = 0;
    if (typeof window !== "undefined") {
      const styles = window.getComputedStyle(group);
      gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    }

    const step = cardWidth + gap;

    if (width > 0) groupWidthRef.current = width;
    if (step > 0) cardStepRef.current = step;

    return {
      width: groupWidthRef.current,
      step: cardStepRef.current,
    };
  };

  const wrapOffset = () => {
    const width = groupWidthRef.current || getGroupMetrics().width;
    if (!width) return 0;

    // Keep the logical offset bounded so very fast dragging or long sessions
    // never create a huge transform value. The visual position remains exact.
    const half = width / 2;
    offsetRef.current =
      ((((offsetRef.current + half) % width) + width) % width) - half;

    return offsetRef.current;
  };

  const getVisualPosition = () => {
    const width = groupWidthRef.current || getGroupMetrics().width;
    if (!width) return 0;

    wrapOffset();
    return -width + offsetRef.current;
  };

  const applyPosition = () => {
    const track = trackRef.current;
    if (!track) return;

    track.style.transform = `translate3d(${getVisualPosition()}px, 0, 0)`;
  };

  const setInitialPosition = () => {
    const { width } = getGroupMetrics();
    if (!width) return;

    offsetRef.current = 0;
    initializedRef.current = true;
    applyPosition();
  };

  const pauseForUser = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const resumeAfterUser = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      lastTimeRef.current = 0;
    }, 220);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    setShowSwipeHint(false);
    pauseForUser();

    if (manualFrameRef.current) {
      cancelAnimationFrame(manualFrameRef.current);
      manualFrameRef.current = null;
    }

    manualAnimatingRef.current = false;
    draggingRef.current = true;
    pointerIdRef.current = event.pointerId;
    lastPointerXRef.current = event.clientX;
    lastTimeRef.current = 0;

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current) return;
    if (pointerIdRef.current !== event.pointerId) return;

    const deltaX = event.clientX - lastPointerXRef.current;
    lastPointerXRef.current = event.clientX;

    if (Math.abs(deltaX) > 0) {
      offsetRef.current += deltaX;
      wrapOffset();
      applyPosition();
    }
  };

  const finishPointer = (event) => {
    if (!draggingRef.current) return;

    if (event?.pointerId != null && pointerIdRef.current !== event.pointerId) {
      return;
    }

    draggingRef.current = false;
    pointerIdRef.current = null;
    lastTimeRef.current = 0;

    try {
      event?.currentTarget?.releasePointerCapture?.(event.pointerId);
    } catch {}

    wrapOffset();
    applyPosition();
    resumeAfterUser();
  };

  const handleWheel = () => {
    // Wheel scrolling belongs to the page. We only pause the marquee briefly
    // while the user is actively scrolling so it cannot fight the page motion.
    setShowSwipeHint(false);
    pauseForUser();
    resumeAfterUser();
  };

  const handleManualMove = (moveDirection) => {
    const { width, step } = getGroupMetrics();
    if (!width) return;

    setShowSwipeHint(false);
    pauseForUser();

    if (manualFrameRef.current) {
      cancelAnimationFrame(manualFrameRef.current);
      manualFrameRef.current = null;
    }

    draggingRef.current = false;
    manualAnimatingRef.current = true;
    lastTimeRef.current = 0;

    // Move exactly one card at a time. This keeps the button action natural
    // and prevents the carousel from jumping several cards on wide screens.
    const distance = Math.max(80, Math.min(step || width * 0.28, 360));
    const directionMultiplier = moveDirection === "left" ? -1 : 1;
    const start = offsetRef.current;
    const target = start + distance * directionMultiplier;
    const duration = 620;
    const startedAt = performance.now();

    const easeInOut = (value) =>
      value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;

    const animateManualMove = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOut(progress);

      offsetRef.current = start + (target - start) * eased;

      wrapOffset();
      applyPosition();

      if (progress < 1) {
        manualFrameRef.current = requestAnimationFrame(animateManualMove);
        return;
      }

      offsetRef.current = target;
      wrapOffset();
      applyPosition();

      manualAnimatingRef.current = false;
      manualFrameRef.current = null;
      lastTimeRef.current = 0;
      resumeAfterUser();
    };

    manualFrameRef.current = requestAnimationFrame(animateManualMove);
  };

  useEffect(() => {
    initializedRef.current = false;
    groupWidthRef.current = 0;
    cardStepRef.current = 0;

    const setup = () => {
      const { width } = getGroupMetrics();
      if (!width) return;

      if (!initializedRef.current) {
        setInitialPosition();
        return;
      }

      // Re-apply the current logical position instead of resetting the
      // carousel when the page/viewport changes during fast scrolling.
      wrapOffset();
      applyPosition();
    };

    setup();
    const firstFrame = requestAnimationFrame(setup);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const previousWidth = groupWidthRef.current;
            const { width: newWidth } = getGroupMetrics();

            if (!newWidth) return;

            if (!previousWidth) {
              setInitialPosition();
              return;
            }

            if (Math.abs(newWidth - previousWidth) > 1) {
              // Preserve the relative location when responsive sizing changes.
              const ratio = newWidth / previousWidth;
              offsetRef.current *= ratio;
              groupWidthRef.current = newWidth;
              wrapOffset();
              applyPosition();
            }
          })
        : null;

    if (observer && groupRef.current) {
      observer.observe(groupRef.current);
    }

    window.addEventListener("resize", setup);

    return () => {
      cancelAnimationFrame(firstFrame);
      observer?.disconnect();
      window.removeEventListener("resize", setup);
    };
  }, [items.length, direction]);

  useEffect(() => {
    let mounted = true;

    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    const tick = (time) => {
      if (!mounted) return;

      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }

      const delta = Math.min(time - lastTimeRef.current, 40);
      lastTimeRef.current = time;

      const width = groupWidthRef.current || getGroupMetrics().width;

      if (
        width &&
        initializedRef.current &&
        !draggingRef.current &&
        !manualAnimatingRef.current &&
        !reduceMotion?.matches
      ) {
        const pixelsPerSecond = Math.max(12, Number(speed) || 24);
        const distance = pixelsPerSecond * (delta / 1000);

        offsetRef.current += isRight ? -distance : distance;
        wrapOffset();
        applyPosition();
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      lastTimeRef.current = 0;

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [direction, speed]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }

      if (manualFrameRef.current) {
        cancelAnimationFrame(manualFrameRef.current);
      }
    };
  }, []);

  if (!items.length) return null;

  const loopItems =
    items.length < 4
      ? Array.from({ length: Math.ceil(4 / items.length) }, () => items).flat()
      : items;

  const renderGroup = (copy) => (
    <div
      ref={copy === 0 ? groupRef : undefined}
      className="sst-marquee-group"
      aria-hidden={copy !== 0}
    >
      {loopItems.map((item, index) => renderItem(item, index, copy !== 0))}
    </div>
  );

  return (
    <>
      {showSwipeHint && (
        <div className="mb-3 flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f958b] sm:hidden">
          <span>Swipe to explore</span>
          <ArrowRight size={14} />
        </div>
      )}

      <div
        ref={viewportRef}
        className={`sst-marquee-viewport ${className}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={finishPointer}
        onWheel={handleWheel}
      >
        {/* Buttons sit on top of the card row, not outside the carousel. */}
        <div className="pointer-events-none absolute inset-0 z-40 hidden items-center justify-between px-3 sm:px-4 md:px-5 lg:flex">
          <button
            type="button"
            aria-label="Explore previous items"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              handleManualMove("left");
            }}
            className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/95 text-[#075847] shadow-[0_8px_24px_rgba(0,60,45,0.16)] backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-white hover:shadow-[0_12px_28px_rgba(0,60,45,0.2)] active:scale-95 sm:h-11 sm:w-11 md:h-12 md:w-12"
          >
            <ArrowLeft size={19} strokeWidth={2.4} />
          </button>

          <button
            type="button"
            aria-label="Explore next items"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              handleManualMove("right");
            }}
            className="pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/95 text-[#075847] shadow-[0_8px_24px_rgba(0,60,45,0.16)] backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-white hover:shadow-[0_12px_28px_rgba(0,60,45,0.2)] active:scale-95 sm:h-11 sm:w-11 md:h-12 md:w-12"
          >
            <ArrowRight size={19} strokeWidth={2.4} />
          </button>
        </div>

        <div
          ref={trackRef}
          className="sst-marquee-track"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          {renderGroup(0)}
          {renderGroup(1)}
          {renderGroup(2)}
        </div>
      </div>
    </>
  );
}

function DestinationMarquee({ destinations }) {
  const items = destinations.slice(0, 8);

  return (
    <InteractiveMarquee
      items={items}
      direction="right"
      speed={24}
      renderItem={(destination, index, duplicate) => {
        const image = getImageUrl(destination);

        const name =
          destination?.name ||
          destination?.title ||
          destination?.destinationName ||
          "Destination";

        const id =
          destination?._id || destination?.id || destination?.slug || index;

        const slug = destination?.slug || destination?._id || destination?.id;

        return (
          <DestinationCard
            key={`${id}-${duplicate ? "copy" : "main"}-${index}`}
            image={image}
            name={name}
            slug={slug}
          />
        );
      }}
    />
  );
}

/* =========================================================
   DESTINATION CARD
   ========================================================= */

function DestinationCard({ destination, image, name, slug }) {
  return (
    <Link
      href={`/destinations/${slug}`}
      className="sst-destination-card group"
      aria-label={`Explore ${name}`}
    >
      <div className="sst-destination-card-image bg-[#dcefe8]">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror = null;

              event.currentTarget.src = FALLBACK_DESTINATION_IMAGE;
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dff4ec] to-[#c9e8dd]">
            <div className="text-center">
              <MapPin size={48} className="mx-auto text-[#07875f]" />

              <p className="mt-3 text-sm font-semibold text-[#4c8174]">
                Destination
              </p>
            </div>
          </div>
        )}

        <div className="sst-destination-overlay" />

        <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
          <ArrowRight size={17} />
        </div>

        <div className="sst-destination-content">
          <h3 className="sst-destination-name">{name}</h3>

          <div className="sst-destination-link">
            Explore destination
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* =========================================================
   PACKAGE MARQUEE
   ========================================================= */

function PackageMarquee({ packages }) {
  const items = packages.slice(0, 8);

  return (
    <InteractiveMarquee
      items={items}
      direction="right"
      speed={22}
      renderItem={(item, index, duplicate) => {
        const image = getImageUrl(item);
        const title = getPackageTitle(item);
        const price = getPackagePrice(item);

        const id = item?._id || item?.id || item?.slug || index;

        const slug = item?.slug || item?._id || item?.id;

        return (
          <PackageCard
            key={`${id}-${duplicate ? "copy" : "main"}-${index}`}
            image={image}
            title={title}
            price={price}
            slug={slug}
          />
        );
      }}
    />
  );
}

/* =========================================================
   PACKAGE CARD
   ========================================================= */

function PackageCard({ image, title, price, slug }) {
  return (
    <Link
      href={`/packages/${slug}`}
      className="sst-package-card group"
      aria-label={`View ${title}`}
    >
      <div className="sst-package-image bg-[#dcefe8]">
        {image ? (
          <img src={image} alt={title} loading="lazy" decoding="async" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dff4ec] to-[#c9e8dd]">
            <PackageOpen size={52} className="text-[#07875f]" />
          </div>
        )}

        <div className="sst-package-overlay" />

        <div className="sst-package-top">
          <span className="sst-package-badge">SST Travels</span>

          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md">
            <ArrowRight size={15} />
          </span>
        </div>

        <div className="sst-package-content">
          <h3 className="sst-package-title">{title}</h3>
        </div>
      </div>

      <div className="sst-package-footer">
        <div>
          <p className="sst-package-price-label">Starting From</p>

          <p className="sst-package-price">
            {price ? `₹${Number(price).toLocaleString("en-IN")}` : "Contact Us"}
          </p>
        </div>

        <span className="sst-package-arrow">
          <ArrowRight size={18} />
        </span>
      </div>
    </Link>
  );
}

/* =========================================================
   WHY SST CARD
   ========================================================= */

function WhySSTCard({ icon, title, text }) {
  return (
    <div className="sst-why-card group">
      <div className="sst-why-icon">{icon}</div>

      <h3 className="sst-why-title">{title}</h3>

      <p className="sst-why-text">{text}</p>

      <div className="sst-why-line" />
    </div>
  );
}

/* =========================================================
   SECTION HEADING
   ========================================================= */

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-[780px]">
      <div className="text-xs font-black tracking-[0.22em] text-[#07805f]">
        {eyebrow}
      </div>

      <h2 className="sst-section-title mt-4 font-black text-[#074d40]">
        <AnimatedLetters text={title} />
      </h2>

      <p className="sst-section-description mt-5 text-[#587b73]">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   MINI FEATURE
   ========================================================= */

function MiniFeature({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#08795f] text-white shadow-[0_8px_20px_rgba(0,100,75,0.16)]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-extrabold text-[#074d40]">{title}</div>

        <div className="mt-0.5 text-xs font-medium text-[#42776d]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BOTTOM FEATURE
   ========================================================= */

function BottomFeature({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9f4ea] text-[#07805f]">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-extrabold text-[#074d40]">{title}</div>

        <div className="mt-0.5 text-[11px] font-medium text-[#65a394]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REVEAL
   ========================================================= */

function Reveal({ children, delay = 0, className = "", once = false }) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const node = observerRef.current;

    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);

          if (once) observer.unobserve(node);
        } else if (!once) {
          setVisible(false);
        }
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -70px 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={observerRef}
      className={`reveal-transition ${visible ? "reveal-visible" : "reveal-hidden"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedLetters({ text, className = "", delay = 0, stagger = 30 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const animationIdRef = useRef(0);
  const value = String(text ?? "");

  useEffect(() => {
    const node = ref.current;

    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    let resetFrame = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animationIdRef.current += 1;
          const nextId = animationIdRef.current;

          setVisible(false);

          resetFrame = requestAnimationFrame(() => {
            if (animationIdRef.current === nextId) {
              setVisible(true);
            }
          });
        } else {
          setVisible(false);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "-20px 0px -70px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (resetFrame) cancelAnimationFrame(resetFrame);
    };
  }, []);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {value.split("").map((letter, index) => (
        <span
          key={`${index}-${letter}`}
          aria-hidden="true"
          className={`sst-letter ${visible ? "sst-letter-visible" : ""}`}
          style={{ transitionDelay: `${delay + index * stagger}ms` }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </span>
  );
}

/* =========================================================
   LOADING MARQUEE
   ========================================================= */

function LoadingMarquee({ type = "destination" }) {
  const isDestination = type === "destination";

  return (
    <div className="mt-12 flex gap-4 overflow-hidden">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className={`${isDestination ? "w-[clamp(280px,29vw,430px)]" : "w-[clamp(285px,29vw,430px)]"} shrink-0 overflow-hidden rounded-[28px] bg-white shadow-[0_14px_38px_rgba(0,75,58,0.06)]`}
        >
          <div className="h-[250px] animate-pulse bg-[#dfeee9]" />

          <div className="p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-[#e1eee9]" />

            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#edf5f2]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({ message }) {
  return (
    <div className="mt-12 rounded-[30px] border border-dashed border-[#b9ddd1] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e2f6ee] text-[#07805f]">
        <Route size={28} />
      </div>

      <p className="mt-5 text-[#64827a]">{message}</p>
    </div>
  );
}
