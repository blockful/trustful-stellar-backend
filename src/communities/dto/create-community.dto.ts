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
  community_address: string;

  @ApiProperty({ description: 'Soroban factory contract address' })
  @IsNotEmpty()
  @IsString()
  factory_address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'URL or path to the community icon', required: false })
  @IsString()
  icon?: string;

  @ApiProperty({ description: 'Stellar address of the community creator' })
  @IsNotEmpty()
  @IsString()
  creator_address: string;

  @ApiProperty()
  @IsBoolean()
  is_hidden: boolean;

  @ApiProperty()
  blocktimestamp: Date;

  @ApiProperty({
    description: 'Total number of badges defined in the contract',
  })
  @IsNumber()
  total_badges: number;

  @ApiProperty()
  @IsNumber()
  total_members: number;

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
  is_joined?: boolean;
}
