import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CommunitiesController', () => {
  let controller: CommunitiesController;
  let service: CommunitiesService;

  const mockCommunities: CreateCommunityDto[] = [
    {
      community_address:
        'cb5dqk6ddwrjhpwjhypqgfk4f4k7yzhx7iht6i4ico4pvifqb4rqaaaaaaaaaaaaaaaa',
      factory_address:
        'ccydnaovwshzuhdmxbpkpqhw4fh44p26ngvfayunpwpunwpsxapbaaaaaaaaaaaaaaa',
      name: 'Test Community',
      description: 'Test Description',
      creator_address:
        'gbvnnpofvv2ynxsqxdjpbvqyy7wjlhgpmlxzlhbz3y6hlkxqgfbpbzry...',
      is_hidden: false,
      blocktimestamp: new Date(),
      total_badges: 10,
      total_members: 5,
      managers: [
        'gdumr3gdvkyamabgvoqhvknwmxhvykzltwwqcdzv7gzvwpjvjaxkhxfx',
        'gdzap3qwxbzapilzbcj5lyijyvxzsjn4wcycnhbqpqhcjx2rnxrummzn',
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunitiesController],
      providers: [
        {
          provide: CommunitiesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockCommunities),
            findOne: jest.fn().mockImplementation((communityAddress) => {
              return Promise.resolve(
                mockCommunities.find(
                  (c) => c.community_address === communityAddress,
                ) || null,
              );
            }),
            findMembers: jest.fn(),
            findBadges: jest.fn(),
            findCreatedCommunities: jest.fn(),
            findHiddenCommunities: jest.fn(),
            findJoinnedCommunities: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CommunitiesController>(CommunitiesController);
    service = module.get<CommunitiesService>(CommunitiesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of communities', async () => {
      const result = await controller.findAll();
      expect(result).toEqual(mockCommunities);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return an empty array when no communities exist', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const validContractAddress =
      'cb5dqk6ddwrjhpwjhypqgfk4f4k7yzhx7iht6i4ico4pvifqb4rqaaaaaaaaaaaaaaaa';

    it('should return a single community when given a valid contract address', async () => {
      const result = await controller.findOne(validContractAddress);
      expect(result).toEqual(mockCommunities[0]);
      expect(service.findOne).toHaveBeenCalledWith(validContractAddress, undefined);
    });

    it('should throw NotFoundException when community is not found', async () => {
      const invalidAddress = 'invalid_address';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

      await expect(controller.findOne(invalidAddress)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(invalidAddress, undefined);
    });

    it('should handle special characters in contract address', async () => {
      const specialAddress =
        'cb5dqk6ddwrjhpwjhypqgfk4f4k7yzhx7iht6i4ico4pvifqb4rqaa...';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

      await expect(controller.findOne(specialAddress)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(specialAddress, undefined);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      jest
        .spyOn(service, 'findAll')
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('updateVisibility', () => {
    const contractAddress =
      'cb5dqk6ddwrjhpwjhypqgfk4f4k7yzhx7iht6i4ico4pvifqb4rqaaaaaaaaaaaaaaaa';

    beforeEach(() => {
      service.updateVisibility = jest.fn().mockResolvedValue({
        ...mockCommunities[0],
        is_hidden: true,
      });
    });

    it('should update community visibility', async () => {
      const result = await controller.updateVisibility(contractAddress, {
        is_hidden: true,
      });

      expect(result.is_hidden).toBe(true);
      expect(service.updateVisibility).toHaveBeenCalledWith(
        contractAddress,
        true,
      );
    });

    it('should throw NotFoundException when community not found', async () => {
      service.updateVisibility = jest.fn().mockResolvedValue(null);

      await expect(
        controller.updateVisibility(contractAddress, { is_hidden: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMembers', () => {
    const contractAddress = 'test_contract_address';
    const mockMembers = [
      {
        user_address: 'user_1',
        community_address: contractAddress,
        user: { user_address: 'user_1' }
      }
    ];

    beforeEach(() => {
      service.findMembers = jest.fn().mockResolvedValue(mockMembers);
    });

    it('should return members of a community', async () => {
      const result = await controller.getMembers(contractAddress);
      expect(result).toEqual(mockMembers);
      expect(service.findMembers).toHaveBeenCalledWith(contractAddress);
    });
  });

  describe('getBadges', () => {
    const contractAddress = 'test_contract_address';
    const mockBadges = [
      {
        issuer: 'issuer_1',
        community_address: contractAddress,
        name: 'Badge 1',
        score: 100
      }
    ];

    beforeEach(() => {
      service.findBadges = jest.fn().mockResolvedValue(mockBadges);
    });

    it('should return badges of a community', async () => {
      const result = await controller.findBadges(contractAddress);
      expect(result).toEqual(mockBadges);
      expect(service.findBadges).toHaveBeenCalledWith(contractAddress, undefined);
    });
  });

  describe('getCreatedCommunities', () => {
    const userAddress = 'test_user_address';
    const mockCreatedCommunities = [mockCommunities[0]];

    beforeEach(() => {
      service.findCreatedCommunities = jest.fn().mockResolvedValue(mockCreatedCommunities);
    });

    it('should return communities created by a user', async () => {
      const result = await controller.getCreatedCommunities(userAddress);
      expect(result).toEqual(mockCreatedCommunities);
      expect(service.findCreatedCommunities).toHaveBeenCalledWith(userAddress);
    });
  });

  describe('getHiddenCommunities', () => {
    const userAddress = 'test_user_address';
    const mockHiddenCommunities = [mockCommunities[0]];

    beforeEach(() => {
      service.findHiddenCommunities = jest.fn().mockResolvedValue(mockHiddenCommunities);
    });

    it('should return hidden communities for a user', async () => {
      const result = await controller.getHiddenCommunities(userAddress);
      expect(result).toEqual(mockHiddenCommunities);
      expect(service.findHiddenCommunities).toHaveBeenCalledWith(userAddress);
    });
  });

  describe('getJoinedCommunities', () => {
    const userAddress = 'test_user_address';
    const mockJoinedCommunities = [mockCommunities[0]];

    beforeEach(() => {
      service.findJoinnedCommunities = jest.fn().mockResolvedValue(mockJoinedCommunities);
    });

    it('should return communities joined by a user', async () => {
      const result = await controller.getJoinedCommunities(userAddress);
      expect(result).toEqual(mockJoinedCommunities);
      expect(service.findJoinnedCommunities).toHaveBeenCalledWith(userAddress);
    });
  });
});
