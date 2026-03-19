import { Injectable } from '@nestjs/common';
import { CreateReputationDto } from './dto/create-reputation.dto';
import { UpdateReputationDto } from './dto/update-reputation.dto';

@Injectable()
export class ReputationService {
  create(createReputationDto: CreateReputationDto) {
    return 'This action adds a new reputation';
  }

  findAll() {
    return `This action returns all reputation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reputation`;
  }

  update(id: number, updateReputationDto: UpdateReputationDto) {
    return `This action updates a #${id} reputation`;
  }

  remove(id: number) {
    return `This action removes a #${id} reputation`;
  }
}
