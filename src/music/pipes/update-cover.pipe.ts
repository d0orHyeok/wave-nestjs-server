import { BadRequestException, PipeTransform } from '@nestjs/common';
import { MulterFile } from 'src/entities/common.types';

export class UpdateCoverPipe implements PipeTransform {
  transform(uploadedFiles: { cover?: MulterFile[]; data?: MulterFile[] }) {
    const { cover, data } = uploadedFiles;
    if (!cover) {
      throw new BadRequestException(`Can't find cover image`);
    }

    const parsedData = Boolean(data)
      ? JSON.parse(data[0].buffer.toString())
      : undefined;

    return { cover: cover[0], data: parsedData };
  }
}
