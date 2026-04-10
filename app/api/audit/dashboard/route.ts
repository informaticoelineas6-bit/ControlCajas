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
  deudaActiva,
  hasCajas,
  isEnabled,
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
    const today = new Date().toISOString().split("T")[0];
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
      db
        .from(TABLAS.CENTRO_DISTRIBUCION)
        .select<string, CentroDistribucion>("nombre, deuda, rotacion, roturas, ajuste"),
      db.from(TABLAS.ALMACEN).select<string, Almacen>("stock, roturas, ajuste"),
      db
        .from(TABLAS.EXPEDICION)
        .select<string, Expedicion>("fecha, cajas, ajuste")
        .eq("fecha", today),
      db
        .from(TABLAS.TRASPASO)
        .select<string, Traspaso>("fecha, cajas, ajuste")
        .eq("fecha", today),
      db
        .from(TABLAS.ENTREGA)
        .select<string, Entrega>("centro_distribucion, fecha, cajas, ajuste")
        .order("fecha", { ascending: false }),
      db
        .from(TABLAS.RECOGIDA)
        .select<string, Recogida>("fecha, cajas, roturas, ajuste")
        .eq("fecha", today),
      db
        .from(TABLAS.DEVOLUCION)
        .select<string, Devolucion>("fecha, cajas, roturas, ajuste")
        .eq("fecha", today),
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
    const centros = centrosRaw.data ? centrosRaw.data.filter(isEnabled) : [];
    const almacenes = almacenesRaw.data
      ? almacenesRaw.data.filter(isEnabled)
      : [];
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
    const entregasByCentro = new Map<string, AjusteStr<Entrega>[]>();

    for (const entrega of entregas) {
      const current = entregasByCentro.get(entrega.centro_distribucion);
      if (current) {
        current.push(entrega);
      } else {
        entregasByCentro.set(entrega.centro_distribucion, [entrega]);
      }
    }

    const dashboardData: DashboardRow[] = [];
    const movementToday: number =
      expediciones.filter((evento) => evento.fecha === today).length +
      traspasos.filter((evento) => evento.fecha === today).length +
      entregas.filter((evento) => evento.fecha === today).length +
      recogidas.filter((evento) => evento.fecha === today).length +
      devoluciones.filter((evento) => evento.fecha === today).length;

    for (const centro of centros) {
      const iteration: DashboardRow = {
        nombre: centro.nombre,
        deuda: centro.deuda,
        deuda_activa: {
          blancas: 0,
          negras: 0,
          verdes: 0,
        },
        rotacion: centro.rotacion,
        fechaRot: today,
        estadoRot: "En tiempo",
        roturasTotal:
          centro.roturas.cajas.blancas +
          centro.roturas.tapas.blancas +
          centro.roturas.cajas.negras +
          centro.roturas.tapas.negras +
          centro.roturas.cajas.verdes,
      };
      const entregasFiltrado = entregasByCentro.get(centro.nombre) ?? [];
      const { deuda_activa } = deudaActiva(centro, entregasFiltrado, {
        entregasFiltradas: true,
        entregasOrdenadas: true,
      });

      iteration.deuda_activa = deuda_activa;

      const deuda: Cajas = {
        blancas: centro.deuda.blancas,
        negras: centro.deuda.negras,
        verdes: centro.deuda.verdes,
      };
      for (const entrega of entregasFiltrado) {
        iteration.fechaRot = entrega.fecha;
        if (deuda.blancas >= 0 || deuda.negras >= 0 || deuda.verdes >= 0) {
          deuda.blancas -= entrega.cajas.blancas;
          deuda.negras -= entrega.cajas.negras;
          deuda.verdes -= entrega.cajas.verdes;
        } else {
          break;
        }
      }

      const cumplido =
        centro.deuda.blancas <= 0 &&
        centro.deuda.negras <= 0 &&
        centro.deuda.verdes <= 0;
      const fechaRotDate = parseDate(iteration.fechaRot);
      const todayDate = parseDate(today);
      const fechaLimite = new Date(fechaRotDate);
      fechaLimite.setUTCDate(fechaLimite.getUTCDate() + (centro.rotacion ?? 0));

      if (fechaLimite < todayDate) {
        iteration.estadoRot = "Retrasada";
      } else if (cumplido) {
        iteration.estadoRot = "Cumplida";
      } else if (fechaLimite > todayDate) {
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
