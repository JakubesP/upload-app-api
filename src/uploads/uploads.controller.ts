import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/user.entity';
import { Upload } from './upload.entity';
import { UploadsService } from './uploads.service';
import { Request, Response } from 'express';
import { File } from './file.interface';
import { UploadDto } from './dto/upload.dto';
import { GetUploadsFilterDto } from './dto/get-uploads-filter.dto';
import { RecordsList } from '../records-list.interface';

@UseGuards(AuthGuard())
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  // ---------------------------------------------------------------------------------------------

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: File,
    @Body() uploadDto: UploadDto,
    @GetUser() user: User,
    @Req() request: Request,
  ): Promise<Upload> {
    return this.uploadsService.upload(file, uploadDto, user, {
      protocol: request.protocol,
      host: request.get('host'),
    });
  }

  // ---------------------------------------------------------------------------------------------

  @Get()
  getUploads(
    @Query() filterDto: GetUploadsFilterDto,
    @GetUser() user: User,
  ): Promise<RecordsList<Upload>> {
    return this.uploadsService.getUploads(filterDto, user);
  }

  // ---------------------------------------------------------------------------------------------

  @Get('file/:file')
  async getFile(
    @GetUser() user: User,
    @Res() res: Response,
    @Param('file') file: string,
  ): Promise<void> {
    const stream = await this.uploadsService.getFile(file, user);
    stream.on('error', () => {
      const error = new InternalServerErrorException();
      res.status(error.getStatus()).json(error.getResponse());
    });
    stream.pipe(res);
  }

  // ---------------------------------------------------------------------------------------------

  @Get('/:id')
  async getUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<Upload> {
    return this.uploadsService.getUpload(id, user);
  }

  // ---------------------------------------------------------------------------------------------

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/:id')
  async deleteUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.uploadsService.deleteUpload(id, user);
  }
}
