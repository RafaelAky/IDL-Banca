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
Para a votação real, rode `backend/supabase.sql` no SQL Editor do Supabase
(tabelas `estado_votacao`, `fotos`, `fotos_lista`, `projetos` e as funções RPC `registrar_voto`,
`consultar_voto`, `resultado`, `entrar_admin`, `definir_votacao`, `definir_candidatos`,
`definir_total_trilheiros`, `definir_chave_evento`).
Use apenas a chave **anon/publishable** — nunca a `service_role`.

## Conteúdo editado no painel
Com o banco ligado, o que a organização salva no painel (evento, programação, projetos,
Heróis, textos) vai para a tabela `conteudo` e aparece para todo mundo em até 30 segundos.
Enquanto ninguém salvar nada, o site usa o `data.js`. Depois do primeiro salvamento, o banco
passa a valer — para voltar ao `data.js`, rode `delete from public.conteudo;` no SQL Editor.

## Telão
Abra `#/telao` no computador do projetor (ou pelo painel → Votação → Abrir o telão).
Mostra o QR Code da votação e uma animação **ilustrativa** de votos (não usa os votos reais).
Para exibir a palavra-chave do palco: `#/telao/SUAPALAVRA`.

## Prévia do link (WhatsApp)
No `index.html`, troque `SEU-DOMINIO` pelo endereço final do site nas tags `og:url` e `og:image`.

## Créditos
`vendor/qrcode.js` — QR Code Generator, © Kazuhiko Arase, licença MIT.
