const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    where: { email: 'agent1@lvms.com' },
    data: { password: hash }
  });
  console.log("Updated agent1@lvms.com password to 'password123'");
  
  await prisma.user.updateMany({
    where: { email: 'Aksh12@gmail.com' },
    data: { password: hash }
  });
  console.log("Updated Aksh12@gmail.com password to 'password123'");
}

run().catch(console.error).finally(() => prisma.$disconnect());
