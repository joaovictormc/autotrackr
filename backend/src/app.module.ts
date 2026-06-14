import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FuelModule } from './fuel/fuel.module';
import { RevenueModule } from './revenue/revenue.module';
import { TripsModule } from './trips/trips.module';
import { AdminModule } from './admin/admin.module';
import { ReportsModule } from './reports/reports.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { BillingModule } from './billing/billing.module';
import { AiModule } from './ai/ai.module';
import { MailModule } from './mail/mail.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    ModelsModule,
    VehiclesModule,
    MaintenanceModule,
    FuelModule,
    RevenueModule,
    TripsModule,
    AdminModule,
    ReportsModule,
    BootstrapModule,
    BillingModule,
    AiModule,
    MailModule,
    RemindersModule,
  ],
})
export class AppModule {}
