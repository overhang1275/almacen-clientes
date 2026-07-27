import { MapPinned, Pencil, Search, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Toast } from "../../almacen/entrada/Toast";
import { deleteExternalClient, updateExternalClient } from "../actions";
import { NewClientButton } from "./NewClientButton";
import { getPage, getPageSize, pageRange, Pagination } from "../../Pagination";

type PageProps = {
  searchParams?: Record<string, string | undefined>;
};

type ClientRow = {
  id: string;
  name: string;
  tax_id: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
};

const feedback: Record<string, string> = {
  "cliente-actualizado": "Cliente actualizado.",
  "cliente-creado": "Cliente creado correctamente.",
  "cliente-eliminado": "Cliente eliminado.",
  "datos-invalidos": "Revisa los datos del cliente.",
  "rfc-invalido": "RFC invalido."
};

export default async function ClientesPage({ searchParams = {} }: PageProps) {
  const profile = await requireRole(["ADMIN", "ENLACE"]);
  const supabase = createClient();
  const page = getPage(searchParams);
  const pageSize = getPageSize(searchParams);
  const { from, to } = pageRange(page, pageSize);
  let query = supabase
    .from("clients")
    .select("id, name, tax_id, address, contact_phone, contact_email, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (searchParams.q) {
    query = query.or(`name.ilike.%${searchParams.q}%,tax_id.ilike.%${searchParams.q}%`);
  }

  const { data = [], count = 0 } = await query.range(from, to).returns<ClientRow[]>();
  const clients = data ?? [];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-indigo-700">Enlace</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Clientes externos</h1>
          <p className="mt-2 text-slate-600">Catalogo comun para entradas de almacen y ordenes de produccion.</p>
        </div>
        <NewClientButton />
      </header>

      {searchParams.message ? <Toast>{feedback[searchParams.message] ?? searchParams.message}</Toast> : null}
      {searchParams.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{feedback[searchParams.error] ?? searchParams.error}</p> : null}

      <form className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <Search aria-hidden className="h-4 w-4 text-slate-500" />
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" defaultValue={searchParams.q ?? ""} name="q" placeholder="Buscar por razon social o RFC" />
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Razon Social</th>
                <th className="px-4 py-3 font-medium">RFC</th>
                <th className="px-4 py-3 font-medium">Direccion</th>
                <th className="px-4 py-3 font-medium">Telefono</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Creacion</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr className="border-t border-slate-100 align-top" key={client.id}>
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3">{client.tax_id ?? "-"}</td>
                  <td className="px-4 py-3">
                    <form action={updateExternalClient} className="grid gap-2">
                      <input name="id" type="hidden" value={client.id} />
                      <input className="min-w-56 rounded-md border border-slate-300 px-2 py-1" name="address" required defaultValue={client.address ?? ""} />
                      <input className="rounded-md border border-slate-300 px-2 py-1" name="contact_phone" placeholder="Telefono" defaultValue={client.contact_phone ?? ""} />
                      <input className="rounded-md border border-slate-300 px-2 py-1" name="contact_email" placeholder="Correo" type="email" defaultValue={client.contact_email ?? ""} />
                      <button className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-3 py-1 font-medium hover:border-slate-500" type="submit">
                        <Pencil aria-hidden className="h-4 w-4" />
                        Guardar
                      </button>
                      {client.address ? (
                        <a
                          className="inline-flex w-fit items-center gap-2 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(client.address)}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <MapPinned aria-hidden className="h-4 w-4" />
                          OpenStreetMap
                        </a>
                      ) : null}
                    </form>
                  </td>
                  <td className="px-4 py-3">{client.contact_phone ?? "-"}</td>
                  <td className="px-4 py-3">{client.contact_email ?? "-"}</td>
                  <td className="px-4 py-3">{new Date(client.created_at).toLocaleDateString("es-MX")}</td>
                  <td className="px-4 py-3">
                    {profile.role === "ADMIN" ? (
                      <form action={deleteExternalClient}>
                        <input name="id" type="hidden" value={client.id} />
                        <button aria-label="Eliminar cliente" className="inline-flex items-center rounded-md border border-red-200 p-2 text-red-700 hover:border-red-500" type="submit">
                          <Trash2 aria-hidden className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-500">Editar datos</span>
                    )}
                  </td>
                </tr>
              ))}
              {!clients.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>Sin clientes para mostrar.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <Pagination basePath="/enlace/clientes" page={page} pageSize={pageSize} searchParams={searchParams} total={count ?? 0} />
    </main>
  );
}
