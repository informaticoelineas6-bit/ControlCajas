"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/app/api/dashboard/route";
import { totalCajas } from "@/lib/utils";

interface MetricCardProps {
  eyebrow: string;
  value: string | number;
  detail: string;
  accent: string;
}

interface ColorBarItem {
  key: keyof DashboardData["deudaTotal"];
  label: string;
  barClass: string;
}

function MetricCard({
  eyebrow,
  value,
  detail,
  accent,
}: Readonly<MetricCardProps>) {
  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className={`mb-4 h-1.5 w-16 rounded-full ${accent}`} />
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

const colorBarConfig: ColorBarItem[] = [
  {
    key: "blancas",
    label: "Caja blanca",
    barClass: "bg-amber-400",
  },
  {
    key: "negras",
    label: "Caja negra",
    barClass: "bg-slate-800",
  },
  {
    key: "verdes",
    label: "Caja verde",
    barClass: "bg-emerald-500",
  },
];

export default function TablaInformacion() {
  const [data, setData] = useState<DashboardData>({
    dashboardData: [],
    movementToday: 0,
    enviosHoy: 0,
    recogidasHoy: 0,
    rotasHoy: 0,
    stockTotal: { blancas: 0, negras: 0, verdes: 0 },
    deudaTotal: { blancas: 0, negras: 0, verdes: 0 },
    roturaTotal: 0,
    roturaActual: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const resDashboard = await fetch("/api/dashboard");
      const dataDashboard = await resDashboard.json();

      if (!resDashboard.ok) {
        setError(dataDashboard.error || "Error al cargar centros");
        return;
      }

      setData(dataDashboard as DashboardData);
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const totalCentros = data.dashboardData.length;
  const centrosConRetraso = data.dashboardData
    .filter((centro) => centro.estadoRot === "Retrasada")
    .map((centro) => centro.nombre);
  const hasCentrosConRetraso = centrosConRetraso.length > 0;
  const topDebtCenter = [...data.dashboardData].sort(
    (a, b) => totalCajas(b.deuda) - totalCajas(a.deuda),
  )[0];
  const deudaMaxima = topDebtCenter ? totalCajas(topDebtCenter.deuda) : 0;

  const estadoStyles: Record<string, string> = {
    Cumplida:
      "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    Pendiente: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
    Retrasada: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
    "En tiempo": "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200",
  };

  const rowTone = (estado: string) => {
    switch (estado) {
      case "Cumplida":
        return "from-emerald-50 to-white";
      case "Pendiente":
        return "from-amber-50 to-white";
      case "Retrasada":
        return "from-rose-50 to-white";
      default:
        return "from-sky-50 to-white";
    }
  };

  const deudaWidth = (cantidad: number) =>
    deudaMaxima > 0 ? `${Math.max((cantidad / deudaMaxima) * 100, 8)}%` : "0%";

  const buildColorBars = (values: DashboardData["deudaTotal"]) => {
    const maxValue = Math.max(...Object.values(values), 0);
    return colorBarConfig.map((config) => {
      const amount = values[config.key] ?? 0;
      const width = maxValue > 0 ? `${(amount / maxValue) * 100}%` : "0%";

      return {
        ...config,
        amount,
        width,
      };
    });
  };

  const deudaColorBars = buildColorBars(data.deudaTotal);
  const stockColorBars = buildColorBars(data.stockTotal);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] p-7 shadow-[0_30px_70px_-42px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500">
              Centro operativo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Panorama de centros y rotación de cajas
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Seguimiento visual de deuda, stock y estado de rotación con foco
              en los centros que requieren atención.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
              {totalCentros} CDs monitoreados
            </div>
            <div className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
              {centrosConRetraso.length} con retraso
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[28px] bg-white/70 shadow-sm"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              eyebrow="Deuda total CDs"
              value={totalCajas(data.deudaTotal)}
              detail="Cajas pendientes por retornar"
              accent="bg-amber-500"
            />
            <MetricCard
              eyebrow="Stock global"
              value={totalCajas(data.stockTotal)}
              detail="Cajas disponibles en almacenes"
              accent="bg-blue-500"
            />
            <MetricCard
              eyebrow="Envíos del día"
              value={data.enviosHoy}
              detail="Total de cajas entregadas en el día"
              accent="bg-emerald-500"
            />
            <MetricCard
              eyebrow="Recogidas del día"
              value={data.recogidasHoy}
              detail="Total de cajas recogidas en el día"
              accent="bg-indigo-500"
            />
            <MetricCard
              eyebrow="Roturas del día"
              value={data.rotasHoy}
              detail="Roturas detectadas en el día"
              accent="bg-rose-500"
            />
            <MetricCard
              eyebrow="Roturas"
              value={data.roturaActual}
              detail="Total de roturas en almacenes"
              accent="bg-red-500"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[28px] border border-amber-200/80 bg-[linear-gradient(135deg,_rgba(255,247,237,0.95),_rgba(255,255,255,0.92))] p-6 shadow-[0_18px_40px_-30px_rgba(245,158,11,0.6)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
                Mayor deuda
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                {topDebtCenter?.nombre ?? "Sin datos"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {topDebtCenter
                  ? `${totalCajas(topDebtCenter.deuda)} cajas pendientes de retorno`
                  : "No hay centros registrados para calcular deuda."}
              </p>
            </article>

            <article
              className={`rounded-[28px] border p-6 ${
                hasCentrosConRetraso
                  ? "border-rose-200/80 bg-[linear-gradient(135deg,_rgba(255,241,242,0.95),_rgba(255,255,255,0.92))] shadow-[0_18px_40px_-30px_rgba(244,63,94,0.6)]"
                  : "border-emerald-200/80 bg-[linear-gradient(135deg,_rgba(236,253,245,0.95),_rgba(255,255,255,0.92))] shadow-[0_18px_40px_-30px_rgba(16,185,129,0.6)]"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.32em] ${
                  hasCentrosConRetraso ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                Alertas de rotación
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                {hasCentrosConRetraso
                  ? "Centros retrasados"
                  : "No hay centros con retraso"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {hasCentrosConRetraso
                  ? centrosConRetraso.join(", ")
                  : "Todos los centros están en tiempo o cumplidos."}
              </p>
            </article>

            <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                Deuda por color
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Deuda total por tipo de caja
              </h3>
              <div className="mt-5 space-y-4">
                {deudaColorBars.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">
                        {item.label}
                      </p>
                      <span className="text-sm font-semibold text-slate-600">
                        {item.amount} cajas
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.barClass}`}
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                Stock por color
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                Stock total por tipo de caja
              </h3>
              <div className="mt-5 space-y-4">
                {stockColorBars.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">
                        {item.label}
                      </p>
                      <span className="text-sm font-semibold text-slate-600">
                        {item.amount} cajas
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${item.barClass}`}
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {/* <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                    Mapa operativo
                  </p> */}
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Análisis de centros
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                {totalCentros} centros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">
                      Centro de Distribución
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">Deuda</th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Deuda activa
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Roturas
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Rotación
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Fecha de deuda
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.dashboardData.map((centro) => {
                    const deuda = totalCajas(centro.deuda);
                    return (
                      <tr
                        key={centro.nombre}
                        className={`bg-gradient-to-r ${rowTone(
                          centro.estadoRot ?? "",
                        )} border-t border-slate-100 transition hover:from-slate-50 hover:to-white`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {centro.nombre}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600"
                                style={{ width: deudaWidth(deuda) }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">
                              {deuda}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {totalCajas(centro.deuda_activa)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {centro.roturasTotal ?? 0}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {centro.rotacion ?? 0} días
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {centro.fechaRot || "Sin fecha"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              estadoStyles[centro.estadoRot ?? ""] ??
                              "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                            }`}
                          >
                            {centro.estadoRot ?? "Desconocido"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {data.dashboardData.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No hay centros registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
