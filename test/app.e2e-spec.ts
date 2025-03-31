import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as dotenv from 'dotenv';
import { Decimal } from '@prisma/client/runtime/library';

dotenv.config({ path: '.env.test' });

describe('Communities (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Our mock community data representing what we expect from the database
  const mockCommunity = {
    community_address:
      'cb5dqk6ddwrjhpwjhypqgfk4f4k7yzhx7iht6i4ico4pvifqb4rqaaaaaaaaaaaaaaaa',
    factory_address:
      'ccydnaovwshzuhdmxbpxkpohqw4fh44p26ngvfayunpwpunwpsxapbaaaaaaaaaaaaaaa',
    name: 'Test Community',
    description: 'Test Description',
    creator_address: 'gbvnnpofvv2ynxsqxdjpbvqyy7wjlhgpmlxzlhbz3y6hlkxqgfbpbzry',
    is_hidden: false,
    blocktimestamp: new Decimal('1620000000'),
    total_badges: 10,
    last_indexed_at: new Decimal('1620000000'),
    id: '00000000-0000-0000-0000-000000000001',
  };

  const hiddenCommunity = {
    community_address: 'hidden_community_address',
    is_hidden: true,
    factory_address: 'factory_address',
    name: 'Hidden Community',
    description: 'Hidden Description',
    creator_address: 'creator_address',
    blocktimestamp: new Decimal('1620000000'),
    total_badges: 0,
    last_indexed_at: new Decimal('1620000000'),
    id: '00000000-0000-0000-0000-000000000002',
  };

  beforeAll(async () => {
    const mockPrismaService = {
      community: {
        findMany: jest.fn().mockImplementation((params) => {
          if (params?.where?.is_hidden === false) {
            return [mockCommunity];
          }
          return [];
        }),
        findFirst: jest.fn().mockImplementation((params) => {
          // Keep track of whether visibility was updated
          if (params.where.community_address === mockCommunity.community_address) {
            // Check if updateMany was called before this
            if (mockPrismaService.community.updateMany.mock.calls.length > 0) {
              // Return the community with updated visibility
              return {
                ...mockCommunity,
                is_hidden: true,
              };
            }
            return mockCommunity;
          }
          if (params.where.community_address === hiddenCommunity.community_address) {
            return hiddenCommunity;
          }
          return null;
        }),
        updateMany: jest.fn().mockImplementation((params) => {
          if (params.where.community_address === mockCommunity.community_address) {
            return { count: 1 };
          }
          return { count: 0 };
        }),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      communityMember: {
        count: jest.fn().mockReturnValue(5),
        findMany: jest.fn().mockReturnValue([
          { user_address: 'manager_1' },
          { user_address: 'manager_2' }
        ]),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
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
            communityAddress: mockCommunity.community_address,
            name: mockCommunity.name,
            totalBadges: mockCommunity.total_badges,
          });
        });
    });
  });

  // Testing our GET /communities/:contractAddress endpoint
  describe('/communities/:contractAddress (GET)', () => {
    it('should return a specific community when given a valid contract address', () => {
      return request(app.getHttpServer())
        .get(`/communities/${mockCommunity.community_address}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            communityAddress: mockCommunity.community_address,
            factoryAddress: mockCommunity.factory_address,
            name: mockCommunity.name,
            description: mockCommunity.description,
            creatorAddress: mockCommunity.creator_address,
            isHidden: mockCommunity.is_hidden,
            totalBadges: mockCommunity.total_badges,
          });
        });
    });

    it('should return 404 when community is not found', () => {
      const nonExistentAddress = 'nonexistentaddress';

      return request(app.getHttpServer())
        .get(`/communities/${nonExistentAddress}`)
        .expect(404);
    });
  });

  describe('/communities/:contractAddress/visibility (PATCH)', () => {
    it('should update community visibility status', async () => {
      return request(app.getHttpServer())
        .patch(`/communities/${mockCommunity.community_address}/visibility`)
        .send({ isHidden: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.isHidden).toBe(true);
          expect(res.body.communityAddress).toBe(mockCommunity.community_address);
        });
    });

    it('should return 404 when community not found', () => {
      const nonExistentAddress = 'nonexistentaddress';

      return request(app.getHttpServer())
        .patch(`/communities/${nonExistentAddress}/visibility`)
        .send({ isHidden: true })
        .expect(404);
    });
  });
});