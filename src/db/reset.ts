import postgres from 'postgres'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env')
  process.exit(1)
}

async function resetDatabase() {
  const dbUrl = new URL(connectionString!)
  const targetDbName = dbUrl.pathname.slice(1)

  dbUrl.pathname = '/template1'
  const client = postgres(dbUrl.toString(), { max: 1 })

  try {
    const exists = await client`
      SELECT 1 FROM pg_database WHERE datname = ${targetDbName}
    `

    if (exists.length > 0) {
      console.log(`Dropping database "${targetDbName}"...`)
      await client.unsafe(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${targetDbName}' AND pid <> pg_backend_pid()
      `)
      await client.unsafe(`DROP DATABASE "${targetDbName}"`)
      console.log(`Database "${targetDbName}" dropped.`)
    } else {
      console.log(`Database "${targetDbName}" does not exist, skipping drop.`)
    }

    console.log(`Creating database "${targetDbName}"...`)
    await client.unsafe(`CREATE DATABASE "${targetDbName}"`)
    console.log(`Database "${targetDbName}" created.`)
  } finally {
    await client.end()
  }
}

async function runMigrations() {
  console.log('Running migrations...')
  try {
    execSync('npx drizzle-kit migrate', { stdio: 'inherit' })
    console.log('Migrations completed.')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('=== DB RESET ===')
  await resetDatabase()
  await runMigrations()
  console.log('=== Done. Run npm run db:seed to re-seed. ===')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
