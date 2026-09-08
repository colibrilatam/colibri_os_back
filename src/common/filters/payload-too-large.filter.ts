import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

@Catch()
export class PayloadTooLargeFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('PayloadTooLargeFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const err = exception as { type?: string; status?: number; statusCode?: number };
    const isPayloadTooLarge =
      err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413;

    if (!isPayloadTooLarge) {
      super.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    this.logger.warn(
      JSON.stringify({
        event: 'payload_too_large_rejected',
        method: request?.method,
        path: request?.originalUrl ?? request?.url,
        ip: request?.ip,
        timestamp: new Date().toISOString(),
      }),
    );

    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      error: 'Payload Too Large',
      message: 'El cuerpo de la solicitud excede el límite permitido.',
    });
  }
}