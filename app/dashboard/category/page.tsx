"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { db, storage } from "@/lib/firebaseServices";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string;
};

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
  });

  const [file, setFile] = useState<File | null>(null);

  // 🔥 FETCH
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "Catagories"));
      const data = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          name: x.catagoryName,
          slug: x.slug || "",
          image: x.image || "",
        };
      });
      setCategories(data);
    };
    fetch();
  }, []);

  // 🔥 IMAGE UPLOAD
  const uploadImage = async () => {
    if (!file) return "";

    const storageRef = ref(storage, `categories/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // 🔥 ADD
  const handleAdd = async () => {
    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "Catagories"), {
      catagoryName: newCategory.name,
      slug: newCategory.slug,
      image: imageUrl,
      createdAt: new Date(),
    });

    setCategories((prev) => [
      ...prev,
      {
        id: docRef.id,
        name: newCategory.name,
        slug: newCategory.slug,
        image: imageUrl,
      },
    ]);

    setAdding(false);
    setFile(null);
    setNewCategory({ name: "", slug: "" });
  };

  // 🔥 UPDATE
  const handleUpdate = async () => {
    if (!editing) return;

    await updateDoc(doc(db, "Catagories", editing.id), {
      catagoryName: editing.name,
      slug: editing.slug,
    });

    setCategories((prev) =>
      prev.map((c) => (c.id === editing.id ? editing : c)),
    );

    setEditing(null);
  };

  // 🔥 DELETE
  const confirmDelete = async () => {
    if (!deleting) return;

    await deleteDoc(doc(db, "Catagories", deleting.id));
    setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="px-4 pt-6 pb-10 md:px-8 bg-black min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#ff7a59] md:text-5xl">
            Categories
          </h1>
          <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
            Manage your platform categories
          </p>
        </div>

        <button
          onClick={() => setAdding(true)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white"
        >
          Add Category
        </button>
      </div>

      {/* LIST */}
<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
  {categories.map((c) => (
    <div
      key={c.id}
      className="group flex flex-col justify-between rounded-2xl bg-[#ece2cb] p-3 text-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
    >
      {/* TOP */}
      <div>
        {c.image && (
          <div className="overflow-hidden rounded-xl">
            <img
              src={c.image}
              className="mb-3 h-32 w-full object-cover border border-black/10 transition duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <h3 className="text-base font-semibold md:text-lg truncate group-hover:text-[#ff7a59] transition">
          {c.name}
        </h3>

        <p className="mt-1 text-xs text-black/50 md:text-sm truncate">
          {c.slug}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setEditing(c)}
          className="w-full inline-flex items-center justify-center rounded-lg bg-[#ff7a59] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md md:text-sm"
        >
          Update
        </button>

        <button
          onClick={() => setDeleting(c)}
          className="w-full inline-flex items-center justify-center rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-500 transition-all duration-200 hover:scale-[1.03] hover:bg-red-500 hover:text-white hover:shadow-md md:text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  ))}
</div>

      {/* PAGINATION (same logic preserved) */}
      <div className="mt-8 flex justify-between items-center text-sm text-[#f3ead7]/70">
        <p>Showing {categories.length} categories</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-white/10 rounded-lg opacity-40">
            Previous
          </button>
          <button className="px-3 py-1 bg-[#ff7a59] text-white rounded-lg">
            1
          </button>
          <button className="px-3 py-1 border border-white/10 rounded-lg opacity-40">
            Next
          </button>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {(adding || editing) && (
        <Modal
          title={adding ? "Add New Category" : "Edit Category"}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        >
          <Input
            label="Category Name"
            value={editing?.name || newCategory.name}
            onChange={(v: string) =>
              editing
                ? setEditing({ ...editing, name: v })
                : setNewCategory({ ...newCategory, name: v })
            }
          />

          <Input
            label="Slug"
            value={editing?.slug || newCategory.slug}
            onChange={(v: string) =>
              editing
                ? setEditing({ ...editing, slug: v })
                : setNewCategory({ ...newCategory, slug: v })
            }
          />

          {!editing && (
            <div className="mt-5 flex flex-col items-center gap-3">
              <label className="cursor-pointer border border-dashed border-[#ff7a59]/50 rounded-xl px-6 py-6 text-sm text-[#ff7a59] hover:bg-[#ff7a59]/10">
                Upload Image
                <input
                  type="file"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              {file && (
                <img
                  src={URL.createObjectURL(file)}
                  className="h-28 w-28 rounded-xl object-cover"
                />
              )}
            </div>
          )}

          {editing?.image && (
            <img
              src={editing.image}
              className="mt-4 h-28 w-28 rounded-xl object-cover mx-auto"
            />
          )}

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full rounded-xl bg-[#ff7a59] py-3 text-white font-semibold hover:opacity-90"
          >
            {adding ? "Create Category" : "Save Changes"}
          </button>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {deleting && (
        <Modal title="Delete Category" onClose={() => setDeleting(null)}>
          <p className="text-sm text-black">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleting.name}</span>?
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setDeleting(null)}
              className="w-full border border-black/20 py-2 rounded-lg text-black"
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* COMPONENTS */

function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-[#e8dcc7] p-6 rounded-3xl w-[90%] max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#ff7a59]">{title}</h2>
          <button onClick={onClose} className="text-black/60">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <div className="mt-3">
      <label className="text-black text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-[#ff7a59]/70 bg-white px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#ff7a59]"
      />
    </div>
  );
}

/* COMPONENTS */
