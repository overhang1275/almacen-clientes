import { Save, ShieldCheck, UserPlus, Users, type LucideIcon } from "lucide-react";
import { requireRole, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createUser, updateProfile } from "./actions";
import { Bars, ChartCard, Lines, PieDonut } from "../DashboardCharts";

type AdminPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
};

type MaterialMetric = {
  quality_status: string;
  clients: { name: string } | null;
};

type MovementMetric = {
  created_at: string;
  movement_type: string;
};

const roles: AppRole[] = ["ADMIN", "ALMACEN", "ENLACE", "CALIDAD"];

const feedback: Record<string, string> = {
  "perfil-actualizado": "Perfil actualizado.",
  "perfil-invalido": "Perfil invalido.",
  "usuario-invalido": "Completa nombre, email, password y rol.",
  "no-se-pudo-crear": "No se pudo crear el usuario.",
  "no-se-pudo-actualizar-perfil": "No se pudo actualizar el perfil.",
  "usuario-creado": "Usuario creado."
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireRole(["ADMIN"]);

  const supabase = createClient();
  const thirtyDaysAgo = daysAgo(29);
  const [{ data, error }, { count: clientsCount = 0 }, { count: materialsCount = 0 }, { count: ordersCount = 0 }, { data: materials = [] }, { data: movements = [] }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .returns<AdminProfile[]>(),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("id", { count: "exact", head: true }),
    supabase.from("production_orders").select("id", { count: "exact", head: true }),
    supabase.from("materials").select("quality_status, clients(name)").returns<MaterialMetric[]>(),
    supabase
      .from("inventory_movements")
      .select("created_at, movement_type")
      .gte("created_at", `${thirtyDaysAgo}T00:00:00`)
      .returns<MovementMetric[]>()
  ]);

  const profiles = data ?? [];

  const counts = roles.map((role) => ({
    role,
    count: profiles.filter((profile) => profile.role === role).length
  }));

  const message = searchParams?.error ?? searchParams?.message;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-emerald-700">Administracion</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Usuarios y permisos</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Alta controlada de personal y separacion de responsabilidades por rol.</p>
      </header>

      {message ? (
        <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {feedback[message] ?? message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudieron leer perfiles. Revisa que la migracion y RLS esten aplicadas.
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <Metric icon={Users} label="Usuarios" value={profiles.length.toString()} />
        {counts.map(({ role, count }) => (
          <Metric icon={ShieldCheck} key={role} label={role} value={count.toString()} />
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Users} label="Total clientes" value={(clientsCount ?? 0).toString()} />
        <Metric icon={ShieldCheck} label="Total materiales" value={(materialsCount ?? 0).toString()} />
        <Metric icon={ShieldCheck} label="Total OP" value={(ordersCount ?? 0).toString()} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Material por cliente">
          <Bars bars={[{ key: "value", label: "Materiales", color: "#2563eb" }]} data={topCounts(materials ?? [], (row) => row.clients?.name ?? "Sin cliente", 10)} xKey="name" />
        </ChartCard>
        <ChartCard title="Estado de calidad">
          <PieDonut data={topCounts(materials ?? [], (row) => row.quality_status, 3)} nameKey="name" valueKey="value" />
        </ChartCard>
        <ChartCard title="Movimientos por dia">
          <Lines
            data={lastDays(30).map((day) => {
              const dayRows = (movements ?? []).filter((row) => row.created_at.slice(0, 10) === day);
              return {
                dia: day.slice(5),
                entradas: dayRows.filter((row) => row.movement_type === "INBOUND").length,
                asignaciones: dayRows.filter((row) => row.movement_type === "ALLOCATED").length,
                calidad: dayRows.filter((row) => row.movement_type.startsWith("QUALITY_")).length
              };
            })}
            lines={[
              { key: "entradas", label: "Entradas", color: "#16a34a" },
              { key: "asignaciones", label: "Asignaciones", color: "#f97316" },
              { key: "calidad", label: "Calidad", color: "#2563eb" }
            ]}
            xKey="dia"
          />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form action={createUser} className="grid content-start gap-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <UserPlus aria-hidden className="h-5 w-5 text-slate-700" />
            <h2 className="text-lg font-semibold">Alta de usuario</h2>
          </div>
          <Field label="Nombre completo" name="full_name" />
          <Field label="Email" name="email" type="email" />
          <Field label="Password temporal" name="password" type="password" />
          <RoleSelect />
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" type="submit">
            Crear usuario
          </button>
        </form>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold">Usuarios y roles</h2>
            <p className="mt-1 text-sm text-slate-600">ADMIN puede corregir nombre y rol. Email viene de Auth.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 font-medium">Actualizar</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <ProfileRow key={profile.id} profile={profile} />
                ))}
                {profiles.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Sin usuarios para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
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

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <Icon aria-hidden className="h-5 w-5 text-slate-500" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function ProfileRow({ profile }: { profile: AdminProfile }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <form action={updateProfile} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
          <input name="id" type="hidden" value={profile.id} />
          <input
            className="min-w-44 rounded-md border border-slate-300 px-2 py-1"
            name="full_name"
            required
            defaultValue={profile.full_name}
          />
          <select className="rounded-md border border-slate-300 px-2 py-1" name="role" defaultValue={profile.role}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 font-medium hover:border-slate-500" type="submit">
            <Save aria-hidden className="h-4 w-4" />
            <span className="sr-only">Guardar</span>
          </button>
        </form>
      </td>
      <td className="px-4 py-3 text-slate-700">{profile.email || "-"}</td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{profile.role}</span>
      </td>
      <td className="px-4 py-3 text-slate-500">{new Date(profile.created_at).toLocaleDateString("es-MX")}</td>
      <td className="px-4 py-3 text-slate-500">Nombre y rol</td>
    </tr>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-600"
        minLength={type === "password" ? 6 : undefined}
        name={name}
        required
        type={type}
      />
    </label>
  );
}

function RoleSelect() {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      Rol
      <select className="rounded-md border border-slate-300 px-3 py-2" name="role" required>
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
  );
}
