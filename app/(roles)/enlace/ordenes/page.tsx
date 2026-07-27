import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Toast } from "../../almacen/entrada/Toast";
import { NewOrderButton } from "./NewOrderButton";
import { getPage, getPageSize, pageRange, Pagination } from "../../Pagination";
import { DownloadOpPdfButton } from "../DownloadOpPdfButton";

type PageProps = {
  searchParams?: Record<string, string | undefined>;
};

type OrderRow = {
  id: string;
  op_number: string;
  description: string;
  due_date: string | null;
  status: string;
  created_at: string;
  clients: { name: string } | null;
};

const statusText: Record<string, string> = {
  PENDING: "Pendiente",
  ALLOCATED: "En Proceso",
  CLOSED: "Completada",
  CANCELLED: "Cancelada"
};

export default async function OrdenesPage({ searchParams }: PageProps) {
  await requireRole(["ADMIN", "ENLACE"]);

  const supabase = createClient();
  const page = getPage(searchParams ?? {});
  const pageSize = getPageSize(searchParams ?? {});
  const { from, to } = pageRange(page, pageSize);
  const [{ data: orders = [], count = 0 }, { data: clients = [] }] = await Promise.all([
    supabase
      .from("production_orders")
      .select("id, op_number, description, due_date, status, created_at, clients(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<OrderRow[]>(),
    supabase.from("clients").select("id, name").order("name")
  ]);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Enlace</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Ordenes de produccion</h1>
          <p className="mt-2 text-slate-600">Planeacion y asignacion de material aprobado.</p>
        </div>
        <NewOrderButton clients={clients ?? []} />
      </header>

      {searchParams?.message === "op-creada" ? <Toast>OP creada.</Toast> : null}
      {searchParams?.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p> : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Numero OP</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Descripcion</th>
                <th className="px-4 py-3 font-medium">Entrega</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Accion</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((order) => (
                <tr className="border-t border-slate-100 hover:bg-slate-50" key={order.id}>
                  <td className="px-4 py-3 font-medium">{order.op_number}</td>
                  <td className="px-4 py-3">{order.clients?.name ?? "-"}</td>
                  <td className="px-4 py-3">{order.description}</td>
                  <td className="px-4 py-3">{order.due_date ? new Date(order.due_date).toLocaleDateString("es-MX") : "-"}</td>
                  <td className="px-4 py-3">{statusText[order.status] ?? order.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-medium hover:border-slate-500" href={`/enlace/asignar/${order.id}`}>
                        <ArrowRight aria-hidden className="h-4 w-4" />
                        Asignar
                      </Link>
                      <DownloadOpPdfButton compact orderId={order.id} opNumber={order.op_number} />
                    </div>
                  </td>
                </tr>
              ))}
              {!(orders ?? []).length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>Sin OP para mostrar.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <Pagination basePath="/enlace/ordenes" page={page} pageSize={pageSize} searchParams={searchParams ?? {}} total={count ?? 0} />
    </main>
  );
}
