import { Inject, Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import * as pg from 'pg';
import { CreateNoticiaDto, UpdateNoticiaDto } from './dto/noticias.dto';

@Injectable()
export class NoticiasService {
    private readonly logger = new Logger(NoticiasService.name);

    constructor(@Inject('PG_POOL') private readonly pool: pg.Pool) { }

    async create(createNoticiaDto: CreateNoticiaDto, userId: string) {
        const {
            titulo, resumo, conteudo, bannerUrl,
            dataEvento, localEvento, categoria, publicado, destaque, dataExpiracao
        } = createNoticiaDto;

        try {
            const result = await this.pool.query(
                `INSERT INTO noticias (
            titulo, resumo, conteudo, banner_url,
            data_evento, local_evento, categoria, publicado, destaque, autor_uuid, data_publicacao, data_expiracao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
                [
                    titulo, resumo, conteudo, bannerUrl,
                    dataEvento, localEvento, categoria || 'GERAL',
                    publicado ?? true, destaque ?? false, userId,
                    publicado ? new Date() : null,
                    dataExpiracao || null
                ]
            );
            return result.rows[0];
        } catch (error) {
            this.logger.error(`Erro ao criar notícia: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Erro ao criar notícia');
        }
    }

    async findAll(page: number = 1, limit: number = 10, publicOnly: boolean = true) {
        const offset = (page - 1) * limit;

        let query = `
      SELECT n.*, u.nome as autor_nome, u.avatar_url as autor_avatar
      FROM noticias n
      LEFT JOIN usuarios u ON n.autor_uuid = u.uuid
    `;

        const params: any[] = [limit, offset];

        if (publicOnly) {
            query += ` WHERE n.publicado = TRUE`;
        }

        query += ` ORDER BY n.data_publicacao DESC LIMIT $1 OFFSET $2`;

        const result = await this.pool.query(query, params);

        // Count total
        const countQuery = publicOnly
            ? 'SELECT COUNT(*) FROM noticias WHERE publicado = TRUE'
            : 'SELECT COUNT(*) FROM noticias';

        const countResult = await this.pool.query(countQuery);

        return {
            data: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            limit
        };
    }

    async findOne(id: string) {
        const result = await this.pool.query(
            `SELECT n.*, u.nome as autor_nome, u.avatar_url as autor_avatar
       FROM noticias n
       LEFT JOIN usuarios u ON n.autor_uuid = u.uuid
       WHERE n.uuid = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new NotFoundException('Notícia não encontrada');
        }

        return result.rows[0];
    }

    async update(id: string, updateNoticiaDto: UpdateNoticiaDto) {
        // Let's refactor the loop correctly.
        // If updating published to true -> add logic to set data_publicacao

        const updates: string[] = [];
        const queryValues: any[] = [];
        let paramIdx = 1;

        Object.entries(updateNoticiaDto).forEach(([key, value]) => {
            if (value === undefined) return;

            if (key === 'publicado') {
                updates.push(`publicado = $${paramIdx}`);
                queryValues.push(value);
                paramIdx++;
                if (value === true) {
                    updates.push(`data_publicacao = COALESCE(data_publicacao, NOW())`);
                }
                return;
            }

            // Generic handler
            const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            updates.push(`${dbField} = $${paramIdx}`);
            queryValues.push(value);
            paramIdx++;
        });

        if (updates.length === 0) return this.findOne(id);

        // Always update 'atualizado_em'
        updates.push(`atualizado_em = NOW()`);

        queryValues.push(id);
        const query = `
      UPDATE noticias 
      SET ${updates.join(', ')}
      WHERE uuid = $${paramIdx}
      RETURNING *
    `;

        try {
            const result = await this.pool.query(query, queryValues);

            if (result.rows.length === 0) {
                throw new NotFoundException('Notícia não encontrada');
            }

            return result.rows[0];
        } catch (error) {
            this.logger.error(`Erro ao atualizar notícia ${id}: ${error.message}`, error.stack);
            throw error instanceof NotFoundException ? error : new InternalServerErrorException('Erro ao atualizar notícia');
        }
    }

    async remove(id: string) {
        const result = await this.pool.query(
            'DELETE FROM noticias WHERE uuid = $1 RETURNING uuid',
            [id]
        );

        if (result.rows.length === 0) {
            throw new NotFoundException('Notícia não encontrada');
        }

        return { message: 'Notícia removida com sucesso' };
    }
    async incrementViews(id: string) {
        const result = await this.pool.query(
            'UPDATE noticias SET visualizacoes = visualizacoes + 1 WHERE uuid = $1 RETURNING visualizacoes',
            [id]
        );
        if (result.rows.length === 0) throw new NotFoundException('Notícia não encontrada');
        return result.rows[0];
    }

    async like(id: string) {
        const result = await this.pool.query(
            'UPDATE noticias SET curtidas = curtidas + 1 WHERE uuid = $1 RETURNING curtidas',
            [id]
        );
        if (result.rows.length === 0) throw new NotFoundException('Notícia não encontrada');
        return result.rows[0];
    }

    async unlike(id: string) {
        const result = await this.pool.query(
            'UPDATE noticias SET curtidas = GREATEST(curtidas - 1, 0) WHERE uuid = $1 RETURNING curtidas',
            [id]
        );
        if (result.rows.length === 0) throw new NotFoundException('Notícia não encontrada');
        return result.rows[0];
    }

    async archiveOldNews() {
        const result = await this.pool.query(
            `UPDATE noticias 
             SET publicado = FALSE, atualizado_em = NOW() 
             WHERE publicado = TRUE 
             AND data_expiracao IS NOT NULL 
             AND data_expiracao < NOW()
             RETURNING uuid, titulo`
        );
        return result.rows;
    }
}
