import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";


@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    
    catch(exception: any, host: ArgumentsHost) {
        throw new Error("Method not implemented.");
    }
    
}