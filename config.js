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

/* ---------------------------------------------------------------------
   2. AS CONTAS DA ORGANIZAÇÃO

   O painel administrativo abre só para os CPFs da organização. Os números
   não estão escritos aqui: cada linha guarda um código embaralhado e
   irreversível, do qual não dá para voltar ao CPF. Quem digitar um CPF
   da lista gera o mesmo código e entra; qualquer outro CPF não abre nada.

   Uma linha por pessoa. Para incluir ou tirar alguém, me peça o código
   do CPF novo — ele é gerado a partir do número e colado aqui.
   --------------------------------------------------------------------- */
window.IDL_ADMIN = [
  '0e4d09ac5db1d5f5567a7975bafc517dc2cdec8c6d6de53022a0126d4b524483',  // coordenação do evento
  '01b800df9a37e2d22d4a8737bb4fbc4dfa7c9b9cbcb91ce637f52f71eefd380b',  // organização
  'b56870de1da82b63cf3e1154253931af5f24e8bd8e295905206116b40e31ee24',  // organização
  'ba4a4549e2d29e0673ad4710b164031fa5ee87d0a9960611ddb57604aaaccbb1',  // organização
  '6a7bb49e22c2bb68eb28c06987d50e8d908c809cfecd1ca30e8768d4d82233fb'   // Rafael Dutra
];

/* ---------------------------------------------------------------------
   3. SENHA DO PAINEL

   O CPF diz QUEM é. A senha confirma que é mesmo a pessoa — porque um
   CPF circula em ficha de matrícula e lista de presença, e não guarda
   segredo sozinho. É a mesma senha para todas as contas da lista acima,
   e ela é pedida uma vez só em cada aparelho.

   A senha NÃO está escrita aqui. Este arquivo fica visível na internet
   depois que o site é publicado — qualquer pessoa pode abri-lo — então
   o que fica guardado é um código embaralhado e irreversível dela.
   Quem digita a senha certa gera o mesmo código e entra.

   Para trocar a senha, me peça o código novo.

   Com o banco de dados ligado, quem manda é a chave_admin guardada no
   servidor, e esta linha deixa de valer.
   --------------------------------------------------------------------- */
window.IDL_SENHA_HASH = 'c29cb289acaf83fb613739d4ea8a49efb4679052081e599f5279b39478537114';
