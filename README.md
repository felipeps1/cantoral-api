# Cantoral - API de Busca Automática

API simples para usar com o Cantoral publicado no GitHub Pages.

## Rota

GET /api/buscar-musica?q=Nome%20da%20música

Exemplo:

https://SEU-PROJETO.vercel.app/api/buscar-musica?q=T%C3%A3o%20Sublime%20Sacramento

## Variáveis de ambiente na Vercel

Obrigatória:

OPENAI_API_KEY=sk-...

Opcional:

OPENAI_MODEL=gpt-4.1-mini

## Como usar no Cantoral

No app, vá em:

Repertório > + Adicionar Nova > Configurar API

Cole a URL base da Vercel, por exemplo:

https://cantoral-api.vercel.app

Depois pesquise a música e clique em Buscar automaticamente.
