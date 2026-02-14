import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [ConfigModule],
  providers: [WhatsAppService, StructuredLoggerService],
  exports: [WhatsAppService],
})
/**
 * Modulo de integracao WhatsApp.
 */
export class WhatsAppModule {}
