import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EntryForm } from "./EntryForm";
import { Toast } from "./Toast";
import Link from "next/link";
import { Boxes } from "lucide-react";

type PageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default async function EntradaPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN", "ALMACEN"]);

  const supabase = createClient();
  const [{ data: clients = [] }, { data: categories = [] }] = await Promise.all([
    supabase.from("clients").select("id, name, tax_id").order("name"),
    supabase.from("material_categories").select("id, name").order("name")
  ]);
  const clientOptions = clients ?? [];
  const categoryOptions = categories ?? [];

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Almacen</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Entrada de material</h1>
          <p className="mt-2 text-slate-600">Registro rapido de bobinas y pliegos con trazabilidad INBOUND.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:border-slate-500" href="/almacen/inventario">
          <Boxes aria-hidden className="h-4 w-4" />
          Inventario
        </Link>
      </header>

      {searchParams?.message === "entrada-guardada" ? (
        <Toast>Entrada guardada.</Toast>
      ) : null}
      {searchParams?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p>
      ) : null}

      {!clientOptions.length ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          No hay clientes. Crea clientes antes de registrar entradas.
        </p>
      ) : null}

      <EntryForm categories={categoryOptions} clients={clientOptions} />
    </main>
  );
}
