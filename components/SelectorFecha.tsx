"use client";

import { useFecha } from "@/app/(app)/fecha-context";

export default function SelectorFecha() {
  const { fecha, setFecha } = useFecha();
  return (
    <div>
      <label
        htmlFor="selectorFecha"
        className="mb-2 block text-sm font-medium text-slate-600"
      >
        Fecha
      </label>
      <input
        id="selectorFecha"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}
