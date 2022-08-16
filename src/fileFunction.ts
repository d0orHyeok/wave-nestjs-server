import fetch from 'node-fetch';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';

function getPath(filePath?: string) {
  const defaultPath = 'uploads';
  return !filePath ? defaultPath : `${defaultPath}/${filePath}`;
}

export function uploadFileDisk(
  file: Express.Multer.File,
  fileName: string,
  filePath?: string,
) {
  const uploadPath = getPath(filePath);

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath);
  }

  const uploadFile = `${__dirname}/../${uploadPath}/${fileName}`;
  writeFileSync(uploadFile, file.buffer); // file.path 임시 파일 저장소

  return `${uploadPath}/${fileName}`;
}

export function deleteFileDisk(fileName: string) {
  if (existsSync(fileName)) {
    unlinkSync(fileName);
  }
}

export const getBlobFromURL = (url: string) => {
  return fetch(url).then((res) => {
    return res.blob();
  });
};

export const getBufferFromBlob = async (blob: Blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
