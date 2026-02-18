import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AdminReportsService } from './admin-reports.service';
import { ReportFilters, ReportFiltersSchema } from './dto/report-filters.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}

  private parseFilters(query: any): ReportFilters {
    const parsed = ReportFiltersSchema.safeParse(query);
    return parsed.success ? parsed.data : {};
  }

  @Get('overview')
  getOverview(@Query() query: any) {
    return this.service.getOverview(this.parseFilters(query));
  }

  @Get('projetos-por-curso')
  getProjetosPorCurso(@Query() query: any) {
    return this.service.getProjetosPorCurso(this.parseFilters(query));
  }

  @Get('projetos-por-modalidade')
  getProjetosPorModalidade(@Query() query: any) {
    return this.service.getProjetosPorModalidade(this.parseFilters(query));
  }

  @Get('projetos-por-unidade-curricular')
  getProjetosPorUnidadeCurricular(@Query() query: any) {
    return this.service.getProjetosPorUnidadeCurricular(this.parseFilters(query));
  }

  @Get('projetos-por-turma')
  getProjetosPorTurma(@Query() query: any) {
    return this.service.getProjetosPorTurma(this.parseFilters(query));
  }

  @Get('distribuicao-fases')
  getDistribuicaoFases(@Query() query: any) {
    return this.service.getDistribuicaoFases(this.parseFilters(query));
  }

  @Get('taxa-avanco-fases')
  getTaxaAvancoFases(@Query() query: any) {
    return this.service.getTaxaAvancoFases(this.parseFilters(query));
  }

  @Get('projetos-por-docente')
  getProjetosPorDocente(@Query() query: any) {
    const filters = this.parseFilters(query);
    const limit = query.limit ? parseInt(query.limit) : 10;
    return this.service.getProjetosPorDocente(filters, limit);
  }

  @Get('taxa-participacao')
  getTaxaParticipacao(@Query() query: any) {
    return this.service.getTaxaParticipacao(this.parseFilters(query));
  }

  @Get('senai-lab-por-fase')
  getSenaiLabPorFase(@Query() query: any) {
    return this.service.getSenaiLabPorFase(this.parseFilters(query));
  }

  @Get('timeline-criacao')
  getTimelineCriacao(@Query() query: any) {
    const filters = this.parseFilters(query);
    const agrupamento = query.agrupamento === 'semanal' ? 'semanal' : 'mensal';
    return this.service.getTimelineCriacao(filters, agrupamento);
  }

  @Get('comportamento-orientadores')
  getComportamentoOrientadores(@Query() query: any) {
    return this.service.getComportamentoOrientadores(this.parseFilters(query));
  }

  @Get('historico-orientador')
  getHistoricoOrientador(@Query('orientador_uuid') orientadorUuid: string, @Query() query: any) {
    return this.service.getHistoricoOrientador(orientadorUuid, this.parseFilters(query));
  }

  @Get('noticias-overview')
  getNoticiasOverview() {
    return this.service.getNoticiasOverview();
  }

  @Get('noticias-por-categoria')
  getNoticiasPorCategoria() {
    return this.service.getNoticiasPorCategoria();
  }

  @Get('noticias-engajamento')
  getNoticiasEngajamento(@Query('limit') limit?: string) {
    return this.service.getNoticiasEngajamento(limit ? parseInt(limit) : undefined);
  }

  @Get('noticias-timeline')
  getNoticiasTimeline() {
    return this.service.getNoticiasTimeline();
  }

  @Get('filter-options')
  getFilterOptions() {
    return this.service.getFilterOptions();
  }

  @Get('export')
  async exportExcel(@Query() query: any, @Res() res: Response) {
    const filters = this.parseFilters(query);
    const indicadores = query.indicadores
      ? (Array.isArray(query.indicadores) ? query.indicadores : [query.indicadores])
      : ['overview', 'distribuicao-fases', 'projetos-por-curso', 'projetos-por-docente', 'taxa-participacao'];

    const buffer = await this.service.exportToExcel(indicadores, filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-admin-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  }
}
