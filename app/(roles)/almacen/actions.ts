"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const baseSchema = z.object({
  client_id: z.string().uuid(),
  category_id: z.string().uuid(),
  material_type: z.enum(["BOBINA", "PLIEGO"]),
  location_rack: z.string().trim().min(1),
  batch_number: z.string().trim().optional(),
  grammage_gsm: z.coerce.number().positive().optional().or(z.literal("")),
  thickness_microns: z.coerce.number().positive().optional().or(z.literal("")),
  note: z.string().trim().optional()
});

const numberFromForm = z.coerce.number().positive();

const bobinaSchema = baseSchema.extend({
  material_type: z.literal("BOBINA"),
  width_cm: numberFromForm,
  diameter_cm: numberFromForm,
  core_diameter_cm: numberFromForm,
  weight_kg: numberFromForm
});

const pliegoSchema = baseSchema.extend({
  material_type: z.literal("PLIEGO"),
  width_cm: numberFromForm,
  length_cm: numberFromForm,
  pieces_qty: z.coerce.number().int().positive()
});

export async function createMaterialEntry(formData: FormData) {
  await requireRole(["ADMIN", "ALMACEN"]);

  const raw = Object.fromEntries(formData);
  const parsed = raw.material_type === "PLIEGO" ? pliegoSchema.safeParse(raw) : bobinaSchema.safeParse(raw);

  if (!parsed.success) {
    redirect("/almacen/entrada?error=datos-invalidos");
  }

  const supabase = createClient();
  const data = parsed.data;
  const isBobina = data.material_type === "BOBINA";
  const calculatedLength = isBobina ? calculateLinearMeters(data) : null;

  if (isBobina && !calculatedLength) {
    redirect("/almacen/entrada?error=no-se-pudo-calcular-metros-lineales");
  }

  const { error } = await supabase.from("materials").insert({
    batch_number: data.batch_number || null,
    category_id: data.category_id,
    client_id: data.client_id,
    core_diameter_cm: isBobina ? data.core_diameter_cm : null,
    current_stock: isBobina ? calculatedLength : data.pieces_qty,
    diameter_cm: isBobina ? data.diameter_cm : null,
    length_cm: isBobina ? null : data.length_cm,
    length_mt: isBobina ? calculatedLength : null,
    location_rack: data.location_rack,
    grammage_gsm: data.grammage_gsm || null,
    material_type: data.material_type,
    note: data.note || null,
    pieces_qty: isBobina ? null : data.pieces_qty,
    quality_status: "PENDING",
    stock_unit: isBobina ? "MT" : "PCS",
    thickness_microns: data.thickness_microns || null,
    width_cm: data.width_cm,
    weight_kg: isBobina ? data.weight_kg : null
  });

  if (error) {
    redirect(`/almacen/entrada?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/almacen/inventario");
  redirect("/almacen/entrada?message=entrada-guardada");
}

function calculateLinearMeters(data: z.infer<typeof bobinaSchema>) {
  const grammage = data.grammage_gsm || null;
  const thickness = data.thickness_microns || null;

  if (grammage) {
    return roundMeters((data.weight_kg * 100000) / (grammage * data.width_cm));
  }

  if (thickness) {
    const externalMm = data.diameter_cm * 10;
    const coreMm = data.core_diameter_cm * 10;
    return roundMeters((Math.PI * (externalMm ** 2 - coreMm ** 2)) / (4 * thickness * 1000));
  }

  return null;
}

function roundMeters(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) / 1000 : null;
}
