import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository, UpdateResult } from 'typeorm';
import { UserEntity } from '../models/user.entity';
import { User } from '../models/user.interface';

@Injectable()
export class UserService {

    constructor(@InjectRepository(UserEntity) private userRepository: Repository<User>){}

    findUserById(id: number): Observable<User> {

        return from(this.userRepository.findOne({ where: { id }, relations: ['feedPosts'] }));
    }

    updateUserImageById(id: null, imagePath: string): Observable<UpdateResult> {
        const user: User = new UserEntity();
        user.id = id;
        user.imagePath = imagePath;
        return from(this.userRepository.update(id, user));
    }

    findImageNameByUserId(id: number): Observable<string> {
        return from(this.userRepository.findOneBy({ id })).pipe(
            map((user: User) => user.imagePath)
        )
    }
}
