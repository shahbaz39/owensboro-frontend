"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db, storage } from "@/lib/firebaseServices";

/* TYPES */
type Challenge = {
  id: string;
  title: string;
  video: string;
};

export default function Page() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState<Challenge | null>(null);

  const [form, setForm] = useState({
    title: "",
    video: "",
  });

  const [file, setFile] = useState<File | null>(null);

  /* FETCH */
  useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, "challenges"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const data = snap.docs
        .map((d) => {
          const x = d.data();
          if (!x?.title || !x?.video) return null;

          return {
            id: d.id,
            title: x.title,
            video: x.video,
          };
        })
        .filter(Boolean) as Challenge[];

      setChallenges(data);
    };

    fetchData();
  }, []);

  /* UPLOAD VIDEO */
  const uploadVideo = async () => {
    if (!file) return "";

    const storageRef = ref(
      storage,
      `challenges/${Date.now()}-${file.name}`
    );

    await uploadBytes(storageRef, file);

    return await getDownloadURL(storageRef);
  };

  /* ADD */
  const handleAdd = async () => {
    let videoUrl = form.video;

    if (file) {
      videoUrl = await uploadVideo();
    }

    if (!form.title || !videoUrl) return;

    const docRef = await addDoc(collection(db, "challenges"), {
      title: form.title,
      video: videoUrl,
      createdAt: serverTimestamp(),
    });

    setChallenges((prev) => [
      { id: docRef.id, title: form.title, video: videoUrl },
      ...prev,
    ]);

    closeModal();
  };

  /* UPDATE */
  const handleUpdate = async () => {
    if (!editing) return;

    let videoUrl = editing.video;

    if (file) {
      videoUrl = await uploadVideo();
    }

    await updateDoc(doc(db, "challenges", editing.id), {
      title: form.title,
      video: videoUrl,
    });

    setChallenges((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? { ...c, title: form.title, video: videoUrl }
          : c
      )
    );

    closeModal();
  };

  /* DELETE */
  const confirmDelete = async () => {
    if (!deleting) return;

    await deleteDoc(doc(db, "challenges", deleting.id));

    setChallenges((prev) =>
      prev.filter((c) => c.id !== deleting.id)
    );

    setDeleting(null);
  };

  const closeModal = () => {
    setAdding(false);
    setEditing(null);
    setForm({ title: "", video: "" });
    setFile(null);
  };

  return (
    <div className="px-4 pt-6 pb-10 md:px-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 md:flex-row md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#ff7a59] md:text-5xl">
            Challenge
          </h1>

          <p className="mt-2 text-lg text-[#e8dcc7]">
            Admin can create, manage, and update weekly challenge videos easily.
          </p>
        </div>

        <button
          onClick={() => setAdding(true)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ff7a59] px-5 text-sm font-semibold text-[#ff7a59] hover:bg-[#ff7a59] hover:text-white"
        >
          Add Challenge
        </button>
      </div>

      {/* LIST */}
      <section className="mt-10 space-y-6">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            {...challenge}
            onEdit={() => {
              setEditing(challenge);
              setForm({
                title: challenge.title,
                video: challenge.video,
              });
            }}
            onDelete={() => setDeleting(challenge)}
          />
        ))}
      </section>

      {/* MODAL */}
      {(adding || editing) && (
        <Modal title="Challenge" onClose={closeModal}>
          <Input
            label="Title"
            value={form.title}
            onChange={(v: string) =>
              setForm({ ...form, title: v })
            }
          />

          <Input
            label="Video URL (optional)"
            value={form.video}
            onChange={(v: string) =>
              setForm({ ...form, video: v })
            }
          />

          <div className="mt-4">
            <label className="font-semibold">Upload Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="mt-2"
            />
          </div>

          <button
            onClick={adding ? handleAdd : handleUpdate}
            className="mt-6 w-full bg-[#ff7a59] text-white py-3 rounded-xl"
          >
            Save
          </button>
        </Modal>
      )}

      {/* DELETE */}
      {deleting && (
        <Modal title="Delete" onClose={() => setDeleting(null)}>
          <p className="text-black">
            Delete <b>{deleting.title}</b>?
          </p>

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

/* CARD (UNCHANGED DESIGN — JUST DYNAMIC) */
function ChallengeCard({
  title,
  video,
  onEdit,
  onDelete,
}: any) {
  return (
    <div className="rounded-2xl border border-[#ff7a59]/60 bg-[#0a0a0a] p-6">
      <div className="overflow-hidden rounded-xl bg-black">
        <video controls className="w-full rounded-xl">
          <source src={video} type="video/mp4" />
        </video>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg bg-[#ff7a59] px-5 py-3 text-white">
        <span className="text-sm font-semibold md:text-base">
          {title}
        </span>

        <div className="flex items-center gap-3">
          <button onClick={onEdit} className="hover:opacity-80">
            ✏️
          </button>

          <button onClick={onDelete} className="hover:opacity-80">
            🗑️
          </button>
        </div>
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
      <label className="font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#ff7a59] rounded-xl p-3 mt-1"
      />
    </div>
  );
}