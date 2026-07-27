import { signOut } from "@/app/login/actions";
import { getSessionProfile } from "@/lib/auth";
import { LogOut } from "lucide-react";
import { BackButton } from "./BackButton";
import { RoleNav } from "./RoleNav";

export default async function RolesLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  const dashboardHref = profile?.role ? `/${profile.role.toLowerCase()}` : "/login";

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">ComputerForms</p>
              <p className="text-lg font-semibold text-slate-950">Almacen de clientes</p>
            </div>
            <form action={signOut}>
              <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:border-slate-500" type="submit">
                <LogOut aria-hidden className="h-4 w-4" />
                Salir
              </button>
            </form>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <RoleNav role={profile?.role} />
            <BackButton fallbackHref={dashboardHref} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
