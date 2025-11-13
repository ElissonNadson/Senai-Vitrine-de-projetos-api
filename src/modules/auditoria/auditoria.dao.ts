import { CreateAuditoriaDto } from "./dto/create-tabulacao.dto";
import { Inject, Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import * as pg from 'pg';

@Injectable()
export class AuditoriaDao {
  constructor(@Inject('PG_POOL') private readonly db: pg.Pool) {}

  async getClient(): Promise<PoolClient> {
    return this.db.connect();
  }

  async createAuditoria(client: PoolClient, data: CreateAuditoriaDto) {

    const sql = `
      INSERT INTO tabulacao_auditoria (
        tabulacao_uuid, 
        acao, 
        matricula_usuario, 
        login_usuario, 
        nome_usuario, 
        funcao_usuario
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING id
    `;
    const p = [
      data.tabulacaoUuid, 
      data.acao, 
      data.matriculaUsuario, 
      data.loginUsuario, 
      data.nomeUsuario, 
      data.funcaoUsuario
    ];
    const { rows } = await client.query(sql, p);
    return rows[0] as { id: number; uuid: string };
  }
}
