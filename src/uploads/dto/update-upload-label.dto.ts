import { IsString } from 'class-validator';

export class UpdateUploadLabelDto {
  @IsString()
  label: string;
}
