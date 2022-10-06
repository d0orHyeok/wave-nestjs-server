import { PipeTransform } from '@nestjs/common';
import { MulterFile } from 'src/entities/common.types';

export class UpdateProfileImagePipe implements PipeTransform {
  transform(uploadedFiles: { image?: MulterFile[]; data?: MulterFile[] }) {
    const { image, data } = uploadedFiles;

    const parsedData = Boolean(data)
      ? JSON.parse(data[0].buffer.toString())
      : undefined;
    return {
      image: Boolean(image) ? image[0] : undefined,
      data: parsedData,
    };
  }
}
