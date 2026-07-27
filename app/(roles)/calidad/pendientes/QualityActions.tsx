"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { approveMaterial, rejectMaterial } from "../actions";

export function QualityActions({ materialId }: { materialId: string }) {
  const [hidden, setHidden] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (rejectOpen) textareaRef.current?.focus();
  }, [rejectOpen]);

  if (hidden) return <span className="text-sm text-slate-500">Procesado</span>;

  return (
    <div className="flex items-center gap-2">
      <form action={approveMaterial} onSubmit={() => { setBusy("approve"); setHidden(true); }}>
        <input name="material_id" type="hidden" value={materialId} />
        <motion.button
          aria-label="Aprobar material"
          className="inline-flex items-center gap-2 rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={!!busy}
          title="Aprobar material"
          type="submit"
          whileHover={{ scale: 1.03 }}
        >
          {busy === "approve" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden className="h-4 w-4" />}
          Aprobar
        </motion.button>
      </form>

      <motion.button
        aria-label="Rechazar material"
        className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={!!busy}
        onClick={() => setRejectOpen(true)}
        title="Rechazar material"
        type="button"
        whileHover={{ scale: 1.03 }}
      >
        <XCircle aria-hidden className="h-4 w-4" />
        Rechazar
      </motion.button>

      {rejectOpen ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/40 px-4" onClick={() => setRejectOpen(false)}>
          <motion.form
            action={rejectMaterial}
            animate={{ opacity: 1, scale: 1 }}
            aria-labelledby={`reject-title-${materialId}`}
            aria-modal="true"
            className="grid w-full max-w-md gap-4 rounded-lg bg-white p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.97 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={() => { setBusy("reject"); setHidden(true); }}
            role="dialog"
          >
            <input name="material_id" type="hidden" value={materialId} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950" id={`reject-title-${materialId}`}>Motivo de rechazo</h2>
                <p className="mt-1 text-sm text-slate-600">El material quedara inmovilizado para Enlace.</p>
              </div>
              <button aria-label="Cerrar modal" className="rounded-md border border-slate-300 p-2" onClick={() => setRejectOpen(false)} type="button">
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Observaciones
              <textarea
                className="min-h-28 rounded-md border border-slate-300 px-3 py-2"
                maxLength={300}
                name="note"
                onChange={(event) => setNote(event.target.value)}
                placeholder="Especificar motivo del rechazo: defectos, medidas incorrectas, etc."
                ref={textareaRef}
                required
                value={note}
              />
              <span className="text-right text-xs text-slate-500">{note.length}/300</span>
            </label>
            <div className="flex justify-end gap-2">
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium" onClick={() => setRejectOpen(false)} type="button">
                Cancelar
              </button>
              <button className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white" disabled={busy === "reject"} type="submit">
                {busy === "reject" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <XCircle aria-hidden className="h-4 w-4" />}
                Confirmar rechazo
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </div>
  );
}
