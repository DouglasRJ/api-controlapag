import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { type AuthenticatedRequest } from 'src/auth/types/authenticated-request.type';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentsResponseDto } from './dto/enrollments-response.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}
  @Get()
  async findAll() {
    const enrollments = await this.enrollmentsService.findAll();
    return enrollments.map(p => new EnrollmentsResponseDto(p));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const enrollments = await this.enrollmentsService.findOne({ id });
    return new EnrollmentsResponseDto(enrollments);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ) {
    const enrollments = await this.enrollmentsService.create({
      userId: req.user.id,
      createEnrollmentDto,
    });
    return new EnrollmentsResponseDto(enrollments);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    const enrollments = await this.enrollmentsService.update({
      enrollmentsId: id,
      userId: req.user.id,
      updateEnrollmentDto,
    });
    return new EnrollmentsResponseDto(enrollments);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const enrollments = await this.enrollmentsService.remove({
      userId: req.user.id,
      enrollmentsId: id,
    });
    return new EnrollmentsResponseDto(enrollments);
  }
}
