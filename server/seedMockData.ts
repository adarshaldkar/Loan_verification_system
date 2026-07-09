import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // ── Branches ──────────────────────────────────────────────────
  const branch1 = await prisma.branch.upsert({
    where: { name: 'Bangalore HQ' },
    update: {},
    create: { name: 'Bangalore HQ', city: 'Bangalore', manager: 'Rajesh Iyer', phone: '+91 80 2345 6789' }
  });
  const branch2 = await prisma.branch.upsert({
    where: { name: 'Mumbai West' },
    update: {},
    create: { name: 'Mumbai West', city: 'Mumbai', manager: 'Sunita Shah', phone: '+91 22 8876 5432' }
  });
  const branch3 = await prisma.branch.upsert({
    where: { name: 'Delhi North' },
    update: {},
    create: { name: 'Delhi North', city: 'Delhi', manager: 'Pankaj Sharma', phone: '+91 11 8765 4321' }
  });
  const branch4 = await prisma.branch.upsert({
    where: { name: 'Hyderabad Central' },
    update: {},
    create: { name: 'Hyderabad Central', city: 'Hyderabad', manager: 'Anita Reddy', phone: '+91 40 7654 3210' }
  });
  console.log('Branches seeded.');

  // ── Agents ────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('agent123', salt);

  const agent1 = await prisma.user.upsert({
    where: { email: 'ravi.kumar@lvms.com' },
    update: {},
    create: { email: 'ravi.kumar@lvms.com', password, firstName: 'Ravi', lastName: 'Kumar', role: 'FIELD_AGENT', branch: 'Bangalore HQ', phone: '9876543210' }
  });
  const agent2 = await prisma.user.upsert({
    where: { email: 'sneha.patel@lvms.com' },
    update: {},
    create: { email: 'sneha.patel@lvms.com', password, firstName: 'Sneha', lastName: 'Patel', role: 'FIELD_AGENT', branch: 'Mumbai West', phone: '8765432109' }
  });
  const agent3 = await prisma.user.upsert({
    where: { email: 'vikash.sharma@lvms.com' },
    update: {},
    create: { email: 'vikash.sharma@lvms.com', password, firstName: 'Vikash', lastName: 'Sharma', role: 'FIELD_AGENT', branch: 'Delhi North', phone: '7654321098' }
  });
  console.log('Agents seeded.');

  // ── Customers ────────────────────────────────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { applicationId: 'APP-001' },
    update: {},
    create: { firstName: 'Amit', lastName: 'Sharma', email: 'amit@example.com', phone: '9988776655', address: '123 Main St, Bangalore', loanAmount: 500000, loanType: 'Personal', branch: 'Bangalore HQ', applicationId: 'APP-001' }
  });
  const customer2 = await prisma.customer.upsert({
    where: { applicationId: 'APP-002' },
    update: {},
    create: { firstName: 'Priya', lastName: 'Mehta', email: 'priya@example.com', phone: '8877665544', address: '45 IT Park, Mumbai', loanAmount: 1200000, loanType: 'Home Loan', branch: 'Mumbai West', applicationId: 'APP-002' }
  });
  const customer3 = await prisma.customer.upsert({
    where: { applicationId: 'APP-003' },
    update: {},
    create: { firstName: 'Rahul', lastName: 'Gupta', email: 'rahul@example.com', phone: '7766554433', address: '78 Civil Lines, Delhi', loanAmount: 800000, loanType: 'Auto Loan', branch: 'Delhi North', applicationId: 'APP-003' }
  });
  const customer4 = await prisma.customer.upsert({
    where: { applicationId: 'APP-004' },
    update: {},
    create: { firstName: 'Ananya', lastName: 'Reddy', email: 'ananya@example.com', phone: '6655443322', address: '90 Ring Rd, Hyderabad', loanAmount: 300000, loanType: 'Personal', branch: 'Hyderabad Central', applicationId: 'APP-004' }
  });
  const customer5 = await prisma.customer.upsert({
    where: { applicationId: 'APP-005' },
    update: {},
    create: { firstName: 'Suresh', lastName: 'Joshi', email: 'suresh@example.com', phone: '5544332211', address: '23 Station Rd, Pune', loanAmount: 1800000, loanType: 'Business', applicationId: 'APP-005' }
  });
  console.log('Customers seeded.');

  // ── Verification Cases ────────────────────────────────────────
  await prisma.verificationCase.upsert({
    where: { id: 'case-001' },
    update: {},
    create: { id: 'case-001', customerId: customer1.id, agentId: agent1.id, status: 'COMPLETED', type: 'ADDRESS', branch: 'Bangalore HQ', remarks: 'Verified and approved' }
  });
  await prisma.verificationCase.upsert({
    where: { id: 'case-002' },
    update: {},
    create: { id: 'case-002', customerId: customer2.id, agentId: agent2.id, status: 'IN_PROGRESS', type: 'ADDRESS', branch: 'Mumbai West', remarks: 'Awaiting photos' }
  });
  await prisma.verificationCase.upsert({
    where: { id: 'case-003' },
    update: {},
    create: { id: 'case-003', customerId: customer3.id, agentId: agent3.id, status: 'PENDING', type: 'ADDRESS', branch: 'Delhi North', remarks: 'Not yet started' }
  });
  await prisma.verificationCase.upsert({
    where: { id: 'case-004' },
    update: {},
    create: { id: 'case-004', customerId: customer4.id, agentId: agent1.id, status: 'REJECTED', type: 'ADDRESS', branch: 'Hyderabad Central', remarks: 'Documents invalid' }
  });
  await prisma.verificationCase.upsert({
    where: { id: 'case-005' },
    update: {},
    create: { id: 'case-005', customerId: customer5.id, status: 'PENDING', type: 'BUSINESS', remarks: 'Business verification required' }
  });
  console.log('Cases seeded.');

  // ── Audit Logs ────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { action: 'Approved verification', actor: 'Admin', entity: 'Case case-001', ip: '192.168.1.10', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { action: 'Assigned case to Ravi Kumar', actor: 'Admin', entity: 'Case case-002', ip: '192.168.1.10', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { action: 'Registered new agent Vikash Sharma', actor: 'Admin', entity: 'Agent', ip: '192.168.1.10', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { action: 'Rejected verification – invalid docs', actor: 'Admin', entity: 'Case case-004', ip: '192.168.1.10', timestamp: new Date(Date.now() - 172800000).toISOString() },
      { action: 'System startup – mock data seeded', actor: 'System', entity: 'Database', ip: 'localhost', timestamp: new Date().toISOString() },
    ],
    skipDuplicates: true,
  });
  console.log('Audit logs seeded.');

  console.log('\n✅ All mock data seeded successfully!');
}

main().catch(e => {
  console.error('Seed error:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

