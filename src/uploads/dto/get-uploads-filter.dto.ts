import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetUploadsFilterDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number.parseInt(value))
  skip: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Transform(({ value }) => Number.parseInt(value))
  take: number;

  @IsOptional()
  @IsString()
  search: number;
}
