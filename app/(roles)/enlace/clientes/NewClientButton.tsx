"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserPlus, X } from "lucide-react";
import { createExternalClient } from "../actions";

const rfcPattern = /^([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})$/;

export function NewClientButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rfc, setRfc] = useState("");
  const [busy, setBusy] = useState(false);
  const validRfc = useMemo(() => !rfc || rfcPattern.test(rfc), [rfc]);

  return (
    <>
      <motion.button
        className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
        whileHover={{ scale: 1.03 }}
      >
        <UserPlus aria-hidden className="h-4 w-4" />
        Nuevo Cliente
      </motion.button>
      <dialog className="w-full max-w-2xl rounded-lg border border-slate-200 p-0 shadow-xl backdrop:bg-slate-950/40" onClick={(event) => event.target === dialogRef.current && dialogRef.current?.close()} ref={dialogRef}>
        <form action={createExternalClient} className="grid gap-4 p-5" onSubmit={() => setBusy(true)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Nuevo cliente externo</h2>
              <p className="mt-1 text-sm text-slate-600">Disponible para entradas de almacen y OP.</p>
            </div>
            <button aria-label="Cerrar modal" className="rounded-md border border-slate-300 p-2" onClick={() => dialogRef.current?.close()} type="button">
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Razon Social" name="name" />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              RFC
              <input
                aria-label="RFC"
                className="rounded-md border border-slate-300 px-3 py-2 uppercase"
                maxLength={13}
                name="tax_id"
                onChange={(event) => setRfc(event.target.value.toUpperCase())}
                required
                value={rfc}
              />
              <span className={validRfc ? "text-xs text-green-700" : "text-xs text-red-700"}>
                {validRfc ? "Formato correcto" : "Formato invalido, ej: ABC123456XYZ"}
              </span>
            </label>
            <Field label="Telefono de contacto" name="contact_phone" required={false} />
            <Field label="Correo de contacto" name="contact_email" required={false} type="email" />
            <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
              Direccion
              <textarea aria-label="Direccion" className="min-h-24 rounded-md border border-slate-300 px-3 py-2" name="address" required />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium" onClick={() => dialogRef.current?.close()} type="button">
              Cancelar
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={!validRfc || !rfc || busy} type="submit">
              {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <UserPlus aria-hidden className="h-4 w-4" />}
              Guardar
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
      <input aria-label={label} className="rounded-md border border-slate-300 px-3 py-2" name={name} required={required} type={type} />
    </label>
  );
}
