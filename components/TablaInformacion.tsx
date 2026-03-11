"use client";

import { useEffect, useState } from "react";
import { Cajas } from "@/lib/constants";

export interface ItemDashboard {
  dashboardData: {
    nombre: string;
    deuda: Cajas;
    rotacion: number;
    fechaRot: string;
    estadoRot?: "pendiente" | "retrasada" | "en_tiempo" | "cumplida";
  }[];
  eventosHoy: number;
  stockTotal: number;
  deudaTotal: number;
}

export default function TablaInformacion() {
  const [data, setData] = useState<ItemDashboard>({
    dashboardData: [],
    eventosHoy: 0,
    stockTotal: 0,
    deudaTotal: 0,
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

  const totalCajas = (cajas: Cajas) => {
    return (cajas.blancas ?? 0) + (cajas.negras ?? 0) + (cajas.verdes ?? 0);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Información general
        </h2>
        <p className="text-gray-600">
          Vista de solo lectura con totales de cajas para centros y almacenes.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Centros de distribución
              </h3>
              <span className="text-sm text-gray-600">
                Total stock: {data.stockTotal} - Total deuda: {data.deudaTotal}{" "}
                - Eventos hoy: {data.eventosHoy}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Nombre</th>
                    <th className="border p-2 text-left">
                      Deuda total de cajas
                    </th>
                    <th className="border p-2 text-left">Rotación (días)</th>
                    <th className="border p-2 text-left">
                      Fecha de última devolución
                    </th>
                    <th className="border p-2 text-left">Estado de rotación</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dashboardData.map((centro) => (
                    <tr key={centro.nombre} className="hover:bg-gray-100">
                      <td className="border p-2">{centro.nombre}</td>
                      <td className="border p-2">{totalCajas(centro.deuda)}</td>
                      <td className="border p-2">{centro.rotacion ?? 0}</td>
                      <td className="border p-2">{centro.fechaRot || "-"}</td>
                      <td className="border p-2">
                        {centro.estadoRot ?? "Desconocido"}
                      </td>
                    </tr>
                  ))}
                  {data.dashboardData.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border p-4 text-center text-gray-500"
                      >
                        No hay centros registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/*<div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Almacenes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Nombre</th>
                    <th className="border p-2 text-left">
                      Stock total de cajas
                    </th>
                    <th className="border p-2 text-left">Último ajuste</th>
                  </tr>
                </thead>
                <tbody>
                  {almacenes.map((almacen) => (
                    <tr key={almacen._id} className="hover:bg-gray-100">
                      <td className="border p-2">{almacen.nombre}</td>
                      <td className="border p-2">
                        {totalCajas(almacen.stock)}
                      </td>
                      <td className="border p-2">{almacen.ajuste || "-"}</td>
                    </tr>
                  ))}
                  {almacenes.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="border p-4 text-center text-gray-500"
                      >
                        No hay almacenes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>*/}
        </>
      )}
    </div>
  );
}
