import { ClipboardCheck, PackageCheck, ShieldCheck, Users } from "lucide-react";

const roles = [
  {
    name: "ALMACEN",
    icon: PackageCheck,
    work: "Entradas, ubicaciones y salidas fisicas",
    path: "/almacen"
  },
  {
    name: "ENLACE",
    icon: ClipboardCheck,
    work: "OP y asignacion de material aprobado",
    path: "/enlace"
  },
  {
    name: "CALIDAD",
    icon: ShieldCheck,
    work: "Aprobacion, rechazo e inmovilizacion",
    path: "/calidad"
  },
  {
    name: "ADMIN",
    icon: Users,
    work: "Catalogos, usuarios y auditoria",
    path: "/admin"
  }
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-8">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Inventario en consignacion
        </p>
        <h1 className="text-3xl font-semibold text-slate-950">Almacen de clientes</h1>
        <p className="max-w-2xl text-slate-600">
          Control fisico de materiales ajenos: cantidades, ubicaciones, calidad y trazabilidad.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <a
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
              href={role.path}
              key={role.name}
            >
              <div className="flex items-start gap-4">
                <Icon aria-hidden className="mt-1 h-6 w-6 text-slate-700" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{role.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{role.work}</p>
                </div>
              </div>
            </a>
          );
        })}
      </section>
    </main>
  );
}
