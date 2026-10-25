import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
// `casing: "snake_case"` maps camelCase column properties → snake_case SQL, so
// the whole DB stays snake_case without per-column names. Keep the DB in sync
// (see drizzle/manual/0004_snake_case.sql).
export const db = drizzle(client, { schema, casing: "snake_case" });
