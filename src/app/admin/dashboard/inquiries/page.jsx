"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import StatCard from "@/components/admin/StatCard";
import { adminApi } from "@/utils/adminApi";

/* =========================================================
   STATUS OPTIONS
========================================================= */

const statusOptions = [
  {
    label: "All Statuses",
    value: "all",
  },
  {
    label: "New",
    value: "new",
  },
  {
    label: "Contacted",
    value: "contacted",
  },
  {
    label: "Resolved",
    value: "resolved",
  },
  {
    label: "Archived",
    value: "archived",
  },
];

/* =========================================================
   STATUS STYLES
========================================================= */

const statusStyles = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-50 text-slate-600 border-slate-200",
};

function getStatusClass(status) {
  return statusStyles[status] || "bg-slate-50 text-slate-600 border-slate-200";
}

/* =========================================================
   DATE
========================================================= */

function formatDate(date) {
  if (!date) {
    return "N/A";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================================================
   DATE + TIME
========================================================= */

function formatDateTime(date) {
  if (!date) {
    return "N/A";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

/* =========================================================
   RELATED NAME
========================================================= */

function getRelatedName(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.name || value.title || null;
}

/* =========================================================
   PAGE
========================================================= */

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const [deleteInquiry, setDeleteInquiry] = useState(null);

  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* =========================================================
     LOAD INQUIRIES
  ========================================================= */

  const loadInquiries = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (status !== "all") {
          params.set("status", status);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const query = params.toString();

        const url = `/api/dashboard/inquiries` + (query ? `?${query}` : "");

        const response = await adminApi.get(url);

        if (!response?.success) {
          throw new Error(response?.message || "Failed to load inquiries.");
        }

        const inquiryData = Array.isArray(response.data) ? response.data : [];

        setInquiries(inquiryData);
      } catch (error) {
        console.error("Load Inquiries Error:", error);

        setError(getErrorMessage(error, "Failed to load inquiries."));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, status],
  );

  /* =========================================================
     INITIAL / FILTER LOAD
  ========================================================= */

  useEffect(() => {
    loadInquiries();
  }, [status, search, loadInquiries]);

  /* =========================================================
     SEARCH
  ========================================================= */

  function handleSearch() {
    setSearch(searchInput.trim());
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
  }

  /* =========================================================
     UPDATE INQUIRY
  ========================================================= */

  async function updateInquiry(id, updateData) {
    try {
      setUpdating(true);
      setError("");

      const response = await adminApi.patch(
        `/api/dashboard/inquiries/${id}`,
        updateData,
      );

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update inquiry.");
      }

      const updatedInquiry = response.data;

      if (!updatedInquiry) {
        throw new Error("Updated inquiry was not returned by the server.");
      }

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry._id === id ? updatedInquiry : inquiry,
        ),
      );

      setSelectedInquiry((current) =>
        current?._id === id ? updatedInquiry : current,
      );

      return updatedInquiry;
    } catch (error) {
      console.error("Update Inquiry Error:", error);

      setError(getErrorMessage(error, "Failed to update inquiry."));

      throw error;
    } finally {
      setUpdating(false);
    }
  }

  /* =========================================================
     VIEW INQUIRY
  ========================================================= */

  async function handleViewInquiry(inquiry) {
    setSelectedInquiry(inquiry);

    if (!inquiry.isRead) {
      try {
        await updateInquiry(inquiry._id, {
          isRead: true,
        });
      } catch (error) {
        console.error("Mark inquiry as read error:", error);
      }
    }
  }

  /* =========================================================
     DELETE INQUIRY
  ========================================================= */

  async function handleDeleteInquiry() {
    if (!deleteInquiry?._id) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const id = deleteInquiry._id;

      const response = await adminApi.delete(`/api/dashboard/inquiries/${id}`);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete inquiry.");
      }

      setInquiries((current) =>
        current.filter((inquiry) => inquiry._id !== id),
      );

      setSelectedInquiry((current) => (current?._id === id ? null : current));

      setDeleteInquiry(null);
    } catch (error) {
      console.error("Delete Inquiry Error:", error);

      setError(getErrorMessage(error, "Failed to delete inquiry."));
    } finally {
      setDeleting(false);
    }
  }

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const unread = inquiries.filter((item) => !item.isRead).length;

    const read = inquiries.filter((item) => item.isRead).length;

    const resolved = inquiries.filter(
      (item) => item.status === "resolved",
    ).length;

    return {
      total: inquiries.length,
      unread,
      read,
      resolved,
    };
  }, [inquiries]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <RefreshCw
                  size={24}
                  className="animate-spin text-emerald-600"
                />
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading inquiries...
              </p>

              <p className="mt-1 text-xs text-slate-400">Please wait</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <>
      <main className="min-h-screen bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Mail size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Inquiries
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage visitor questions and travel requests.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                loadInquiries({
                  showLoading: false,
                })
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          ) : null}

          {/* =================================================
              REUSABLE STAT CARDS
          ================================================= */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total"
              value={stats.total}
              description="Current inquiries"
              icon={<Mail size={18} />}
            />

            <StatCard
              title="Unread"
              value={stats.unread}
              description="Need attention"
              icon={<Mail size={18} />}
            />

            <StatCard
              title="Read"
              value={stats.read}
              description="Already reviewed"
              icon={<CheckCircle2 size={18} />}
            />

            <StatCard
              title="Resolved"
              value={stats.resolved}
              description="Completed requests"
              icon={<CheckCircle size={18} />}
            />
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="mb-6 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by name, email, phone..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSearch}
                disabled={refreshing}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Search
              </button>

              {search ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* =================================================
              TABLE / LIST
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            {inquiries.length === 0 ? (
              <div className="p-6 text-center sm:p-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Mail size={22} />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-700">
                  No inquiries found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try changing your search or status filter.
                </p>
              </div>
            ) : (
              <>
                {/* =================================================
                    DESKTOP
                ================================================= */}

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[950px] text-left text-sm">
                    <thead className="border-b border-emerald-100 bg-emerald-50/60">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Visitor
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Subject
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Status
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Read
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Date
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {inquiries.map((inquiry) => {
                        const unread = !inquiry.isRead;

                        return (
                          <tr
                            key={inquiry._id}
                            className={`transition ${
                              unread
                                ? "border-l-4 border-emerald-500 bg-emerald-50/50"
                                : "border-l-4 border-transparent"
                            } hover:bg-emerald-50/40`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                    unread
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  <User size={16} />
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className={`truncate ${
                                      unread
                                        ? "font-bold text-slate-900"
                                        : "font-semibold text-slate-700"
                                    }`}
                                  >
                                    {inquiry.name}
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {inquiry.email}
                                  </p>

                                  <p className="truncate text-xs text-slate-400">
                                    {inquiry.phone}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-xs px-5 py-4">
                              <p
                                className={`truncate ${
                                  unread
                                    ? "font-bold text-slate-900"
                                    : "font-medium text-slate-700"
                                }`}
                              >
                                {inquiry.subject || "No subject"}
                              </p>

                              <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                                {inquiry.message}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                                  inquiry.status,
                                )}`}
                              >
                                {inquiry.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {inquiry.isRead ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                  <CheckCircle2 size={13} />
                                  Read
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                  New
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                              {formatDate(inquiry.createdAt)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewInquiry(inquiry)}
                                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                >
                                  <Eye size={15} />
                                  View
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeleteInquiry(inquiry)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                                  title="Delete inquiry"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* =================================================
                    MOBILE / TABLET
                ================================================= */}

                <div className="space-y-3 p-3 lg:hidden">
                  {inquiries.map((inquiry) => {
                    const unread = !inquiry.isRead;

                    return (
                      <div
                        key={inquiry._id}
                        className={`rounded-xl border bg-white p-4 ${
                          unread
                            ? "border-emerald-300 border-l-4"
                            : "border-slate-200 border-l-4 border-l-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                unread
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <User size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {inquiry.name}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {inquiry.email}
                              </p>
                            </div>
                          </div>

                          {inquiry.isRead ? (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                              Read
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              New
                            </span>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {inquiry.subject || "No subject"}
                            </p>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize ${getStatusClass(
                                inquiry.status,
                              )}`}
                            >
                              {inquiry.status}
                            </span>
                          </div>

                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                            {inquiry.message}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-400">
                            {formatDate(inquiry.createdAt)}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewInquiry(inquiry)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteInquiry(inquiry)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* =======================================================
          DETAILS MODAL
      ======================================================= */}

      {selectedInquiry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Inquiry Details
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Received {formatDateTime(selectedInquiry.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {/* VISITOR */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Visitor
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedInquiry.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {selectedInquiry.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Phone
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Phone size={14} className="text-emerald-600" />

                      {selectedInquiry.phone}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Read Status
                    </p>

                    <div className="mt-1">
                      {selectedInquiry.isRead ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          <CheckCircle2 size={13} />
                          Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBJECT */}

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Subject
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selectedInquiry.subject || "No subject"}
                </p>
              </div>

              {/* MESSAGE */}

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Message
                </p>

                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {selectedInquiry.message}
                  </p>
                </div>
              </div>

              {/* PACKAGE */}

              {selectedInquiry.packageId ? (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Package
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {getRelatedName(selectedInquiry.packageId) ||
                      "Selected package"}
                  </p>
                </div>
              ) : null}

              {/* DESTINATION */}

              {selectedInquiry.destinationId ? (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Destination
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {getRelatedName(selectedInquiry.destinationId) ||
                      "Selected destination"}
                  </p>
                </div>
              ) : null}

              {/* STATUS */}

              <div className="mt-5">
                <label
                  htmlFor="inquiry-status"
                  className="mb-2 block text-sm font-bold text-slate-900"
                >
                  Status
                </label>

                <select
                  id="inquiry-status"
                  value={selectedInquiry.status || "new"}
                  disabled={updating}
                  onChange={(event) =>
                    updateInquiry(selectedInquiry._id, {
                      status: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="new">New</option>

                  <option value="contacted">Contacted</option>

                  <option value="resolved">Resolved</option>

                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* ADMIN NOTE */}

              <div className="mt-5">
                <label
                  htmlFor="admin-note"
                  className="mb-2 block text-sm font-bold text-slate-900"
                >
                  Admin Note
                </label>

                <textarea
                  id="admin-note"
                  key={selectedInquiry._id}
                  defaultValue={selectedInquiry.adminNote || ""}
                  rows={4}
                  placeholder="Add an internal note..."
                  onBlur={(event) => {
                    const value = event.target.value;

                    if (value !== (selectedInquiry.adminNote || "")) {
                      updateInquiry(selectedInquiry._id, {
                        adminNote: value,
                      });
                    }
                  }}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Internal note only. Visitors cannot see this.
                </p>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setDeleteInquiry(selectedInquiry)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete
              </button>

              <button
                type="button"
                onClick={() =>
                  updateInquiry(selectedInquiry._id, {
                    status: "resolved",
                  })
                }
                disabled={updating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle size={16} />

                {updating ? "Updating..." : "Mark as Resolved"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* =======================================================
          DELETE CONFIRMATION
      ======================================================= */}

      {deleteInquiry ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 size={22} />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Delete this inquiry?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                This will permanently remove this inquiry from the database.
                This action cannot be undone.
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Inquiry
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {deleteInquiry.subject || "No subject"}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {deleteInquiry.name}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => !deleting && setDeleteInquiry(null)}
                disabled={deleting}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteInquiry}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
