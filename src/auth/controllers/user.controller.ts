import { Controller, Get, Param, Post, Request, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { FriendRequest } from '../models/friend-request.interface';
import { JwtGuard } from '../guards/jwt.guard';


import { isFileExstentionSafe, removeFile, saveImageToStorage } from '../helpers/image-storage';
import { User } from '../models/user.interface';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {

    constructor(private userService: UserService) { }
    
    @UseGuards(JwtGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', saveImageToStorage))
    uploadImage(@UploadedFile() file: Express.Multer.File, @Request() req): Observable<{ modifiedFileName: string } | { error: string }> {
        
        const filename = file?.filename;
        if (!filename) return of({ error: 'File must be a png, jpg/jpeg' });

        const imagesFolderPath = join(process.cwd(), 'images');
        const fullImagePath = join(imagesFolderPath + '/' + filename);

        return isFileExstentionSafe(fullImagePath).pipe(
            switchMap((isFileLegit: boolean) => {
                if (isFileLegit) {
                    const userId = req.user.id;
                    return this.userService.updateUserImageById(userId, filename).pipe(
                        map(() => ({
                            modifiedFileName: file.filename
                        }))
                    );
                }
                removeFile(fullImagePath);
                return of({ error: 'File content does not match extention!' });
            })
        );

    }

    @UseGuards(JwtGuard)
    @Get('image')
    findImage(@Request() req, @Res() res): Observable<Object> {
        const userId = req.user.id;
        return this.userService.findImageNameByUserId(userId).pipe(
            switchMap((imageName: string) => {
                return of(res.sendFile(imageName, { root: './images' }));
            })
        );
    }

    @UseGuards(JwtGuard)
    @Get('image-name')
    findUserImageName(@Request() req): Observable<{imageName: string}> {
        const userId = req.user.id;
        return this.userService.findImageNameByUserId(userId).pipe(
            switchMap((imageName: string) => {
                return of({ imageName });
            })
        );
    }

    @UseGuards(JwtGuard)
    @Get(':userId')
    findUserById(@Param('userId') userId: number): Observable<User> {
        return this.userService.findUserById(userId);
    }

    @UseGuards(JwtGuard)
    @Get('friend-request/send/:receiverId')
    sendFriendRequest(@Param('receiverId') receiverId: number): Observable<FriendRequest | { error: string }> {
        return this.userService.sendFriendRequest(receiverId);
    }
}
