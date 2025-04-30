import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { BadgeDto } from './dto/badge.dto';

describe('BadgesService', () => {
  let service: BadgesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    badge: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    userBadge: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBadgesByType', () => {
    beforeEach(() => {
      mockPrismaService.badge.findMany.mockReset();
    });

    it('should return unique badges based on issuer and name', async () => {
      const mockBadges = [
        { 
          id: '1', 
          type: 'achievement', 
          name: 'SQL Master', 
          issuer: 'issuer1',
          community_address: 'community1',
          score: 10
        },
        { 
          id: '2', 
          type: 'achievement', 
          name: 'SQL Master', 
          issuer: 'issuer1',
          community_address: 'community2',
          score: 10
        },
        { 
          id: '3', 
          type: 'achievement', 
          name: 'SQL Master', 
          issuer: 'issuer2',
          community_address: 'community1',
          score: 15
        },
      ];

      mockPrismaService.badge.findMany.mockResolvedValueOnce(mockBadges);

      const result = await service.findBadgesByType('achievement');

      expect(result).toHaveLength(2);
      
      const uniquePairs = new Set(result.map(badge => `${badge.issuer}_${badge.name}`));
      expect(uniquePairs.size).toBe(2);

      expect(result).toContainEqual(expect.objectContaining({
        name: 'SQL Master',
        issuer: 'issuer1'
      }));

      expect(result).toContainEqual(expect.objectContaining({
        name: 'SQL Master',
        issuer: 'issuer2'
      }));
    });

    it('should throw NotFoundException with available types when type is not found', async () => {
      // Mock empty result for the requested type
      mockPrismaService.badge.findMany
        .mockResolvedValueOnce([]) // First call returns empty for the type search
        .mockResolvedValueOnce([   // Second call returns available types
          { type: 'achievement' },
          { type: 'skill' },
          { type: 'certification' }
        ]);

      await expect(service.findBadgesByType('nonexistent'))
        .rejects
        .toThrow(new NotFoundException(
          'Type "nonexistent" not found. Available types are: achievement, skill, certification'
        ));
    });
  });
});
