"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebaseServices";

type SubCategory = {
  id: string;
  name: string;
  category: string;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
};

export default function Page() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SubCategory | null>(null);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
  });

  // ✅ PAGINATION
  const [page, setPage] = useState(1);
  const perPage = 10;

  const paginatedData = subCategories.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  // 🔥 FETCH
  useEffect(() => {
    const fetchData = async () => {
      const catSnap = await getDocs(collection(db, "Catagories"));
      const subSnap = await getDocs(collection(db, "SubCatagories"));

      const cats = catSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().catagoryName,
      }));

      const subs = subSnap.docs.map((d) => {
        const data = d.data();

        const refId = data.catagoriesRef?.id; // ✅ correct field
        const cat = cats.find((c) => c.id === refId);

        return {
          id: d.id,
          name: data.name || "Untitled", // ✅ correct field
          category: cat?.name || "", // ✅ removed "Unknown"
          categoryId: refId,
        };
      });

      setCategories(cats);
      setSubCategories(subs);
      setLoading(false);
    };

    fetchData();
  }, []);

  // 🔥 ADD
  const handleAdd = async () => {
    const ref = doc(db, "Catagories", form.categoryId);

    const docRef = await addDoc(collection(db, "SubCatagories"), {
      name: form.name, // ✅ FIXED
      catagoriesRef: ref, // ✅ FIXED
      createdAt: new Date(),
    });

    const cat = categories.find((c) => c.id === form.categoryId);

    setSubCategories((prev) => [
      ...prev,
      {
        id: docRef.id,
        name: form.name,
        category: cat?.name || "",
        categoryId: form.categoryId,
      },
    ]);

    setAdding(false);
    setForm({ name: "", categoryId: "" });
  };

  // 🔥 UPDATE
  const handleUpdate = async () => {
    if (!editing) return;

    const ref = doc(db, "Catagories", form.categoryId);

    await updateDoc(doc(db, "SubCatagories", editing.id), {
      name: form.name, // ✅ FIXED
      catagoriesRef: ref, // ✅ FIXED
    });

    const cat = categories.find((c) => c.id === form.categoryId);

    setSubCategories((prev) =>
      prev.map((item) =>
        item.id === editing.id
          ? {
              ...item,
              name: form.name,
              category: cat?.name || "",
              categoryId: form.categoryId,
            }
          : item,
      ),
    );

    setEditing(null);
  };

  // 🔥 DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sub category?")) return;

    await deleteDoc(doc(db, "SubCatagories", id));
    setSubCategories((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#ff7a59] md:text-5xl">
            Sub Categories
          </h1>
          <p className="mt-2 text-lg text-[#e8dcc7] md:text-xl">
            Organize and manage the sub sections inside each category.
          </p>
        </div>

        <button
          onClick={() => setAdding(true)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] hover:bg-[#ff7a59] hover:text-white"
        >
          Add Sub Category
        </button>
      </div>

      <section className="mt-8 rounded-[28px] border border-[#ff7a59]/70 bg-[#0a0a0a] p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#ff7a59] md:text-4xl">
            Sub Category Directory
          </h2>
        </div>

        {loading ? (
          <p className="text-[#f3ead7]">Loading...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedData.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl bg-[#ece2cb] p-4 text-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
              >
                {/* TOP */}
                <div>
                  <h3 className="text-base font-semibold md:text-lg truncate group-hover:text-[#ff7a59] transition">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs text-black/50 md:text-sm truncate">
                    {item.category}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(item);
                      setForm({
                        name: item.name,
                        categoryId: item.categoryId,
                      });
                    }}
                    className="w-full inline-flex items-center justify-center rounded-lg bg-[#ff7a59] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md md:text-sm"
                  >
                    Update
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-full inline-flex items-center justify-center rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-500 transition-all duration-200 hover:scale-[1.03] hover:bg-red-500 hover:text-white hover:shadow-md md:text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          total={subCategories.length}
          page={page}
          setPage={setPage}
        />
      </section>

      {/* MODAL */}
      {(adding || editing) && (
        <Modal
          title={adding ? "Add Sub Category" : "Update Sub Category"}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        >
          <Input
            label="Sub Category Name"
            value={form.name}
            onChange={(v: string) => setForm({ ...form, name: v })}
          />

          <div className="mt-3">
            <label className="text-black font-semibold">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl"
          >
            {adding ? "Create" : "Update"}
          </button>
        </Modal>
      )}
    </div>
  );
}

/* UI COMPONENTS */

function SubCategoryRow({ name, category, onDelete, onEdit }: any) {
  return (
    <div className="flex justify-between rounded-xl bg-[#ece2cb] px-4 py-3 text-black">
      <div>
        <h3 className="font-semibold">{name}</h3>
        <span className="text-sm">{category}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="bg-[#ff7a59] text-white px-3 py-2 rounded-lg"
        >
          Update
        </button>
        <button
          onClick={onDelete}
          className="border border-red-400 text-red-500 px-3 py-2 rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center">
      <div className="bg-[#e8dcc7] p-6 rounded-3xl w-[90%] max-w-lg">
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
      <label className="text-black font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black"
      />
    </div>
  );
}

function Pagination({ total, page, setPage }: any) {
  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mt-6 flex justify-between text-[#f3ead7]">
      <p>
        Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of{" "}
        {total}
      </p>

      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="opacity-70 disabled:opacity-30"
        >
          Previous
        </button>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
