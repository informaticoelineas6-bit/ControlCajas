import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { COLECCIONES, Vehiculo } from "@/lib/constants";
import { isEnabled, usuarioCookie } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { db } = await connectToDatabase();
    const vehiculos = db.collection<Vehiculo>(COLECCIONES.VEHICULO);
    const listaVehiculos = (await vehiculos.find({}).toArray()).filter(
      isEnabled,
    );
    return NextResponse.json(
      listaVehiculos.map((veh): Vehiculo => {
        return {
          categoria: veh.categoria,
          chapa: veh.chapa,
          marca: veh.chapa,
          modelo: veh.modelo,
        };
      }),
    );
  } catch (error) {
    console.error("Error fetching vehiculos:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 },
    );
  }
}
