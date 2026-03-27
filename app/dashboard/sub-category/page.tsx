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
  order?: number;
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
  const [dragged, setDragged] = useState<SubCategory | null>(null);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
  });

  // PAGINATION
  const [page, setPage] = useState(1);
  const perPage = 12;

  // FETCH
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
        const refId = data.catagoriesRef?.id;
        const cat = cats.find((c) => c.id === refId);

        return {
          id: d.id,
          name: data.name || "Untitled",
          category: cat?.name || "",
          categoryId: refId,
          order: data.order ?? 999,
        };
      });

      setCategories(cats);

      // SORT BY ORDER
      setSubCategories(
        subs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
      );

      setLoading(false);
    };

    fetchData();
  }, []);

  // ADD
  const handleAdd = async () => {
    const ref = doc(db, "Catagories", form.categoryId);

    const nextOrder =
      subCategories.length > 0
        ? Math.max(...subCategories.map((c) => c.order || 0)) + 1
        : 1;

    const docRef = await addDoc(collection(db, "SubCatagories"), {
      name: form.name,
      catagoriesRef: ref,
      createdAt: new Date(),
      order: nextOrder,
    });

    const cat = categories.find((c) => c.id === form.categoryId);

    setSubCategories((prev) =>
      [...prev, {
        id: docRef.id,
        name: form.name,
        category: cat?.name || "",
        categoryId: form.categoryId,
        order: nextOrder,
      }].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    );

    setAdding(false);
    setForm({ name: "", categoryId: "" });
  };

  // UPDATE
  const handleUpdate = async () => {
    if (!editing) return;

    const ref = doc(db, "Catagories", form.categoryId);

    await updateDoc(doc(db, "SubCatagories", editing.id), {
      name: form.name,
      catagoriesRef: ref,
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

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sub category?")) return;

    await deleteDoc(doc(db, "SubCatagories", id));
    setSubCategories((prev) => prev.filter((i) => i.id !== id));
  };

  // PAGINATION DATA
  const paginatedData = subCategories.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:justify-between">
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
        {loading ? (
          <p className="text-[#f3ead7]">Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-[#ece2cb] text-black">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Order</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={() => setDragged(item)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async () => {
                      if (!dragged || dragged.id === item.id) return;

                      const updated = [...subCategories];
                      const from = updated.findIndex((i) => i.id === dragged.id);
                      const to = updated.findIndex((i) => i.id === item.id);

                      const [moved] = updated.splice(from, 1);
                      updated.splice(to, 0, moved);

                      const reordered = updated.map((it, index) => ({
                        ...it,
                        order: index + 1,
                      }));

                      setSubCategories(reordered);

                      await Promise.all(
                        reordered.map((it) =>
                          updateDoc(doc(db, "SubCatagories", it.id), {
                            order: it.order,
                          })
                        )
                      );
                    }}
                    className="border-b border-white/10 bg-[#ece2cb] text-black hover:bg-[#f5ecd7]"
                  >
                    <td className="p-3 font-semibold">{item.name}</td>
                    <td className="p-3 text-black/60">{item.category}</td>
                    <td className="p-3">{item.order}</td>

                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditing(item);
                            setForm({
                              name: item.name,
                              categoryId: item.categoryId,
                            });
                          }}
                          className="rounded-lg bg-[#ff7a59] px-3 py-1 text-xs text-white"
                        >
                          Update
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg border border-red-400 px-3 py-1 text-xs text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination total={subCategories.length} page={page} setPage={setPage} />
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
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
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

/* COMPONENTS (UNCHANGED) */

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
  const perPage = 12;
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