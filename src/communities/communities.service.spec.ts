import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../prisma.service';

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let prismaService: PrismaService;

  const mockPrismaResponse = {
    contractAddress: 'CB5DQK...',
    factoryAddress: 'CCYDNAOV...',
    name: 'Test Community',
    description: 'Test Description',
    creatorAddress: 'GBVNNPO...',
    isHidden: false,
    blocktimestamp: new Date(),
    totalBadges: 10,
    _count: {
      members: 5,
    },
    managers: [{ managerAddress: 'GDUMR...' }, { managerAddress: 'GDZAP3...' }],
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
          contractAddress: '0x123',
          factoryAddress: '0x456',
          name: 'Test Community',
          description: 'Test Description',
          creatorAddress: '0x789',
          isHidden: false,
          blocktimestamp: expect.any(Date),
          totalBadges: 10,
          totalMembers: 5,
          managers: ['0xabc', '0xdef'],
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
