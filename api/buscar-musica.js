export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido. Use GET.' });
  }

  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ erro: 'Informe o parâmetro q. Ex: /api/buscar-musica?q=Tão Sublime Sacramento' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ erro: 'OPENAI_API_KEY não configurada na Vercel.' });
  }

  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      resultados: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            titulo: { type: 'string' },
            artista: { type: 'string' },
            tom: { type: 'string' },
            momentoSugerido: { type: 'string' },
            tempoLiturgicoSugerido: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
            fonte: { type: 'string' },
            url: { type: 'string' },
            resumo: { type: 'string' }
          },
          required: ['titulo', 'artista', 'tom', 'momentoSugerido', 'tempoLiturgicoSugerido', 'tags', 'fonte', 'url', 'resumo']
        }
      }
    },
    required: ['resultados']
  };

  try {
    const openaiResp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        tools: [{ type: 'web_search' }],
        input: [
          {
            role: 'system',
            content: [
              'Você é um assistente para um app chamado Cantoral, usado para organizar músicas católicas para missa e adoração.',
              'Pesquise na web e retorne apenas músicas católicas relevantes ao termo.',
              'Não copie letra completa nem cifra completa protegida por direitos autorais.',
              'Retorne metadados, sugestão litúrgica, tags e links de fontes confiáveis para o usuário revisar.',
              'Momentos válidos: entrada, ato-penitencial, gloria, salmo, aclamacao, ofertorio, santo, consagracao, pai-nosso, cordeiro, comunhao, acao-gracas, adoracao, encerramento.',
              'Tempos litúrgicos válidos: tempo-comum, advento, natal, quaresma, pascoa.'
            ].join(' ')
          },
          {
            role: 'user',
            content: `Buscar música católica: ${q}`
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'cantoral_busca_musica',
            schema,
            strict: true
          }
        }
      })
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      return res.status(openaiResp.status).json({ erro: 'Erro ao consultar OpenAI.', detalhes: errText });
    }

    const data = await openaiResp.json();
    const outputText = data.output_text || extrairTexto(data);
    const parsed = JSON.parse(outputText || '{"resultados":[]}');

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro inesperado na busca.', detalhes: String(error?.message || error) });
  }
}

function extrairTexto(data) {
  try {
    const parts = [];
    for (const item of data.output || []) {
      for (const content of item.content || []) {
        if (content.type === 'output_text' && content.text) parts.push(content.text);
      }
    }
    return parts.join('\n').trim();
  } catch {
    return '';
  }
}
