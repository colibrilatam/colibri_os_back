import { ResourceType } from "src/learning-resource/entities/learning-resource.entity";

export interface IUpdateLearningResource {
    pacId?: string;
    title?: string;
    resourceType?: ResourceType;
    url?: string;
    description?: string;
    sortOrder?: number;
    isRequired?: boolean;
    microActionDefinitionId?: string | null;
}