import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Almacen,
  CentroDistribucion,
  COLECCIONES,
  Entrega,
  EVENTOS_ARRAY,
  Expedicion,
  Provincia,
  Recogida,
  TIPOS_EVENTO,
  Traspaso,
  Vehiculo,
} from "@/lib/constants";
import {
  AjusteStr,
  applyAjuste,
  DeudaAct,
  deudaActiva,
  hasCajas,
  isEnabled,
  usuarioCookie,
} from "@/lib/utils";

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

    const listaEntregas = (
      await db
        .collection<Entrega>(COLECCIONES.ENTREGA)
        .find({ fecha })
        .toArray()
    )
      .map(applyAjuste)
      .filter(hasCajas) as AjusteStr<Entrega>[];

    const resultado: EventoFormData = {
      almacenes: [],
      centros: [],
      vehiculos: [],
      provincias: [],
    };
    switch (tipo) {
      case "Expedicion": {
        const [centrosRaw, almacenesRaw, provinciasRaw] = await Promise.all([
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Almacen>(COLECCIONES.ALMACEN)
            .find()
            .toArray() as Promise<Almacen[]>,
          db
            .collection<Provincia>(COLECCIONES.PROVINCIA)
            .find()
            .toArray() as Promise<Provincia[]>,
        ]);
        resultado.centros = centrosRaw
          .filter((element) => isEnabled(element))
          .map((centro) => deudaActiva(centro, listaEntregas));
        resultado.almacenes = almacenesRaw.filter((element) =>
          isEnabled(element),
        );
        resultado.provincias = provinciasRaw;
        return NextResponse.json(resultado);
      }
      case "Traspaso": {
        const [
          eventosRaw,
          centrosRaw,
          almacenesRaw,
          vehiculosRaw,
          provinciasRaw,
        ] = await Promise.all([
          db
            .collection<Expedicion>(COLECCIONES.EXPEDICION)
            .find({ fecha })
            .toArray() as Promise<Expedicion[]>,
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Almacen>(COLECCIONES.ALMACEN)
            .find()
            .toArray() as Promise<Almacen[]>,
          db
            .collection<Vehiculo>(COLECCIONES.VEHICULO)
            .find()
            .toArray() as Promise<Vehiculo[]>,
          db
            .collection<Provincia>(COLECCIONES.PROVINCIA)
            .find()
            .toArray() as Promise<Provincia[]>,
        ]);
        if (eventosRaw.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado expediciones" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw) {
          if (
            resultado.almacenes.every(
              (el: Almacen) => el.nombre !== element.almacen,
            ) &&
            almacenesRaw.some((item) => item.nombre === element.almacen)
          ) {
            resultado.almacenes.push(
              almacenesRaw.find(
                (item) => item.nombre === element.almacen,
              ) as Almacen,
            );
          }
          if (
            resultado.centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            ) &&
            centrosRaw.some(
              (item) => item.nombre === element.centro_distribucion,
            )
          ) {
            resultado.centros.push(
              deudaActiva(
                centrosRaw.find(
                  (item) => item.nombre === element.centro_distribucion,
                ) as CentroDistribucion,
                listaEntregas,
              ),
            );
          }
          if (
            element.provincia &&
            resultado.provincias.every(
              (el: Provincia) =>
                element.provincia && el.nombre !== element.provincia,
            )
          ) {
            resultado.provincias.push(
              provinciasRaw.find(
                (item) => item.nombre === element.provincia,
              ) as Provincia,
            );
          }
        }
        resultado.vehiculos = vehiculosRaw.filter((element) =>
          isEnabled(element),
        );
        return NextResponse.json(resultado);
      }
      case "Entrega": {
        const [eventosRaw, centrosRaw, vehiculosRaw, provinciasRaw] =
          await Promise.all([
            db
              .collection<Traspaso>(COLECCIONES.TRASPASO)
              .find({ fecha })
              .toArray() as Promise<Traspaso[]>,
            db
              .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
              .find()
              .toArray() as Promise<CentroDistribucion[]>,
            db
              .collection<Vehiculo>(COLECCIONES.VEHICULO)
              .find({})
              .toArray() as Promise<Vehiculo[]>,
            db
              .collection<Provincia>(COLECCIONES.PROVINCIA)
              .find()
              .toArray() as Promise<Provincia[]>,
          ]);
        if (eventosRaw.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado traspasos" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw) {
          if (
            resultado.centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            ) &&
            centrosRaw.some(
              (item) => item.nombre === element.centro_distribucion,
            )
          ) {
            resultado.centros.push(
              deudaActiva(
                centrosRaw.find(
                  (item) => item.nombre === element.centro_distribucion,
                ) as CentroDistribucion,
                listaEntregas,
              ),
            );
          }
          if (
            resultado.vehiculos.every(
              (el: Vehiculo) => el.chapa !== element.chapa,
            ) &&
            vehiculosRaw.some((item) => item.chapa === element.chapa)
          ) {
            resultado.vehiculos.push(
              vehiculosRaw.find(
                (item) => item.chapa === element.chapa,
              ) as Vehiculo,
            );
          }
          if (
            element.provincia &&
            resultado.provincias.every(
              (el: Provincia) =>
                element.provincia && el.nombre !== element.provincia,
            )
          ) {
            resultado.provincias.push(
              provinciasRaw.find(
                (item) => item.nombre === element.provincia,
              ) as Provincia,
            );
          }
        }
        return NextResponse.json(resultado);
      }
      case "Recogida": {
        const [centrosRaw, vehiculosRaw] = await Promise.all([
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Vehiculo>(COLECCIONES.VEHICULO)
            .find({})
            .toArray() as Promise<Vehiculo[]>,
        ]);
        resultado.centros = centrosRaw
          .filter((element) => isEnabled(element))
          .map((centro) => deudaActiva(centro, listaEntregas));
        resultado.vehiculos = vehiculosRaw.filter((element) =>
          isEnabled(element),
        );
        return NextResponse.json(resultado);
      }
      case "Devolucion": {
        const [eventosRaw, centrosRaw, almacenesRaw] = await Promise.all([
          db
            .collection<Recogida>(COLECCIONES.RECOGIDA)
            .find({ fecha })
            .toArray() as Promise<Recogida[]>,
          db
            .collection<CentroDistribucion>(COLECCIONES.CENTRO_DISTRIBUCION)
            .find()
            .toArray() as Promise<CentroDistribucion[]>,
          db
            .collection<Almacen>(COLECCIONES.ALMACEN)
            .find()
            .toArray() as Promise<Almacen[]>,
        ]);
        if (eventosRaw.length === 0) {
          return NextResponse.json(
            { error: "No se han registrado recogidas" },
            { status: 400 },
          );
        }
        for (const element of eventosRaw) {
          if (
            resultado.centros.every(
              (el: CentroDistribucion) =>
                el.nombre !== element.centro_distribucion,
            ) &&
            centrosRaw.some(
              (item) => item.nombre === element.centro_distribucion,
            )
          ) {
            resultado.centros.push(
              deudaActiva(
                centrosRaw.find(
                  (item) => item.nombre === element.centro_distribucion,
                ) as CentroDistribucion,
                listaEntregas,
              ),
            );
          }
        }
        resultado.almacenes = almacenesRaw.filter((element) =>
          isEnabled(element),
        );
        return NextResponse.json(resultado);
      }
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
  centros: DeudaAct<CentroDistribucion>[];
  vehiculos: Vehiculo[];
  provincias: Provincia[];
}
