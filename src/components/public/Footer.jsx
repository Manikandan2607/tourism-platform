"use client";

import Link from "next/link";
import { Mail, MapPin, PhoneCall } from "lucide-react";

const footerLinks = [
  {
    title: "Explore",
    links: [
      { label: "Destinations", href: "/destinations" },
      { label: "Packages", href: "/packages" },
      { label: "Hotels", href: "/hotels" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const CONTACT_EMAIL = "manikandan.m20060726@gmail.com";
const CONTACT_PHONE = "+91 7708985232";

const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  CONTACT_EMAIL,
)}`;

const PHONE_URL = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#034c3d] text-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full border border-white/30" />
        <div className="absolute -left-12 top-16 h-72 w-72 rounded-full border border-white/20" />
        <div className="absolute -bottom-16 -right-20 h-72 w-72 rounded-full border border-white/20" />
        <div className="absolute right-20 top-8 h-36 w-36 rounded-full border border-white/10" />
      </div>

      {/* Main footer */}
      <div className="relative z-10 mx-auto w-full max-w-[1380px] px-5 py-9 sm:px-6 sm:py-10 lg:px-8 lg:py-11">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.8fr_0.8fr_1.15fr] lg:gap-10 xl:gap-14">
          {/* BRAND */}
          <div className="min-w-0">
            <Link
              href="/"
              aria-label="SST Travels Home"
              className="inline-flex items-start"
            >
              <img
                src="/images/sst-travels-logo.png"
                alt="SST Travels"
                draggable="false"
                className="block h-auto w-[108px] max-w-full object-contain object-left sm:w-[115px] lg:w-[120px]"
              />
            </Link>

            <p className="mt-3 max-w-[350px] text-[11px] leading-5 text-white/60 sm:text-xs">
              Comfortable rides, safe journeys and memorable travel
              experiences for every destination.
            </p>

            {/* Email */}
            <a
              href={GMAIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex max-w-full items-center gap-2.5 text-[11px] font-medium text-white/70 transition-colors duration-300 hover:text-[#b8f0df] sm:text-xs"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Mail size={14} />
              </span>

              <span className="min-w-0 break-all">{CONTACT_EMAIL}</span>
            </a>

            {/* Phone */}
            <a
              href={PHONE_URL}
              className="mt-2.5 flex items-center gap-2.5 text-[11px] font-medium text-white/70 transition-colors duration-300 hover:text-[#b8f0df] sm:text-xs"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                <PhoneCall size={14} />
              </span>

              <span>{CONTACT_PHONE}</span>
            </a>
          </div>

          {/* EXPLORE */}
          <div className="min-w-0">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9ead7]">
              Explore
            </h3>

            <div className="mt-4 flex flex-col gap-2.5">
              {footerLinks[0].links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-[11px] text-white/60 transition-all duration-300 hover:translate-x-1 hover:text-white sm:text-xs"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* COMPANY */}
          <div className="min-w-0">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9ead7]">
              Company
            </h3>

            <div className="mt-4 flex flex-col gap-2.5">
              {footerLinks[1].links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-[11px] text-white/60 transition-all duration-300 hover:translate-x-1 hover:text-white sm:text-xs"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[#b8f0df]">
              <MapPin size={14} />

              <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
                SST Travels
              </span>
            </div>

            <h3 className="mt-2.5 text-[22px] font-black leading-[1.08] sm:text-[24px] lg:text-[26px]">
              Travel More.
              <br />
              Explore More.
            </h3>

            <p className="mt-2.5 max-w-[270px] text-[11px] leading-5 text-white/55 sm:text-xs">
              Let every road become part of your story with SST Travels.
            </p>

            <Link
              href="/contact"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-bold text-[#075847] shadow-[0_8px_20px_rgba(0,0,0,0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#effff9] sm:text-xs"
            >
              <PhoneCall size={13} />
              Contact Us
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-white/10 sm:my-7" />

        {/* Bottom */}
        <div className="flex flex-col gap-3 text-[10px] text-white/40 sm:flex-row sm:items-center sm:justify-between sm:text-[11px]">
          <p>
            © {new Date().getFullYear()} SST Travels. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/privacy-policy"
              className="transition-colors duration-300 hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="transition-colors duration-300 hover:text-white"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}