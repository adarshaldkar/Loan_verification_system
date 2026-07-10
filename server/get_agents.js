const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const agents = await prisma.user.findMany({ where: { role: 'FIELD_AGENT' } });
  console.log("Agents:");
  console.log(agents.map(a => a.email));
}
main().finally(() => prisma.$disconnect());
