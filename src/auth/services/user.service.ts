import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Repository, UpdateResult } from 'typeorm';
import { FriendRequestEntity } from '../models/friend-request.entity';
import { FriendRequest, FriendRequestStatus, FriendRequest_Status } from '../models/friend-request.interface';
import { UserEntity } from '../models/user.entity';
import { User } from '../models/user.interface';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<User>,
        @InjectRepository(FriendRequestEntity) private friendRequestRepository: Repository<FriendRequest>
    ) { }

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

    hasRequestBeenSentOrReceived(creator: User, receiver: User): Observable<boolean> {
        return from(this.friendRequestRepository.findOne({
            where: [
                { creator, receiver },
                { creator: receiver, receiver: creator },
            ]
        })).pipe(
            switchMap((fr: FriendRequest) => {
                return of(!!fr);
            })
        )
    }

    sendFriendRequest(receiverId: number, creator: User): Observable<FriendRequest | { error: string }> {
        if(receiverId === creator.id) return of({ error: 'It is not possible to add yourself!' });
        
        return this.findUserById(receiverId).pipe(
            switchMap((receiver: User) => {
                return this.hasRequestBeenSentOrReceived(creator, receiver).pipe(
                    switchMap((hasRequestBeenSentOrReceived: boolean) => {
                        if (hasRequestBeenSentOrReceived) return of({ error: 'A friend request has been sent or received to your account' });
                        
                        let friendRequest: FriendRequest = {
                            creator,
                            receiver,
                            status: 'pending'
                        };

                        return from(this.friendRequestRepository.save(friendRequest));
                    })
                );
            })
        );
    }

    getFriendRequestStatus(receiverId: number, currentUser: User): Observable<FriendRequestStatus>{
        return from(this.findUserById(receiverId)).pipe(
            switchMap((receiver: User) => {
                return from(this.friendRequestRepository.findOne(
                    { 
                        where: [
                            {
                                creator: currentUser,
                                receiver: receiver
                            },{
                                creator: receiver,
                                receiver: currentUser
                            }
                        ],
                        relations: ['creator', 'receiver']
                    }));
            }),
            switchMap((friendRequest: FriendRequest) => {
                if(friendRequest?.receiver.id === currentUser.id){
                    return of({ status: 'waiting-for-current-user-response' as FriendRequest_Status });    
                }
                return of({ status: friendRequest?.status || 'not-sent' });
            })
        );
    }

    getFriendRequestById(friendRequestId: number): Observable<FriendRequest> {
        return from(this.friendRequestRepository.findOne({where: {id: friendRequestId}}));
    }

    respondToFriendRequest(friendRequestId: number, statusRespond: FriendRequest_Status): Observable<FriendRequestStatus>{
        return from(this.getFriendRequestById(friendRequestId)).pipe(
            switchMap((friendRequest: FriendRequest) => {
                return from(this.friendRequestRepository.save({
                    ...friendRequest,
                    status: statusRespond
                }));
            })
        );
    }

    getFriendRequestFromRecipients(user: User): Observable<FriendRequest[]>{
        return from(this.friendRequestRepository.find({ where: { receiver: user } }));
    }
}
