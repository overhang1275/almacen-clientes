"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

export function Toast({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setOpen(false), 4000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!open) return null;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-5 right-5 z-20 flex max-w-sm items-center gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <CheckCircle2 aria-hidden className="h-4 w-4" />
      <span>{children}</span>
      <button aria-label="Cerrar mensaje" className="rounded-md p-1 text-green-900 hover:bg-green-100" onClick={() => setOpen(false)} type="button">
        <X aria-hidden className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
