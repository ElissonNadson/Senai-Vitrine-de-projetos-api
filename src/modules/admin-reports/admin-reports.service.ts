import { Injectable } from '@nestjs/common';
import { AdminReportsDao } from './admin-reports.dao';
import { ReportFilters } from './dto/report-filters.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AdminReportsService {
  constructor(private readonly dao: AdminReportsDao) {}

  getOverview(filters: ReportFilters) {
    return this.dao.getOverview(filters);
  }

  getProjetosPorCurso(filters: ReportFilters) {
    return this.dao.getProjetosPorCurso(filters);
  }

  getProjetosPorModalidade(filters: ReportFilters) {
    return this.dao.getProjetosPorModalidade(filters);
  }

  getProjetosPorUnidadeCurricular(filters: ReportFilters) {
    return this.dao.getProjetosPorUnidadeCurricular(filters);
  }

  getProjetosPorTurma(filters: ReportFilters) {
    return this.dao.getProjetosPorTurma(filters);
  }

  getDistribuicaoFases(filters: ReportFilters) {
    return this.dao.getDistribuicaoFases(filters);
  }

  getTaxaAvancoFases(filters: ReportFilters) {
    return this.dao.getTaxaAvancoFases(filters);
  }

  getProjetosPorDocente(filters: ReportFilters, limit?: number) {
    return this.dao.getProjetosPorDocente(filters, limit);
  }

  getTaxaParticipacao(filters: ReportFilters) {
    return this.dao.getTaxaParticipacao(filters);
  }

  getSenaiLabPorFase(filters: ReportFilters) {
    return this.dao.getSenaiLabPorFase(filters);
  }

  getTimelineCriacao(filters: ReportFilters, agrupamento?: 'mensal' | 'semanal') {
    return this.dao.getTimelineCriacao(filters, agrupamento);
  }

  getComportamentoOrientadores(filters: ReportFilters) {
    return this.dao.getComportamentoOrientadores(filters);
  }

  getHistoricoOrientador(orientadorUuid: string, filters: ReportFilters) {
    return this.dao.getHistoricoOrientador(orientadorUuid, filters);
  }

  getNoticiasOverview() {
    return this.dao.getNoticiasOverview();
  }

  getNoticiasPorCategoria() {
    return this.dao.getNoticiasPorCategoria();
  }

  getNoticiasEngajamento(limit?: number) {
    return this.dao.getNoticiasEngajamento(limit);
  }

  getNoticiasTimeline() {
    return this.dao.getNoticiasTimeline();
  }

  getFilterOptions() {
    return this.dao.getFilterOptions();
  }

  async exportToExcel(indicadores: string[], filters: ReportFilters): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SENAI Vitrine de Projetos';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } },
      alignment: { horizontal: 'center' },
    };

    for (const indicador of indicadores) {
      switch (indicador) {
        case 'overview': {
          const data = await this.getOverview(filters);
          const ws = workbook.addWorksheet('Visão Geral');
          ws.columns = [{ header: 'Indicador', key: 'indicador', width: 30 }, { header: 'Valor', key: 'valor', width: 15 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          ws.addRow({ indicador: 'Total de Projetos', valor: data.total_projetos });
          ws.addRow({ indicador: 'Total de Alunos', valor: data.total_alunos });
          ws.addRow({ indicador: 'Total de Docentes', valor: data.total_docentes });
          ws.addRow({ indicador: 'Total de Cursos', valor: data.total_cursos });
          ws.addRow({ indicador: 'Taxa Itinerário (%)', valor: data.taxa_itinerario });
          ws.addRow({ indicador: 'Taxa SENAI Lab (%)', valor: data.taxa_senai_lab });
          ws.addRow({ indicador: 'Taxa SAGA (%)', valor: data.taxa_saga });
          ws.addRow({ indicador: 'Taxa Editais (%)', valor: data.taxa_editais });
          ws.addRow({ indicador: 'Taxa Premiação (%)', valor: data.taxa_premiacoes });
          break;
        }
        case 'projetos-por-curso': {
          const data = await this.getProjetosPorCurso(filters);
          const ws = workbook.addWorksheet('Projetos por Curso');
          ws.columns = [{ header: 'Curso', key: 'nome', width: 40 }, { header: 'Total', key: 'total', width: 10 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'projetos-por-modalidade': {
          const data = await this.getProjetosPorModalidade(filters);
          const ws = workbook.addWorksheet('Projetos por Modalidade');
          ws.columns = [{ header: 'Modalidade', key: 'nome', width: 30 }, { header: 'Total', key: 'total', width: 10 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'projetos-por-uc': {
          const data = await this.getProjetosPorUnidadeCurricular(filters);
          const ws = workbook.addWorksheet('Projetos por UC');
          ws.columns = [{ header: 'Unidade Curricular', key: 'nome', width: 40 }, { header: 'Total', key: 'total', width: 10 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'projetos-por-turma': {
          const data = await this.getProjetosPorTurma(filters);
          const ws = workbook.addWorksheet('Projetos por Turma');
          ws.columns = [{ header: 'Turma', key: 'nome', width: 30 }, { header: 'Total', key: 'total', width: 10 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'distribuicao-fases': {
          const data = await this.getDistribuicaoFases(filters);
          const ws = workbook.addWorksheet('Distribuição por Fase');
          ws.columns = [
            { header: 'Fase', key: 'fase', width: 20 },
            { header: 'Total', key: 'total', width: 10 },
            { header: '% do Total', key: 'percentual', width: 12 },
          ];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'taxa-participacao': {
          const data = await this.getTaxaParticipacao(filters);
          const ws = workbook.addWorksheet('Taxas de Participação');
          ws.columns = [{ header: 'Indicador', key: 'indicador', width: 35 }, { header: 'Total', key: 'total', width: 10 }, { header: 'Taxa (%)', key: 'taxa', width: 12 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          ws.addRow({ indicador: 'Itinerário de Projetos', total: data.itinerario, taxa: data.taxa_itinerario });
          ws.addRow({ indicador: 'SENAI Lab', total: data.senai_lab, taxa: data.taxa_senai_lab });
          ws.addRow({ indicador: 'SAGA SENAI', total: data.saga_senai, taxa: data.taxa_saga });
          ws.addRow({ indicador: 'Editais', total: data.participou_edital, taxa: data.taxa_editais });
          ws.addRow({ indicador: 'Premiação', total: data.ganhou_premio, taxa: data.taxa_premiacao });
          break;
        }
        case 'projetos-por-docente': {
          const data = await this.getProjetosPorDocente(filters, 50);
          const ws = workbook.addWorksheet('Projetos por Docente');
          ws.columns = [
            { header: 'Docente', key: 'nome', width: 30 },
            { header: 'Departamento', key: 'departamento', width: 25 },
            { header: 'Total Projetos', key: 'total_projetos', width: 15 },
            { header: 'Concluídos', key: 'projetos_concluidos', width: 12 },
            { header: 'Ativos', key: 'projetos_ativos', width: 10 },
          ];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'comportamento-orientadores': {
          const data = await this.getComportamentoOrientadores(filters);
          const ws = workbook.addWorksheet('Comportamento Orientadores');
          ws.columns = [
            { header: 'Orientador', key: 'nome', width: 30 },
            { header: 'Departamento', key: 'departamento', width: 25 },
            { header: 'Total Projetos', key: 'total_projetos', width: 15 },
            { header: 'Ativos', key: 'projetos_ativos', width: 10 },
            { header: 'Concluídos', key: 'projetos_concluidos', width: 12 },
            { header: 'Taxa Conclusão (%)', key: 'taxa_conclusao', width: 18 },
            { header: 'Média Dias/Projeto', key: 'media_dias_projeto', width: 18 },
          ];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          data.forEach(r => ws.addRow(r));
          break;
        }
        case 'noticias-overview': {
          const data = await this.getNoticiasOverview();
          const ws = workbook.addWorksheet('Notícias - Visão Geral');
          ws.columns = [{ header: 'Indicador', key: 'indicador', width: 30 }, { header: 'Valor', key: 'valor', width: 15 }];
          ws.getRow(1).eachCell(c => { Object.assign(c, { style: headerStyle }); });
          ws.addRow({ indicador: 'Total de Notícias', valor: data.total });
          ws.addRow({ indicador: 'Publicadas', valor: data.publicadas });
          ws.addRow({ indicador: 'Em Destaque', valor: data.destaque });
          ws.addRow({ indicador: 'Expiradas', valor: data.expiradas });
          ws.addRow({ indicador: 'Total Visualizações', valor: data.total_visualizacoes });
          ws.addRow({ indicador: 'Total Curtidas', valor: data.total_curtidas });
          break;
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
}
