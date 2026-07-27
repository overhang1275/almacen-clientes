import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, PackageCheck, Users } from "lucide-react";
import Link from "next/link";
import { Bars, ChartCard, Lines } from "../DashboardCharts";
import { unitLabel } from "../units";

type AllocationRow = {
  created_at: string;
  quantity: number;
  stock_unit: string;
  production_orders: { op_number: string } | null;
  materials: { batch_number: string | null; material_categories: { name: string } | null } | null;
};

export default async function EnlacePage() {
  await requireRole(["ADMIN", "ENLACE"]);
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = daysAgo(29);
  const [{ count: pending = 0 }, { data: allocatedToday = [] }, { data: stockRows = [] }, { data: orders = [] }, { data: allocations = [] }] = await Promise.all([
    supabase.from("production_orders").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("allocations").select("quantity, stock_unit").gte("created_at", `${today}T00:00:00`),
    supabase.from("materials").select("current_stock, stock_unit").eq("quality_status", "APPROVED").gt("current_stock", 0),
    supabase.from("production_orders").select("status"),
    supabase
      .from("allocations")
      .select("created_at, quantity, stock_unit, production_orders(op_number), materials(batch_number, material_categories(name))")
      .gte("created_at", `${thirtyDaysAgo}T00:00:00`)
      .order("created_at", { ascending: false })
      .returns<AllocationRow[]>()
  ]);
  const assigned = (allocatedToday ?? []).reduce<Record<string, number>>((totals, row) => {
    totals[row.stock_unit] = (totals[row.stock_unit] ?? 0) + Number(row.quantity);
    return totals;
  }, {});
  const assignedLabel = Object.entries(assigned).map(([unit, total]) => `${total.toLocaleString("es-MX")} ${unitLabel(unit)}`).join(" / ") || "0";
  const stockLabel = totalsLabel((stockRows ?? []).reduce<Record<string, number>>((totals, row) => {
    totals[row.stock_unit] = (totals[row.stock_unit] ?? 0) + Number(row.current_stock);
    return totals;
  }, {}));
  const ordersByStatus = topCounts(orders ?? [], (row) => row.status);
  const allocationTrend = lastDays(30).map((day) => {
    const dayRows = (allocations ?? []).filter((row) => row.created_at.slice(0, 10) === day);
    return { dia: day.slice(5), asignaciones: dayRows.length, MT: unitTotal(dayRows, "MT"), PCS: unitTotal(dayRows, "PCS") };
  });
  const latest = (allocations ?? []).slice(0, 5);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-indigo-700">Planeacion</p>
        <h1 className="mt-1 text-3xl font-semibold">ENLACE</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Ordenes de produccion y asignacion segura de stock aprobado.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="OP pendientes" value={pending?.toString() ?? "0"} />
        <Metric label="Material asignado hoy" value={assignedLabel} />
        <Metric label="Stock disponible" value={stockLabel} />
        <Link className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm hover:border-emerald-500" href="/enlace/clientes">
          <Users aria-hidden className="h-6 w-6 text-emerald-700" />
          <h2 className="mt-4 text-lg font-semibold">Clientes</h2>
          <p className="mt-2 text-sm text-slate-600">Altas y datos de contacto.</p>
        </Link>
        <Link className="rounded-lg border border-indigo-200 bg-white p-5 shadow-sm hover:border-indigo-500" href="/enlace/ordenes">
          <ClipboardList aria-hidden className="h-6 w-6 text-indigo-700" />
          <h2 className="mt-4 text-lg font-semibold">Ordenes</h2>
          <p className="mt-2 text-sm text-slate-600">Crear OP y asignar material.</p>
        </Link>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ordenes por estado">
          <Bars bars={[{ key: "value", label: "OP", color: "#2563eb" }]} data={ordersByStatus} xKey="name" />
        </ChartCard>
        <ChartCard title="Asignaciones diarias">
          <Lines data={allocationTrend} lines={[{ key: "asignaciones", label: "Movimientos" }, { key: "MT", label: "m.l." }, { key: "PCS", label: "pza." }]} xKey="dia" />
        </ChartCard>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Ultimas asignaciones</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 font-medium">OP</th>
                <th className="py-2 font-medium">Material</th>
                <th className="py-2 font-medium">Cantidad</th>
                <th className="py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((row) => (
                <tr className="border-t border-slate-100" key={`${row.created_at}-${row.quantity}`}>
                  <td className="py-2">{row.production_orders?.op_number ?? "-"}</td>
                  <td className="py-2">{row.materials?.material_categories?.name ?? "-"} / {row.materials?.batch_number ?? "-"}</td>
                  <td className="py-2">{row.quantity} {unitLabel(row.stock_unit)}</td>
                  <td className="py-2">{new Date(row.created_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <PackageCheck aria-hidden className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => daysAgo(count - 1 - index));
}

function totalsLabel(totals: Record<string, number>) {
  return Object.entries(totals).map(([unit, total]) => `${total.toLocaleString("es-MX")} ${unitLabel(unit)}`).join(" / ") || "0";
}

function topCounts<T>(rows: T[], getName: (row: T) => string) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const name = getName(row);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function unitTotal(rows: AllocationRow[], unit: string) {
  return rows.filter((row) => row.stock_unit === unit).reduce((sum, row) => sum + Number(row.quantity), 0);
}
