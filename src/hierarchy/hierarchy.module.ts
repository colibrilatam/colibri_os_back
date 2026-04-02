import { Module } from "@nestjs/common";
import { HierarchyService } from "./hierarchy.service";
import { HierarchyRepository } from "./hierarchy.repository";
import { HierarchyController } from "./hierarchy.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LearningResource } from "src/learning-resource/entities/learning-resource.entity";
import { Tramo } from "src/tramos/entities/tramo.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningResource, Tramo]),
  ],
  controllers: [ HierarchyController],
  providers: [
    HierarchyRepository,
    HierarchyService,
  ],
  exports: [HierarchyService],
})
export class HierarchyModule {}