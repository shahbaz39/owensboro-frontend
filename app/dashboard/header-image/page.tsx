"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

/* 🔥 IMAGE CACHE */
const imageCache = new Map<string, string>();

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

  const preloadingRef = useRef<Set<string>>(new Set());

  /* PAGINATION */
  const [page, setPage] = useState(1);
  const perPage = 8;

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page]);

  /* 🔥 PRELOAD IMAGE */
  const preloadImage = (src: string) => {
    if (!src) return;
    if (imageCache.has(src)) return;
    if (preloadingRef.current.has(src)) return;

    preloadingRef.current.add(src);

    const img = new Image();
    img.src = src;

    img.onload = () => {
      imageCache.set(src, src);
      preloadingRef.current.delete(src);
    };

    img.onerror = () => {
      preloadingRef.current.delete(src);
    };
  };

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "HeaderImages"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        image: d.data().image,
      }));

      data.forEach((item) => {
        if (item.image) preloadImage(item.image);
      });

      setItems(data);
    };

    fetchData();
  }, []);

  /* RESET PAGE */
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  /* IMAGE */
  const uploadImage = async () => {
    if (!file) return "";
    const r = ref(storage, `header/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    preloadImage(url);
    return url;
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

  return (
    <div className="px-6 pt-6 pb-10">

      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#ff7a59]">
          Header Images
        </h1>

        <button
          onClick={() => setAdding(true)}
          className="border border-[#ff7a59] px-5 py-2 rounded-xl text-[#ff7a59]"
        >
          Add Header Image
        </button>
      </div>

      {/* ✅ TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-[#ece2cb] text-black">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Title</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item) => (
              <Row
                key={item.id}
                item={item}
                setEditing={setEditing}
                setDeleting={setDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {items.length > perPage && (
        <div className="mt-8 flex justify-between items-center text-[#f3ead7]">
          <p className="text-sm">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, items.length)} of {items.length}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded"
            >
              Prev
            </button>

            <button className="px-3 py-1 bg-[#ff7a59] text-white rounded">
              {page}
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODALS unchanged */}
      {(adding || editing) && (
        <Modal title="Header Image" onClose={closeModal}>
          <Input label="Title" value={form.title} onChange={(v:any)=>setForm({...form,title:v})} />

          <input type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="mt-4"/>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete" onClose={() => setDeleting(null)}>
          <button
            onClick={confirmDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Confirm Delete
          </button>
        </Modal>
      )}
    </div>
  );
}

/* 🔥 MEMO ROW */
const Row = React.memo(function Row({ item, setEditing, setDeleting }: any) {
  return (
    <tr className="border-b bg-[#ece2cb] text-black hover:bg-[#f5ecd7]">
      <td className="p-3">
        <img
          src={imageCache.get(item.image) || item.image}
          className="h-14 w-20 rounded-lg object-cover"
        />
      </td>

      <td className="p-3 font-semibold">{item.title}</td>

      <td className="p-3 text-right">
        <button
          onClick={() => setEditing(item)}
          className="bg-[#ff7a59] px-3 py-1 text-white rounded mr-2"
        >
          Update
        </button>

        <button
          onClick={() => setDeleting(item)}
          className="border border-red-400 px-3 py-1 text-red-500"
        >
          Delete
        </button>
      </td>
    </tr>
  );
});

/* UI SAME */
function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-[#e8dcc7] p-6 rounded-3xl w-[90%] max-w-lg text-black">
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