import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signup(@Body() signupDto: SignupDto): Promise<{ accessToken: string }> {
    return this.authService.signup(signupDto);
  }

  @Post('/signin')
  signin(@Body() signinDto: SigninDto): Promise<{ accessToken: string }> {
    return this.authService.signin(signinDto);
  }

  @Get('/me')
  @UseGuards(AuthGuard())
  getMe(@GetUser() me: User): User {
    return me;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/me')
  @UseGuards(AuthGuard())
  deleteMe(@GetUser() me: User): Promise<void> {
    return this.authService.deleteCurrentUser(me);
  }
}
