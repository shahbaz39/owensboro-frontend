"use client";

import { useEffect, useState } from "react";
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
type Category = { id: string; name: string };
type Product = { id: string; name: string };

type Banner = {
  id: string;
  title: string;
  categoryId: string;
  productId: string;
  category: string;
  product: string;
  image: string;
};

export default function Page() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    productId: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const bannerSnap = await getDocs(collection(db, "Banner"));
      const catSnap = await getDocs(collection(db, "Catagories"));
      const prodSnap = await getDocs(collection(db, "Products"));

      const cats = catSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().catagoryName,
      }));

      const prods = prodSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().productName,
      }));

      const data = bannerSnap.docs.map((d) => {
        const x = d.data();
        const cat = cats.find((c) => c.id === x.CatagoryRef?.id);
        const prod = prods.find((p) => p.id === x.productRef?.id);

        return {
          id: d.id,
          title: x.bannerName,
          categoryId: x.CatagoryRef?.id || "",
          productId: x.productRef?.id || "",
          category: cat?.name || "",
          product: prod?.name || "",
          image: x.image,
        };
      });

      setBanners(data);
      setCategories(cats);
      setProducts(prods);
    };

    fetchData();
  }, []);

  const uploadImage = async () => {
    if (!file) return "";
    const r = ref(storage, `banners/${Date.now()}-${file.name}`);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  };

  const deleteImage = async (url: string) => {
    try {
      await deleteObject(ref(storage, url));
    } catch {}
  };

  const handleAdd = async () => {
    if (!form.title || !form.categoryId || !form.productId) return;

    setLoading(true);

    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "Banner"), {
      bannerName: form.title,
      CatagoryRef: doc(db, "Catagories", form.categoryId),
      productRef: doc(db, "Products", form.productId),
      image: imageUrl,
    });

    setBanners((prev) => [
      {
        id: docRef.id,
        title: form.title,
        categoryId: form.categoryId,
        productId: form.productId,
        category:
          categories.find((c) => c.id === form.categoryId)?.name || "",
        product:
          products.find((p) => p.id === form.productId)?.name || "",
        image: imageUrl,
      },
      ...prev,
    ]);

    setLoading(false);
    closeModal();
  };

  const handleUpdate = async () => {
    if (!editing) return;

    setLoading(true);

    let imageUrl = editing.image;

    if (file) {
      await deleteImage(editing.image);
      imageUrl = await uploadImage();
    }

    await updateDoc(doc(db, "Banner", editing.id), {
      bannerName: form.title,
      CatagoryRef: doc(db, "Catagories", form.categoryId),
      productRef: doc(db, "Products", form.productId),
      image: imageUrl,
    });

    setBanners((prev) =>
      prev.map((b) =>
        b.id === editing.id
          ? { ...b, ...form, image: imageUrl }
          : b
      )
    );

    setLoading(false);
    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setLoading(true);

    await deleteDoc(doc(db, "Banner", deleting.id));
    await deleteImage(deleting.image);

    setBanners((prev) => prev.filter((b) => b.id !== deleting.id));

    setLoading(false);
    setDeleting(null);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setFile(null);
    setForm({ title: "", categoryId: "", productId: "" });
  };

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">

      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#ff7a59]">Banner</h1>

        <button
          onClick={() => setAdding(true)}
          className="border border-[#ff7a59] px-5 py-2 rounded-xl text-[#ff7a59] hover:bg-[#ff7a59] hover:text-white"
        >
          Add Banner
        </button>
      </div>

      {/* LIST */}
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
  {banners.map((b) => (
    <div
      key={b.id}
      className="group flex flex-col justify-between rounded-2xl bg-[#ece2cb] p-3 text-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
    >
      {/* TOP */}
      <div>
        {b.image && (
          <div className="overflow-hidden rounded-xl">
            <img
              src={b.image}
              className="mb-3 h-32 w-full object-cover border border-black/10 transition duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <h3 className="text-base font-semibold md:text-lg truncate group-hover:text-[#ff7a59] transition">
          {b.title}
        </h3>

        <p className="mt-1 text-xs text-black/50 md:text-sm truncate">
          {b.category} • {b.product}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            setEditing(b);
            setForm({
              title: b.title,
              categoryId: b.categoryId,
              productId: b.productId,
            });
          }}
          className="w-full inline-flex items-center justify-center rounded-lg bg-[#ff7a59] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md md:text-sm"
        >
          Update
        </button>

        <button
          onClick={() => setDeleting(b)}
          className="w-full inline-flex items-center justify-center rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-500 transition-all duration-200 hover:scale-[1.03] hover:bg-red-500 hover:text-white hover:shadow-md md:text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  ))}
</div>

      {/* ADD / EDIT MODAL */}
      {(adding || editing) && (
        <Modal title="Add Banner" onClose={closeModal}>

          <Input label="Title" value={form.title} onChange={(v:any)=>setForm({...form,title:v})} />

          <Select value={form.categoryId} onChange={(v:any)=>setForm({...form,categoryId:v})} options={categories} placeholder="Select category"/>

          <Select value={form.productId} onChange={(v:any)=>setForm({...form,productId:v})} options={products} placeholder="Select product"/>

          <input type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="mt-4"/>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            disabled={loading}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl flex justify-center items-center"
          >
            {loading ? <Spinner /> : adding ? "Create Banner" : "Update Banner"}
          </button>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {deleting && (
        <Modal title="Delete Banner" onClose={() => setDeleting(null)}>
          <p className="text-black">
            Are you sure you want to delete <b>{deleting.title}</b>?
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setDeleting(null)}
              className="w-full border py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              disabled={loading}
              className="w-full bg-red-500 text-white py-2 rounded-lg flex justify-center items-center"
            >
              {loading ? <Spinner /> : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ROW */
function BannerRow({ title, category, product, image, onEdit, onDelete }: any) {
  return (
    <div className="flex justify-between bg-[#ece2cb] p-4 rounded-xl">
      <div className="flex gap-4 items-center">
        <img src={image} className="h-16 w-24 rounded-lg object-cover"/>
        <div>
          <h3 className="font-semibold text-black">{title}</h3>
          <p className="text-sm text-black/70">{category} • {product}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="bg-[#ff7a59] text-white px-3 py-1 rounded">
          Update
        </button>
        <button onClick={onDelete} className="border border-red-400 text-red-500 px-3 py-1 rounded">
          Delete
        </button>
      </div>
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
      <input value={value} onChange={(e)=>onChange(e.target.value)}
        className="w-full border border-[#ff7a59] text-black rounded-xl p-3 mt-1"/>
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: any) {
  return (
    <select value={value} onChange={(e)=>onChange(e.target.value)}
      className="w-full border border-[#ff7a59] text-black rounded-xl p-3 mt-3">
      <option value="">{placeholder}</option>
      {options.map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}

/* SPINNER */
function Spinner() {
  return (
    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );
}