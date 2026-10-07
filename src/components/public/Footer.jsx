"use client";

import Link from "next/link";
import { Globe2, Mail, MapPin, PhoneCall, Plane } from "lucide-react";

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
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`;
const PHONE_URL = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

export default function Footer() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .sst-footer-inner {
              padding-left: clamp(1rem, 3.2vw, 2.75rem);
              padding-right: clamp(1rem, 3.2vw, 2.75rem);
              padding-top: clamp(2rem, 4vw, 2.75rem);
              padding-bottom: clamp(1.25rem, 2.5vw, 2rem);
            }

            .sst-footer-grid {
              grid-template-columns: minmax(0, 1.55fr) minmax(0, .8fr) minmax(0, .8fr) minmax(0, 1.1fr);
              gap: clamp(1.5rem, 3vw, 3rem);
            }

            .sst-footer-title {
              font-size: clamp(1.1rem, 1.7vw, 1.45rem);
            }

            .sst-footer-copy,
            .sst-footer-link,
            .sst-footer-contact {
              font-size: clamp(.72rem, .82vw, .82rem);
            }

            .sst-footer-heading {
              font-size: clamp(.62rem, .72vw, .7rem);
            }

            .sst-footer-tagline {
              font-size: clamp(1.3rem, 2.1vw, 1.9rem);
            }

            @media (max-width: 1023px) {
              .sst-footer-grid {
                grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr);
              }

              .sst-footer-cta {
                grid-column: 1 / -1;
              }
            }

            @media (max-width: 639px) {
              .sst-footer-grid {
                grid-template-columns: 1fr 1fr;
                gap: 1.75rem 1rem;
              }

              .sst-footer-brand,
              .sst-footer-cta {
                grid-column: 1 / -1;
              }

              .sst-footer-copy {
                max-width: 100%;
              }

              .sst-footer-bottom {
                align-items: flex-start;
              }

              .sst-footer-bottom-links {
                width: 100%;
                gap: .75rem 1rem;
              }
            }

            @media (max-width: 420px) {
              .sst-footer-grid {
                grid-template-columns: 1fr;
              }

              .sst-footer-explore,
              .sst-footer-company {
                grid-column: auto;
              }
            }
          `,
        }}
      />

      <footer className="relative w-full overflow-hidden bg-[#034c3d] text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -left-24 top-8 h-64 w-64 rounded-full border border-white/30" />
          <div className="absolute -left-12 top-16 h-72 w-72 rounded-full border border-white/20" />
          <div className="absolute -bottom-16 -right-20 h-72 w-72 rounded-full border border-white/20" />
          <div className="absolute right-20 top-8 h-36 w-36 rounded-full border border-white/10" />
        </div>

        <div className="sst-footer-inner relative z-10 mx-auto w-full max-w-[1380px]">
          <div className="sst-footer-grid grid">
            <div className="sst-footer-brand min-w-0">
              <Link
                href="/"
                className="inline-flex max-w-full items-center gap-2.5"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <Globe2
                    size={38}
                    strokeWidth={1.5}
                    className="text-[#b8f0df]"
                  />
                  <Plane
                    size={17}
                    className="absolute -right-1 -top-1 rotate-[-25deg] fill-[#b8f0df] text-[#b8f0df]"
                  />
                </div>

                <div className="min-w-0">
                  <div className="sst-footer-title truncate font-black tracking-tight">
                    SST Travels
                  </div>
                  <div className="mt-0.5 truncate text-[9px] tracking-[0.12em] text-white/55">
                    EXPLORE • DISCOVER • EXPERIENCE
                  </div>
                </div>
              </Link>

              <p className="sst-footer-copy mt-4 max-w-[360px] leading-5 text-white/60">
                Comfortable rides, safe journeys and memorable travel
                experiences for every destination.
              </p>

              <a
                href={GMAIL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sst-footer-contact mt-4 flex max-w-full items-start gap-2.5 font-medium text-white/70 transition-colors duration-300 hover:text-[#b8f0df]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Mail size={15} />
                </span>
                <span className="break-all pt-1">{CONTACT_EMAIL}</span>
              </a>

              <a
                href={PHONE_URL}
                className="sst-footer-contact mt-2.5 flex items-center gap-2.5 font-medium text-white/70 transition-colors duration-300 hover:text-[#b8f0df]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <PhoneCall size={15} />
                </span>
                <span>{CONTACT_PHONE}</span>
              </a>
            </div>

            {footerLinks.map((group, index) => (
              <div
                key={group.title}
                className={`${index === 0 ? "sst-footer-explore" : "sst-footer-company"} min-w-0`}
              >
                <h3 className="sst-footer-heading font-extrabold uppercase tracking-[0.16em] text-[#a9ead7]">
                  {group.title}
                </h3>

                <div className="mt-4 flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="sst-footer-link w-fit text-white/60 transition-all duration-300 hover:translate-x-1 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="sst-footer-cta min-w-0">
              <div className="flex items-center gap-2 text-[#b8f0df]">
                <MapPin size={15} />
                <span className="sst-footer-heading font-bold uppercase tracking-[0.12em]">
                  SST Travels
                </span>
              </div>

              <h3 className="sst-footer-tagline mt-2.5 font-black leading-tight">
                Travel More.
                <br />
                Explore More.
              </h3>

              <p className="sst-footer-copy mt-2.5 max-w-[280px] leading-5 text-white/55">
                Let every road become part of your story with SST Travels.
              </p>

              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#075847] shadow-[0_8px_25px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#effff9]"
              >
                <PhoneCall size={14} />
                Contact Us
              </Link>
            </div>
          </div>

          <div className="my-6 h-px bg-white/10 sm:my-7" />

          <div className="sst-footer-bottom flex flex-col items-start justify-between gap-3 text-[11px] text-white/40 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} SST Travels. All rights reserved.
            </p>

            <div className="sst-footer-bottom-links flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/privacy-policy"
                className="transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-white"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
