"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { setDoc } from "firebase/firestore";
import { query, orderBy, limit } from "firebase/firestore";
import { db, storage } from "@/lib/firebaseServices";

/* TYPES */
type Category = { id: string; name: string };
type SubCategory = { id: string; name: string; categoryId: string };

type Listing = {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  categoryId: string;
  subCategoryId: string;
  location: string;
  about: string;
  shortDescription: string;
  time: string;
  contact: string;
  image?: string;
  // ✅ NEW
  websiteUrl?: string;
  facebookUrl?: string;
  locationUrl?: string;
};

type ListingForm = {
  title: string;
  categoryId: string;
  subCategoryId: string;
  location: string;
  about: string;
  shortDescription: string;
  time: string;
  contact: string;
  // ✅ MUST EXIST HERE
  websiteUrl: string;
  facebookUrl: string;
  locationUrl: string;
};

const EMPTY_FORM: ListingForm = {
  title: "",
  categoryId: "",
  subCategoryId: "",
  location: "",
  about: "",
  shortDescription: "",
  time: "",
  contact: "",

  // ✅ NEW
  websiteUrl: "",
  facebookUrl: "",
  locationUrl: "",
};

export default function Page() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const newDocRef = doc(collection(db, "Products"));

  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);

  /* PAGINATION */
  const [page, setPage] = useState(1);
  const perPage = 12;

  const totalPages = Math.max(1, Math.ceil(listings.length / perPage));
  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return listings.slice(start, start + perPage);
  }, [listings, safePage]);

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productSnap, catSnap, subSnap] = await Promise.all([
          getDocs(collection(db, "Products")),
          getDocs(collection(db, "Catagories")),
          getDocs(collection(db, "SubCatagories")),
        ]);

        const cats: Category[] = catSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().catagoryName || "Untitled Category",
        }));

        const subs: SubCategory[] = subSnap.docs.map((d) => ({
          id: d.id,
          name:
            d.data().name ||
            d.data().subCategoryName ||
            "Untitled Sub Category",
          categoryId: d.data().catagoriesRef?.id || "",
        }));

        const data: Listing[] = productSnap.docs.map((d) => {
          const x = d.data();

          const catId = x.catagoryRef?.id || "";
          const subId = x.subCatagoryRef?.id || "";

          const cat = cats.find((c) => c.id === catId);
          const sub = subs.find((s) => s.id === subId);

          return {
            id: d.id,
            title: x.productName || "",
            category: cat?.name || "",
            subCategory: sub?.name || "",
            categoryId: catId,
            subCategoryId: subId,
            location: x.productLocation || "",
            about: x.about || "",
            shortDescription: x.shortDescription || "",
            time: x.time || "",
            contact: x.contactInfo || "",
            image: x.imageUrl || "",
            // ✅ NEW
            websiteUrl: x.websiteUrl || "",
            facebookUrl: x.facebookUrl || "",
            locationUrl: x.locationUrl || "",
          };
        });

        setListings(data);
        setCategories(cats);
        setSubCategories(subs);
      } catch (err) {
        console.error(err);
        setError("Failed to load listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /* HELPERS */
  const filteredSubs = useMemo(
    () => subCategories.filter((s) => s.categoryId === form.categoryId),
    [subCategories, form.categoryId],
  );

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFile(null);
    setRemoveExistingImage(false);
    setSaving(false);
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setRemoveExistingImage(false);
    setAdding(true);
    setEditing(null);
  };

  const openEditModal = (listing: Listing) => {
    setEditing(listing);
    setAdding(false);
    setFile(null);
    setRemoveExistingImage(false);
    setForm({
      title: listing.title || "",
      categoryId: listing.categoryId || "",
      subCategoryId: listing.subCategoryId || "",
      location: listing.location || "",
      about: listing.about || "",
      shortDescription: listing.shortDescription || "",
      time: listing.time || "",
      contact: listing.contact || "",
      // ✅ NEW
      websiteUrl: listing.websiteUrl || "",
      facebookUrl: listing.facebookUrl || "",
      locationUrl: listing.locationUrl || "",
    });
  };

  const validateForm = () => {
    if (!form.categoryId) return "Please select a category.";
    if (!form.subCategoryId) return "Please select a sub category.";
    if (!form.title.trim()) return "Title is required.";
    if (!form.shortDescription.trim()) return "Short description is required.";
    if (!form.about.trim()) return "About is required.";
    if (!form.location.trim()) return "Location is required.";
    if (!form.time.trim()) return "Time is required.";
    if (!form.contact.trim()) return "Contact is required.";
    return "";
  };

  const uploadImage = async () => {
    if (!file) return "";
    const storageRef = ref(storage, `listings/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const safelyDeleteImageByUrl = async (url?: string) => {
    if (!url) return;
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (err) {
      console.error("Image delete skipped/failed:", err);
    }
  };

  const getNextOrder = async () => {
    const q = query(
      collection(db, "Products"),
      orderBy("order", "desc"),
      limit(1),
    );

    const snap = await getDocs(q);

    if (snap.empty) return 1;

    const lastOrder = snap.docs[0].data().order || 0;
    return lastOrder + 1;
  };
  /* ADD */
  const handleAdd = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const imageUrl = await uploadImage();
      const catRef = doc(db, "Catagories", form.categoryId);
      const subRef = doc(db, "SubCatagories", form.subCategoryId);

      // ✅ CREATE DOC REF HERE (IMPORTANT)
      const newDocRef = doc(collection(db, "Products"));
    const nextOrder = await getNextOrder();
      await setDoc(newDocRef, {
        productName: form.title,
        catagoryRef: catRef,
        subCatagoryRef: subRef,
        productLocation: form.location,
        about: form.about,
        shortDescription: form.shortDescription,
        time: form.time,
        contactInfo: form.contact,
        imageUrl,
        websiteUrl: form.websiteUrl,
        facebookUrl: form.facebookUrl,
        locationUrl: form.locationUrl,
        createdAt: new Date(),

        // ✅ THIS IS WHAT YOU WANT
        productRef: newDocRef,
        order: nextOrder,
      });

      const cat = categories.find((c) => c.id === form.categoryId);
      const sub = subCategories.find((s) => s.id === form.subCategoryId);

      setListings((prev) => [
        {
          id: newDocRef.id,
          title: form.title,
          category: cat?.name || "",
          subCategory: sub?.name || "",
          categoryId: form.categoryId,
          subCategoryId: form.subCategoryId,
          location: form.location,
          about: form.about,
          shortDescription: form.shortDescription,
          time: form.time,
          contact: form.contact,
          image: imageUrl,
          websiteUrl: form.websiteUrl,
          facebookUrl: form.facebookUrl,
          locationUrl: form.locationUrl,
        },
        ...prev,
      ]);

      setPage(1);
      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to create listing.");
      setSaving(false);
    }
  };

  /* UPDATE */
  const handleUpdate = async () => {
    if (!editing) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const catRef = doc(db, "Catagories", form.categoryId);
      const subRef = doc(db, "SubCatagories", form.subCategoryId);

      let nextImageUrl = editing.image || "";

      if (file) {
        if (editing.image) {
          await safelyDeleteImageByUrl(editing.image);
        }
        nextImageUrl = await uploadImage();
      } else if (removeExistingImage) {
        await safelyDeleteImageByUrl(editing.image);
        nextImageUrl = "";
      }

      await updateDoc(doc(db, "Products", editing.id), {
        productName: form.title,
        catagoryRef: catRef,
        subCatagoryRef: subRef,
        productLocation: form.location,
        about: form.about,
        shortDescription: form.shortDescription,
        time: form.time,
        contactInfo: form.contact,
        imageUrl: nextImageUrl,
        // ✅ NEW
        websiteUrl: form.websiteUrl,
        facebookUrl: form.facebookUrl,
        locationUrl: form.locationUrl,
      });

      const cat = categories.find((c) => c.id === form.categoryId);
      const sub = subCategories.find((s) => s.id === form.subCategoryId);

      setListings((prev) =>
        prev.map((l) =>
          l.id === editing.id
            ? {
                ...l,
                title: form.title,
                category: cat?.name || "",
                subCategory: sub?.name || "",
                categoryId: form.categoryId,
                subCategoryId: form.subCategoryId,
                location: form.location,
                about: form.about,
                shortDescription: form.shortDescription,
                time: form.time,
                contact: form.contact,
                image: nextImageUrl,
                // ✅ ADD THIS
                websiteUrl: form.websiteUrl,
                facebookUrl: form.facebookUrl,
                locationUrl: form.locationUrl,
              }
            : l,
        ),
      );

      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to update listing.");
      setSaving(false);
    }
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!deleting) return;

    try {
      await deleteDoc(doc(db, "Products", deleting.id));
      await safelyDeleteImageByUrl(deleting.image);

      const remaining = listings.filter((l) => l.id !== deleting.id);
      setListings(remaining);
      setDeleting(null);

      const nextTotalPages = Math.max(1, Math.ceil(remaining.length / perPage));
      if (page > nextTotalPages) {
        setPage(nextTotalPages);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete listing.");
      setDeleting(null);
    }
  };

  const currentImagePreview = file
    ? URL.createObjectURL(file)
    : editing && !removeExistingImage
      ? editing.image || ""
      : "";

  return (
    <div className="px-6 pt-6 pb-10">
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#ff7a59]">Listings</h1>
          <p className="mt-2 text-lg font-medium text-[#e8dcc7] md:text-xl">
            Manage and organize all published platform listings.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="rounded-xl border border-[#ff7a59] px-5 py-2 text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white"
        >
          Add Listing
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="rounded-2xl border border-[#ff7a59]/40 bg-[#0a0a0a] px-5 py-10 text-center text-[#f3ead7]/70">
          Loading listings...
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-[#ff7a59]/40 bg-[#0a0a0a] px-5 py-10 text-center text-[#f3ead7]/70">
          No listings found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginatedData.map((l) => (
            <div
              key={l.id}
              className="group flex flex-col justify-between rounded-2xl bg-[#ece2cb] p-3 text-black shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10"
            >
              {/* TOP */}
              <div>
                {l.image && (
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={l.image}
                      className="mb-3 h-32 w-full object-cover border border-black/10 transition duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                <h3 className="text-base font-semibold md:text-lg truncate group-hover:text-[#ff7a59] transition">
                  {l.title}
                </h3>

                <p className="mt-1 text-xs text-black/50 md:text-sm truncate">
                  {l.category} • {l.subCategory}
                </p>

                <p className="mt-1 text-xs text-black/40 truncate">
                  📍 {l.location}
                </p>
                {l.websiteUrl && (
                  <a
                    href={l.websiteUrl}
                    target="_blank"
                    className="mt-2 text-xs text-blue-600 underline block"
                  >
                    🌐 Website
                  </a>
                )}

                {l.facebookUrl && (
                  <a
                    href={l.facebookUrl}
                    target="_blank"
                    className="text-xs text-blue-600 underline block"
                  >
                    👍 Facebook
                  </a>
                )}

                {l.locationUrl && (
                  <a
                    href={l.locationUrl}
                    target="_blank"
                    className="text-xs text-blue-600 underline block"
                  >
                    📍 View Location
                  </a>
                )}
              </div>

              {/* ACTIONS */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openEditModal(l)}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-[#ff7a59] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md md:text-sm"
                >
                  Update
                </button>

                <button
                  onClick={() => setDeleting(l)}
                  className="w-full inline-flex items-center justify-center rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-500 transition-all duration-200 hover:scale-[1.03] hover:bg-red-500 hover:text-white hover:shadow-md md:text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="mt-6 flex items-center justify-between text-[#f3ead7]">
        <p>
          Showing {(safePage - 1) * perPage + 1}–
          {Math.min(safePage * perPage, listings.length)} of {listings.length}
        </p>

        <div className="flex gap-2">
          <button
            disabled={safePage === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>

          <button className="rounded-xl bg-[#ff7a59] px-4 py-2 text-white">
            {safePage}
          </button>

          <button
            disabled={safePage * perPage >= listings.length}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-white/10 px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {(adding || editing) && (
        <Modal
          title={adding ? "Add New Listing" : "Edit Listing"}
          onClose={closeModal}
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Select
            label="Category"
            value={form.categoryId}
            onChange={(v: string) =>
              setForm((prev) => ({
                ...prev,
                categoryId: v,
                subCategoryId: "",
              }))
            }
            options={categories}
            placeholder="Please select a category"
          />

          <Select
            label="Sub Category"
            value={form.subCategoryId}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, subCategoryId: v }))
            }
            options={filteredSubs}
            placeholder="Please select a sub category"
          />

          <Input
            label="Title"
            value={form.title}
            onChange={(v: string) => setForm((prev) => ({ ...prev, title: v }))}
          />

          <Input
            label="Short Description"
            value={form.shortDescription}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, shortDescription: v }))
            }
          />

          <Textarea
            label="About"
            value={form.about}
            onChange={(v: string) => setForm((prev) => ({ ...prev, about: v }))}
          />

          <Input
            label="Location"
            value={form.location}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, location: v }))
            }
          />

          <Input
            label="Time"
            value={form.time}
            onChange={(v: string) => setForm((prev) => ({ ...prev, time: v }))}
          />

          <Input
            label="Contact"
            value={form.contact}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, contact: v }))
            }
          />
          <Input
            label="Website URL"
            value={form.websiteUrl}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, websiteUrl: v }))
            }
          />

          <Input
            label="Facebook URL"
            value={form.facebookUrl}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, facebookUrl: v }))
            }
          />

          <Input
            label="Location URL (Google Maps)"
            value={form.locationUrl}
            onChange={(v: string) =>
              setForm((prev) => ({ ...prev, locationUrl: v }))
            }
          />

          {/* IMAGE */}
          <div className="mt-5">
            <label className="text-black text-sm font-semibold">Image</label>

            <div className="mt-3 flex flex-col items-center gap-4 rounded-2xl border border-[#ff7a59]/25 bg-white/35 px-4 py-5">
              {currentImagePreview ? (
                <img
                  src={currentImagePreview}
                  alt="Listing preview"
                  className="h-32 w-32 rounded-2xl border border-black/10 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-black/20 bg-black/5 text-sm text-black/40">
                  No image
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="cursor-pointer rounded-xl border border-[#ff7a59] px-4 py-2 text-sm font-semibold text-[#ff7a59] transition hover:bg-[#ff7a59] hover:text-white">
                  {editing ? "Change Image" : "Upload Image"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      setRemoveExistingImage(false);
                      setFile(e.target.files?.[0] || null);
                    }}
                  />
                </label>

                {(file || editing?.image) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (editing?.image) {
                        setRemoveExistingImage(true);
                      }
                    }}
                    className="rounded-xl border border-red-400 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                  >
                    Remove Image
                  </button>
                )}
              </div>

              {editing && removeExistingImage && !file && (
                <p className="text-sm text-red-500">
                  Existing image will be removed when you save.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-[#ff7a59] py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? adding
                ? "Creating..."
                : "Saving..."
              : adding
                ? "Create Listing"
                : "Save Listing"}
          </button>
        </Modal>
      )}

      {/* DELETE */}
      {deleting && (
        <Modal title="Delete Listing" onClose={() => setDeleting(null)}>
          <p className="text-black">
            Delete <span className="font-semibold">{deleting.title}</span>?
          </p>

          <p className="mt-2 text-sm text-black/60">
            This action will remove the listing from your dashboard.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleting(null)}
              className="rounded-xl border border-black/15 px-4 py-2 text-black"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-xl bg-red-500 px-4 py-2 text-white"
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

function ListingRow({
  title,
  category,
  subCategory,
  location,
  image,
  onEdit,
  onDelete,
}: {
  title: string;
  category: string;
  subCategory: string;
  location: string;
  image?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#e8dcc7] px-5 py-4 ring-1 ring-black/10 transition hover:shadow-md">
      <div className="flex min-w-0 items-center gap-4">
        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/5">
          {image ? (
            <img src={image} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-black/35">
              No Img
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-black">{title}</h3>
          <p className="mt-1 text-sm text-black/70">
            {category} • {subCategory}
          </p>
          <p className="mt-1 truncate text-xs text-black/50">{location}</p>
        </div>
      </div>

      <div className="ml-4 flex gap-2">
        <button
          onClick={onEdit}
          className="rounded-xl bg-[#ff7a59] px-4 py-2 text-white"
        >
          Update
        </button>
        <button
          onClick={onDelete}
          className="rounded-xl border border-red-400 px-4 py-2 text-red-500 transition hover:bg-red-500 hover:text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#e8dcc7] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#ff7a59]">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-black transition hover:bg-black/20"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="text-black text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-[#ff7a59]"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="text-black text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-28 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-[#ff7a59]"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; name: string }>;
  placeholder: string;
}) {
  return (
    <div className="mt-4">
      <label className="text-black text-sm font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-[#ff7a59] bg-white px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#ff7a59]"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
