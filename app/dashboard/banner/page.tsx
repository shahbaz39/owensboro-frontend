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

  /* PAGINATION */
  const [page, setPage] = useState(1);
  const perPage = 8;

  const totalPages = Math.max(1, Math.ceil(banners.length / perPage));

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return banners.slice(start, start + perPage);
  }, [banners, page]);

  /* FETCH */
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
        b.id === editing.id ? { ...b, ...form, image: imageUrl } : b
      )
    );

    setLoading(false);
    closeModal();
  };

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

      {/* ✅ TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left">
          <thead className="bg-[#ece2cb] text-black">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((b) => (
              <tr
                key={b.id}
                className="border-b bg-[#ece2cb] text-black hover:bg-[#f5ecd7]"
              >
                <td className="p-3">
                  <img
                    src={b.image}
                    className="h-14 w-20 rounded-lg object-cover"
                  />
                </td>

                <td className="p-3 font-semibold">{b.title}</td>
                <td className="p-3">{b.category}</td>
                <td className="p-3">{b.product}</td>

                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(b);
                        setForm({
                          title: b.title,
                          categoryId: b.categoryId,
                          productId: b.productId,
                        });
                      }}
                      className="rounded-lg bg-[#ff7a59] px-3 py-1 text-white"
                    >
                      Update
                    </button>

                    <button
                      onClick={() => setDeleting(b)}
                      className="rounded-lg border border-red-400 px-3 py-1 text-red-500 hover:bg-red-500 hover:text-white"
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

      {/* ✅ PAGINATION */}
      {banners.length > perPage && (
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[#f3ead7]">

          <p className="text-sm text-[#f3ead7]/70">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, banners.length)} of {banners.length}
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

      {/* MODALS (UNCHANGED) */}
      {(adding || editing) && (
        <Modal title="Banner" onClose={closeModal}>
          <Input label="Title" value={form.title} onChange={(v:any)=>setForm({...form,title:v})} />
          <Select value={form.categoryId} onChange={(v:any)=>setForm({...form,categoryId:v})} options={categories} placeholder="Select category"/>
          <Select value={form.productId} onChange={(v:any)=>setForm({...form,productId:v})} options={products} placeholder="Select product"/>
          <input type="file" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="mt-4"/>

          <button onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl">
            {loading ? "Saving..." : "Save"}
          </button>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete" onClose={() => setDeleting(null)}>
          <p>Delete <b>{deleting.title}</b>?</p>

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

/* UI unchanged */
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