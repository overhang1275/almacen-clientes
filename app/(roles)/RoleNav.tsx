"use client";

import Link from "next/link";
import { Boxes, ClipboardList, LayoutDashboard, Menu, PackagePlus, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth";

const nav = {
  ADMIN: [{ href: "/admin", label: "Admin", icon: Users }],
  ALMACEN: [
    { href: "/almacen", label: "Panel", icon: LayoutDashboard },
    { href: "/almacen/entrada", label: "Entrada", icon: PackagePlus },
    { href: "/almacen/inventario", label: "Inventario", icon: Boxes }
  ],
  ENLACE: [
    { href: "/enlace", label: "Enlace", icon: ClipboardList },
    { href: "/enlace/clientes", label: "Clientes", icon: Users },
    { href: "/enlace/ordenes", label: "Ordenes", icon: PackagePlus }
  ],
  CALIDAD: [
    { href: "/calidad", label: "Calidad", icon: ShieldCheck },
    { href: "/calidad/pendientes", label: "Pendientes", icon: ClipboardList }
  ]
} satisfies Record<AppRole, { href: string; label: string; icon: LucideIcon }[]>;

export function RoleNav({ role }: { role?: AppRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const items = role === "ADMIN" ? [...nav.ADMIN, ...nav.ALMACEN, ...nav.ENLACE, ...nav.CALIDAD] : role ? nav[role] : [];

  useEffect(() => {
    setOpen(window.localStorage.getItem("role-nav-open") !== "false");
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    window.localStorage.setItem("role-nav-open", String(next));
  }

  return (
    <div className="grid gap-2">
      <button className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium md:hidden" onClick={toggle} type="button">
        <Menu aria-hidden className="h-4 w-4" />
        Menu
      </button>
      <nav className={cn("gap-1 overflow-x-auto md:flex", open ? "flex" : "hidden")}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100",
                active && "bg-slate-950 text-white hover:bg-slate-950"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
