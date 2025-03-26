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
      communityAddress:
        'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
      factoryAddress:
        'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
      name: 'Test Community',
      description: 'Test Description',
      creatorAddress:
        'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY...',
      isHidden: false,
      blocktimestamp: new Date(),
      totalBadges: 10,
      totalMembers: 5,
      managers: [
        'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX',
        'GDZAP3QWXBZAPILZBCJ5LYIJYVXZSNJ4WCYCNHBQPQHCJX2RNXRUMMZN',
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
                  (c) => c.communityAddress === communityAddress,
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
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA';

    it('should return a single community when given a valid contract address', async () => {
      const result = await controller.findOne(validContractAddress);
      expect(result).toEqual(mockCommunities[0]);
      expect(service.findOne).toHaveBeenCalledWith(validContractAddress, undefined);
    });

    it('should throw NotFoundException when community is not found', async () => {
      const invalidAddress = 'INVALID_ADDRESS';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

      await expect(controller.findOne(invalidAddress)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(invalidAddress, undefined);
    });

    it('should handle special characters in contract address', async () => {
      const specialAddress =
        'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAA...';
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
      'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA';

    beforeEach(() => {
      service.updateVisibility = jest.fn().mockResolvedValue({
        ...mockCommunities[0],
        isHidden: true,
      });
    });

    it('should update community visibility', async () => {
      const result = await controller.updateVisibility(contractAddress, {
        isHidden: true,
      });

      expect(result.isHidden).toBe(true);
      expect(service.updateVisibility).toHaveBeenCalledWith(
        contractAddress,
        true,
      );
    });

    it('should throw NotFoundException when community not found', async () => {
      service.updateVisibility = jest.fn().mockResolvedValue(null);

      await expect(
        controller.updateVisibility(contractAddress, { isHidden: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMembers', () => {
    const contractAddress = 'TEST_CONTRACT_ADDRESS';
    const mockMembers = [
      {
        userAddress: 'USER_1',
        contractAddress,
        user: { userAddress: 'USER_1' }
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
    const contractAddress = 'TEST_CONTRACT_ADDRESS';
    const mockBadges = [
      {
        issuer: 'ISSUER_1',
        contractAddress,
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
    const userAddress = 'TEST_USER_ADDRESS';
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
    const userAddress = 'TEST_USER_ADDRESS';
    const mockHiddenCommunities = [{
      ...mockCommunities[0],
      isHidden: true
    }];

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
    const userAddress = 'TEST_USER_ADDRESS';
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
