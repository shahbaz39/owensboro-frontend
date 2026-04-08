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
type SubCategory = { id: string; name: string };
type Product = { id: string; name: string; subCategoryId: string };

type Banner = {
  id: string;
  title: string;
  subCategoryId: string;
  productId: string;
  subCategory: string;
  product: string;
  image: string;
};

export default function Page() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    subCategoryId: "",
    productId: "",
  });

  const [error, setError] = useState("");

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const bannerSnap = await getDocs(collection(db, "Banner"));
      const subSnap = await getDocs(collection(db, "SubCatagories"));
      const prodSnap = await getDocs(collection(db, "Products"));

      const subs = subSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
      }));

      const prods = prodSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().productName,
        subCategoryId: d.data().subCatagoryRef?.id,
      }));

      const data = bannerSnap.docs.map((d) => {
        const x = d.data();

        const sub = subs.find((s) => s.id === x.subCategoryRef?.id);
        const prod = prods.find((p) => p.id === x.productRef?.id);

        return {
          id: d.id,
          title: x.bannerName,
          subCategoryId: x.subCategoryRef?.id || "",
          productId: x.productRef?.id || "",
          subCategory: sub?.name || "",
          product: prod?.name || "",
          image: x.image,
        };
      });

      setBanners(data);
      setSubCategories(subs);
      setProducts(prods);
    };

    fetchData();
  }, []);

  /* FILTER PRODUCTS */
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) => p.subCategoryId === form.subCategoryId
    );
  }, [products, form.subCategoryId]);

  /* PREFILL EDIT */
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        subCategoryId: editing.subCategoryId,
        productId: editing.productId,
      });
    }
  }, [editing]);

  /* VALIDATION */
  const validate = () => {
    if (!form.title) return "Title is required";
    if (!form.subCategoryId) return "SubCategory required";
    if (!form.productId) return "Product required";
    if (adding && !file) return "Image required";
    return "";
  };

  /* UPLOAD */
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

  /* ADD */
  const handleAdd = async () => {
    const err = validate();
    if (err) return setError(err);

    setLoading(true);

    const imageUrl = await uploadImage();

    const docRef = await addDoc(collection(db, "Banner"), {
      bannerName: form.title,
      subCategoryRef: doc(db, "SubCatagories", form.subCategoryId),
      productRef: doc(db, "Products", form.productId),
      image: imageUrl,
    });

    setBanners((prev) => [
      {
        id: docRef.id,
        title: form.title,
        subCategoryId: form.subCategoryId,
        productId: form.productId,
        subCategory:
          subCategories.find((s) => s.id === form.subCategoryId)?.name || "",
        product:
          products.find((p) => p.id === form.productId)?.name || "",
        image: imageUrl,
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
      await deleteImage(editing.image);
      imageUrl = await uploadImage();
    }

    await updateDoc(doc(db, "Banner", editing.id), {
      bannerName: form.title,
      subCategoryRef: doc(db, "SubCatagories", form.subCategoryId),
      productRef: doc(db, "Products", form.productId),
      image: imageUrl,
    });

    setBanners((prev) =>
      prev.map((b) =>
        b.id === editing.id
          ? {
              ...b,
              ...form,
              image: imageUrl,
            }
          : b
      )
    );

    closeModal();
    setLoading(false);
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!deleting) return;

    await deleteDoc(doc(db, "Banner", deleting.id));
    await deleteImage(deleting.image);

    setBanners((prev) => prev.filter((b) => b.id !== deleting.id));
    setDeleting(null);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setFile(null);
    setError("");
    setForm({ title: "", subCategoryId: "", productId: "" });
  };

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">

      {/* HEADER */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#ff7a59]">Banner</h1>

        <button
          onClick={() => setAdding(true)}
          className="border border-[#ff7a59] px-5 py-2 rounded-xl text-[#ff7a59]"
        >
          Add Banner
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
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b bg-[#ece2cb] text-black">
                <td className="p-3">
                  <img src={b.image} className="h-14 w-20 rounded-lg" />
                </td>
                <td className="p-3 font-semibold">{b.title}</td>
                <td className="p-3">{b.subCategory}</td>
                <td className="p-3">{b.product}</td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => setEditing(b)}
                    className="bg-[#ff7a59] px-3 py-1 text-white rounded mr-2"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setDeleting(b)}
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
        <Modal title="Banner" onClose={closeModal}>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <Input label="Title" value={form.title} onChange={(v:any)=>setForm({...form,title:v})}/>

          <Select value={form.subCategoryId}
            onChange={(v:any)=>setForm({...form,subCategoryId:v,productId:""})}
            options={subCategories}
            placeholder="Select SubCategory"
          />

          <Select value={form.productId}
            onChange={(v:any)=>setForm({...form,productId:v})}
            options={filteredProducts}
            placeholder="Select Product"
          />

          <div className="mt-4 border border-[#ff7a59] rounded-xl p-4">
            <input type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)}/>
          </div>

          <button onClick={adding?handleAdd:handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl">
            {loading?"Saving...":"Save"}
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
      <label className="font-semibold">{label}</label>
      <input value={value} onChange={(e)=>onChange(e.target.value)}
        className="w-full border border-[#ff7a59] rounded-xl p-3 mt-1"/>
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: any) {
  return (
    <select value={value} onChange={(e)=>onChange(e.target.value)}
      className="w-full border border-[#ff7a59] rounded-xl p-3 mt-3">
      <option value="">{placeholder}</option>
      {options.map((o:any)=>(
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}