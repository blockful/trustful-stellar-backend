import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let prismaService: PrismaService;

  const mockPrismaResponse = {
    communityAddress:
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
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            communityMember: {
              findMany: jest.fn(),
            },
            badge: {
              findMany: jest.fn(),
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
          communityAddress:
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

  describe('findOne', () => {
    const communityAddress =
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA';

    it('should return a specific community', async () => {
      prismaService.community.findUnique = jest.fn().mockResolvedValue({
        ...mockPrismaResponse,
        _count: {
          members: 5,
        },
      });

      const result = await service.findOne(communityAddress);

      expect(result).toEqual({
        communityAddress,
        factoryAddress: mockPrismaResponse.factoryAddress,
        name: mockPrismaResponse.name,
        description: mockPrismaResponse.description,
        creatorAddress: mockPrismaResponse.creatorAddress,
        isHidden: mockPrismaResponse.isHidden,
        blocktimestamp: expect.any(Date),
        totalBadges: mockPrismaResponse.totalBadges,
        totalMembers: 5,
        managers: [
          'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX',
          'GDZAP3QWXBZAPILZBCJ5LYIJYVXZSNJ4WCYCNHBQPQHCJX2RNXRUMMZN',
        ],
      });

      expect(prismaService.community.findUnique).toHaveBeenCalledWith({
        where: { communityAddress },
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
      });
    });

    it('should throw NotFoundException when community not found', async () => {
      prismaService.community.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateVisibility', () => {
    const communityAddress =
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA';

    it('should update community visibility', async () => {
      const updatedMockResponse = {
        ...mockPrismaResponse,
        isHidden: true,
      };

      prismaService.community.update = jest
        .fn()
        .mockResolvedValue(updatedMockResponse);

      const result = await service.updateVisibility(communityAddress, true);

      expect(result.isHidden).toBe(true);
      expect(prismaService.community.update).toHaveBeenCalledWith({
        where: { communityAddress },
        data: { isHidden: true },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when community not found', async () => {
      prismaService.community.update = jest.fn().mockRejectedValue({
        code: 'P2025',
      });

      await expect(
        service.updateVisibility(communityAddress, true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMembers', () => {
    const communityAddress = 'TEST_CONTRACT_ADDRESS';
    const mockMembers = [
      {
        id: 1,
        userAddress: 'USER_1',
        isManager: true,
        isCreator: true,
        communityAddress,
        lastIndexedAt: new Date(),
        user: {
          userAddress: 'USER_1'
        }
      },
      {
        id: 2,
        userAddress: 'USER_2',
        isManager: false,
        isCreator: false,
        communityAddress,
        lastIndexedAt: new Date(),
        user: {
          userAddress: 'USER_2'
        }
      }
    ];

    beforeEach(() => {
      prismaService.communityMember.findMany = jest.fn().mockResolvedValue(mockMembers);
    });

    it('should return all members of a community', async () => {
      const result = await service.findMembers(communityAddress);

      expect(result).toEqual(mockMembers);
      expect(prismaService.communityMember.findMany).toHaveBeenCalledWith({
        where: { communityAddress },
        include: { user: true },
        orderBy: { points: 'desc' }
      });
    });

    it('should throw NotFoundException when no members are found', async () => {
      prismaService.communityMember.findMany = jest.fn().mockResolvedValue([]);

      await expect(service.findMembers(communityAddress))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findBadges', () => {
    const communityAddress = 'TEST_CONTRACT_ADDRESS';
    const mockBadges = [
      {
        issuer: 'ISSUER_1',
        communityAddress,
        name: 'Badge 1',
        score: 100
      },
      {
        issuer: 'ISSUER_2',
        communityAddress,
        name: 'Badge 2',
        score: 50
      }
    ];

    beforeEach(() => {
      prismaService.badge.findMany = jest.fn().mockResolvedValue(mockBadges);
    });

    it('should return all badges of a community', async () => {
      const result = await service.findBadges(communityAddress);

      expect(result).toEqual(mockBadges);
      expect(prismaService.badge.findMany).toHaveBeenCalledWith({
        where: { communityAddress }
      });
    });

    it('should throw NotFoundException when no badges are found', async () => {
      prismaService.badge.findMany = jest.fn().mockResolvedValue([]);

      await expect(service.findBadges(communityAddress))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('findCreatedCommunities', () => {
    const userAddress = 'TEST_USER_ADDRESS';
    // const mockCommunities = [
    //   {
    //     contractAddress: 'CONTRACT_1',
    //     name: 'Community 1',
    //     creatorAddress: userAddress
    //   },
    //   {
    //     contractAddress: 'CONTRACT_2',
    //     name: 'Community 2',
    //     creatorAddress: userAddress
    //   }
    // ];

    // beforeEach(() => {
    //   prismaService.community.findMany = jest.fn().mockResolvedValue(mockCommunities);
    // });

    it('should return all communities created by a user', async () => {
      const result = await service.findCreatedCommunities(userAddress);

      expect(result).toEqual([
        {
          communityAddress:
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
        where: { creatorAddress: userAddress }
      });
    });
  });

  describe('findHiddenCommunities', () => {
    const userAddress = 'TEST_USER_ADDRESS';

    it('should return all hidden communities for a user', async () => {
      const result = await service.findHiddenCommunities(userAddress);

      expect(result).toEqual([
        {
          communityAddress:
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
          creatorAddress: userAddress,
          isHidden: true
        }
      });
    });
  });

  describe('findJoinnedCommunities', () => {
    const userAddress = 'TEST_USER_ADDRESS';
    const mockCommunityAddresses = [
      { communityAddress: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA' }
    ];

    beforeEach(() => {
      prismaService.communityMember.findMany = jest.fn().mockResolvedValue(mockCommunityAddresses);
      prismaService.community.findMany = jest.fn().mockResolvedValue([mockPrismaResponse]);
    });

    it('should return all communities joined by a user', async () => {
      const result = await service.findJoinnedCommunities(userAddress);

      expect(result).toEqual([
        {
          communityAddress:
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
      expect(prismaService.communityMember.findMany).toHaveBeenCalledWith({
        where: { userAddress },
        select: { communityAddress: true }
      });
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
          communityAddress: {
            in: mockCommunityAddresses.map(community => community.communityAddress)
          }
        }
      });
    });
  });
});
