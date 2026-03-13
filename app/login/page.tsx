"use client";

import { useState } from "react";

export default function Page() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="w-full max-w-md rounded-3xl border border-[#ff7a59]/60 bg-[#0a0a0a] p-10 shadow-[0_0_40px_rgba(255,122,89,0.12)]">

        {/* TITLE */}
        <h1 className="text-center text-3xl font-bold text-[#ff7a59]">
          The Owensboro App
        </h1>

        <h2 className="mt-6 text-center text-2xl font-semibold text-[#ff7a59]">
          Admin Login
        </h2>

        <p className="mt-2 text-center text-sm text-[#e8dcc7]">
          Sign in to manage your platform
        </p>

        {/* FORM */}
        <div className="mt-10 space-y-6">

          {/* EMAIL */}
          <div>
            <label className="text-sm font-medium text-[#e8dcc7]">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="mt-2 w-full rounded-xl border border-white/25 bg-black px-4 py-3 text-white outline-none transition focus:border-[#ff7a59] focus:ring-1 focus:ring-[#ff7a59]"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm font-medium text-[#e8dcc7]">
              Password
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/25 bg-black px-4 py-3 pr-12 text-white outline-none transition focus:border-[#ff7a59] focus:ring-1 focus:ring-[#ff7a59]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-[#ff7a59]"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button className="w-full rounded-xl bg-[#e8dcc7] py-3 font-semibold text-black transition hover:bg-[#ff7a59] hover:text-white">
            Login
          </button>

        </div>

      </div>
    </div>
  );
}