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
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    function applyAjuste<T extends Record<string, any>>(item: T): T {
      if (!item?.ajuste) {
        return item;
      }

      return {
        ...item,
        cajas: item.cajas
          ? {
              blancas:
                (item.cajas?.blancas ?? 0) + (item.ajuste.cajas?.blancas ?? 0),
              negras:
                (item.cajas?.negras ?? 0) + (item.ajuste.cajas?.negras ?? 0),
              verdes:
                (item.cajas?.verdes ?? 0) + (item.ajuste.cajas?.verdes ?? 0),
            }
          : item.cajas,
        cajas_rotas: item.cajas_rotas
          ? {
              blancas:
                (item.cajas_rotas?.blancas ?? 0) +
                (item.ajuste.cajas_rotas?.blancas ?? 0),
              negras:
                (item.cajas_rotas?.negras ?? 0) +
                (item.ajuste.cajas_rotas?.negras ?? 0),
              verdes:
                (item.cajas_rotas?.verdes ?? 0) +
                (item.ajuste.cajas_rotas?.verdes ?? 0),
            }
          : item.cajas_rotas,
        tapas_rotas: item.tapas_rotas
          ? {
              blancas:
                (item.tapas_rotas?.blancas ?? 0) +
                (item.ajuste.tapas_rotas?.blancas ?? 0),
              negras:
                (item.tapas_rotas?.negras ?? 0) +
                (item.ajuste.tapas_rotas?.negras ?? 0),
              verdes:
                (item.tapas_rotas?.verdes ?? 0) +
                (item.ajuste.tapas_rotas?.verdes ?? 0),
            }
          : item.tapas_rotas,
      };
    }

    const { db } = await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    const parseDate = (value: string) => {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };
    const centros = db.collection(COLECCIONES.CENTRO_DISTRIBUCION);
    const almacenes = db.collection(COLECCIONES.ALMACEN);
    const expediciones = db.collection(COLECCIONES.EXPEDICION);
    const entregas = db.collection(COLECCIONES.ENTREGA);
    const recogidas = db.collection(COLECCIONES.RECOGIDA);
    const devoluciones = db.collection(COLECCIONES.DEVOLUCION);

    const centrosData = (await centros
      .find()
      .toArray()) as CentroDistribucion[];
    const almacenesData = ((await almacenes.find().toArray()) as Almacen[]).map(
      applyAjuste,
    );
    const expedicionesData = (
      (await expediciones.find({ fecha: today }).toArray()) as Expedicion[]
    ).map(applyAjuste);
    const entregasData = ((await entregas.find({}).toArray()) as Entrega[])
      .map(applyAjuste)
      .sort((a: Entrega, b: Entrega) => b.fecha.localeCompare(a.fecha));
    const recogidasData = (
      (await recogidas.find({ fecha: today }).toArray()) as Recogida[]
    ).map(applyAjuste);
    const devolucionesData = (
      (await devoluciones.find({ fecha: today }).toArray()) as Devolucion[]
    ).map(applyAjuste);

    const dashboardData = [];
    const movementData = [
      ...expedicionesData.filter((evento: Expedicion) => evento.fecha === today),
      ...entregasData.filter((evento: Entrega) => evento.fecha === today),
      ...recogidasData.filter((evento: Recogida) => evento.fecha === today),
      ...devolucionesData.filter((evento: Devolucion) => evento.fecha === today),
    ];

    for (const centro of centrosData) {
      let iteration = {
        nombre: centro.nombre,
        deuda: centro.deuda,
        rotacion: centro.rotacion,
        fechaRot: "Sin fecha",
        estadoRot: "En tiempo" as
          | "Pendiente"
          | "Retrasada"
          | "En tiempo"
          | "Cumplida",
      };
      const entregasFiltrado = entregasData.filter(
        (entrega) => entrega.centro_distribucion === centro.nombre,
      );

      let deuda = {
        blancas: centro.deuda.blancas,
        negras: centro.deuda.negras,
        verdes: centro.deuda.verdes,
      };
      for (const entrega of entregasFiltrado) {
        iteration.fechaRot = entrega.fecha;
        if (deuda.blancas >= 0 && deuda.negras >= 0 && deuda.verdes >= 0) {
          deuda.blancas -= entrega.cajas.blancas;
          deuda.negras -= entrega.cajas.negras;
          deuda.verdes -= entrega.cajas.verdes;
        } else {
          break;
        }
        console.log(centro.deuda);
      }

      if (
        centro.deuda.blancas + centro.deuda.negras + centro.deuda.verdes <=
        0
      ) {
        iteration.estadoRot = "Cumplida";
      } else if (iteration.fechaRot != "Sin fecha") {
        const fechaRotDate = parseDate(iteration.fechaRot);
        const todayDate = parseDate(today);
        const fechaLimite = new Date(fechaRotDate);
        fechaLimite.setUTCDate(
          fechaLimite.getUTCDate() + (centro.rotacion ?? 0),
        );

        if (fechaLimite > todayDate) {
          iteration.estadoRot = "Pendiente";
        } else if (fechaLimite < todayDate) {
          iteration.estadoRot = "Retrasada";
        } else {
          iteration.estadoRot = "En tiempo";
        }
      } else {
        iteration.estadoRot = "En tiempo";
      }

      dashboardData.push(iteration);
    }

    const eventosHoy =
      expedicionesData.filter((evento: Expedicion) => evento.fecha === today)
        .length +
      entregasData.filter((evento: Entrega) => evento.fecha === today).length +
      recogidasData.filter((evento: Recogida) => evento.fecha === today)
        .length +
      devolucionesData.filter((evento: Devolucion) => evento.fecha === today)
        .length;

    const deudaTotal = centrosData.reduce(
      (acc: number, centro: CentroDistribucion) => {
        const deuda: Cajas = centro.deuda || {
          blancas: 0,
          negras: 0,
          verdes: 0,
        };
        return (
          acc + (deuda.blancas ?? 0) + (deuda.negras ?? 0) + (deuda.verdes ?? 0)
        );
      },
      0,
    );

    const stockTotal = almacenesData.reduce((acc: number, almacen: Almacen) => {
      const stock: Cajas = almacen.stock || {
        blancas: 0,
        negras: 0,
        verdes: 0,
      };
      return (
        acc + (stock.blancas ?? 0) + (stock.negras ?? 0) + (stock.verdes ?? 0)
      );
    }, 0);

    return NextResponse.json({
      dashboardData,
      movementData,
      eventosHoy,
      deudaTotal,
      stockTotal,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos" },
      { status: 500 },
    );
  }
}
