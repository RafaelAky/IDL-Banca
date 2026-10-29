# Banca Final IDL Tech · Trilha 2026

Site estático (HTML + CSS + JS puro, sem build) do evento de 14/11/2026 no Sebrae.

## Estrutura
- `index.html` – página principal
- `styles.css` – estilos
- `config.js` – **único arquivo a configurar** (Supabase, contas e senha do painel)
- `data.js` – conteúdo do evento (programação, projetos, heróis, fotos)
- `app.js` – lógica do aplicativo
- `img/` – fotos, pôsteres e identidade visual

## Publicar no GitHub
```bash
git init
git add .
git commit -m "Banca Final IDL Tech"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/banca-idl-tech.git
git push -u origin main
```

## Publicar na Vercel
1. vercel.com → **Add New → Project** → importe o repositório.
2. Framework Preset: **Other**. Build Command: vazio. Output Directory: `.` (raiz).
3. Deploy. Cada `git push` na `main` publica de novo automaticamente.

## Banco de dados (votação compartilhada)
Sem `url`/`anonKey` em `config.js`, o site roda em **modo prévia** (votos e fotos ficam só no aparelho).
Para a votação real é preciso um projeto Supabase com o schema `backend/supabase.sql`
(tabelas `estado_votacao`, `fotos`, `fotos_lista`, `projetos` e as funções RPC `registrar_voto`,
`consultar_voto`, `resultado`, `entrar_admin`, `definir_votacao`, `definir_candidatos`,
`definir_total_trilheiros`, `definir_chave_evento`).
Use apenas a chave **anon/publishable** — nunca a `service_role`.
