/**
 * generate_hashes.js
 * Run: node generate_hashes.js
 * Prints bcrypt hashes to paste into schema.sql
 */
const bcrypt = require('bcryptjs')

const passwords = [
  { label: 'admin123 (Admin)', password: 'admin123' },
  { label: 'agent123 (Agent)', password: 'agent123' },
  { label: 'user123  (User)',  password: 'user123'  },
]

async function main() {
  console.log('\n=== Bcrypt Hashes for schema.sql ===\n')
  for (const { label, password } of passwords) {
    const hash = await bcrypt.hash(password, 12)
    console.log(`-- ${label}`)
    console.log(`'${hash}',`)
    console.log()
  }
  console.log('Paste these hashes into the INSERT INTO users statement in schema.sql')
}

main().catch(console.error)
