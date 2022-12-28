import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { map, Observable, switchMap } from 'rxjs';
import { Role } from 'src/auth/models/role.enum';
import { User } from 'src/auth/models/user.interface';


import { AuthService } from 'src/auth/services/auth.service';
import { FeedPost } from '../models/post.interface';
import { FeedService } from '../services/feed.service';

@Injectable()
export class IsCreatorGuard implements CanActivate {

  constructor(private authService: AuthService, private feedSerice: FeedService){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const request = context.switchToHttp().getRequest();
    const { user, params }: { user: User; params: {id: number} } = request;

    if(!user || !params) return false;

    if(user.role === Role.ADMIN) return true;

    const userId = user.id;
    const feedId = params.id;
   
    return this.authService.findUserById(userId).pipe(
      switchMap((user: User) => {
        return this.feedSerice.findPostById(feedId).pipe(map((feed: FeedPost) => {
          let isAuthor = user.id === feed.author.id;
          return isAuthor;
        }))
      })
    );

    //return true;
  }
}
