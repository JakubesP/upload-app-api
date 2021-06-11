import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { CreatedStatus } from '../created-status.enum';
import { v4 as uuid } from 'uuid';
import { Upload } from './upload.entity';
import { UploadRepository } from './upload.repository';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import internal from 'stream';
import { File } from './file.interface';
import { ServerInfo } from './server-info.interface';
import { UploadDto } from './dto/upload.dto';
import { GetUploadsFilterDto } from './dto/get-uploads-filter.dto';
import { RecordsList } from '../records-list.interface';

@Injectable()
export class UploadsService {
  private readonly bucketS3: string;

  constructor(
    @InjectRepository(UploadRepository)
    private uploadRepository: UploadRepository,
    private configService: ConfigService,
    private awsS3Service: AwsS3Service,
  ) {
    this.bucketS3 = this.configService.get('AWS_BUCKET_NAME');
  }

  // ---------------------------------------------------------------------------------------------

  async upload(
    file: File,
    uploadDto: UploadDto,
    user: User,
    request: ServerInfo,
  ): Promise<Upload> {
    if (!file) {
      throw new BadRequestException('"file" field is required');
    }

    const fileExtension = file.originalname.split('.')[1] || '';
    const fileName = `${uuid()}.${fileExtension}`;
    const uploadFileName = `${user.id}/${fileName}`;
    await this.awsS3Service.uploadObject(
      file.buffer,
      this.bucketS3,
      uploadFileName,
    );

    const fileUrl = `${request.protocol}://${request.host}/uploads/file/${fileName}`;

    const [createdStatus, upload] = await this.uploadRepository.createUpload(
      uploadFileName,
      fileUrl,
      uploadDto,
      user,
    );

    if (createdStatus === CreatedStatus.ERROR) {
      throw new InternalServerErrorException();
    }

    if (createdStatus === CreatedStatus.CONFLICT) {
      throw new ConflictException('Invalid label');
    }

    return upload;
  }

  // ---------------------------------------------------------------------------------------------

  getFile(file: string, user: User): Promise<internal.Readable> {
    const key = `${user.id}/${file}`;
    return this.awsS3Service.getObject(key, this.bucketS3);
  }

  // ---------------------------------------------------------------------------------------------

  getUploads(
    filterDto: GetUploadsFilterDto,
    user: User,
  ): Promise<RecordsList<Upload>> {
    return this.uploadRepository.getUploads(filterDto, user);
  }

  // ---------------------------------------------------------------------------------------------

  async deleteUpload(id: string, user: User): Promise<void> {
    const upload = await this.getUpload(id, user);
    const key = upload.key;
    await this.awsS3Service.deleteObject(key, this.bucketS3);
    await this.uploadRepository.remove([upload]);
  }

  // ---------------------------------------------------------------------------------------------

  async getUpload(id: string, user: User): Promise<Upload> {
    const upload = await this.uploadRepository.findOne({ id, user });
    if (!upload) {
      throw new NotFoundException();
    }
    return upload;
  }
}
