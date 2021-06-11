import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DBSavedStatus } from '../created-status.enum';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------------------------

const mockUserRepository = () => ({
  createUser: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

const mockAwsS3Service = () => ({
  emptyDirectory: jest.fn(),
});

const mockConfigService = () => ({
  get: jest.fn(),
});

// ---------------------------------------------------------------------------------------------

const mockSignupDto: SignupDto = {
  email: 'test@example.com',
  password: 'abcABC123!',
  passwordConfirmation: 'abcABC123!',
};

const mockSigninDto: SigninDto = {
  email: 'test@example.com',
  password: 'abcABC123!',
};

let mockUser: User;

// ---------------------------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;
  let repository: any;
  let jwtService: any;
  let s3Service: any;
  let configService: any;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(
      mockSigninDto.password,
      await bcrypt.genSalt(),
    );

    mockUser = {
      id: '057c2b99-0a5f-4de6-be04-b1299d78878e',
      email: 'test@example.com',
      password: hashedPassword,
      uploads: [],
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: AwsS3Service, useFactory: mockAwsS3Service },
      ],
    }).compile();

    service = module.get(AuthService);
    repository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    s3Service = module.get(AwsS3Service);
    configService = module.get(ConfigService);
  });

  // ---------------------------------------------------------------------------------------------

  describe('signup', () => {
    it('return-object-with-accessToken-field__if__UserRepository.createUser-return-DBSavedStatus.SUCCESS', async () => {
      repository.createUser.mockResolvedValue([
        DBSavedStatus.SUCCESS,
        mockUser,
      ]);
      jwtService.sign.mockReturnValue('[token]');

      const result = await service.signup(mockSignupDto);
      expect(result).toMatchObject({ accessToken: '[token]' });
    });

    it('throw-ConflictException__if__UserRepository.createUser-return-DBSavedStatus.CONFLICT', async () => {
      repository.createUser.mockResolvedValue([DBSavedStatus.CONFLICT, null]);
      await expect(service.signup(mockSignupDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throw-InternalServerErrorException__if__UserRepository.createUser-return-DBSavedStatus.ERROR', async () => {
      repository.createUser.mockResolvedValue([DBSavedStatus.ERROR, null]);
      await expect(service.signup(mockSignupDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ---------------------------------------------------------------------------------------------

  describe('signin', () => {
    it('return-object-with-accessToken-field__if__credentials-correct', async () => {
      repository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('[token]');

      const result = await service.signin(mockSigninDto);
      expect(result).toMatchObject({ accessToken: '[token]' });
    });

    it('throw-UnauthorizedException__if__email-incorrect', async () => {
      repository.findOne.mockResolvedValue(null);
      jwtService.sign.mockReturnValue('[token]');
      await expect(service.signin(mockSigninDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throw-UnauthorizedException__if__password-incorrect', async () => {
      const mockUser: User = {
        id: '057c2b99-0a5f-4de6-be04-b1299d78878e',
        email: 'test@example.com',
        password: '[invalid password]',
        uploads: [],
      };
      repository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('[token]');
      await expect(service.signin(mockSigninDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ---------------------------------------------------------------------------------------------

  describe('deleteCurrentUser', () => {
    it('return-nothing', async () => {
      configService.get.mockResolvedValue('[s3 bucket name]');
      repository.remove.mockResolvedValue(undefined);
      s3Service.emptyDirectory.mockResolvedValue(undefined);
      const result = await service.deleteCurrentUser(mockUser);
      expect(result).toBe(undefined);
    });
  });
});
