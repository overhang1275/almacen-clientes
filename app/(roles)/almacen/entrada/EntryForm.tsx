"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, PackageCheck, Ruler } from "lucide-react";
import { createMaterialEntry } from "../actions";

type Option = {
  id: string;
  name: string;
  tax_id?: string | null;
};

export function EntryForm({ categories, clients }: { categories: Option[]; clients: Option[] }) {
  const [type, setType] = useState<"BOBINA" | "PLIEGO">("BOBINA");
  const [bobina, setBobina] = useState({
    core_diameter_cm: "",
    diameter_cm: "",
    grammage_gsm: "",
    thickness_microns: "",
    weight_kg: "",
    width_cm: ""
  });
  const calculatedLength = calculateLinearMeters(bobina);
  const canSubmit = Boolean(clients.length && categories.length && (type === "PLIEGO" || calculatedLength));

  return (
    <form action={createMaterialEntry} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <PackageCheck aria-hidden className="h-5 w-5 text-emerald-700" />
        <h2 className="font-semibold">Datos de recepcion</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Cliente" name="client_id" options={clients.map((c) => ({ ...c, name: c.tax_id ? `${c.name} - ${c.tax_id}` : c.name }))} />
        <Select label="Categoria" name="category_id" options={categories} />
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Familia
          <select
            className="rounded-md border border-slate-300 px-3 py-2"
            name="material_type"
            onChange={(event) => setType(event.target.value as "BOBINA" | "PLIEGO")}
            value={type}
          >
            <option value="BOBINA">BOBINA</option>
            <option value="PLIEGO">PLIEGO</option>
          </select>
        </label>
        <Field label="Ubicacion fisica" name="location_rack" placeholder="Rack A-3, Estante 2" />
        <Field label="Lote" name="batch_number" required={false} />
        <Field label="Gramaje (g/m2)" name="grammage_gsm" onValueChange={(value) => setBobina((current) => ({ ...current, grammage_gsm: value }))} required={false} type="number" />
        <Field label="Espesor/calibre (micras)" name="thickness_microns" onValueChange={(value) => setBobina((current) => ({ ...current, thickness_microns: value }))} required={false} type="number" />
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        key={type}
        transition={{ duration: 0.18 }}
      >
        <div className="md:col-span-2 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Ruler aria-hidden className="h-5 w-5 text-indigo-700" />
          <h3 className="font-semibold">Medidas fisicas</h3>
        </div>
        {type === "BOBINA" ? (
          <>
            <Field label="Ancho (cm)" name="width_cm" onValueChange={(value) => setBobina((current) => ({ ...current, width_cm: value }))} type="number" />
            <Field label="Diametro externo (cm)" name="diameter_cm" onValueChange={(value) => setBobina((current) => ({ ...current, diameter_cm: value }))} type="number" />
            <Field label="Diametro nucleo (cm)" name="core_diameter_cm" onValueChange={(value) => setBobina((current) => ({ ...current, core_diameter_cm: value }))} type="number" />
            <Field label="Peso real (kg)" name="weight_kg" onValueChange={(value) => setBobina((current) => ({ ...current, weight_kg: value }))} type="number" />
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Metros lineales calculados: <strong>{calculatedLength ? `${calculatedLength.toLocaleString("es-MX")} m.l.` : "captura gramaje o espesor para calcular"}</strong>
            </p>
          </>
        ) : (
          <>
            <Field label="Largo (cm)" name="length_cm" type="number" />
            <Field label="Ancho (cm)" name="width_cm" type="number" />
            <Field label="Cantidad recibida: piezas (pza.)" name="pieces_qty" type="number" />
          </>
        )}
      </motion.div>

      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <ClipboardList aria-hidden className="h-5 w-5 text-amber-700" />
        <h3 className="font-semibold">Notas de almacen</h3>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Observaciones
        <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2" name="note" />
      </label>

      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Estado inicial: PENDIENTE</p>

      <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={!canSubmit} type="submit">
        Guardar entrada
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  onValueChange,
  required = true,
  type = "text"
}: {
  label: string;
  name: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="rounded-md border border-slate-300 px-3 py-2"
        min={type === "number" ? "0.001" : undefined}
        name={name}
        onChange={(event) => onValueChange?.(event.target.value)}
        placeholder={placeholder}
        required={required}
        step={type === "number" ? "0.001" : undefined}
        type={type}
      />
    </label>
  );
}

function calculateLinearMeters(values: {
  core_diameter_cm: string;
  diameter_cm: string;
  grammage_gsm: string;
  thickness_microns: string;
  weight_kg: string;
  width_cm: string;
}) {
  const width = Number(values.width_cm);
  const weight = Number(values.weight_kg);
  const grammage = Number(values.grammage_gsm);
  const thickness = Number(values.thickness_microns);
  const diameter = Number(values.diameter_cm);
  const core = Number(values.core_diameter_cm);

  if (width > 0 && weight > 0 && grammage > 0) {
    return roundMeters((weight * 100000) / (grammage * width));
  }

  if (diameter > 0 && core > 0 && thickness > 0 && diameter > core) {
    const externalMm = diameter * 10;
    const coreMm = core * 10;
    return roundMeters((Math.PI * (externalMm ** 2 - coreMm ** 2)) / (4 * thickness * 1000));
  }

  return null;
}

function roundMeters(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) / 1000 : null;
}

function Select({ label, name, options }: { label: string; name: string; options: Option[] }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <select className="rounded-md border border-slate-300 px-3 py-2" name={name} required>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
