"use client";

import { useState, useEffect } from "react";

interface ItemRecogidaDevolucion {
  centro_distribucion: string;
  chapa: string;
  recogida: any;
  devolucion: any;
  alerta: boolean;
  rotura: boolean;
}

export default function TablaDevolucionRecogida() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [datos, setDatos] = useState<ItemRecogidaDevolucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatos();
  }, [fecha]);

  const fetchDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/comparar?fecha=${fecha}&tipo=devolucion_recogida`,
      );
      const data = await response.json();
      if (response.ok) {
        setDatos(data);
      } else {
        setError(data.error || "Error al cargar datos");
      }
    } catch {
      setError("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Recogida - Devolución
      </h2>

      <div className="mb-4">
        <label
          htmlFor="fechaDevolucionRecogida"
          className="block text-gray-700 font-semibold mb-2"
        >
          Fecha
        </label>
        <input
          id="fechaDevolucionRecogida"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th colSpan={2} className="border p-2 text-left">
                  Centro de Distribución
                </th>
                <th colSpan={5} className="border p-2 text-center bg-blue-50">
                  Recogida
                </th>
                <th colSpan={5} className="border p-2 text-center bg-orange-50">
                  Devolución
                </th>
              </tr>
              <tr className="bg-gray-100 text-xs">
                <th className="border p-1">CD</th>
                <th className="border p-1">Chapa</th>
                <th className="border p-1">Chofer</th>
                <th className="border p-1">Ajuste</th>
                <th className="border p-1">Blancas</th>
                <th className="border p-1">Negras</th>
                <th className="border p-1">Verdes</th>
                <th className="border p-1">Jefe Almacén</th>
                <th className="border p-1">Ajuste</th>
                <th className="border p-1">Blancas</th>
                <th className="border p-1">Negras</th>
                <th className="border p-1">Verdes</th>
                {/* <th className="border p-1">B</th>
                <th className="border p-1">N</th>
                <th className="border p-1">V</th>
                <th className="border p-1">B</th>
                <th className="border p-1">N</th>
                <th className="border p-1">V</th> */}
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="border p-4 text-center text-gray-500"
                  >
                    No hay datos para esta fecha
                  </td>
                </tr>
              ) : (
                datos.map((item) => (
                  <tr
                    key={item.centro_distribucion}
                    className={
                      item.alerta
                        ? "bg-red-100 hover:bg-red-200"
                        : item.rotura
                          ? "bg-yellow-100 hover:bg-yellow-200"
                          : "hover:bg-gray-100"
                    }
                  >
                    <td className="border p-2 font-semibold text-sm">
                      {item.centro_distribucion}
                    </td>
                    <td className="border p-2 text-center">
                      {item.chapa ?? "-"}
                    </td>
                    {/* Rec. Cajas */}
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.nombre ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.ajuste || "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.cajas?.blancas ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.cajas?.negras ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.cajas?.verdes ?? "-"}
                    </td>
                    {/* Dev. Cajas */}
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.nombre ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.ajuste || "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.cajas?.blancas ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.cajas?.negras ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.cajas?.verdes ?? "-"}
                    </td>
                    {/* Dev. Cajas Rotas
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.cajas_rotas?.blancas ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.cajas_rotas?.negras ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.devolucion?.cajas_rotas?.verdes ?? "-"}
                    </td>
                    {/* Rec. Cajas Rotas
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.cajas_rotas?.blancas ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.cajas_rotas?.negras ?? "-"}
                    </td>
                    <td className="border p-1 text-center text-xs">
                      {item.recogida?.cajas_rotas?.verdes ?? "-"}
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
