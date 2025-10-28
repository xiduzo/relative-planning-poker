import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prepared statements for PgBouncer transaction mode compatibility.
// Limit pool size to 1 to avoid exhausting pooled connections in serverless/dev.
// Ensure a singleton client in dev to prevent HMR from creating multiple pools.
declare global {
  // eslint-disable-next-line no-var
  var __pg_client__: ReturnType<typeof postgres> | undefined
  // eslint-disable-next-line no-var
  var __drizzle_db__: ReturnType<typeof drizzle<typeof schema>> | undefined
}

const client =
  globalThis.__pg_client__ ??
  postgres(connectionString, {
    prepare: false,
    max: 1,
  })

export const db = globalThis.__drizzle_db__ ?? drizzle(client, { schema })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pg_client__ = client
  globalThis.__drizzle_db__ = db
}
