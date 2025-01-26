export class CreateCommunityDto {
  contractAddress: string;
  factoryAddress: string;
  name: string;
  description: string;
  creatorAddress: string;
  isHidden: boolean;
  blocktimestamp: Date;
  totalBadges: number;
  totalMembers: number;
  managers: string[];
}
