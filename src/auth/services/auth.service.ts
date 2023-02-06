import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { from, Observable } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';

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
                console.log(1, user)
                return from(this.userRepository.save({
                    ...user,
                    password: hashedPassword
                })).pipe(
                    map((user: User) => {
                        console.log(2, user)
                        delete user.password;
                        return user;
                    })
                );
            }));
    }

    validateUser(email: string, password: string): Observable<User>{
       
        // Define which fields to select (no feeds posts needed)
        const fieldsToSelect = {
            id: true, 
            email: true, 
            firstName: true, 
            lastName: true, 
            role: true, 
            password: true 
        };

        // Where condition
        const query = {
            where: {
                email
            }, 
            select: fieldsToSelect
        }

        return from(this.userRepository.findOne(query)).pipe(
            switchMap((user: User) => {
                
                if (!user) {
                    //throw new HttpException('Not found', HttpStatus.NOT_FOUND);
                    throw new HttpException(
                        { status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials' },
                        HttpStatus.NOT_FOUND
                    );
                }

                return from(bcrypt.compare(password, user.password)).pipe(map((isValid: boolean) => {
                    if(isValid){
                        delete user.password;
                        return user;
                    }
                }));
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
