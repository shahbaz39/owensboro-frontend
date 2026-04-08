"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  subCategoryId: string;
  productId: string;
  subCategoryName?: string;
  productName?: string;
};

type SubCategory = { id: string; name: string };
type Product = { id: string; title: string; subCategoryId: string };

export default function Page() {
  const [items, setItems] = useState<HeaderImage[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<HeaderImage | null>(null);
  const [deleting, setDeleting] = useState<HeaderImage | null>(null);

  const [form, setForm] = useState({
    title: "",
    subCategoryId: "",
    productId: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const [headerSnap, subSnap, productSnap] = await Promise.all([
        getDocs(collection(db, "HeaderImages")),
        getDocs(collection(db, "SubCatagories")),
        getDocs(collection(db, "Products")),
      ]);

      const subs = subSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
      }));

      const prods = productSnap.docs.map((d) => ({
        id: d.id,
        title: d.data().productName,
        subCategoryId: d.data().subCatagoryRef?.id,
      }));

      const data: HeaderImage[] = headerSnap.docs.map((d) => {
        const x = d.data();

        const sub = subs.find((s) => s.id === x.subCategoryId);
        const prod = prods.find((p) => p.id === x.productId);

        return {
          id: d.id,
          title: x.title || "",
          image: x.image || "",
          subCategoryId: x.subCategoryId || "",
          productId: x.productId || "",
          subCategoryName: sub?.name || "",
          productName: prod?.title || "",
        };
      });

      setItems(data);

      setItems(data);
      setSubCategories(subs);
      setProducts(prods);
    };

    fetchData();
  }, []);

  /* PREFILL */
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        subCategoryId: editing.subCategoryId,
        productId: editing.productId,
      });
    }
  }, [editing]);

  /* FILTER PRODUCTS */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.subCategoryId === form.subCategoryId);
  }, [products, form.subCategoryId]);

  /* VALIDATION */
  const validate = () => {
    if (!form.title) return "Title is required";
    if (!form.subCategoryId) return "SubCategory is required";
    if (!form.productId) return "Listing is required";
    if (adding && !file) return "Image is required";
    return "";
  };

  /* IMAGE */
  const uploadImage = async () => {
    if (!file) return "";
    const r = ref(storage, `header/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  };

  /* ADD */
  const handleAdd = async () => {
    const err = validate();
    if (err) return setError(err);

    setLoading(true);

    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "HeaderImages"), {
      ...form,
      image: imageUrl,
    });

    setItems((prev) => [
      {
        id: docRef.id,
        ...form,
        image: imageUrl,
        subCategoryName:
          subCategories.find((s) => s.id === form.subCategoryId)?.name || "",
        productName: products.find((p) => p.id === form.productId)?.title || "",
      },
      ...prev,
    ]);

    closeModal();
    setLoading(false);
  };

  /* UPDATE */
  const handleUpdate = async () => {
    if (!editing) return;

    const err = validate();
    if (err) return setError(err);

    setLoading(true);

    let imageUrl = editing.image;

    if (file) {
      await deleteObject(ref(storage, editing.image));
      imageUrl = await uploadImage();
    }

    await updateDoc(doc(db, "HeaderImages", editing.id), {
      ...form,
      image: imageUrl,
    });

    setItems((prev) =>
      prev.map((i) =>
        i.id === editing.id
          ? {
              ...i,
              ...form,
              image: imageUrl,
              subCategoryName:
                subCategories.find((s) => s.id === form.subCategoryId)?.name ||
                "",
              productName:
                products.find((p) => p.id === form.productId)?.title || "",
            }
          : i,
      ),
    );

    closeModal();
    setLoading(false);
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!deleting) return;

    try {
      await deleteDoc(doc(db, "HeaderImages", deleting.id));

      try {
        await deleteObject(ref(storage, deleting.image));
      } catch (err) {
        console.log("Image delete failed:", err);
      }

      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setFile(null);
    setError("");
    setForm({ title: "", subCategoryId: "", productId: "" });
  };

  return (
    <div className="px-6 pt-6 pb-10">
      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#ff7a59]">Header Images</h1>

        <button
          onClick={() => setAdding(true)}
          className="border border-[#ff7a59] px-5 py-2 rounded-xl text-[#ff7a59]"
        >
          Add Header Image
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-[#ece2cb] text-black">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Title</th>
              <th className="p-3">SubCategory</th>
              <th className="p-3">Listing</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b bg-[#ece2cb] text-black">
                <td className="p-3">
                  <img src={item.image} className="h-14 w-20 rounded-lg" />
                </td>

                <td className="p-3 font-semibold">{item.title}</td>
                <td className="p-3">{item.subCategoryName}</td>
                <td className="p-3">{item.productName}</td>

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
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {(adding || editing) && (
        <Modal title="Header Image" onClose={closeModal}>
          {error && <div className="text-red-500 mb-2">{error}</div>}

          <Input
            label="Title"
            value={form.title}
            onChange={(v: any) => setForm({ ...form, title: v })}
          />

          <Select
            label="SubCategory"
            value={form.subCategoryId}
            onChange={(v: any) =>
              setForm({ ...form, subCategoryId: v, productId: "" })
            }
            options={subCategories}
          />

          <Select
            label="Listing"
            value={form.productId}
            onChange={(v: any) => setForm({ ...form, productId: v })}
            options={filteredProducts}
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-4 w-full border rounded-xl p-3"
          />

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </Modal>
      )}

      {/* DELETE MODAL ✅ */}
      {deleting && (
        <Modal title="Delete" onClose={() => setDeleting(null)}>
          <p className="mb-4">
            Are you sure you want to delete <b>{deleting.title}</b>?
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setDeleting(null)}
              className="w-full border py-2 rounded-xl"
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="w-full bg-red-500 text-white py-2 rounded-xl"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
        className="w-full border rounded-xl p-3 mt-1"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div className="mt-3">
      <label className="font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl p-3 mt-1"
      >
        <option value="">Select</option>
        {options.map((o: any) => (
          <option key={o.id} value={o.id}>
            {o.name || o.title}
          </option>
        ))}
      </select>
    </div>
  );
}
