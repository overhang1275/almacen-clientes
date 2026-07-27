import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { unitLabel } from "../../units";

type PageProps = {
  searchParams?: Record<string, string | undefined>;
};

type MovementRow = {
  id: string;
  created_at: string;
  created_by: string | null;
  movement_type: string;
  note: string | null;
  quantity: number;
  stock_unit: string;
  materials: {
    batch_number: string | null;
    material_type: string;
    clients: { name: string } | null;
    material_categories: { name: string } | null;
  } | null;
};

export default async function AuditoriaPage({ searchParams = {} }: PageProps) {
  await requireRole(["ADMIN", "CALIDAD"]);

  const supabase = createClient();
  let query = supabase
    .from("inventory_movements")
    .select("id, created_at, created_by, movement_type, note, quantity, stock_unit, materials(batch_number, material_type, clients(name), material_categories(name))")
    .in("movement_type", ["QUALITY_APPROVED", "QUALITY_REJECTED"])
    .order("created_at", { ascending: false });

  if (searchParams.from) query = query.gte("created_at", `${searchParams.from}T00:00:00`);
  if (searchParams.to) query = query.lte("created_at", `${searchParams.to}T23:59:59`);
  if (searchParams.user_id) query = query.eq("created_by", searchParams.user_id);

  const { data = [] } = await query.returns<MovementRow[]>();
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => row.created_by).filter(Boolean))] as string[];
  const { data: profiles = [] } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Calidad</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Auditoria</h1>
          <p className="mt-2 text-slate-600">Aprobaciones y rechazos con usuario, fecha y observaciones.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:border-slate-500" href="/calidad/pendientes">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Pendientes
        </Link>
      </header>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_1.5fr_auto]">
        <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.from ?? ""} name="from" type="date" />
        <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.to ?? ""} name="to" type="date" />
        <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.user_id ?? ""} name="user_id" placeholder="ID de usuario" />
        <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500" type="submit">Filtrar</button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Movimiento</th>
                <th className="px-4 py-3 font-medium">Material</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-slate-100" key={row.id}>
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleString("es-MX")}</td>
                  <td className="px-4 py-3">{row.created_by ? names.get(row.created_by) ?? row.created_by.slice(0, 8) : "-"}</td>
                  <td className="px-4 py-3">{row.movement_type}</td>
                  <td className="px-4 py-3">
                    {row.materials?.clients?.name ?? "-"} / {row.materials?.material_categories?.name ?? "-"} / {row.materials?.batch_number ?? "-"}
                  </td>
                  <td className="px-4 py-3">{row.quantity} {unitLabel(row.stock_unit)}</td>
                  <td className="px-4 py-3">{row.note ?? "-"}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>Sin movimientos de calidad.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
