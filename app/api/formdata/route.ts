import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Almacen,
  CentroDistribucion,
  COLECCIONES,
  EVENTOS_ARRAY,
  Expedicion,
  Recogida,
  TIPOS_EVENTO,
  Traspaso,
  Vehiculo,
} from "@/lib/constants";
import { isEnabled, usuarioCookie } from "../../../lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo"); // Expedicion|Entrega|Devolucion|Recogida
    const fecha = new Date().toISOString().split("T")[0];

    if (!tipo || !EVENTOS_ARRAY.includes(tipo as TIPOS_EVENTO)) {
      return NextResponse.json(
        { error: "El tipo es requerido" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();

    let eventos;
    const resultado: EventoFormData = {
      almacenes: [],
      centros: [],
      vehiculos: [],
    };
    switch (tipo) {
      case "Expedicion":
        resultado.centros = (
          await db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find({})
            .toArray()
        ).filter(isEnabled) as CentroDistribucion[];
        resultado.almacenes = (
          await db.collection<Almacen>(COLECCIONES.ALMACEN).find({}).toArray()
        ).filter(isEnabled) as Almacen[];
        return NextResponse.json(resultado);
      case "Traspaso":
        eventos = (await db
          .collection<Expedicion>(COLECCIONES.EXPEDICION)
          .find({ fecha })
          .toArray()) as Expedicion[];
        if (eventos.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado expediciones" },
            { status: 400 },
          );
        }
        for (const element of eventos) {
          if (
            resultado.almacenes.every(
              (el: Almacen) => el.nombre !== element.almacen,
            )
          ) {
            resultado.almacenes.push(
              (await db
                .collection<Almacen>(COLECCIONES.ALMACEN)
                .findOne({ nombre: element.almacen })) as Almacen,
            );
          }
          if (
            resultado.centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            )
          ) {
            resultado.centros.push(
              (await db
                .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
                .findOne({
                  nombre: element.centro_distribucion,
                })) as CentroDistribucion,
            );
          }
        }
        resultado.vehiculos = (
          await db.collection<Vehiculo>(COLECCIONES.VEHICULO).find({}).toArray()
        ).filter(isEnabled) as Vehiculo[];
        return NextResponse.json(resultado);
      case "Entrega":
        eventos = (await db
          .collection<Traspaso>(COLECCIONES.TRASPASO)
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
            resultado.centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            )
          ) {
            resultado.centros.push(
              (await db
                .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
                .findOne({
                  nombre: element.centro_distribucion,
                })) as CentroDistribucion,
            );
          }
          if (
            resultado.vehiculos.every(
              (el: Vehiculo) => el.chapa !== element.chapa,
            )
          ) {
            resultado.vehiculos.push(
              (await db
                .collection<Vehiculo>(COLECCIONES.VEHICULO)
                .findOne({ chapa: element.chapa })) as Vehiculo,
            );
          }
        }
        return NextResponse.json(resultado);
      case "Recogida":
        resultado.centros = (
          await db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find({})
            .toArray()
        ).filter(isEnabled) as CentroDistribucion[];
        resultado.vehiculos = (
          await db.collection<Vehiculo>(COLECCIONES.VEHICULO).find({}).toArray()
        ).filter(isEnabled) as Vehiculo[];
        return NextResponse.json(resultado);
      case "Devolucion":
        eventos = (await db
          .collection<Recogida>(COLECCIONES.RECOGIDA)
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
            resultado.centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            )
          ) {
            resultado.centros.push(
              (await db
                .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
                .findOne({
                  nombre: element.centro_distribucion,
                })) as CentroDistribucion,
            );
          }
        }
        resultado.almacenes = (
          await db.collection<Almacen>(COLECCIONES.ALMACEN).find({}).toArray()
        ).filter(isEnabled) as Almacen[];
        return NextResponse.json(resultado);
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

export interface EventoFormData {
  almacenes: Almacen[];
  centros: CentroDistribucion[];
  vehiculos: Vehiculo[];
}
