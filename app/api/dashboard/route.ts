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
    const almacenesData = (await almacenes.find().toArray()) as Almacen[];
    const expedicionesData = (await expediciones
      .find({ fecha: today })
      .toArray()) as Expedicion[];
    const entregasData = (await entregas.find({}).toArray()).sort(
      (a: Entrega, b: Entrega) => b.fecha.localeCompare(a.fecha),
    ) as Entrega[];
    const recogidasData = (await recogidas
      .find({ fecha: today })
      .toArray()) as Recogida[];
    const devolucionesData = (await devoluciones
      .find({ fecha: today })
      .toArray()) as Devolucion[];

    const dashboardData = [];

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
