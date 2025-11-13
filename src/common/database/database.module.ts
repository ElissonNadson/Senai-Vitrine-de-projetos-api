// src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';

@Global() // Torna o módulo global para evitar múltiplas importações
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      useFactory: async () => {
        const pool = new Pool({
          user: process.env.USERNAME,
          password: process.env.PASSWORD,
          host: process.env.HOST,
          database: process.env.DATABASE,
          port: Number(process.env.DB_PORT) || 5432, // Porta padrão do Postgres
          max: 10, // Máximo de conexões no pool
        });

        try {
          // Testa a conexão durante a inicialização
          const client = await pool.connect();
          client.release();
          console.log('Conectado ao banco de dados PostgreSQL com sucesso!');
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
