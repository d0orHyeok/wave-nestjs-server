import { HistoryRepository } from './../../history/history.repository';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
    private historyRepository: HistoryRepository,
    readonly config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_ACCESS_TOKEN_SECRET ||
        config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload) {
    const { username } = payload;
    const user: User = await this.userRepository.findUserByUsername(username);
    const historys = await this.historyRepository.findHistorysByUserId(
      user.id,
      {
        skip: 0,
        take: 10,
      },
    );

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }

    return { ...user, historys };
  }
}
