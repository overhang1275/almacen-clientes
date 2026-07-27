import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Toast } from "../../../almacen/entrada/Toast";
import { Realtime } from "../../Realtime";
import { AssignForm } from "./AssignForm";
import { unitLabel } from "../../../units";

type PageProps = {
  params: {
    orderId: string;
  };
  searchParams?: {
    error?: string;
    message?: string;
    q?: string;
  };
};

type Order = {
  id: string;
  client_id: string;
  op_number: string;
  description: string;
  due_date: string | null;
  status: string;
  clients: { name: string } | null;
};

type Material = {
  id: string;
  batch_number: string | null;
  current_stock: number;
  location_rack: string;
  material_type: string;
  stock_unit: string;
  material_categories: { name: string } | null;
};

type Allocation = {
  id: string;
  quantity: number;
  stock_unit: string;
  created_at: string;
  materials: { batch_number: string | null; material_categories: { name: string } | null } | null;
};

export default async function AsignarPage({ params, searchParams = {} }: PageProps) {
  await requireRole(["ADMIN", "ENLACE"]);

  const supabase = createClient();
  const { data: order } = await supabase
    .from("production_orders")
    .select("id, client_id, op_number, description, due_date, status, clients(name)")
    .eq("id", params.orderId)
    .single<Order>();

  if (!order) notFound();

  let materialsQuery = supabase
    .from("materials")
    .select("id, batch_number, current_stock, location_rack, material_type, stock_unit, material_categories(name)")
    .eq("client_id", order.client_id)
    .eq("quality_status", "APPROVED")
    .gt("current_stock", 0)
    .order("created_at", { ascending: true });

  if (searchParams.q) {
    materialsQuery = materialsQuery.or(`batch_number.ilike.%${searchParams.q}%,location_rack.ilike.%${searchParams.q}%`);
  }

  const [{ data: materials = [] }, { data: allocations = [] }] = await Promise.all([
    materialsQuery.returns<Material[]>(),
    supabase
      .from("allocations")
      .select("id, quantity, stock_unit, created_at, materials(batch_number, material_categories(name))")
      .eq("production_order_id", order.id)
      .order("created_at", { ascending: false })
      .returns<Allocation[]>()
  ]);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <Realtime />
      {searchParams.message === "asignado" ? <Toast>Material asignado.</Toast> : null}
      {searchParams.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{searchParams.error}</p> : null}

      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">OP {order.op_number}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">{order.clients?.name ?? "Cliente"}</h1>
          <p className="mt-2 text-slate-600">{order.description}</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:border-slate-500" href="/enlace/ordenes">
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Ordenes
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <form className="rounded-lg border border-slate-200 bg-white p-4">
            <input className="w-full rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.q ?? ""} name="q" placeholder="Buscar lote o ubicacion" />
          </form>
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Familia</th>
                    <th className="px-4 py-3 font-medium">Lote</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Ubicacion</th>
                  </tr>
                </thead>
                <tbody>
                  {(materials ?? []).map((material) => (
                    <tr className="border-t border-slate-100" key={material.id}>
                      <td className="px-4 py-3">{material.material_categories?.name ?? "-"}</td>
                      <td className="px-4 py-3">{material.material_type}</td>
                      <td className="px-4 py-3">{material.batch_number ?? "-"}</td>
                      <td className="px-4 py-3">{material.current_stock} {unitLabel(material.stock_unit)}</td>
                      <td className="px-4 py-3">{material.location_rack}</td>
                    </tr>
                  ))}
                  {!(materials ?? []).length ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={5}>Sin material aprobado disponible.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <AssignForm materials={materials ?? []} orderId={order.id} />
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Asignado a esta OP</h2>
            <div className="mt-3 grid gap-3">
              {(allocations ?? []).map((allocation) => (
                <div className="rounded-md bg-slate-50 p-3 text-sm" key={allocation.id}>
                  <p className="font-medium">{allocation.materials?.material_categories?.name ?? "-"} / {allocation.materials?.batch_number ?? "-"}</p>
                  <p className="text-slate-600">{allocation.quantity} {unitLabel(allocation.stock_unit)}</p>
                </div>
              ))}
              {!(allocations ?? []).length ? <p className="text-sm text-slate-500">Sin asignaciones.</p> : null}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
