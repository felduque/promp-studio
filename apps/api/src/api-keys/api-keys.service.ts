import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ApiKeyVault } from '../common/entities';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(ApiKeyVault)
    private readonly apiKeyRepository: Repository<ApiKeyVault>,
    private readonly configService: ConfigService,
  ) {
    const secret = this.configService.get<string>(
      'ENCRYPTION_KEY',
      'default-encryption-key-change-me!',
    );
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(secret)
      .digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(data: string): string {
    const [ivHex, authTagHex, encrypted] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async findAll(userId: string) {
    const keys = await this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return keys.map((key) => ({
      id: key.id,
      provider: key.provider,
      label: key.label,
      createdAt: key.createdAt,
    }));
  }

  async create(dto: CreateApiKeyDto, userId: string) {
    const encryptedKey = this.encrypt(dto.key);
    const apiKey = this.apiKeyRepository.create({
      userId,
      provider: dto.provider,
      encryptedKey,
      label: dto.label || `${dto.provider} key`,
    });
    const saved = await this.apiKeyRepository.save(apiKey);
    return {
      id: saved.id,
      provider: saved.provider,
      label: saved.label,
      createdAt: saved.createdAt,
    };
  }

  async remove(id: string, userId: string) {
    const key = await this.apiKeyRepository.findOne({
      where: { id, userId },
    });
    if (!key) throw new NotFoundException('API key no encontrada');
    await this.apiKeyRepository.remove(key);
    return { message: 'API key eliminada' };
  }

  async getDecryptedKey(userId: string, provider: string): Promise<string | null> {
    const key = await this.apiKeyRepository.findOne({
      where: { userId, provider },
    });
    if (!key) return null;
    return this.decrypt(key.encryptedKey);
  }

  async getUserProviders(userId: string): Promise<string[]> {
    const keys = await this.apiKeyRepository.find({
      where: { userId },
      select: ['provider'],
    });
    return [...new Set(keys.map((k) => k.provider))];
  }
}
