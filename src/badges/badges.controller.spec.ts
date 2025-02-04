import { Test, TestingModule } from '@nestjs/testing';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { BadgeDto } from './dto/badge.dto';

describe('BadgesController', () => {
  let controller: BadgesController;
  let service: BadgesService;

  const mockBadgesService = {
    findBadgesByType: jest.fn(),
    createBadge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BadgesController],
      providers: [
        {
          provide: BadgesService,
          useValue: mockBadgesService,
        },
      ],
    }).compile();

    controller = module.get<BadgesController>(BadgesController);
    service = module.get<BadgesService>(BadgesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findBadgesByType', () => {
    it('should return badges of a specific type', async () => {
      const mockBadges = [
        { id: 1, type: 'achievement', name: 'First Win' },
        { id: 2, type: 'achievement', name: 'Champion' },
      ];

      mockBadgesService.findBadgesByType.mockResolvedValue(mockBadges);

      const result = await controller.getBadgesByType('achievement');

      expect(result).toEqual(mockBadges);
      expect(service.findBadgesByType).toHaveBeenCalledWith('achievement');
    });
  });

  describe('createBadge', () => {
    it('should create a new badge', async () => {
      const badgeDto: BadgeDto = {
        type: 'achievement',
        name: 'New Badge',
        score: 100,
        issuer: '0x1234567890',
        contractAddress: '0x1234567890',
      };

      const mockCreatedBadge = {
        id: 1,
        ...badgeDto,
      };

      mockBadgesService.createBadge.mockResolvedValue(mockCreatedBadge);

      const result = await controller.createBadge(badgeDto);

      expect(result).toEqual(mockCreatedBadge);
      expect(service.createBadge).toHaveBeenCalledWith(badgeDto);
    });
  });
});
