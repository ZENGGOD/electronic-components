import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error(
    'Usage: npx tsx scripts/generate-password.ts <password>',
  )
  process.exit(1)
}

const hash = await bcrypt.hash(password, 10)

console.log('\nPassword Hash:\n')
console.log(hash)
