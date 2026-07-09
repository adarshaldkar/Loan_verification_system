"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiShield, FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

/* ─── Login Page ─────────────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    // Simulate auth — in production this calls the backend JWT endpoint
    setTimeout(() => {
      if (email === "admin@lvms.com" && password === "admin123") {
        router.push("/app");
      } else {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      }
    }, 1200);
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
            <div className="w-14 h-14 rounded-2xl bg-[--color-brand-900] flex items-center justify-center mb-4 shadow-md">
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
                  placeholder="admin@lvms.com"
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
                className="text-xs text-[--color-brand-900] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[--color-brand-900] hover:bg-[--color-brand-800] text-white gap-2 mt-2"
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
            Demo: <span className="font-mono">admin@lvms.com</span> / <span className="font-mono">admin123</span>
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
