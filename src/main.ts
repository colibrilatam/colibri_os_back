import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = parseAllowedOrigins(process.env.FRONTEND_URL);
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

  // Prefijo global
  app.setGlobalPrefix('api/v1');

  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger
  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Colibrí OS API')
      .setDescription('API del sistema Colibrí OS — RaaS (Reputación como Servicio)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    console.log(`📚 Swagger: http://localhost:${process.env.PORT ?? 3000}/docs`);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en el puerto: ${port}`);
}

void bootstrap();

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    throw new Error('FRONTEND_URL es obligatoria y debe contener al menos un origen permitido');
  }

  return value.split(',').map((origin) => {
    try {
      return new URL(origin.trim()).origin;
    } catch {
      throw new Error(`Origen inválido en FRONTEND_URL: ${origin}`);
    }
  });
}
