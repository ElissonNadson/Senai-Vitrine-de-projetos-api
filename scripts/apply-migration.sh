#!/bin/bash

# Script para aplicar a migration de forma segura
# Verifica se as colunas já existem antes de adicionar

echo "🔍 Verificando estado atual do banco de dados..."

# Conectar ao banco e verificar colunas
psql -U postgres -d vitrine_senai -c "
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'projetos' 
  AND column_name IN (
    'categoria', 'curso', 'turma', 'modalidade', 
    'unidade_curricular', 'itinerario', 'senai_lab', 
    'saga_senai', 'has_repositorio', 'tipo_repositorio', 
    'link_repositorio', 'codigo_visibilidade', 
    'anexos_visibilidade', 'aceitou_termos'
  )
ORDER BY column_name;
"

echo ""
echo "📋 Verificando tabelas de fases..."

psql -U postgres -d vitrine_senai -c "
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'projetos_fases', 
  'projetos_fases_anexos', 
  'projetos_codigo'
);
"

echo ""
echo "⚠️  ATENÇÃO: Verifique os resultados acima antes de prosseguir!"
echo ""
read -p "Deseja aplicar a migration? (s/N): " resposta

if [[ "$resposta" =~ ^[Ss]$ ]]; then
    echo "🚀 Aplicando migration..."
    psql -U postgres -d vitrine_senai -f database/migrations/002_add_frontend_fields.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration aplicada com sucesso!"
    else
        echo "❌ Erro ao aplicar migration!"
        exit 1
    fi
else
    echo "❌ Migration cancelada pelo usuário"
    exit 0
fi

echo ""
echo "🎉 Processo concluído!"
