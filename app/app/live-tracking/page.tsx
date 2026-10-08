"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LiveTrackingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app/tracking");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-slate-400">Loading Live Tracking...</p>
    </div>
  );
}
