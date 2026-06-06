import postgres from 'postgres'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not defined in .env')
  process.exit(1)
}

async function ensureDatabaseExists() {
  const dbUrl = new URL(connectionString!)
  const targetDbName = dbUrl.pathname.slice(1)

  dbUrl.pathname = '/template1'
  const maintenanceClient = postgres(dbUrl.toString())

  try {
    console.log(`Checking if database "${targetDbName}" exists...`)
    const result = await maintenanceClient`
      SELECT 1 FROM pg_database WHERE datname = ${targetDbName}
    `

    if (result.length === 0) {
      console.log(`Database "${targetDbName}" does not exist. Creating...`)
      await maintenanceClient.unsafe(`CREATE DATABASE "${targetDbName}"`)
      console.log(`Database "${targetDbName}" created successfully.`)
    } else {
      console.log(`Database "${targetDbName}" already exists.`)
    }
  } catch (error) {
    console.error('Error ensuring database exists:', error)
    process.exit(1)
  } finally {
    await maintenanceClient.end()
  }
}

async function runMigrations() {
  console.log('Running migrations...')
  try {
    execSync('npx drizzle-kit migrate', { stdio: 'inherit' })
    console.log('Migrations completed successfully.')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

async function main() {
  await ensureDatabaseExists()
  await runMigrations()
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
