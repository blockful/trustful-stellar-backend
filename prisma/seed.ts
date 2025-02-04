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

// Constant for our specific user
const SPECIFIC_USER_ADDRESS = 'GD7IDV44QE7CN35M2QLSAISAYPSOSSZTV7LWMKBU5PKDS7NQKTFRZUTS';

async function main() {
  console.log('Starting database seeding...');

  // Clean up existing data
  await prisma.communityMember.deleteMany({});
  await prisma.communityManager.deleteMany({});
  await prisma.community.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Existing data cleared. Creating new data...');

  // Create base users including our specific user
  const specificUser = await prisma.user.create({
    data: {
      userAddress: SPECIFIC_USER_ADDRESS,
    },
  });

  const users = await Promise.all(
    Array.from({ length: 19 }).map(async () => {
      return await prisma.user.create({
        data: {
          userAddress: generateAddress(),
        },
      });
    }),
  );

  // Add specific user to the users array
  const allUsers = [specificUser, ...users];

  console.log(`Created ${allUsers.length} users`);

  // Create communities with relationships
  const communities = await Promise.all(
    Array.from({ length: 10 }).map(async (_, index) => {
      const contractAddress = generateAddress();
      // Make specific user the creator of the first community and one hidden community
      const creatorAddress = index === 0 || index === 1 ? SPECIFIC_USER_ADDRESS : faker.helpers.arrayElement(allUsers).userAddress;
      const totalBadges = faker.number.int({ min: 1, max: 10 });

      // Create the community
      const community = await prisma.community.create({
        data: {
          contractAddress: contractAddress,
          factoryAddress: generateAddress(),
          name: faker.company.name(),
          description: faker.company.catchPhrase(),
          creatorAddress: creatorAddress,
          isHidden: index === 1, // Make the second community hidden
          blocktimestamp: generateRecentTimestamp(),
          totalBadges: totalBadges,
          lastIndexedAt: new Date(),
        },
      });

      // Add members to the community
      const memberCount = faker.number.int({ min: 5, max: 15 });
      // Ensure specific user is a member of the third community
      const selectedUsers = index === 2 
        ? [specificUser, ...faker.helpers.arrayElements(users, memberCount - 1)]
        : faker.helpers.arrayElements(allUsers, memberCount);

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

      // Add managers
      const managerCount = faker.number.int({ min: 1, max: 3 });
      const selectedManagers = faker.helpers.arrayElements(selectedUsers, managerCount);

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

      // Add badges
      await Promise.all(
        Array.from({ length: totalBadges }).map(async () => {
          return await prisma.badge.create({
            data: {
              issuer: generateAddress(),
              contractAddress: community.contractAddress,
              name: faker.company.buzzNoun(),
              score: faker.number.int({ min: 1, max: 100 }),
              type: faker.helpers.arrayElement(['Custom', 'Stellar', 'Soroban'])
            }
          });
        })
      );

      return community;
    }),
  );

  console.log(`Created ${communities.length} communities with members and managers`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
