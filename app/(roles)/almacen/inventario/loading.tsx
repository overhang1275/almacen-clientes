"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8">
      <div className="h-20 rounded-lg bg-slate-200" />
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <motion.div
            animate={{ opacity: [0.45, 1, 0.45] }}
            className="h-10 rounded-md bg-slate-200"
            key={index}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        ))}
      </div>
    </main>
  );
}
