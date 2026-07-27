"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { roleHome, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

async function redirectToRole(userId: string) {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single<{ role: AppRole }>();

  redirect(data?.role ? roleHome[data.role] : "/almacen");
}

export async function signIn(formData: FormData) {
  const fields = credentialsSchema.safeParse(Object.fromEntries(formData));

  if (!fields.success) {
    redirect("/login?error=credenciales-invalidas");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword(fields.data);

  if (error || !data.user) {
    redirect("/login?error=no-se-pudo-iniciar-sesion");
  }

  await redirectToRole(data.user.id);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
