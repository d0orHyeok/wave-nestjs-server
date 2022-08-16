import { EntityStatus } from 'src/entities/common.types';
import { BadRequestException, PipeTransform } from '@nestjs/common';

export class EntityStatusValidationPipe implements PipeTransform {
  readonly StatusOptions = [EntityStatus.PRIVATE, EntityStatus.PUBLIC];

  transform(value: any) {
    value = value.toUpperCase();

    if (!this.isStatusValid(value)) {
      throw new BadRequestException(`${value} is not in the status options`);
    }
  }

  private isStatusValid(status: any) {
    const index = this.StatusOptions.indexOf(status);
    return index !== -1;
  }
}
