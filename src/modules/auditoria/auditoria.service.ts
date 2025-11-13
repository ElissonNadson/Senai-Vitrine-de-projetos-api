import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { Injectable, BadRequestException } from "@nestjs/common";
import { CreateAuditoriaDto } from "./dto/create-tabulacao.dto";
import { AuditoriaDao } from "./auditoria.dao";

@Injectable()
export class AuditoriaService {
  constructor(private readonly dao: AuditoriaDao) {}

  async create(data: CreateAuditoriaDto, userFromCookie: JwtPayload) {
    const client = await this.dao.getClient();
    try {
      await client.query("BEGIN");

      // sobrescreve operador pelo cookie
      const auditoria = {...data, loginUsuario: userFromCookie.LOGIN, matriculaUsuario: userFromCookie.MATRICULA, nomeUsuario: userFromCookie.NOME, funcaoUsuario: userFromCookie.FUNCAO} as CreateAuditoriaDto

      const { uuid, id } = await this.dao.createAuditoria(client, auditoria);

      await client.query("COMMIT");
      return { uuid, id };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
