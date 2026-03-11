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
    const centros = db.collection(COLECCIONES.CENTRO_DISTRIBUCION);
    const almacenes = db.collection(COLECCIONES.ALMACEN);
    const expediciones = db.collection(COLECCIONES.EXPEDICION);
    const entregas = db.collection(COLECCIONES.ENTREGA);
    const recogidas = db.collection(COLECCIONES.RECOGIDA);
    const devoluciones = db.collection(COLECCIONES.DEVOLUCION);

    let centrosData = (await centros.find().toArray()) as CentroDistribucion[];
    let almacenesData = (await almacenes.find().toArray()) as Almacen[];
    let expedicionesData = (await expediciones
      .find({ fecha: today })
      .toArray()) as Expedicion[];
    let entregasData = (await entregas.find({}).toArray()).sort(
      (a: Entrega, b: Entrega) => b.fecha.localeCompare(a.fecha),
    ) as Entrega[];
    let recogidasData = (await recogidas
      .find({ fecha: today })
      .toArray()) as Recogida[];
    let devolucionesData = (await devoluciones
      .find({ fecha: today })
      .toArray()) as Devolucion[];

    const dashboardData = [];

    for (let centro of centrosData) {
      let iteration = {
        nombre: centro.nombre,
        deuda: centro.deuda,
        rotacion: centro.rotacion,
        fechaRot: "Sin fecha",
      };
      const entregasFiltrado = entregasData.filter(
        (entrega) => entrega.centro_distribucion === centro.nombre,
      );
      let deuda = centro.deuda || { blancas: 0, negras: 0, verdes: 0 };

      for (let entrega of entregasFiltrado) {
        iteration.fechaRot = entrega.fecha;
        if (deuda.blancas > 0 || deuda.negras > 0 || deuda.verdes > 0) {
          deuda.blancas -= entrega.cajas.blancas;
          deuda.negras -= entrega.cajas.negras;
          deuda.verdes -= entrega.cajas.verdes;
        } else {
          break;
        }
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
