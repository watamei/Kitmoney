import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const username = args[0]?.trim();
  const password = args[1]?.trim();

  if (!username || !password) {
    console.error('Usage: npx tsx prisma/create-user.ts <username> <password>');
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    console.error(`Error: User "${username}" already exists.`);
    process.exit(1);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
    },
  });

  console.log(`User "${user.username}" created successfully (ID: ${user.id}).`);
}

main()
  .catch((err) => {
    console.error('Failed to create user:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
