"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const orderSchema = z.object({
  client_id: z.string().uuid(),
  op_number: z.string().trim().min(1),
  description: z.string().trim().min(1),
  due_date: z.string().optional()
});

const allocationSchema = z.object({
  material_id: z.string().uuid(),
  production_order_id: z.string().uuid(),
  quantity: z.coerce.number().positive()
});

const rfcSchema = z.string().trim().toUpperCase().regex(/^([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})$/, "RFC invalido");

const clientSchema = z.object({
  name: z.string().trim().min(1),
  tax_id: rfcSchema,
  address: z.string().trim().min(1),
  contact_phone: z.string().trim().optional(),
  contact_email: z.string().trim().email().optional().or(z.literal(""))
});

const clientUpdateSchema = z.object({
  id: z.string().uuid(),
  address: z.string().trim().min(1),
  contact_phone: z.string().trim().optional(),
  contact_email: z.string().trim().email().optional().or(z.literal(""))
});

export async function createOrder(formData: FormData) {
  const profile = await requireRole(["ADMIN", "ENLACE"]);
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/enlace/ordenes?error=datos-invalidos");
  }

  const supabase = createClient();
  const { error } = await supabase.from("production_orders").insert({
    ...parsed.data,
    created_by: profile.id,
    due_date: parsed.data.due_date || null,
    status: "PENDING"
  });

  if (error) {
    redirect(`/enlace/ordenes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/enlace");
  revalidatePath("/enlace/ordenes");
  redirect("/enlace/ordenes?message=op-creada");
}

export async function assignMaterial(formData: FormData) {
  await requireRole(["ADMIN", "ENLACE"]);
  const parsed = allocationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/enlace/ordenes?error=datos-invalidos");
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("assign_material_to_op", {
    p_material_id: parsed.data.material_id,
    p_production_order_id: parsed.data.production_order_id,
    p_quantity: parsed.data.quantity
  });

  if (error) {
    redirect(`/enlace/asignar/${parsed.data.production_order_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/enlace");
  revalidatePath("/enlace/ordenes");
  revalidatePath(`/enlace/asignar/${parsed.data.production_order_id}`);
  redirect(`/enlace/asignar/${parsed.data.production_order_id}?message=asignado`);
}

export async function createExternalClient(formData: FormData) {
  const profile = await requireRole(["ADMIN", "ENLACE"]);
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/enlace/clientes?error=rfc-invalido");
  }

  const supabase = createClient();
  const existing = await supabase.from("clients").select("name").eq("tax_id", parsed.data.tax_id).maybeSingle();

  if (existing.data) {
    redirect(`/enlace/clientes?error=${encodeURIComponent(`Este RFC ya esta registrado para ${existing.data.name}`)}`);
  }

  const { error } = await supabase.from("clients").insert({
    ...parsed.data,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
    created_by: profile.id
  });

  if (error) {
    redirect(`/enlace/clientes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/enlace/clientes");
  redirect("/enlace/clientes?message=cliente-creado");
}

export async function updateExternalClient(formData: FormData) {
  await requireRole(["ADMIN", "ENLACE"]);
  const parsed = clientUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/enlace/clientes?error=datos-invalidos");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      address: parsed.data.address,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(`/enlace/clientes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/enlace/clientes");
  redirect("/enlace/clientes?message=cliente-actualizado");
}

export async function deleteExternalClient(formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    redirect("/enlace/clientes?error=No se puede eliminar el cliente porque tiene materiales registrados en el sistema.");
  }

  revalidatePath("/enlace/clientes");
  redirect("/enlace/clientes?message=cliente-eliminado");
}
