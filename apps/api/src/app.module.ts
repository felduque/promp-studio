import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { PromptsModule } from './prompts/prompts.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ExecutionsModule } from './executions/executions.module';
import { ModelOrchestratorModule } from './model-orchestrator/model-orchestrator.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { TestCasesModule } from './test-cases/test-cases.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { FavoriteModelsModule } from './favorite-models/favorite-models.module';
import { TemplatesModule } from './templates/templates.module';
import { StudioIoModule } from './studio-io/studio-io.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'prompt_studio'),
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('NODE_ENV', 'development') !== 'production',
      }),
    }),
    AuthModule,
    ProjectsModule,
    PromptsModule,
    ApiKeysModule,
    ExecutionsModule,
    ModelOrchestratorModule,
    EvaluationsModule,
    TestCasesModule,
    AnalyticsModule,
    UserPreferencesModule,
    FavoriteModelsModule,
    TemplatesModule,
    StudioIoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
