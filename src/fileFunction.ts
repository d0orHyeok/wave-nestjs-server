import fetch from 'node-fetch';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { MulterFile } from './entities/common.types';
import { join, resolve } from 'path';
import { getStorage } from 'firebase-admin/storage';
import * as uuid from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';

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

// firebase function
const createPersistentDownloadUrl = (pathToFile, downloadToken) => {
  const bucket = 'wave-f1616.appspot.com';
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    pathToFile,
  )}?alt=media&token=${downloadToken}`;
};

export const uploadFileFirebase = async (
  buffer: Buffer,
  contentType: string,
  filename: string,
) => {
  const bucket = getStorage().bucket();
  const upload = bucket.file(filename);

  try {
    await upload.save(buffer, {
      contentType: contentType,
    });

    const dowloadToken = uuid.v4();

    await upload.setMetadata({
      metadata: { firebaseStorageDownloadTokens: dowloadToken },
    });

    return {
      filename,
      link: createPersistentDownloadUrl(filename, dowloadToken),
    };
  } catch (error) {
    console.log('에러발생');
    throw new InternalServerErrorException(
      error,
      'Failed to upload file on firebase',
    );
  }
};

export const deleteFileFirebase = async (filename: string) => {
  try {
    const bucket = getStorage().bucket();
    await bucket.file(filename).delete();
  } catch (err) {
    throw new InternalServerErrorException(err, 'Fail to Delete Firebase file');
  }
};
