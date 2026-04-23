import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestCasesService } from './test-cases.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Test Cases')
@Controller('test-cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestCasesController {
  constructor(private readonly testCasesService: TestCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear test case' })
  create(
    @Body() dto: CreateTestCaseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.testCasesService.create(dto, user.id);
  }

  @Get('prompt/:promptId')
  @ApiOperation({ summary: 'Listar test cases por prompt' })
  findByPrompt(@Param('promptId') promptId: string) {
    return this.testCasesService.findByPrompt(promptId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un test case' })
  findOne(@Param('id') id: string) {
    return this.testCasesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar test case' })
  update(@Param('id') id: string, @Body() dto: UpdateTestCaseDto) {
    return this.testCasesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar test case' })
  remove(@Param('id') id: string) {
    return this.testCasesService.remove(id);
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Ejecutar un test case' })
  runTest(
    @Param('id') id: string,
    @Query('model') modelId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.testCasesService.runTest(id, user.id, modelId);
  }

  @Get(':id/runs')
  @ApiOperation({ summary: 'Ver historial de ejecuciones de un test' })
  getTestRuns(@Param('id') id: string) {
    return this.testCasesService.getTestRuns(id);
  }

  @Post('prompt/:promptId/run-all')
  @ApiOperation({ summary: 'Ejecutar todos los tests de un prompt' })
  runAllForPrompt(
    @Param('promptId') promptId: string,
    @Query('model') modelId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.testCasesService.runAllForPrompt(promptId, user.id, modelId);
  }
}
