import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Almacen,
  Cajas,
  CentroDistribucion,
  COLECCIONES,
  Devolucion,
  Entrega,
  Expedicion,
  Recogida,
  Traspaso,
} from "@/lib/constants";
import {
  AjusteStr,
  applyAjuste,
  hasCajas,
  totalCajas,
  usuarioCookie,
} from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    const parseDate = (value: string) => {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };

    // Run all database queries in parallel
    const [
      centros,
      almacenes,
      expedicionesRaw,
      traspasosRaw,
      entregasRaw,
      recogidasRaw,
      devolucionesRaw,
    ] = await Promise.all([
      db
        .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
        .find()
        .toArray() as Promise<CentroDistribucion[]>,
      db.collection<Almacen>(COLECCIONES.ALMACEN).find().toArray() as Promise<
        Almacen[]
      >,
      db
        .collection<Expedicion>(COLECCIONES.EXPEDICION)
        .find({ fecha: today })
        .toArray() as Promise<Expedicion[]>,
      db.collection<Traspaso>(COLECCIONES.TRASPASO).find().toArray() as Promise<
        Traspaso[]
      >,
      db.collection<Entrega>(COLECCIONES.ENTREGA).find().toArray() as Promise<
        Entrega[]
      >,
      db
        .collection<Recogida>(COLECCIONES.RECOGIDA)
        .find({ fecha: today })
        .toArray() as Promise<Recogida[]>,
      db
        .collection<Devolucion>(COLECCIONES.DEVOLUCION)
        .find({ fecha: today })
        .toArray() as Promise<Devolucion[]>,
    ]);

    // Apply post-processing (map, filter, sort) to the raw results
    const expediciones = expedicionesRaw
      .map(applyAjuste)
      .filter(hasCajas) as AjusteStr<Expedicion>[];
    const traspasos = traspasosRaw
      .map(applyAjuste)
      .filter(hasCajas) as AjusteStr<Traspaso>[];
    const entregas = (entregasRaw.map(applyAjuste) as AjusteStr<Entrega>[])
      .filter(hasCajas)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const recogidas = recogidasRaw
      .map(applyAjuste)
      .filter(hasCajas) as AjusteStr<Recogida>[];
    const devoluciones = devolucionesRaw
      .map(applyAjuste)
      .filter(hasCajas) as AjusteStr<Devolucion>[];

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
      const entregasFiltrado = entregas.filter(
        (entrega) => entrega.centro_distribucion === centro.nombre,
      );

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

    const deudaTotal = centros.reduce(
      (acc: number, centro: CentroDistribucion) => {
        return acc + totalCajas(centro.deuda);
      },
      0,
    );

    const stockTotal = almacenes.reduce((acc: number, almacen: Almacen) => {
      return acc + totalCajas(almacen.stock);
    }, 0);

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
          totalCajas(devolucion.cajas_rotas) +
          totalCajas(devolucion.tapas_rotas)
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
  deudaTotal: number;
  stockTotal: number;
  roturaTotal: number;
  roturaActual: number;
}

export interface DashboardRow {
  nombre: string;
  deuda: Cajas;
  rotacion: number;
  fechaRot: string;
  estadoRot: "Pendiente" | "Retrasada" | "En tiempo" | "Cumplida";
  roturasTotal: number;
}
