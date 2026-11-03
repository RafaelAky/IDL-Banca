/* =====================================================================
   Configuração do aplicativo da Banca Final IDL Tech.
   Leia o README.md — só este arquivo precisa ser editado.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. BANCO DE DADOS DA VOTAÇÃO (Supabase)

   Project Settings → API → copie o "Project URL" e a chave
   "anon / publishable" e cole abaixo.

   A chave anon é feita para ficar visível no site — quem protege os
   dados é a Row Level Security do banco, já configurada no
   backend/supabase.sql. NUNCA cole aqui a chave "service_role".

   Enquanto estiver em branco, o aplicativo funciona em modo prévia:
   a votação e as fotos do painel ficam só no aparelho de quem está usando.
   Com o banco ligado, as fotos que a organização põe no painel aparecem
   para todo mundo na hora.
   --------------------------------------------------------------------- */
window.IDL_BACKEND = {
  url: 'https://uvdptevujvtnvmxhcqlu.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZHB0ZXZ1anZ0bnZteGhjcWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNDY0MzEsImV4cCI6MjEwODgyMjQzMX0.zvaHLS0qJvNX_SJ1aumxlNQWKpBZU4e4eKQacjq-9D4'
};

/* Endereço oficial do site: é para onde aponta o QR Code do telão,
   mesmo que o telão seja aberto por outro endereço. */
window.IDL_SITE_URL = 'https://idl-banca.vercel.app';

/* ---------------------------------------------------------------------
   2. ACESSO DA ORGANIZAÇÃO E DA BANCA

   Não há mais lista de CPFs. A entrada é uma tela só (4 toques na logo,
   ou o QR "Entrar"): nome completo + senha. Com o banco ligado, quem
   confere a senha é o servidor (senhas trocáveis no painel → aba Banca):
     · senha da organização (começa como trilhei2026) → painel
     · senha da banca (começa como banca2026) → área da banca

   A linha abaixo só vale no MODO PRÉVIA (sem banco): é o código
   embaralhado e irreversível da senha da organização (trilhei2026).
   --------------------------------------------------------------------- */
window.IDL_SENHA_HASH = '7ccf95047238df2ecb6dd15d1e0cbc7216efac5671642efe15ca19a2c50951cb';   // trilhei2026 (só vale sem o banco)
