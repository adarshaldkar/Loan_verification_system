const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tamil = await prisma.user.findFirst({
    where: { email: 'tamil@gmail.com' }
  });

  if (!tamil) {
    console.error("Tamil agent not found. Please log in first.");
    return;
  }

  const adminId = tamil.adminId;
  const agentId = tamil.id;

  // Clear existing verification cases and customers for this agent
  await prisma.verificationCase.deleteMany({
    where: { agentId }
  });

  console.log("Cleared old cases for Tamil.");

  // Create Case 1: Harmony Apts, Puducherry
  const cust1 = await prisma.customer.create({
    data: {
      applicationId: `APP-${Date.now()}-1`,
      firstName: 'Adarsh',
      lastName: 'Patel',
      phone: '7010664806',
      address: 'harmony apts , school street , pragaladan garden , oulgaret , pududchery',
      loanAmount: 500000,
      loanType: 'Home Loan',
      branch: 'chennai',
      adminId,
    }
  });

  await prisma.verificationCase.create({
    data: {
      customerId: cust1.id,
      agentId,
      status: 'PENDING',
      type: 'RESIDENTIAL',
      branch: 'chennai',
      adminId,
    }
  });

  // Create Case 2: Chennai Central Railway Station
  const cust2 = await prisma.customer.create({
    data: {
      applicationId: `APP-${Date.now()}-2`,
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      address: 'Chennai Central Railway Station, Chennai',
      loanAmount: 200000,
      loanType: 'Personal Loan',
      branch: 'chennai',
      adminId,
    }
  });

  await prisma.verificationCase.create({
    data: {
      customerId: cust2.id,
      agentId,
      status: 'IN_PROGRESS',
      type: 'BUSINESS',
      branch: 'chennai',
      adminId,
    }
  });

  console.log("Successfully seeded 2 verification cases for agent Tamil!");
}

main().finally(() => prisma.$disconnect());
