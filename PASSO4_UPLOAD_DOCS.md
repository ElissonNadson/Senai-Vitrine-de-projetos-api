# Documentação - Passo 4: Upload de Anexos por Fase

## Visão Geral

O endpoint `POST /projetos/:uuid/passo4` agora aceita **multipart/form-data** para envio de arquivos físicos junto com os metadados JSON das fases.

## Comportamento

### Substituição Inteligente
- **Apenas anexos enviados são processados**: Se você enviar apenas 1 anexo, apenas ele será salvo/atualizado
- **Outros anexos permanecem intactos**: Anexos não incluídos na requisição não são afetados
- **Chave única**: `(fase_uuid, tipo_anexo, nome_arquivo)` - Se o tipo e nome forem iguais, o anexo é sobrescrito

### Exemplo de Casos de Uso

#### Caso 1: Primeira vez enviando anexos
```
POST /projetos/uuid-123/passo4
Content-Type: multipart/form-data

- ideacao[descricao]: "Descrição da fase de ideação"
- ideacao[anexos][0][tipo]: "crazy8"
- ideacao[anexos][0][id]: "new-1"
- arquivos (file): crazy8.pdf
- fieldname do arquivo: "ideacao_crazy8"
```

**Resultado**: Anexo `crazy8.pdf` é salvo na fase de ideação

---

#### Caso 2: Atualizando apenas 1 anexo existente
```
POST /projetos/uuid-123/passo4
Content-Type: multipart/form-data

- ideacao[anexos][0][tipo]: "crazy8"
- ideacao[anexos][0][nome_arquivo]: "crazy8.pdf"
- arquivos (file): crazy8-v2.pdf (novo arquivo)
- fieldname do arquivo: "ideacao_crazy8"
```

**Resultado**:
- ✅ Anexo `crazy8.pdf` é substituído por `crazy8-v2.pdf`
- ✅ Outros anexos (mapa_mental, etc.) permanecem intactos

---

#### Caso 3: Enviando múltiplos anexos de uma vez
```
POST /projetos/uuid-123/passo4
Content-Type: multipart/form-data

- ideacao[anexos][0][tipo]: "crazy8"
- ideacao[anexos][1][tipo]: "mapa_mental"
- modelagem[anexos][0][tipo]: "wireframe"
- arquivos[0] (file): crazy8.pdf
- arquivos[1] (file): mapa.png
- arquivos[2] (file): wireframe.fig
- fieldnames: "ideacao_crazy8", "ideacao_mapa_mental", "modelagem_wireframe"
```

**Resultado**: Todos os 3 anexos são salvos nas respectivas fases

---

## Estrutura do Payload

### Formato JSON (campo `dados`)

```json
{
  "ideacao": {
    "descricao": "Descrição da fase de ideação",
    "anexos": [
      {
        "id": "uuid-ou-id-temporário",
        "tipo": "crazy8",
        "nome_arquivo": "crazy8.pdf",
        "url_arquivo": "/uploads/projetos/ideacao/crazy8.pdf"
      }
    ]
  },
  "modelagem": {
    "descricao": "Descrição da fase de modelagem",
    "anexos": [
      {
        "id": "uuid-2",
        "tipo": "wireframe",
        "nome_arquivo": "wireframe.png",
        "url_arquivo": "/uploads/projetos/modelagem/wireframe.png"
      }
    ]
  },
  "prototipagem": {
    "descricao": "Descrição da fase de prototipagem",
    "anexos": []
  },
  "implementacao": {
    "descricao": "Descrição da fase de implementação",
    "anexos": []
  }
}
```

### Arquivos (multipart)

Os arquivos devem ser enviados com o **fieldname** no formato:
```
{fase}_{tipo_anexo}
```

**Exemplos**:
- `ideacao_crazy8` → Arquivo para o anexo "crazy8" da fase "ideação"
- `modelagem_wireframe` → Arquivo para o anexo "wireframe" da fase "modelagem"
- `prototipagem_prototipo_alta` → Arquivo para "prototipo_alta" da prototipagem

---

## Tipos de Anexo por Fase

### Ideação
- `crazy8`
- `mapa_mental`
- `persona`
- `jornada_usuario`

### Modelagem
- `wireframe`
- `mockup`
- `diagrama_arquitetura`

### Prototipagem
- `prototipo_baixa`
- `prototipo_media`
- `prototipo_alta`

### Implementação
- `codigo_fonte`
- `documentacao`
- `video_demo`
- `apresentacao`

---

## Exemplo Frontend (FormData)

```javascript
const formData = new FormData();

// Adicionar dados JSON
formData.append('ideacao[descricao]', 'Descrição da ideação');
formData.append('ideacao[anexos][0][id]', 'temp-1');
formData.append('ideacao[anexos][0][tipo]', 'crazy8');
formData.append('ideacao[anexos][0][nome_arquivo]', file.name);

// Adicionar arquivo
formData.append('ideacao_crazy8', file); // fieldname = fase_tipo

// Enviar
await axios.post(`/projetos/${uuid}/passo4`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## Resposta da API

### Sucesso (200)
```json
{
  "mensagem": "Fases do projeto atualizadas com sucesso"
}
```

### Erro (400)
```json
{
  "statusCode": 400,
  "message": "Tipo de arquivo não suportado",
  "error": "Bad Request"
}
```

---

## Limitações

- **Máximo de 50 arquivos por requisição**
- **Tamanho máximo por arquivo**: 10MB
- **Formatos suportados**: PDF, PNG, JPG, JPEG, GIF, DOC, DOCX, MP4, MOV, FIG

---

## Checklist para Implementação Frontend

- [ ] Criar `FormData` para enviar dados + arquivos
- [ ] Usar fieldname no formato `{fase}_{tipo}`
- [ ] Enviar apenas anexos que foram modificados/adicionados
- [ ] Manter referência dos anexos existentes no estado
- [ ] Adicionar loading/progress bar durante upload
- [ ] Tratar erros de validação de arquivo
- [ ] Mostrar preview dos arquivos antes do envio

---

## Notas Técnicas

1. **O arquivo físico sobrescreve a URL**: Se você enviar um arquivo físico, a URL no payload JSON será ignorada e substituída pela URL do arquivo salvo no servidor

2. **Anexos sem arquivo físico**: Se você enviar apenas o JSON sem arquivo físico, o anexo será salvo com a URL fornecida no payload (útil para manter anexos existentes)

3. **Validação automática**: A API valida tamanho, tipo MIME e extensão de cada arquivo automaticamente

4. **Transação atômica**: Se qualquer erro ocorrer durante o processamento, toda a operação é revertida (rollback)
