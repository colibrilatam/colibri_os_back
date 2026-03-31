// src/pacs/pacs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pac } from './entities/pac.entity';
import { PacsService } from './pacs.service';
import { PacsController } from './pacs.controller';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pac]),
    CategoriesModule,
  ],
  controllers: [PacsController],
  providers: [PacsService],
  exports: [PacsService],
})
export class PacsModule {}