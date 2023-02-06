import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { CustomHttpExceptionResponse, HttpExceptionResponse } from "./model/http-exception-response.interface";
import * as fs from 'fs';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    
    catch(exception: any, host: ArgumentsHost) {
        
        const cntx = host.switchToHttp();
        const response = cntx.getResponse<Response>();
        const request = cntx.getRequest<Request>();

        let status: HttpStatus;
        let errorMessage: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const errorResponse = exception.getResponse();
            errorMessage = (errorResponse as HttpExceptionResponse).error || exception.message;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorMessage = 'Critical internal server occured!';
        }
        
        const errorResponse = this.getErrorResponse(status, errorMessage, request);
        const errorLog = this.getErrorLog(errorResponse, request, exception);
        this.writeErrorLogToFile(errorLog);
        response.status(status).json(errorResponse);
    }

    private getErrorResponse = ( status: HttpStatus, errorMessage: string, request: Request ): CustomHttpExceptionResponse => {
        return {
            statusCode: status,
            error: errorMessage,
            path: request.url,
            method: request.method,
            timeStamp: new Date()
        }
    }

    private getErrorLog = (errorResponse: CustomHttpExceptionResponse, request: Request, exception: unknown): string => {
        
        const { statusCode, error, path, method, timeStamp } = errorResponse;
        const errorLog = `Response Code: ${statusCode} - Method: ${method} - URL: ${path}\n\n
        ${JSON.stringify(errorResponse)}\n\n
        User: ${JSON.stringify(request.user) ?? 'Not signed in'} \n\n
        ${exception instanceof HttpException ? exception.stack : error}\n\n
        `
        console.log(32, errorLog);
        return errorLog;
    }

    private writeErrorLogToFile = (errorLog: string): void => {
        fs.appendFile('error.log', errorLog, 'utf8', (err) => {
            if (err) throw err;
        });
    }
}