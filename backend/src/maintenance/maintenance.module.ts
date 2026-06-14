import { Module } from '@nestjs/common';
import { MaintenanceController, MaintenanceTypesController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  controllers: [MaintenanceTypesController, MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
