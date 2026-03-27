"use client";

import React, { useEffect, useRef, useState } from "react";
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

/* GLOBAL IMAGE CACHE */
const imageCache = new Map<string, string>();

/* TYPES */
type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  order?: number;
};

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const [dragged, setDragged] = useState<Category | null>(null);

  const [form, setForm] = useState({ name: "", slug: "" });
  const [file, setFile] = useState<File | null>(null);

  const preloadingRef = useRef<Set<string>>(new Set());

  /* 🔥 PAGINATION */
  const [page, setPage] = useState(1);
  const perPage = 8;

  const totalPages = Math.ceil(categories.length / perPage);

  const paginatedData = categories.slice(
    (page - 1) * perPage,
    page * perPage
  );

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
      const snap = await getDocs(collection(db, "Catagories"));

      const data = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: x.catagoryName,
          slug: x.slug || "",
          image: x.image || "",
          order: x.order ?? 999,
        };
      });

      data.forEach((item) => {
        if (item.image) preloadImage(item.image);
      });

      setCategories(
        data.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      );
    };

    fetchData();
  }, []);

  /* RESET PAGE ON DATA CHANGE */
  useEffect(() => {
    setPage(1);
  }, [categories.length]);

  /* IMAGE UPLOAD */
  const uploadImage = async () => {
    if (!file) return "";

    const r = ref(storage, `categories/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);

    const url = await getDownloadURL(r);
    preloadImage(url);

    return url;
  };

  /* ADD */
  const handleAdd = async () => {
    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "Catagories"), {
      catagoryName: form.name,
      slug: form.slug,
      image: imageUrl,
      order: categories.length + 1,
    });

    setCategories((prev) => [
      {
        id: docRef.id,
        name: form.name,
        slug: form.slug,
        image: imageUrl,
        order: prev.length + 1,
      },
      ...prev,
    ]);

    closeModal();
  };

  /* UPDATE */
  const handleUpdate = async () => {
    if (!editing) return;

    let imageUrl = editing.image;

    if (file) {
      await deleteObject(ref(storage, editing.image));
      imageUrl = await uploadImage();
    }

    await updateDoc(doc(db, "Catagories", editing.id), {
      catagoryName: form.name,
      slug: form.slug,
      image: imageUrl,
    });

    setCategories((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? { ...c, name: form.name, slug: form.slug, image: imageUrl }
          : c
      )
    );

    closeModal();
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!deleting) return;

    await deleteDoc(doc(db, "Catagories", deleting.id));
    await deleteObject(ref(storage, deleting.image));

    setCategories((prev) =>
      prev.filter((c) => c.id !== deleting.id)
    );

    setDeleting(null);
  };

  /* DRAG DROP */
  const handleDrop = async (target: Category) => {
    if (!dragged || dragged.id === target.id) return;

    const updated = [...categories];
    const from = updated.findIndex((i) => i.id === dragged.id);
    const to = updated.findIndex((i) => i.id === target.id);

    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    const reordered = updated.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setCategories(reordered);

    await Promise.all(
      reordered.map((item) =>
        updateDoc(doc(db, "Catagories", item.id), {
          order: item.order,
        })
      )
    );
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setForm({ name: "", slug: "" });
    setFile(null);
  };

  return (
    <div className="px-6 pt-6 pb-10">

      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#ff7a59]">
          Categories
        </h1>

        <button
          onClick={() => setAdding(true)}
          className="border border-[#ff7a59] px-5 py-2 rounded-xl text-[#ff7a59]"
        >
          Add Category
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-[#ece2cb] text-black">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Order</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((c) => (
              <CategoryRow
                key={c.id}
                c={c}
                setDragged={setDragged}
                handleDrop={handleDrop}
                setEditing={setEditing}
                setDeleting={setDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[#f3ead7]">

          <p className="text-sm text-[#f3ead7]/70">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, categories.length)} of {categories.length}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-30"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;

              if (
                p !== 1 &&
                p !== totalPages &&
                Math.abs(p - page) > 1
              ) return null;

              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg ${
                    page === p
                      ? "bg-[#ff7a59] text-white"
                      : "border border-white/10"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-white/10 rounded-lg disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODALS unchanged */}
      {(adding || editing) && (
        <Modal title="Category" onClose={closeModal}>
          <Input label="Name" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} />
          <Input label="Slug" value={form.slug} onChange={(v: string) => setForm({ ...form, slug: v })} />

          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-4" />

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl"
          >
            Save
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
const CategoryRow = React.memo(function CategoryRow({
  c,
  setDragged,
  handleDrop,
  setEditing,
  setDeleting,
}: any) {
  return (
    <tr
      draggable
      onDragStart={() => setDragged(c)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(c)}
      className="border-b bg-[#ece2cb] text-black hover:bg-[#f5ecd7]"
    >
      <td className="p-3">
        <img
          src={imageCache.get(c.image) || c.image}
          className="h-12 w-12 rounded-lg object-cover"
        />
      </td>

      <td className="p-3 font-semibold">{c.name}</td>
      <td className="p-3">{c.slug}</td>
      <td className="p-3">{c.order}</td>

      <td className="p-3 text-right">
        <button onClick={() => setEditing(c)} className="bg-[#ff7a59] px-3 py-1 text-white rounded mr-2">
          Update
        </button>

        <button onClick={() => setDeleting(c)} className="border border-red-400 px-3 py-1 text-red-500">
          Delete
        </button>
      </td>
    </tr>
  );
});

/* UI */
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