import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { CreateReputationDto } from './dto/create-reputation.dto';
import { UpdateReputationDto } from './dto/update-reputation.dto';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Post()
  create(@Body() createReputationDto: CreateReputationDto) {
    return this.reputationService.create(createReputationDto);
  }

  @Get()
  findAll() {
    return this.reputationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reputationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReputationDto: UpdateReputationDto) {
    return this.reputationService.update(+id, updateReputationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reputationService.remove(+id);
  }
}
