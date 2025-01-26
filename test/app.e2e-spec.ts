import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';

describe('Communities (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Run migrations
    await prismaService.$executeRaw`CREATE SCHEMA IF NOT EXISTS public`;
    await prismaService.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prismaService.$executeRaw`CREATE SCHEMA public`;
    await prismaService.$executeRaw`SET search_path TO public`;

    // Run your Prisma migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy');

    await app.init();
  });

  beforeEach(async () => {
    await prismaService.community.deleteMany({});
    await prismaService.community.create({ data: mockCommunity });
  });

  afterAll(async () => {
    await prismaService.community.deleteMany({});
    await app.close();
  });

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
  });
});
