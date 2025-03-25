import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Helper function to generate a blockchain address
function generateAddress(): string {
  return `G${faker.string.alpha({ length: 55 }).toUpperCase()}`;
}

// Helper function to generate a timestamp within the last year
function generateRecentTimestamp(): Date {
  return faker.date.past({ years: 1 });
}

// Helper function to create a Decimal from a timestamp
function createDecimal(timestamp: number | string): Decimal {
  return new Decimal(timestamp.toString());
}

// Constant for our specific user
const SPECIFIC_USER_ADDRESS = 'GD7IDV44QE7CN35M2QLSAISAYPSOSSZTV7LWMKBU5PKDS7NQKTFRZUTS';

async function main() {
  console.log('Starting database seeding...');

  try {
    // Clean up existing data
    console.log('Deleting existing data...');
    await prisma.$executeRawUnsafe('DELETE FROM user_badges');
    await prisma.$executeRawUnsafe('DELETE FROM badges');
    await prisma.$executeRawUnsafe('DELETE FROM community_members');
    await prisma.$executeRawUnsafe('DELETE FROM communities');
    await prisma.$executeRawUnsafe('DELETE FROM users');

    console.log('Existing data cleared. Creating new data...');

    // Create specific user with SQL
    const specificUserIdText = uuidv4();
    const specificUserUuid = await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, user_address, _id, _block_range)
      VALUES ('${specificUserIdText}', '${SPECIFIC_USER_ADDRESS}', gen_random_uuid(), '[1,)') 
      RETURNING _id
    `);
    console.log('Created specific user with ID:', specificUserUuid);

    // Create additional users
    const userIds = [];
    for (let i = 0; i < 5; i++) {
      const userIdText = uuidv4();
      const userAddress = generateAddress();
      const userId = await prisma.$executeRawUnsafe(`
        INSERT INTO users (id, user_address, _id, _block_range)
        VALUES ('${userIdText}', '${userAddress}', gen_random_uuid(), '[1,)') 
        RETURNING _id
      `);
      console.log(`Created user ${i + 1} with ID:`, userId);
      userIds.push(userId);
    }

    console.log(`Created ${userIds.length + 1} users`);

    // Create communities
    for (let index = 0; index < 3; index++) {
      const communityIdText = uuidv4();
      const contractAddress = generateAddress();
      const factoryAddress = generateAddress();
      const creatorAddress = index === 0 || index === 1 ? SPECIFIC_USER_ADDRESS : faker.helpers.arrayElement([SPECIFIC_USER_ADDRESS, ...userIds]);
      const name = faker.company.name().replace(/'/g, "''"); // Escape single quotes
      const description = faker.company.catchPhrase().replace(/'/g, "''");
      const isHidden = index === 1;
      const totalBadges = faker.number.int({ min: 1, max: 3 });
      const timestamp = generateRecentTimestamp().getTime();
      const lastIndexedAt = Date.now();

      console.log(`Creating community ${index + 1}...`);
      
      // Create community with SQL
      const communityId = await prisma.$executeRawUnsafe(`
        INSERT INTO communities (
          id,
          community_address, 
          factory_address, 
          name, 
          description, 
          creator_address, 
          is_hidden, 
          blocktimestamp, 
          total_badges, 
          last_indexed_at, 
          _id,
          _block_range
        )
        VALUES (
          '${communityIdText}',
          '${contractAddress}',
          '${factoryAddress}',
          '${name}',
          '${description}',
          '${creatorAddress}',
          ${isHidden},
          ${timestamp},
          ${totalBadges},
          ${lastIndexedAt},
          gen_random_uuid(),
          '[1,)'
        )
        RETURNING _id
      `);
      
      console.log(`Created community with ID:`, communityId);

      // Add members 
      const memberCount = faker.number.int({ min: 2, max: 4 });
      
      for (let i = 0; i < memberCount; i++) {
        const memberIdText = uuidv4();
        const userAddress = i === 0 ? SPECIFIC_USER_ADDRESS : generateAddress();
        const isManager = faker.datatype.boolean();
        const isCreator = userAddress === creatorAddress;
        const points = faker.number.int({ min: 1, max: 100 });
        
        const memberId = await prisma.$executeRawUnsafe(`
          INSERT INTO community_members (
            id,
            user_address,
            is_manager,
            is_creator,
            community_address,
            last_indexed_at,
            points,
            user_id,
            community_id,
            _id,
            _block_range
          )
          VALUES (
            '${memberIdText}',
            '${userAddress}',
            ${isManager},
            ${isCreator},
            '${contractAddress}',
            ${lastIndexedAt},
            ${points},
            '${i === 0 ? specificUserUuid : userIds[i-1] || userIds[0]}',
            '${communityId}',
            gen_random_uuid(),
            '[1,)'
          )
          RETURNING _id
        `);
        
        console.log(`Created member with ID:`, memberId);
      }

      // Add badges
      for (let i = 0; i < totalBadges; i++) {
        const badgeIdText = uuidv4();
        const issuer = generateAddress();
        const badgeName = faker.company.buzzNoun().replace(/'/g, "''");
        const score = faker.number.int({ min: 1, max: 100 });
        const type = faker.helpers.arrayElement(['Custom', 'Stellar', 'Soroban']);
        
        const badgeId = await prisma.$executeRawUnsafe(`
          INSERT INTO badges (
            id,
            issuer,
            community_address,
            name,
            score,
            type,
            community_id,
            _id,
            _block_range
          )
          VALUES (
            '${badgeIdText}',
            '${issuer}',
            '${contractAddress}',
            '${badgeName}',
            ${score},
            '${type}',
            '${communityId}',
            gen_random_uuid(),
            '[1,)'
          )
          RETURNING _id
        `);
        
        console.log(`Created badge with ID:`, badgeId);
      }

      console.log(`Completed community ${index + 1}`);
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
