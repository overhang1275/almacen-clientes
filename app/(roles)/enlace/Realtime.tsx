"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export function Realtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("enlace-stock")
      .on("postgres_changes", { event: "*", schema: "public", table: "materials" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "allocations" }, () => router.refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
