import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ description: 'Community unique identifier' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Community name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Community description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Community issuer address' })
  @IsNotEmpty()
  @IsString()
  issuer: string;

  @ApiProperty({ description: 'Whether the community is hidden', required: false })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean = false;

  @ApiProperty({ description: 'Total number of members in the community' })
  @IsNumber()
  totalMembers: number;

  @ApiProperty({ description: 'List of manager addresses' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  managers: string[] = [];
}