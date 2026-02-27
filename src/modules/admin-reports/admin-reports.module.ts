import { Module } from '@nestjs/common';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminReportsDao } from './admin-reports.dao';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService, AdminReportsDao],
})
export class AdminReportsModule {}
