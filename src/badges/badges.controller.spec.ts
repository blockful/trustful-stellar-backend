import { Test, TestingModule } from '@nestjs/testing';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { BadgeDto } from './dto/badge.dto';

describe('BadgesController', () => {
  let controller: BadgesController;
  let service: BadgesService;

  const mockBadgesService = {
    findBadgesByType: jest.fn(),
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

  describe('getBadgesByType', () => {
    const mockBadges = [
      { id: '1', type: 'achievement', name: 'First Win' },
      { id: '2', type: 'achievement', name: 'Champion' },
    ];

    beforeEach(() => {
      mockBadgesService.findBadgesByType.mockReset();
      mockBadgesService.findBadgesByType.mockResolvedValue(mockBadges);
    });

    it('should return badges when type is lowercase', async () => {
      const result = await controller.getBadgesByType('achievement');

      expect(result).toEqual(mockBadges);
      expect(service.findBadgesByType).toHaveBeenCalledWith('achievement');
    });

    it('should return badges when type is uppercase', async () => {
      const result = await controller.getBadgesByType('ACHIEVEMENT');

      expect(result).toEqual(mockBadges);
      expect(service.findBadgesByType).toHaveBeenCalledWith('achievement');
    });

    it('should return badges when type is mixed case', async () => {
      const result = await controller.getBadgesByType('AchIeVeMeNt');

      expect(result).toEqual(mockBadges);
      expect(service.findBadgesByType).toHaveBeenCalledWith('achievement');
    });
  });
});
