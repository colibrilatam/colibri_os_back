import { PartialType } from '@nestjs/mapped-types';
import { CreateLearningResourceDto } from './create-learning-resource.dto';


export class UpdateLearningResourceDto extends PartialType(
    CreateLearningResourceDto,
) {
}