"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { createOrder } from "../actions";

type ClientOption = {
  id: string;
  name: string;
};

export function NewOrderButton({ clients }: { clients: ClientOption[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <motion.button
        className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
        whileHover={{ scale: 1.03 }}
      >
        <Plus aria-hidden className="h-4 w-4" />
        Nueva OP
      </motion.button>
      <dialog className="w-full max-w-lg rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40" onClick={(event) => event.target === dialogRef.current && dialogRef.current?.close()} ref={dialogRef}>
        <form action={createOrder} className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
            <h2 className="text-lg font-semibold">Nueva orden de produccion</h2>
            <p className="mt-1 text-sm text-slate-600">La OP inicia como PENDING.</p>
            </div>
            <button aria-label="Cerrar modal" className="rounded-md border border-slate-300 p-2" onClick={() => dialogRef.current?.close()} type="button">
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Cliente
            <select className="rounded-md border border-slate-300 px-3 py-2" name="client_id" required>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <Field label="Numero OP" name="op_number" />
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Descripcion
            <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" name="description" required />
          </label>
          <Field label="Fecha de entrega" name="due_date" required={false} type="date" />
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium" onClick={() => dialogRef.current?.close()} type="button">
              Cancelar
            </button>
            <button className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" disabled={!clients.length} type="submit">
              Crear OP
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function Field({ label, name, required = true, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input className="rounded-md border border-slate-300 px-3 py-2" name={name} required={required} type={type} />
    </label>
  );
}
