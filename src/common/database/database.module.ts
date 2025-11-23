// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';

@Global() // Torna o módulo global para evitar múltiplas importações
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      useFactory: async () => {
        // Preferir variáveis específicas de DB para evitar colisão com variáveis de SO (ex: USERNAME no Windows)
        const dbUser = process.env.DB_USER || process.env.POSTGRES_USER || process.env.USERNAME;
        const dbPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PASSWORD;
        const dbHost = process.env.HOST || process.env.DB_HOST || 'localhost';
        const dbPort = Number(process.env.DB_PORT || process.env.POSTGRES_PORT) || 5432;
        const dbName = process.env.DATABASE || process.env.POSTGRES_DB;

        const pool = new Pool({
          user: dbUser,
          password: dbPassword,
          host: dbHost,
          database: dbName,
          port: dbPort, // Porta do Postgres
          max: 10, // Máximo de conexões no pool
        });

        try {
          // Testa a conexão durante a inicialização
          const client = await pool.connect();
          client.release();
        } catch (err) {
          console.error('Erro ao conectar ao banco de dados PostgreSQL:', err);
        }

        return pool;
      },
    },
  ],
  exports: ['PG_POOL'],
})
export class DatabaseModule {}
