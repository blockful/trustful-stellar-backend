import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Communities (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Our mock community data representing what we expect from the database
  const mockCommunity = {
    contractAddress:
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
    factoryAddress:
      'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
    name: 'Test Community',
    description: 'Test Description',
    creatorAddress: 'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
    isHidden: false,
    blocktimestamp: new Date(),
    totalBadges: 10,
  };

  // Setting up our test environment before all tests
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Setting up our test database schema
    await prismaService.$executeRaw`CREATE SCHEMA IF NOT EXISTS public`;
    await prismaService.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prismaService.$executeRaw`CREATE SCHEMA public`;
    await prismaService.$executeRaw`SET search_path TO public`;

    // Running migrations to ensure our database structure is correct
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy');

    await app.init();
  });

  // Resetting our test data before each test
  beforeEach(async () => {
    await prismaService.community.deleteMany({});
    await prismaService.community.create({ data: mockCommunity });
  });

  // Cleaning up after all tests are complete
  afterAll(async () => {
    await prismaService.community.deleteMany({});
    await app.close();
  });

  // Testing our GET /communities endpoint
  describe('/communities (GET)', () => {
    it('should return list of communities', () => {
      return request(app.getHttpServer())
        .get('/communities')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body[0]).toMatchObject({
            contractAddress: mockCommunity.contractAddress,
            name: mockCommunity.name,
            totalBadges: mockCommunity.totalBadges,
          });
        });
    });

    it('should return an empty array when no communities exist', async () => {
      await prismaService.community.deleteMany({});

      return request(app.getHttpServer())
        .get('/communities')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  // Testing our GET /communities/:contractAddress endpoint
  describe('/communities/:contractAddress (GET)', () => {
    it('should return a specific community when given a valid contract address', () => {
      return request(app.getHttpServer())
        .get(`/communities/${mockCommunity.contractAddress}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            contractAddress: mockCommunity.contractAddress,
            factoryAddress: mockCommunity.factoryAddress,
            name: mockCommunity.name,
            description: mockCommunity.description,
            creatorAddress: mockCommunity.creatorAddress,
            isHidden: mockCommunity.isHidden,
            totalBadges: mockCommunity.totalBadges,
          });
        });
    });

    it('should return 404 when community is not found', () => {
      const nonExistentAddress = 'NONEXISTENTADDRESS';

      return request(app.getHttpServer())
        .get(`/communities/${nonExistentAddress}`)
        .expect(404);
    });
  });

  // Testing error handling and edge cases
  describe('Error Handling', () => {
    it('should handle malformed contract addresses gracefully', () => {
      const malformedAddress = 'invalid-address';

      return request(app.getHttpServer())
        .get(`/communities/${malformedAddress}`)
        .expect(404);
    });

    it('should not return hidden communities in the list', async () => {
      // Creating a hidden community
      const hiddenCommunity = {
        ...mockCommunity,
        contractAddress: 'DIFFERENTADDRESS',
        isHidden: true,
      };

      await prismaService.community.create({ data: hiddenCommunity });

      return request(app.getHttpServer())
        .get('/communities')
        .expect(200)
        .expect((res) => {
          const hiddenCommunities = res.body.filter(
            (c: any) => c.isHidden === true,
          );
          expect(hiddenCommunities).toHaveLength(0);
        });
    });
  });
});
