import { BadRequestException, PipeTransform } from '@nestjs/common';

export class UploadedFilesPipe implements PipeTransform {
  transform(uploadedFiles: {
    musics?: Express.Multer.File[];
    covers?: Express.Multer.File[];
    datas?: Express.Multer.File[];
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
