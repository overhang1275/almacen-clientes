"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const rejectSchema = z.object({
  material_id: idSchema,
  note: z.string().trim().min(1)
});

export async function approveMaterial(formData: FormData) {
  await decideQuality(idSchema.parse(formData.get("material_id")), "APPROVED", "Aprobado por Calidad.");
}

export async function rejectMaterial(formData: FormData) {
  const parsed = rejectSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/calidad/pendientes?error=motivo-requerido");
  }

  await decideQuality(parsed.data.material_id, "REJECTED", parsed.data.note);
}

async function decideQuality(materialId: string, status: "APPROVED" | "REJECTED", note: string) {
  const profile = await requireRole(["ADMIN", "CALIDAD"]);
  const supabase = createClient();

  const { data: material, error } = await supabase
    .from("materials")
    .update({ quality_status: status })
    .eq("id", materialId)
    .eq("quality_status", "PENDING")
    .select("id, current_stock, stock_unit")
    .single();

  if (error || !material) {
    redirect("/calidad/pendientes?error=no-se-pudo-actualizar");
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    created_by: profile.id,
    material_id: material.id,
    movement_type: status === "APPROVED" ? "QUALITY_APPROVED" : "QUALITY_REJECTED",
    note,
    quantity: material.current_stock,
    stock_unit: material.stock_unit
  });

  if (movementError) {
    redirect(`/calidad/pendientes?error=${encodeURIComponent(movementError.message)}`);
  }

  revalidatePath("/calidad");
  revalidatePath("/calidad/pendientes");
  revalidatePath("/calidad/auditoria");
  revalidatePath("/almacen/inventario");
  redirect(`/calidad/pendientes?message=${status === "APPROVED" ? "aprobado" : "rechazado"}`);
}
