import { User } from '../auth/user.entity';
import { DBSavedStatus } from '../created-status.enum';
import { EntityRepository, Like, Repository } from 'typeorm';
import { Upload } from './upload.entity';
import { UploadDto } from './dto/upload.dto';
import { GetUploadsFilterDto } from './dto/get-uploads-filter.dto';
import { RecordsList } from '../records-list.interface';

@EntityRepository(Upload)
export class UploadRepository extends Repository<Upload> {
  createUpload(
    key: string,
    url: string,
    uploadDto: UploadDto,
    user: User,
  ): Promise<[DBSavedStatus, Upload]> {
    const { label } = uploadDto;
    const upload = this.create({ url, user, key, label });
    return this.saveUpload(upload);
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

  // ---------------------------------------------------------------------------------------------

  async saveUpload(upload: Upload): Promise<[DBSavedStatus, Upload]> {
    try {
      await this.save(upload);
      return [DBSavedStatus.SUCCESS, upload];
    } catch (error) {
      if (error.code === '23505') {
        return [DBSavedStatus.CONFLICT, null];
      }
      return [DBSavedStatus.ERROR, null];
    }
  }
}
