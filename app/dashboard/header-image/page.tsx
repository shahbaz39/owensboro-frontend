"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { db, storage } from "@/lib/firebaseServices";

/* TYPES */
type HeaderImage = {
  id: string;
  title: string;
  image: string;
};

export default function Page() {
  const [items, setItems] = useState<HeaderImage[]>([]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<HeaderImage | null>(null);
  const [deleting, setDeleting] = useState<HeaderImage | null>(null);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({ title: "" });

  /* PAGINATION */
  const [page, setPage] = useState(1);
  const perPage = 9;

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page]);

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "HeaderImages"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        image: d.data().image,
      }));

      setItems(data);
    };

    fetchData();
  }, []);

  /* IMAGE */
  const uploadImage = async () => {
    if (!file) return "";
    const r = ref(storage, `header/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  };

  const deleteImage = async (url: string) => {
    try {
      await deleteObject(ref(storage, url));
    } catch {}
  };

  /* ADD */
  const handleAdd = async () => {
    if (!form.title || !file) return;

    setLoading(true);

    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "HeaderImages"), {
      title: form.title,
      image: imageUrl,
      createdAt: new Date(),
    });

    setItems((prev) => [
      { id: docRef.id, title: form.title, image: imageUrl },
      ...prev,
    ]);

    closeModal();
    setLoading(false);
  };

  /* UPDATE */
  const handleUpdate = async () => {
    if (!editing) return;

    setLoading(true);

    let imageUrl = editing.image;

    if (file) {
      await deleteImage(editing.image);
      imageUrl = await uploadImage();
    }

    await updateDoc(doc(db, "HeaderImages", editing.id), {
      title: form.title,
      image: imageUrl,
    });

    setItems((prev) =>
      prev.map((i) =>
        i.id === editing.id
          ? { ...i, title: form.title, image: imageUrl }
          : i
      )
    );

    closeModal();
    setLoading(false);
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!deleting) return;

    await deleteDoc(doc(db, "HeaderImages", deleting.id));
    await deleteImage(deleting.image);

    setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setFile(null);
    setForm({ title: "" });
  };

  const preview = file
    ? URL.createObjectURL(file)
    : editing?.image || "";

  return (
    <div className="px-6 pt-6 pb-10">
      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#ff7a59]">
          Header Images
        </h1>

        <button
          onClick={() => setAdding(true)}
          className="border border-[#ff7a59] px-5 py-2 rounded-xl text-[#ff7a59] hover:bg-[#ff7a59] hover:text-white transition"
        >
          Add Header Image
        </button>
      </div>

      {/* GRID */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {paginatedData.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl bg-[#ece2cb] p-3 text-black ring-1 ring-black/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-[#ff7a59]/40"
          >
            <div className="overflow-hidden rounded-xl">
              <img
                src={item.image}
                className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>

            <h3 className="mt-2 font-semibold">{item.title}</h3>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setEditing(item);
                  setForm({ title: item.title });
                }}
                className="w-full bg-[#ff7a59] text-white py-2 rounded-lg"
              >
                Update
              </button>

              <button
                onClick={() => setDeleting(item)}
                className="w-full border border-red-400 text-red-500 py-2 rounded-lg hover:bg-red-500 hover:text-white transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {items.length > perPage && (
        <div className="mt-8 flex items-center justify-between text-[#f3ead7]">
          <p className="text-sm">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, items.length)} of {items.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-white/20 px-4 py-2 disabled:opacity-40 hover:bg-white/10"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`rounded-xl px-4 py-2 ${
                  page === i + 1
                    ? "bg-[#ff7a59] text-white"
                    : "border border-white/20 hover:bg-white/10"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-white/20 px-4 py-2 disabled:opacity-40 hover:bg-white/10"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {(adding || editing) && (
        <Modal title="Header Image" onClose={closeModal}>
          <Input
            label="Title"
            value={form.title}
            onChange={(v: string) =>
              setForm({ ...form, title: v })
            }
          />

          {/* IMAGE BOX */}
          <div className="mt-5">
            <label className="font-semibold">Image</label>

            <div className="mt-3 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#ff7a59]/40 p-5">
              {preview ? (
                <img
                  src={preview}
                  className="h-32 w-32 rounded-xl object-cover"
                />
              ) : (
                <div className="h-32 w-32 flex items-center justify-center border rounded-xl text-gray-400">
                  No Image
                </div>
              )}

              <div className="flex gap-3">
                <label className="cursor-pointer rounded-xl border border-[#ff7a59] px-4 py-2 text-[#ff7a59] hover:bg-[#ff7a59] hover:text-white transition">
                  {editing ? "Replace" : "Upload"}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFile(e.target.files?.[0] || null)
                    }
                  />
                </label>

                {(file || editing?.image) && (
                  <button
                    onClick={() => setFile(null)}
                    className="rounded-xl border border-red-400 px-4 py-2 text-red-500 hover:bg-red-500 hover:text-white transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </Modal>
      )}

      {/* DELETE */}
      {deleting && (
        <Modal title="Delete" onClose={() => setDeleting(null)}>
          <p>
            Delete <b>{deleting.title}</b>?
          </p>

          <button
            onClick={confirmDelete}
            className="mt-4 w-full bg-red-500 text-white py-2 rounded-xl"
          >
            Delete
          </button>
        </Modal>
      )}
    </div>
  );
}

/* UI */

function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center px-4">
      <div className="bg-[#e8dcc7] p-6 rounded-3xl w-full max-w-lg text-black">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold text-[#ff7a59]">{title}</h2>
          <button onClick={onClose}>✖</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <div className="mt-3">
      <label className="font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#ff7a59] rounded-xl p-3 mt-1"
      />
    </div>
  );
}