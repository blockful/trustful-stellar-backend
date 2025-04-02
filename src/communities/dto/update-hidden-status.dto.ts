import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateHiddenStatusDto {
  @ApiProperty({
    description: 'Boolean flag to hide or show the community',
    example: true,
  })
  @IsBoolean()
  is_hidden: boolean;
}
