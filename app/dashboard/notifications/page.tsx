"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebaseServices";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  image?: string;
  sent?: boolean;
  sentCount?: number;
  failedCount?: number;
  createdAt?: any;
};

type FormState = {
  title: string;
  body: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
};

export default function Page() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<NotificationItem | null>(null);
  const [deleting, setDeleting] = useState<NotificationItem | null>(null);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 9;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "notifications"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);

        const data: NotificationItem[] = snap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            title: x.title || "",
            body: x.body || "",
            image: x.image || "",
            sent: x.sent || false,
            sentCount: x.sentCount || 0,
            failedCount: x.failedCount || 0,
            createdAt: x.createdAt || null,
          };
        });

        setNotifications(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalPages = Math.max(1, Math.ceil(notifications.length / perPage));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return notifications.slice(start, start + perPage);
  }, [notifications, safePage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const uploadImage = async () => {
    if (!file) return "";
    const storageRef = ref(
      storage,
      `notifications/${Date.now()}-${file.name}`
    );
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const safelyDeleteImageByUrl = async (url?: string) => {
    if (!url) return;
    try {
      await deleteObject(ref(storage, url));
    } catch (err) {
      console.error("Image delete skipped/failed:", err);
    }
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setRemoveExistingImage(false);
    setSaving(false);
    setError("");
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setRemoveExistingImage(false);
    setAdding(true);
    setEditing(null);
    setError("");
  };

  const openEditModal = (item: NotificationItem) => {
    setEditing(item);
    setAdding(false);
    setFile(null);
    setRemoveExistingImage(false);
    setForm({
      title: item.title || "",
      body: item.body || "",
    });
    setError("");
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.body.trim()) return "Message is required.";
    return "";
  };

  const handleAdd = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const imageUrl = await uploadImage();

      const docRef = await addDoc(collection(db, "notifications"), {
        title: form.title,
        body: form.body,
        image: imageUrl,
        createdAt: serverTimestamp(),
        sent: false,
        sentCount: 0,
        failedCount: 0,
      });

      setNotifications((prev) => [
        {
          id: docRef.id,
          title: form.title,
          body: form.body,
          image: imageUrl,
          sent: false,
          sentCount: 0,
          failedCount: 0,
          createdAt: new Date(),
        },
        ...prev,
      ]);

      setPage(1);
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to create notification.");
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      let nextImageUrl = editing.image || "";

      if (file) {
        if (editing.image) {
          await safelyDeleteImageByUrl(editing.image);
        }
        nextImageUrl = await uploadImage();
      } else if (removeExistingImage) {
        await safelyDeleteImageByUrl(editing.image);
        nextImageUrl = "";
      }

      await updateDoc(doc(db, "notifications", editing.id), {
        title: form.title,
        body: form.body,
        image: nextImageUrl,
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === editing.id
            ? {
                ...n,
                title: form.title,
                body: form.body,
                image: nextImageUrl,
              }
            : n
        )
      );

      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to update notification.");
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    try {
      await deleteDoc(doc(db, "notifications", deleting.id));
      await safelyDeleteImageByUrl(deleting.image);

      const remaining = notifications.filter((n) => n.id !== deleting.id);
      setNotifications(remaining);
      setDeleting(null);

      const nextTotalPages = Math.max(1, Math.ceil(remaining.length / perPage));
      if (page > nextTotalPages) setPage(nextTotalPages);
    } catch (err) {
      console.error(err);
      setError("Failed to delete notification.");
      setDeleting(null);
    }
  };

  const currentImagePreview = file
    ? URL.createObjectURL(file)
    : editing && !removeExistingImage
      ? editing.image || ""
      : "";

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
            Notifications
          </h1>
          <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
            Create and manage push notifications for app users.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white"
        >
          Create Notification
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#ff7a59]/40 bg-[#0a0a0a] px-5 py-10 text-center text-[#f3ead7]/70">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-[#ff7a59]/40 bg-[#0a0a0a] px-5 py-10 text-center text-[#f3ead7]/70">
          No notifications found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginatedData.map((n) => (
            <div
              key={n.id}
              className="group flex flex-col justify-between rounded-2xl bg-[#ece2cb] p-4 text-black shadow-sm ring-1 ring-black/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
            >
              <div>
                {n.image ? (
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={n.image}
                      alt={n.title}
                      className="mb-3 h-36 w-full object-cover border border-black/10 transition duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl border border-dashed border-black/15 bg-white/50 text-sm text-black/40">
                    No image
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold md:text-lg truncate group-hover:text-[#ff7a59] transition">
                    {n.title}
                  </h3>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      n.sent
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {n.sent ? "Sent" : "Pending"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-black/65 line-clamp-4">
                  {n.body}
                </p>

                <div className="mt-3 flex gap-2 text-xs">
                  <span className="rounded-full bg-black/5 px-2 py-1">
                    Success: {n.sentCount || 0}
                  </span>
                  <span className="rounded-full bg-black/5 px-2 py-1">
                    Failed: {n.failedCount || 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelected(n)}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-black transition-all duration-200 hover:bg-black hover:text-white md:text-sm"
                >
                  View
                </button>

                <button
                  onClick={() => openEditModal(n)}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-[#ff7a59] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md md:text-sm"
                >
                  Update
                </button>

                <button
                  onClick={() => setDeleting(n)}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-500 transition-all duration-200 hover:scale-[1.03] hover:bg-red-500 hover:text-white hover:shadow-md md:text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > perPage && (
        <div className="mt-8 flex justify-between items-center text-sm text-[#f3ead7]/70">
          <p>
            Showing {(safePage - 1) * perPage + 1}–
            {Math.min(safePage * perPage, notifications.length)} of {notifications.length} notifications
          </p>

          <div className="flex gap-2">
            <button
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>

            <button className="px-3 py-1 bg-[#ff7a59] text-white rounded-lg">
              {safePage}
            </button>

            <button
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {(adding || editing) && (
        <Modal
          title={adding ? "Create Notification" : "Edit Notification"}
          onClose={closeModal}
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Title"
            value={form.title}
            onChange={(v: string) => setForm((prev) => ({ ...prev, title: v }))}
          />

          <Textarea
            label="Message"
            value={form.body}
            onChange={(v: string) => setForm((prev) => ({ ...prev, body: v }))}
          />

          <div className="mt-5">
            <label className="text-black text-sm font-semibold">Image (optional)</label>

            <div className="mt-3 flex flex-col items-center gap-4 rounded-2xl border border-[#ff7a59]/25 bg-white/35 px-4 py-5">
              {currentImagePreview ? (
                <img
                  src={currentImagePreview}
                  alt="Notification preview"
                  className="h-32 w-full rounded-2xl border border-black/10 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-dashed border-black/20 bg-black/5 text-sm text-black/40">
                  No image
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="cursor-pointer rounded-xl border border-[#ff7a59] px-4 py-2 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white">
                  {editing ? "Change Image" : "Upload Image"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      setRemoveExistingImage(false);
                      setFile(e.target.files?.[0] || null);
                    }}
                  />
                </label>

                {(file || editing?.image) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (editing?.image) setRemoveExistingImage(true);
                    }}
                    className="rounded-xl border border-red-400 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-[#ff7a59] py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? adding
                ? "Creating..."
                : "Saving..."
              : adding
                ? "Create & Send"
                : "Save Changes"}
          </button>
        </Modal>
      )}

      {selected && (
        <Modal title="Notification Details" onClose={() => setSelected(null)}>
          <div className="space-y-4 text-black">
            {selected.image ? (
              <img
                src={selected.image}
                alt={selected.title}
                className="h-40 w-full rounded-2xl object-cover border border-black/10"
              />
            ) : null}

            <div>
              <p className="text-sm font-semibold text-black/60">Title</p>
              <p className="mt-1 text-base font-semibold">{selected.title}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-black/60">Message</p>
              <div className="mt-1 rounded-xl border border-black/10 bg-white p-4 text-sm">
                {selected.body}
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <span className="rounded-full bg-black/5 px-3 py-1">
                Sent: {selected.sent ? "Yes" : "No"}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1">
                Success: {selected.sentCount || 0}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1">
                Failed: {selected.failedCount || 0}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete Notification" onClose={() => setDeleting(null)}>
          <p className="text-black">
            Delete <span className="font-semibold">{deleting.title}</span>?
          </p>

          <p className="mt-2 text-sm text-black/60">
            This action will remove the notification record from your dashboard.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleting(null)}
              className="rounded-xl border border-black/15 px-4 py-2 text-black"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-xl bg-red-500 px-4 py-2 text-white"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#e8dcc7] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#ff7a59]">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-black transition hover:bg-black/20"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="text-black text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-[#ff7a59]"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="text-black text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-28 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-[#ff7a59]"
      />
    </div>
  );
}