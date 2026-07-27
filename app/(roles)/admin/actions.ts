"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().trim().min(1),
  role: z.enum(["ADMIN", "ALMACEN", "ENLACE", "CALIDAD"])
});

const updateProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1),
  role: z.enum(["ADMIN", "ALMACEN", "ENLACE", "CALIDAD"])
});

export async function createUser(formData: FormData) {
  await requireRole(["ADMIN"]);

  const fields = createUserSchema.safeParse(Object.fromEntries(formData));

  if (!fields.success) {
    redirect("/admin?error=usuario-invalido");
  }

  const authClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await authClient.auth.signUp({
    email: fields.data.email,
    password: fields.data.password,
    options: { data: { full_name: fields.data.full_name } }
  });

  if (error || !data.user) {
    redirect("/admin?error=no-se-pudo-crear");
  }

  const supabase = createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ email: fields.data.email, full_name: fields.data.full_name, role: fields.data.role as AppRole })
    .eq("id", data.user.id);

  if (profileError) {
    redirect("/admin?error=no-se-pudo-actualizar-perfil");
  }

  redirect("/admin?message=usuario-creado");
}

export async function updateProfile(formData: FormData) {
  await requireRole(["ADMIN"]);

  const fields = updateProfileSchema.safeParse(Object.fromEntries(formData));

  if (!fields.success) {
    redirect("/admin?error=perfil-invalido");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fields.data.full_name, role: fields.data.role as AppRole })
    .eq("id", fields.data.id);

  if (error) {
    redirect("/admin?error=no-se-pudo-actualizar-perfil");
  }

  redirect("/admin?message=perfil-actualizado");
}
