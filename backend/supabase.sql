-- =====================================================================
--  Banca Final IDL Tech · Trilha 2026 — banco da votação e das fotos
--
--  Como usar: Supabase → SQL Editor → New query → cole TUDO → Run.
--  Pode rodar de novo sem perder votos nem fotos (é idempotente).
--
--  Segurança: todas as tabelas têm Row Level Security. O site (chave anon)
--  só LÊ o estado da votação, a lista de candidatos e as fotos. Votar e
--  qualquer ação da organização passam pelas funções abaixo, que conferem
--  a senha do painel no servidor. Os votos guardam só o código
--  embaralhado do CPF (sha256), nunca o número.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. TABELAS
-- ---------------------------------------------------------------------

-- estado público da votação (uma linha só, id = 1)
create table if not exists public.estado_votacao (
  id                int primary key default 1 check (id = 1),
  votacao_aberta    boolean not null default false,
  resultado_publico boolean not null default false,
  exige_chave       boolean not null default false,
  total_trilheiros  int,
  atualizado_em     timestamptz not null default now()
);
insert into public.estado_votacao (id) values (1) on conflict (id) do nothing;
-- rodada: sobe 1 cada vez que a organização zera os votos; os aparelhos
-- que já tinham votado percebem a mudança e liberam o voto de novo
alter table public.estado_votacao add column if not exists rodada int not null default 1;
-- votacao_visivel: a aba Votação aparece no site para o público (chave do painel)
alter table public.estado_votacao add column if not exists votacao_visivel boolean not null default false;
-- palco: a equipe (projeto) que está apresentando agora, marcada no painel
alter table public.estado_votacao add column if not exists palco text;
-- reinicio: sobe 1 quando a organização usa "Zerar tudo"; os aparelhos
-- percebem e limpam o que guardam (projetos conhecidos, voto marcado)
alter table public.estado_votacao add column if not exists reinicio int not null default 0;
-- revelar_telao: a organização mandou o telão revelar o Herói vencedor
alter table public.estado_votacao add column if not exists revelar_telao boolean not null default false;

-- segredos do servidor (ninguém de fora lê: RLS sem nenhuma política)
create table if not exists public.config_privada (
  id               int primary key default 1 check (id = 1),
  chave_admin_hash text not null,
  chave_evento     text
);
-- senha da banca (jurados), guardada só como código embaralhado
alter table public.config_privada add column if not exists chave_banca_hash text;

-- avaliações da banca: uma nota e um comentário por jurado e por equipe
create table if not exists public.avaliacoes (
  jurado        text not null check (length(trim(jurado)) between 2 and 60),
  projeto_id    text not null,
  nota          numeric(4,1) check (nota is null or (nota >= 0 and nota <= 10)),
  comentario    text not null default '' check (length(comentario) <= 4000),
  atualizado_em timestamptz not null default now(),
  primary key (jurado, projeto_id)
);

-- notas por critério (1 a 5): {"ideia":4,"problema":5,...}; "nota" guarda a média
alter table public.avaliacoes add column if not exists notas jsonb not null default '{}'::jsonb;

-- pausa: o telão mostra o mosaico de fotos (modo pausa), por cima de qualquer slide
alter table public.estado_votacao add column if not exists pausa boolean not null default false;

-- slide: o slide da apresentação que o telão mostra agora (vazio = tela da votação de sempre)
alter table public.estado_votacao add column if not exists slide text;

-- revelar_banca: o telão revela o Projeto destaque escolhido pela banca
alter table public.estado_votacao add column if not exists revelar_banca boolean not null default false;

-- avaliações da banca: começam fechadas; a organização abre quando quiser
alter table public.estado_votacao add column if not exists avaliacoes_abertas boolean not null default false;

-- decisão final da banca: cada jurado escolhe 3 projetos, em ordem
-- (1º = 3 pontos, 2º = 2, 3º = 1); pode trocar enquanto estiver aberta
alter table public.estado_votacao add column if not exists decisao_aberta boolean not null default false;
create table if not exists public.decisao_banca (
  jurado     text not null check (length(trim(jurado)) between 2 and 60),
  posicao    smallint not null default 1 check (posicao between 1 and 3),
  projeto_id text not null,
  em         timestamptz not null default now(),
  primary key (jurado, posicao)
);
-- banco antigo (1 voto por jurado): ganha a coluna posicao e a chave (jurado, posicao)
alter table public.decisao_banca add column if not exists posicao smallint not null default 1;
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'decisao_banca_pkey' and conrelid = 'public.decisao_banca'::regclass
              and array_length(conkey, 1) = 1) then
    alter table public.decisao_banca drop constraint decisao_banca_pkey;
    alter table public.decisao_banca add primary key (jurado, posicao);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'decisao_banca_posicao_check' and conrelid = 'public.decisao_banca'::regclass) then
    alter table public.decisao_banca add constraint decisao_banca_posicao_check check (posicao between 1 and 3);
  end if;
end $$;

-- opções de voto (Heróis "her_..." ou projetos "prj_...")
create table if not exists public.projetos (
  id       text primary key,
  nome     text not null default '',
  elegivel boolean not null default false
);

-- votos: um por CPF (código embaralhado)
create table if not exists public.votos (
  hash       text primary key check (hash ~ '^[0-9a-f]{64}$'),
  projeto_id text not null references public.projetos(id),
  criado_em  timestamptz not null default now()
);

-- fotos do painel (enviadas como data URL ou como link https)
create table if not exists public.fotos (
  id         uuid primary key default gen_random_uuid(),
  dado       text,
  src        text,
  legenda    text not null default '',
  larga      boolean not null default false,
  capa       boolean not null default false,
  ordem      int not null default 0,
  projeto_id text,
  criado_em  timestamptz not null default now(),
  check (dado is not null or src is not null)
);

-- conteúdo editado no painel (evento, programação, projetos, Heróis, textos)
-- uma linha só; enquanto estiver vazia, o site usa o data.js
create table if not exists public.conteudo (
  id            int primary key default 1 check (id = 1),
  dados         jsonb not null,
  versao        bigint not null default 1,
  atualizado_em timestamptz not null default now()
);

-- lista leve das fotos, sem o conteúdo pesado (o site busca o "dado" depois)
create or replace view public.fotos_lista with (security_invoker = true) as
  select id, src, legenda, larga, capa, ordem, projeto_id, criado_em
  from public.fotos;

-- ---------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY — leitura pública só do que é público
-- ---------------------------------------------------------------------
alter table public.estado_votacao enable row level security;
alter table public.config_privada enable row level security;
alter table public.projetos       enable row level security;
alter table public.votos          enable row level security;
alter table public.fotos          enable row level security;
alter table public.conteudo       enable row level security;
alter table public.avaliacoes     enable row level security;
alter table public.decisao_banca  enable row level security;

drop policy if exists leitura_publica on public.estado_votacao;
create policy leitura_publica on public.estado_votacao for select to anon, authenticated using (true);
-- tempo real: o telão e o controle recebem a troca de slide na hora (sem esperar a próxima consulta)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'estado_votacao') then
    execute 'alter publication supabase_realtime add table public.estado_votacao';
  end if;
end $$;
drop policy if exists leitura_publica on public.projetos;
create policy leitura_publica on public.projetos for select to anon, authenticated using (true);
drop policy if exists leitura_publica on public.fotos;
create policy leitura_publica on public.fotos for select to anon, authenticated using (true);
drop policy if exists leitura_publica on public.conteudo;
create policy leitura_publica on public.conteudo for select to anon, authenticated using (true);
-- votos e config_privada: nenhuma política = ninguém lê nem escreve direto

revoke all on public.estado_votacao, public.config_privada, public.projetos, public.votos, public.fotos,
  public.conteudo, public.avaliacoes, public.decisao_banca from anon, authenticated;
grant select on public.estado_votacao, public.projetos, public.fotos, public.fotos_lista, public.conteudo
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. FUNÇÕES (chamadas pelo site em /rest/v1/rpc/...)
-- ---------------------------------------------------------------------

-- confere a senha do painel (uso interno)
create or replace function public._chave_ok(p_chave text)
returns boolean language sql stable security definer
set search_path = public, extensions as $$
  select coalesce(p_chave, '') <> ''
     and exists (select 1 from public.config_privada c
                 where c.chave_admin_hash = extensions.crypt(p_chave, c.chave_admin_hash));
$$;
revoke all on function public._chave_ok(text) from public, anon, authenticated;

-- telão: aceita a senha da organização OU o código do link secreto do telão
-- (/#/telao/acesso-...). Com o código, só dá para trocar slide e ligar a pausa.
-- Aqui fica só o "hash" do código; o código em si não está no repositório.
create or replace function public._telao_ok(p_chave text)
returns boolean language sql stable security definer
set search_path = public, extensions as $$
  select public._chave_ok(p_chave)
      or encode(extensions.digest(coalesce(p_chave, ''), 'sha256'), 'hex') = '583c5b6690b48477ccc8d9b3ec456e5e6440649a76889cc1693f9003abb751ab';
$$;
revoke all on function public._telao_ok(text) from public, anon, authenticated;

-- normaliza a palavra-chave do palco: maiúsculas, sem espaços
create or replace function public._norm(p text)
returns text language sql immutable as $$
  select nullif(upper(regexp_replace(coalesce(p, ''), '\s+', '', 'g')), '');
$$;

-- ---- público ----------------------------------------------------------

create or replace function public.registrar_voto(p_hash text, p_projeto text, p_palavra text default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare e public.estado_votacao; c public.config_privada;
begin
  select * into e from public.estado_votacao where id = 1;
  if not coalesce(e.votacao_aberta, false) then
    return jsonb_build_object('ok', false, 'erro', 'votacao_fechada');
  end if;
  if p_hash is null or lower(p_hash) !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'erro', 'identificacao_invalida');
  end if;
  if e.exige_chave then
    select * into c from public.config_privada where id = 1;
    if public._norm(p_palavra) is distinct from public._norm(c.chave_evento) then
      return jsonb_build_object('ok', false, 'erro', 'palavra_invalida');
    end if;
  end if;
  if not exists (select 1 from public.projetos where id = p_projeto and elegivel) then
    return jsonb_build_object('ok', false, 'erro', 'projeto_invalido');
  end if;
  begin
    insert into public.votos (hash, projeto_id) values (lower(p_hash), p_projeto);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'erro', 'ja_votou');
  end;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.consultar_voto(p_hash text)
returns jsonb language sql stable security definer
set search_path = public as $$
  -- diz só SE votou; em quem, nunca
  select jsonb_build_object('votou', exists (select 1 from public.votos where hash = lower(coalesce(p_hash, ''))));
$$;

create or replace function public.resultado(p_chave text default null)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
declare pub boolean; tot int; lista jsonb;
begin
  select resultado_publico into pub from public.estado_votacao where id = 1;
  if not (coalesce(pub, false) or public._chave_ok(p_chave)) then
    return jsonb_build_object('liberado', false);
  end if;
  -- para o público (sem a senha), só quem venceu: nenhum número de votos
  if not public._chave_ok(p_chave) then
    -- junto vai o Projeto destaque da banca (só o id; sem votos nem médias)
    return jsonb_build_object('liberado', true, 'so_vencedor', true,
      'banca', coalesce((select jsonb_agg(jsonb_build_object('id', x->>'id', 'pos', (x->>'pos')::int)) from jsonb_array_elements(public._vencedor_banca_lista()) x), '[]'::jsonb),
      'vencedores', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'nome', x.nome) order by x.nome)
        from (select p.id, p.nome, count(v.hash) as votos from public.projetos p
                join public.votos v on v.projeto_id = p.id group by p.id, p.nome) x
       where x.votos = (select max(c) from (select count(*) c from public.votos group by projeto_id) m)
    ), '[]'::jsonb));
  end if;
  select count(*) into tot from public.votos;
  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'nome', x.nome, 'votos', x.votos)
                            order by x.votos desc, x.nome), '[]'::jsonb)
    into lista
    from (select p.id, p.nome, count(v.hash)::int as votos
            from public.projetos p
            left join public.votos v on v.projeto_id = p.id
           group by p.id, p.nome, p.elegivel
          having p.elegivel or count(v.hash) > 0) x;
  return jsonb_build_object('liberado', true, 'total', tot, 'projetos', lista, 'banca', public._vencedor_banca_lista());
end $$;

-- ---- organização (todas pedem a senha do painel) ------------------------

create or replace function public.entrar_admin(p_chave text)
returns jsonb language sql stable security definer
set search_path = public, extensions as $$
  select jsonb_build_object('ok', public._chave_ok(p_chave));
$$;

create or replace function public.definir_votacao(p_chave text, p_aberta boolean default null, p_resultado boolean default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set
    votacao_aberta    = coalesce(p_aberta, votacao_aberta),
    resultado_publico = coalesce(p_resultado, resultado_publico),
    -- abrir a votação também a mostra no site
    votacao_visivel   = case when p_aberta then true else votacao_visivel end,
    atualizado_em     = now()
  where id = 1;
  return jsonb_build_object('ok', true);
end $$;

-- mostra ou esconde a aba Votação do site (sem abrir nem fechar a votação)
create or replace function public.definir_visibilidade(p_chave text, p_visivel boolean)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set votacao_visivel = coalesce(p_visivel, false), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'visivel', coalesce(p_visivel, false));
end $$;

create or replace function public.definir_candidatos(p_chave text, p_ids text[])
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  insert into public.projetos (id) select unnest(coalesce(p_ids, '{}')) on conflict (id) do nothing;
  -- o Supabase recusa UPDATE sem WHERE; por isso só mexe em quem muda
  update public.projetos set elegivel = (id = any(coalesce(p_ids, '{}')))
   where elegivel is distinct from (id = any(coalesce(p_ids, '{}')));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.definir_total_trilheiros(p_chave text, p_total int default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set total_trilheiros = nullif(p_total, 0), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.definir_chave_evento(p_chave text, p_nova text default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare n text := nullif(trim(coalesce(p_nova, '')), '');
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.config_privada set chave_evento = n where id = 1;
  update public.estado_votacao set exige_chave = (n is not null), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'exige_chave', n is not null);
end $$;

-- apaga todos os votos (depois de um ensaio) e libera os aparelhos.
-- Só funciona com a votação encerrada, para não zerar no meio do evento.
create or replace function public.zerar_votos(p_chave text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare r int; n int;
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  if (select votacao_aberta from public.estado_votacao where id = 1) then
    return jsonb_build_object('ok', false, 'erro', 'votacao_aberta');
  end if;
  delete from public.votos where true;
  get diagnostics n = row_count;
  update public.estado_votacao set rodada = rodada + 1, resultado_publico = false, revelar_telao = false, atualizado_em = now()
   where id = 1 returning rodada into r;
  return jsonb_build_object('ok', true, 'rodada', r, 'apagados', n);
end $$;

-- ZERAR TUDO (depois do ensaio): apaga votos, avaliações e a decisão da
-- banca, fecha votação/decisão/revelação, tira a equipe do palco e avisa os
-- aparelhos. NÃO mexe no conteúdo do site, nas fotos, nas senhas, na
-- palavra-chave, nos candidatos nem na chave "mostrar a votação".
create or replace function public.zerar_tudo(p_chave text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare nv int; na int; nd int; r int;
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  delete from public.votos where true;          get diagnostics nv = row_count;
  delete from public.avaliacoes where true;     get diagnostics na = row_count;
  delete from public.decisao_banca where true;  get diagnostics nd = row_count;
  update public.estado_votacao set
    votacao_aberta = false, resultado_publico = false, revelar_telao = false,
    decisao_aberta = false, avaliacoes_abertas = false, revelar_banca = false, palco = null, slide = null, pausa = false,
    rodada = rodada + 1, reinicio = reinicio + 1, atualizado_em = now()
   where id = 1 returning rodada into r;
  return jsonb_build_object('ok', true, 'rodada', r, 'votos', nv, 'avaliacoes', na, 'decisao', nd);
end $$;

-- a palavra-chave atual, só para a organização (o telão do painel a exibe)
create or replace function public.ler_chave_evento(p_chave text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  return jsonb_build_object('ok', true, 'palavra', (select chave_evento from public.config_privada where id = 1));
end $$;

-- ---- palco, revelação e banca -------------------------------------------

-- marca a equipe que está no palco (vazio = ninguém apresentando)
create or replace function public.definir_palco(p_chave text, p_projeto text default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set palco = nullif(trim(coalesce(p_projeto, '')), ''), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'palco', nullif(trim(coalesce(p_projeto, '')), ''));
end $$;

-- manda o telão revelar (ou voltar à votação)
create or replace function public.definir_revelacao(p_chave text, p_revelar boolean)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set revelar_telao = coalesce(p_revelar, false),
    revelar_banca = case when coalesce(p_revelar, false) then false else revelar_banca end, atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'revelar', coalesce(p_revelar, false));
end $$;

create or replace function public._banca_ok(p_senha text)
returns boolean language sql stable security definer
set search_path = public, extensions as $$
  select coalesce(p_senha, '') <> ''
     and exists (select 1 from public.config_privada c
                 where c.chave_banca_hash is not null
                   and c.chave_banca_hash = extensions.crypt(p_senha, c.chave_banca_hash));
$$;
revoke all on function public._banca_ok(text) from public, anon, authenticated;

-- entrada única do site: a senha diz o papel (organização ou banca)
create or replace function public.entrar(p_senha text)
returns jsonb language sql stable security definer
set search_path = public, extensions as $$
  select case when public._chave_ok(p_senha) then jsonb_build_object('ok', true, 'papel', 'admin')
              when public._banca_ok(p_senha) then jsonb_build_object('ok', true, 'papel', 'banca')
              else jsonb_build_object('ok', false) end;
$$;

-- troca a senha da organização (pelo painel)
create or replace function public.definir_senha_admin(p_chave text, p_nova text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  if length(trim(coalesce(p_nova, ''))) < 6 then return jsonb_build_object('ok', false, 'erro', 'senha_curta'); end if;
  if public._banca_ok(trim(p_nova)) then return jsonb_build_object('ok', false, 'erro', 'igual_banca'); end if;
  update public.config_privada set chave_admin_hash = extensions.crypt(trim(p_nova), extensions.gen_salt('bf')) where id = 1;
  return jsonb_build_object('ok', true);
end $$;


create or replace function public.entrar_banca(p_senha text)
returns jsonb language sql stable security definer
set search_path = public, extensions as $$
  select jsonb_build_object('ok', public._banca_ok(p_senha));
$$;

-- nome do jurado: espaços normalizados; se já existe com outra caixa
-- (maiúsculas/minúsculas), usa o que já está gravado
create or replace function public._jurado(p_nome text)
returns text language sql stable security definer
set search_path = public, extensions as $$
  with n as (select left(regexp_replace(trim(coalesce(p_nome, '')), '\s+', ' ', 'g'), 60) as v)
  select coalesce(
    (select a.jurado from public.avaliacoes a, n where lower(a.jurado) = lower(n.v) limit 1),
    (select d.jurado from public.decisao_banca d, n where lower(d.jurado) = lower(n.v) limit 1),
    (select v from n));
$$;
revoke all on function public._jurado(text) from public, anon, authenticated;

-- os 6 critérios da banca (iguais para todos os projetos)
create or replace function public._criterios()
returns text[] language sql immutable as $$
  select array['ideia','problema','impacto','viabilidade','protagonismo','apresentacao'];
$$;

drop function if exists public.salvar_avaliacao(text, text, text, numeric, text);
create or replace function public.salvar_avaliacao(p_senha text, p_jurado text, p_projeto text, p_notas jsonb default '{}'::jsonb, p_comentario text default '')
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare j text := public._jurado(p_jurado); limpo jsonb := '{}'::jsonb; k text; v jsonb; media numeric;
begin
  if not public._banca_ok(p_senha) then return jsonb_build_object('ok', false, 'erro', 'senha_banca_invalida'); end if;
  if not (select avaliacoes_abertas from public.estado_votacao where id = 1) then return jsonb_build_object('ok', false, 'erro', 'avaliacoes_fechadas'); end if;
  if length(j) < 2 then return jsonb_build_object('ok', false, 'erro', 'jurado_invalido'); end if;
  if coalesce(trim(p_projeto), '') = '' then return jsonb_build_object('ok', false, 'erro', 'projeto_invalido'); end if;
  for k, v in select * from jsonb_each(coalesce(p_notas, '{}'::jsonb)) loop
    if k = any(public._criterios()) and jsonb_typeof(v) = 'number' then
      if (v::text)::numeric not in (1, 2, 3, 4, 5) then return jsonb_build_object('ok', false, 'erro', 'nota_invalida'); end if;
      limpo := limpo || jsonb_build_object(k, (v::text)::int);
    end if;
  end loop;
  select round(avg((x.value::text)::numeric), 1) into media from jsonb_each(limpo) x;
  insert into public.avaliacoes (jurado, projeto_id, nota, notas, comentario, atualizado_em)
  values (j, p_projeto, media, limpo, left(coalesce(p_comentario, ''), 4000), now())
  on conflict (jurado, projeto_id) do update
    set nota = excluded.nota, notas = excluded.notas, comentario = excluded.comentario, atualizado_em = now();
  return jsonb_build_object('ok', true, 'jurado', j, 'media', media);
end $$;

create or replace function public.minhas_avaliacoes(p_senha text, p_jurado text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
declare j text := public._jurado(p_jurado);
begin
  if not public._banca_ok(p_senha) then return jsonb_build_object('ok', false, 'erro', 'senha_banca_invalida'); end if;
  return jsonb_build_object('ok', true, 'jurado', j, 'itens', coalesce((
    select jsonb_agg(jsonb_build_object('projeto', projeto_id, 'nota', nota, 'notas', notas, 'comentario', comentario, 'em', atualizado_em))
      from public.avaliacoes where jurado = j), '[]'::jsonb));
end $$;

-- para a organização: todas as avaliações
create or replace function public.avaliacoes_banca(p_chave text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  return jsonb_build_object('ok', true, 'itens', coalesce((
    select jsonb_agg(jsonb_build_object('jurado', jurado, 'projeto', projeto_id, 'nota', nota, 'notas', notas, 'comentario', comentario, 'em', atualizado_em)
                     order by projeto_id, jurado)
      from public.avaliacoes), '[]'::jsonb),
    'decisao_aberta', (select decisao_aberta from public.estado_votacao where id = 1),
    'decisao', coalesce((select jsonb_agg(jsonb_build_object('jurado', jurado, 'projeto', projeto_id, 'posicao', posicao, 'em', em) order by em, jurado, posicao)
      from public.decisao_banca), '[]'::jsonb));
end $$;

-- ---- decisão final da banca --------------------------------------------

-- médias de todos os jurados por projeto (só para a decisão e o painel)
create or replace function public._medias_banca()
returns jsonb language sql stable security definer
set search_path = public, extensions as $$
  select coalesce(jsonb_agg(jsonb_build_object('projeto', projeto_id, 'jurados', n, 'media', media, 'criterios', crit)), '[]'::jsonb)
  from (
    select a.projeto_id, count(*) as n,
           round(avg((select avg((y.value::text)::numeric) from jsonb_each(a.notas) y)), 2) as media,
           (select jsonb_object_agg(c.k, c.m) from (
              select x.key as k, round(avg((x.value::text)::numeric), 2) as m
                from public.avaliacoes a2, jsonb_each(a2.notas) x
               where a2.projeto_id = a.projeto_id group by x.key) c) as crit
      from public.avaliacoes a
     where a.notas <> '{}'::jsonb
     group by a.projeto_id
  ) t;
$$;
revoke all on function public._medias_banca() from public, anon, authenticated;

-- controle da apresentação: troca o slide do telão. Os slides de revelação
-- ligam a revelação certa; os outros desligam. p_palco: null = mantém a
-- equipe no palco; '' = ninguém; id = essa equipe (slides das equipes).
create or replace function public.definir_slide(p_chave text, p_slide text, p_palco text default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare sl text := nullif(trim(coalesce(p_slide, '')), '');
begin
  if not public._telao_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set
    slide = sl,
    pausa = false,
    palco = case when p_palco is null then palco else nullif(trim(p_palco), '') end,
    revelar_telao = coalesce(sl = 'revelaHeroi', false),
    revelar_banca = coalesce(sl = 'revelaBanca', false),
    atualizado_em = now()
  where id = 1;
  return jsonb_build_object('ok', true, 'slide', sl);
end $$;

-- modo pausa do telão (mosaico de fotos da Trilha)
create or replace function public.definir_pausa(p_chave text, p_pausa boolean)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._telao_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set pausa = coalesce(p_pausa, false), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'pausa', coalesce(p_pausa, false));
end $$;

-- telão: revelar (ou não) o Projeto destaque da banca
create or replace function public.definir_revelacao_banca(p_chave text, p_revelar boolean)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set revelar_banca = coalesce(p_revelar, false),
    revelar_telao = case when coalesce(p_revelar, false) then false else revelar_telao end, atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'revelar', coalesce(p_revelar, false));
end $$;

-- pontos da decisão final: 1º lugar do jurado = 3, 2º = 2, 3º = 1
create or replace function public._pontos_banca()
returns table (projeto_id text, pontos int, primeiros int, jurados int) language sql stable security definer
set search_path = public, extensions as $$
  select projeto_id, sum(4 - posicao)::int, count(*) filter (where posicao = 1)::int, count(*)::int
    from public.decisao_banca group by projeto_id;
$$;
revoke all on function public._pontos_banca() from public, anon, authenticated;

-- os 3 Projetos destaque da banca (1º, 2º e 3º): mais pontos; empate
-- desempata pela média das notas e depois por quem teve mais 1º lugares.
-- uso interno: vencedor_banca e resultado
create or replace function public._vencedor_banca_lista()
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
declare r jsonb;
begin
  with m as (select (x->>'projeto') projeto_id, (x->>'media')::numeric media from jsonb_array_elements(public._medias_banca()) x),
       t as (select p.projeto_id, p.pontos, p.primeiros, coalesce(m.media, 0) media from public._pontos_banca() p left join m using (projeto_id) where p.pontos > 0),
       o as (select *, row_number() over (order by pontos desc, media desc, primeiros desc, projeto_id) pos from t)
  select coalesce((select jsonb_agg(jsonb_build_object('id', projeto_id, 'pos', pos, 'pontos', pontos, 'votos', pontos, 'media', media) order by pos)
                     from o where pos <= 3), '[]'::jsonb) into r;
  return r;
end $$;
revoke all on function public._vencedor_banca_lista() from public, anon, authenticated;

create or replace function public.vencedor_banca(p_chave text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  return jsonb_build_object('ok', true, 'vencedores', public._vencedor_banca_lista(),
    'votaram', (select count(distinct jurado) from public.decisao_banca));
end $$;

create or replace function public.definir_avaliacoes(p_chave text, p_abertas boolean)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set avaliacoes_abertas = coalesce(p_abertas, false), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'abertas', coalesce(p_abertas, false));
end $$;

create or replace function public.definir_decisao(p_chave text, p_aberta boolean)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.estado_votacao set decisao_aberta = coalesce(p_aberta, false), atualizado_em = now() where id = 1;
  return jsonb_build_object('ok', true, 'aberta', coalesce(p_aberta, false));
end $$;

-- apaga as avaliações e/ou os votos da decisão (depois de um ensaio)
create or replace function public.zerar_banca(p_chave text, p_avaliacoes boolean default false)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare n1 int := 0; n2 int := 0;
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  delete from public.decisao_banca where true;
  get diagnostics n2 = row_count;
  if p_avaliacoes then
    delete from public.avaliacoes where true;
    get diagnostics n1 = row_count;
  end if;
  return jsonb_build_object('ok', true, 'avaliacoes', n1, 'decisao', n2);
end $$;

-- voto da decisão final: os 3 projetos do jurado, em ordem (1º, 2º, 3º)
drop function if exists public.votar_decisao(text, text, text);
create or replace function public.votar_decisao(p_senha text, p_jurado text, p_projetos jsonb)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare j text := public._jurado(p_jurado); ids text[];
begin
  if not public._banca_ok(p_senha) then return jsonb_build_object('ok', false, 'erro', 'senha_banca_invalida'); end if;
  if not (select decisao_aberta from public.estado_votacao where id = 1) then return jsonb_build_object('ok', false, 'erro', 'decisao_fechada'); end if;
  if length(j) < 2 then return jsonb_build_object('ok', false, 'erro', 'jurado_invalido'); end if;
  if jsonb_typeof(p_projetos) <> 'array' then return jsonb_build_object('ok', false, 'erro', 'projeto_invalido'); end if;
  select array_agg(trim(x) order by k) into ids from jsonb_array_elements_text(p_projetos) with ordinality e(x, k);
  if coalesce(array_length(ids, 1), 0) <> 3 or exists (select 1 from unnest(ids) x where coalesce(x, '') = '')
     or (select count(distinct x) from unnest(ids) x) <> 3 then
    return jsonb_build_object('ok', false, 'erro', 'escolha_3');
  end if;
  delete from public.decisao_banca where jurado = j;
  insert into public.decisao_banca (jurado, posicao, projeto_id, em)
    select j, k::smallint, ids[k], now() from generate_series(1, 3) k;
  return jsonb_build_object('ok', true);
end $$;

-- o que o jurado vê na decisão final: as médias de todos e a apuração
create or replace function public.decisao_banca_ver(p_senha text, p_jurado text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
declare j text := public._jurado(p_jurado); aberta boolean;
begin
  if not public._banca_ok(p_senha) then return jsonb_build_object('ok', false, 'erro', 'senha_banca_invalida'); end if;
  select decisao_aberta into aberta from public.estado_votacao where id = 1;
  if not aberta then return jsonb_build_object('ok', true, 'aberta', false); end if;
  return jsonb_build_object('ok', true, 'aberta', true,
    'medias', public._medias_banca(),
    'meus_votos', coalesce((select jsonb_agg(projeto_id order by posicao) from public.decisao_banca where jurado = j), '[]'::jsonb),
    'pontos', coalesce((select jsonb_object_agg(projeto_id, pontos) from public._pontos_banca()), '{}'::jsonb),
    'primeiros', coalesce((select jsonb_object_agg(projeto_id, primeiros) from public._pontos_banca()), '{}'::jsonb),
    'votaram', (select count(distinct jurado) from public.decisao_banca),
    'jurados', (select count(*) from (select jurado from public.avaliacoes union select jurado from public.decisao_banca) u),
    -- notas e comentários de cada jurado, SEM nome: "Você" para o próprio e
    -- "Jurado 1, 2…" para os outros (o nome não sai do banco)
    'avaliacoes', coalesce((
      with outros as (select jurado, row_number() over (order by lower(jurado)) n
                        from (select distinct jurado from public.avaliacoes where jurado <> j) x)
      select jsonb_agg(jsonb_build_object(
               'jurado', case when a.jurado = j then 'Você' else 'Jurado ' || o.n end,
               'projeto', a.projeto_id, 'notas', a.notas, 'comentario', a.comentario) order by (a.jurado <> j), o.n)
        from public.avaliacoes a left join outros o on o.jurado = a.jurado
       where a.notas <> '{}'::jsonb), '[]'::jsonb),
    -- votos do público (por opção de voto: Heróis), só como informação
    'publico', coalesce((select jsonb_object_agg(projeto_id, n) from (select projeto_id, count(*) n from public.votos group by projeto_id) v), '{}'::jsonb),
    'publico_total', (select count(*) from public.votos));
end $$;

create or replace function public.definir_senha_banca(p_chave text, p_nova text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  if length(trim(coalesce(p_nova, ''))) < 4 then return jsonb_build_object('ok', false, 'erro', 'senha_curta'); end if;
  update public.config_privada set chave_banca_hash = extensions.crypt(trim(p_nova), extensions.gen_salt('bf')) where id = 1;
  return jsonb_build_object('ok', true);
end $$;

-- publica o conteúdo do painel para todo mundo
create or replace function public.salvar_conteudo(p_chave text, p_dados jsonb)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare v bigint;
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' or not (p_dados ? 'event') then
    return jsonb_build_object('ok', false, 'erro', 'conteudo_invalido');
  end if;
  if length(p_dados::text) > 4000000 then return jsonb_build_object('ok', false, 'erro', 'conteudo_grande_demais'); end if;
  insert into public.conteudo (id, dados, versao, atualizado_em) values (1, p_dados, 1, now())
  on conflict (id) do update set dados = excluded.dados, versao = public.conteudo.versao + 1, atualizado_em = now()
  returning versao into v;
  return jsonb_build_object('ok', true, 'versao', v);
end $$;

-- ---- fotos -------------------------------------------------------------

create or replace function public.adicionar_foto(
  p_chave text, p_dado text default null, p_src text default null,
  p_legenda text default '', p_larga boolean default false, p_projeto text default null)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare novo uuid;
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  if p_dado is null and p_src is null then return jsonb_build_object('ok', false, 'erro', 'sem_imagem'); end if;
  if p_src is not null and p_src !~* '^https://' then return jsonb_build_object('ok', false, 'erro', 'endereco_invalido'); end if;
  if p_dado is not null and p_dado !~ '^data:image/(webp|jpeg|jpg|png|gif);base64,' then
    return jsonb_build_object('ok', false, 'erro', 'formato_invalido');
  end if;
  if length(coalesce(p_dado, '')) > 3000000 then return jsonb_build_object('ok', false, 'erro', 'foto_grande_demais'); end if;
  insert into public.fotos (dado, src, legenda, larga, projeto_id, ordem)
  values (p_dado, p_src, coalesce(p_legenda, ''), coalesce(p_larga, false), nullif(p_projeto, ''),
          (select coalesce(max(ordem), 0) + 1 from public.fotos))
  returning id into novo;
  return jsonb_build_object('ok', true, 'id', novo);
end $$;

create or replace function public.remover_foto(p_chave text, p_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  delete from public.fotos where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.ordenar_fotos(p_chave text, p_ids uuid[])
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.fotos f set ordem = o.pos
    from unnest(p_ids) with ordinality as o(id, pos)
   where f.id = o.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.definir_capa_foto(p_chave text, p_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.fotos set capa = (id = p_id) where capa or id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.atualizar_fotos(p_chave text, p_itens jsonb)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.fotos f set
    legenda = coalesce(i->>'legenda', f.legenda),
    larga   = coalesce((i->>'larga')::boolean, f.larga)
  from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) as i
  where f.id = (i->>'id')::uuid;
  return jsonb_build_object('ok', true);
end $$;

-- quem pode chamar as funções
do $$
declare f text;
begin
  foreach f in array array[
    'registrar_voto(text,text,text)', 'consultar_voto(text)', 'resultado(text)',
    'entrar_admin(text)', 'entrar(text)', 'definir_senha_admin(text,text)', 'definir_votacao(text,boolean,boolean)', 'definir_candidatos(text,text[])',
    'definir_total_trilheiros(text,int)', 'definir_chave_evento(text,text)', 'salvar_conteudo(text,jsonb)', 'zerar_votos(text)', 'zerar_tudo(text)', 'definir_palco(text,text)', 'definir_revelacao(text,boolean)', 'entrar_banca(text)',
    'salvar_avaliacao(text,text,text,jsonb,text)', 'definir_decisao(text,boolean)', 'definir_avaliacoes(text,boolean)', 'definir_revelacao_banca(text,boolean)', 'vencedor_banca(text)', 'definir_slide(text,text,text)', 'definir_pausa(text,boolean)', 'zerar_banca(text,boolean)', 'votar_decisao(text,text,jsonb)', 'decisao_banca_ver(text,text)', 'minhas_avaliacoes(text,text)', 'avaliacoes_banca(text)', 'definir_senha_banca(text,text)', 'definir_visibilidade(text,boolean)', 'ler_chave_evento(text)',
    'adicionar_foto(text,text,text,text,boolean,text)', 'remover_foto(text,uuid)',
    'ordenar_fotos(text,uuid[])', 'definir_capa_foto(text,uuid)', 'atualizar_fotos(text,jsonb)']
  loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. DADOS INICIAIS
-- ---------------------------------------------------------------------

-- senha do painel da organização. Para trocar, mude o texto entre aspas
-- e rode só este bloco de novo (e peça o código novo para o config.js).
-- (o site manda a senha sem espaços e em minúsculas: "Trilhei 2026" = trilhei2026)
insert into public.config_privada (id, chave_admin_hash)
values (1, extensions.crypt('trilhei2026', extensions.gen_salt('bf')))
on conflict (id) do nothing;
-- quem ainda estava com a senha antiga padrão (idl2026) passa para trilhei2026;
-- uma senha trocada pelo painel é mantida
update public.config_privada set chave_admin_hash = extensions.crypt('trilhei2026', extensions.gen_salt('bf'))
 where id = 1 and chave_admin_hash = extensions.crypt('idl2026', chave_admin_hash);

-- os 17 Heróis; os 5 candidatos de 9h15 já vêm marcados (o painel muda isso)
insert into public.projetos (id, nome, elegivel) values
  ('her_marks',    'Mrs Marks',               false),
  ('her_sofia',    'Sofia',                   true),
  ('her_miguel',   'Miguel — Eco Mensageiro', true),
  ('her_teo',      'Téo Benevides',           false),
  ('her_kiara',    'Kiara',                   false),
  ('her_neo',      'Neo',                     false),
  ('her_samuel',   'Samuel',                  true),
  ('her_lydia',    'Lydia',                   false),
  ('her_virtus',   'Virtus',                  false),
  ('her_clara',    'Clara',                   false),
  ('her_duda',     'Duda',                    false),
  ('her_samantha', 'Samantha',                true),
  ('her_kizuna',   'Kizuna',                  false),
  ('her_felix',    'Félix',                   false),
  ('her_faisca',   'Faísca',                  false),
  ('her_lumen',    'Lumen',                   true),
  ('her_karol',    'Karol',                   false)
on conflict (id) do update set nome = excluded.nome;

update public.estado_votacao set total_trilheiros = coalesce(total_trilheiros, 75) where id = 1;

-- as 14 fotos da Trilha que já vêm com o site. Entram só se a tabela estiver
-- vazia; depois o painel acrescenta, tira, reordena e troca a capa.
insert into public.fotos (src, legenda, larga, capa, ordem)
select v.* from (values
  ('img/2026/t06.webp', 'A Trilha começa numa roda', true, false, 1),
  ('img/2026/t08.webp', 'A vez de falar', false, false, 2),
  ('img/2026/t05.webp', 'Risada no meio da aula', false, false, 3),
  ('img/2026/t12.webp', 'Uma carta para o futuro', true, false, 4),
  ('img/2026/t14.webp', 'O projeto tomando forma', false, false, 5),
  ('img/2026/t07.webp', 'Escutar antes de propor', false, false, 6),
  ('img/2026/t03.webp', 'Mãos na terra', true, true, 7),
  ('img/2026/t04.webp', 'Nas comunidades', false, false, 8),
  ('img/2026/t11.webp', 'A turma inteira junto', false, false, 9),
  ('img/2026/t01.webp', 'As histórias viraram vídeo', false, false, 10),
  ('img/2026/t02.webp', 'Cada trilheiro contou a sua', false, false, 11),
  ('img/2026/t13.webp', 'Ensaio para a Banca', true, false, 12),
  ('img/2026/t09.webp', 'Defendendo a ideia', false, false, 13),
  ('img/2026/t10.webp', 'O grupo por perto', false, false, 14)
) as v(src, legenda, larga, capa, ordem)
where not exists (select 1 from public.fotos);


-- pronto. Para zerar os votos depois de um teste:  delete from public.votos;
-- Para voltar o conteúdo ao data.js:              delete from public.conteudo;

-- senha da banca (jurados): começa como banca2026 se ainda não houver uma.
-- Troque pelo painel (aba Banca). Rodar este arquivo de novo não muda a senha escolhida.
update public.config_privada set chave_banca_hash = coalesce(chave_banca_hash, extensions.crypt('banca2026', extensions.gen_salt('bf'))) where id = 1;

-- palavra-chave do palco: começa ativa com SEMEAR. Troque pelo painel
-- (aba Votação) — de preferência no próprio dia, para não vazar antes.
update public.config_privada set chave_evento = coalesce(chave_evento, 'SEMEAR') where id = 1;
update public.estado_votacao e set exige_chave = (c.chave_evento is not null)
  from public.config_privada c where e.id = 1 and c.id = 1;

-- avisa a API do Supabase que há tabelas e funções novas
notify pgrst, 'reload schema';

-- ===================== CAMISAS DO EVENTO (painel · aba Camisas) =====================
-- Lista dos trilheiros com o tamanho da camisa e o "recebeu". Só a organização
-- lê e marca (pela senha); várias pessoas podem marcar ao mesmo tempo.
create table if not exists public.camisas (
  id           text primary key,
  nome         text not null check (length(trim(nome)) between 1 and 80),
  tamanho      text not null default '' check (tamanho in ('', 'PP', 'P', 'M', 'G', 'GG', 'XG')),
  ordem        int  not null default 0,
  entregue     boolean not null default false,
  entregue_em  timestamptz,
  entregue_por text
);
alter table public.camisas enable row level security;
revoke all on public.camisas from anon, authenticated;

insert into public.camisas (id, nome, tamanho, ordem) values
  ('cam_01', 'Erick Bueno', 'M', 1),
  ('cam_02', 'Júlia', 'M', 2),
  ('cam_03', 'Eloisa', 'M', 3),
  ('cam_04', 'Isabelly Mendes', 'M', 4),
  ('cam_05', 'Matheus', 'M', 5),
  ('cam_06', 'Isabele Ferreira', 'M', 6),
  ('cam_07', 'Rebeca', 'P', 7),
  ('cam_08', 'Eloah', 'M', 8),
  ('cam_09', 'Lara', 'P', 9),
  ('cam_10', 'Giovana', 'P', 10),
  ('cam_11', 'Adryan', 'M', 11),
  ('cam_12', 'Alice Machado', 'P', 12),
  ('cam_13', 'Vitória Araújo', 'M', 13),
  ('cam_14', 'Luna', 'P', 14),
  ('cam_15', 'Maria Fernanda', 'M', 15),
  ('cam_16', 'Mauricio', 'P', 16),
  ('cam_17', 'Gustavo', 'M', 17),
  ('cam_18', 'Victoria Eduarda', 'P', 18),
  ('cam_19', 'Daniel', 'M', 19),
  ('cam_20', 'Rafael', 'M', 20),
  ('cam_21', 'Andrew', 'P', 21),
  ('cam_22', 'Victor Cordeiro', 'P', 22),
  ('cam_23', 'Melissa', 'M', 23),
  ('cam_24', 'Thaís', 'P', 24),
  ('cam_25', 'David', 'M', 25),
  ('cam_26', 'Maria Eduarda', 'M', 26),
  ('cam_27', 'Marina', 'M', 27),
  ('cam_28', 'João Lucas', 'M', 28),
  ('cam_29', 'Victor Gouveia', 'G', 29),
  ('cam_30', 'Henrique', 'P', 30),
  ('cam_31', 'Stefanie', 'M', 31),
  ('cam_32', 'Millena', 'M', 32),
  ('cam_33', 'Kayla', 'M', 33),
  ('cam_34', 'Lukas', 'G', 34),
  ('cam_35', 'Igor', 'G', 35),
  ('cam_36', 'Maria Alice', 'M', 36),
  ('cam_37', 'Maria Clara Cavalcante', 'M', 37),
  ('cam_38', 'Renata', 'P', 38),
  ('cam_39', 'Maria Clara Cabral', 'M', 39),
  ('cam_40', 'Kauã', 'M', 40),
  ('cam_41', 'Isac', 'M', 41),
  ('cam_42', 'Fhelippe', 'M', 42),
  ('cam_43', 'Lorena', 'M', 43),
  ('cam_44', 'Pérola', 'P', 44),
  ('cam_45', 'Sofia', 'P', 45),
  ('cam_46', 'Maria Ester', 'P', 46),
  ('cam_47', 'Gustavo', 'P', 47),
  ('cam_48', 'Felipe', 'G', 48),
  ('cam_49', 'Gabriel', 'P', 49),
  ('cam_50', 'Pietro', 'M', 50),
  ('cam_51', 'Kaue', 'P', 51),
  ('cam_52', 'Juliana', 'P', 52),
  ('cam_53', 'Gleyciane', 'M', 53),
  ('cam_54', 'Thaynara', 'M', 54),
  ('cam_55', 'Emily', 'P', 55),
  ('cam_56', 'Livia', 'P', 56),
  ('cam_57', 'Lanna', 'P', 57),
  ('cam_58', 'Melany', '', 58),
  ('cam_59', 'Nycolas', 'P', 59),
  ('cam_60', 'Aghata', 'M', 60),
  ('cam_61', 'Manuely', 'P', 61),
  ('cam_62', 'Vitor Iargas', 'P', 62),
  ('cam_63', 'Erick Ferreira', 'M', 63),
  ('cam_64', 'Marina', 'G', 64),
  ('cam_65', 'Gabriela', 'M', 65),
  ('cam_66', 'Paola', 'M', 66),
  ('cam_67', 'Julia', 'M', 67),
  ('cam_68', 'Yasmin', 'M', 68),
  ('cam_69', 'Anderson', 'M', 69),
  ('cam_70', 'Evelyn', 'PP', 70),
  ('cam_71', 'Vitor Augusto', 'M', 71),
  ('cam_72', 'Marcelo', 'GG', 72),
  ('cam_73', 'Gabriel', 'M', 73)
on conflict (id) do nothing;

create or replace function public.camisas_listar(p_chave text)
returns jsonb language plpgsql stable security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  return jsonb_build_object('ok', true, 'itens', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'nome', nome, 'tamanho', tamanho, 'entregue', entregue,
                                        'em', entregue_em, 'por', entregue_por) order by ordem, nome)
      from public.camisas), '[]'::jsonb));
end $$;

create or replace function public.camisa_marcar(p_chave text, p_id text, p_entregue boolean, p_por text default '')
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  update public.camisas set entregue = coalesce(p_entregue, false),
    entregue_em = case when coalesce(p_entregue, false) then now() else null end,
    entregue_por = case when coalesce(p_entregue, false) then left(nullif(trim(coalesce(p_por, '')), ''), 60) else null end
  where id = p_id;
  return jsonb_build_object('ok', found);
end $$;

-- acrescenta (p_id vazio) ou corrige nome/tamanho de um trilheiro
create or replace function public.camisa_salvar(p_chave text, p_id text, p_nome text, p_tamanho text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
declare novo text;
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  if coalesce(trim(p_nome), '') = '' then return jsonb_build_object('ok', false, 'erro', 'nome_vazio'); end if;
  if upper(coalesce(trim(p_tamanho), '')) not in ('', 'PP', 'P', 'M', 'G', 'GG', 'XG') then return jsonb_build_object('ok', false, 'erro', 'tamanho_invalido'); end if;
  if coalesce(p_id, '') = '' then
    novo := 'cam_' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
    insert into public.camisas (id, nome, tamanho, ordem)
    values (novo, trim(p_nome), upper(coalesce(trim(p_tamanho), '')), coalesce((select max(ordem) from public.camisas), 0) + 1);
    return jsonb_build_object('ok', true, 'id', novo);
  end if;
  update public.camisas set nome = trim(p_nome), tamanho = upper(coalesce(trim(p_tamanho), '')) where id = p_id;
  return jsonb_build_object('ok', found, 'id', p_id);
end $$;

create or replace function public.camisa_apagar(p_chave text, p_id text)
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  delete from public.camisas where id = p_id;
  return jsonb_build_object('ok', found);
end $$;

grant execute on function public.camisas_listar(text), public.camisa_marcar(text, text, boolean, text),
  public.camisa_salvar(text, text, text, text), public.camisa_apagar(text, text) to anon, authenticated;
