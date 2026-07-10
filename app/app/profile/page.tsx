"use client";

import { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiShield } from "react-icons/fi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { getProfileApi } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  name: string;
  role: string;
  email: string;
  phone: string;
  branch: string;
  joined: string;
  stats: { label: string; value: string }[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getProfileApi();
        if (res.data.success) {
          setProfile(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

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
                <FiShield className="w-3 h-3 inline mr-1 -mt-0.5" />
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
          <Button variant="outline" size="sm" className="gap-2 shrink-0">
            <FiEdit2 className="w-3.5 h-3.5" />
            Edit Profile
          </Button>
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
    </div>
  );
}
