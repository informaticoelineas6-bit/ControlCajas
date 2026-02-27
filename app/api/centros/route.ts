import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const centros = db.collection("CentroDistribucion");
    const listaCentros = await centros.find({}).toArray();
    return NextResponse.json(listaCentros);
  } catch (error) {
    console.error("Error fetching centros:", error);
    return NextResponse.json(
      { error: "Error al obtener centros" },
      { status: 500 },
    );
  }
}
