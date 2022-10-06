import { PipeTransform, BadRequestException } from '@nestjs/common';

export class AuthFindPipe implements PipeTransform {
  transform(body: { email?: string; username?: string }) {
    const { email, username } = body;

    if (Boolean(email) !== Boolean(username)) {
      return Boolean(email) ? ['email', email] : ['username', username];
    } else {
      throw new BadRequestException(
        '/auth/find route must be have body include "email" or "username"',
      );
    }
  }
}
