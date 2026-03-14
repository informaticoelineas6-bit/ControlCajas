import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Almacen,
  CentroDistribucion,
  COLECCIONES,
  Expedicion,
  Recogida,
  Traspaso,
  Vehiculo,
} from "@/lib/constants";
import { userRole } from "../utils";

export async function GET(request: NextRequest) {
  try {
      const useRole = userRole(request);
      if (useRole === null)
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // Expedicion|Entrega|Devolucion|Recogida
    const fecha = new Date().toISOString().split("T")[0];

    if (!tipo) {
      return NextResponse.json(
        { error: "El tipo es requerido" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();

    let eventos;
    let almacenes: Almacen[] = [];
    let centros: CentroDistribucion[] = [];
    let vehiculos: Vehiculo[] = [];
    switch (tipo) {
      case "Expedicion":
        centros = (await db
          .collection(COLECCIONES.CENTRO_DISTRIBUCION)
          .find({})
          .toArray()) as CentroDistribucion[];
        almacenes = (await db
          .collection(COLECCIONES.ALMACEN)
          .find({})
          .toArray()) as Almacen[];
        return NextResponse.json({ centros, almacenes });
      case "Traspaso":
        eventos = (await db
          .collection(COLECCIONES.EXPEDICION)
          .find({ fecha })
          .toArray()) as Expedicion[];
        if (eventos.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado expediciones" },
            { status: 400 },
          );
        }
        for (const element of eventos) {
          if (almacenes.every((el: Almacen) => el.nombre !== element.almacen)) {
            almacenes.push(
              (await db
                .collection(COLECCIONES.ALMACEN)
                .findOne({ nombre: element.almacen })) as Almacen,
            );
          }
          if (
            centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            )
          ) {
            centros.push(
              (await db.collection(COLECCIONES.CENTRO_DISTRIBUCION).findOne({
                nombre: element.centro_distribucion,
              })) as CentroDistribucion,
            );
          }
        }
        vehiculos = (await db
          .collection(COLECCIONES.VEHICULO)
          .find({})
          .toArray()) as Vehiculo[];
        return NextResponse.json({ almacenes, centros, vehiculos });
      case "Entrega":
        eventos = (await db
          .collection(COLECCIONES.TRASPASO)
          .find({ fecha })
          .toArray()) as Traspaso[];
        if (eventos.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado traspasos" },
            { status: 400 },
          );
        }
        for (const element of eventos) {
          if (
            centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            )
          ) {
            centros.push(
              (await db.collection(COLECCIONES.CENTRO_DISTRIBUCION).findOne({
                nombre: element.centro_distribucion,
              })) as CentroDistribucion,
            );
          }
          if (vehiculos.every((el: Vehiculo) => el.chapa !== element.chapa)) {
            vehiculos.push(
              (await db
                .collection(COLECCIONES.VEHICULO)
                .findOne({ chapa: element.chapa })) as Vehiculo,
            );
          }
        }
        return NextResponse.json({ vehiculos, centros });
      case "Recogida":
        centros = (await db
          .collection(COLECCIONES.CENTRO_DISTRIBUCION)
          .find({})
          .toArray()) as CentroDistribucion[];
        vehiculos = (await db
          .collection(COLECCIONES.VEHICULO)
          .find({})
          .toArray()) as Vehiculo[];
        return NextResponse.json({ centros, vehiculos });
      case "Devolucion":
        eventos = (await db
          .collection(COLECCIONES.RECOGIDA)
          .find({ fecha })
          .toArray()) as Recogida[];
        if (eventos.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado recogidas" },
            { status: 400 },
          );
        }
        for (const element of eventos) {
          if (
            centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            )
          ) {
            centros.push(
              (await db.collection(COLECCIONES.CENTRO_DISTRIBUCION).findOne({
                nombre: element.centro_distribucion,
              })) as CentroDistribucion,
            );
          }
        }
        almacenes = (await db
          .collection(COLECCIONES.ALMACEN)
          .find({})
          .toArray()) as Almacen[];
        return NextResponse.json({ centros, almacenes });
      default:
        return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error listing events:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 },
    );
  }
}
