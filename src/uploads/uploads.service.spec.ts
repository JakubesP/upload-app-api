import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { UploadRepository } from './upload.repository';
import { UploadsService } from './uploads.service';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DBSavedStatus } from '../created-status.enum';
import { Upload } from './upload.entity';
import { ServerInfo } from './server-info.interface';
import { File } from './file.interface';
import { UploadDto } from './dto/upload.dto';
import { GetUploadsFilterDto } from './dto/get-uploads-filter.dto';

// ---------------------------------------------------------------------------------------------

const mockUploadRepository = () => ({
  createUpload: jest.fn(),
  findOne: jest.fn(),
  getUploads: jest.fn(),
  remove: jest.fn(),
  saveUpload: jest.fn(),
});

const mockConfigService = () => ({
  get: () => '[s3 bucket name]',
});

const mockAwsS3Service = () => ({
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
});

// ---------------------------------------------------------------------------------------------

const mockUuid = '175c20e8-5454-4e1d-92ba-7c993d3e3589';

const mockFile: File = {
  originalname: 'filename.extension',
  buffer: Buffer.from([]),
};

const mockRequest: ServerInfo = {
  protocol: 'http',
  host: '[servername]',
};

const mockUploadDto: UploadDto = {
  label: '[some label]',
};

// ---------------------------------------------------------------------------------------------

describe('UploadsService', () => {
  let service: UploadsService;
  let repository: any;
  let s3Service: any;
  let mockUser: any;

  let mockUpload: Upload;

  beforeEach(async () => {
    mockUser = {
      id: mockUuid,
      email: 'test@example.com',
      assword: '[hashed password]',
      uploads: [],
    };

    mockUpload = {
      id: mockUuid,
      key: '[some key]',
      url: '[some url]',
      label: '[some label]',
      user: mockUser,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: UploadRepository, useFactory: mockUploadRepository },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: AwsS3Service, useFactory: mockAwsS3Service },
      ],
    }).compile();

    service = module.get(UploadsService);
    repository = module.get(UploadRepository);
    s3Service = module.get(AwsS3Service);
  });

  // ---------------------------------------------------------------------------------------------

  describe('upload', () => {
    it('throw-BadRequestException__if__file-is-not-provided', async () => {
      await expect(
        service.upload(undefined, mockUploadDto, mockUser, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('return-Upload-instance__if__UploadRepository.createUload-return-DBSavedStatus.SUCCESS', async () => {
      repository.createUpload.mockResolvedValue([
        DBSavedStatus.SUCCESS,
        mockUpload,
      ]);
      s3Service.uploadObject.mockResolvedValue(undefined);
      const result = await service.upload(
        mockFile,
        mockUploadDto,
        mockUser,
        mockRequest,
      );
      expect(result).toMatchObject(mockUpload);
    });

    it('throw-ConflictException__if__UploadRepository.createUload-return-DBSavedStatus.CONFLICT', async () => {
      repository.createUpload.mockResolvedValue([DBSavedStatus.CONFLICT, null]);
      s3Service.uploadObject.mockResolvedValue(undefined);
      await expect(
        service.upload(mockFile, mockUploadDto, mockUser, mockRequest),
      ).rejects.toThrow(ConflictException);
    });

    it('throw-InternalServerErrorException__if__UploadRepository.createUload-return-DBSavedStatus.ERROR', async () => {
      repository.createUpload.mockResolvedValue([DBSavedStatus.ERROR, null]);
      s3Service.uploadObject.mockResolvedValue(undefined);
      await expect(
        service.upload(mockFile, mockUploadDto, mockUser, mockRequest),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ---------------------------------------------------------------------------------------------

  describe('getUploads', () => {
    it('return-array-of-Uploads', async () => {
      repository.getUploads.mockResolvedValue([]);
      const mockFilterDto: GetUploadsFilterDto = {
        skip: undefined,
        take: undefined,
        search: undefined,
      };
      const result = await service.getUploads(mockFilterDto, mockUser);
      expect(result).toMatchObject([]);
    });
  });

  // ---------------------------------------------------------------------------------------------

  describe('getUpload', () => {
    it('return-Upload-instance__if__UploadRepository.findOne-return-Upload-instance', async () => {
      repository.findOne.mockResolvedValue(mockUpload);
      const result = await service.getUpload(mockUuid, mockUser);
      expect(result).toMatchObject(mockUpload);
    });

    it('throw-NotFoundException__if__UploadRepository.findOne-return-null', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.getUpload(mockUuid, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------------------------

  describe('deleteUpload', () => {
    it('return-nothing__if__UploadRepository.findOne-return-Upload-instance', async () => {
      repository.findOne.mockResolvedValue(mockUpload);
      repository.remove.mockResolvedValue(undefined);
      s3Service.deleteObject.mockResolvedValue(undefined);

      const result = await service.deleteUpload(mockUuid, mockUser);
      expect(result).toBe(undefined);
    });

    it('throw-NotFoundException__if__UploadRepository.findOne-return-null', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.remove.mockResolvedValue(undefined);
      s3Service.deleteObject.mockResolvedValue(undefined);

      await expect(service.deleteUpload(mockUuid, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------------------------

  describe('updateUploadLabel', () => {
    it('throw-NotFoundException__if__UploadRepository.findOne-return-null', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(
        service.updateUploadLabel(mockUuid, '[some label]', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('return-Upload-instance__if__UploadRepository.saveUpload-return-DBSavedStatus.SUCCESS', async () => {
      repository.findOne.mockResolvedValue(mockUpload);
      repository.saveUpload.mockResolvedValue([
        DBSavedStatus.SUCCESS,
        mockUpload,
      ]);
      const result = await service.updateUploadLabel(
        mockUuid,
        '[some label]',
        mockUser,
      );

      const mockReturnUpload: Upload = { ...mockUpload };
      mockReturnUpload.label = '[some label]';

      expect(result).toMatchObject(mockReturnUpload);
    });

    it('throw-InternalServerErrorException__if__UploadRepository.saveUpload-return-DBSavedStatus.ERROR', async () => {
      repository.findOne.mockResolvedValue(mockUpload);
      repository.saveUpload.mockResolvedValue([DBSavedStatus.ERROR, null]);
      await expect(
        service.updateUploadLabel(mockUuid, '[some label]', mockUser),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
