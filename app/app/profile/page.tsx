"use client";

import { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiShield, FiLock } from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getProfileApi, updateProfileApi, updatePasswordApi } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  name: string;
  role: string;
  email: string;
  phone: string;
  branch: string;
  joined: string;
  firstName?: string;
  lastName?: string;
  stats: { label: string; value: string }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile states
  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Change password states
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfileApi();
        if (res.data.success) {
          setProfile(res.data.data);
          setFirstName(res.data.data.firstName || "");
          setLastName(res.data.data.lastName || "");
          setPhone(res.data.data.phone || "");
        }
      } catch (err) {
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First Name and Last Name are required");
      return;
    }
    if (phone) {
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        toast.error("Phone must be exactly 10 digits");
        return;
      }
    }
    try {
      setSaving(true);
      const res = await updateProfileApi({ firstName, lastName, phone });
      if (res.data.success) {
        toast.success("Profile updated successfully!");
        setProfile(prev => prev ? { ...prev, name: `${firstName} ${lastName}`, firstName, lastName, phone } : null);
        setEditOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      setSaving(true);
      const res = await updatePasswordApi({ oldPassword, newPassword });
      if (res.data.success) {
        toast.success("Password updated successfully!");
        setPasswordOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Profile Card Skeleton */}
        <div className="card-flat p-6 bg-white border border-border rounded-xl">
          <div className="flex items-start gap-5 flex-wrap">
            <Skeleton className="w-20 h-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-flat p-4 bg-white border border-border rounded-xl space-y-2 text-center flex flex-col items-center">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-slate-500">Failed to load profile.</p>
      </div>
    );
  }

  // Get initials for Avatar Fallback
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Profile" description="Your account information and activity summary." />

      {/* Profile Card */}
      <div className="card-flat p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <Avatar className="w-20 h-20 shrink-0">
            <AvatarFallback
              className="text-2xl font-bold font-mono"
              style={{ background: "#E8EFF8", color: "#1E3A5F" }}
            >
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {profile.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A5F]">
                <FiShield className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                {profile.role}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-slate-400" />
                <span>{profile.phone || "Not Set"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-slate-400" />
                <span>{profile.branch}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-slate-400" />
                <span>Joined: {profile.joined}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer" onClick={() => setEditOpen(true)}>
              <FiEdit2 className="w-3.5 h-3.5" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" className="gap-2 cursor-pointer text-slate-600 border-slate-200" onClick={() => setPasswordOpen(true)}>
              <FiLock className="w-3.5 h-3.5" />
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {profile.stats?.map((s) => (
          <div key={s.label} className="card-flat p-4 text-center">
            <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
              {s.value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit Profile Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] p-6 sm:p-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Edit Profile Details</SheetTitle>
            <SheetDescription>Update your name and telephone details.</SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full text-white cursor-pointer mt-4"
              style={{ background: "#1E3A5F" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Change Password Sheet */}
      <Sheet open={passwordOpen} onOpenChange={setPasswordOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] p-6 sm:p-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl">Change Password</SheetTitle>
            <SheetDescription>Secure your account with a new password.</SheetDescription>
          </SheetHeader>
          <Separator className="mb-6" />
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input id="oldPassword" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="w-full text-white cursor-pointer mt-4"
              style={{ background: "#1E3A5F" }}
            >
              {saving ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
