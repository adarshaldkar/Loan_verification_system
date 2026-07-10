const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find all Admins
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });

  if (admins.length === 0) {
    console.error("No Admin users found in the database.");
    return;
  }

  // 2. Find or create a Field Agent
  let agent = await prisma.user.findFirst({
    where: { role: 'FIELD_AGENT' }
  });

  if (!agent) {
    agent = await prisma.user.create({
      data: {
        email: 'sample.agent@example.com',
        firstName: 'Rahul',
        lastName: 'Sharma',
        role: 'FIELD_AGENT',
        password: 'hashedpassword',
        isActive: true
      }
    });
    console.log(`Created new agent ${agent.firstName} ${agent.lastName}`);
  }

  // 3. Clear existing active rides for this agent
  await prisma.agentRide.updateMany({
    where: { agentId: agent.id, status: 'STARTED' },
    data: { status: 'COMPLETED', endTime: new Date() }
  });

  // 4. Create an active ride for EACH admin so it shows up regardless of who is logged in!
  for (const admin of admins) {
    const ride = await prisma.agentRide.create({
      data: {
        agentId: agent.id,
        adminId: admin.id,
        status: 'STARTED',
        totalDistance: 2.15
      }
    });

    console.log(`Created active AgentRide for Admin ${admin.firstName} ${admin.lastName} (Ride ID: ${ride.id})`);

    // Seed a path of 6 locations near Trichy
    const baseLat = 10.7905;
    const baseLng = 78.7047;

    const locationsData = [
      { latitude: baseLat, longitude: baseLng, timestamp: new Date(Date.now() - 1000 * 60 * 10) },
      { latitude: baseLat + 0.002, longitude: baseLng + 0.002, timestamp: new Date(Date.now() - 1000 * 60 * 8) },
      { latitude: baseLat + 0.004, longitude: baseLng + 0.003, timestamp: new Date(Date.now() - 1000 * 60 * 6) },
      { latitude: baseLat + 0.006, longitude: baseLng + 0.005, timestamp: new Date(Date.now() - 1000 * 60 * 4) },
      { latitude: baseLat + 0.009, longitude: baseLng + 0.007, timestamp: new Date(Date.now() - 1000 * 60 * 2) },
      { latitude: baseLat + 0.012, longitude: baseLng + 0.009, timestamp: new Date() }
    ];

    for (const loc of locationsData) {
      await prisma.agentLocation.create({
        data: {
          rideId: ride.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: 8.5,
          timestamp: loc.timestamp
        }
      });
    }
  }

  console.log(`Successfully seeded location coordinates. Live tracking active!`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
