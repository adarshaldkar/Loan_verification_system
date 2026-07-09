import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Trichy', 'Kolkata', 'Pune'];
const LOAN_TYPES = ['Home Loan', 'Personal Loan', 'Business Loan', 'Auto Loan', 'Gold Loan'];

async function main() {
  console.log('Seeding 30 verified agent verification cases...');

  // Fetch the field agent (Ravi Kumar)
  const agent = await prisma.user.findFirst({
    where: { email: 'ravi.kumar@lvms.com' }
  });

  if (!agent) {
    console.error('Agent Ravi Kumar not found. Please seed standard mock data first.');
    process.exit(1);
  }

  // Create 30 customers and verified cases
  for (let i = 1; i <= 30; i++) {
    const appId = `APP-VER-${100 + i}`;
    const isBusiness = i % 2 === 0;
    const isCompleted = i % 4 !== 0; // 75% completed/approved, 25% rejected/denied
    const status = isCompleted ? 'COMPLETED' : 'REJECTED';
    const city = CITIES[i % CITIES.length];
    const loanType = LOAN_TYPES[i % LOAN_TYPES.length];
    const loanAmount = Math.floor((Math.random() * 20 + 3) * 100000);

    const firstName = [
      'Rajesh', 'Suresh', 'Amit', 'Pankaj', 'Sunita', 'Anjali', 'Karan', 'Deepak',
      'Meena', 'Rohan', 'Sneha', 'Vikram', 'Divya', 'Sanjay', 'Preeti', 'Rahul',
      'Alok', 'Neeta', 'Harish', 'Gaurav', 'Neha', 'Tarun', 'Pooja', 'Vijay',
      'Kavita', 'Manish', 'Shweta', 'Arvind', 'Nisha', 'Yash'
    ][i - 1];

    const lastName = [
      'Iyer', 'Sharma', 'Patel', 'Joshi', 'Shah', 'Verma', 'Kumar', 'Reddy',
      'Nair', 'Gupta', 'Singh', 'Malhotra', 'Das', 'Hegde', 'Joshi', 'Saxena',
      'Sen', 'Gupta', 'Prasad', 'Rao', 'Sharma', 'Mehta', 'Tiwari', 'Babu',
      'Singh', 'Patil', 'Pillai', 'Deshmukh', 'Chawla', 'Varma'
    ][i - 1];

    const address = `${i * 12}, Main Road, Phase ${i % 3 + 1}, ${city}`;

    // 1. Upsert Customer
    const customer = await prisma.customer.upsert({
      where: { applicationId: appId },
      update: {},
      create: {
        applicationId: appId,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        address,
        loanType,
        loanAmount,
        businessName: isBusiness ? `${firstName} Enterprises` : null,
        branch: `${city} HQ`
      }
    });

    // 2. Mock GPS & profileData
    const gpsLatitude = 12.9716 + (Math.random() - 0.5) * 0.1;
    const gpsLongitude = 77.5946 + (Math.random() - 0.5) * 0.1;

    let profileDataObj = {};
    let remarks = '';

    if (isBusiness) {
      profileDataObj = {
        companyName: `${firstName} Enterprises`,
        businessType: 'Proprietorship',
        natureOfBusiness: 'Retail and Distribution',
        yearsInBusiness: i % 5 + 1,
        noOfEmployees: i % 8 + 2,
        monthlyIncome: Math.floor(loanAmount / 15),
        doorNo: `Shop No. ${i}`,
        streetArea: `Phase ${i % 3 + 1}, ${city}`,
        cityTown: city,
        district: city,
        pincode: `62000${i % 9 + 1}`,
        businessFoundAtLocation: 'Yes - Active Shop/Office',
        businessOperational: isCompleted ? 'Yes - Fully Operational' : 'Non-Operational',
        businessOwnedByApplicant: 'Yes - Owner',
        businessPremisesType: 'Commercial Shop',
        stockInventoryAvailable: isCompleted ? 'Moderate / Adequate' : 'Low / Empty',
        gstLicenseAvailable: 'Yes - Valid License',
        signboardAvailable: isCompleted ? 'Yes - Board Displayed' : 'No Signboard',
        customerPresence: 'Yes - Met Client',
        documentsVerified: 'Yes - All Documents Valid'
      };
      remarks = isCompleted 
        ? `Business site verification successfully completed. Retail shop is active and operational. Documents match application. Recommended for approval.`
        : `Business site is shut down. No activity detected at location. Neighbors confirm shop closed 2 months ago. Not recommended.`;
    } else {
      profileDataObj = {
        applicantName: `${firstName} ${lastName}`,
        mobileNumber: customer.phone,
        dateOfBirth: '1988-06-15',
        aadhaarNumber: `5678432100${i < 10 ? '0' + i : i}`,
        houseNo: `Flat ${i * 4}`,
        streetArea: `Phase ${i % 3 + 1}, ${city}`,
        cityTown: city,
        district: city,
        pincode: `62000${i % 9 + 1}`,
        residenceType: 'Apartment / Flat',
        ownershipStatus: 'Owned',
        livingSince: '2015-08-20',
        familyMembers: i % 4 + 2,
        monthlyRent: 0,
        contactNeighbor: 'Neighbor Kumar',
        addressFoundMatch: 'Yes - Matches Exactly',
        neighborConfirm: 'Confirmed',
        electricityConnection: 'Regular Connection',
        waterConnection: 'Corporation Water',
        residenceCondition: 'Excellent'
      };
      remarks = isCompleted
        ? `Residential verification verified. Applicant met in person at residence. Address coordinates matched perfectly. Approved.`
        : `Applicant no longer residing at the given address. Flat is currently unoccupied and locked. Verification failed.`;
    }

    // 3. Upsert Verification Case
    await prisma.verificationCase.upsert({
      where: { id: `case-ver-${i}` },
      update: {},
      create: {
        id: `case-ver-${i}`,
        customerId: customer.id,
        agentId: agent.id,
        status,
        type: isBusiness ? 'BUSINESS' : 'ADDRESS',
        branch: `${city} HQ`,
        gpsLatitude,
        gpsLongitude,
        remarks,
        profileData: JSON.stringify(profileDataObj),
        completedAt: new Date(Date.now() - i * 4 * 3600000)
      }
    });

    // 4. Create Audit Log Entry
    await prisma.auditLog.create({
      data: {
        action: `Verified Case completed by agent (${status})`,
        actor: 'Ravi Kumar (Field Agent)',
        entity: `Case case-ver-${i}`,
        ip: '192.168.1.45',
        timestamp: new Date(Date.now() - i * 4 * 3600000).toISOString()
      }
    });
  }

  console.log('✅ Successfully seeded 30 verified case files into PostgreSQL!');
}

main().catch(e => {
  console.error('Seeding verified cases failed:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
