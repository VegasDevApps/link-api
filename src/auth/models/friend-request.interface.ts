import { User } from "./user.interface";

export type FriendRequest_Status = 'not-sent' | 'pending' | 'accept' | 'declined' | 'waiting-for-current-user-response';

export interface FriendRequestStatus {
    status?: FriendRequest_Status
}

export interface FriendRequest {
    id?: number;
    creator?: User;
    receiver?: User;
    status?: FriendRequest_Status;
}