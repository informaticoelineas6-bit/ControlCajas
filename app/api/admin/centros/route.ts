import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server";
import { CentroDistribucion, TABLAS } from "@/lib/constants";
import { usuarioCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico" && usuario.rol !== "auditor")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const db = (await connectToDatabase()).from(TABLAS.CENTRO_DISTRIBUCION);

    const { data, error } = await db.select("*");

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching centros:", error);
    return NextResponse.json(
      { error: "Error al obtener centros" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const body: CentroDistribucion = await request.json();

    body.nombre = body.nombre.trim();

    const db = await connectToDatabase();

    const centros = db.from(TABLAS.CENTRO_DISTRIBUCION);

    const [centroRaw, provinciaRaw] = await Promise.all([
      centros
        .select("*", { count: "exact", head: true })
        .eq("nombre", body.nombre),
      db
        .from(TABLAS.PROVINCIA)
        .select("*", { count: "exact", head: true })
        .eq("nombre", body.nombre),
    ]);

    const errorRaw = centroRaw.error || provinciaRaw.error;

    if (errorRaw) throw new Error(errorRaw.message);

    if (centroRaw.count && centroRaw.count > 0) {
      return NextResponse.json(
        { error: "Ya se encuentra registrado un centro con ese nombre" },
        { status: 409 },
      );
    }

    if (provinciaRaw.count && provinciaRaw.count > 0) {
      return NextResponse.json(
        {
          error: "Ya se encuentra registrada una provincia con ese nombre",
        },
        { status: 409 },
      );
    }

    const { error } = await centros.insert(body);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Centro insertado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error insertando centro:", error);
    return NextResponse.json(
      { error: "Error al crear centro" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { nombre, ...body }: CentroDistribucion = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de centro requerido" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(TABLAS.CENTRO_DISTRIBUCION);

    const { error } = await db.update(body).eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Centro actualizado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error actualizando centro:", error);
    return NextResponse.json(
      { error: "Error al actualizar centro" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const usuario = usuarioCookie(request);
    if (usuario === null)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (usuario.rol !== "informatico")
      return NextResponse.json({ error: "Permiso denegado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("id");
    if (!nombre) {
      return NextResponse.json(
        { error: "Nombre de centro requerido" },
        { status: 400 },
      );
    }

    const db = (await connectToDatabase()).from(TABLAS.CENTRO_DISTRIBUCION);
    const { error } = await db.delete().eq("nombre", nombre);

    if (error) throw new Error(error.message);

    return NextResponse.json(
      { message: "Centro eliminado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error eliminando centro:", error);
    return NextResponse.json(
      { error: "Error al eliminar centro" },
      { status: 500 },
    );
  }
}
