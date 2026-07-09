"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginApi } from "@/lib/api";

/* ─── Login Page ─────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function autofillDemo() {
    setEmail("admin@loanverify.com");
    setPassword("admin123");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const { token, user } = res.data;
      // Persist token + user info
      localStorage.setItem("lvms_token", token);
      localStorage.setItem("lvms_user", JSON.stringify(user));
      router.push("/app");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Invalid email or password. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f020_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f020_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative w-full max-w-[400px]">
        {/* Card */}
        <div className="card-flat p-8 shadow-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md" style={{ background: "#1E3A5F" }}>
              <FiShield className="text-white w-7 h-7" />
            </div>
            <h1
              className="text-xl font-bold text-slate-900 text-center"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              LVMS
            </h1>
            <p className="text-xs text-slate-400 text-center mt-0.5">
              Loan Verification Management System
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-5">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@loanverify.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(!!v)}
                  className="w-4 h-4"
                />
                <span className="text-xs text-slate-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs font-medium hover:underline"
                style={{ color: "#1E3A5F" }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white gap-2 mt-2 font-semibold"
              style={{ background: loading ? "#2A4E7F" : "#1E3A5F" }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  <FiLogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo hint */}
          <p className="text-center text-xs text-slate-400 mt-6">
            Demo:{" "}
            <button
              type="button"
              onClick={autofillDemo}
              className="font-mono text-[#1E3A5F] underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              admin@loanverify.com / admin123
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-5">
          © 2026 Loan Verification Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
