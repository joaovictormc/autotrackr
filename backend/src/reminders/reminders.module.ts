import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { IntegrationConfigService } from '../integrations/integration-config.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [HttpModule, AiModule],
  controllers: [RemindersController],
  providers: [RemindersService, WhatsappService, IntegrationConfigService],
})
export class RemindersModule {}
