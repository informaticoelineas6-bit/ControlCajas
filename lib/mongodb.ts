import {
  MongoClient,
  Db,
  MongoClientOptions,
  Collection,
  ObjectId,
} from "mongodb";
import { NextResponse } from "next/server";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Helper function to add timeout to any promise
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out",
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timeoutId),
  );
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // build options for MongoClient; allow invalid certificates if env var set
    const options: MongoClientOptions = {
      serverSelectionTimeoutMS: 30000, // Increase from default 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      tls: true,
    };

    if (process.env.MONGODB_TLS_ALLOW_INVALID === "true") {
      options.tlsAllowInvalidCertificates = true;
      // tlsInsecure cannot be used together with tlsAllowInvalidCertificates
      // the driver will throw an error; keeping only the latter.
    }

    // Ensure URI is defined
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    const client = new MongoClient(uri, options);

    // Apply timeout to the connection process (15 seconds should be enough)
    await withTimeout(
      client.connect(),
      15000,
      "MongoDB connection timeout after 15 seconds",
    );

    const db = client.db("ControlCajas");

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error("Error connecting to database:", error);
    // Clean up cached references on error
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

export async function logDelete(
  db: Db,
  collection: Collection,
  id: ObjectId,
  nombre: string,
): Promise<NextResponse> {
  try {
    const document = await collection.findOne({ _id: id });

    if (document) {
      document.id = undefined;

      const auditable = db.collection("AuditLog");

      const log: DeleteAudit = {
        action: "DELETE",
        collection: collection.namespace.split(".")[1],
        objectSnapshot: document,
        deletedBy: nombre,
        deletedAt: new Date().toISOString(),
      };

      await auditable.insertOne(log);

      const response = await collection.deleteOne({ _id: id });
      if (response.acknowledged)
        return NextResponse.json({
          success: true,
          count: response.deletedCount,
        });
    }
    return NextResponse.json(
      { error: "Error al eliminar objeto" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Error deleting: ", error);
    return NextResponse.json(
      { error: "Error al eliminar objeto" },
      { status: 500 },
    );
  }
}

export interface DeleteAudit {
  action: string;
  collection: string;
  objectSnapshot: object;
  deletedBy: string;
  deletedAt: string;
}
