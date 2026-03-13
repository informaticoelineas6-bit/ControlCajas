"use client";

import { useEffect, useState } from "react";
import {
  Cajas,
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
} from "@/lib/constants";

export interface ItemDashboard {
  dashboardData: {
    nombre: string;
    deuda: Cajas;
    rotacion: number;
    fechaRot: string;
    estadoRot?: "Pendiente" | "Retrasada" | "En tiempo" | "Cumplida";
  }[];
  movementToday: {
    expediciones: Expedicion[];
    entregas: Entrega[];
    recogidas: Recogida[];
    devoluciones: Devolucion[];
  };
  stockTotal: number;
  deudaTotal: number;
  roturaTotal: number;
}

export interface Movement {
  nombre: string;
  centro_distribucion: string;
  totalCajas: number;
  totalRoturas: number;
}

interface MetricCardProps {
  eyebrow: string;
  value: string | number;
  detail: string;
  accent: string;
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

export default function TablaInformacion() {
  const [data, setData] = useState<ItemDashboard>({
    dashboardData: [],
    movementToday: {
      expediciones: [],
      entregas: [],
      recogidas: [],
      devoluciones: [],
    },
    stockTotal: 0,
    deudaTotal: 0,
    roturaTotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [movementData, setMovementData] = useState<Movement[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const movement = [
      ...data.movementToday.expediciones.map((el) => {
        return {
          nombre: el.nombre,
          centro_distribucion: el.centro_distribucion,
          totalCajas: totalCajas(el.cajas),
          totalRoturas: 0,
        };
      }),
      ...data.movementToday.entregas.map((el) => {
        return {
          nombre: el.nombre,
          centro_distribucion: el.centro_distribucion,
          totalCajas: totalCajas(el.cajas),
          totalRoturas: 0,
        };
      }),
      ...data.movementToday.recogidas.map((el) => {
        return {
          nombre: el.nombre,
          centro_distribucion: el.centro_distribucion,
          totalCajas: totalCajas(el.cajas),
          totalRoturas: totalRoturas(el),
        };
      }),
      ...data.movementToday.devoluciones.map((el) => {
        return {
          nombre: el.nombre,
          centro_distribucion: el.centro_distribucion,
          totalCajas: totalCajas(el.cajas),
          totalRoturas: totalRoturas(el),
        };
      }),
    ];
    setMovementData(movement);
  }, [data.movementToday]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const resCentros = await fetch("/api/dashboard");
      const dataCentros = await resCentros.json();

      if (!resCentros.ok) {
        setError(dataCentros.error || "Error al cargar centros");
        return;
      }

      setData(dataCentros as ItemDashboard);
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  const totalCajas = (cajas: Cajas) =>
    (cajas?.blancas ?? 0) + (cajas?.negras ?? 0) + (cajas?.verdes ?? 0);

  const totalCentros = data.dashboardData.length;
  const averageRotacion =
    totalCentros > 0
      ? Math.round(
          data.dashboardData.reduce(
            (acc, centro) => acc + (centro.rotacion ?? 0),
            0,
          ) / totalCentros,
        )
      : 0;
  const centrosConRetraso = data.dashboardData.filter(
    (centro) => centro.estadoRot === "Retrasada",
  ).length;
  const centrosCumplidos = data.dashboardData.filter(
    (centro) => centro.estadoRot === "Cumplida",
  ).length;
  const topDebtCenter = [...data.dashboardData].sort(
    (a, b) => totalCajas(b.deuda) - totalCajas(a.deuda),
  )[0];
  const topRotationCenter = [...data.dashboardData].sort(
    (a, b) => (b.rotacion ?? 0) - (a.rotacion ?? 0),
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

  const totalRoturas = (item: { cajas_rotas?: Cajas; tapas_rotas?: Cajas }) =>
    totalCajas(item.cajas_rotas ?? { blancas: 0, negras: 0, verdes: 0 }) +
    totalCajas(item.tapas_rotas ?? { blancas: 0, negras: 0, verdes: 0 });

  const enviosHoy = () => {
    let total = 0;
    data.movementToday.entregas.forEach((element) => {
      total += totalCajas(element.cajas);
    });
    return total;
  };

  const recogidasHoy = () => {
    let total = 0;
    data.movementToday.recogidas.forEach((element) => {
      total += totalCajas(element.cajas);
    });
    return total;
  };

  const rotasHoy = () => {
    let total = 0;
    data.movementToday.recogidas.forEach((element) => {
      total += totalRoturas(element);
    });
    return total;
  };

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
              {centrosConRetraso} con retraso
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[28px] bg-white/70 shadow-sm"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              eyebrow="Deuda total CDs"
              value={data.deudaTotal}
              detail="Cajas pendientes por retornar"
              accent="bg-amber-500"
            />
            <MetricCard
              eyebrow="Stock global"
              value={data.stockTotal}
              detail="Cajas disponibles en almacenes"
              accent="bg-blue-500"
            />
            <MetricCard
              eyebrow="Eventos del día"
              value={movementData.length}
              detail="Movimientos registrados en la jornada"
              accent="bg-cyan-500"
            />
            <MetricCard
              eyebrow="Rotación media"
              value={`${averageRotacion}d`}
              detail="Promedio de días configurado por centro"
              accent="bg-emerald-500"
            />
            <MetricCard
              eyebrow="Envíos del día"
              value={enviosHoy()}
              detail="Total de cajas entregadas en el día"
              accent="bg-emerald-500"
            />
            <MetricCard
              eyebrow="Recogidas del día"
              value={recogidasHoy()}
              detail="Total de cajas recogidas en el día"
              accent="bg-indigo-500"
            />
            <MetricCard
              eyebrow="Roturas del día"
              value={rotasHoy()}
              detail="Roturas detectadas en el día"
              accent="bg-rose-500"
            />
            <MetricCard
              eyebrow="Roturas totales"
              value={data.roturaTotal}
              detail="Roturas totales entre todos los centros"
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

            <article className="rounded-[28px] border border-emerald-200/80 bg-[linear-gradient(135deg,_rgba(236,253,245,0.95),_rgba(255,255,255,0.92))] p-6 shadow-[0_18px_40px_-30px_rgba(16,185,129,0.55)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">
                Mejor avance
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">
                {centrosCumplidos > 0
                  ? `${centrosCumplidos} centros al día`
                  : "Sin cierres completos"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {topRotationCenter
                  ? `${topRotationCenter.nombre} maneja una rotación objetivo de ${topRotationCenter.rotacion ?? 0} días`
                  : "No hay centros registrados para calcular rotación."}
              </p>
            </article>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
            <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                    Mapa operativo
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Deuda y rotación por centro
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
                      <th className="px-6 py-4 text-left font-semibold">Centro de Distribución</th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Deuda
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Rotación
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Última devolución
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
                          colSpan={5}
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

            <div className="space-y-5">
              <section className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Alertas de rotación
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-rose-50 px-4 py-4">
                    <p className="text-sm font-semibold text-rose-700">
                      Centros retrasados
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {centrosConRetraso}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-700">
                      Estado cumplido
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">
                      {centrosCumplidos}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Peso por centro
                </p>
                <div className="mt-5 space-y-4">
                  {data.dashboardData.slice(0, 5).map((centro) => {
                    const deuda = totalCajas(centro.deuda);
                    const percentage =
                      data.deudaTotal > 0
                        ? Math.round((deuda / data.deudaTotal) * 100)
                        : 0;
                    return (
                      <div key={centro.nombre}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-700">
                            {centro.nombre}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">
                            {deuda} cajas
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                            style={{ width: `${Math.max(percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {data.dashboardData.length === 0 && (
                    <p className="text-sm text-slate-500">
                      Sin datos para mostrar distribución.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>

          <section className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.4)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Movimientos del día
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  Eventos operativos registrados hoy
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                {movementData.length} movimientos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Centro de Distribución</th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Encargado
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Total cajas
                    </th>
                    <th className="px-6 py-4 text-left font-semibold">
                      Total roturas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movementData.map((movimiento, index) => (
                    <tr
                      key={`${movimiento.nombre}-${movimiento.centro_distribucion}-${index}`}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-slate-600">
                        {movimiento.centro_distribucion}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {movimiento.nombre}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {movimiento.totalCajas}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {movimiento.totalRoturas}
                      </td>
                    </tr>
                  ))}
                  {movementData.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No hay movimientos registrados para hoy
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
