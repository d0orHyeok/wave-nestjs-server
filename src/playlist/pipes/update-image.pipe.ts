import { BadRequestException, PipeTransform } from '@nestjs/common';
import { MulterFile } from 'src/entities/common.types';

export class UpdateImagePipe implements PipeTransform {
  transform(uploadedFiles: { image?: MulterFile[]; data?: MulterFile[] }) {
    const { image, data } = uploadedFiles;
    if (!image) {
      throw new BadRequestException(`Can't find image`);
    }

    const parsedData = Boolean(data)
      ? JSON.parse(data[0].buffer.toString())
      : undefined;

    return { image: image[0], data: parsedData };
  }
}
