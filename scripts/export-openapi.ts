import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { buildContractSwaggerDocument } from '../src/config/swagger.config';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { abortOnError: false, });
  try {
    const document = buildContractSwaggerDocument(app);
    const outPath = resolve(
  process.cwd(),
  'packages',
  'contracts',
  'src',
  'openapi.json',
);
    writeFileSync(outPath, JSON.stringify(document, null, 2));
    console.log(`OpenAPI spec escrito en ${outPath}`);
  } finally {
    await app.close();
  }
}

exportOpenApi().catch((error: unknown) => {
  console.error('Error exportando OpenAPI:', error);
  process.exit(1);
});