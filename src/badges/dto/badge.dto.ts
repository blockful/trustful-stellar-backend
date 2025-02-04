import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class BadgeDto {
  @ApiProperty({ description: 'Badge issuer address' })
  @IsNotEmpty()
  @IsString()
  issuer: string;

  @ApiProperty({ description: 'Community contract address' })
  @IsNotEmpty()
  @IsString()
  communityAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Badge type' })
  @IsString()
  type: string;
} 