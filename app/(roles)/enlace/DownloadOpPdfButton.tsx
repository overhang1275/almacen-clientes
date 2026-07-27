"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function DownloadOpPdfButton({ orderId, opNumber, compact = false }: { orderId: string; opNumber: string; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    setBusy(true);
    setMessage("Generando documento...");
    const response = await fetch(`/api/enlace/ordenes/${orderId}/pdf`);
    if (!response.ok) {
      setMessage("No se pudo generar el PDF.");
      setBusy(false);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OP-${opNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("PDF descargado.");
    setBusy(false);
  }

  return (
    <span className="inline-grid gap-1">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:border-slate-500 disabled:opacity-60"
        disabled={busy}
        onClick={download}
        type="button"
      >
        {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Download aria-hidden className="h-4 w-4" />}
        {compact ? "PDF" : busy ? "Generando..." : "Descargar OP"}
      </button>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </span>
  );
}
