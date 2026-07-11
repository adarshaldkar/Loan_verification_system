"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiShield, FiMail, FiLock, FiAlertCircle, FiCheckCircle, FiArrowLeft, FiHash, FiEyeOff, FiEye } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { forgotPasswordApi, verifyResetOtpApi, resetPasswordApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form Data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email.");
    
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otp) return setError("Please enter the 6-digit OTP.");
    
    setLoading(true);
    try {
      await verifyResetOtpApi(email, otp);
      toast.success("OTP verified!");
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newPassword || !confirmPassword) return setError("Please fill in both fields.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    
    setLoading(true);
    try {
      await resetPasswordApi(email, otp, newPassword);
      toast.success("Password reset successfully! Please log in.");
      router.push("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f020_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f020_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="relative w-full max-w-[420px]">
        {/* Back link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <FiArrowLeft /> Back to login
        </Link>

        <div className="card-flat p-8 shadow-sm bg-white rounded-2xl border border-border">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md bg-[--color-brand-900]">
              <FiShield className="text-white w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 text-center font-heading">
              {step === 1 && "Reset Password"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Create New Password"}
            </h1>
            <p className="text-sm text-slate-500 text-center mt-1.5 px-4">
              {step === 1 && "Enter your email address and we'll send you a 6-digit code to reset your password."}
              {step === 2 && `We've sent a 6-digit code to ${email}. Please enter it below.`}
              {step === 3 && "Your identity has been verified. Choose a strong new password."}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl mb-5">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* STEP 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email Address</Label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@loanverify.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 text-white transition-opacity hover:opacity-90"
                style={{ background: "#1E3A5F" }}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-xs font-medium text-slate-700">6-Digit Code</Label>
                <div className="relative">
                  <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 h-11 tracking-widest text-lg font-mono"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 text-white transition-opacity hover:opacity-90"
                style={{ background: "#1E3A5F" }}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs font-medium text-slate-500 hover:text-[--color-brand-900] transition-colors hover:underline disabled:opacity-50"
                >
                  Didn't receive a code? Resend
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-pwd" className="text-xs font-medium text-slate-700">New Password</Label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="new-pwd"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pwd" className="text-xs font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirm-pwd"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 text-white transition-opacity hover:opacity-90"
                style={{ background: "#1E3A5F" }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
