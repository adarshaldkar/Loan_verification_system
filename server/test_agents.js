const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ where: { role: 'FIELD_AGENT' } })
  .then(u => console.log(JSON.stringify(u, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
