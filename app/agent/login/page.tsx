"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "sonner";

export default function AgentLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("agent@lvms.com");
  const [password, setPassword] = useState("agent123");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("Welcome back, Agent!");
    router.push("/agent");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6FB] p-4 text-slate-800" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
        
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E4DB7] text-white shadow-md shadow-blue-500/10">
            <FiShield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">LVMS</h1>
          <p className="text-xs text-gray-400 font-semibold">Field Verification Agent Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@lvms.com"
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E4DB7]/15 focus:border-[#1E4DB7] transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E4DB7]/15 focus:border-[#1E4DB7] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
            style={{ background: "#1E4DB7" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                </svg>
                Signing in…
              </span>
            ) : "Sign In"}
          </button>

        </form>

        <p className="text-center text-[11px] text-gray-400">
          Contact your administrator if you forgot your credentials
        </p>

      </div>

      {/* Footer copyright info */}
      <p className="text-center text-[10px] text-gray-400 font-semibold mt-4">
        © 2026 Loan Verification Management System. All rights reserved.
      </p>
    </div>
  );
}
