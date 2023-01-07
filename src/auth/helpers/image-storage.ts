import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';


import fs from 'node:fs';
const FileType = require('file-type');

import path = require('path');
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

type validFileExtantion = 'png' | 'jpg' | 'jpeg';
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';

const validFileExtantions: validFileExtantion[] = ['png', 'jpg', 'jpeg'];
const validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg'];

export const saveImageToStorage = {
    storage: diskStorage({
        destination: './images',
        filename: (req, file, cb) => {
            const fileExtention: string = path.extname(file.originalname);
            const fileName: string = uuidv4() + fileExtention;
            cb(null, fileName);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes: validMimeType[] = validMimeTypes;
        console.log(1, allowedMimeTypes.includes(file.mimetype))
        cb(null, allowedMimeTypes.includes(file.mimetype));
    }
};

export const isFileExstentionSafe = (fullFilePath: string): Observable<boolean> => {
    return from(FileType.fromFile(fullFilePath)).pipe(
        switchMap((fileExtentionAndMime: { ext: validFileExtantion, mime: validMimeType }) => {
            
            if (!fileExtentionAndMime) return of(false);

            const isFileTypeLegit = validFileExtantions.includes(fileExtentionAndMime.ext);
            const isFileMimeLegit = validMimeTypes.includes(fileExtentionAndMime.mime);

            return of(isFileTypeLegit && isFileMimeLegit);
        })
    );
};


export const removeFile = (fullFilePath: string): void => {
    try {
        fs.unlinkSync(fullFilePath);
    } catch (error) {
        console.error(error);
    }
}

