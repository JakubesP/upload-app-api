import { User } from '../auth/user.entity';
import { CreatedStatus } from '../created-status.enum';
import { EntityRepository, Like, Repository } from 'typeorm';
import { Upload } from './upload.entity';
import { UploadDto } from './dto/upload.dto';
import { GetUploadsFilterDto } from './dto/get-uploads-filter.dto';
import { RecordsList } from '../records-list.interface';

@EntityRepository(Upload)
export class UploadRepository extends Repository<Upload> {
  async createUpload(
    key: string,
    url: string,
    uploadDto: UploadDto,
    user: User,
  ): Promise<[CreatedStatus, Upload]> {
    const { label } = uploadDto;
    const upload = this.create({ url, user, key, label });
    try {
      await this.save(upload);
      return [CreatedStatus.SUCCESS, upload];
    } catch (error) {
      if (error.code === '23505') {
        return [CreatedStatus.CONFLICT, null];
      }
      return [CreatedStatus.ERROR, null];
    }
  }

  // ---------------------------------------------------------------------------------------------

  async getUploads(
    filterDto: GetUploadsFilterDto,
    user: User,
  ): Promise<RecordsList<Upload>> {
    const where: any = {};
    where.user = user;
    if (filterDto.search) {
      where.label = Like(`%${filterDto.search}%`);
    }

    const [records, total] = await this.findAndCount({
      where,
      order: { label: 'ASC' },
      take: filterDto.take ?? 50,
      skip: filterDto.skip ?? 0,
    });

    return {
      total,
      data: records,
    };
  }
}
