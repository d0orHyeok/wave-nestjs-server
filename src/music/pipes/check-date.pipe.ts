import { BadRequestException, PipeTransform } from '@nestjs/common';

export class CheckDatePipe implements PipeTransform {
  transform(date?: string) {
    if (!date) return;

    if (date === 'month' || date === 'week') {
      return date;
    }

    const num = Number(date);
    if (num > 7) {
      throw new BadRequestException(
        `Query "date" must be "week" or "month" or less than 7 numbers`,
      );
    }

    return num;
  }
}
