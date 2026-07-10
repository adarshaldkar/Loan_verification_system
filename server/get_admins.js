const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  console.log('Admins:');
  console.log(admins.map(a => a.email));
}
main().finally(() => prisma.$disconnect());
