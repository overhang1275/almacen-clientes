import { requireRole } from "@/lib/auth";
import { Boxes, PackagePlus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bars, ChartCard, PieDonut } from "../DashboardCharts";
import { unitLabel } from "../units";

type MaterialRow = {
  created_at: string;
  current_stock: number;
  quality_status: string;
  stock_unit: string;
  clients: { name: string } | null;
  material_categories: { name: string } | null;
};

export default async function AlmacenPage() {
  await requireRole(["ADMIN", "ALMACEN"]);
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = daysAgo(6);
  const { data = [] } = await supabase
    .from("materials")
    .select("created_at, current_stock, quality_status, stock_unit, clients(name), material_categories(name)")
    .gte("created_at", `${sevenDaysAgo}T00:00:00`)
    .returns<MaterialRow[]>();
  const rows = data ?? [];
  const todayRows = rows.filter((row) => row.created_at.slice(0, 10) === today);
  const pending = rows.filter((row) => row.quality_status === "PENDING").length;
  const stock = totalsByUnit(rows);
  const entriesByDay = lastDays(7).map((day) => {
    const dayRows = rows.filter((row) => row.created_at.slice(0, 10) === day);
    return { dia: day.slice(5), entradas: dayRows.length, MT: unitTotal(dayRows, "MT"), PCS: unitTotal(dayRows, "PCS") };
  });
  const byClient = topCounts(rows, (row) => row.clients?.name ?? "Sin cliente", 5);
  const byCategory = topCounts(rows, (row) => row.material_categories?.name ?? "Sin categoria", 8);

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">Operacion de planta</p>
        <h1 className="mt-1 text-3xl font-semibold">ALMACEN</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Entradas rapidas, ubicacion fisica e inventario sin valores monetarios.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Entradas de hoy" value={`${todayRows.length} / ${totalsLabel(totalsByUnit(todayRows))}`} />
        <Metric label="Pendiente de calidad" value={pending.toString()} />
        <Metric label="Stock total" value={totalsLabel(stock)} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Entradas por dia">
          <Bars bars={[{ key: "entradas", label: "Materiales" }, { key: "MT", label: "m.l." }, { key: "PCS", label: "pza." }]} data={entriesByDay} xKey="dia" />
        </ChartCard>
        <ChartCard title="Distribucion por cliente">
          <PieDonut data={byClient} nameKey="name" valueKey="value" />
        </ChartCard>
        <ChartCard title="Stock por categoria">
          <Bars bars={[{ key: "value", label: "Materiales", color: "#16a34a" }]} data={byCategory} xKey="name" />
        </ChartCard>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm hover:border-emerald-500" href="/almacen/entrada">
          <PackagePlus aria-hidden className="h-6 w-6 text-emerald-700" />
          <h2 className="mt-4 text-lg font-semibold">Entrada de material</h2>
          <p className="mt-2 text-sm text-slate-600">Registrar bobinas o pliegos con estado PENDIENTE.</p>
        </Link>
        <Link className="rounded-lg border border-indigo-200 bg-white p-5 shadow-sm hover:border-indigo-500" href="/almacen/inventario">
          <Boxes aria-hidden className="h-6 w-6 text-indigo-700" />
          <h2 className="mt-4 text-lg font-semibold">Inventario</h2>
          <p className="mt-2 text-sm text-slate-600">Consultar stock por cliente, categoria, estado y ubicacion.</p>
        </Link>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
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

function totalsByUnit(rows: MaterialRow[]) {
  return rows.reduce<Record<string, number>>((totals, row) => {
    totals[row.stock_unit] = (totals[row.stock_unit] ?? 0) + Number(row.current_stock);
    return totals;
  }, {});
}

function unitTotal(rows: MaterialRow[], unit: string) {
  return rows.filter((row) => row.stock_unit === unit).reduce((sum, row) => sum + Number(row.current_stock), 0);
}

function totalsLabel(totals: Record<string, number>) {
  return Object.entries(totals).map(([unit, total]) => `${total.toLocaleString("es-MX")} ${unitLabel(unit)}`).join(" / ") || "0";
}

function topCounts(rows: MaterialRow[], getName: (row: MaterialRow) => string, limit: number) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const name = getName(row);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, value]) => ({ name, value }));
}
