import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CommunitiesRepository } from './repository/communities.repository';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let prismaService: PrismaService;
  let communitiesRepository: CommunitiesRepository;

  const mockPrismaResponse = {
    community_address:
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
    factory_address:
      'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
    name: 'Test Community',
    description: 'Test Description',
    icon: 'https://example.com/icon.png',
    creator_address: 'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
    is_hidden: false,
    blocktimestamp: new Decimal('1625097600000'),
    total_badges: 10,
    last_indexed_at: new Decimal('1625097600000'),
    _id: 'mock-uuid',
    id: 'mock-id',
    _block_range: '[1,)',
    users_badges_count: 0,
    users_points: 0
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
              findFirst: jest.fn().mockResolvedValue(mockPrismaResponse),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            communityMember: {
              findMany: jest.fn().mockResolvedValue([
                {
                  user_address: 'USER_1',
                  is_manager: true,
                  is_creator: true,
                  community_address: 'TEST_CONTRACT_ADDRESS',
                  last_indexed_at: { toString: () => '1625097600000' },
                  points: 100
                }
              ]),
              count: jest.fn().mockResolvedValue(5),
            },
            badge: {
              findMany: jest.fn().mockResolvedValue([
                {
                  issuer: 'ISSUER_1',
                  community_address: 'TEST_CONTRACT_ADDRESS',
                  name: 'Badge 1',
                  score: 100,
                  type: 'Custom',
                  created_at: null,
                  removed_at: null
                },
                {
                  issuer: 'ISSUER_2',
                  community_address: 'TEST_CONTRACT_ADDRESS',
                  name: 'Badge 2',
                  score: 50,
                  type: 'Stellar',
                  created_at: null,
                  removed_at: null
                }
              ]),
            },
            userBadge: {
              findMany: jest.fn().mockResolvedValue([
                {
                  user_address: 'TEST_USER_ADDRESS',
                  issuer: 'ISSUER_1',
                  community_address: 'TEST_CONTRACT_ADDRESS',
                  name: 'Badge 1',
                  created_at: null
                }
              ]),
            },
            $queryRawUnsafe: jest.fn().mockImplementation((query) => {
              if (query.includes('FROM communities')) {
                return [mockPrismaResponse];
              } else if (query.includes('FROM badges')) {
                return [{
                  id: 'badge-id',
                  issuer: 'ISSUER_1',
                  community_address: 'TEST_CONTRACT_ADDRESS',
                  name: 'Badge 1',
                  score: 100,
                  type: 'Custom',
                  created_at: null,
                  removed_at: null,
                  community_id: 'community-id',
                  _id: 'internal-id',
                  block_range_text: '[1,)'
                }];
              } else if (query.includes('FROM community_members')) {
                return [{
                  id: 'member-id',
                  user_address: 'USER_1',
                  is_manager: true,
                  is_creator: true,
                  community_address: 'TEST_CONTRACT_ADDRESS',
                  last_indexed_at: { toString: () => '1625097600000' },
                  points: 100,
                  user_id: 'user-id',
                  community_id: 'community-id',
                  _id: 'internal-id',
                  block_range_text: '[1,)'
                }];
              }
              return [];
            }),
          },
        },
        {
          provide: CommunitiesRepository,
          useValue: {
            getLatestCommunities: jest.fn().mockImplementation((communities) => {
              if (communities.length === 0) {
                return [];
              }
              return communities.map(community => ({...community}));
            }),
            getLatestBadges: jest.fn().mockImplementation((badges) => {
              if (badges.length === 0) {
                return [];
              }
              return [{
                id: 'badge-id',
                issuer: 'ISSUER_1',
                community_address: 'TEST_CONTRACT_ADDRESS',
                name: 'Badge 1',
                score: 100,
                type: 'Custom',
                created_at: null,
                removed_at: null,
                community_id: 'community-id',
                _id: 'internal-id',
                block_range_text: '[1,)'
              }];
            }),
            getLatestCommunityMembers: jest.fn().mockImplementation((members) => {
              if (members.length === 0) {
                return [];
              }
              return [{
                id: 'member-id',
                user_address: 'USER_1',
                is_manager: true,
                is_creator: true,
                community_address: 'TEST_CONTRACT_ADDRESS',
                last_indexed_at: { toString: () => '1625097600000' },
                points: 100,
                user_id: 'user-id',
                community_id: 'community-id',
                _id: 'internal-id',
                block_range_text: '[1,)'
              }];
            }),
          }
        }
      ],
    }).compile();

    service = module.get<CommunitiesService>(CommunitiesService);
    prismaService = module.get<PrismaService>(PrismaService);
    communitiesRepository = module.get<CommunitiesRepository>(CommunitiesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return transformed community data', async () => {
      const result = await service.findAll();

      expect(result[0]).toEqual(expect.objectContaining({
        community_address: mockPrismaResponse.community_address,
        factory_address: mockPrismaResponse.factory_address,
        name: mockPrismaResponse.name,
        description: mockPrismaResponse.description,
        creator_address: mockPrismaResponse.creator_address,
        is_hidden: mockPrismaResponse.is_hidden,
        total_badges: mockPrismaResponse.total_badges,
      }));

      expect(prismaService.community.findMany).toHaveBeenCalledWith({
        where: {
          is_hidden: false,
        },
        orderBy: {
          last_indexed_at: 'desc'
        }
      });
    });
  });

  describe('findOne', () => {
    const communityAddress =
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA';

    it('should return a specific community', async () => {
      prismaService.community.findMany = jest.fn().mockResolvedValue([mockPrismaResponse]);

      const result = await service.findOne(communityAddress);

      expect(result).toEqual(expect.objectContaining({
        community_address: mockPrismaResponse.community_address,
        factory_address: mockPrismaResponse.factory_address,
        name: mockPrismaResponse.name,
        description: mockPrismaResponse.description,
        creator_address: mockPrismaResponse.creator_address,
        is_hidden: mockPrismaResponse.is_hidden,
        total_badges: mockPrismaResponse.total_badges,
      }));

      expect(prismaService.community.findMany).toHaveBeenCalledWith({
        where: { community_address: communityAddress },
        orderBy: {
          last_indexed_at: 'desc'
        }
      });
    });

    it('should throw NotFoundException when community not found', async () => {
      prismaService.community.findMany = jest.fn().mockResolvedValue([]);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateVisibility', () => {
    const communityAddress =
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA';

    it('should update community visibility', async () => {
      prismaService.community.updateMany = jest.fn().mockResolvedValue({ count: 1 });
      
      prismaService.community.findMany = jest.fn().mockResolvedValue([{
        ...mockPrismaResponse,
        is_hidden: true,
      }]);

      const result = await service.updateVisibility(communityAddress, true);

      expect(result.is_hidden).toBe(true);
      expect(prismaService.community.updateMany).toHaveBeenCalledWith({
        where: { community_address: communityAddress },
        data: { is_hidden: true },
      });
    });

    it('should throw NotFoundException when community not found', async () => {
      prismaService.community.updateMany = jest.fn().mockResolvedValue({ count: 0 });

      await expect(
        service.updateVisibility(communityAddress, true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMembers', () => {
    const communityAddress = 'TEST_CONTRACT_ADDRESS';
    const mockMembers = [
      {
        user_address: 'USER_1',
        is_manager: true,
        is_creator: true,
        community_address: communityAddress,
        last_indexed_at: { toString: () => '1625097600000' },
        points: 100
      },
      {
        user_address: 'USER_2',
        is_manager: false,
        is_creator: false,
        community_address: communityAddress,
        last_indexed_at: { toString: () => '1625097600000' },
        points: 50
      }
    ];

    beforeEach(() => {
      prismaService.communityMember.findMany = jest.fn().mockResolvedValue(mockMembers);
      jest.spyOn(service, 'getUsersBadgeNumberAndPoints').mockResolvedValue({
        badges_count: 2,
        points: 100
      });
    });

    it('should return all members of a community', async () => {
      const result = await service.findMembers(communityAddress);

      expect(result.length).toEqual(1); // Only one from the queryRawUnsafe mock
      expect(result[0]).toHaveProperty('user_address', 'USER_1');
      expect(result[0]).toHaveProperty('is_manager', true);

      expect(prismaService.communityMember.findMany).toHaveBeenCalledWith({
        where: { community_address: communityAddress },
        orderBy: { last_indexed_at: 'desc' }
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

    beforeEach(() => {
      prismaService.badge.findMany = jest.fn().mockResolvedValue([
        {
          issuer: 'ISSUER_1',
          community_address: communityAddress,
          name: 'Badge 1',
          score: 100,
          type: 'Custom',
          created_at: null,
          removed_at: null
        }
      ]);
    });

    it('should return all badges of a community', async () => {
      const result = await service.findBadges(communityAddress);

      expect(result.total_badges).toBe(1);
      expect(result.community_badges[0].type).toEqual('Custom');

      expect(prismaService.badge.findMany).toHaveBeenCalledWith({
        where: { community_address: communityAddress },
        orderBy: {
          created_at: 'desc'
        }
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
    const mockCommunities = [mockPrismaResponse];

    beforeEach(() => {
      prismaService.community.findMany = jest.fn().mockResolvedValue(mockCommunities);
    });

    it('should return all communities created by a user', async () => {
      const result = await service.findCreatedCommunities(userAddress);

      expect(result).toEqual(mockCommunities);
      expect(prismaService.community.findMany).toHaveBeenCalledWith({
        where: { creator_address: userAddress },
        orderBy: {
          last_indexed_at: 'desc'
        }
      });
    });
  });

  describe('findHiddenCommunities', () => {
    const userAddress = 'TEST_USER_ADDRESS';
    const mockHiddenCommunities = [mockPrismaResponse];

    beforeEach(() => {
      prismaService.community.findMany = jest.fn().mockResolvedValue(mockHiddenCommunities);
    });

    it('should return all hidden communities for a user', async () => {
      const result = await service.findHiddenCommunities(userAddress);

      expect(result).toEqual(mockHiddenCommunities);
      expect(prismaService.community.findMany).toHaveBeenCalledWith({
        where: {
          creator_address: userAddress,
          is_hidden: true
        },
        orderBy: {
          last_indexed_at: 'desc'
        }
      });
    });
  });

  describe('findJoinnedCommunities', () => {
    const userAddress = 'TEST_USER_ADDRESS';
    const mockCommunityAddresses = [{
      user_address: userAddress,
      community_address: 'TEST_CONTRACT_ADDRESS',
      last_indexed_at: { toString: () => '1625097600000' }
    }];
    const mockCommunities = [mockPrismaResponse];

    beforeEach(() => {
      prismaService.communityMember.findMany = jest.fn().mockResolvedValue(mockCommunityAddresses);
      prismaService.community.findMany = jest.fn().mockResolvedValue(mockCommunities);
      prismaService.userBadge.findMany = jest.fn().mockResolvedValue([
        { user_address: userAddress, community_address: 'TEST_CONTRACT_ADDRESS' },
        { user_address: userAddress, community_address: 'TEST_CONTRACT_ADDRESS' }
      ]);
      
      jest.spyOn(service, 'getUsersBadgeNumberAndPoints').mockImplementation(
        async (userAddr, communityAddr) => {
          expect(userAddr).toBe(userAddress);
          expect(communityAddr).toBe('TEST_CONTRACT_ADDRESS');
          return { badges_count: 2, points: 100 };
        }
      );
      
      communitiesRepository.getLatestCommunities = jest.fn().mockResolvedValue([{
        ...mockPrismaResponse,
        community_address: 'TEST_CONTRACT_ADDRESS',
        users_badges_count: 2,
        users_points: 100
      }]);
    });

    it('should return all communities joined by a user', async () => {
      const result = await service.findJoinnedCommunities(userAddress);
      expect(result[0].users_badges_count).toBe(2);
      expect(result[0].users_points).toBe(100);
      expect(prismaService.communityMember.findMany).toHaveBeenCalledWith({
        where: { user_address: userAddress },
        orderBy: { last_indexed_at: 'desc' }
      });
    });
  });

  describe('findUserBadges', () => {
    const userAddress = 'TEST_USER_ADDRESS';
    const mockUserBadges = [
      {
        user_address: userAddress,
        issuer: 'ISSUER_1',
        community_address: 'TEST_CONTRACT_ADDRESS',
        name: 'Badge 1',
        created_at: null,
        badge_id: 'badge-id-1',
        community_id: 'community-id-1',
        community_member_id: 'community-member-id-1'
      }
    ];

    beforeEach(() => {
      prismaService.userBadge.findMany = jest.fn().mockResolvedValue(mockUserBadges);
    });

    it('should return all badges of a user', async () => {
      const result = await service.findUserBadges(userAddress);

      expect(result[0].user_address).toEqual(userAddress);
      expect(result[0].issuer).toEqual('ISSUER_1');
      expect(result[0].community_address).toEqual('TEST_CONTRACT_ADDRESS');
      expect(result[0].name).toEqual('Badge 1');
      expect(result[0].badge_id).toEqual('badge-id-1');
      expect(result[0].community_id).toEqual('community-id-1');
      expect(result[0].community_member_id).toEqual('community-member-id-1');

      expect(prismaService.userBadge.findMany).toHaveBeenCalledWith({
        where: { user_address: userAddress }
      });
    });

    it('should throw NotFoundException when no badges are found', async () => {
      prismaService.userBadge.findMany = jest.fn().mockResolvedValue([]);

      await expect(service.findUserBadges(userAddress))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('getLatestCommunities', () => {
    it('should return only the most recent version of each community', async () => {
      const mockCommunities = [
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          last_indexed_at: new Decimal('1000'),
          name: 'Old Version'
        },
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          last_indexed_at: new Decimal('2000'),
          name: 'New Version'
        },
        {
          ...mockPrismaResponse,
          community_address: 'community2',
          last_indexed_at: new Decimal('1500'),
          name: 'Another Community'
        }
      ];

      communitiesRepository.getLatestCommunities = jest.fn().mockResolvedValue([
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          name: 'New Version',
          block_range_text: '[1,)'
        },
        {
          ...mockPrismaResponse,
          community_address: 'community2',
          name: 'Another Community',
          block_range_text: '[1,)'
        }
      ]);

      jest.spyOn(prismaService.community, 'findMany').mockResolvedValue(mockCommunities);
      prismaService.communityMember.count = jest.fn().mockResolvedValue(5);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      const community1 = result.find(c => c.community_address === 'community1');
      expect(community1.name).toBe('New Version');
      const community2 = result.find(c => c.community_address === 'community2');
      expect(community2.name).toBe('Another Community');
    });

    it('should handle communities with same last_indexed_at timestamp', async () => {
      const mockCommunities = [
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          last_indexed_at: new Decimal('1000'),
          name: 'First Entry'
        },
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          last_indexed_at: new Decimal('1000'),
          name: 'Second Entry'
        }
      ];
      
      communitiesRepository.getLatestCommunities = jest.fn().mockResolvedValue([
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          name: 'Second Entry',
          block_range_text: '[1,)'
        }
      ]);
      
      jest.spyOn(prismaService.community, 'findMany').mockResolvedValue(mockCommunities);
      prismaService.communityMember.count = jest.fn().mockResolvedValue(5);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Second Entry');
    });

    it('should handle empty communities array', async () => {
      jest.spyOn(prismaService.community, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });

    it('should handle single community', async () => {
      const singleCommunity = {
        ...mockPrismaResponse,
        community_address: 'community1',
        last_indexed_at: new Decimal('1000'),
        name: 'Single Community'
      };
      prismaService.$queryRawUnsafe = jest.fn().mockResolvedValue([
        {
          ...mockPrismaResponse,
          community_address: 'community1',
          name: 'Single Community',
          block_range_text: '[1,)'
        }
      ]);

      jest.spyOn(prismaService.community, 'findMany').mockResolvedValue([singleCommunity]);
      prismaService.communityMember.count = jest.fn().mockResolvedValue(5);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Single Community');
    });
  });
});
