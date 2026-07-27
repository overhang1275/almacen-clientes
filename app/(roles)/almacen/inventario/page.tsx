import Link from "next/link";
import { Filter, PackagePlus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InventoryDrawer } from "./InventoryDrawer";
import { InventoryRealtime } from "./InventoryRealtime";
import { unitLabel } from "../../units";
import { getPage, getPageSize, pageRange, Pagination } from "../../Pagination";

type PageProps = {
  searchParams?: Record<string, string | undefined>;
};

type InventoryRow = {
  id: string;
  batch_number: string | null;
  current_stock: number;
  location_rack: string;
  material_type: string;
  quality_status: string;
  stock_unit: string;
  grammage_gsm: number | null;
  thickness_microns: number | null;
  weight_kg: number | null;
  created_at: string;
  clients: { id: string; name: string } | null;
  material_categories: { id: string; name: string } | null;
};

const statuses = ["PENDING", "APPROVED", "REJECTED"];

export default async function InventarioPage({ searchParams = {} }: PageProps) {
  await requireRole(["ADMIN", "ALMACEN"]);

  const supabase = createClient();
  const page = getPage(searchParams);
  const pageSize = getPageSize(searchParams);
  const { from, to } = pageRange(page, pageSize);
  const [{ data: clients = [] }, { data: categories = [] }] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("material_categories").select("id, name").order("name")
  ]);

  let query = supabase
    .from("materials")
    .select("id, batch_number, current_stock, location_rack, material_type, quality_status, stock_unit, grammage_gsm, thickness_microns, weight_kg, created_at, clients(id, name), material_categories(id, name)", { count: "exact" });

  if (searchParams.client_id) query = query.eq("client_id", searchParams.client_id);
  if (searchParams.category_id) query = query.eq("category_id", searchParams.category_id);
  if (searchParams.quality_status) query = query.eq("quality_status", searchParams.quality_status);
  if (searchParams.location) query = query.ilike("location_rack", `%${searchParams.location}%`);

  const sort = searchParams.sort ?? "created_at.desc";
  const [column, direction] = sort.split(".");
  const { data = [], count = 0 } = await query.order(column, { ascending: direction === "asc" }).range(from, to).returns<InventoryRow[]>();
  const rows = data ?? [];
  const selected = rows.find((row) => row.id === searchParams.material);

  const [{ data: movements = [] }, { data: allocations = [] }] = selected
    ? await Promise.all([
        supabase
          .from("inventory_movements")
          .select("id, movement_type, quantity, stock_unit, note, created_at")
          .eq("material_id", selected.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("allocations")
          .select("id, quantity, stock_unit, created_at, production_orders(op_number, description)")
          .eq("material_id", selected.id)
          .order("created_at", { ascending: false })
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <InventoryRealtime />
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Almacen</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Inventario</h1>
          <p className="mt-2 text-slate-600">Stock fisico por cliente, categoria, ubicacion y estado de calidad.</p>
        </div>
        <Link className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" href="/almacen/entrada">
          <PackagePlus aria-hidden className="h-4 w-4" />
          Nueva entrada
        </Link>
      </header>

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5">
        <Select name="client_id" options={clients ?? []} placeholder="Cliente" value={searchParams.client_id} />
        <Select name="category_id" options={categories ?? []} placeholder="Categoria" value={searchParams.category_id} />
        <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.quality_status ?? ""} name="quality_status">
          <option value="">Estado</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.location ?? ""} name="location" placeholder="Ubicacion" />
        <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:border-slate-500" type="submit">
          <Filter aria-hidden className="h-4 w-4" />
          Filtrar
        </button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <Th sort="material_type.asc">Familia</Th>
                <Th sort="batch_number.asc">Lote</Th>
                <Th sort="current_stock.asc">Stock</Th>
                <th className="px-4 py-3 font-medium">Ficha</th>
                <Th sort="location_rack.asc">Ubicacion</Th>
                <Th sort="quality_status.asc">Calidad</Th>
                <Th sort="created_at.desc">Entrada</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-slate-100 hover:bg-slate-50" key={row.id}>
                  <td className="px-4 py-3">
                    <Link href={`/almacen/inventario?material=${row.id}`}>{row.clients?.name ?? "-"}</Link>
                  </td>
                  <td className="px-4 py-3">{row.material_categories?.name ?? "-"}</td>
                  <td className="px-4 py-3">{row.material_type}</td>
                  <td className="px-4 py-3">{row.batch_number ?? "-"}</td>
                  <td className="px-4 py-3">
                    {row.current_stock} {unitLabel(row.stock_unit)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {[row.grammage_gsm ? `${row.grammage_gsm} g/m2` : null, row.thickness_microns ? `${row.thickness_microns} um` : null, row.weight_kg ? `${row.weight_kg} kg` : null]
                      .filter(Boolean)
                      .join(" / ") || "-"}
                  </td>
                  <td className="px-4 py-3">{row.location_rack}</td>
                  <td className="px-4 py-3">{row.quality_status}</td>
                  <td className="px-4 py-3">{new Date(row.created_at).toLocaleDateString("es-MX")}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={9}>
                    Sin materiales para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <Pagination basePath="/almacen/inventario" page={page} pageSize={pageSize} searchParams={searchParams} total={count ?? 0} />

      {selected ? (
        <InventoryDrawer
          allocations={allocations ?? []}
          movements={movements ?? []}
          title={`${selected.clients?.name ?? "Material"} / ${selected.batch_number ?? selected.id.slice(0, 8)}`}
        />
      ) : null}
    </main>
  );
}

function Select({
  name,
  options,
  placeholder,
  value
}: {
  name: string;
  options: { id: string; name: string }[];
  placeholder: string;
  value?: string;
}) {
  return (
    <select className="rounded-md border border-slate-300 px-3 py-2" defaultValue={value ?? ""} name={name}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

function Th({ children, sort }: { children: React.ReactNode; sort: string }) {
  return (
    <th className="px-4 py-3 font-medium">
      <Link href={`/almacen/inventario?sort=${sort}`}>{children}</Link>
    </th>
  );
}
