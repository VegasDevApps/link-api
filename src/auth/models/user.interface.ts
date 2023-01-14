import { FeedPost } from "src/feed/models/post.interface";
import { FriendRequestEntity } from "./friend-request.entity";
import { Role } from "./role.enum";


export interface User {
    id?: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    imagePath: string;
    role?: Role;
    posts?: FeedPost[];
    //sentFriendRequests: FriendRequestEntity;
    //receivedFriendRequests: FriendRequestEntity;
}