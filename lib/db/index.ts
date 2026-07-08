import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { relations } from "./schema"

const url = (process.env.DATABASE_URL ?? "").replace(":6543", ":5432")

export const db = drizzle(url, { relations })
