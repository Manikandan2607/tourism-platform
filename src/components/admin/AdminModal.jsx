"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function AdminModal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  maxWidth = "max-w-4xl",
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-200 ${
        visible
          ? "bg-slate-950/45 backdrop-blur-sm"
          : "bg-slate-950/0 backdrop-blur-0"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${maxWidth} max-h-[92dvh] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl transition-all duration-200 ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.98] opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}

            <div className="min-w-0">
              <h2
                id="admin-modal-title"
                className="truncate text-lg font-bold text-slate-900"
              >
                {title}
              </h2>

              {description ? (
                <p className="mt-0.5 text-sm text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92dvh-80px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}