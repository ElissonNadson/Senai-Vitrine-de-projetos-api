#!/bin/bash

# Script para executar migrations e seeds do banco de dados
# Uso: ./scripts/setup-db.sh [migration|seed|all|check]

set -e

DB_CONTAINER="vitrine-senai-db"
DB_NAME="vitrine_projetos"
DB_USER="postgres"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se o container está rodando
check_container() {
    if ! docker compose ps | grep -q "${DB_CONTAINER}.*Up"; then
        echo -e "${RED}❌ Container do banco não está rodando!${NC}"
        echo "Execute: docker compose up -d vitrine-senai-db"
        exit 1
    fi
}

# Função para executar migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo -e "${YELLOW}📦 Executando migration: ${migration_name}${NC}"
    
    # Copiar arquivo para o container
    docker compose cp "$migration_file" "${DB_CONTAINER}:/tmp/${migration_name}" > /dev/null 2>&1
    
    # Executar migration
    if docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -f "/tmp/${migration_name}" 2>&1 | grep -v "already exists\|does not exist\|duplicate key"; then
        echo -e "${GREEN}✅ Migration ${migration_name} executada com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Migration ${migration_name} pode já ter sido executada ou teve avisos${NC}"
    fi
}

# Função para executar seeds
run_seeds() {
    echo -e "${YELLOW}🌱 Executando seeds...${NC}"
    
    docker compose cp database/seeds/seeds.sql "${DB_CONTAINER}:/tmp/seeds.sql" > /dev/null 2>&1
    
    if docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -f /tmp/seeds.sql 2>&1 | grep -v "already exists\|duplicate key"; then
        echo -e "${GREEN}✅ Seeds executados com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Seeds podem já ter sido executados ou tiveram avisos${NC}"
    fi
}

# Função para verificar status
check_status() {
    echo -e "${YELLOW}🔍 Verificando status do banco...${NC}"
    
    docker compose exec -T "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" << EOF
SELECT 
    'departamentos' as tabela, COUNT(*)::text as total FROM departamentos
UNION ALL
SELECT 'tecnologias', COUNT(*)::text FROM tecnologias
UNION ALL
SELECT 'cursos', COUNT(*)::text FROM cursos
UNION ALL
SELECT 'turmas', COUNT(*)::text FROM turmas
UNION ALL
SELECT 'usuarios', COUNT(*)::text FROM usuarios
UNION ALL
SELECT 'projetos', COUNT(*)::text FROM projetos;
EOF
}

# Função principal
main() {
    local command=${1:-"all"}
    
    check_container
    
    case "$command" in
        migration|migrations)
            echo -e "${GREEN}🚀 Executando migrations principais...${NC}"
            run_migration "database/migrations/001_schema.sql"
            [ -f "database/migrations/002_cursos_turmas.sql" ] && run_migration "database/migrations/002_cursos_turmas.sql"
            [ -f "database/migrations/003_add_auditoria.sql" ] && run_migration "database/migrations/003_add_auditoria.sql"
            [ -f "database/migrations/003_sessoes_usuarios.sql" ] && run_migration "database/migrations/003_sessoes_usuarios.sql"
            [ -f "database/migrations/004_create_news_table.sql" ] && run_migration "database/migrations/004_create_news_table.sql"
            [ -f "database/migrations/006_add_news_metrics.sql" ] && run_migration "database/migrations/006_add_news_metrics.sql"
            [ -f "database/migrations/007_add_expiration_date.sql" ] && run_migration "database/migrations/007_add_expiration_date.sql"
            [ -f "database/migrations/010_rename_professor_to_docente.sql" ] && run_migration "database/migrations/010_rename_professor_to_docente.sql"
            [ -f "database/migrations/011_add_participou_edital_ganhou_premio.sql" ] && run_migration "database/migrations/011_add_participou_edital_ganhou_premio.sql"
            [ -f "database/migrations/012_add_status_projetos_fases.sql" ] && run_migration "database/migrations/012_add_status_projetos_fases.sql"
            [ -f "database/migrations/013_soft_delete_docentes.sql" ] && run_migration "database/migrations/013_soft_delete_docentes.sql"
            [ -f "database/migrations/014_rename_arquivado_to_desativado.sql" ] && run_migration "database/migrations/014_rename_arquivado_to_desativado.sql"
            [ -f "database/migrations/015_move_modalidade_from_cursos_to_turmas.sql" ] && run_migration "database/migrations/015_move_modalidade_from_cursos_to_turmas.sql"
            ;;
        seed|seeds)
            echo -e "${GREEN}🚀 Executando seeds...${NC}"
            run_seeds
            ;;
        check|status)
            check_status
            ;;
        single)
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Especifique o arquivo de migration!${NC}"
                echo "Uso: $0 single database/migrations/011_add_participou_edital_ganhou_premio.sql"
                exit 1
            fi
            run_migration "$2"
            ;;
        all)
            echo -e "${GREEN}🚀 Executando migrations e seeds...${NC}"
            run_migration "database/migrations/001_schema.sql"
            [ -f "database/migrations/002_cursos_turmas.sql" ] && run_migration "database/migrations/002_cursos_turmas.sql"
            [ -f "database/migrations/003_add_auditoria.sql" ] && run_migration "database/migrations/003_add_auditoria.sql"
            [ -f "database/migrations/003_sessoes_usuarios.sql" ] && run_migration "database/migrations/003_sessoes_usuarios.sql"
            [ -f "database/migrations/004_create_news_table.sql" ] && run_migration "database/migrations/004_create_news_table.sql"
            [ -f "database/migrations/006_add_news_metrics.sql" ] && run_migration "database/migrations/006_add_news_metrics.sql"
            [ -f "database/migrations/007_add_expiration_date.sql" ] && run_migration "database/migrations/007_add_expiration_date.sql"
            [ -f "database/migrations/010_rename_professor_to_docente.sql" ] && run_migration "database/migrations/010_rename_professor_to_docente.sql"
            [ -f "database/migrations/011_add_participou_edital_ganhou_premio.sql" ] && run_migration "database/migrations/011_add_participou_edital_ganhou_premio.sql"
            [ -f "database/migrations/012_add_status_projetos_fases.sql" ] && run_migration "database/migrations/012_add_status_projetos_fases.sql"
            [ -f "database/migrations/013_soft_delete_docentes.sql" ] && run_migration "database/migrations/013_soft_delete_docentes.sql"
            [ -f "database/migrations/014_rename_arquivado_to_desativado.sql" ] && run_migration "database/migrations/014_rename_arquivado_to_desativado.sql"
            [ -f "database/migrations/015_move_modalidade_from_cursos_to_turmas.sql" ] && run_migration "database/migrations/015_move_modalidade_from_cursos_to_turmas.sql"
            run_seeds
            check_status
            ;;
        *)
            echo "Uso: $0 [migration|seed|all|check|single]"
            echo ""
            echo "Comandos:"
            echo "  migration  - Executa apenas as migrations"
            echo "  seed       - Executa apenas os seeds"
            echo "  all        - Executa migrations e seeds (padrão)"
            echo "  check      - Verifica status do banco"
            echo "  single     - Executa uma migration específica"
            echo "               Exemplo: $0 single database/migrations/011_add_participou_edital_ganhou_premio.sql"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 Processo concluído!${NC}"
}

main "$@"

