import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { from, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { UserEntity } from '../models/user.entity';
import { User } from '../models/user.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private jwtService: JwtService ){}

    hashPassword(password: string): Observable<string> {
        return from(bcrypt.hash(password, 12));
    }
    
    registerAccount(user: User): Observable<User> {
        //const { firstName, lastName, email, password } = user;

        return this.hashPassword(user.password).pipe(
            switchMap((hashedPassword: string) => {
                return from(this.userRepository.save({
                    ...user,
                    password: hashedPassword
                })).pipe(
                    map((user: User) => {
                        delete user.password;
                        return user;
                    })
                );
            }));
    }

    validateUser(email: string, password: string): Observable<User>{
       //return from(this.userRepository.findOneBy({ email }, {select: ['id', 'firstName', 'lastName', 'email', 'password', 'role']}));
       return from(this.userRepository.findOneBy({email: email})).pipe(
        switchMap((user: User) => {
            if(user){
                return from(bcrypt.compare(password, user.password)).pipe(map((isValid: boolean) => {
                    if(isValid){
                        delete user.password;
                        return user;
                    }
                }));
            }
        }));
    }

    login(user: User): Observable<string>{
        const {email, password} = user;
        return this.validateUser(email, password).pipe(
            switchMap((user: User) => {
                if(user){
                    // create JWT - creds
                    return from(this.jwtService.signAsync({user}));
                }
            })
        )
    }
}
