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
      contractAddress:
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
            findOne: jest.fn().mockImplementation((contractAddress) => {
              return Promise.resolve(
                mockCommunities.find(
                  (c) => c.contractAddress === contractAddress,
                ) || null,
              );
            }),
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
      expect(service.findOne).toHaveBeenCalledWith(validContractAddress);
    });

    it('should throw NotFoundException when community is not found', async () => {
      const invalidAddress = 'INVALID_ADDRESS';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

      await expect(controller.findOne(invalidAddress)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(invalidAddress);
    });

    it('should handle special characters in contract address', async () => {
      const specialAddress =
        'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAA...';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(null);

      await expect(controller.findOne(specialAddress)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(specialAddress);
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
});
