import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { Client } from 'pg'

const defaultTableName = 'imported_json'

function parseArgs(argv) {
  const args = {
    file: null,
    table: defaultTableName,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (current === '--file') {
      args.file = argv[index + 1] ?? null
      index += 1
      continue
    }

    if (current === '--table') {
      args.table = argv[index + 1] ?? defaultTableName
      index += 1
    }
  }

  return args
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function quoteIdentifier(identifier) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid table name: ${identifier}`)
  }

  return `"${identifier}"`
}

async function main() {
  const { file, table } = parseArgs(process.argv.slice(2))

  if (!file) {
    console.error('Usage: npm run db:import -- --file ./path/to/data.json [--table imported_json]')
    process.exit(1)
  }

  const absoluteFilePath = path.resolve(process.cwd(), file)
  const rawContent = await readFile(absoluteFilePath, 'utf8')
  const parsedContent = JSON.parse(rawContent)
  const rows = Array.isArray(parsedContent) ? parsedContent : [parsedContent]
  const quotedTable = quoteIdentifier(table)

  const client = new Client({
    host: process.env.PGHOST ?? 'localhost',
    port: Number(process.env.PGPORT ?? '5432'),
    user: process.env.PGUSER ?? 'postgres',
    password: process.env.PGPASSWORD ?? 'postgres',
    database: process.env.PGDATABASE ?? 'crk_kingdom',
  })

  await client.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quotedTable} (
        id BIGSERIAL PRIMARY KEY,
        source_index INTEGER NOT NULL,
        data JSONB NOT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`TRUNCATE TABLE ${quotedTable}`)

    for (const [index, row] of rows.entries()) {
      const payload = isPlainObject(row) || Array.isArray(row) ? row : { value: row }

      await client.query(
        `INSERT INTO ${quotedTable} (source_index, data) VALUES ($1, $2::jsonb)`,
        [index, JSON.stringify(payload)],
      )
    }

    console.log(`Imported ${rows.length} row(s) into ${table}`)
  } finally {
    await client.end()
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})