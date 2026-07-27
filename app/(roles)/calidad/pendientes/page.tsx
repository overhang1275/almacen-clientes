import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Toast } from "../../almacen/entrada/Toast";
import { QualityRealtime } from "../QualityRealtime";
import { QualityActions } from "./QualityActions";
import { unitLabel } from "../../units";
import { getPage, getPageSize, pageRange, Pagination } from "../../Pagination";

type PageProps = {
  searchParams?: Record<string, string | undefined>;
};

type PendingRow = {
  id: string;
  batch_number: string | null;
  created_at: string;
  current_stock: number;
  location_rack: string;
  material_type: string;
  stock_unit: string;
  clients: { name: string } | null;
  material_categories: { name: string } | null;
};

const feedback: Record<string, string> = {
  aprobado: "Material aprobado.",
  rechazado: "Material rechazado.",
  "motivo-requerido": "El motivo de rechazo es obligatorio.",
  "no-se-pudo-actualizar": "No se pudo actualizar el material."
};

export default async function PendientesPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN", "CALIDAD"]);

  const supabase = createClient();
  const page = getPage(searchParams ?? {});
  const pageSize = getPageSize(searchParams ?? {});
  const { from, to } = pageRange(page, pageSize);
  const { data = [], count = 0 } = await supabase
    .from("materials")
    .select("id, batch_number, current_stock, location_rack, material_type, stock_unit, created_at, clients(name), material_categories(name)", { count: "exact" })
    .eq("quality_status", "PENDING")
    .order("created_at", { ascending: true })
    .range(from, to)
    .returns<PendingRow[]>();
  const rows = data ?? [];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <QualityRealtime />
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Calidad</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Material pendiente</h1>
          <p className="mt-2 text-slate-600">Aprobacion o rechazo antes de asignar a produccion.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:border-slate-500" href="/calidad/auditoria">
          <ClipboardCheck aria-hidden className="h-4 w-4" />
          Auditoria
        </Link>
      </header>

      {searchParams?.message ? <Toast>{feedback[searchParams.message] ?? searchParams.message}</Toast> : null}
      {searchParams?.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{feedback[searchParams.error] ?? searchParams.error}</p> : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Familia</th>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Ubicacion</th>
                <th className="px-4 py-3 font-medium">Entrada</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-slate-100 hover:bg-slate-50" key={row.id}>
                  <td className="px-4 py-3">{row.clients?.name ?? "-"}</td>
                  <td className="px-4 py-3">{row.material_categories?.name ?? "-"}</td>
                  <td className="px-4 py-3">{row.material_type}</td>
                  <td className="px-4 py-3">{row.batch_number ?? "-"}</td>
                  <td className="px-4 py-3">{row.current_stock} {unitLabel(row.stock_unit)}</td>
                  <td className="px-4 py-3">{row.location_rack}</td>
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleDateString("es-MX")}</td>
                  <td className="px-4 py-3"><QualityActions materialId={row.id} /></td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>Sin materiales pendientes.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <Pagination basePath="/calidad/pendientes" page={page} pageSize={pageSize} searchParams={searchParams ?? {}} total={count ?? 0} />
    </main>
  );
}
