const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding fresh database with demo admin...');

  const salt = await bcrypt.genSalt(10);

  // Create Demo Admin 1 — Akash
  const admin1 = await prisma.user.upsert({
    where: { email: 'akash@lvms.com' },
    update: {},
    create: {
      email: 'akash@lvms.com',
      password: await bcrypt.hash('password123', salt),
      firstName: 'Akash',
      lastName: 'Sharma',
      phone: '+91 98765 00001',
      role: 'ADMIN',
      branch: 'Trichy HQ',
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin1.email}`);

  // Create Demo Admin 2 — Adarsh
  const admin2 = await prisma.user.upsert({
    where: { email: 'adarsh@lvms.com' },
    update: {},
    create: {
      email: 'adarsh@lvms.com',
      password: await bcrypt.hash('password123', salt),
      firstName: 'Adarsh',
      lastName: 'Kumar',
      phone: '+91 98765 00002',
      role: 'ADMIN',
      branch: 'Chennai HQ',
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin2.email}`);

  // Create an agent under Akash
  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@lvms.com' },
    update: {},
    create: {
      email: 'agent1@lvms.com',
      password: await bcrypt.hash('password123', salt),
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91 98765 43210',
      role: 'FIELD_AGENT',
      branch: 'Trichy HQ',
      isActive: true,
      adminId: admin1.id, // 🔑 Belongs to Akash
    },
  });
  console.log(`✅ Agent created: ${agent1.email} (under ${admin1.email})`);

  // Create an agent under Adarsh
  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@lvms.com' },
    update: {},
    create: {
      email: 'agent2@lvms.com',
      password: await bcrypt.hash('password123', salt),
      firstName: 'Priya',
      lastName: 'Nair',
      phone: '+91 99887 76655',
      role: 'FIELD_AGENT',
      branch: 'Chennai HQ',
      isActive: true,
      adminId: admin2.id, // 🔑 Belongs to Adarsh
    },
  });
  console.log(`✅ Agent created: ${agent2.email} (under ${admin2.email})`);

  console.log('\n✅ Seed complete! Login credentials:');
  console.log('  Admin 1: akash@lvms.com / password123');
  console.log('  Admin 2: adarsh@lvms.com / password123');
  console.log('  Agent 1: agent1@lvms.com / password123 (under Akash)');
  console.log('  Agent 2: agent2@lvms.com / password123 (under Adarsh)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
