import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const roleHome = {
  ADMIN: "/admin",
  ALMACEN: "/almacen",
  ENLACE: "/enlace",
  CALIDAD: "/calidad"
} as const;

export type AppRole = keyof typeof roleHome;

export type Profile = {
  id: string;
  full_name: string;
  role: AppRole;
};

export async function getSessionProfile() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single<Profile>();

  return profile;
}

export async function requireRole(allowed: AppRole[]) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowed.includes(profile.role)) {
    throw new Error("403");
  }

  return profile;
}
