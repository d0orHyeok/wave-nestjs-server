import { PipeTransform, InternalServerErrorException } from '@nestjs/common';

export class CheckTargetPipe implements PipeTransform {
  async transform(value: string) {
    if (value === 'music' || value === 'playlist') {
      return value;
    } else {
      throw new InternalServerErrorException(
        `Error occur encrypting the password.`,
      );
    }
  }
}
