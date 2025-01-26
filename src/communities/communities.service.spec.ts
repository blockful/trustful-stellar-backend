import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let prismaService: PrismaService;

  const mockPrismaResponse = {
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
    _count: {
      members: 5,
    },
    managers: [
      {
        managerAddress:
          'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX',
      },
      {
        managerAddress:
          'GDZAP3QWXBZAPILZBCJ5LYIJYVXZSNJ4WCYCNHBQPQHCJX2RNXRUMMZN',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunitiesService,
        {
          provide: PrismaService,
          useValue: {
            community: {
              findMany: jest.fn().mockResolvedValue([mockPrismaResponse]),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CommunitiesService>(CommunitiesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return transformed community data', async () => {
      const result = await service.findAll();

      expect(result).toEqual([
        {
          contractAddress:
            'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          factoryAddress:
            'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
          name: 'Test Community',
          description: 'Test Description',
          creatorAddress:
            'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
          isHidden: false,
          blocktimestamp: expect.any(Date),
          totalBadges: 10,
          totalMembers: 5,
          managers: [
            'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX',
            'GDZAP3QWXBZAPILZBCJ5LYIJYVXZSNJ4WCYCNHBQPQHCJX2RNXRUMMZN',
          ],
        },
      ]);

      expect(prismaService.community.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              members: true,
            },
          },
          managers: {
            select: {
              managerAddress: true,
            },
          },
        },
        where: {
          isHidden: false,
        },
      });
    });
  });
});
