import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Helper function to generate a blockchain address
function generateAddress(): string {
  return `G${faker.string.alpha({ length: 55 }).toUpperCase()}`;
}

// Helper function to generate a timestamp within the last year
function generateRecentTimestamp(): Date {
  return faker.date.past({ years: 1 });
}

async function main() {
  console.log('Starting database seeding...');

  // Clean up existing data
  await prisma.communityMember.deleteMany({});
  await prisma.communityManager.deleteMany({});
  await prisma.community.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Existing data cleared. Creating new data...');

  // Create base users
  const users = await Promise.all(
    Array.from({ length: 20 }).map(async () => {
      return await prisma.user.create({
        data: {
          userAddress: generateAddress(),
        },
      });
    }),
  );

  console.log(`Created ${users.length} users`);

  // Create communities with relationships
  const communities = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const contractAddress = generateAddress();
      const creatorAddress = faker.helpers.arrayElement(users).userAddress;

      // Create the community
      const community = await prisma.community.create({
        data: {
          contractAddress: contractAddress,
          factoryAddress: generateAddress(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          creatorAddress: creatorAddress,
          isHidden: faker.datatype.boolean(),
          blocktimestamp: generateRecentTimestamp(),
          totalBadges: faker.number.int({ min: 0, max: 100 }),
          lastIndexedAt: new Date(),
        },
      });

      // Add some members to the community
      const memberCount = faker.number.int({ min: 5, max: 15 });
      const selectedUsers = faker.helpers.arrayElements(users, memberCount);

      await Promise.all(
        selectedUsers.map(async (user) => {
          return await prisma.communityMember.create({
            data: {
              userAddress: user.userAddress,
              contractAddress: community.contractAddress,
              isManager: faker.datatype.boolean(),
              isCreator: user.userAddress === creatorAddress,
              lastIndexedAt: new Date(),
            },
          });
        }),
      );

      // Add some managers
      const managerCount = faker.number.int({ min: 1, max: 3 });
      const selectedManagers = faker.helpers.arrayElements(
        selectedUsers,
        managerCount,
      );

      await Promise.all(
        selectedManagers.map(async (user) => {
          return await prisma.communityManager.create({
            data: {
              managerAddress: user.userAddress,
              contractAddress: community.contractAddress,
            },
          });
        }),
      );

      // Após criar a community, adicione badges
      const badgeCount = faker.number.int({ min: 2, max: 5 });
      await Promise.all(
        Array.from({ length: badgeCount }).map(async () => {
          return await prisma.badge.create({
            data: {
              issuer: generateAddress(),
              contractAddress: community.contractAddress,
              name: faker.company.buzzNoun(),
              score: faker.number.int({ min: 1, max: 100 })
            }
          });
        })
      );

      return community;
    }),
  );

  console.log(
    `Created ${communities.length} communities with members and managers`,
  );
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
