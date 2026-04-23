import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TestCase,
  TestRun,
  Prompt,
  PromptVersion,
  Execution,
  ProviderModel,
  AssertionResult,
} from '../common/entities';
import { Assertion } from '../common/entities';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { ModelOrchestratorService } from '../model-orchestrator/model-orchestrator.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class TestCasesService {
  constructor(
    @InjectRepository(TestCase)
    private readonly testCaseRepository: Repository<TestCase>,
    @InjectRepository(TestRun)
    private readonly testRunRepository: Repository<TestRun>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptVersion)
    private readonly versionRepository: Repository<PromptVersion>,
    @InjectRepository(Execution)
    private readonly executionRepository: Repository<Execution>,
    @InjectRepository(ProviderModel)
    private readonly providerModelRepository: Repository<ProviderModel>,
    private readonly modelOrchestrator: ModelOrchestratorService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async create(dto: CreateTestCaseDto, userId: string) {
    const prompt = await this.promptRepository.findOne({
      where: { id: dto.promptId },
      relations: ['project'],
    });
    if (!prompt) throw new NotFoundException('Prompt no encontrado');
    if (prompt.project.userId !== userId) {
      throw new BadRequestException('No tienes acceso a este prompt');
    }

    const testCase = this.testCaseRepository.create({
      name: dto.name,
      promptId: dto.promptId,
      variables: dto.variables || {},
      expectedOutput: dto.expectedOutput || null,
      assertions: (dto.assertions || []) as Assertion[],
    });
    return this.testCaseRepository.save(testCase);
  }

  async findByPrompt(promptId: string) {
    return this.testCaseRepository.find({
      where: { promptId },
      order: { createdAt: 'DESC' },
      relations: ['runs'],
    });
  }

  async findOne(id: string) {
    const testCase = await this.testCaseRepository.findOne({
      where: { id },
      relations: ['runs'],
    });
    if (!testCase) throw new NotFoundException('Test case no encontrado');
    return testCase;
  }

  async update(id: string, dto: UpdateTestCaseDto) {
    const testCase = await this.findOne(id);
    if (dto.name !== undefined) testCase.name = dto.name;
    if (dto.variables !== undefined) testCase.variables = dto.variables;
    if (dto.expectedOutput !== undefined) testCase.expectedOutput = dto.expectedOutput;
    if (dto.assertions !== undefined) testCase.assertions = dto.assertions as Assertion[];
    return this.testCaseRepository.save(testCase);
  }

  async remove(id: string) {
    const testCase = await this.findOne(id);
    await this.testCaseRepository.remove(testCase);
    return { message: 'Test case eliminado' };
  }

  async runTest(id: string, userId: string, modelId?: string) {
    const testCase = await this.testCaseRepository.findOne({
      where: { id },
      relations: ['prompt', 'prompt.project'],
    });
    if (!testCase) throw new NotFoundException('Test case no encontrado');

    const prompt = testCase.prompt;
    if (!prompt.currentVersionId) {
      throw new BadRequestException('El prompt no tiene una versión guardada');
    }

    const version = await this.versionRepository.findOne({
      where: { id: prompt.currentVersionId },
    });
    if (!version) throw new NotFoundException('Versión no encontrada');

    const effectiveModelId = modelId || prompt.defaultModel;
    if (!effectiveModelId) {
      throw new BadRequestException('No hay modelo seleccionado');
    }

    const model = await this.providerModelRepository.findOne({
      where: { externalId: effectiveModelId },
    });
    if (!model) throw new BadRequestException(`Modelo ${effectiveModelId} no encontrado`);

    const apiKey = await this.apiKeysService.getDecryptedKey(userId, model.provider);
    if (!apiKey) throw new BadRequestException(`No tienes API key para ${model.provider}`);

    // Resolve variables in content
    let resolvedContent = version.content || '';
    for (const [key, value] of Object.entries(testCase.variables)) {
      resolvedContent = resolvedContent.replaceAll(`{{${key}}}`, value);
    }

    const messages = version.messages?.length
      ? version.messages.map((m) => {
          let content = m.content;
          for (const [key, value] of Object.entries(testCase.variables)) {
            content = content.replaceAll(`{{${key}}}`, value);
          }
          return { role: m.role, content };
        })
      : [{ role: 'user', content: resolvedContent }];

    const validMessages = messages
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content.trim() }));

    if (validMessages.length === 0) {
      const run = this.testRunRepository.create({
        testCaseId: id,
        status: 'error',
        errorMessage: 'El prompt resuelto está vacío',
        assertionResults: [],
      });
      return this.testRunRepository.save(run);
    }

    try {
      const result = await this.modelOrchestrator.execute({
        model,
        apiKey,
        messages: validMessages,
        temperature: 0.7,
        maxTokens: 1024,
        topP: 1,
      });

      // Save execution
      const cost =
        (result.tokensIn / 1_000_000) * model.pricing.input +
        (result.tokensOut / 1_000_000) * model.pricing.output;

      const execution = await this.executionRepository.save(
        this.executionRepository.create({
          promptVersionId: version.id,
          userId,
          source: 'prompt',
          provider: model.provider,
          model: effectiveModelId,
          input: { variables: testCase.variables, messages: validMessages },
          output: result.output,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          latencyMs: result.latencyMs,
          cost,
          parameters: { temperature: 0.7, maxTokens: 1024, topP: 1 },
        }),
      );

      // Run assertions
      const assertionResults = this.runAssertions(
        result.output,
        testCase.assertions,
      );
      const allPassed = assertionResults.every((r) => r.passed);

      const run = this.testRunRepository.create({
        testCaseId: id,
        executionId: execution.id,
        status: allPassed ? 'passed' : 'failed',
        actualOutput: result.output,
        assertionResults,
        latencyMs: result.latencyMs,
        model: effectiveModelId,
      });
      return this.testRunRepository.save(run);
    } catch (error: any) {
      const run = this.testRunRepository.create({
        testCaseId: id,
        status: 'error',
        errorMessage: error.message,
        assertionResults: [],
        model: effectiveModelId,
      });
      return this.testRunRepository.save(run);
    }
  }

  async getTestRuns(testCaseId: string) {
    return this.testRunRepository.find({
      where: { testCaseId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async runAllForPrompt(promptId: string, userId: string, modelId?: string) {
    const testCases = await this.testCaseRepository.find({
      where: { promptId },
    });

    const results = await Promise.allSettled(
      testCases.map((tc) => this.runTest(tc.id, userId, modelId)),
    );

    return results.map((result, index) => ({
      testCaseId: testCases[index].id,
      testCaseName: testCases[index].name,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : undefined,
      error: result.status === 'rejected' ? result.reason?.message : undefined,
    }));
  }

  private runAssertions(
    output: string,
    assertions: { type: string; value: string }[],
  ): AssertionResult[] {
    return assertions.map((assertion) => {
      switch (assertion.type) {
        case 'contains':
          return {
            type: assertion.type,
            value: assertion.value,
            passed: output.toLowerCase().includes(assertion.value.toLowerCase()),
          };
        case 'notContains':
          return {
            type: assertion.type,
            value: assertion.value,
            passed: !output.toLowerCase().includes(assertion.value.toLowerCase()),
          };
        case 'equals':
          return {
            type: assertion.type,
            value: assertion.value,
            passed: output.trim() === assertion.value.trim(),
          };
        case 'validJSON':
          try {
            JSON.parse(output);
            return { type: assertion.type, value: assertion.value, passed: true };
          } catch {
            return { type: assertion.type, value: assertion.value, passed: false };
          }
        case 'regex':
          try {
            const regex = new RegExp(assertion.value);
            return {
              type: assertion.type,
              value: assertion.value,
              passed: regex.test(output),
            };
          } catch {
            return {
              type: assertion.type,
              value: assertion.value,
              passed: false,
              actual: 'Invalid regex',
            };
          }
        default:
          return {
            type: assertion.type,
            value: assertion.value,
            passed: false,
            actual: `Unknown assertion type: ${assertion.type}`,
          };
      }
    });
  }
}
