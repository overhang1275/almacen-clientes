"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { assignMaterial } from "../../actions";
import { unitLabel } from "../../../units";

type Material = {
  id: string;
  batch_number: string | null;
  current_stock: number;
  location_rack: string;
  material_type: string;
  stock_unit: string;
  material_categories: { name: string } | null;
};

export function AssignForm({ materials, orderId }: { materials: Material[]; orderId: string }) {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => materials.find((material) => material.id === materialId), [materialId, materials]);
  const requested = Number(quantity);
  const tooMuch = selected ? requested > selected.current_stock : false;

  return (
    <form action={assignMaterial} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={() => setBusy(true)}>
      <input name="production_order_id" type="hidden" value={orderId} />
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Material aprobado
        <select className="rounded-md border border-slate-300 px-3 py-2" name="material_id" onChange={(event) => setMaterialId(event.target.value)} required value={materialId}>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.material_categories?.name ?? "-"} / {material.batch_number ?? "-"} / {material.current_stock} {unitLabel(material.stock_unit)}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">Stock disponible</p>
          <p className="mt-1 text-3xl font-semibold text-green-900">{selected.current_stock} {unitLabel(selected.stock_unit)}</p>
          <p className="mt-1 text-sm text-green-800">{selected.location_rack}</p>
        </div>
      ) : null}
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Cantidad a asignar
        <input className="rounded-md border border-slate-300 px-3 py-2" min="0.001" name="quantity" onChange={(event) => setQuantity(event.target.value)} required step="0.001" type="number" value={quantity} />
      </label>
      {tooMuch ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">No puedes asignar mas de {selected?.current_stock} {unitLabel(selected?.stock_unit)}.</p> : null}
      <motion.button
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={!selected || tooMuch || busy}
        type="submit"
        whileHover={{ scale: 1.02 }}
      >
        {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <ArrowRight aria-hidden className="h-4 w-4" />}
        {busy ? "Asignando..." : "Asignar"}
      </motion.button>
    </form>
  );
}
