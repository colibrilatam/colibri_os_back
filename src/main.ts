import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL, process.env.FRONTEND_URLS);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origen no autorizado por CORS'));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Colibrí OS API')
      .setDescription('API del sistema Colibrí OS — RaaS (Reputación como Servicio)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    logger.log(`📚 Swagger: http://localhost:${process.env.PORT ?? 3000}/docs`);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Servidor corriendo en el puerto: ${port}`);
}

/**
 * FRONTEND_URL: origen principal (se usa también para el redirect de Google OAuth).
 * FRONTEND_URLS (opcional, separado por comas): orígenes adicionales permitidos
 * en CORS — típicamente previews de Vercel.
 */
function parseAllowedOrigins(primary: string | undefined, extra: string | undefined): string[] {
  if (!primary) {
    throw new Error('FRONTEND_URL es obligatoria y debe contener el origen principal permitido');
  }

  const raw = [primary, ...(extra ? extra.split(',') : [])];

  return raw
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        throw new Error(`Origen inválido en FRONTEND_URL/FRONTEND_URLS: ${origin}`);
      }
    });
}

bootstrap().catch((error: unknown) => {
  logger.error(
    JSON.stringify({
      message: 'Error fatal durante el bootstrap de la aplicación',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    }),
  );
  process.exit(1);
});
