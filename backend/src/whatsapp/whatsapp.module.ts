import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { WhatsAppNotificationLog } from '../entities/whatsapp-notification-log.entity';
import { WhatsAppService } from './whatsapp.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([WhatsAppNotificationLog])],
  providers: [WhatsAppService, StructuredLoggerService],
  exports: [WhatsAppService],
})
/**
 * Modulo de integracao WhatsApp.
 */
export class WhatsAppModule {}
