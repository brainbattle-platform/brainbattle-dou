import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { errorResponse } from '../utils/response.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      if (responseObj.error?.code) {
        errorCode = responseObj.error.code;
      }
      if (responseObj.error?.message) {
        message = responseObj.error.message;
      } else if (responseObj.message) {
        message = Array.isArray(responseObj.message)
          ? responseObj.message[0]
          : responseObj.message;
      }
    }

    response.status(status).json(errorResponse(errorCode, message));
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      errorResponse('INTERNAL_SERVER_ERROR', message),
    );
  }
}

