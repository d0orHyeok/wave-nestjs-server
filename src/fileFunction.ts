import fetch from 'node-fetch';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { MulterFile } from './entities/common.types';
import { join, resolve } from 'path';

function getPath(filePath?: string) {
  const defaultPath = resolve(__dirname, '../', 'uploads');
  return !filePath ? defaultPath : resolve(defaultPath, filePath);
}

export function uploadFileDisk(
  file: MulterFile,
  fileName: string,
  filePath?: string,
) {
  const uploadPath = getPath(filePath);

  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }

  const writePath = join(uploadPath, fileName);
  writeFileSync(writePath, file.buffer); // file.path 임시 파일 저장소

  return `uploads${writePath.split('uploads')[1]}`.replace(/\\/gi, '/');
}

export function deleteFileDisk(fileName: string) {
  const serverUrl = process.env.SERVER_URL;
  const root = resolve(__dirname, '../');
  const filePath = join(root, fileName.replace(serverUrl, ''));

  if (existsSync(filePath)) {
    unlinkSync(filePath);
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
