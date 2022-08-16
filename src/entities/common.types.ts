import { Express } from 'express';
import 'multer';

export enum EntityStatus {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export type MulterFile = Express.Multer.File;
