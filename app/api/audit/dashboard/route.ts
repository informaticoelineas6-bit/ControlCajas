import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import {
  Almacen,
  Cajas,
  CentroDistribucion,
  TABLAS,
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
  Traspaso,
} from "@/lib/constants";
import {
  AjusteStr,
  applyAjuste,
  DeudaAct,
  hasCajas,
  sumCajas,
  totalCajas,
} from "@/lib/utils";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const db = await connectToDatabase();
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const parseDate = (value: string) => {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };

    // Run all database queries in parallel
    const [
      centrosRaw,
      almacenesRaw,
      expedicionesRaw,
      traspasosRaw,
      entregasRaw,
      recogidasRaw,
      devolucionesRaw,
    ] = await Promise.all([
      db.rpc<string, DeudaAct<CentroDistribucion>>("all_centros_deuda_activa"),
      db
        .from(TABLAS.ALMACEN)
        .select<string, Almacen>("stock, roturas, ajuste")
        .or("ajuste->habilitado.neq.false, ajuste->habilitado.is.null"),
      db
        .from(TABLAS.EXPEDICION)
        .select<string, Expedicion>("fecha, cajas, ajuste")
        .eq("fecha", todayString),
      db
        .from(TABLAS.TRASPASO)
        .select<string, Traspaso>("fecha, cajas, ajuste")
        .eq("fecha", todayString),
      db
        .from(TABLAS.ENTREGA)
        .select<string, Entrega>("fecha, cajas, ajuste")
        .eq("fecha", todayString),
      db
        .from(TABLAS.RECOGIDA)
        .select<string, Recogida>("fecha, cajas, roturas, ajuste")
        .eq("fecha", todayString),
      db
        .from(TABLAS.DEVOLUCION)
        .select<string, Devolucion>("fecha, cajas, roturas, ajuste")
        .eq("fecha", todayString),
    ]);

    const error =
      centrosRaw.error ||
      almacenesRaw.error ||
      expedicionesRaw.error ||
      traspasosRaw.error ||
      entregasRaw.error ||
      recogidasRaw.error ||
      devolucionesRaw.error;

    if (error) throw new Error(error.message);

    // Apply post-processing (map, filter, sort) to the raw results
    const centros: DeudaAct<CentroDistribucion>[] = centrosRaw.data ?? [];
    const almacenes = almacenesRaw.data ?? [];
    const expediciones = expedicionesRaw.data
      ? (expedicionesRaw.data
          .map(applyAjuste)
          .filter(hasCajas) as AjusteStr<Expedicion>[])
      : [];
    const traspasos = traspasosRaw.data
      ? (traspasosRaw.data
          .map(applyAjuste)
          .filter(hasCajas) as AjusteStr<Traspaso>[])
      : [];
    const entregas = entregasRaw.data
      ? (entregasRaw.data
          .map(applyAjuste)
          .filter(hasCajas) as AjusteStr<Entrega>[])
      : [];
    const recogidas = recogidasRaw.data
      ? (recogidasRaw.data
          .map(applyAjuste)
          .filter(hasCajas) as AjusteStr<Recogida>[])
      : [];
    const devoluciones = devolucionesRaw.data
      ? (devolucionesRaw.data
          .map(applyAjuste)
          .filter(hasCajas) as AjusteStr<Devolucion>[])
      : [];

    const dashboardData: DashboardRow[] = [];
    const movementToday: number =
      expediciones.length +
      traspasos.length +
      entregas.length +
      recogidas.length +
      devoluciones.length;

    for (const centro of centros) {
      const iteration: DashboardRow = {
        nombre: centro.nombre,
        deuda: centro.deuda,
        deuda_activa: centro.deuda_activa,
        rotacion: centro.rotacion,
        fechaRot: centro.fecha_liquidacion,
        estadoRot: "En tiempo",
        roturasTotal:
          centro.roturas.cajas.blancas +
          centro.roturas.tapas.blancas +
          centro.roturas.cajas.negras +
          centro.roturas.tapas.negras +
          centro.roturas.cajas.verdes,
      };

      const fechaRotDate = parseDate(iteration.fechaRot);
      const fechaLimite = new Date(fechaRotDate);
      fechaLimite.setUTCDate(fechaLimite.getUTCDate() + (centro.rotacion ?? 0));

      if (fechaLimite < today) {
        iteration.estadoRot = "Retrasada";
      } else if (totalCajas(centro.deuda_activa) <= 0) {
        iteration.estadoRot = "Cumplida";
      } else if (fechaLimite > today) {
        iteration.estadoRot = "Pendiente";
      } else {
        iteration.estadoRot = "En tiempo";
      }

      dashboardData.push(iteration);
    }

    const deudaTotal: Cajas = centros.reduce(
      (acc: Cajas, centro: CentroDistribucion) => {
        return sumCajas(acc, centro.deuda) as Cajas;
      },
      { blancas: 0, negras: 0, verdes: 0 },
    );

    const stockTotal: Cajas = almacenes.reduce(
      (acc: Cajas, almacen: Almacen) => {
        return sumCajas(acc, almacen.stock) as Cajas;
      },
      { blancas: 0, negras: 0, verdes: 0 },
    );

    const roturaTotal = centros.reduce(
      (acc: number, centro: CentroDistribucion) => {
        return (
          acc +
          totalCajas(centro.roturas.cajas) +
          totalCajas(centro.roturas.tapas)
        );
      },
      0,
    );

    const roturaActual = almacenes.reduce((acc: number, almacen: Almacen) => {
      return (
        acc +
        totalCajas(almacen.roturas.cajas) +
        totalCajas(almacen.roturas.tapas)
      );
    }, 0);

    const enviosHoy = expediciones.reduce(
      (acc: number, expedicion: AjusteStr<Expedicion>) => {
        return acc + totalCajas(expedicion.cajas);
      },
      0,
    );

    const recogidasHoy = devoluciones.reduce(
      (acc: number, devolucion: AjusteStr<Devolucion>) => {
        return acc + totalCajas(devolucion.cajas);
      },
      0,
    );

    const rotasHoy = devoluciones.reduce(
      (acc: number, devolucion: AjusteStr<Devolucion>) => {
        return (
          acc +
          totalCajas(devolucion.roturas.cajas) +
          totalCajas(devolucion.roturas.tapas)
        );
      },
      0,
    );

    return NextResponse.json({
      dashboardData,
      movementToday,
      enviosHoy,
      recogidasHoy,
      rotasHoy,
      deudaTotal,
      stockTotal,
      roturaTotal,
      roturaActual,
    } as DashboardData);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos" },
      { status: 500 },
    );
  }
}

export interface DashboardData {
  dashboardData: DashboardRow[];
  movementToday: number;
  enviosHoy: number;
  recogidasHoy: number;
  rotasHoy: number;
  deudaTotal: Cajas;
  stockTotal: Cajas;
  roturaTotal: number;
  roturaActual: number;
}

export interface DashboardRow {
  nombre: string;
  deuda: Cajas;
  deuda_activa: Cajas;
  rotacion: number;
  fechaRot: string;
  estadoRot: "Pendiente" | "Retrasada" | "En tiempo" | "Cumplida";
  roturasTotal: number;
}
