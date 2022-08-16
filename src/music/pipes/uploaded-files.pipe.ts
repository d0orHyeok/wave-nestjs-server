import { BadRequestException, PipeTransform } from '@nestjs/common';
import { MulterFile } from 'src/entities/common.types';

export class UploadedFilesPipe implements PipeTransform {
  transform(uploadedFiles: {
    musics?: MulterFile[];
    covers?: MulterFile[];
    datas?: MulterFile[];
  }) {
    const { musics, covers, datas } = uploadedFiles;
    if (!musics || !datas) {
      throw new BadRequestException(
        `Can't find ${!musics && 'music file'} ${!datas && 'music data'}`,
      );
    }

    const parsedData = JSON.parse(datas[0].buffer.toString());

    return {
      music: musics[0],
      cover: covers?.length ? covers[0] : undefined,
      data: parsedData,
    };
  }
}
