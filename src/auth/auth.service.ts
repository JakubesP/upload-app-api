import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { SigninDto } from './dto/signin.dto';
import { DBSavedStatus } from '../created-status.enum';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { User } from './user.entity';
import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private awsS3Service: AwsS3Service,
  ) {}

  // ----------------------------------------------------------------------------

  async signup(signupDto: SignupDto): Promise<{ accessToken: string }> {
    const { email, password } = signupDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const [savedStatus, user] = await this.userRepository.createUser(
      email,
      hashedPassword,
    );

    if (savedStatus === DBSavedStatus.ERROR) {
      throw new InternalServerErrorException();
    }

    if (savedStatus === DBSavedStatus.CONFLICT) {
      throw new ConflictException('Invalid email');
    }

    return { accessToken: this.getAccessToken(user.id) };
  }

  // ----------------------------------------------------------------------------

  async signin(signinDto: SigninDto): Promise<{ accessToken: string }> {
    const { email, password } = signinDto;
    const user = await this.userRepository.findOne({ email });

    if (!(user && (await bcrypt.compare(password, user.password)))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { accessToken: this.getAccessToken(user.id) };
  }

  // ----------------------------------------------------------------------------

  getAccessToken(uid: string): string {
    const payload: JwtPayload = { id: uid };
    return this.jwtService.sign(payload);
  }

  // ----------------------------------------------------------------------------

  async deleteCurrentUser(user: User): Promise<void> {
    const bucketS3: string = this.configService.get('AWS_BUCKET_NAME');
    await this.awsS3Service.emptyDirectory(`${user.id}/`, bucketS3);
    await this.userRepository.remove(user);
  }
}
