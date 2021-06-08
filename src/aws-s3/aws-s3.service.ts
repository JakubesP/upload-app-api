import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import internal from 'stream';

@Injectable()
export class AwsS3Service {
  private s3: S3;

  constructor(private configService: ConfigService) {
    this.s3 = this.getS3();
  }

  // ---------------------------------------------------------------------------------------------

  async uploadObject(
    file: Buffer,
    bucket: string,
    name: string,
  ): Promise<void> {
    const params = {
      Bucket: bucket,
      Key: name,
      Body: file,
    };
    await this.s3.upload(params).promise();
  }

  // ---------------------------------------------------------------------------------------------

  async getObject(key: string, bucket: string): Promise<internal.Readable> {
    const params = {
      Key: key,
      Bucket: bucket,
    };

    try {
      await this.s3.headObject(params).promise();
    } catch (err) {
      switch (err.code) {
        case 'NotFound':
          throw new NotFoundException();
        default:
          throw new InternalServerErrorException();
      }
    }

    const stream = this.s3.getObject(params).createReadStream();
    return stream;
  }

  // ---------------------------------------------------------------------------------------------

  async deleteObject(key: string, bucket: string): Promise<void> {
    const params = {
      Key: key,
      Bucket: bucket,
    };
    await this.s3.deleteObject(params).promise();
  }

  // ---------------------------------------------------------------------------------------------

  async emptyDirectory(prefix: string, bucket: string): Promise<void> {
    const params = {
      Bucket: bucket,
      Prefix: prefix,
    };

    const listedObjects = await this.s3.listObjectsV2(params).promise();
    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {
      Bucket: bucket,
      Delete: { Objects: [] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key });
    });

    await this.s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) await this.emptyDirectory(prefix, bucket);
  }

  // ---------------------------------------------------------------------------------------------

  private getS3(): S3 {
    return new S3({
      accessKeyId: this.configService.get('AWS_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET'),
    });
  }
}
