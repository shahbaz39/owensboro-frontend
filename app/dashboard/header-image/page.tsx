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
};

type SubCategory = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  title: string;
  subCategoryId: string;
};

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

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const [headerSnap, subSnap, productSnap] = await Promise.all([
        getDocs(collection(db, "HeaderImages")),
        getDocs(collection(db, "SubCatagories")),
        getDocs(collection(db, "Products")),
      ]);

      setItems(
        headerSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as HeaderImage[]
      );

      setSubCategories(
        subSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );

      setProducts(
        productSnap.docs.map((d) => ({
          id: d.id,
          title: d.data().productName,
          subCategoryId: d.data().subCatagoryRef?.id,
        }))
      );
    };

    fetchData();
  }, []);

  /* PREFILL FORM */
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        subCategoryId: editing.subCategoryId || "",
        productId: editing.productId || "",
      });
    }
  }, [editing]);

  /* FILTER PRODUCTS */
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) => p.subCategoryId === form.subCategoryId
    );
  }, [products, form.subCategoryId]);

  /* IMAGE UPLOAD */
  const uploadImage = async () => {
    if (!file) return "";
    const r = ref(storage, `header/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  };

  /* ADD */
  const handleAdd = async () => {
    if (!form.title || !file || !form.subCategoryId || !form.productId)
      return;

    setLoading(true);

    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "HeaderImages"), {
      title: form.title,
      image: imageUrl,
      subCategoryId: form.subCategoryId,
      productId: form.productId,
      subCategoryRef: doc(db, "SubCatagories", form.subCategoryId),
      productRef: doc(db, "Products", form.productId),
      createdAt: new Date(),
    });

    setItems((prev) => [
      {
        id: docRef.id,
        title: form.title,
        image: imageUrl,
        subCategoryId: form.subCategoryId,
        productId: form.productId,
      },
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
      await deleteObject(ref(storage, editing.image));
      imageUrl = await uploadImage();
    }

    await updateDoc(doc(db, "HeaderImages", editing.id), {
      title: form.title,
      image: imageUrl,
      subCategoryId: form.subCategoryId,
      productId: form.productId,
    });

    setItems((prev) =>
      prev.map((i) =>
        i.id === editing.id
          ? {
              ...i,
              title: form.title,
              image: imageUrl,
              subCategoryId: form.subCategoryId,
              productId: form.productId,
            }
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
    await deleteObject(ref(storage, deleting.image));

    setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setForm({ title: "", subCategoryId: "", productId: "" });
    setFile(null);
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

      {/* TABLE */}
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
            {items.map((item) => (
              <tr key={item.id} className="border-b bg-[#ece2cb] text-black">
                <td className="p-3">
                  <img
                    src={item.image}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {(adding || editing) && (
        <Modal title="Header Image" onClose={closeModal}>

          <Input
            label="Title"
            value={form.title}
            onChange={(v:any)=>setForm({...form,title:v})}
          />

          <Select
            label="Sub Category"
            value={form.subCategoryId}
            onChange={(v:any)=>setForm({...form,subCategoryId:v,productId:""})}
            options={subCategories}
          />

          <Select
            label="Product"
            value={form.productId}
            onChange={(v:any)=>setForm({...form,productId:v})}
            options={filteredProducts}
          />

          {/* ✅ EXISTING IMAGE */}
          {editing && editing.image && !file && (
            <div className="mt-3">
              <p className="text-sm mb-1">Current Image:</p>
              <img
                src={editing.image}
                className="h-20 w-32 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* ✅ NEW IMAGE PREVIEW */}
          {file && (
            <div className="mt-3">
              <p className="text-sm mb-1">New Image Preview:</p>
              <img
                src={URL.createObjectURL(file)}
                className="h-20 w-32 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* FILE INPUT */}
          <div className="mt-4">
            <label className="font-semibold text-black">Image</label>
            <input
              type="file"
              onChange={(e)=>setFile(e.target.files?.[0]||null)}
              className="mt-2 w-full border border-[#ff7a59] rounded-xl p-3"
            />
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
        <Modal title="Delete" onClose={()=>setDeleting(null)}>
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
      <label className="font-semibold text-black">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#ff7a59] rounded-xl p-3 mt-1"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div className="mt-3">
      <label className="font-semibold text-black">{label}</label>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full border border-[#ff7a59] rounded-xl p-3 mt-1"
      >
        <option value="">Select</option>
        {options.map((o:any)=>(
          <option key={o.id} value={o.id}>
            {o.name || o.title}
          </option>
        ))}
      </select>
    </div>
  );
}