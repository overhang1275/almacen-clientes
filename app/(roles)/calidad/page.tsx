import { requireRole } from "@/lib/auth";
import { ClipboardCheck, ClipboardList } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bars, ChartCard, PieDonut } from "../DashboardCharts";

type MovementRow = {
  created_at: string;
  movement_type: string;
  note: string | null;
  materials: { batch_number: string | null; clients: { name: string } | null; material_categories: { name: string } | null } | null;
};

export default async function CalidadPage() {
  await requireRole(["ADMIN", "CALIDAD"]);
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = daysAgo(6);
  const [{ count: pending = 0 }, { data: movements = [] }] = await Promise.all([
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("quality_status", "PENDING"),
    supabase
      .from("inventory_movements")
      .select("created_at, movement_type, note, materials(batch_number, clients(name), material_categories(name))")
      .in("movement_type", ["QUALITY_APPROVED", "QUALITY_REJECTED"])
      .gte("created_at", `${sevenDaysAgo}T00:00:00`)
      .order("created_at", { ascending: false })
      .returns<MovementRow[]>()
  ]);
  const rows = movements ?? [];
  const approvedToday = rows.filter((row) => row.movement_type === "QUALITY_APPROVED" && row.created_at.slice(0, 10) === today).length;
  const rejectedToday = rows.filter((row) => row.movement_type === "QUALITY_REJECTED" && row.created_at.slice(0, 10) === today).length;
  const decisionTrend = lastDays(7).map((day) => {
    const dayRows = rows.filter((row) => row.created_at.slice(0, 10) === day);
    return {
      dia: day.slice(5),
      aprobados: dayRows.filter((row) => row.movement_type === "QUALITY_APPROVED").length,
      rechazados: dayRows.filter((row) => row.movement_type === "QUALITY_REJECTED").length
    };
  });
  const rejectReasons = topCounts(rows.filter((row) => row.movement_type === "QUALITY_REJECTED"), (row) => row.note ?? "Sin motivo", 6);
  const latest = rows.slice(0, 5);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">Operacion de calidad</p>
        <h1 className="mt-1 text-3xl font-semibold">CALIDAD</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Inspeccion de materiales pendientes e inmovilizacion de rechazados.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Pendientes de inspeccion" value={pending?.toString() ?? "0"} />
        <Metric label="Aprobados hoy" value={approvedToday.toString()} />
        <Metric label="Rechazados hoy" value={rejectedToday.toString()} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Aprobados vs rechazados">
          <Bars
            bars={[
              { key: "aprobados", label: "Aprobados", color: "#16a34a" },
              { key: "rechazados", label: "Rechazados", color: "#ef4444" }
            ]}
            data={decisionTrend}
            xKey="dia"
          />
        </ChartCard>
        <ChartCard title="Motivos de rechazo">
          <PieDonut data={rejectReasons} nameKey="name" valueKey="value" />
        </ChartCard>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Ultimos revisados</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 font-medium">Cliente</th>
                <th className="py-2 font-medium">Material</th>
                <th className="py-2 font-medium">Estado</th>
                <th className="py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((row) => (
                <tr className="border-t border-slate-100" key={`${row.created_at}-${row.materials?.batch_number}`}>
                  <td className="py-2">{row.materials?.clients?.name ?? "-"}</td>
                  <td className="py-2">{row.materials?.material_categories?.name ?? "-"} / {row.materials?.batch_number ?? "-"}</td>
                  <td className="py-2">{row.movement_type}</td>
                  <td className="py-2">{new Date(row.created_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm hover:border-emerald-500" href="/calidad/pendientes">
          <ClipboardList aria-hidden className="h-6 w-6 text-emerald-700" />
          <h2 className="mt-4 text-lg font-semibold">Pendientes</h2>
          <p className="mt-2 text-sm text-slate-600">Aprobar o rechazar material recien recibido.</p>
        </Link>
        <Link className="rounded-lg border border-indigo-200 bg-white p-5 shadow-sm hover:border-indigo-500" href="/calidad/auditoria">
          <ClipboardCheck aria-hidden className="h-6 w-6 text-indigo-700" />
          <h2 className="mt-4 text-lg font-semibold">Auditoria</h2>
          <p className="mt-2 text-sm text-slate-600">Consultar movimientos QUALITY_APPROVED y QUALITY_REJECTED.</p>
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

function topCounts<T>(rows: T[], getName: (row: T) => string, limit: number) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const name = getName(row);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, value]) => ({ name, value }));
}
