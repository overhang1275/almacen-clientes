"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { unitLabel } from "../../units";

type Movement = {
  id: string;
  movement_type: string;
  quantity: number;
  stock_unit: string;
  note: string | null;
  created_at: string;
};

type Allocation = {
  id: string;
  quantity: number;
  stock_unit: string;
  created_at: string;
  production_orders: { op_number: string; description: string } | { op_number: string; description: string }[] | null;
};

export function InventoryDrawer({
  allocations,
  movements,
  title
}: {
  allocations: Allocation[];
  movements: Movement[];
  title: string;
}) {
  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className="fixed inset-y-0 right-0 z-20 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl"
      initial={{ opacity: 0, x: 48 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase text-slate-500">Detalle</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
        </div>
        <Link className="rounded-md border border-slate-300 px-3 py-1 text-sm" href="/almacen/inventario">
          Cerrar
        </Link>
      </div>

      <section className="mt-6">
        <h3 className="font-semibold">Movimientos</h3>
        <div className="mt-3 grid gap-3">
          {movements.map((movement) => (
            <article className="rounded-md border border-slate-200 p-3 text-sm" key={movement.id}>
              <div className="flex justify-between gap-3">
                <span className="font-medium">{movement.movement_type}</span>
                <span className="text-slate-500">{new Date(movement.created_at).toLocaleString("es-MX")}</span>
              </div>
              <p className="mt-1 text-slate-700">
                {movement.quantity} {unitLabel(movement.stock_unit)}
              </p>
              {movement.note ? <p className="mt-1 text-slate-500">{movement.note}</p> : null}
            </article>
          ))}
          {!movements.length ? <p className="text-sm text-slate-500">Sin movimientos.</p> : null}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-semibold">Asignaciones</h3>
        <div className="mt-3 grid gap-3">
          {allocations.map((allocation) => (
            <AllocationCard allocation={allocation} key={allocation.id} />
          ))}
          {!allocations.length ? <p className="text-sm text-slate-500">Sin asignaciones.</p> : null}
        </div>
      </section>
    </motion.aside>
  );
}

function AllocationCard({ allocation }: { allocation: Allocation }) {
  const order = Array.isArray(allocation.production_orders) ? allocation.production_orders[0] : allocation.production_orders;

  return (
    <article className="rounded-md border border-slate-200 p-3 text-sm">
      <div className="flex justify-between gap-3">
        <span className="font-medium">{order?.op_number ?? "OP"}</span>
        <span className="text-slate-500">{new Date(allocation.created_at).toLocaleDateString("es-MX")}</span>
      </div>
      <p className="mt-1 text-slate-700">
        {allocation.quantity} {unitLabel(allocation.stock_unit)}
      </p>
      <p className="mt-1 text-slate-500">{order?.description}</p>
    </article>
  );
}
