import { Test, TestingModule } from '@nestjs/testing';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { PrismaService } from '../prisma.service';

describe('CommunitiesController', () => {
  let controller: CommunitiesController;
  let service: CommunitiesService;

  const mockCommunities: CreateCommunityDto[] = [
    {
      contractAddress: 'CB5DQK...',
      factoryAddress: 'CCYDNAOV...',
      name: 'Test Community',
      description: 'Test Description',
      creatorAddress: 'GBVNNPO...',
      isHidden: false,
      blocktimestamp: new Date(),
      totalBadges: 10,
      totalMembers: 5,
      managers: ['GDUMR...', 'GDZAP3...'],
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
  });
});
