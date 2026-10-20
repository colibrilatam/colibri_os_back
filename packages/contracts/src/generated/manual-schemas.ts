import { z } from 'zod';

/**
 * ErrorResponseSchema no viene del OpenAPI de NestJS: ningun endpoint lo
 * declara como respuesta. Se mantiene manual porque los tests del paquete
 * lo usan como contrato de errores estandar.
 *
 * Si en el futuro el backend estandariza un DTO de error y lo declara con
 * @ApiResponse, migrar esto al generador y eliminar este archivo.
 */
export const ErrorResponseSchema = z.strictObject({
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;