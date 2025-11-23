import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
// @UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard
   * Retorna dashboard apropriado baseado no tipo de usuário autenticado
   */
  @Get()
  async getDashboard(@CurrentUser() usuario: any) {
    return this.dashboardService.getDashboard(usuario);
  }
}
