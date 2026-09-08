import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import { AppModule } from './app.module';
import { PayloadTooLargeFilter } from './common/filters/payload-too-large.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

const logger = new Logger('Bootstrap');

async function bootstrap(): Promise<void> {
  // OPS-003: desactivamos el body-parser por defecto de Nest para poder
  // fijar explícitamente el límite de tamaño del payload (ver más abajo).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL, process.env.FRONTEND_URLS);

  // QA-002 / OPS-003: headers de seguridad HTTP.
  // - hsts: fuerza HTTPS en el navegador (no tiene efecto si se sirve por HTTP plano).
  // - contentSecurityPolicy: por defecto Helmet aplica una CSP conservadora;
  //   la dejamos explícita para que quede documentada y sea fácil de ajustar
  //   si el frontend necesita cargar recursos de otros orígenes.
  // - crossOriginResourcePolicy 'cross-origin': la API sirve datos a un
  //   frontend en otro origen (ver CORS más abajo), por eso no puede quedar
  //   en 'same-origin' (rompería las respuestas para el frontend).
  app.use(
    helmet({
      hsts: {
        maxAge: 63_072_000, // 2 años
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // OPS-003: límite explícito de tamaño de payload. Rechaza con 413 antes
  // de que el body llegue a los controllers (ver PayloadTooLargeFilter).
  const maxBodySize = process.env.MAX_JSON_BODY_SIZE ?? '1mb';
  app.use(express.json({ limit: maxBodySize }));
  app.use(express.urlencoded({ extended: true, limit: maxBodySize }));

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

  // OPS-003: timeout global de request. Si un handler tarda más que
  // REQUEST_TIMEOUT_MS, se corta y se responde 408 en vez de dejar la
  // conexión colgada indefinidamente.
  app.useGlobalInterceptors(new TimeoutInterceptor());

  // OPS-003: si el payload excede el límite configurado arriba, responder
  // 413 de forma prolija en vez de un 500 genérico.
  app.useGlobalFilters(new PayloadTooLargeFilter(app.getHttpAdapter()));

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
  const server = await app.listen(port);

  // OPS-003: timeouts a nivel de socket HTTP, como red de seguridad contra
  // conexiones colgadas que ni siquiera llegan a completar sus headers
  // (protección adicional a nivel de transporte, independiente del
  // TimeoutInterceptor que corta por lógica de negocio lenta).
  const socketTimeoutMs = Number(process.env.SOCKET_TIMEOUT_MS ?? 30_000);
  server.setTimeout(socketTimeoutMs);
  server.headersTimeout = socketTimeoutMs + 5_000;
  server.requestTimeout = socketTimeoutMs;

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