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

-- segredos do servidor (ninguém de fora lê: RLS sem nenhuma política)
create table if not exists public.config_privada (
  id               int primary key default 1 check (id = 1),
  chave_admin_hash text not null,
  chave_evento     text
);

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

drop policy if exists leitura_publica on public.estado_votacao;
create policy leitura_publica on public.estado_votacao for select to anon, authenticated using (true);
drop policy if exists leitura_publica on public.projetos;
create policy leitura_publica on public.projetos for select to anon, authenticated using (true);
drop policy if exists leitura_publica on public.fotos;
create policy leitura_publica on public.fotos for select to anon, authenticated using (true);
-- votos e config_privada: nenhuma política = ninguém lê nem escreve direto

revoke all on public.estado_votacao, public.config_privada, public.projetos, public.votos, public.fotos
  from anon, authenticated;
grant select on public.estado_votacao, public.projetos, public.fotos, public.fotos_lista
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
  select count(*) into tot from public.votos;
  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'nome', x.nome, 'votos', x.votos)
                            order by x.votos desc, x.nome), '[]'::jsonb)
    into lista
    from (select p.id, p.nome, count(v.hash)::int as votos
            from public.projetos p
            left join public.votos v on v.projeto_id = p.id
           group by p.id, p.nome, p.elegivel
          having p.elegivel or count(v.hash) > 0) x;
  return jsonb_build_object('liberado', true, 'total', tot, 'projetos', lista);
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
    atualizado_em     = now()
  where id = 1;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.definir_candidatos(p_chave text, p_ids text[])
returns jsonb language plpgsql security definer
set search_path = public, extensions as $$
begin
  if not public._chave_ok(p_chave) then return jsonb_build_object('ok', false, 'erro', 'chave_invalida'); end if;
  insert into public.projetos (id) select unnest(coalesce(p_ids, '{}')) on conflict (id) do nothing;
  update public.projetos set elegivel = (id = any(coalesce(p_ids, '{}')));
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
    'entrar_admin(text)', 'definir_votacao(text,boolean,boolean)', 'definir_candidatos(text,text[])',
    'definir_total_trilheiros(text,int)', 'definir_chave_evento(text,text)',
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
insert into public.config_privada (id, chave_admin_hash)
values (1, extensions.crypt('12345', extensions.gen_salt('bf')))
on conflict (id) do update set chave_admin_hash = excluded.chave_admin_hash;

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

-- pronto. Para zerar os votos depois de um teste:  delete from public.votos;
