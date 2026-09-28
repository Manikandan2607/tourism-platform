import Link from "next/link";
import { Globe2, Mail, MapPin, PhoneCall, Plane } from "lucide-react";

/* =========================================================
   FOOTER LINKS
   ========================================================= */

const footerLinks = [
  {
    title: "Explore",
    links: [
      {
        label: "Destinations",
        href: "/destinations",
      },
      {
        label: "Packages",
        href: "/packages",
      },
      {
        label: "Hotels",
        href: "/hotels",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "About Us",
        href: "/about",
      },
      {
        label: "Contact",
        href: "/contact",
      },
      {
        label: "Food & Travel",
        href: "/food-travel",
      },
    ],
  },
];

/* =========================================================
   CONTACT DETAILS

   IMPORTANT:
   Replace these two values with your actual SST Travels
   Gmail address and contact number.
   ========================================================= */

const CONTACT_EMAIL = "manikandan.m20060726@gmail.com";
const CONTACT_PHONE = "+91 7708985232";

/* =========================================================
   FOOTER
   ========================================================= */

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#034c3d] text-white">
      {/* ===================================================
          BACKGROUND DECORATION
          =================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full border border-white/30" />

        <div className="absolute -left-12 top-20 h-80 w-80 rounded-full border border-white/20" />

        <div className="absolute -right-24 -bottom-20 h-80 w-80 rounded-full border border-white/20" />

        <div className="absolute right-20 top-10 h-40 w-40 rounded-full border border-white/10" />
      </div>

      {/* ===================================================
          MAIN FOOTER CONTENT
          Reduced vertical size
          =================================================== */}

      <div className="relative z-10 mx-auto max-w-[1380px] px-6 py-10 lg:px-10 lg:py-12">
        <div className="grid gap-9 lg:grid-cols-[1.55fr_0.9fr_0.9fr_1.1fr]">
          {/* =================================================
              BRAND
              ================================================= */}

          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              {/* Logo */}
              <div className="relative flex h-12 w-12 items-center justify-center">
                <Globe2
                  size={44}
                  strokeWidth={1.5}
                  className="text-[#b8f0df]"
                />

                <Plane
                  size={20}
                  className="absolute -right-1 -top-1 rotate-[-25deg] fill-[#b8f0df] text-[#b8f0df]"
                />
              </div>

              {/* Brand text */}
              <div>
                <div className="text-2xl font-black tracking-tight">
                  SST Travels
                </div>

                <div className="mt-0.5 text-[10px] tracking-[0.12em] text-white/55">
                  EXPLORE • DISCOVER • EXPERIENCE
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-[380px] text-sm leading-6 text-white/60">
              Comfortable rides, safe journeys and memorable travel experiences
              for every destination.
            </p>

            {/* =================================================
                GMAIL LINK
                ================================================= */}

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-flex items-center gap-3 text-sm font-medium text-white/70 transition-colors duration-300 hover:text-[#b8f0df]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Mail size={17} />
              </span>

              <span>{CONTACT_EMAIL}</span>
            </a>

            {/* =================================================
                PHONE CONTACT
                ================================================= */}

            <a
              href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
              className="mt-3 flex items-center gap-3 text-sm font-medium text-white/70 transition-colors duration-300 hover:text-[#b8f0df]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <PhoneCall size={17} />
              </span>

              <span>{CONTACT_PHONE}</span>
            </a>
          </div>

          {/* =================================================
              EXPLORE LINKS
              ================================================= */}

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#a9ead7]">
                {group.title}
              </h3>

              <div className="mt-5 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="w-fit text-sm text-white/60 transition-all duration-300 hover:translate-x-1 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* =================================================
              RIGHT CONTACT / MESSAGE
              ================================================= */}

          <div>
            <div className="flex items-center gap-2 text-[#b8f0df]">
              <MapPin size={17} />

              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                SST Travels
              </span>
            </div>

            <h3 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              Travel More.
              <br />
              Explore More.
            </h3>

            <p className="mt-3 max-w-[300px] text-sm leading-6 text-white/55">
              Let every road become part of your story with SST Travels.
            </p>

            {/* Contact Button */}
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#075847] shadow-[0_8px_25px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#effff9]"
            >
              <PhoneCall size={16} />
              Contact Us
            </Link>
          </div>
        </div>

        {/* ===================================================
            DIVIDER
            =================================================== */}

        <div className="my-8 h-px bg-white/10" />

        {/* ===================================================
            BOTTOM
            =================================================== */}

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} SST Travels. All rights reserved.</p>

          <div className="flex items-center gap-5">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link href="/terms" className="transition-colors hover:text-white">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
