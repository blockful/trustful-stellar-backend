import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ description: 'Soroban contract address for the community' })
  @IsNotEmpty()
  @IsString()
  communityAddress: string;

  @ApiProperty({ description: 'Soroban factory contract address' })
  @IsNotEmpty()
  @IsString()
  factoryAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Stellar address of the community creator' })
  @IsNotEmpty()
  @IsString()
  creatorAddress: string;

  @ApiProperty()
  @IsBoolean()
  isHidden: boolean;

  @ApiProperty()
  blocktimestamp: Date;

  @ApiProperty({
    description: 'Total number of badges defined in the contract',
  })
  @IsNumber()
  totalBadges: number;

  @ApiProperty()
  @IsNumber()
  totalMembers: number;

  @ApiProperty({
    description: 'Array of Stellar addresses for community managers',
  })
  @IsArray()
  @IsString({ each: true })
  managers: string[];

  @ApiProperty({
    description: 'Whether the user is a member of this community',
    required: false
  })
  @IsBoolean()
  isJoined?: boolean;
}
