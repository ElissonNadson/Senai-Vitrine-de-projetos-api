import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardDao } from './dashboard.dao';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardDao],
})
export class DashboardModule {}
