import { ResourceType } from "src/curriculum/entities/learning-resource.entity";

export interface ICreateLearningResource {
  pacId: string;
  title: string;
  resourceType: ResourceType;
  url: string;
  description?: string;
  sortOrder: number;
  isRequired: boolean;
  microActionDefinitionId?: string;
}