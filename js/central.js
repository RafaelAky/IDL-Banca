/* Central do AkiCast · código principal (AkiCast, AkiLearning, AkiCulture e AkiTeste) */
(function(){
"use strict";
/* Versão do código: aparece no rodapé. Se o rodapé disser "código antigo", o js/central.js não foi atualizado. */
const VERSAO="06/11-a";
(function marcarVersao(){
  const el=document.getElementById("versaoCentral"); if(!el) return;
  let css=""; try{ css=getComputedStyle(document.documentElement).getPropertyValue("--versao-css").replace(/["'\s]/g,""); }catch(e){}
  el.textContent="versão "+VERSAO+(css===VERSAO?"":" · estilo antigo (css/central.css não foi atualizado)");
})();
/* =================== Programas: AkiCast e AkiLearning =================== */
const LEARNING_LOGO=window.AKI_ASSETS.learningLogo; // logo oficial do AkiLearning embutida (não depende de arquivo na pasta img)
var CHART_COLORS_BASE=["var(--brand)","#FFA744","#49AD6F","#06C4D0","#E0559A"];
const CULTURE_LOGO=window.AKI_ASSETS.cultureLogo; // logo do AkiCulture (provisória enviada pela equipe)
const TESTE_LOGO=window.AKI_ASSETS.testeLogo; // AkiTeste: ambiente para testar eventos e funções sem misturar com os programas de verdade
const PROGRAMS={
  akicast:{id:"akicast",name:"AkiCast",schedule:"Sextas, das 9h às 10h",logo:null,brand:"#5A12C4",deep:"#21163F",stripe:["#FFA744","#7218EC","#49AD6F","#06C4D0"]},
  learning:{id:"learning",name:"AkiLearning",schedule:"Conteúdos de aprendizado",logo:LEARNING_LOGO,brand:"#1E6FD9",deep:"#0F1B33",stripe:["#1E6FD9","#7218EC","#FFA744","#06C4D0"]},
  culture:{id:"culture",name:"AkiCulture",schedule:"Edições de cultura",logo:CULTURE_LOGO,brand:"#FFA744",deep:"#2A1600",stripe:["#FFA744","#7218EC","#49AD6F","#06C4D0"]},
  teste:{id:"teste",name:"AkiTeste",schedule:"Ambiente de testes",logo:TESTE_LOGO,brand:"#3F3F46",deep:"#18181B",stripe:["#A1A1AA","#52525B","#D4D4D8","#27272A"]}
};
let PROG=(()=>{ try{ const v=localStorage.getItem("akicast-program"); return PROGRAMS[v]?v:"akicast"; }catch(e){ return "akicast"; } })();
const PG=()=>PROGRAMS[PROG]||PROGRAMS.akicast;
const PN=()=>PG().name;
let AKICAST_LOGO_SRC=null;
function setBrandLogos(){
  const hl=document.querySelector("img.logo"); if(!hl) return;
  if(!AKICAST_LOGO_SRC) AKICAST_LOGO_SRC=hl.getAttribute("src");
  const src=PG().logo||AKICAST_LOGO_SRC;
  document.querySelectorAll("img.logo,#ctrlLogo,#salaLogo,.cover-logo,.wait-logo,.login-logo,.cur-cover img").forEach(i=>{ i.src=src; i.alt=PN(); });
}
const TERM_RULES=[
  [/\btodos os episódios\b/g,"todas as sessões"],[/\bTodos os episódios\b/g,"Todas as sessões"],
  [/\bo próximo episódio\b/g,"a próxima sessão"],[/\bO próximo episódio\b/g,"A próxima sessão"],
  [/\bNovo episódio\b/g,"Nova sessão"],[/\bnovo episódio\b/g,"nova sessão"],
  [/\bNenhum episódio (cadastrado|avaliado|agendado)\b/g,(m,a)=>"Nenhuma sessão "+a.replace(/o$/,"a")],
  [/\bNenhum episódio\b/g,"Nenhuma sessão"],[/\bnenhum episódio\b/g,"nenhuma sessão"],
  [/\bEste episódio\b/g,"Esta sessão"],[/\beste episódio\b/g,"esta sessão"],[/\bneste episódio\b/g,"nesta sessão"],[/\bdeste episódio\b/g,"desta sessão"],
  [/\bUm episódio\b/g,"Uma sessão"],[/\bum episódio\b/g,"uma sessão"],
  [/\bdo episódio\b/g,"da sessão"],[/\bno episódio\b/g,"na sessão"],[/\bao episódio\b/g,"à sessão"],[/\bo episódio\b/g,"a sessão"],[/\bO episódio\b/g,"A sessão"],
  [/\bdos episódios\b/g,"das sessões"],[/\bnos episódios\b/g,"nas sessões"],[/\bos episódios\b/g,"as sessões"],[/\bOs episódios\b/g,"As sessões"],
  [/\bquantos episódios\b/g,"quantas sessões"],
  [/\bepisódio temporário\b/g,"sessão temporária"],
  [/\bEpisódios (cadastrados|avaliados|realizados|antigos)\b/g,(m,a)=>"Sessões "+a.replace(/os$/,"as")],
  [/\bepisódios (cadastrados|avaliados|realizados|antigos)\b/g,(m,a)=>"sessões "+a.replace(/os$/,"as")],
  [/\bEpisódio (realizado|salvo|concluído|criado|excluído)\b/g,(m,a)=>"Sessão "+a.replace(/o$/,"a")],
  [/\bEpisódios\b/g,"Sessões"],[/\bepisódios\b/g,"sessões"],[/\bEpisódio\b/g,"Sessão"],[/\bepisódio\b/g,"sessão"],
  [/\b(Sessão de [^.!]*?) (criado|excluído|salvo)\b/g,(m,a,b)=>a+" "+b.replace(/o$/,"a")],
  [/\b([Ss]essões) (realizados|cadastrados|avaliados|antigos|agendados|passados)\b/g,(m,a,b)=>a+" "+b.replace(/os$/,"as")]
];
const BRAND_SKIP="textarea,input,script,style,.no-brand,.sq-body p,.mq-text,.vq-body p,.minha .mt,.done-q p,.cq-body p,.ovd-text,.ovf-text,.ovf-name,.ovd-name,.ep-card .th,.ep-card .pr,.li-theme,.li-pres,.hn-theme:not(.none),.tp-q,.sala-onair p,.obj-list,.mat-links,.listen-head h1,.mq-name,.chip span,.sala-onair .meta,.unans-text";
function brandText(t){
  if(PROG==="akicast"||!t) return t;
  let out=t.replace(/AkiCast/g,PN());
  if((PROG==="learning"||PROG==="culture") && /pis[óo]dio/i.test(out)){
    TERM_RULES.forEach(([re,rep])=>{ out=out.replace(re,rep); });
    if(PROG==="culture") out=out.replace(/Sessões/g,"Edições").replace(/sessões/g,"edições").replace(/Sessão/g,"Edição").replace(/sessão/g,"edição");
  }
  // AkiTeste: cada evento é um "teste" (masculino, como "episódio")
  if(PROG==="teste") out=out.replace(/AkiTestes/g,"Testes").replace(/(Próximo|próximo|Último|último|Este|este|Neste|neste|Deste|deste|Um|um) AkiTeste\b/g,"$1 teste")
    .replace(/Episódios/g,"Testes").replace(/episódios/g,"testes").replace(/Episódio/g,"Teste").replace(/episódio/g,"teste");
  return out;
}
const NEEDS=v=>v&&(v.indexOf("AkiCast")>=0||/pis[óo]dio/.test(v));
function brandFix(node){
  if(PROG==="akicast"||!node) return;
  const skip=el=>el&&el.closest&&el.closest(BRAND_SKIP);
  const fixAttrs=el=>["title","alt","aria-label","placeholder"].forEach(a=>{ const v=el.getAttribute&&el.getAttribute(a); if(NEEDS(v)){ const nv=brandText(v); if(nv!==v) el.setAttribute(a,nv); } });
  if(node.nodeType===3){ if(NEEDS(node.nodeValue) && !skip(node.parentElement)){ const nv=brandText(node.nodeValue); if(nv!==node.nodeValue) node.nodeValue=nv; } return; }
  if(node.nodeType!==1||skip(node)) return;
  fixAttrs(node);
  const w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let n; while((n=w.nextNode())){
    if(n.nodeType===3){ if(NEEDS(n.nodeValue) && !skip(n.parentElement)){ const nv=brandText(n.nodeValue); if(nv!==n.nodeValue) n.nodeValue=nv; } }
    else if(!skip(n)) fixAttrs(n);
  }
}
const brandObs=new MutationObserver(ms=>{ if(PROG==="akicast") return; ms.forEach(m=>{ if(m.type==="characterData") brandFix(m.target); else m.addedNodes.forEach(brandFix); }); });
function applyProgramBrand(){
  document.documentElement.dataset.program=PROG;
  const sub=document.querySelector(".brand-sub"); if(sub) sub.textContent=PG().schedule;
  const pn=document.getElementById("progName"); if(pn) pn.textContent=PN();
  document.querySelectorAll("#progMenu [data-prog]").forEach(b=>b.setAttribute("aria-checked",b.dataset.prog===PROG?"true":"false"));
  document.title=document.title.replace(/AkiCast|AkiLearning|AkiCulture|AkiTeste/g,PN());
  // cores das alternativas: no AkiCulture o laranja é a cor principal, então a 2ª alternativa vira roxa
  CHART_COLORS_BASE[0]=PROG==="culture"?"#E07F12":"var(--brand)"; CHART_COLORS_BASE[1]=PROG==="culture"?"#7218EC":"#FFA744";
  // AkiTeste: alternativas em tons de cinza, do mais escuro ao mais claro
  if(PROG==="teste"){ CHART_COLORS_BASE[0]="#27272A"; CHART_COLORS_BASE[1]="#71717A"; CHART_COLORS_BASE[2]="#A1A1AA"; CHART_COLORS_BASE[3]="#52525B"; CHART_COLORS_BASE[4]="#D4D4D8"; }
  else { CHART_COLORS_BASE[2]="#49AD6F"; CHART_COLORS_BASE[3]="#06C4D0"; CHART_COLORS_BASE[4]="#E0559A"; }
  const tc=document.querySelector('meta[name="theme-color"]'); if(tc) tc.setAttribute("content",PG().brand);
  setBrandLogos();
  brandFix(document.body);
  brandObs.disconnect(); if(PROG!=="akicast") brandObs.observe(document.body,{subtree:true,childList:true,characterData:true});
}
function switchProgram(id,reload){
  if(!PROGRAMS[id]) return;
  try{ localStorage.setItem("akicast-program",id); }catch(e){}
  if(reload!==false){ location.href=location.pathname; return; }
  PROG=id; applyProgramBrand();
}
// Página aberta por link de um episódio: segue o programa do episódio
applyProgramBrand();
{ const btn=document.getElementById("progBtn"), menu=document.getElementById("progMenu");
  if(btn&&menu){
    btn.addEventListener("click",e=>{ e.stopPropagation(); const open=menu.hidden; menu.hidden=!open; btn.setAttribute("aria-expanded",open?"true":"false"); });
    menu.querySelectorAll("[data-prog]").forEach(b=>b.addEventListener("click",()=>{ menu.hidden=true; btn.setAttribute("aria-expanded","false"); if(b.dataset.prog!==PROG) switchProgram(b.dataset.prog); }));
    document.addEventListener("click",e=>{ if(!menu.hidden && !e.target.closest("#progSwitch")){ menu.hidden=true; btn.setAttribute("aria-expanded","false"); } });
    document.addEventListener("keydown",e=>{ if(e.key==="Escape" && !menu.hidden){ menu.hidden=true; btn.setAttribute("aria-expanded","false"); btn.focus(); } });
  } }
function followEpisodeProgram(ep){
  const pr=(ep&&ep.program)||"akicast";
  if(PROGRAMS[pr] && pr!==PROG){ PROG=pr; try{ localStorage.setItem("akicast-program",pr); }catch(e){} applyProgramBrand(); }
}


/* ---------- Checklist definition ---------- */
const PHASES = [
  { id:"f1", num:"Fase 1", name:"Pré-produção", when:"Na semana anterior", color:"var(--cyan)", items:[
    {id:"tema", t:"Defina data, tema e descrição", d:"Escolha a data do episódio, o tema central e escreva um resumo do conteúdo para orientar toda a divulgação."},
    {id:"sala", t:"Reserve a sala", d:"Garanta o espaço no sistema para o fim do dia anterior e para toda a manhã do dia da gravação."},
    {id:"slido", t:"Crie o Slido", d:"Monte enquetes e perguntas interativas para engajar os colaboradores durante a live."},
    {id:"canva", t:"Produza as capas no Canva", d:"Crie as artes de capa (thumbnail) usadas na transmissão e no vídeo publicado no canal."},
    {id:"youtube", t:"Agende a live no YouTube", d:"Configure título, horário e visibilidade dentro da conta oficial de Mídias Akiyama."},
    {id:"convite", t:"Envie o convite aos colaboradores", d:"Dispare o link de acesso à live para todos participarem no dia e horário marcados."},
    {id:"obsbg", t:"Configure o plano de fundo no OBS", d:"Monte a cena virtual com antecedência, deixando o ambiente pronto para a transmissão."}
  ]},
  { id:"f2", num:"Fase 2", name:"Véspera do evento", when:"Quinta-feira", color:"var(--orange)", items:[
    {id:"tripes", t:"Confirme o empréstimo dos tripés", d:"São 3 tripés emprestados: 1 para a câmera e 2 para as luzes.", flag:"emprestados"},
    {id:"pc", t:"Separe o computador configurado", d:"Reserve a máquina já com o OBS Studio pronto, sem ajustes de última hora no dia da gravação."},
    {id:"equip", t:"Separe os equipamentos", d:"Câmera, tripé, microfones, segunda tela, luzes e cabo de rede, tudo conferido e funcionando."},
    {id:"baterias", t:"Carregue as baterias", d:"Coloque para carregar tudo que depende de energia, garantindo autonomia total no dia seguinte."},
    {id:"teste", t:"Teste de vídeo e áudio", d:"Confira o enquadramento da câmera, o nível dos microfones (sem ruídos ou eco) e a estabilidade da internet, com uma pré-visualização completa da transmissão no OBS."},
    {id:"materiais", t:"Receba os materiais de apoio", d:"Último momento para receber os slides dos apresentadores e testar as trocas de cena no OBS."}
  ]},
  { id:"f3", num:"Fase 3", name:"Montagem no dia", when:"Sexta, antes das 9h", color:"var(--green)", items:[
    {id:"lapelas", t:"Posicione os microfones de lapela", d:"Ligados por cabo direto no dispositivo de controle da lapela. Com 3 ou mais pessoas, confira o posicionamento de cada um."},
    {id:"camera", t:"Ligue a câmera por cabo e deixe-a aberta", d:"Câmera carregada e conectada direto no computador, aberta durante toda a transmissão para não superaquecer."},
    {id:"luzes", t:"Monte os tripés e as 2 lâmpadas", d:"1 tripé para a câmera e 2 para as luzes. Lâmpadas, cabos e extensões estão na caixa azul."},
    {id:"papeis", t:"Defina quem cuida do ISO e das telas", d:"Pessoa 1 controla o ISO da câmera conforme a luz natural muda. Pessoa 2 cuida dos cenários e telas."},
    {id:"monitor", t:"Use o celular como monitor de áudio", d:"Uma tela só para a operação; o celular acompanha o áudio da transmissão."},
    {id:"tv", t:"Ligue a TV de fundo para o apresentador", d:"Ajuda o apresentador a acompanhar o que está sendo mostrado ao público."}
  ]},
  { id:"f4", num:"Fase 4", name:"Pós-produção", when:"Depois da live", color:"var(--violet)", rating:true, items:[
    {id:"publicado", t:"Confira o vídeo publicado no canal", d:"Título, capa e visibilidade corretos na conta de Mídias Akiyama."},
    {id:"guardar", t:"Guarde tudo na caixa azul", d:"Lâmpadas, cabos e extensões de volta à caixa azul."},
    {id:"devolver", t:"Devolva os tripés emprestados", d:"Entregue os 3 tripés a quem emprestou e combine a disponibilidade para o próximo episódio."}
  ]}
];
const RATINGS = [
  {n:5, t:"Tudo deu certo", c:"var(--green)"},
  {n:4, t:"Deu certo e temos ideias novas", c:"var(--cyan)"},
  {n:3, t:"Precisamos ajustar algumas coisas", c:"var(--orange)"},
  {n:2, t:"Algumas coisas deram errado", c:"var(--red)"},
  {n:1, t:"O podcast foi cancelado por problemas técnicos", c:"var(--red)"}
];
const ratingOf = n => RATINGS.find(r=>r.n===n) || null;
const phaseTotal = p => p.items.length + (p.rating?1:0);
const phaseDone = (p,ep) => p.items.filter(i=>(ep.checks||{})[i.id]).length + (p.rating && ratingOf(ep.rating)?1:0);
let TOTAL = PHASES.reduce((a,p)=>a+phaseTotal(p),0);

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MONTHS_S = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const WEEKDAYS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
function parseDate(s){ if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function isoDate(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function nextFriday(from){
  const d = new Date(from); d.setHours(0,0,0,0);
  let add = (5 - d.getDay() + 7) % 7;
  if(add===0 && new Date(from).getHours()>=10) add = 7;
  d.setDate(d.getDate()+add); return d;
}
function fmtLong(s){ const d=parseDate(s); if(!d) return "Data a definir"; return WEEKDAYS[d.getDay()]+", "+d.getDate()+" de "+MONTHS[d.getMonth()]; }
function fmtShort(s){ const d=parseDate(s); if(!d) return "sem data"; return d.getDate()+" "+MONTHS_S[d.getMonth()]+" "+d.getFullYear(); }
function isPast(s){ const d=parseDate(s); if(!d) return false; d.setHours(10,0,0,0); return new Date()>=d; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
let toastT;
function toast(msg){ const t=$("#toast"); t.classList.remove("act"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),3200); }
function toastAction(msg,label,onAct,ms){
  const t=$("#toast"); t.innerHTML=""; t.classList.add("act","show");
  const sp=document.createElement("span"); sp.textContent=msg;
  const b=document.createElement("button"); b.type="button"; b.textContent=label;
  b.addEventListener("click",()=>{ clearTimeout(toastT); t.classList.remove("show","act"); onAct(); });
  t.append(sp,b); clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove("show","act"),ms||7000);
}
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

/* ---------- Tabs ---------- */
document.querySelectorAll('nav.tabs button[aria-controls]').forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll('nav.tabs button[aria-controls]').forEach(b=>{
      const on = b===btn; b.setAttribute("aria-selected", on?"true":"false");
      document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
    });
    lsSet("akicast-tab", btn.id);
    lugarSalvar("push");
  });
});

/* ---------- F5 volta para o mesmo lugar, e o Voltar do navegador funciona ----------
   A aba aberta, o episódio aberto e o episódio da aba Apresentações ficam no endereço (ex.: #episodios/<id>).
   Trocar de aba e abrir ou fechar um episódio cria um passo no histórico: o Voltar do navegador (ou do mouse)
   leva para onde você estava antes. Ao recarregar, a central abre de novo no mesmo ponto. */
const ABA_NOME={"tab-home":"painel","tab-check":"episodios","tab-pres":"apresentacoes","tab-int":"interacao","tab-guide":"guia"};
const NOME_ABA=Object.fromEntries(Object.entries(ABA_NOME).map(([k,v])=>[v,k]));
const PAGINA_PROPRIA=/[?&](exibir|controle|enviar|sala|perguntas|interacoes|ouvir|ouvintes|qrcode|capa|tela|c|e)=/.test(location.search);
let lugarEp=null, lugarPres=null, lugarRestaurando=false;
function lugarHash(){
  const aba=[...document.querySelectorAll('nav.tabs button[aria-controls]')].find(b=>b.getAttribute("aria-selected")==="true");
  const nome=ABA_NOME[aba&&aba.id]||"painel";
  let h="#"+nome;
  if(nome==="episodios"&&typeof selectedId!=="undefined"&&selectedId) h+="/"+selectedId;
  if(nome==="apresentacoes"&&typeof presEpId!=="undefined"&&presEpId) h+="/"+presEpId;
  return h;
}
// modo "push" cria um passo no histórico (o usuário navegou); "replace" só atualiza o endereço
function lugarSalvar(modo){
  if(PAGINA_PROPRIA||lugarRestaurando) return;
  const h=lugarHash();
  if(location.hash!==h){
    try{
      const url=location.pathname+location.search+h;
      if(modo==="replace"||!location.hash) history.replaceState(null,"",url); else history.pushState(null,"",url);
    }catch(e){}
  }
  setTimeout(()=>{ try{ updateTitle(); }catch(e){} },0);
}
// leva a central até o lugar descrito no endereço (ao abrir, no F5 e no Voltar/Avançar)
function lugarAplicar(){
  if(PAGINA_PROPRIA) return;
  const h=decodeURIComponent((location.hash||"").slice(1)); if(/access_token|type=/.test(h)) return;
  const [nome,id]=(h||"painel").split("/"); const tab=NOME_ABA[nome]; if(!tab) return;
  const b=document.getElementById(tab); if(!b) return;
  lugarRestaurando=true;
  try{
    if(b.getAttribute("aria-selected")!=="true") b.click();
    if(nome==="episodios"){
      if(id){ if(typeof episodes!=="undefined"&&episodes.find(e=>e.id===id)){ lugarEp=null; if(selectedId!==id) openEp(id); } else lugarEp=id; }
      else if(typeof selectedId!=="undefined"&&selectedId) closeEp();
    } else if(typeof selectedId!=="undefined"&&selectedId&&nome!=="episodios"){ /* episódio continua aberto na sua aba */ }
    if(nome==="apresentacoes"&&id){
      if(typeof episodes!=="undefined"&&episodes.find(e=>e.id===id)){ if(presEpId!==id){ presSelect(id); const sl=$("#presEp"); if(sl) sl.value=id; if(typeof renderPresCards==="function") renderPresCards(); } }
      else lugarPres=id;
    }
  } finally { lugarRestaurando=false; }
  try{ updateTitle(); }catch(e){}
}
// roda depois que toda a central carregou, para as abas já terem todos os seus comportamentos
setTimeout(lugarAplicar,0);
addEventListener("popstate",()=>lugarAplicar());
addEventListener("hashchange",()=>{ if(lugarHash()!==location.hash) lugarAplicar(); });

/* Botão do meio (ou Ctrl+clique) nas abas do menu e nos cartões de episódio: abre numa aba nova do navegador */
function lugarDoElemento(el){
  if(!el||!el.closest) return null;
  const t=el.closest('nav.tabs button[aria-controls]'); if(t&&ABA_NOME[t.id]) return "#"+ABA_NOME[t.id];
  const o=el.closest("[data-open],[data-go-ep]"); if(o) return "#episodios/"+(o.dataset.open||o.dataset.goEp);
  const pr=el.closest("[data-go-pres]"); if(pr) return "#apresentacoes/"+pr.dataset.goPres;
  return null;
}
function abrirEmNovaAba(h){ window.open(location.pathname+location.search.replace(/[?&]?$/,"")+h,"_blank","noopener"); }
document.addEventListener("auxclick",e=>{ if(e.button!==1||PAGINA_PROPRIA) return; const h=lugarDoElemento(e.target); if(h){ e.preventDefault(); abrirEmNovaAba(h); } });
document.addEventListener("mousedown",e=>{ if(e.button===1&&!PAGINA_PROPRIA&&lugarDoElemento(e.target)) e.preventDefault(); });   // sem o ícone de rolagem automática
document.addEventListener("click",e=>{ if(!(e.ctrlKey||e.metaKey)||PAGINA_PROPRIA) return; const h=lugarDoElemento(e.target); if(h){ e.preventDefault(); e.stopImmediatePropagation(); abrirEmNovaAba(h); } },true);

/* ---------- Stores ---------- */
function deepMerge(a,b){ const o={...a}; for(const k in b){ if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a&&typeof a[k]==="object") o[k]=deepMerge(a[k],b[k]); else o[k]=b[k]; } return o; }
function makeLocalStore(){
  const KEY="akicast-hub-local";
  let data={}; try{ data=JSON.parse(lsGet(KEY)||"{}")||{}; }catch(e){ data={}; }
  let cb=null;
  const emit=()=>{ lsSet(KEY,JSON.stringify(data)); cb && cb(Object.entries(data).map(([id,v])=>({id,...v}))); };
  return {
    subscribe(fn){ cb=fn; setTimeout(emit,0); },
    async create(body){ const id="ep"+Date.now().toString(36); data[id]={...body,program:PROG}; emit(); return id; },
    async update(id,patch){ if(data[id]){ data[id]=deepMerge(data[id],patch); emit(); } },
    async remove(id){ delete data[id]; emit(); }
  };
}
function makeDbStore(db){
  const col = db.collection("episodes");
  return {
    subscribe(fn, onErr){ col.onSnapshot(snap=>{ fn(snap.docs.filter(d=>d.exists).map(d=>({id:d.id,...d.data()}))); }, e=>onErr&&onErr(e)); },
    async create(body){ const ref=col.doc(); await ref.set(body); return ref.id; },
    async update(id,patch){ await col.doc(id).update(patch); },
    async remove(id){ await col.doc(id).delete(); }
  };
}

/* ---------- App state ---------- */
let store=null, episodes=[], selectedId=null, builtFor=null, readOnly=false, lastList=[], pendingNew=null;
let writeChain=Promise.resolve(), writeFailed=false;
function handleErr(e){
  const code = e && e.code;
  if(code==="invalid_argument"){ readOnly=true; applyReadOnly(); toast("Você pode ver esta central, mas não editar. Peça acesso de Colaborador."); }
  else if(code==="quota_exceeded"){ toast("Limite de episódios atingido. Exclua episódios antigos para criar novos."); }
  else if(code==="unavailable"){ toast("Conexão instável. A alteração não foi salva, tente de novo."); }
  else { toast("Não foi possível salvar a alteração"+(e&&e.message?": "+e.message:".")); }
}
function queueWrite(fn){
  writeChain = writeChain.then(fn).catch(e=>{ writeFailed=true; handleErr(e); if(builtFor) updateView(); });
  return writeChain;
}
const debounces={};
function debouncedUpdate(field, value){
  const id=selectedId; const key=id+":"+field;
  if(debounces[key]) clearTimeout(debounces[key].t);
  const run=()=>{ delete debounces[key]; return queueWrite(()=>store.update(id,{[field]:value})); };
  debounces[key]={t:setTimeout(run,650),run};
}
/* =================== Ritmo das consultas ao banco =================== */
/* Roda fn agora e depois no intervalo que ms() devolver (null = pausado, ex.: aba escondida).
   agora() antecipa a próxima rodada: é chamado pelos avisos em tempo real.
   Nunca roda duas vezes ao mesmo tempo. */
function agendador(fn,ms,opc){
  opc=opc||{};
  let t=null, quando=0, rodando=false, pedido=false, parado=false, ultima=0;
  const prox=()=>{ clearTimeout(t); t=null; quando=0; if(parado) return; let d=null; try{ d=ms(); }catch(e){ d=15000; } if(d==null) return; t=setTimeout(rodar,d); quando=Date.now()+d; };
  async function rodar(){
    if(parado) return;
    if(rodando){ pedido=true; return; }
    rodando=true; ultima=Date.now(); try{ await fn(); }catch(e){}
    rodando=false;
    if(pedido){ pedido=false; return rodar(); }
    prox();
  }
  const vis=()=>{ if(!document.hidden) agora(); else prox(); };
  // agora(): antecipa a próxima rodada. Com minGap/jitter, vários avisos seguidos viram uma consulta só,
  // e cada aparelho consulta num instante um pouco diferente (sem todos baterem no banco ao mesmo tempo).
  function agora(){
    if(parado) return;
    const espera=Math.max(150,(opc.minGap||0)-(Date.now()-ultima))+Math.random()*(opc.jitter||0);
    if(t&&opc.minGap&&quando&&quando<=Date.now()+espera) return;   // já tem uma consulta marcada antes disso
    clearTimeout(t); t=setTimeout(rodar,espera); quando=Date.now()+espera;
  }
  document.addEventListener("visibilitychange",vis);
  rodar();
  return {agora, parar(){ parado=true; clearTimeout(t); document.removeEventListener("visibilitychange",vis); }};
}
/* Dia de live: no dia do episódio as telas respondem mais rápido; nos outros dias, bem devagar. */
function diaDeLive(data){ if(!data) return true; const d=new Date(), h=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); return String(data).slice(0,10)===h; }
const aviso=(ch,tabela,ep,fn)=>ch.on("postgres_changes",{event:"*",schema:"public",table:tabela,filter:"episode_id=eq."+ep},fn);

/* =================== Checklist em peças (quebra-cabeça) =================== */
/* Cada item é uma linha própria no banco (checklist_marcas), com a hora em que foi marcado.
   Marcar um item grava e avisa só aquele item; a tela sempre fica com a marcação mais recente de cada um.
   O checklist do episódio (episodes.checks) continua sendo atualizado pelo banco, para a lista, a tela inicial e a planilha. */
const PZ={epId:null,itens:{},pend:{},seq:0,ok:null,canal:null,chain:Promise.resolve(),fila:{},filaT:null,lerT:null,carregado:false};
function pzFeito(id){ const p=PZ.pend[id]; if(p) return p.feito; const i=PZ.itens[id]; return !!(i&&i.feito); }
function pzAplicar(row){
  // última marcação vence: só aceita se for mais nova que a que já temos
  if(!row||!row.item_id) return false;
  const em=Date.parse(row.em)||0, cur=PZ.itens[row.item_id];
  if(cur&&cur.em>em) return false;
  if(cur&&cur.em===em&&cur.feito===!!row.feito) return false;
  PZ.itens[row.item_id]={feito:!!row.feito,em,por:row.por||""};
  return true;
}
async function pzCarregar(){
  const id=PZ.epId; if(!id||!SB) return;
  const {data,error}=await SB.from("checklist_marcas").select("item_id,feito,em,por").eq("episode_id",id);
  if(PZ.epId!==id) return;
  if(error){
    if(PZ.ok===null||PZ.ok===false){ PZ.ok=false; pzRender(); }
    return;
  }
  PZ.ok=true; PZ.carregado=true;
  let mudou=false; (data||[]).forEach(r=>{ if(pzAplicar(r)) mudou=true; });
  if(mudou||!PZ.desenhado) pzRender();
}
function pzRecarregar(ms){ clearTimeout(PZ.lerT); PZ.lerT=setTimeout(pzCarregar,ms==null?400:ms); }
function pzAbrir(epId){
  if(PZ.epId===epId) return;
  pzFechar();
  Object.assign(PZ,{epId,itens:{},pend:{},ok:null,fila:{},carregado:false,desenhado:false});
  // enquanto o banco responde, mostra o que o episódio já tinha
  const ep=episodes.find(e=>e.id===epId);
  if(ep) Object.keys(ep.checks||{}).forEach(k=>{ PZ.itens[k]={feito:!!ep.checks[k],em:0}; });
  pzRender();
  if(!SB) return;
  pzCarregar();
  PZ.canal=SB.channel("pecas-"+epId+"-"+uid())
    .on("postgres_changes",{event:"*",schema:"public",table:"checklist_marcas",filter:"episode_id=eq."+epId},p=>{
      if(PZ.epId!==epId) return;
      const r=p.new;
      if(r&&r.item_id&&r.em!=null&&typeof r.feito==="boolean"){ if(pzAplicar(r)) pzRender(); }
      pzRecarregar(); // confere com uma leitura completa logo depois
    })
    .subscribe(st=>{ if(st==="SUBSCRIBED") pzRecarregar(0); });
}
function pzFechar(){
  pzEnviar();
  if(PZ.canal){ try{ SB.removeChannel(PZ.canal); }catch(e){} PZ.canal=null; }
  clearTimeout(PZ.lerT); PZ.epId=null;
}
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&PZ.epId) pzRecarregar(0); });
/* Marcar: aparece na hora; cliques rápidos viram uma gravação só */
function pzMarcar(patch){
  if(readOnly||!PZ.epId) return;
  if(PZ.ok===false){ toast("Falta rodar o checklist-pecas.sql no Supabase."); return; }
  Object.keys(patch).forEach(k=>{ PZ.pend[k]={feito:!!patch[k],seq:++PZ.seq}; PZ.fila[k]=!!patch[k]; });
  pzRender(Object.keys(patch));
  clearTimeout(PZ.filaT); PZ.filaT=setTimeout(pzEnviar,40);
}
function pzEnviar(){
  clearTimeout(PZ.filaT); PZ.filaT=null;
  const epId=PZ.epId, itens=PZ.fila; if(!epId||!Object.keys(itens).length) return PZ.chain;
  PZ.fila={};
  const seqs={}; Object.keys(itens).forEach(k=>seqs[k]=PZ.pend[k]&&PZ.pend[k].seq);
  PZ.chain=PZ.chain.then(async()=>{
    const {data,error}=await SB.rpc("ck_marcar",{p_episode:epId,p_itens:itens});
    if(PZ.epId!==epId) return;
    if(error){
      Object.keys(itens).forEach(k=>{ if(PZ.pend[k]&&PZ.pend[k].seq===seqs[k]) delete PZ.pend[k]; });
      pzRender(); writeFailed=true;
      toast(/ck_marcar|function|schema cache/i.test(error.message||"")?"Falta rodar o checklist-pecas.sql no Supabase.":"Não foi possível salvar o checklist: "+(error.message||"tente de novo")+".");
      return;
    }
    (data||[]).forEach(r=>pzAplicar(r));
    Object.keys(itens).forEach(k=>{ if(PZ.pend[k]&&PZ.pend[k].seq===seqs[k]) delete PZ.pend[k]; });
    pzRender();
  }).catch(()=>{});
  return PZ.chain;
}
function pzSnapshot(){ const ep=currentEp(); const checks={}; PHASES.forEach(p=>p.items.forEach(i=>{ checks[i.id]=pzFeito(i.id); })); return {checks,rating:ep?ep.rating:null}; }
function pzMarcarFase(pid){
  const p=PHASES.find(x=>x.id===pid); if(!p||!p.items.length||readOnly) return;
  const todos=p.items.every(i=>pzFeito(i.id)), alvo=!todos, antes={}, patch={};
  p.items.forEach(i=>{ antes[i.id]=pzFeito(i.id); if(antes[i.id]!==alvo) patch[i.id]=alvo; });
  if(!Object.keys(patch).length) return;
  const epId=PZ.epId;
  pzMarcar(patch);
  toastAction(alvo?`${p.name}: todas as peças encaixadas.`:`${p.name}: peças soltas.`,"Desfazer",()=>{
    if(PZ.epId!==epId) return; const back={}; Object.keys(patch).forEach(k=>back[k]=antes[k]); pzMarcar(back);
  });
}
/* Desenho */
function pzPeca(i,n,w,h){
  const x=i*w, y=14, t=Math.round(w*0.13), r=Math.round(h*0.13), mid=y+h/2;
  let d=`M${x},${y} H${x+w} `;
  if(i<n-1) d+=`V${mid-r} C${x+w+t},${mid-r-8} ${x+w+t},${mid+r+8} ${x+w},${mid+r} `;
  d+=`V${y+h} H${x} `;
  if(i>0) d+=`V${mid+r} C${x+t},${mid+r+8} ${x+t},${mid-r-8} ${x},${mid-r} `;
  return d+"Z";
}
function pzFaseConta(p,ep){ const n=p.items.filter(i=>pzFeito(i.id)).length+(p.rating&&ratingOf(ep&&ep.rating)?1:0); return {n,t:phaseTotal(p)}; }
function pzBoardHtml(){
  const ep=currentEp(), n=PHASES.length, w=180, h=104, W=n*w+Math.round(w*0.13);
  let s="";
  PHASES.forEach((p,i)=>{
    const c=pzFaseConta(p,ep), f=c.t?c.n/c.t:0, cheia=c.t&&c.n===c.t, cx=i*w+w/2;
    s+=`<g class="pz-g${cheia?" cheia":""}" data-fase="${p.id}" style="--pc:${p.color}">
      <path class="pz-p" d="${pzPeca(i,n,w,h)}" style="fill:${p.color};fill-opacity:${(0.1+f*0.9).toFixed(2)};stroke:${p.color}"/>
      <text x="${cx}" y="62" text-anchor="middle" class="pz-tn${f>0.55?" claro":""}">${esc(p.name)}</text>
      <text x="${cx}" y="84" text-anchor="middle" class="pz-ts${f>0.55?" claro":""}">${cheia?"encaixada":c.n+" de "+c.t}</text></g>`;
  });
  return `<svg class="pz-board" viewBox="-2 0 ${W+4} ${h+28}" role="img" aria-label="Progresso do episódio por fase">${s}</svg>`;
}
function pzRender(soItens){
  const box=$("#pzBox"); if(!box||PZ.epId!==selectedId) return;
  const ep=currentEp();
  PZ.desenhado=true;
  // itens
  box.querySelectorAll("[data-peca]").forEach(b=>{
    const on=pzFeito(b.dataset.peca), era=b.classList.contains("on");
    if(on!==era){ b.classList.toggle("on",on); b.setAttribute("aria-pressed",on?"true":"false"); if(on&&soItens&&soItens.includes(b.dataset.peca)){ b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); } }
    b.classList.toggle("salvando",!!PZ.pend[b.dataset.peca]);
  });
  // cards das fases
  let total=0, feitos=0;
  PHASES.forEach(p=>{
    const c=pzFaseConta(p,ep); total+=c.t; feitos+=c.n;
    const card=box.querySelector(`[data-card="${p.id}"]`); if(!card) return;
    const cheia=c.t&&c.n===c.t, era=card.classList.contains("cheia");
    card.classList.toggle("cheia",!!cheia); if(cheia&&!era&&PZ.carregado){ card.classList.remove("encaixe"); void card.offsetWidth; card.classList.add("encaixe"); }
    const tl=card.querySelector("[data-tally]"); if(tl) tl.textContent=cheia?"Fase encaixada":c.n+" de "+c.t;
    const mb=card.querySelector("[data-markall]"); if(mb){ const all=p.items.length&&p.items.every(i=>pzFeito(i.id)); mb.textContent=all?"Soltar todas":"Encaixar todas"; }
  });
  // tabuleiro
  const bd=box.querySelector("#pzBoardWrap"); if(bd) bd.innerHTML=pzBoardHtml();
  const ch=box.querySelector("#pzChips"); if(ch) ch.innerHTML=PHASES.map(p=>{ const c=pzFaseConta(p,ep); return `<span class="pz-chip${c.t&&c.n===c.t?" cheia":""}" style="--pc:${p.color}"><i style="width:${c.t?Math.round(c.n/c.t*100):0}%"></i><b>${esc(p.name)}</b><em>${c.n}/${c.t}</em></span>`; }).join("");
  const pt=$("#progTotal"); if(pt) pt.textContent = feitos===total ? "Quebra-cabeça completo: episódio pronto e avaliado." : feitos+" de "+total+" peças encaixadas";
  const av=box.querySelector("#pzAviso"); if(av) av.innerHTML = PZ.ok===false ? '<div class="warn">O checklist novo precisa do <b>checklist-pecas.sql</b> no Supabase. Até lá ele fica só para leitura.</div>' : "";
}
function pzHtml(){
  return `<div class="pz" id="pzBox">
    <div class="pz-top"><div id="pzBoardWrap"></div><div class="pz-chips" id="pzChips"></div><div class="progress-total" id="progTotal"></div></div>
    <div id="pzAviso"></div>
    <div class="pz-grid">${PHASES.map(p=>`
      <section class="pz-card" data-card="${p.id}" style="--pc:${p.color}" aria-labelledby="h-${p.id}">
        <div class="pz-head">
          <div><span class="pz-num">${esc(p.num)} · ${esc(p.when)}</span><h3 id="h-${p.id}">${esc(p.name)}</h3></div>
          <span class="pz-tally" data-tally="${p.id}"></span>
        </div>
        <div class="pz-itens">${p.items.map(i=>`
          <button class="pz-tile" type="button" data-peca="${esc(i.id)}" aria-pressed="false">
            <span class="pz-ck" aria-hidden="true">${CHECK_SVG}</span>
            <span class="pz-tx"><span class="t">${esc(i.t)}${i.flag?`<span class="flag">${esc(i.flag)}</span>`:""}</span>${i.d?`<span class="d">${esc(i.d)}</span>`:""}</span>
          </button>`).join("")}</div>
        ${p.items.length?`<div class="pz-foot"><button class="linkbtn" type="button" data-markall="${p.id}">Encaixar todas</button></div>`:""}
        ${p.rating?`<div class="pz-rating">${ratingHtml()}</div>`:""}
      </section>`).join("")}</div>
  </div>`;
}
function pzLigar(B){
  B.querySelectorAll("[data-peca]").forEach(b=>b.addEventListener("click",()=>{ const k=b.dataset.peca; pzMarcar({[k]:!pzFeito(k)}); }));
  B.querySelectorAll("[data-markall]").forEach(b=>b.addEventListener("click",()=>pzMarcarFase(b.dataset.markall)));
}
function flushPending(){
  if(typeof matDirty!=="undefined" && matDirty) saveMatNow();
  Object.values(debounces).forEach(d=>{ clearTimeout(d.t); d.run(); });
  pzEnviar();
  return Promise.all([writeChain,PZ.chain]);
}
function currentEp(){ return episodes.find(e=>e.id===selectedId)||null; }

const pendingDel=new Map();
function commitDelete(id){ if(!pendingDel.has(id)) return; pendingDel.delete(id); store.remove(id).catch(handleErr); }
addEventListener("pagehide",()=>{ pzEnviar(); [...pendingDel.keys()].forEach(commitDelete); [...deckHidden.keys()].forEach(id=>{ clearTimeout(deckHidden.get(id)); deckHidden.delete(id); removeDeck(id).catch(()=>{}); }); });
let directOpen=null; // {mode, id} from ?controle= or ?exibir=
async function runDirectOpen(){
  if(!directOpen) return;
  // Sala e controle sem código no link precisam de login: o link espera a pessoa entrar e segue depois.
  if(!SESSION && !K_LINK && directOpen.mode!=="exibir") return;
  if(runDirectOpen._rodando) return; runDirectOpen._rodando=true;
  try{
  const {mode,id}=directOpen;
  { const any=(lastList||[]).find(e=>e.id===id); if(any && (any.program||"akicast")!==PROG){ try{ localStorage.setItem("akicast-program",any.program||"akicast"); }catch(e){} location.reload(); return; } }
  if(!episodes.find(e=>e.id===id)){
    // o episódio pode não estar na lista desta pessoa (ex.: apresentador): confere direto antes de recusar
    let existe=false; try{ const r=await epPublico(id); existe=!!(r&&r.data); }catch(e){}
    if(!existe){ directOpen=null; updateGate(); toast("Link inválido: este episódio não existe mais. Peça um novo link para a equipe."); clearDirectParam(); return; }
  }
  directOpen=null; updateGate();
  // apresentador logado: recebe o código de controle do episódio e passa os slides como pelo link curto
  if(mode==="controle" && !K_LINK && SESSION && SESSION.papel!=="admin"){
    try{ const r=await SB.rpc("int_link_controle",{p_episode:id}); if(!r.error&&r.data) K_LINK=String(r.data); else if(r.error&&/int_link_controle|schema cache|could not find/i.test(r.error.message||"")) toast("Falta rodar o int-link-controle-logado.sql: o apresentador logado pode não conseguir passar os slides."); }catch(e){}
  }
  const tp=$("#tab-pres"); if(tp) tp.click();
  presSelect(id); const sel=$("#presEp"); if(sel) sel.value=id;
  if(mode==="controle") openController(id); else if(mode==="sala") openSala(id); else openDisplay(id);
  } finally { runDirectOpen._rodando=false; }
}
function clearDirectParam(){
  const u=new URL(location.href);
  if(u.searchParams.has("controle")||u.searchParams.has("exibir")||u.searchParams.has("sala")){ u.searchParams.delete("controle"); u.searchParams.delete("exibir"); u.searchParams.delete("sala"); history.replaceState(null,"",u.pathname+(u.search?u.search:"")+u.hash); }
}
function onData(list){
  $("#loading").hidden=true;
  lastList = list;
  episodes = list.filter(e=>!pendingDel.has(e.id) && (e.program||"akicast")===PROG).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  if(pendingNew && episodes.find(e=>e.id===pendingNew)) pendingNew=null;
  if(selectedId && !episodes.find(e=>e.id===selectedId) && selectedId!==pendingNew){ selectedId=null; builtFor=null; }
  renderList();
  presOnEpisodes();
  renderHome();
  if(lugarEp){ if(episodes.find(e=>e.id===lugarEp)){ const id=lugarEp; lugarEp=null; lugarRestaurando=true; openEp(id); lugarRestaurando=false; return; } else if(episodes.length) lugarEp=null; }
  if(selectedId){ if(builtFor!==selectedId) buildView(); updateView(); }
  showView();
  runDirectOpen();
}
function showView(){
  const wasHidden=$("#listView").hidden;
  $("#listView").hidden = !!selectedId || editing;
  if(wasHidden && !$("#listView").hidden){ const lb=$("#listBody"); lb.classList.add("stagger"); setTimeout(()=>lb.classList.remove("stagger"),800); }
  $("#detailView").hidden = !selectedId || editing;
  $("#editView").hidden = !editing;
}
function openEp(id){ selectedId=id; builtFor=null; buildView(); updateView(); showView(); window.scrollTo(0,0); lugarSalvar("push"); }
function closeEp(){ flushPending(); pzFechar(); selectedId=null; builtFor=null; $("#epBody").innerHTML=""; renderList(); showView(); window.scrollTo(0,0); lugarSalvar("push"); }
$("#backBtn").addEventListener("click",closeEp);

/* ---------- List ---------- */
function cardHtml(ep){
  const d=parseDate(ep.date);
  const r=ratingOf(ep.rating);
  const done=PHASES.reduce((a,p)=>a+phaseDone(p,ep),0);
  let foot;
  if(r) foot=`<span>Avaliação</span><span class="badge" style="color:${r.c};background:color-mix(in srgb,${r.c} 16%,transparent)">${r.n}: ${esc(r.t)}</span>`;
  else if(isPast(ep.date)) foot=`<span>${done} de ${TOTAL} itens</span><span class="badge" style="color:var(--warn-ink);background:var(--warn-bg)">Avaliação pendente</span>`;
  else foot=`<span>${done} de ${TOTAL} itens</span>`;
  const mini = PHASES.map(p=>`<div class="bar" style="color:${p.color};flex:${phaseTotal(p)}"><i style="width:${phaseDone(p,ep)/phaseTotal(p)*100}%"></i></div>`).join("");
  return `<button class="ep-card" data-open="${esc(ep.id)}">
    <div class="d1">${d?`<span class="day">${d.getDate()}</span><span class="mon">${MONTHS_S[d.getMonth()]} ${d.getFullYear()}</span><span class="wk">${WEEKDAYS[d.getDay()]}</span>`:`<span class="mon">Data a definir</span>`}</div>
    <div class="th ${ep.theme?"":"none"}">${esc(ep.theme||"Tema a definir")}</div>
    ${ep.presenters?`<div class="pr">${esc(ep.presenters)}</div>`:""}
    <div class="mini">${mini}</div>
    <div class="foot">${foot}</div>
  </button>`;
}
function renderList(){
  const el=$("#listBody");
  if(!episodes.length){
    el.innerHTML = `<div class="empty"><h2>Nenhum episódio por aqui ainda</h2><p>Crie o próximo AkiCast para começar o checklist de preparação.</p><button class="btn primary" id="emptyNew">Criar o próximo episódio</button></div>`;
    $("#emptyNew").addEventListener("click",createEpisode);
    applyReadOnly(); return;
  }
  const upcoming = episodes.filter(e=>!isPast(e.date)).sort((a,b)=>(a.date||"9").localeCompare(b.date||"9"));
  const past = episodes.filter(e=>isPast(e.date));
  el.innerHTML =
    (upcoming.length?`<div class="group-title">Próximos</div><div class="cards">${upcoming.map(cardHtml).join("")}</div>`:"") +
    (past.length?`<div class="group-title">Realizados</div><div class="cards">${past.map(cardHtml).join("")}</div>`:"");
  el.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openEp(b.dataset.open)));
  applyReadOnly();
}

async function createEpisode(){
  if(readOnly) return;
  const used = new Set(episodes.map(e=>e.date));
  let d = nextFriday(new Date());
  while(used.has(isoDate(d))) d.setDate(d.getDate()+7);
  const body = { date:isoDate(d), theme:"", presenters:"", people:null, notes:"", checks:{}, rating:null, review:"", createdAt:new Date().toISOString() };
  $("#newEp").disabled=true;
  try{
    const id = await store.create(body);
    pendingNew=id; askPontuacao.add(id); toast("Episódio de "+fmtShort(body.date)+" criado.");
    openEp(id);
  }catch(e){ handleErr(e); }
  finally{ $("#newEp").disabled=readOnly; }
}
$("#newEp").addEventListener("click",createEpisode);

/* ---------- Detail ---------- */
const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';

function ratingHtml(){
  return `
    <div class="rating-title" id="rateTitle">Como foi este AkiCast?</div>
    <p class="rating-sub">Escolha a nota que melhor descreve a transmissão.</p>
    <ul class="rating" role="radiogroup" aria-labelledby="rateTitle">
      ${RATINGS.map(r=>`<li><label class="rate" style="color:${r.c}">
        <input type="radio" name="rating" value="${r.n}">
        <span class="dot" aria-hidden="true"></span>
        <span class="n">${r.n}</span>
        <span class="lbl">${esc(r.t)}</span>
      </label></li>`).join("")}
    </ul>
    <div class="rating-foot"><span></span><button class="linkbtn" id="clearRate" type="button">Limpar avaliação</button></div>
    <label class="field review"><span>O que funcionou, o que ajustar e ideias novas</span><textarea id="fReview" maxlength="4000" placeholder="Ex.: o áudio da terceira pessoa ficou baixo; testar a segunda tela na próxima"></textarea></label>`;
}

function buildView(){
  builtFor = selectedId;
  const phasesHtml = pzHtml();

  $("#epBody").innerHTML = `
    <div class="hero">
      <h1 class="when" id="heroWhen"></h1>
      <p class="count" id="heroCount"></p>
    </div>
    <div class="fields">
      <label class="field theme-f"><span>Tema</span><input id="fTheme" type="text" placeholder="Ex.: IA no dia a dia da Akiyama" maxlength="140"></label>
      <label class="field"><span>Data</span><input id="fDate" type="date"></label>
      <div class="field wide">
        <span id="presLbl">Apresentadores</span>
        <div class="pres-add">
          <input id="fPresName" type="text" placeholder="Ex.: Clark - Akiyama" maxlength="80" aria-labelledby="presLbl" autocomplete="off">
          <button class="btn primary add-btn" id="presAdd" type="button" aria-label="Adicionar apresentador"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
        </div>
        <ul class="chips" id="presChips" aria-label="Apresentadores adicionados"></ul>
      </div>
      <div class="mic-note" id="micNote" role="note"></div>
      <div class="field half"><span>Link da live no YouTube</span><div class="link-in"><input id="fYoutube" type="url" inputmode="url" placeholder="https://youtube.com/live/…" maxlength="500"><a class="btn ghost sm" id="oYoutube" target="_blank" rel="noopener" aria-disabled="true">Abrir</a></div><span class="hint" id="hYoutube"></span></div>
      <div class="field half"><span>Link do Slido</span><div class="link-in"><input id="fSlido" type="url" inputmode="url" placeholder="https://app.sli.do/event/…" maxlength="500"><a class="btn ghost sm" id="oSlido" target="_blank" rel="noopener" aria-disabled="true">Abrir</a></div><span class="hint" id="hSlido"></span></div>
      <div class="field wide pt-field"><div class="pt-row"><div><span class="pt-lbl">Pontuação e sorteio</span><small class="lrn-hint" id="ptHint"></small></div><button class="sw-toggle" id="fPont" type="button" role="switch" aria-checked="false" aria-label="Pontuação e sorteio"><span class="sw-txt sw-on">ON</span><span class="sw-txt sw-off">OFF</span><span class="sw-k"></span></button></div></div>
      ${PROG==="learning"?learnFieldsHtml():""}
      ${capaFieldsHtml()}
      <label class="field wide"><span>Descrição e notas</span><textarea id="fNotes" maxlength="4000" placeholder="Resumo do conteúdo, links, observações para a equipe"></textarea></label>
    </div>
    ${phasesHtml}
    <div class="pres-card quiz-card" id="quizCard" hidden></div>
    <div class="pres-card unans-card" id="unansCard" hidden></div>
    <div class="ep-foot" id="delWrap">
      <button class="btn ghost" id="delEp">Excluir episódio</button>
      <button class="btn primary" id="saveEp" title="Salva e volta para a lista de episódios">Salvar</button>
      <div class="del-confirm" id="delConfirm" hidden>
        <span>Excluir este episódio e o checklist dele para toda a equipe?</span>
        <button class="btn ghost" id="delCancel" type="button">Cancelar</button>
        <button class="btn danger" id="delYes" type="button">Excluir</button>
      </div>
    </div>`;

  const B=$("#epBody");
  pzLigar(B);
  B.querySelectorAll('input[name="rating"]').forEach(r=>{
    r.addEventListener("change",()=>{
      const id=selectedId, n=Number(r.value);
      pzRender();
      queueWrite(()=>store.update(id,{rating:n}));
    });
  });
  $("#clearRate").addEventListener("click",()=>{
    B.querySelectorAll('input[name="rating"]').forEach(r=>r.checked=false);
    pzRender();
    const id=selectedId; queueWrite(()=>store.update(id,{rating:null}));
  });
  $("#fTheme").addEventListener("input",e=>debouncedUpdate("theme",e.target.value));
  const addPres=()=>{
    const inp=$("#fPresName");
    const names=inp.value.split(",").map(x=>x.trim().replace(/\s+/g," ")).filter(Boolean);
    if(!names.length){ inp.focus(); return; }
    const list=presList.slice();
    justAdded=new Set();
    names.forEach(n=>{ if(!list.some(x=>x.toLowerCase()===n.toLowerCase())){ list.push(n); justAdded.add(n); } });
    setTimeout(()=>{ justAdded=new Set(); },500);
    inp.value=""; inp.focus();
    setPresenters(list);
  };
  $("#presAdd").addEventListener("click",addPres);
  $("#fPresName").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); addPres(); } });
  $("#fNotes").addEventListener("input",e=>debouncedUpdate("notes",e.target.value));
  wireLearnFields(); capaEpWired=null;
  $("#fPont").addEventListener("click",()=>{ askPontuacao.delete(selectedId); const b=$("#fPont"), on=b.getAttribute("aria-checked")!=="true"; b.setAttribute("aria-checked",on?"true":"false"); setPontHint(on); const id=selectedId; queueWrite(()=>store.update(id,{pontuacao:on})); toast(on?"Pontuação e sorteio ligados neste episódio.":"Pontuação e sorteio desligados. Ninguém precisa do nome para participar."); });
  [["fYoutube","youtube_url"],["fSlido","slido_url"]].forEach(([fid,col])=>{
    $("#"+fid).addEventListener("input",e=>{ renderLinks(); debouncedUpdate(col,e.target.value.trim()); });
  });
  $("#fReview").addEventListener("input",e=>debouncedUpdate("review",e.target.value));

  $("#fDate").addEventListener("change",e=>{ const v=e.target.value; if(!parseDate(v)) return; renderHero(v); const id=selectedId; queueWrite(()=>store.update(id,{date:v})); });
  loadUnanswered(selectedId);
  loadQuizEditor(selectedId);
  $("#delEp").addEventListener("click",()=>{
    if(readOnly) return;
    $("#delEp").hidden=true; $("#saveEp").hidden=true; $("#delConfirm").hidden=false; $("#delCancel").focus();
  });
  $("#delCancel").addEventListener("click",()=>{ $("#delConfirm").hidden=true; $("#delEp").hidden=false; $("#saveEp").hidden=false; $("#delEp").focus(); });
  $("#saveEp").addEventListener("click",async()=>{
    if(readOnly) return;
    if(askPontuacao.has(selectedId)){ const choice=await pontuacaoPopup(); if(choice===null) return; askPontuacao.delete(selectedId);
      const pb=$("#fPont"); if(pb){ pb.setAttribute("aria-checked",choice?"true":"false"); setPontHint(choice); }
      const id=selectedId; queueWrite(()=>store.update(id,{pontuacao:choice})); }
    const b=$("#saveEp"); b.disabled=true; b.textContent="Salvando…";
    writeFailed=false;
    await flushPending();
    const ok=!writeFailed && !readOnly;
    if(ok){ toast("Episódio salvo."); closeEp(); return; }
    if(b.isConnected){ b.disabled=readOnly; b.textContent="Salvar"; }
  });
  $("#delYes").addEventListener("click",()=>{
    const ep=currentEp(); if(!ep) return;
    const id=ep.id, label=fmtShort(ep.date);
    closeEp();
    pendingDel.set(id, setTimeout(()=>commitDelete(id),7000));
    onData(lastList);
    toastAction("Episódio de "+label+" excluído.","Desfazer",()=>{
      clearTimeout(pendingDel.get(id)); pendingDel.delete(id); onData(lastList); toast("Exclusão desfeita.");
    });
  });
  applyReadOnly();
}

function localSnapshot(){ return pzSnapshot(); }
function setVal(el,v){ if(el && document.activeElement!==el) el.value = v==null?"":v; }

function updateView(){
  const ep=currentEp(); if(!ep) return;
  const checks=ep.checks||{};
  pzAbrir(ep.id);
  document.querySelectorAll('input[name="rating"]').forEach(r=>{ r.checked = Number(r.value)===ep.rating; });
  setVal($("#fTheme"),ep.theme); setVal($("#fNotes"),ep.notes);
  setVal($("#fReview"),ep.review); setVal($("#fDate"),ep.date);
  if(!presPending){ presList=parsePresenters(ep.presenters); renderChips(); }
  setVal($("#fYoutube"),ep.youtube_url); setVal($("#fSlido"),ep.slido_url); renderLinks();
  updateLearnFields(ep);
  if(capaEpWired!==ep.id){ capaEpWired=ep.id; wireCapa(ep); }
  { const b=$("#fPont"); if(b){ b.setAttribute("aria-checked",ep.pontuacao?"true":"false"); setPontHint(!!ep.pontuacao); } }
  renderMic(presList.length||null);
  renderHero(document.activeElement===$("#fDate") ? $("#fDate").value : ep.date);
  pzRender();
}

function markAllPhase(pid){ pzMarcarFase(pid); }
function updateProgress(){ pzRender(); }

function normUrl(v){
  v=(v||"").trim(); if(!v) return "";
  if(!/^https?:\/\//i.test(v)) v="https://"+v;
  try{ const u=new URL(v); return /\./.test(u.hostname) ? u.href : null; }catch(e){ return null; }
}
function renderLinks(){
  [["fYoutube","oYoutube","hYoutube",/youtu\.?be/i,"Este link não parece ser do YouTube."],["fSlido","oSlido","hSlido",/sli\.do|slido/i,"Este link não parece ser do Slido."]].forEach(([fi,oi,hi,re,msg])=>{
    const inp=$("#"+fi); if(!inp) return;
    const u=normUrl(inp.value), a=$("#"+oi), h=$("#"+hi);
    if(u){ a.href=u; a.setAttribute("aria-disabled","false"); } else { a.removeAttribute("href"); a.setAttribute("aria-disabled","true"); }
    h.textContent = inp.value.trim()==="" ? "" : (u===null ? "Confira o link: ele parece incompleto." : (re.test(u)?"":msg));
  });
}
let presList=[], presPending=false;
function parsePresenters(s){ return String(s||"").split(",").map(x=>x.trim()).filter(Boolean); }
let justAdded=new Set();
function renderChips(){
  const ul=$("#presChips"); if(!ul) return;
  ul.innerHTML=presList.map((n,i)=>`<li class="chip${justAdded.has(n)?" new":""}"><span>${esc(n)}</span><button type="button" data-rm="${i}" aria-label="Remover ${esc(n)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join("");
  ul.querySelectorAll("[data-rm]").forEach(b=>b.addEventListener("click",()=>{
    const prev=presList.slice(), l=presList.slice(), name=l.splice(+b.dataset.rm,1)[0], epId=selectedId;
    setPresenters(l);
    const inp=$("#fPresName"); if(inp) inp.focus();
    toastAction(name+" removido da lista.","Desfazer",()=>{
      if(selectedId===epId) setPresenters(prev);
      else queueWrite(()=>store.update(epId,{presenters:prev.join(", "),people:prev.length||null}));
    });
  }));
  ul.querySelectorAll("button").forEach(b=>b.disabled=readOnly);
}
function setPresenters(list){
  presList=list; renderChips(); renderMic(list.length||null);
  const id=selectedId; presPending=true;
  queueWrite(()=>store.update(id,{presenters:list.join(", "),people:list.length||null})).then(()=>{ presPending=false; });
}
function renderMic(n){
  const el=$("#micNote"); if(!el) return;
  el.className="mic-note";
  if(n==null||n<1){ el.textContent=""; return; }
  if(n<=2){ el.classList.add("show","ok"); el.textContent="Com "+n+(n===1?" apresentador":" apresentadores")+", os 2 microfones de lapela atendem totalmente."; }
  else if(n===3){ el.classList.add("show"); el.textContent="3 apresentadores: é possível, mas analise o perfil de voz de cada um e defina o posicionamento dos microfones antes."; }
  else { el.classList.add("show"); el.textContent=n+" apresentadores: pode dar problema se os perfis de voz forem muito diferentes. Considere conseguir mais microfones."; }
}

function renderHero(dateStr){
  const w=$("#heroWhen"), c=$("#heroCount"); if(!w) return;
  w.textContent = fmtLong(dateStr) + (parseDate(dateStr)?", 9h":"");
  const d=parseDate(dateStr);
  if(!d){ c.textContent="Defina a data do episódio."; return; }
  const start=new Date(d); start.setHours(9,0,0,0);
  const end=new Date(d); end.setHours(10,0,0,0);
  const now=new Date();
  if(now>=end){ const ep=currentEp(); c.textContent = ep&&ratingOf(ep.rating) ? "Episódio realizado." : "Episódio realizado. Falta a avaliação na pós-produção."; return; }
  if(now>=start){ c.innerHTML="<strong>No ar agora.</strong> Até as 10h."; return; }
  const ms=start-now; const days=Math.floor(ms/86400000); const hours=Math.floor(ms%86400000/3600000); const mins=Math.floor(ms%3600000/60000);
  let txt;
  if(days>=1) txt=`<strong>${days} ${days===1?"dia":"dias"} e ${hours} h</strong> até entrar no ar`;
  else if(hours>=1) txt=`<strong>${hours} h e ${mins} min</strong> até entrar no ar`;
  else txt=`<strong>${mins} min</strong> até entrar no ar`;
  c.innerHTML=txt;
}
setInterval(()=>{ const ep=currentEp(); if(ep && builtFor) renderHero(document.activeElement===$("#fDate")?$("#fDate").value:ep.date); },30000);

function applyReadOnly(){
  document.querySelectorAll("#epBody input, #epBody textarea, #epBody .pz-tile, #epBody [data-markall], #newEp, #delEp, #saveEp, #delYes, #emptyNew, #clearRate").forEach(el=>el.disabled=readOnly);
  if(readOnly) $("#modeNote").innerHTML='<p class="status warn">Modo leitura: você pode acompanhar o checklist, mas não editar.</p>';
}

/* =================== Apresentações =================== */
let SB=null, presEpId=null;
const MAX_BYTES=25*1024*1024;
const ALLOWED_HOSTS=["fonts.googleapis.com","fonts.gstatic.com","cdnjs.cloudflare.com","cdn.jsdelivr.net","cdn.tailwindcss.com","code.jquery.com"];

/* Script injected into the deck: turns commands into key presses and reports position. */
const BRIDGE = `<script>(function(){
var pos=0,total=null,codes={ArrowRight:39,ArrowLeft:37,Home:36,End:35,PageDown:34,PageUp:33};
/* 1) Apresentações com navegação própria conhecida */
var DM=null;
/* Apresentações exportadas com "deck-motion" (slides com animações em sequência).
   Cada passo da central = um clique do apresentador; as animações automáticas
   que vêm depois do clique rodam sozinhas, como na apresentação original. */
function deckMotion(){
  if(DM!==null) return DM||null;
  var el=document.getElementById('deck-motion'), slides=document.querySelectorAll('.deck-slide');
  if(!el||!slides.length){ DM=false; return null; }
  var cfg; try{ cfg=JSON.parse(el.textContent) }catch(e){ DM=false; return null; }
  var M=[],E=[],P=[],acc=0;
  for(var i=0;i<slides.length;i++){
    var st=(cfg.slides&&cfg.slides[i]&&cfg.slides[i].steps)||[{}], man=[];
    for(var j=0;j<st.length;j++) if(j===0||!st[j].auto) man.push(j);
    var fim=[]; for(var k=0;k<man.length;k++) fim.push(k+1<man.length?man[k+1]-1:st.length-1);
    M.push(man); E.push(fim); P.push(acc); acc+=man.length;
  }
  /* slide atual: o único sem "data-off" (o endereço #n nem sempre é atualizado dentro da central) */
  function slideNow(){ var on=-1,q=0; for(var k=0;k<slides.length;k++){ if(!slides[k].hasAttribute('data-off')){ on=k; q++; } }
    if(q===1) return on;
    var pg=document.querySelector('.deck-pager'), t=pg&&/^\\s*(\\d+)\\s*\\//.exec(pg.textContent||''); if(t) return +t[1]-1;
    var m=/^#(\\d+)$/.exec(location.hash); return m?Math.max(0,Math.min(slides.length-1,+m[1]-1)):Math.max(0,on); }
  /* passo atual do slide: compara o que está escondido com a lista de cada passo */
  function stepNow(i){
    var st=(cfg.slides[i]&&cfg.slides[i].steps)||[{hidden:[]}], fr=slides[i].querySelectorAll('[data-frame-id]'), h={},n=0;
    for(var k=0;k<fr.length;k++) if(fr[k].hasAttribute('data-build-hidden')){ h[fr[k].getAttribute('data-frame-id')]=1; n++; }
    var best=0,bd=1e9;
    for(var j=0;j<st.length;j++){ var hid=st[j].hidden||[],d=0,c=0; for(var q=0;q<hid.length;q++){ if(h[hid[q]]) c++; else d++; } d+=n-c; if(d<bd||(d===bd&&j>best)){ bd=d; best=j; } }
    return best;
  }
  function estado(i,j){ var man=M[i],k=0; for(var q=0;q<man.length;q++) if(man[q]<=j) k=q; return k; }
  function goSlide(i){
    try{ location.hash='#'+(i+1); }catch(e){}
    try{ window.dispatchEvent(new HashChangeEvent('hashchange')) }catch(e){}
    if(slideNow()!==i){ press('Home'); var g=0; while(slideNow()<i && g++<2000) press('ArrowRight'); }
  }
  DM={kind:'deck-motion',
    total:function(){ return acc },
    go:function(n){
      n=Math.max(0,Math.min(acc-1,n));
      var ti=0; while(ti<slides.length-1 && P[ti+1]<=n) ti++; var tk=n-P[ti];
      var ci=slideNow(), cj=stepNow(ci), ck=estado(ci,cj), atual=P[ci]+ck, k;
      if(n===atual && !window.__akiLeve) return atual;
      if(ti===ci){
        if(tk>ck){ for(k=cj;k<M[ti][tk];k++) press('ArrowRight'); }              /* para frente: as animações seguintes rodam sozinhas */
        else { for(k=cj;k>E[ti][tk];k--) press('ArrowLeft'); }                   /* para trás: mostra o clique anterior já completo */
      } else if(ti===ci+1 && tk===0 && cj===E[ci][ck] && ck===M[ci].length-1){
        press('ArrowRight');                                                      /* próximo slide com a transição normal */
      } else if(ti===ci-1 && tk===M[ti].length-1){
        for(k=cj;k>0;k--) press('ArrowLeft'); press('ArrowLeft');                 /* slide anterior, já completo */
      } else {
        goSlide(ti);
        var base=ti<ci||tk<M[ti].length-1&&false?E[ti][tk]:M[ti][tk];
        if(ti<ci) base=E[ti][tk];                                                  /* voltando: completo; avançando: anima */
        for(k=0;k<base;k++) press('ArrowRight');
      }
      if(window.__akiLeve){ var g2=0, jj=stepNow(ti), fim=E[ti][tk]; while(jj<fim && g2++<400){ press('ArrowRight'); jj=stepNow(ti); } }   /* modo leve: o clique já aparece completo */
      var fi=slideNow(); return fi===ti?n:P[fi]+estado(fi,stepNow(fi));
    }};
  return DM;
}
function api(){
  var dm=deckMotion(); if(dm) return dm;
  if(window.__ap&&typeof __ap.ir==='function'&&typeof __ap.total==='function') return {kind:'ap',total:function(){return +__ap.total()||null},go:function(n){__ap.ir(n)}};
  if(window.Reveal&&typeof Reveal.getTotalSlides==='function'&&typeof Reveal.slide==='function'){
    return {kind:'reveal',total:function(){return +Reveal.getTotalSlides()||null},go:function(n){var s=Reveal.getSlides?Reveal.getSlides():[];var el=s[n];if(el&&Reveal.getIndices){var i=Reveal.getIndices(el);Reveal.slide(i.h,i.v||0)}else Reveal.slide(n)}};
  }
  return null;
}
/* 2) Contador escrito na tela (ex.: "3 / 12") */
function readCounter(){
  var cands=document.querySelectorAll('#counter,[id*="count"],[class*="count"],[class*="page"],[class*="slide-num"],[class*="number"]');
  for(var i=0;i<cands.length;i++){var m=(cands[i].textContent||'').match(/^\\s*(\\d+)\\s*(?:\\/|de|of)\\s*(\\d+)\\s*$/);if(m)return{cur:+m[1],total:+m[2]}}
  return null;
}
/* 3) Sem contador: compara a "impressão digital" da tela antes e depois da tecla */
function finger(){var h=(location.hash||'')+'|'+window.scrollX+','+window.scrollY+'|',x=0,els=document.body?document.body.getElementsByTagName('*'):[];
  for(var i=0;i<els.length;i++){var at=els[i].attributes;for(var k=0;k<at.length;k++){var v=at[k].value;v=v.length>160?String(v.length):v;var s=at[k].name+'='+v;for(var c=0;c<s.length;c++)x=(x*31+s.charCodeAt(c))|0}}
  return h+els.length+':'+x}
function press(k){
  if(window.Reveal&&typeof Reveal.next==='function'){ if(k==='ArrowRight')return Reveal.next(); if(k==='ArrowLeft')return Reveal.prev(); }
  /* se um campo do slide ficou em foco (ex.: número digitado), a apresentação ignora as setas: tira o foco antes */
  var fa=document.activeElement;
  if(fa&&fa!==document.body&&(fa.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(fa.tagName||''))){ try{fa.blur()}catch(e){} }
  var t=document.activeElement&&document.activeElement!==document.documentElement?document.activeElement:(document.body||document);
  ['keydown','keyup'].forEach(function(type){
    var ev=new KeyboardEvent(type,{key:k,code:k,bubbles:true,cancelable:true});
    try{Object.defineProperty(ev,'keyCode',{get:function(){return codes[k]}});Object.defineProperty(ev,'which',{get:function(){return codes[k]}})}catch(e){}
    t.dispatchEvent(ev);
  });
}
/* Slides com etapas declaradas (data-steps="6"): cada "próximo" acende uma etapa antes de mudar de slide */
function dsMap(){var marc=document.querySelectorAll('[data-steps]');if(!marc.length)return null;var all=document.querySelectorAll('.slide');if(!all.length)all=document.querySelectorAll('section');if(!all.length)return null;var P=[],acc=0;for(var i=0;i<all.length;i++){P.push(acc);acc+=Math.max(1,parseInt(all[i].getAttribute('data-steps')||'1',10)||1);}return{P:P,total:acc};}
function slideInfo(c){var M=dsMap();if(M){var i=0;while(i<M.P.length-1&&M.P[i+1]<=pos)i++;var n=(i<M.P.length-1?M.P[i+1]:M.total)-M.P[i];return{slide:i+1,slides:M.P.length,etapa:pos-M.P[i]+1,etapas:n};}if(c)return{slide:c.cur,slides:c.total};return null;}
function report(){var c=readCounter();var A=api();var M=A?null:dsMap();var tot=A?A.total():(M?M.total:(total||(c?c.total:null)));var si=A?apInfo():slideInfo(c);parent.postMessage({akicastBridge:1,pos:pos,total:tot||null,info:si},'*')}
function apInfo(){try{return window.__ap&&typeof __ap.info==='function'?__ap.info():null}catch(e){return null}}
var busy=false, pending=null;
function go(n){
  n=Math.max(0,n|0);
  var A=api();
  if(A){ var t=A.total(); if(t) n=Math.min(n,t-1); var p=A.go(n); pos=(typeof p==='number')?p:n; report(); return; }
  if(busy){ pending=n; return; }
  busy=true;
  var guard=0;
  (function next(){
    if(pos===n||guard++>600){ busy=false; report(); if(pending!==null){var p=pending;pending=null;go(p)} return; }
    var dir=pos<n?'ArrowRight':'ArrowLeft', before=readCounter(), f0=finger();
    press(dir);
    setTimeout(function(){
      var after=readCounter();
      if(after){ var moved=!before||after.cur!==before.cur;
        if(moved||finger()!==f0){ pos+=(dir==='ArrowRight'?1:-1); if(pos<0)pos=0; }   /* mudou de slide ou acendeu uma etapa: sempre um passo */
        else { if(dir==='ArrowRight') total=pos+1; n=pos; } }
      else if(finger()===f0){ /* a tela não mudou: chegou ao fim (ou ao começo) */ if(dir==='ArrowRight') total=pos+1; else pos=0; n=pos; }
      else { pos+=(dir==='ArrowRight'?1:-1); if(pos<0)pos=0; }
      next();
    },40);
  })();
}
addEventListener('message',function(e){var d=e.data;if(!d||!d.akicastCmd)return;if(d.akicastCmd==='goto')go(d.n);else if(d.akicastCmd==='ping')report();});
function ready(){var A=api();var c=readCounter();var M=A?null:dsMap();if(c)pos=M?(M.P[c.cur-1]||0):c.cur-1;if(window.__akiLeve&&A&&A.kind==='deck-motion'){try{pos=A.go(pos)}catch(e){}}parent.postMessage({akicastBridge:1,ready:1,pos:pos,total:A?A.total():(M?M.total:(c?c.total:null)),info:A?apInfo():slideInfo(c)},'*')}
if(document.readyState==='complete')setTimeout(ready,120);else addEventListener('load',function(){setTimeout(ready,120)});
})();<\/script>`;

/* Runs first: history changes are not allowed inside the embedded copy, so make them harmless. */
const PRELUDE = `<script>(function(){['replaceState','pushState'].forEach(function(m){var o=history[m];history[m]=function(){try{return o.apply(history,arguments)}catch(e){}}})})();<\/script>`;
/* Modo leve: sem animações nem transições; os slides entram prontos */
const LEVE = `<script>window.__akiLeve=true;(function(){var mm=window.matchMedia;window.matchMedia=function(q){if(/prefers-reduced-motion\\s*:\\s*reduce/.test(q))return{matches:true,media:q,onchange:null,addListener:function(){},removeListener:function(){},addEventListener:function(){},removeEventListener:function(){},dispatchEvent:function(){return false}};return mm.call(window,q)};try{Element.prototype.animate=function(){return{finished:Promise.resolve(),ready:Promise.resolve(),cancel:function(){},finish:function(){},play:function(){},pause:function(){},reverse:function(){},addEventListener:function(){},removeEventListener:function(){}}}}catch(e){}})();<\/script><style>*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important;scroll-behavior:auto!important}</style>`;
/* =================== Enquete conectada =================== */
/* Acha as enquetes do HTML. Roda no navegador (prévia) e dentro da apresentação (ponte), por isso não usa nada de fora.
   Padrão marcado: data-aki-enquete (container), data-aki-opcao (cada opção), data-aki-texto, data-aki-votos, data-aki-barra, data-aki-total, data-aki-manual.
   Sem marcação: reconhece blocos "poll"/"enquete"/"votacao" com linhas que têm barra e número. */
function akiAcharEnquetes(doc){
  var out=[];
  function txt(e){ return ((e&&e.textContent)||'').replace(/\s+/g,' ').trim(); }
  function ehNum(e){ return /^\d+([.,]\d+)?\s*%?$/.test(txt(e)); }
  function folhas(e){ var r=[],a=e.querySelectorAll('*'); for(var i=0;i<a.length;i++) if(!a[i].children.length) r.push(a[i]); return r; }
  function emNota(e){ return !!(e.closest&&e.closest('aside,.notes,[class*="note" i],script,style,template')); }
  function slideDe(c){ return c.closest('section,.slide,[class*="slide" i]')||doc.body; }
  function pergDe(c,sl){ var p=sl.querySelector('[data-aki-pergunta]'); if(p) return txt(p); var h=sl.querySelectorAll('h1,h2,h3,h4'); for(var i=0;i<h.length;i++) if(!c.contains(h[i])&&!emNota(h[i])) return txt(h[i]); return ''; }
  function totalDe(c,sl){ var t=sl.querySelector('[data-aki-total]'); if(t) return t; var a=sl.querySelectorAll('[id*="total" i],[class*="total" i]'); for(var i=0;i<a.length;i++) if(!c.contains(a[i])&&!emNota(a[i])&&ehNum(a[i])) return a[i]; return null; }
  function manuaisDe(c,sl,marcado){
    var r=[].slice.call(sl.querySelectorAll('[data-aki-manual]'));
    if(marcado) return r;
    var b=sl.querySelectorAll('button'); for(var i=0;i<b.length;i++) if(!c.contains(b[i])&&!emNota(b[i])&&/zerar|resetar|reset|limpar|apagar/i.test(txt(b[i]))) r.push(b[i]);
    var f=folhas(sl); for(var j=0;j<f.length;j++){ var t=txt(f[j]); if(!c.contains(f[j])&&!emNota(f[j])&&t.length<140&&/clique|teclas|tecla |shift/i.test(t)) r.push(f[j]); }
    return r;
  }
  function rotulo(r){ var l=r.querySelector('[data-aki-texto],[class*="label" i],[class*="texto" i],[class*="nome" i],[class*="opt" i]'); if(l) return txt(l);
    var f=folhas(r),best=''; for(var i=0;i<f.length;i++){ var t=txt(f[i]); if(!ehNum(f[i])&&t.length>best.length) best=t; } return best; }
  function numDe(r){ var f=folhas(r),n=null; for(var i=0;i<f.length;i++) if(ehNum(f[i])) n=f[i]; return n; }
  function barraDe(r){ return r.querySelector('[class*="bar" i],[class*="fill" i],[class*="progress" i]'); }
  var marc=doc.querySelectorAll('[data-aki-enquete]');
  for(var i=0;i<marc.length;i++){
    var c=marc[i], sl=slideDe(c), ops=c.querySelectorAll('[data-aki-opcao]'), o=[];
    for(var k=0;k<ops.length;k++){ var r=ops[k]; o.push({el:r,label:txt(r.querySelector('[data-aki-texto]'))||rotulo(r),num:r.querySelector('[data-aki-votos]'),bar:r.querySelector('[data-aki-barra]')}); }
    if(o.length>=2) out.push({el:c,slide:sl,pergunta:c.getAttribute('data-aki-enquete')||pergDe(c,sl),opcoes:o,total:totalDe(c,sl),manuais:manuaisDe(c,sl,true)});
  }
  if(out.length) return out;
  var cand=doc.querySelectorAll('[id*="poll" i],[class*="poll" i],[id*="enquete" i],[class*="enquete" i],[id*="votac" i],[class*="votac" i]');
  for(var q=0;q<cand.length;q++){
    var cc=cand[q], ja=false;
    for(var u=0;u<out.length;u++) if(out[u].el.contains(cc)||cc.contains(out[u].el)) ja=true;
    if(ja||emNota(cc)) continue;
    var rows=[].filter.call(cc.children,function(r){ return barraDe(r)&&numDe(r); });
    if(rows.length<2) continue;
    var sl2=slideDe(cc);
    out.push({el:cc,slide:sl2,pergunta:pergDe(cc,sl2),opcoes:rows.map(function(r){ return {el:r,label:rotulo(r),num:numDe(r),bar:barraDe(r)}; }),total:totalDe(cc,sl2),manuais:manuaisDe(cc,sl2,false)});
  }
  return out;
}
/* Dentro da apresentação: recebe as porcentagens da central e desenha na enquete do slide. */
function akiEnqueteBridge(achar){
  var E=null, vals={}, lider={}, aplicando=false, obs=null, ligada=false;
  function classeLider(e){
    var rc=e.opcoes[0]&&e.opcoes[0].el.classList, found=null; if(!rc) return 'aki-lider';
    for(var s=0;s<document.styleSheets.length&&!found;s++){ var rules; try{ rules=document.styleSheets[s].cssRules||[]; }catch(err){ continue; }
      for(var r=0;r<rules.length&&!found;r++){ var sel=rules[r].selectorText||'';
        for(var k=0;k<rc.length&&!found;k++){ var re=new RegExp('\\.'+rc[k].replace(/[^\w-]/g,'')+'\\.([\\w-]+)','g'), m;
          while((m=re.exec(sel))){ if(/lead|lider|top|win|venc|destaque|max|first/i.test(m[1])){ found=m[1]; break; } } } } }
    return found||'aki-lider';
  }
  function init(){
    if(E) return E;
    try{ E=achar(document); }catch(err){ E=[]; }
    E.forEach(function(e,i){ lider[i]=classeLider(e); });
    try{ obs=new MutationObserver(function(){ if(aplicando) return; Object.keys(vals).forEach(function(i){ aplicar(+i); }); });
      E.forEach(function(e){ obs.observe(e.el,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style','class']}); if(e.total) obs.observe(e.total,{subtree:true,childList:true,characterData:true}); }); }catch(err){}
    return E;
  }
  function aplicar(i){
    var e=E&&E[i], v=vals[i]; if(!e||!v) return;
    aplicando=true;
    try{
      var pct=e.opcoes.map(function(o,k){ return +(v.pct&&v.pct[k])||0; }), max=Math.max.apply(null,pct.concat([1])), top=Math.max.apply(null,pct);
      e.opcoes.forEach(function(o,k){
        if(o.bar){ o.bar.style.width=(pct[k]/max*100)+'%'; try{ if(getComputedStyle(o.bar).display==='inline') o.bar.style.display='block'; }catch(err){} }
        if(o.num) o.num.textContent=pct[k]+'%';
        o.el.classList.toggle(lider[i],top>0&&pct[k]===top);
        o.el.style.cursor='default';
      });
      if(e.total){ var t=e.total, p=t.parentElement, alvo=(p&&p!==e.slide&&p!==e.el&&/^\s*\d+\s*[^\d\s]+\s*$/.test(p.textContent||''))?p:t; alvo.style.visibility='hidden'; }
      e.manuais.forEach(function(m){ m.style.visibility='hidden'; });
      e.el.setAttribute('data-aki-conectada','1');
    }catch(err){}
    if(obs) obs.takeRecords();
    aplicando=false;
  }
  function dentro(t){ if(!E||!t) return false; for(var i in vals){ var e=E[i]; if(!e) continue; if(e.el.contains(t)) return true; for(var k=0;k<e.manuais.length;k++) if(e.manuais[k].contains(t)) return true; } return false; }
  ['click','pointerdown','mousedown','touchstart'].forEach(function(ev){ addEventListener(ev,function(x){ if(ligada&&dentro(x.target)){ x.stopImmediatePropagation(); if(ev!=='touchstart') x.preventDefault(); } },{capture:true,passive:ev==='touchstart'}); });
  addEventListener('keydown',function(x){ if(ligada&&/^[0-9]$/.test(x.key||'')&&!(x.target&&/INPUT|TEXTAREA|SELECT/.test(x.target.tagName||''))){ x.stopImmediatePropagation(); x.preventDefault(); } },true);
  addEventListener('message',function(m){ var d=m.data; if(d&&d.akicastCmd==='ping'){ try{ parent.postMessage({akicastPong:d.n},'*'); }catch(err){} } });
  addEventListener('message',function(m){ var d=m.data; if(!d||d.akicastCmd!=='enquete') return; init(); (d.lista||[]).forEach(function(x){ if(x&&E[x.i]){ vals[x.i]=x; ligada=true; aplicar(x.i); } }); });
  /* Qual enquete está na tela agora (para a sala oferecer abrir a votação) */
  function visivel(e){
    var el=e.el, r=el.getBoundingClientRect();
    if(r.width<4||r.height<4||r.bottom<=0||r.right<=0||r.top>=innerHeight||r.left>=innerWidth) return false;
    var n=el, op=1;
    while(n&&n.nodeType===1){ var cs=getComputedStyle(n); if(cs.display==='none'||cs.visibility==='hidden') return false; op*=parseFloat(cs.opacity||'1'); n=n.parentElement; }
    if(op<0.35) return false;
    var cx=Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)), cy=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)), h=document.elementFromPoint(cx,cy);
    if(h&&!el.contains(h)&&!(e.slide&&e.slide.contains(h))){ var hs=h.closest&&h.closest('section,.slide,[class*="slide" i]'); if(hs&&hs!==e.slide&&!hs.contains(e.slide)) return false; }
    return true;
  }
  var ultimoVis=null;
  function verificar(){ init(); if(!E.length) return; var v=[]; E.forEach(function(e,i){ try{ if(visivel(e)) v.push(i); }catch(err){} }); var k=v.join(','); if(k!==ultimoVis){ ultimoVis=k; try{ parent.postMessage({akicastEnqVis:v},'*'); }catch(err){} } }
  setTimeout(function(){ verificar(); setInterval(verificar,500); },400);
}
/* Dentro da apresentação: acha os campos de digitar, avisa quais estão na tela e recebe os valores da central. */
function akiCamposBridge(){
  var LISTA=null, ultimo=null;
  var PULA=['hidden','file','button','submit','reset','checkbox','radio','range','color','image'];
  function txt(e){ return ((e&&e.textContent)||'').replace(/\s+/g,' ').trim(); }
  function chave(el,i){ return el.getAttribute('data-num')||el.getAttribute('data-campo')||el.getAttribute('name')||el.id||('campo-'+i); }
  function rotulo(el){
    var a=el.getAttribute('aria-label'); if(a) return a;
    if(el.id){ var l=document.querySelector('label[for="'+el.id+'"]'); if(l&&txt(l)) return txt(l); }
    var p=el.closest('label'); if(p&&txt(p)) return txt(p);
    var b=el.parentElement, t='';
    for(var g=0;b&&g<3&&!t;g++,b=b.parentElement){ t=txt(b); }
    return (t||el.getAttribute('placeholder')||'Campo').slice(0,80);
  }
  function achar(){
    if(LISTA) return LISTA;
    LISTA=[];
    var els=document.querySelectorAll('input,textarea,select'), n=0;
    for(var i=0;i<els.length;i++){
      var el=els[i], ty=(el.getAttribute('type')||'text').toLowerCase();
      if(el.tagName==='INPUT'&&PULA.indexOf(ty)>=0) continue;
      if(el.closest('aside,.notes,#notesPanel,[class*="note" i],template')) continue;
      LISTA.push({el:el,k:chave(el,n),rotulo:rotulo(el),ph:el.getAttribute('placeholder')||''}); n++;
    }
    return LISTA;
  }
  function visivel(el){
    var r=el.getBoundingClientRect();
    if(r.width<2||r.height<2||r.bottom<=0||r.right<=0||r.top>=innerHeight||r.left>=innerWidth) return false;
    /* campos esmaecidos de etapas ainda não acesas contam: só a opacidade do slide em si decide */
    var sl=el.closest('section,.slide,[class*="slide" i]')||el, n=el, op=1, noSlide=false;
    while(n&&n.nodeType===1){ var cs=getComputedStyle(n); if(cs.display==='none'||cs.visibility==='hidden') return false; if(n===sl) noSlide=true; if(noSlide) op*=parseFloat(cs.opacity||'1'); n=n.parentElement; }
    return op>=0.35;
  }
  function verificar(){
    var L=achar(); if(!L.length) return;
    var v=[]; L.forEach(function(c){ try{ if(visivel(c.el)) v.push({k:c.k,rotulo:c.rotulo,ph:c.ph,valor:c.el.value}); }catch(e){} });
    var key=v.map(function(x){return x.k}).join('|');
    if(key!==ultimo){ ultimo=key; try{ parent.postMessage({akicastCamposVis:v},'*'); }catch(e){} }
  }
  function aplicar(vals){
    achar().forEach(function(c){
      if(!Object.prototype.hasOwnProperty.call(vals,c.k)) return;
      var v=vals[c.k]==null?'':String(vals[c.k]); if(c.el.value===v) return;
      c.el.value=v;
      try{ c.el.dispatchEvent(new Event('input',{bubbles:true})); c.el.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
    });
  }
  addEventListener('message',function(m){ var d=m.data; if(d&&d.akicastCmd==='campos') aplicar(d.valores||{}); });
  setTimeout(function(){ verificar(); setInterval(verificar,600); },500);
}
/* Dentro da apresentação: elementos clicáveis do slide (cartões que viram, abas, botões).
   A central aciona pelo painel "Ações deste slide"; todas as telas recebem o mesmo estado (ligado/desligado). */
function akiAcoesBridge(){
  var LISTA=null, ultimo=null, desejado={};
  var FORA=/\b(zerar|resetar|reset|limpar|editar|tema|imprimir)\b|edição|trocar v[ií]deo|tela cheia/i;
  function txt(e){ return ((e&&e.textContent)||'').replace(/\s+/g,' ').trim(); }
  function estado(el){ return (el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className||'')+'|'+(el.getAttribute('aria-pressed')||'')+'|'+(el.getAttribute('aria-expanded')||''); }
  function nome(el){
    var a=el.getAttribute('data-aki-acao')||el.getAttribute('aria-label')||'';
    var t=el.querySelector('.q,.title,.titulo,h1,h2,h3,h4,strong,b');
    var d=t?txt(t):txt(el).replace(/clique para[^.]*\.?/i,'').trim();
    d=d.slice(0,70);
    if(a&&d&&a.indexOf(d)<0) return a+' · '+d;
    return a||d||'Ação';
  }
  function achar(){
    if(LISTA) return LISTA; LISTA=[];
    var slides=[].slice.call(document.querySelectorAll('.slide')); if(!slides.length) slides=[].slice.call(document.querySelectorAll('section'));
    var cand=document.querySelectorAll('[data-aki-acao],[role="button"],button,[tabindex]');
    var porSlide={};
    for(var i=0;i<cand.length;i++){
      var el=cand[i];
      if(/^(INPUT|TEXTAREA|SELECT|A)$/.test(el.tagName)) continue;
      if(el.getAttribute('tabindex')==='-1'&&!el.hasAttribute('data-aki-acao')) continue;
      var sl=el.closest('.slide')||el.closest('section'); if(!sl) continue;               /* só o que está dentro dos slides */
      if(el.closest('aside,.notes,[data-video],.video-drop,[data-aki-enquete],[data-aki-conectada],template')) continue;
      if(!el.hasAttribute('data-aki-acao')&&FORA.test(txt(el)+' '+(el.getAttribute('aria-label')||''))) continue;
      var dentro=false; for(var j=0;j<LISTA.length;j++){ if(LISTA[j].el.contains(el)){ dentro=true; break; } } if(dentro) continue;
      var si=slides.indexOf(sl)+1; porSlide[si]=(porSlide[si]||0)+1;
      var k=el.getAttribute('data-aki-acao-id')||el.id||('s'+si+'-'+porSlide[si]);
      LISTA.push({el:el,k:k,nome:nome(el),inicial:estado(el)});
    }
    return LISTA;
  }
  function ligado(c){ return estado(c.el)!==c.inicial; }
  function visivel(el){
    var r=el.getBoundingClientRect(); if(r.width<4||r.height<4||r.bottom<=0||r.right<=0||r.top>=innerHeight||r.left>=innerWidth) return false;
    var sl=el.closest('section,.slide')||el, n=el, op=1, noSlide=false;
    while(n&&n.nodeType===1){ var cs=getComputedStyle(n); if(cs.display==='none'||cs.visibility==='hidden') return false; if(n===sl) noSlide=true; if(noSlide) op*=parseFloat(cs.opacity||'1'); n=n.parentElement; }
    return op>=0.35;
  }
  function verificar(){
    var L=achar(); if(!L.length) return;
    var v=[]; L.forEach(function(c){ try{ if(visivel(c.el)) v.push({k:c.k,nome:c.nome,on:ligado(c)}); }catch(e){} });
    var key=JSON.stringify(v); if(key!==ultimo){ ultimo=key; try{ parent.postMessage({akicastAcoesVis:v},'*'); }catch(e){} }
  }
  function aplicar(){
    achar().forEach(function(c){
      if(!Object.prototype.hasOwnProperty.call(desejado,c.k)) return;
      var quer=!!desejado[c.k];
      if(ligado(c)!==quer){ try{ c.el.click(); }catch(e){} }
    });
    setTimeout(verificar,60);
  }
  addEventListener('message',function(m){ var d=m.data; if(d&&d.akicastCmd==='acoes'){ desejado=d.estados||{}; aplicar(); } });
  setTimeout(function(){ verificar(); setInterval(verificar,500); },550);
}
/* Áreas de vídeo da apresentação (data-video ou .video-drop). Roda na central (prévia) e dentro da apresentação. */
function akiAcharVideos(doc){
  var zonas=[].slice.call(doc.querySelectorAll('[data-video],.video-drop'));
  zonas=zonas.filter(function(z){ for(var p=z.parentElement;p;p=p.parentElement){ if(zonas.indexOf(p)>=0) return false; } return !(z.closest&&z.closest('aside,.notes,template')); });
  var slides=[].slice.call(doc.querySelectorAll('.slide')); if(!slides.length) slides=[].slice.call(doc.querySelectorAll('section'));
  var usadas={}, out=[];
  zonas.forEach(function(z){
    var sl=z.closest('.slide')||z.closest('section'), idx=sl?slides.indexOf(sl)+1:0;
    var base=(z.getAttribute('data-video')||'').trim()||(sl&&sl.getAttribute('data-id'))||('slide-'+idx);
    base=base.replace(/[^a-zA-Z0-9_-]+/g,'-').slice(0,40)||'video';
    var k=base; usadas[k]=(usadas[k]||0)+1; if(usadas[k]>1) k=base+'-'+usadas[k];
    out.push({el:z,k:k,slide:idx,nome:(sl&&sl.getAttribute('data-id'))||''});
  });
  return out;
}
/* Dentro da apresentação: coloca os vídeos nas áreas, obedece Play/Pausar e avisa o estado */
function akiVideoBridge(achar){
  var Z=null, mudo=true, ultimoVis=null, ultimoEnvio={};
  function zonas(){ if(!Z){ try{ Z=achar(document); }catch(e){ Z=[]; } } return Z; }
  function video(z){ return z.el.querySelector('video[data-aki]'); }
  function visivel(el){
    var r=el.getBoundingClientRect(); if(r.width<4||r.height<4||r.bottom<=0||r.right<=0||r.top>=innerHeight||r.left>=innerWidth) return false;
    var n=el, op=1; while(n&&n.nodeType===1){ var cs=getComputedStyle(n); if(cs.display==='none'||cs.visibility==='hidden') return false; op*=parseFloat(cs.opacity||'1'); n=n.parentElement; }
    return op>=0.35;
  }
  function relatar(z,forca){
    var v=video(z); if(!v) return;
    var e={k:z.k,t:Math.round((v.currentTime||0)*10)/10,dur:isFinite(v.duration)?Math.round(v.duration*10)/10:null,tocando:!v.paused&&!v.ended,fim:!!v.ended};
    var sg=JSON.stringify(e), agora=Date.now(), u=ultimoEnvio[z.k]||{};
    if(!forca&&u.sg===sg) return; if(!forca&&e.tocando&&u.em&&agora-u.em<900) return;
    ultimoEnvio[z.k]={sg:sg,em:agora};
    try{ parent.postMessage({akicastVideo:e},'*'); }catch(err){}
  }
  function colocar(urls){
    zonas().forEach(function(z){
      var url=urls[z.k], v=video(z);
      if(!url){ if(v){ v.remove(); z.el.classList.remove('has-video'); } return; }
      if(v&&v.getAttribute('data-src')===url) return;
      if(v) v.remove();
      [].slice.call(z.el.querySelectorAll('video')).forEach(function(o){ o.remove(); });
      v=document.createElement('video'); v.setAttribute('data-aki','1'); v.setAttribute('data-src',url);
      v.src=url; v.preload='auto'; v.playsInline=true; v.controls=false; v.muted=mudo;
      v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000';
      ['play','pause','ended','loadedmetadata','seeked'].forEach(function(ev){ v.addEventListener(ev,function(){ relatar(z,true); }); });
      v.addEventListener('timeupdate',function(){ relatar(z,false); });
      z.el.appendChild(v); z.el.classList.add('has-video');
      [].slice.call(z.el.querySelectorAll('.swap-btn,input[type=file]')).forEach(function(b){ b.style.display='none'; });
    });
  }
  function comando(d){
    zonas().forEach(function(z){
      if(z.k!==d.k) return; var v=video(z); if(!v) return;
      if(typeof d.t==='number'&&Math.abs((v.currentTime||0)-d.t)>0.6){ try{ v.currentTime=d.t; }catch(e){} }
      if(d.acao==='play'){ var p=v.play(); if(p&&p.catch) p.catch(function(){ v.muted=true; try{ parent.postMessage({akicastVideo:{k:z.k,bloqueado:true}},'*'); }catch(e){} v.play().catch(function(){}); }); }
      else if(d.acao==='pause'){ v.pause(); }
      else if(d.acao==='inicio'){ v.pause(); try{ v.currentTime=0; }catch(e){} }
      relatar(z,true);
    });
  }
  function verificar(){
    var L=zonas(); if(!L.length) return;
    var vis=[];
    L.forEach(function(z){
      var ok=false; try{ ok=visivel(z.el); }catch(e){}
      var v=video(z);
      if(ok) vis.push({k:z.k,slide:z.slide,nome:z.nome,tem:!!v});
      else if(v&&!v.paused){ v.pause(); }      /* passou o slide: o vídeo para */
    });
    var key=JSON.stringify(vis);
    if(key!==ultimoVis){ ultimoVis=key; try{ parent.postMessage({akicastVideoVis:vis},'*'); }catch(e){} }
  }
  addEventListener('message',function(m){
    var d=m.data; if(!d) return;
    if(d.akicastCmd==='videos'){ mudo=d.mudo!==false; colocar(d.urls||{}); zonas().forEach(function(z){ var v=video(z); if(v) v.muted=mudo; }); verificar(); }
    else if(d.akicastCmd==='video'){ comando(d); }
    else if(d.akicastCmd==='somLiberado'){ zonas().forEach(function(z){ var v=video(z); if(v&&!mudo) v.muted=false; }); }
  });
  setTimeout(function(){ verificar(); setInterval(verificar,500); },450);
}
const ENQ_BRIDGE="<script>("+akiEnqueteBridge.toString()+")("+akiAcharEnquetes.toString()+");("+akiCamposBridge.toString()+")();("+akiVideoBridge.toString()+")("+akiAcharVideos.toString()+");("+akiAcoesBridge.toString()+")();<\/script><style>[data-aki-conectada] .aki-lider{font-weight:700}</style>";
/* =================== Vídeos da apresentação ===================
   A apresentação marca onde vão os vídeos (data-video). A produção ou o apresentador envia cada vídeo na aba
   Apresentações (ou na página de envio). Na live, sala e controle têm Play / Pausar / Voltar ao início;
   só a tela do OBS toca com som (as outras ficam no mudo). Passar o slide para o vídeo. */
function videosDoHtml(html){
  try{ const d=new DOMParser().parseFromString(html,"text/html"); return akiAcharVideos(d).map(z=>({k:z.k,slide:z.slide,nome:z.nome})); }
  catch(e){ return []; }
}
const videoRotulo=z=>`Slide ${z.slide||"?"}${z.nome?" · "+z.nome:""}`;
const VID_URL={};
async function videoUrls(meta){
  const out={}, vs=(meta&&meta.videos)||{}, agora=Date.now();
  for(const k of Object.keys(vs)){
    const v=vs[k]; if(!v||!v.path) continue;
    const c=VID_URL[v.path]; if(c&&c.ate>agora+3600e3){ out[k]=c.url; continue; }
    const {data,error}=await SB.storage.from("decks").createSignedUrl(v.path,43200);
    if(!error&&data&&data.signedUrl){ VID_URL[v.path]={url:data.signedUrl,ate:agora+43200e3}; out[k]=data.signedUrl; }
  }
  return out;
}
async function uploadVideo(epId,chave,file,source){
  const ehVideo=/^video\//.test(file.type||"")||/\.(mp4|webm|mov|m4v)$/i.test(file.name||"");
  if(!ehVideo) throw {code:"not_video"};
  if(file.size>50*1024*1024) throw {code:"too_big"};
  const meta=await fetchDeckMeta(epId); if(!meta) throw {code:"sem_deck"};
  const version=Date.now(), ext=((file.name||"").match(/\.([a-z0-9]+)$/i)||[0,"mp4"])[1].toLowerCase();
  const pelo=!!(K_LINK&&source==="apresentador");
  const path=(pelo?epId+"/"+K_LINK:epId)+"/videos/"+chave+"-"+version+"."+ext;
  const tipo=file.type||(ext==="webm"?"video/webm":ext==="mov"?"video/quicktime":"video/mp4");
  const {error:u1}=await SB.storage.from("decks").upload(path,file,{upsert:false,contentType:tipo});
  if(u1) throw (/mime|type|size|exceed/i.test(u1.message||"")?{message:"o armazenamento recusou o vídeo; rode o int-videos.sql no Supabase"}:u1);
  const info={path,name:file.name,size:file.size,version,source:source||"equipe",tipo};
  const {error}=await SB.rpc("int_video_salvar",{p_episode:epId,p_k:pelo?K_LINK:null,p_chave:chave,p_info:info});
  if(error) throw (/int_video_salvar|function|schema|videos/i.test(error.message||"")?{message:"falta rodar o int-videos.sql no Supabase"}:error);
  const velho=meta.videos&&meta.videos[chave];
  if(!pelo&&velho&&velho.path&&velho.path!==path){ try{ await SB.storage.from("decks").remove([velho.path]); }catch(e){} }
  return info;
}
async function removerVideo(epId,chave){
  const meta=await fetchDeckMeta(epId); const v=meta&&meta.videos&&meta.videos[chave];
  const {error}=await SB.rpc("int_video_salvar",{p_episode:epId,p_k:null,p_chave:chave,p_info:null});
  if(error) throw error;
  if(v&&v.path){ try{ await SB.storage.from("decks").remove([v.path]); }catch(e){} }
}
/* Cartão "Vídeos da apresentação" (aba Apresentações e página do apresentador) */
function renderVideoCard(box,epId,meta,html,source){
  if(!box) return;
  const zonas=videosDoHtml(html);
  if(!zonas.length||isPdfName(meta.name)){ box.innerHTML=""; return; }
  const ap=source==="apresentador", vs=meta.videos||{};
  box.innerHTML=`<div class="pres-card vid-card"><h2>Vídeos da apresentação</h2>
    <p class="meta">${zonas.length===1?"Esta apresentação tem uma área de vídeo.":"Esta apresentação tem "+zonas.length+" áreas de vídeo."} Envie um vídeo para cada uma (MP4, até 50 MB). Na live, quem dá Play é o apresentador ou a produção, e o som sai pela tela do OBS.</p>
    ${zonas.map(z=>{ const v=vs[z.k]; return `<div class="vid-item${v?" on":""}">
      <div class="vid-tx"><b>${esc(videoRotulo(z))}</b>${v?`<span class="meta">${esc(v.name||"vídeo")} · ${fmtBytes(v.size||0)}${!ap&&v.source==="apresentador"?' <span class="src-tag">pelo apresentador</span>':""}</span>`:'<span class="meta">Nenhum vídeo enviado.</span>'}</div>
      <div class="vid-bt"><label class="btn ${v?"ghost":"primary"} sm" style="position:relative">${v?"Trocar":"Enviar vídeo"}<input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v" data-vid-in="${esc(z.k)}" style="position:absolute;opacity:0;width:1px;height:1px"></label>
      ${v&&!ap?`<button class="linkbtn" type="button" data-vid-rm="${esc(z.k)}">Remover</button>`:""}</div>
      <div class="progress-up" data-vid-prog="${esc(z.k)}" hidden><i style="width:60%"></i></div></div>`; }).join("")}
  </div>`;
  box.querySelectorAll("[data-vid-in]").forEach(inp=>inp.addEventListener("change",async()=>{
    const f=inp.files[0]; if(!f) return; const k=inp.dataset.vidIn, pr=box.querySelector(`[data-vid-prog="${k}"]`);
    pr.hidden=false; toast("Enviando o vídeo…");
    try{ await uploadVideo(epId,k,f,source); toast("Vídeo enviado."); }
    catch(e){
      if(e&&e.code==="not_video") toast("Escolha um arquivo de vídeo (MP4 ou WebM).");
      else if(e&&e.code==="too_big") toast("O vídeo passa de 50 MB. Exporte em 720p para ficar menor.");
      else if(e&&e.code==="sem_deck") toast("Envie a apresentação antes dos vídeos.");
      else toast("Não foi possível enviar o vídeo"+(e&&e.message?": "+e.message:".")); }
    finally{ pr.hidden=true; inp.value=""; }
  }));
  box.querySelectorAll("[data-vid-rm]").forEach(b=>b.addEventListener("click",async()=>{ if(!confirmInline(b,"Remover de vez?")) return; try{ await removerVideo(epId,b.dataset.vidRm); toast("Vídeo removido."); }catch(e){ handleErr(e); } }));
}
/* ---------- Na live ---------- */
async function videosAplicar(L){
  if(live!==L||!L.meta) return;
  const urls=L.usingReserva?{}:await videoUrls(L.meta).catch(()=>({}));
  if(live!==L) return;
  L.videoUrls=urls;
  liveFrames().forEach(f=>f.setVideos(urls,!(L.mode==="display")));
}
const fmtTempo=s=>{ s=Math.max(0,Math.floor(s||0)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
function videoCmd(acao,k){
  const L=live; if(!L||!(L.mode==="sala"||L.mode==="controller")) return;
  const e=videoEstado(L,k);
  const p={k,acao,t:acao==="inicio"?0:(e&&typeof e.t==="number"?e.t:0),at:Date.now()};
  if(acao==="play"&&e&&e.fim) p.t=0;
  if(acao==="pause") delete p.t;   // pausar não mexe na posição (o tempo informado pode estar meio segundo atrasado)
  L.chan&&L.chan.sendVideo(p);
  liveFrames().forEach(f=>f.postVideo(p));
}
function videoEstado(L,k){
  const r=L.videoRemoto&&L.videoRemoto[k], l=L.videoLocal&&L.videoLocal[k];
  if(r&&Date.now()-r.em<4000) return r;   // o que a tela do OBS informou por último
  return l||r||null;
}
function videoPainel(){
  const L=live;
  const box=document.querySelector(L&&L.mode==="sala"?"#salaVideo":"#ctrlVideo");
  ["#salaVideo","#ctrlVideo"].forEach(s=>{ const b=$(s); if(b&&b!==box){ b.hidden=true; b.innerHTML=""; } });
  if(!box) return;
  const vis=(L&&(L.mode==="sala"||L.mode==="controller")&&!L.usingReserva&&L.cur&&L.cur.videoVis)||[];
  if(!vis.length){ box.hidden=true; box.innerHTML=""; box.dataset.chave=""; return; }
  box.hidden=false;
  const chave=JSON.stringify(vis);
  if(box.dataset.chave!==chave){
    box.dataset.chave=chave;
    box.innerHTML=vis.map(z=>`<div class="vid-ctrl" data-vk="${esc(z.k)}">
      <div class="vid-ctrl-h"><b>Vídeo deste slide</b><span class="meta" data-vt>${z.tem?"":"Nenhum vídeo enviado para esta área"}</span></div>
      ${z.tem?`<div class="vid-bar"><i data-vbar></i></div>
      <div class="vid-ctrl-bt"><button class="btn primary sm" type="button" data-vplay>Play</button><button class="btn ghost sm" type="button" data-vinicio>Voltar ao início</button></div>
      <span class="meta vid-som" data-vsom></span>`:""}
    </div>`).join("");
    box.querySelectorAll("[data-vk]").forEach(el=>{
      const k=el.dataset.vk;
      const pl=el.querySelector("[data-vplay]"); if(pl) pl.addEventListener("click",()=>{ const e=videoEstado(live,k); videoCmd(e&&e.tocando?"pause":"play",k); });
      const ini=el.querySelector("[data-vinicio]"); if(ini) ini.addEventListener("click",()=>videoCmd("inicio",k));
    });
  }
  box.querySelectorAll("[data-vk]").forEach(el=>{
    const k=el.dataset.vk, e=videoEstado(L,k)||{}, pl=el.querySelector("[data-vplay]"); if(!pl) return;
    pl.textContent=e.tocando?"Pausar":(e.fim?"Ver de novo":"Play");
    el.querySelector("[data-vt]").textContent=e.dur?`${fmtTempo(e.t)} de ${fmtTempo(e.dur)}`:"";
    const bar=el.querySelector("[data-vbar]"); if(bar) bar.style.width=e.dur?Math.min(100,(e.t/e.dur)*100)+"%":"0%";
    const r=L.videoRemoto&&L.videoRemoto[k], obs=(L.peers||[]).some(p=>p&&p.mode==="display");
    el.querySelector("[data-vsom]").textContent = !obs ? "A tela de exibição não está aberta: o vídeo não vai para a transmissão." : (r&&r.bloqueado ? "O navegador da tela de exibição bloqueou o som: clique uma vez nela para liberar." : "O som sai pela tela do OBS.");
  });
}
/* Tela de exibição: se o navegador bloquear o som, pede um clique */
function videoSomBloqueado(){
  if(document.getElementById("vidSom")) return;
  const b=document.createElement("button"); b.id="vidSom"; b.type="button"; b.className="vid-som-btn"; b.textContent="Clique para ativar o som do vídeo";
  b.addEventListener("click",()=>{ b.remove(); if(live) liveFrames().forEach(f=>{ try{ f.iframe.contentWindow.postMessage({akicastCmd:"somLiberado"},"*"); }catch(e){} if(f.ultimoVideo) f.postVideo(f.ultimoVideo); }); });
  document.body.appendChild(b);
}
/* =================== Tela do apresentador (VDO.Ninja) ===================
   A interface é toda da central: o botão chama a escolha de janela do navegador e o kit oficial do VDO.Ninja
   (@vdoninja/sdk) só transporta a imagem. A sala vê a prévia e decide quando mostrar no ar; a tela de exibição
   troca os slides pela tela compartilhada. Também há o link fixo ?tela=atual, para uma cena própria no OBS. */
const VDO_CFG=window.AKICAST_CONFIG||{};
const VDO_HOST=(VDO_CFG.vdoHost||"wss://apibackup.vdo.ninja");          // sinalização usada pelo kit
const VDO_VIEW=(VDO_CFG.vdoViewBase||"https://vdo.ninja/alpha/").replace(/\/?$/,"/");   // página que recebe a imagem
const VDO_SDK="https://cdn.jsdelivr.net/npm/@vdoninja/sdk@1.6.2/vdoninja-sdk.min.js";
const VDO_STREAM="tela";
/* Qualidade da tela (escolhida pela produção em cada episódio).
   Para textos e menus nítidos: resolução travada em Full HD, taxa de bits alta e a dica "detalhe" ao navegador,
   que passa a baixar os quadros por segundo antes de borrar a imagem. */
const TELA_Q={
  leve:  {nome:"Leve",   codec:"h264",kbps:2500,fps:30,dica:"Para internet fraca. Pode borrar letras pequenas."},
  nitida:{nome:"Nítida", codec:"vp9", kbps:6000,fps:30,dica:"Texto nítido e boa compatibilidade (6 Mbps). Use se a Máxima travar."},
  maxima:{nome:"Máxima", codec:"av1", kbps:8000,fps:30,dica:"Padrão: a mais nítida (AV1, 8 Mbps). Exige computador recente e internet boa."}
};
const telaQ=t=>TELA_Q[(t&&t.qualidade)||"maxima"]||TELA_Q.maxima;
const PREVIA_KBPS=700;
const AUDIO_KBPS=128;    // som da aba com qualidade de música (a voz do apresentador segue pela lapela)   // a prévia da sala recebe uma versão leve, para não dobrar a internet do apresentador
const vdoView=(t,mudo,previa)=>{ const q=telaQ(t);
  return `${VDO_VIEW}?view=${VDO_STREAM}&room=${encodeURIComponent(t.id)}&password=${encodeURIComponent(encodeURIComponent(t.senha))}&scene=0&cleanoutput&wss2=${encodeURIComponent(VDO_HOST.replace(/^wss?:\/\//,""))}&codec=${q.codec}&videobitrate=${previa?PREVIA_KBPS:q.kbps}${mudo?"&noaudio":`&audiobitrate=${AUDIO_KBPS}&stereo`}${previa?"&label=previa":""}`; };
/* Ajusta cada conexão: Full HD travado e taxa de bits; a prévia da sala fica leve */
async function telaAjustarConexao(conn,q,previa){
  const pc=conn&&conn.pc; if(!pc||!pc.getSenders) return;
  for(const s of pc.getSenders()){
    if(s.track&&s.track.kind==="audio"){
      try{ const p=s.getParameters(); if(!p.encodings||!p.encodings.length) p.encodings=[{}]; p.encodings[0].maxBitrate=AUDIO_KBPS*1000; await s.setParameters(p); }catch(err){}
      continue;
    }
    if(!s.track||s.track.kind!=="video") continue;
    try{
      const p=s.getParameters(); if(!p.encodings||!p.encodings.length) p.encodings=[{}];
      const e=p.encodings[0];
      e.maxBitrate=(previa?PREVIA_KBPS:q.kbps)*1000;
      e.maxFramerate=previa?10:q.fps;
      e.scaleResolutionDownBy=previa?2:1;
      p.degradationPreference="maintain-resolution";
      await s.setParameters(p);
    }catch(err){}
  }
}
function telaIframe(url,extra){ /* iframe de quem assiste */ const f=document.createElement("iframe"); f.src=url; f.setAttribute("allow","autoplay; fullscreen"); f.setAttribute("title","Tela do apresentador"); f.className="tela-frame"+(extra?" "+extra:""); return f; }
let vdoSdkCarregando=null;
function vdoSdk(){
  if(window.VDONinjaSDK) return Promise.resolve(window.VDONinjaSDK);
  if(vdoSdkCarregando) return vdoSdkCarregando;
  vdoSdkCarregando=new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=VDO_SDK; s.async=true; s.onload=()=>window.VDONinjaSDK?res(window.VDONinjaSDK):rej(new Error("sdk")); s.onerror=()=>{ vdoSdkCarregando=null; rej(new Error("sdk")); }; document.head.appendChild(s); });
  return vdoSdkCarregando;
}
async function telaAcao(acao){
  const L=live; if(!L) return null;
  const r=await SB.rpc("int_tela",{p_episode:L.epId,p_k:K_LINK||null,p_acao:acao});
  if(r.error){ toast(/int_tela|function|schema|tela_/i.test(r.error.message||"")?"Falta rodar o int-tela.sql no Supabase.":(r.error.message||"Não foi possível.")); return null; }
  const d=r.data||{}; if(live===L){ L.tela={id:d.id||null,senha:d.senha||null,noAr:!!d.no_ar,liberada:!!d.liberada,qualidade:d.qualidade||"maxima"}; telaRender(); }
  return d;
}
function telaRender(){
  const L=live; if(!L) return;
  if(L.mode==="display") return telaDisplay(L);
  if(L.mode==="controller") return telaControle(L);
  if(L.mode==="sala") return telaSala(L);
}
/* ---------- Apresentador: compartilhar pela interface da central ---------- */
async function telaCompartilhar(){
  const L=live; if(!L) return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia){ L.telaErro="Compartilhar a tela funciona no Chrome ou no Edge do computador."; L.telaEstado="erro"; return telaControle(L); }
  L.telaEstado="escolhendo"; L.telaErro=""; telaControle(L);
  let stream;
  try{
    // precisa ser chamado direto do clique: o navegador abre a escolha de janela
    const q0=telaQ(L.tela);
    stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:q0.fps,max:q0.fps},width:{ideal:1920,max:1920},height:{ideal:1080,max:1080},cursor:"always"},audio:{suppressLocalAudioPlayback:true,echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:2,sampleRate:48000},selfBrowserSurface:"exclude",surfaceSwitching:"include",systemAudio:"exclude"});
  }catch(e){ L.telaEstado="parado"; L.telaErro=/NotAllowed|Permission|denied|cancel/i.test((e&&e.name)+" "+(e&&e.message))?"Compartilhamento cancelado.":"Não foi possível abrir a escolha de tela."; return telaControle(L); }
  if(live!==L){ stream.getTracks().forEach(t=>t.stop()); return; }
  L.telaEstado="conectando"; L.telaStream=stream;
  { const vt0=stream.getVideoTracks()[0], st0=vt0&&vt0.getSettings?vt0.getSettings():{};
    L.telaSom=stream.getAudioTracks().length>0; L.telaSuperficie=st0.displaySurface||""; }
  telaControle(L);
  const vt=stream.getVideoTracks()[0];
  if(vt&&"contentHint" in vt) vt.contentHint="detail";   // tela com texto: prioriza nitidez em vez de movimento
  if(vt) vt.addEventListener("ended",()=>{ if(live===L&&L.telaStream===stream) telaParar(); });   // "Parar de compartilhar" da barra do navegador
  try{
    if(!(L.tela&&L.tela.id)) await telaAcao("preparar");
    const t=L.tela; if(!t||!t.id) throw new Error("sem código");
    const SDK=await vdoSdk();
    const vdo=new SDK({password:t.senha,salt:"vdo.ninja",host:VDO_HOST});
    L.telaVdo=vdo; L.telaVendo=0; L.telaConexoes=new Map();
    const q=telaQ(t); L.telaQualidade=t.qualidade||"maxima";
    vdo.addEventListener("peerConnected",ev=>{
      const c=ev.detail&&ev.detail.connection; if(c&&c.type==="publisher"){ L.telaConexoes.set(ev.detail.uuid,c); setTimeout(()=>telaAjustarConexao(c,telaQ(L.tela),!!(c.info&&c.info.label==="previa")),1200); }
      L.telaVendo=(L.telaVendo||0)+1; telaControle(L);
    });
    vdo.addEventListener("peerInfo",ev=>{ const c=L.telaConexoes&&L.telaConexoes.get(ev.detail&&ev.detail.uuid); if(c) telaAjustarConexao(c,telaQ(L.tela),!!(ev.detail.info&&ev.detail.info.label==="previa")); });
    vdo.addEventListener("peerDisconnected",ev=>{ if(L.telaConexoes) L.telaConexoes.delete(ev.detail&&ev.detail.uuid); L.telaVendo=Math.max(0,(L.telaVendo||0)-1); telaControle(L); });
    await vdo.connect();
    await vdo.publish(stream,{room:t.id,streamID:VDO_STREAM,label:"Apresentador",media:{video:{codec:q.codec,maxBitrate:q.kbps+"kbps",frameRate:q.fps},audio:{codec:"opus",maxBitrate:AUDIO_KBPS+"kbps"}}});
    if(live!==L||L.telaStream!==stream) return;
    L.telaEstado="compartilhando"; L.telaCompartilhando=true; telaControle(L);
  }catch(e){
    if(live!==L) return;
    await telaParar(true);
    L.telaEstado="erro"; L.telaErro=e&&e.message==="sdk"?"Não foi possível carregar a transmissão. Confira a internet e tente de novo.":"Não foi possível começar a transmissão. Tente de novo.";
    telaControle(L);
  }
}
async function telaParar(silencioso){
  const L=live; if(!L) return;
  const s=L.telaStream, v=L.telaVdo; L.telaSom=false; L.telaSuperficie="";
  L.telaStream=null; L.telaVdo=null; L.telaCompartilhando=false; L.telaVendo=0;
  if(s) s.getTracks().forEach(t=>{ try{ t.stop(); }catch(e){} });
  if(v){ try{ await v.stopPublishing(); }catch(e){} try{ await v.disconnect(); }catch(e){} }
  if(!silencioso){ L.telaEstado="parado"; if(L.tela&&L.tela.noAr) await telaAcao("fora"); }
  telaControle(L);
}
function telaControle(L){
  const box=$("#ctrlTela"); if(!box||!L||L.mode!=="controller") return;
  const lib=!!(L.tela&&L.tela.liberada);
  box.hidden=!lib;
  if(!lib){ if(L.telaStream){ telaParar(true).then(()=>{ L.telaEstado="parado"; }); toast("A produção desligou o compartilhamento de tela neste episódio."); } return; }
  if(!box.dataset.pronto){
    box.dataset.pronto="1";
    box.innerHTML=`<div class="tela-h"><b>Mostrar a sua tela</b><span class="meta" data-tela-txt></span></div>
      <div class="tela-local" data-tela-local hidden><video muted autoplay playsinline></video><span class="tela-selo" data-tela-selo></span><span class="tela-som" data-tela-som></span></div>
      <p class="tela-som-dica" data-tela-som-dica hidden></p>
      <div class="tela-bt"><button class="btn primary sm" type="button" data-tela-comp>Compartilhar minha tela</button>
      <button class="btn sm" type="button" data-tela-ar hidden>Mostrar no ar</button>
      <button class="linkbtn" type="button" data-tela-parar hidden>Parar de compartilhar</button></div>`;
    box.querySelector("[data-tela-comp]").addEventListener("click",()=>telaCompartilhar());
    box.querySelector("[data-tela-ar]").addEventListener("click",()=>telaAcao(live.tela&&live.tela.noAr?"fora":"no_ar"));
    box.querySelector("[data-tela-parar]").addEventListener("click",()=>telaParar());
  }
  const est=L.telaEstado||"parado", t=L.tela||{}, ativo=est==="compartilhando";
  if(ativo&&L.telaVdo&&(t.qualidade||"maxima")!==L.telaQualidade){
    L.telaQualidade=t.qualidade||"maxima"; const q=telaQ(t);
    try{ L.telaVdo.updatePublisherMedia({media:{video:{codec:q.codec,maxBitrate:q.kbps+"kbps",frameRate:q.fps},audio:{codec:"opus",maxBitrate:AUDIO_KBPS+"kbps"}}}); }catch(e){}
    (L.telaConexoes||new Map()).forEach(c=>telaAjustarConexao(c,q,!!(c.info&&c.info.label==="previa")));
  }
  const comp=box.querySelector("[data-tela-comp]");
  comp.hidden=ativo||est==="conectando";
  comp.disabled=est==="escolhendo";
  comp.textContent=est==="erro"?"Tentar de novo":"Compartilhar minha tela";
  box.querySelector("[data-tela-parar]").hidden=!(ativo||est==="conectando");
  const ar=box.querySelector("[data-tela-ar]"); ar.hidden=!ativo; ar.textContent=t.noAr?"Voltar aos slides":"Mostrar no ar"; ar.className="btn sm "+(t.noAr?"ghost":"primary");
  const loc=box.querySelector("[data-tela-local]"), vid=loc.querySelector("video");
  loc.hidden=!(ativo||est==="conectando");
  if(L.telaStream&&vid.srcObject!==L.telaStream){ vid.srcObject=L.telaStream; vid.play&&vid.play().catch(()=>{}); }
  if(!L.telaStream&&vid.srcObject) vid.srcObject=null;
  const selo=box.querySelector("[data-tela-selo]");
  selo.textContent=est==="conectando"?"Conectando…":t.noAr?"No ar":"Compartilhando";
  selo.className="tela-selo"+(t.noAr&&ativo?" ar":"");
  box.classList.toggle("no-ar",!!(ativo&&t.noAr));
  const som=box.querySelector("[data-tela-som]"), somDica=box.querySelector("[data-tela-som-dica]"), compartilhou=!!L.telaStream;
  som.hidden=!compartilhou;
  som.textContent=L.telaSom?"Com som":"Sem som";
  som.className="tela-som"+(L.telaSom?" com":"");
  somDica.hidden=!compartilhou||!!L.telaSom;
  somDica.textContent=L.telaSuperficie==="browser"
    ? "Sem som: para incluir o som desta aba, pare e compartilhe de novo marcando \"Compartilhar áudio da guia\"."
    : "Sem som: só abas do navegador enviam som. Se precisar de som (um vídeo, por exemplo), compartilhe a aba em vez da janela.";
  const vendo=L.telaVendo||0;
  box.querySelector("[data-tela-txt]").textContent =
    est==="erro" ? L.telaErro
    : est==="escolhendo" ? "Escolha a janela ou a aba que você vai mostrar."
    : est==="conectando" ? "Preparando a transmissão…"
    : ativo ? (t.noAr ? "A sua tela está no ar no lugar dos slides." : vendo ? "A produção já está vendo a sua tela. Clique em \"Mostrar no ar\" quando for a hora." : "Compartilhando. A produção vê a prévia pela sala.")
    : (L.telaErro || "Para mostrar um sistema, um site ou um arquivo ao vivo, direto do seu computador. Funciona no Chrome e no Edge.");
}
/* ---------- Tela de exibição: mostra a tela compartilhada por cima dos slides quando estiver "no ar" ---------- */
function telaDisplay(L){
  const box=$("#dispTela"); if(!box) return;
  const t=L.tela||{}, on=!!(t.id&&t.noAr);
  box.classList.toggle("on",on);
  const atual=box.querySelector("iframe");
  if(!on){ if(atual) atual.remove(); box.dataset.src=""; return; }
  const url=vdoView(t,false);
  if(box.dataset.src===url&&atual) return;
  box.innerHTML=""; box.dataset.src=url; box.appendChild(telaIframe(url));
}
/* ---------- Sala: prévia da tela do apresentador e o botão de colocar no ar ---------- */
function telaSala(L){
  const box=$("#salaTela"); if(!box) return;
  const t=L.tela||{};
  if(!t.id||!t.liberada){ box.hidden=true; box.innerHTML=""; box.dataset.src=""; return; }
  box.hidden=false;
  const url=vdoView(t,true,true);
  if(box.dataset.src!==url){
    box.dataset.src=url;
    box.innerHTML=`<div class="tela-h"><b>Tela do apresentador</b><span class="meta" data-tela-txt></span></div><div class="tela-prev" data-tela-prev></div>
      <div class="tela-bt"><button class="btn sm" type="button" data-tela-ar></button></div>`;
    box.querySelector("[data-tela-prev]").appendChild(telaIframe(url));
    box.querySelector("[data-tela-ar]").addEventListener("click",()=>telaAcao(live.tela&&live.tela.noAr?"fora":"no_ar"));
  }
  const b=box.querySelector("[data-tela-ar]");
  b.textContent=t.noAr?"Voltar aos slides":"Mostrar a tela no ar"; b.className="btn sm "+(t.noAr?"ghost":"primary");
  box.querySelector("[data-tela-txt]").textContent=t.noAr?"No ar no lugar dos slides.":"Prévia sem som. Se estiver preta, o apresentador ainda não compartilhou.";
  box.classList.toggle("no-ar",!!t.noAr);
}
/* ---------- Link fixo ?tela=atual: só a tela do apresentador, para uma cena própria no OBS ---------- */
async function startTelaView(epId){
  document.documentElement.classList.add("overlay-mode"); document.body.classList.add("overlay-mode","tela-mode");
  const v=$("#overlayView"); v.hidden=false;
  v.innerHTML='<div class="tela-solo" id="telaSolo"></div><p class="tela-espera" id="telaEspera">Aguardando o apresentador compartilhar a tela.</p>';
  const emObs=!!window.obsstudio;
  const mostrar=t=>{
    const box=$("#telaSolo"), esp=$("#telaEspera");
    if(!t||!t.id){ box.innerHTML=""; box.dataset.src=""; esp.hidden=emObs; return; }
    esp.hidden=true;
    const url=vdoView(t,false); if(box.dataset.src===url) return;
    box.dataset.src=url; box.innerHTML=""; box.appendChild(telaIframe(url));
  };
  if(!SB){ $("#telaEspera").textContent="Central não configurada."; return; }
  watchLive(epId,d=>{ if(d&&d.tela) mostrar(d.tela); });
}
addEventListener("pagehide",()=>{ if(live&&live.telaStream) telaParar(true); });
/* =================== Campos de digitar sincronizados ===================
   Campos que a apresentação tem para digitar (ex.: minutos de cada etapa) são preenchidos pela sala ou pelo controle,
   num painel "Campos deste slide". O valor vai a todas as telas pelo canal ao vivo e fica salvo em live_state.campos,
   para telas que abrirem ou recarregarem depois. A sala tem o botão "Limpar campos". */
function camposEnviar(L){ if(live!==L) return; const v={...(L.campos||{})}, a=acoesEstados(L); liveFrames().forEach(f=>{ f.setCampos(v); f.setAcoes(a); }); camposPainel(); acoesPainel(); camposBotao(); }
function camposDoBanco(L,c){
  if(!c||typeof c!=="object") return;
  L.campos=L.campos||{}; L.camposAt=L.camposAt||{};
  const agora=Date.now(); let mudou=false;
  new Set([...Object.keys(c),...Object.keys(L.campos)]).forEach(k=>{
    if(L.camposAt[k]&&agora-L.camposAt[k]<5000) return;   // mudança recente aqui ou pelo canal: o banco ainda não alcançou
    const v=c[k]==null?"":String(c[k]);
    if((L.campos[k]||"")!==v){ L.campos[k]=v; mudou=true; }
  });
  if(mudou) camposEnviar(L);
}
function camposRemoto(L,d){
  L.campos=L.campos||{}; L.camposAt=L.camposAt||{}; const agora=Date.now();
  if(d.limpar){ Object.keys(L.campos).forEach(k=>{ L.campos[k]=""; L.camposAt[k]=agora; }); }
  else if(d.k!=null){ L.campos[d.k]=d.v==null?"":String(d.v); L.camposAt[d.k]=agora; }
  camposEnviar(L);
}
function camposPodeEditar(L){ return L&&(L.mode==="sala"||L.mode==="controller"); }
const camposFila={patch:{},t:null,bt:{}};
function camposDigitar(L,k,v){
  if(!camposPodeEditar(L)) return;
  L.campos=L.campos||{}; L.camposAt=L.camposAt||{};
  L.campos[k]=v; L.camposAt[k]=Date.now();
  { const a=acoesEstados(L); liveFrames().forEach(f=>{ f.setCampos({...L.campos}); f.setAcoes(a); }); } camposBotao();
  clearTimeout(camposFila.bt[k]); camposFila.bt[k]=setTimeout(()=>{ L.chan&&L.chan.sendCampo({k,v}); },150);
  camposFila.patch[k]=v; clearTimeout(camposFila.t); camposFila.t=setTimeout(()=>camposSalvar(L),700);
}
async function camposSalvar(L,limpar){
  const patch=camposFila.patch; camposFila.patch={};
  if(!limpar&&!Object.keys(patch).length) return true;
  const r=await SB.rpc("int_campos",{p_episode:L.epId,p_k:K_LINK||null,p_patch:limpar?null:patch,p_limpar:!!limpar});
  if(r.error){ toast(/int_campos|campos|function|schema/i.test(r.error.message||"")?"Falta rodar o int-campos.sql no Supabase: os campos aparecem nas telas, mas não ficam salvos.":"Não foi possível salvar os campos: "+(r.error.message||"tente de novo")+"."); return false; }
  return true;
}
async function camposLimpar(btn){
  const L=live; if(!L||L.mode!=="sala") return;
  if(!confirmInline(btn,"Clique de novo para limpar")) return;
  L.campos=L.campos||{}; L.camposAt=L.camposAt||{}; const agora=Date.now();
  Object.keys(L.campos).forEach(k=>{ L.campos[k]=""; L.camposAt[k]=agora; });
  camposFila.patch={}; clearTimeout(camposFila.t);
  camposEnviar(L); L.chan&&L.chan.sendCampo({limpar:true});
  if(await camposSalvar(L,true)) toast("Tudo limpo em todas as telas.");
}
function camposBotao(){
  const ks=Object.keys((live&&live.campos)||{}).filter(k=>String(live.campos[k]||"").trim());
  const tem=!!(live&&live.mode==="sala"&&ks.length), ac=ks.some(k=>k.startsWith(ACAO_PRE)), cp=ks.some(k=>!k.startsWith(ACAO_PRE));
  const txt=ac&&cp?"Limpar campos e cartões":ac?"Limpar cartões":"Limpar campos";
  document.querySelectorAll("[data-campos-limpar]").forEach(b=>{ b.hidden=!tem; delete b.dataset.armed; b.textContent=txt; });
}
/* ---------- Ações deste slide (cartões que viram, abas, botões) ----------
   Usa a mesma gravação dos campos: cada ação fica em live_state.campos como "acao:<id>" = "1" (ligada) ou "" (desligada). */
const ACAO_PRE="acao:";
function acoesEstados(L){ const o={}; Object.keys((L&&L.campos)||{}).forEach(k=>{ if(k.startsWith(ACAO_PRE)) o[k.slice(ACAO_PRE.length)]=!!String(L.campos[k]||"").trim(); }); return o; }
function acaoTocar(k){
  const L=live; if(!L||!camposPodeEditar(L)) return;
  const c=((L.cur&&L.cur.acoesVis)||[]).find(x=>x.k===k);
  const atual=(L.campos&&(ACAO_PRE+k) in L.campos)?!!L.campos[ACAO_PRE+k]:!!(c&&c.on);
  camposDigitar(L,ACAO_PRE+k,atual?"":"1");
  acoesPainel();
}
function acoesPainel(){
  const L=live;
  const box=document.querySelector(L&&L.mode==="sala"?"#salaAcoes":"#ctrlAcoes");
  ["#salaAcoes","#ctrlAcoes"].forEach(s=>{ const b=$(s); if(b&&b!==box){ b.hidden=true; b.innerHTML=""; } });
  if(!box) return;
  const lista=(L&&camposPodeEditar(L)&&!L.usingReserva&&L.cur&&L.cur.acoesVis)||[];
  if(!lista.length){ box.hidden=true; box.innerHTML=""; box.dataset.chave=""; return; }
  box.hidden=false;
  const chave=lista.map(c=>c.k).join("|");
  if(box.dataset.chave!==chave){
    box.dataset.chave=chave;
    box.innerHTML=`<div class="campos-h"><b>Ações deste slide</b><span class="meta">Aciona em todas as telas, inclusive no OBS.</span></div>
      <div class="acoes-lista">${lista.map(c=>`<button class="acao-bt" type="button" data-acao="${esc(c.k)}" aria-pressed="false"><span class="acao-ic" aria-hidden="true"></span><span class="acao-tx">${esc(c.nome)}</span></button>`).join("")}</div>`;
    box.querySelectorAll("[data-acao]").forEach(b=>b.addEventListener("click",()=>acaoTocar(b.dataset.acao)));
  }
  const est=acoesEstados(L);
  box.querySelectorAll("[data-acao]").forEach(b=>{
    const k=b.dataset.acao, c=lista.find(x=>x.k===k), on=(k in est)?est[k]:!!(c&&c.on);
    b.classList.toggle("on",on); b.setAttribute("aria-pressed",on?"true":"false");
  });
}
/* Painel "Campos deste slide" (sala e controle) */
function camposPainel(){
  const box=document.querySelector(live&&live.mode==="sala"?"#salaCampos":"#ctrlCampos");
  ["#salaCampos","#ctrlCampos"].forEach(s=>{ const b=$(s); if(b&&b!==box){ b.hidden=true; b.innerHTML=""; } });
  if(!box) return;
  const L=live, lista=(L&&camposPodeEditar(L)&&L.cur&&L.cur.camposVis)||[];
  if(!lista.length||L.usingReserva){ box.hidden=true; box.innerHTML=""; box.dataset.chave=""; return; }
  const chave=lista.map(c=>c.k).join("|");
  box.hidden=false;
  if(box.dataset.chave!==chave){
    box.dataset.chave=chave;
    box.innerHTML=`<div class="campos-h"><b>Campos deste slide</b><span class="meta">O que for digitado aparece em todas as telas.</span></div>
      <div class="campos-lista">${lista.map((c,i)=>`<label class="campo"><span>${esc(c.rotulo)}</span><input type="text" inputmode="decimal" autocomplete="off" data-campo="${esc(c.k)}" placeholder="${esc(c.ph||"")}"></label>`).join("")}</div>`;
    box.querySelectorAll("[data-campo]").forEach(inp=>{
      inp.addEventListener("input",()=>camposDigitar(live,inp.dataset.campo,inp.value));
      inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); const t=[...box.querySelectorAll("[data-campo]")]; const n=t[t.indexOf(inp)+1]; if(n) n.focus(); else inp.blur(); } });
    });
  }
  box.querySelectorAll("[data-campo]").forEach(inp=>{
    if(document.activeElement===inp) return;    // não mexe no campo que a pessoa está digitando
    const k=inp.dataset.campo, c=lista.find(x=>x.k===k);
    const v=(L.campos&&k in L.campos)?L.campos[k]:(c&&c.valor)||"";
    if(inp.value!==v) inp.value=v;
  });
}
/* ---------- Votação que abre junto com o slide da enquete ----------
   Quando o slide com a enquete conectada fica 3 s na tela, a sala pergunta se quer abrir a votação.
   Sem sala aberta, quem pergunta é o controle do apresentador. Ao sair do slide, nada é encerrado. */
const ENQ_AVISO={t:null,atual:null,dispensadas:new Set()};
function enqSlideMudou(L){
  if(live!==L) return;
  const sala=L.mode==="sala", temSala=(L.peers||[]).some(p=>p&&p.mode==="sala");
  if(!sala && (L.mode!=="controller" || temSala)){ enqAvisoFechar(); return; }
  const vis=(L.cur&&L.cur.enqVis)||[], ids=(L.meta&&!L.usingReserva&&L.meta.enquetes)||[];
  const alvo=vis.map(i=>ids[i]).find(Boolean)||null;
  // saiu do slide: some com o aviso e libera para perguntar de novo na próxima vez
  if(!alvo){ clearTimeout(ENQ_AVISO.t); ENQ_AVISO.t=null; ENQ_AVISO.dispensadas.clear(); enqAvisoFechar(); return; }
  if(ENQ_AVISO.atual===alvo||ENQ_AVISO.dispensadas.has(alvo)) return;
  clearTimeout(ENQ_AVISO.t);
  ENQ_AVISO.t=setTimeout(async()=>{
    ENQ_AVISO.t=null;
    const vis2=(L.cur&&L.cur.enqVis)||[]; if(live!==L||!vis2.map(i=>ids[i]).includes(alvo)) return;   // passou rápido pelo slide
    const {data:a}=await SB.from("int_atividades").select("id,pergunta,estado").eq("id",alvo).maybeSingle();
    if(!a||live!==L||a.estado==="aberta") return;
    enqAvisoMostrar(L,a);
  },3000);
}
function enqAvisoFechar(){ ENQ_AVISO.atual=null; const el=document.getElementById("enqAviso"); if(el) el.remove(); }
function enqAvisoMostrar(L,a){
  enqAvisoFechar(); ENQ_AVISO.atual=a.id;
  const reabrir=a.estado==="encerrada";
  const el=document.createElement("div"); el.id="enqAviso"; el.className="enq-aviso"; el.setAttribute("role","alertdialog"); el.setAttribute("aria-label","Enquete no slide");
  el.innerHTML=`<div class="enq-aviso-tx"><b>${reabrir?"Esta votação já foi encerrada":"A enquete está no slide"}</b><span>${esc(a.pergunta||"Enquete")}</span>${reabrir?'<small>Reabrir mantém os votos que já existem.</small>':""}</div>
    <div class="enq-aviso-bt"><button class="btn primary sm" type="button" data-enq-abrir>${reabrir?"Reabrir a votação":"Abrir a votação"}</button><button class="btn ghost sm" type="button" data-enq-nao>Agora não</button></div>`;
  document.body.appendChild(el);
  el.querySelector("[data-enq-nao]").addEventListener("click",()=>{ ENQ_AVISO.dispensadas.add(a.id); enqAvisoFechar(); });
  el.querySelector("[data-enq-abrir]").addEventListener("click",async ev=>{
    const b=ev.currentTarget; b.disabled=true;
    const r=await SB.rpc("int_atividade_estado",{p_atividade:a.id,p_estado:"aberta"});
    if(r.error){ b.disabled=false; toast(L.mode==="controller"?"Não foi possível abrir. Peça à produção para abrir pela sala.":"Não foi possível abrir a votação."); return; }
    ENQ_AVISO.dispensadas.add(a.id); enqAvisoFechar();
    toast("Votação aberta para o público.");
    if(typeof loadSalaQs==="function"&&sqEp){ sqSig=""; loadSalaQs(); }
  });
}
/* Enquetes encontradas no HTML (para a aba Apresentações) */
function enquetesDoHtml(html){
  try{ const d=new DOMParser().parseFromString(html,"text/html"); return akiAcharEnquetes(d).map(e=>({pergunta:e.pergunta||"",opcoes:e.opcoes.map(o=>o.label||"")})); }
  catch(e){ return []; }
}
/* Busca as porcentagens das votações conectadas (na mesma ordem das enquetes do HTML) */
async function enqueteResultados(ids){
  const validos=(ids||[]).filter(Boolean); if(!validos.length) return [];
  const {data}=await SB.from("int_atividades").select("id,opcoes,estado").in("id",validos);
  const by={}; (data||[]).forEach(a=>by[a.id]=a);
  const lista=await Promise.all(ids.map(async(id,i)=>{
    if(!id) return null;
    const a=by[id]; if(!a) return {i,estado:"rascunho",pct:[]};
    let pct={};
    if(a.estado==="aberta"||a.estado==="encerrada"){ const r=await SB.rpc("int_quiz_resultado",{p_atividade:id}); pct=(r.data&&r.data.pct)||{}; }
    return {i,estado:a.estado,pct:qzOpts(a).map(o=>Math.round(+pct[o.id]||0))};
  }));
  return lista.filter(Boolean);
}
function enqPoller(getIds,getFrames,epId){
  // 2,5 s com a votação aberta; 15 s nos outros momentos.
  // Abrir, encerrar ou trocar a votação avisa na hora (aviso em tempo real), sem esperar a próxima rodada.
  let rapido=false, ch=null;
  const ag=agendador(async()=>{
    const ids=getIds()||[];
    if(!ids.some(Boolean)){ rapido=false; return; }
    const lista=await enqueteResultados(ids);
    rapido=lista.some(x=>x&&x.estado==="aberta");
    getFrames().forEach(f=>f&&f.setEnquete(lista));
  },()=>rapido?2500:15000);
  if(epId&&SB){ ch=SB.channel("enq-"+uid()); aviso(ch,"int_atividades",epId,p=>{ const id=(p.new&&p.new.id)||(p.old&&p.old.id); if(!id||(getIds()||[]).includes(id)) ag.agora(); }); ch.subscribe(); }
  return ()=>{ ag.parar(); if(ch){ try{ SB.removeChannel(ch); }catch(e){} } };
}
function injectBridge(html,leve){
  const low=html.toLowerCase();
  const h=low.indexOf("<head");
  const pre=PRELUDE+(leve?LEVE:"");
  let out = html;
  if(h>=0){ const e=low.indexOf(">",h); out = html.slice(0,e+1)+pre+html.slice(e+1); }
  else out = pre+html;
  const i=out.toLowerCase().lastIndexOf("</body>");
  return i>=0 ? out.slice(0,i)+BRIDGE+ENQ_BRIDGE+out.slice(i) : out+BRIDGE+ENQ_BRIDGE;
}

/* One embedded copy of the deck. */
const FRAMES=new Set();
class DeckFrame{
  constructor(container,{full=false}={}){
    this.container=container; this.full=full; this.target=0; this.ready=false; this.pos=null; this.total=null; this.onReport=null; this.html=null;
    this.iframe=document.createElement("iframe");
    this.iframe.setAttribute("sandbox","allow-scripts");
    this.iframe.setAttribute("allow","autoplay");
    this.iframe.setAttribute("title","Apresentação");
    this.iframe.setAttribute("tabindex","-1");
    container.appendChild(this.iframe);
    FRAMES.add(this);
    if(!full){
      this.ro=new ResizeObserver(()=>{ this.iframe.style.transform=`scale(${container.clientWidth/1920})`; });
      this.ro.observe(container);
    }
  }
  load(html){ if(html===this.html) return; this.html=html; this.ready=false; this.pos=null; this.total=null; this.enqVis=[]; this.camposVis=[]; this.camposSig=null; this.videoVis=[]; this.acoesVis=[]; this.acoesSig=null; this.carregadoEm=Date.now(); this.pingPend=0; this.onEnqVis&&this.onEnqVis(this); this.iframe.srcdoc=injectBridge(html,this.leve); }
  setLeve(v){ v=!!v; if(v===!!this.leve) return; this.leve=v; this.reload(); }
  reload(){ if(!this.html) return; const h=this.html; this.html=null; this.load(h); }
  setTarget(n){ this.target=Math.max(0,n); this.sync(); }
  setEnquete(lista){ const sg=JSON.stringify(lista||[]); if(sg===this.enqSig) return; this.enqSig=sg; this.enq=lista; this.postEnq(); }
  setVideos(urls,mudo){ const sg=JSON.stringify([urls||{},!!mudo]); if(sg===this.videosSig) return; this.videosSig=sg; this.videosUrls=urls||{}; this.videosMudo=!!mudo; this.postVideos(); }
  postVideos(){ if(this.ready&&this.videosUrls){ try{ this.iframe.contentWindow.postMessage({akicastCmd:"videos",urls:this.videosUrls,mudo:this.videosMudo},"*"); }catch(e){} } }
  postVideo(p){ this.ultimoVideo=p; if(this.ready){ try{ this.iframe.contentWindow.postMessage({akicastCmd:"video",...p},"*"); }catch(e){} } }
  setAcoes(m){ const sg=JSON.stringify(m||{}); if(sg===this.acoesSig) return; this.acoesSig=sg; this.acoesVals=m||{}; this.postAcoes(); }
  postAcoes(){ if(this.ready&&this.acoesVals){ try{ this.iframe.contentWindow.postMessage({akicastCmd:"acoes",estados:this.acoesVals},"*"); }catch(e){} } }
  setCampos(v){ const sg=JSON.stringify(v||{}); if(sg===this.camposSig) return; this.camposSig=sg; this.camposVals=v; this.postCampos(); }
  postCampos(){ if(this.ready&&this.camposVals&&Object.keys(this.camposVals).length){ try{ this.iframe.contentWindow.postMessage({akicastCmd:"campos",valores:this.camposVals},"*"); }catch(e){} } }
  postEnq(){ if(this.ready&&this.enq&&this.enq.length){ try{ this.iframe.contentWindow.postMessage({akicastCmd:"enquete",lista:this.enq},"*"); }catch(e){} } }
  sync(){ if(!this.ready||this.pos===this.target) return; this.iframe.contentWindow.postMessage({akicastCmd:"goto",n:this.target},"*"); }
  destroy(){ FRAMES.delete(this); this.ro&&this.ro.disconnect(); this.iframe.remove(); }
}
addEventListener("message",e=>{
  const d=e.data; if(!d||!(Array.isArray(d.akicastVideoVis)||d.akicastVideo)) return;
  for(const f of FRAMES){
    if(f.iframe.contentWindow!==e.source) continue;
    if(d.akicastVideoVis){ f.videoVis=d.akicastVideoVis; if(live&&live.cur===f) videoPainel(); continue; }
    const v=d.akicastVideo; if(!live||!v||!v.k) continue;
    if(live.mode==="display"&&live.frames[0]===f){
      if(v.bloqueado){ videoSomBloqueado(); live.chan&&live.chan.sendVideoEstado({...v}); continue; }
      live.chan&&live.chan.sendVideoEstado(v);
    } else if(live.cur===f){ (live.videoLocal=live.videoLocal||{})[v.k]={...v,em:Date.now()}; videoPainel(); }
  }
});
addEventListener("message",e=>{
  const d=e.data; if(!d||!Array.isArray(d.akicastAcoesVis)) return;
  for(const f of FRAMES){ if(f.iframe.contentWindow!==e.source) continue; f.acoesVis=d.akicastAcoesVis; if(live&&live.cur===f) acoesPainel(); }
});
addEventListener("message",e=>{
  const d=e.data; if(!d||!Array.isArray(d.akicastCamposVis)) return;
  for(const f of FRAMES){ if(f.iframe.contentWindow!==e.source) continue; f.camposVis=d.akicastCamposVis; if(live&&live.cur===f) camposPainel(); }
});
addEventListener("message",e=>{
  const d=e.data; if(!d||d.akicastPong==null) return;
  for(const f of FRAMES){ if(f.iframe.contentWindow===e.source&&f.pingPend===d.akicastPong) f.pingPend=0; }
});
addEventListener("message",e=>{
  const d=e.data; if(!d||!Array.isArray(d.akicastEnqVis)) return;
  for(const f of FRAMES){ if(f.iframe.contentWindow!==e.source) continue; f.enqVis=d.akicastEnqVis; f.onEnqVis&&f.onEnqVis(f); }
});
addEventListener("message",e=>{
  const d=e.data; if(!d||!d.akicastBridge) return;
  for(const f of FRAMES){
    if(f.iframe.contentWindow!==e.source) continue;
    if(d.ready) f.ready=true;
    f.pos=d.pos; if(d.total) f.total=d.total; f.info=d.info||null;
    f.onReport&&f.onReport(f);
    if(d.ready){ f.sync(); f.postEnq(); f.postCampos(); f.postVideos(); f.postAcoes(); }
  }
});

/* Scan the file for things that will not come along. */
function scanDeck(html){
  const warns=[];
  if(html.length>3e6) warns.push("O arquivo é pesado ("+fmtBytes(html.length)+"). Na live ele é aberto em várias telas ao mesmo tempo (exibição, atual e próximo) e pode deixar a passagem de slides lenta. Se der, peça uma versão com imagens menores ou comprimidas.");
  const hosts=new Set();
  const re=/(?:src|href)\s*=\s*["'](?:https?:)?\/\/([^\/"']+)/gi; let m;
  while((m=re.exec(html))){ const h=m[1].toLowerCase(); if(!ALLOWED_HOSTS.includes(h)) hosts.add(h); }
  const re2=/url\(\s*["']?(?:https?:)?\/\/([^\/"')]+)/gi;
  while((m=re2.exec(html))){ const h=m[1].toLowerCase(); if(!ALLOWED_HOSTS.includes(h)) hosts.add(h); }
  if(hosts.size) warns.push("O arquivo busca conteúdo na internet em "+[...hosts].slice(0,4).join(", ")+(hosts.size>4?" e outros":"")+". A central bloqueia esses endereços, então essas partes podem não aparecer. Peça ao apresentador para embutir esse conteúdo no HTML.");
  const locals=new Set();
  const re3=/["'`]((?!https?:|data:|blob:|\/\/|#)[^"'`\s<>()]+\.(?:jpe?g|png|gif|svg|webp|mp4|webm|mp3|woff2?|ttf|css|js))["'`]/gi;
  while((m=re3.exec(html))){ locals.add(m[1]); }
  if(locals.size) warns.push("O arquivo procura "+[...locals].slice(0,3).join(", ")+(locals.size>3?" e outros arquivos":"")+" ao lado dele, e esses arquivos não vêm junto com o HTML. O que depender deles vai aparecer sem imagem ou no modo alternativo do próprio arquivo.");
  return warns;
}
function fmtBytes(n){ return n<1024*1024 ? Math.round(n/1024)+" KB" : (n/1024/1024).toFixed(1).replace(".",",")+" MB"; }
function fmtWhen(iso){ const d=new Date(iso); if(isNaN(d)) return ""; return d.getDate()+" "+MONTHS_S[d.getMonth()]+", "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }

/* ---------- Supabase store (episódios) ---------- */
const askPontuacao=new Set();
function pontuacaoPopup(){
  return new Promise(res=>{
    const ov=document.createElement("div"); ov.className="sent-ov"; ov.id="ptAsk";
    ov.innerHTML=`<div class="sent-card pt-ask" role="dialog" aria-modal="true" aria-labelledby="ptAskT">
      <div class="pt-gift" aria-hidden="true">🏆</div>
      <h2 id="ptAskT">Este episódio terá pontuação e sorteio?</h2>
      <p>Com pontuação, quem participa do quiz e da votação entra com o nome, acumula pontos e concorre a brindes. Sem pontuação, todo mundo participa sem precisar de nome.</p>
      <div class="pt-ask-opts">
        <button class="pt-opt" type="button" data-v="1"><b>Ligar pontuação</b><span>Ranking, Top 3 e pódio no fim da live</span></button>
        <button class="pt-opt" type="button" data-v="0"><b>Deixar desligada</b><span>Episódio normal, sem pedir nome</span></button>
      </div>
      <p class="meta">Dá para mudar depois pela chave "Pontuação e sorteio" do episódio.</p>
      <button class="linkbtn" type="button" data-v="x">Voltar e continuar editando</button>
    </div>`;
    document.body.appendChild(ov);
    const done=v=>{ ov.remove(); res(v); };
    ov.querySelectorAll("[data-v]").forEach(b=>b.addEventListener("click",()=>done(b.dataset.v==="x"?null:b.dataset.v==="1")));
    ov.addEventListener("click",e=>{ if(e.target===ov) done(null); });
    setTimeout(()=>{ const f=ov.querySelector(".pt-opt"); if(f) f.focus(); },40);
  });
}
function setPontHint(on){ const h=$("#ptHint"); if(h) h.textContent=on?(PROG==="learning"?"Ligado: para responder quiz e votação, cada pessoa entra com o nome e acumula pontos. Ao final, a sala mostra o ranking e o sorteio.":"Ligado: quem quiser entra com o nome e acumula pontos (dá para responder sem pontuar). Ao final, a sala mostra o ranking e o sorteio."):"Desligado: quiz e votação funcionam sem pedir nome, e não há ranking nem sorteio."; }
function rowToEp(r){ return {id:r.id,date:r.date,theme:r.theme||"",presenters:r.presenters||"",people:r.people,notes:r.notes||"",checks:r.checks||{},rating:r.rating,review:r.review||"",youtube_url:r.youtube_url||"",slido_url:r.slido_url||"",program:r.program||"akicast",pontuacao:!!r.pontuacao,capa_numero:r.capa_numero??null,faixa_pessoas:Array.isArray(r.faixa_pessoas)?r.faixa_pessoas:[],capa_titulo:r.capa_titulo||"",capa_destaque:r.capa_destaque||"",objectives:r.objectives||"",audience:r.audience||"",materials:r.materials||[],createdAt:r.created_at}; }
function uid(){ return Math.random().toString(36).slice(2,9); }
/* ---------- Segurança: colunas que o público pode ler (notas internas e avaliação ficam de fora) ---------- */
const PUBLIC_EP_COLS="id,date,theme,presenters,people,program,objectives,audience,materials,pontuacao,youtube_url,slido_url,capa_numero,capa_titulo,capa_destaque,faixa_pessoas,created_at";
const negado=e=>!!e&&(e.code==="42501"||/permission denied/i.test(e.message||""));
async function epPublico(id){
  let r=await SB.from("episodes").select(PUBLIC_EP_COLS).eq("id",id).maybeSingle();
  if(r.error&&!negado(r.error)) r=await SB.from("episodes").select("id,date,theme,presenters,program").eq("id",id).maybeSingle();
  return r;
}
/* Código secreto dos links de controle e de envio (?k=) */
let K_LINK=new URLSearchParams(location.search).get("k")||"";
let LINKS={}, linksOk=false;
let linkCurtoOk=false, linkCurtoTestado=false;
async function loadLinks(){
  if(!SB||!SESSION||SESSION.papel!=="admin"){ return; }
  if(!linkCurtoTestado){ linkCurtoTestado=true; const t=await SB.rpc("int_link_resolver",{p_k:"teste",p_tipo:"controle"}); linkCurtoOk=!t.error; }
  const {data,error}=await SB.from("int_links").select("episode_id,controle,envio");
  if(error){ linksOk=false; return; }
  const prev=JSON.stringify(LINKS); LINKS={}; (data||[]).forEach(r=>LINKS[r.episode_id]=r); linksOk=true;
  if(JSON.stringify(LINKS)!==prev && typeof renderPresBody==="function" && $("#presBody")) renderPresBody();
}
function makeSupabaseStore(sb){
  const map=new Map(); let cb=null, onErr=null;
  const emit=()=>cb&&cb([...map.values()]);
  let publico=false;
  // Hora em que terminou a última gravação feita por esta tela em cada episódio.
  // Leituras pedidas antes disso podem estar velhas: são descartadas e refeitas.
  const gravouEm={}, lerT={};
  const velha=(id,t)=>gravouEm[id]&&t<gravouEm[id];
  async function refetch(){
    const t=Date.now();
    let {data,error}=await sb.from("episodes").select("*");
    if(error && negado(error)){ publico=true; ({data,error}=await sb.from("episodes").select(PUBLIC_EP_COLS)); }
    else if(!error) publico=false;
    if(error){ onErr&&onErr(error); return; }
    const antes=new Map(map); map.clear();
    data.forEach(r=>{ if(!publico&&velha(r.id,t)&&antes.has(r.id)){ map.set(r.id,antes.get(r.id)); lerUm(r.id); } else map.set(r.id,rowToEp(r)); });
    emit();
    if(SESSION&&SESSION.papel==="admin" && data.some(r=>!LINKS[r.id])) loadLinks();
  }
  // Relê um episódio (todas as colunas, com o login). Vários pedidos seguidos viram uma leitura só.
  function lerUm(id,espera){
    clearTimeout(lerT[id]);
    lerT[id]=setTimeout(async()=>{
      delete lerT[id];
      const t=Date.now();
      const {data,error}=await sb.from("episodes").select("*").eq("id",id).maybeSingle();
      if(error){ if(negado(error)) refetch(); return; }
      if(velha(id,t)){ lerUm(id); return; }
      if(!data){ if(map.has(id)){ map.delete(id); emit(); } return; }
      const novo=rowToEp(data), atual=map.get(id);
      if(atual&&JSON.stringify(atual)===JSON.stringify(novo)) return;
      map.set(id,novo); emit();
    },espera==null?250:espera);
  }
  return {
    reload(){ return refetch(); },
    subscribe(fn,err){
      cb=fn; onErr=err;
      sb.channel("episodes-"+uid())
        .on("postgres_changes",{event:"*",schema:"public",table:"episodes"},p=>{
          if(publico){ refetch(); return; }   // sem login: busca de novo só as colunas públicas
          // O conteúdo do aviso não é usado: ele pode chegar sem as colunas internas (checklist, notas).
          if(p.eventType==="DELETE"){ const id=p.old&&p.old.id; if(id&&map.has(id)){ map.delete(id); emit(); } return; }
          const id=(p.new&&p.new.id)||(p.old&&p.old.id); if(id) lerUm(id);
        })
        .subscribe(st=>{ if(st==="SUBSCRIBED") refetch(); });
      refetch();
      document.addEventListener("visibilitychange",()=>{ if(!document.hidden) refetch(); });
    },
    async create(body){
      const row={date:body.date,theme:body.theme,presenters:body.presenters,people:body.people,notes:body.notes,checks:body.checks||{},rating:body.rating,review:body.review,program:PROG};
      let {data,error}=await sb.from("episodes").insert(row).select().single();
      if(error && /program/.test(error.message||"")){
        if(PROG!=="akicast") throw {message:"rode o arquivo supabase-atualizacao-programas.sql no Supabase para criar episódios do "+PN()};
        delete row.program; ({data,error}=await sb.from("episodes").insert(row).select().single());
      }
      if(error) throw error;
      map.set(data.id,rowToEp(data)); emit(); return data.id;
    },
    async update(id,patch){
      patch={...patch};
      if(patch.checks){
        for(const [k,v] of Object.entries(patch.checks)){
          const {error}=await sb.rpc("set_check",{ep:id,item:k,val:v});
          if(error){ gravouEm[id]=Date.now(); lerUm(id,0); throw error; }
        }
        gravouEm[id]=Date.now(); lerUm(id,600);
        const cur=map.get(id); if(cur) map.set(id,{...cur,checks:{...cur.checks,...patch.checks}});
        delete patch.checks;
        if(!Object.keys(patch).length){ emit(); return; }
      }
      const {error}=await sb.from("episodes").update(patch).eq("id",id);
      if(error){
        if(/youtube_url|slido_url/.test(error.message||"")) throw {message:"os campos de links ainda não existem no banco. Rode o arquivo supabase-atualizacao-links-envio.sql no SQL Editor"};
        if(/faixa_pessoas/.test(error.message||"")) throw {message:"a lista de nomes ainda não existe no banco. Rode o arquivo int-nome-apresentador.sql no SQL Editor"};
        if(/capa_/.test(error.message||"")) throw {message:"os campos da capa ainda não existem no banco. Rode o arquivo supabase-atualizacao-capa.sql no SQL Editor"};
        if(/pontuacao/.test(error.message||"")) throw {message:"a opção de pontuação ainda não existe no banco. Rode o arquivo supabase-atualizacao-pontuacao-episodio.sql no SQL Editor"};
        if(/objectives|audience|materials/.test(error.message||"")) throw {message:"os campos do AkiLearning ainda não existem no banco. Rode o arquivo supabase-atualizacao-learning-conteudo.sql no SQL Editor"};
        throw error;
      }
      gravouEm[id]=Date.now(); lerUm(id,600);
      const cur=map.get(id); if(cur) map.set(id,{...cur,...patch});
      emit();
    },
    async remove(id){
      try{
        const {data}=await sb.from("decks").select("*").eq("episode_id",id).maybeSingle();
        if(data) await sb.storage.from("decks").remove([data.path,data.reserva_path].filter(Boolean));
      }catch(e){}
      const {error}=await sb.from("episodes").delete().eq("id",id);
      if(error) throw error;
      map.delete(id); emit();
    }
  };
}

/* ---------- Deck storage (Supabase) ---------- */
const deckCache={}; // epId -> {version, html}
function deckRow(r){ return {name:r.name,size:r.size,path:r.path,version:Number(r.version),uploadedAt:r.uploaded_at,source:r.source||"equipe",reservaPath:r.reserva_path||null,reservaName:r.reserva_name||"",reservaSize:Number(r.reserva_size)||0,reservaVersion:Number(r.reserva_version)||0,reservaAt:r.reserva_em||null,reservaSource:r.reserva_source||"equipe",enquetes:Array.isArray(r.enquetes)?r.enquetes:[],ensaio:r.ensaio||null,videos:r.videos&&typeof r.videos==="object"?r.videos:{}}; }
async function fetchDeckMeta(epId){
  const {data,error}=await SB.from("decks").select("*").eq("episode_id",epId).maybeSingle();
  if(error) throw error; return data?deckRow(data):null;
}
/* Watch one row keyed by episode_id. DELETE events cannot be filtered, so they are checked here. */
function watchRow(table, epId, map, cb){
  let alive=true;
  SB.from(table).select("*").eq("episode_id",epId).maybeSingle().then(({data})=>{ if(alive) cb(data?map(data):null); });
  const ch=SB.channel(table+"-"+epId+"-"+uid())
    .on("postgres_changes",{event:"INSERT",schema:"public",table,filter:"episode_id=eq."+epId},p=>{ if(alive) cb(map(p.new)); })
    .on("postgres_changes",{event:"UPDATE",schema:"public",table,filter:"episode_id=eq."+epId},p=>{ if(alive) cb(map(p.new)); })
    .on("postgres_changes",{event:"DELETE",schema:"public",table},p=>{ if(alive && p.old && p.old.episode_id===epId) cb(null); })
    .subscribe();
  return ()=>{ alive=false; SB.removeChannel(ch); };
}
const watchDeck=(epId,cb)=>watchRow("decks",epId,deckRow,cb);
const liveRow=r=>({step:r.step,cover:!!r.cover,at:Number(r.at)||0,leve:!!r.leve,recarregar:Number(r.recarregar_em)||0,reserva:!!r.reserva,campos:r.campos&&typeof r.campos==="object"?r.campos:null,tela:("tela_id" in r)?{id:r.tela_id||null,senha:r.tela_senha||null,noAr:!!r.tela_no_ar,liberada:!!r.tela_liberada,qualidade:r.tela_qualidade||"maxima"}:null});
const watchLive=(epId,cb)=>watchRow("live_state",epId,liveRow,cb);
async function fetchLive(epId){
  const {data,error}=await SB.from("live_state").select("*").eq("episode_id",epId).maybeSingle();
  if(error) throw error; return data?liveRow(data):null;
}
let coverColumn=true;
async function setLive(epId,{step,at,v,cover}){
  if(K_LINK && live && live.mode==="controller"){
    const {error}=await SB.rpc("int_controle_slide",{p_episode:epId,p_k:K_LINK,p_step:step,p_at:at,p_version:v||null,p_cover:typeof cover==="boolean"?cover:null});
    if(!error) return;
    if(!/function|schema cache/i.test(error.message||"")){ if(!setLive._avisou){ setLive._avisou=true; toast(error.message||"Não foi possível passar o slide."); } throw error; }
  }
  const row={episode_id:epId,step,at,version:v||null};
  if(coverColumn && typeof cover==="boolean") row.cover=cover;
  let {error}=await SB.from("live_state").upsert(row);
  if(error && /cover/.test(error.message||"")){ coverColumn=false; delete row.cover; ({error}=await SB.from("live_state").upsert(row)); }
  if(error) throw error;
}
async function loadDeckHtml(epId, meta){
  if(deckCache[epId] && deckCache[epId].version===meta.version) return deckCache[epId].html;
  const {data,error}=await SB.storage.from("decks").download(meta.path);
  if(error) throw error;
  const html=await data.text();
  deckCache[epId]={version:meta.version,html};
  return html;
}
/* Contador das telas: mostra o slide do arquivo e, quando houver, a etapa dentro dele */
function contagem(f,passo){
  const p=passo==null?(f&&f.pos):passo;
  if(p==null) return "";
  const i=f&&f.info;
  if(i&&i.slide&&f.pos===p){
    if(i.etapas>1) return `Slide ${i.slide} de ${i.slides} · etapa ${i.etapa} de ${i.etapas}`;
    return `Slide ${i.slide} de ${i.slides}`;
  }
  return f&&f.total ? `Passo ${p+1} de ${f.total}` : `Slide ${p+1}`;
}
/* ---------- PDF de reserva ---------- */
const reservaCache={}; // epId -> {version, html}
async function loadReservaHtml(epId, meta){
  if(reservaCache[epId] && reservaCache[epId].version===meta.reservaVersion) return reservaCache[epId].html;
  const {data,error}=await SB.storage.from("decks").download(meta.reservaPath);
  if(error) throw error;
  const html=await data.text();
  reservaCache[epId]={version:meta.reservaVersion,html};
  return html;
}
/* Início de cada slide em "passos" (decks deck-motion têm vários cliques por slide). null = 1 passo por slide. */
function deckStarts(html){
  const m=/<script[^>]*id=["']deck-motion["'][^>]*>([\s\S]*?)<\/script>/i.exec(html||""); if(!m) return deckStartsEtapas(html);
  let cfg; try{ cfg=JSON.parse(m[1]); }catch(e){ return null; }
  const nCfg=(cfg.slides||[]).length, nDom=(html.match(/class=["'][^"']*\bdeck-slide\b/g)||[]).length, n=Math.max(nCfg,nDom);
  if(!n) return null;
  const P=[]; let acc=0;
  for(let i=0;i<n;i++){ const st=(cfg.slides&&cfg.slides[i]&&cfg.slides[i].steps)||[{}]; let man=0; st.forEach((x,j)=>{ if(j===0||!x.auto) man++; }); P.push(acc); acc+=Math.max(1,man); }
  return P;
}
// slides com data-steps="N" (cada "próximo" acende uma etapa antes de trocar de slide)
function deckStartsEtapas(html){
  html=String(html||"").replace(/<!--[\s\S]*?-->/g,"");   // exemplos dentro de comentários não contam
  if(!/data-steps\s*=/i.test(html)) return null;
  let tags=(html.match(/<(section|div)\b[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>/gi)||[]);
  if(!tags.length) tags=(html.match(/<section\b[^>]*>/gi)||[]);
  if(!tags.length) return null;
  const P=[]; let acc=0;
  tags.forEach(t=>{ const m=/data-steps\s*=\s*["']?(\d+)/i.exec(t); P.push(acc); acc+=Math.max(1,m?+m[1]:1); });
  return P;
}
const slideDoPasso=(P,step)=>{ if(!P) return step; let i=0; while(i<P.length-1 && P[i+1]<=step) i++; return i; };
const passoDoSlide=(P,slide)=>P?P[Math.max(0,Math.min(P.length-1,slide))]:slide;
const paginasPdf=html=>(String(html||"").match(/<div class="s( on)?"><img/g)||[]).length;
async function uploadReserva(epId, file, onProg, source){
  if(!isPdfName(file.name)) throw {code:"not_pdf"};
  if(file.size>60*1024*1024) throw {code:"too_big"};
  const old=await fetchDeckMeta(epId);
  if(!old) throw {code:"sem_deck"};
  const html=await pdfToDeck(file,p=>onProg&&onProg(p*0.6));
  const bytes=new Blob([html]).size;
  if(bytes>MAX_BYTES) throw {code:"too_big"};
  const version=Date.now();
  const pelo_link=!!(K_LINK && source==="apresentador");
  const path=pelo_link?epId+"/"+K_LINK+"/reserva-"+version+".html":epId+"/reserva-"+version+".html";
  const {error:u1}=await SB.storage.from("decks").upload(path,new Blob([html],{type:"text/plain;charset=utf-8"}),{upsert:!pelo_link,contentType:"text/plain;charset=utf-8"});
  if(u1) throw u1;
  onProg&&onProg(.8);
  const semSql=e=>e&&/reserva|column|schema|function/i.test(e.message||"")?{message:"falta rodar o int-pdf-reserva.sql no Supabase"}:e;
  if(pelo_link){
    const {error}=await SB.rpc("int_enviar_reserva",{p_episode:epId,p_k:K_LINK,p_name:file.name,p_size:bytes,p_path:path,p_version:version});
    if(error) throw semSql(error);
  } else {
    const {error}=await SB.from("decks").update({reserva_path:path,reserva_name:file.name,reserva_size:bytes,reserva_version:version,reserva_em:new Date().toISOString(),reserva_source:source||"equipe"}).eq("episode_id",epId);
    if(error) throw semSql(error);
    if(old.reservaPath&&old.reservaPath!==path){ try{ await SB.storage.from("decks").remove([old.reservaPath]); }catch(e){} }
  }
  reservaCache[epId]={version,html};
  onProg&&onProg(1);
  return html;
}
async function removeReserva(epId){
  const meta=await fetchDeckMeta(epId); if(!meta||!meta.reservaPath) return;
  try{ await SB.storage.from("decks").remove([meta.reservaPath]); }catch(e){}
  const {error}=await SB.from("decks").update({reserva_path:null,reserva_name:null,reserva_size:null,reserva_version:null,reserva_em:null,reserva_source:null}).eq("episode_id",epId);
  if(error) throw error;
  try{ await SB.from("live_state").update({reserva:false}).eq("episode_id",epId); }catch(e){}
  delete reservaCache[epId];
}
/* Otimização automática das imagens embutidas (roda no navegador, antes de subir) */
let ultimaOtimizacao=null;
function otimizarLigado(){ return lsGet("akicast-otimizar")!=="0"; }
async function optimizeDeckImages(html,onProg){
  const re=/data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+\/=]+/g, vistos=new Set(), lista=[];
  let m; while((m=re.exec(html))){ if(m[0].length>40000 && !vistos.has(m[0])){ vistos.add(m[0]); lista.push(m[0]); } }
  const antes=new Blob([html]).size; let trocadas=0;
  for(let i=0;i<lista.length;i++){
    onProg&&onProg(i/lista.length);
    const src=lista[i];
    try{
      const img=new Image(); img.src=src; await img.decode();
      const w=img.naturalWidth, h=img.naturalHeight; if(!w||!h) continue;
      const k=Math.min(1,1920/Math.max(w,h)), cw=Math.max(1,Math.round(w*k)), ch=Math.max(1,Math.round(h*k));
      const c=document.createElement("canvas"); c.width=cw; c.height=ch; c.getContext("2d").drawImage(img,0,0,cw,ch);
      let nova=c.toDataURL("image/webp",0.82);
      if(!/^data:image\/webp/.test(nova)) continue;     // navegador sem WebP: deixa como está
      if(nova.length<src.length*0.9){ html=html.split(src).join(nova); trocadas++; }
    }catch(e){ /* imagem que não abre: deixa como está */ }
  }
  onProg&&onProg(1);
  const depois=new Blob([html]).size;
  ultimaOtimizacao=trocadas?{antes,depois,trocadas}:null;
  return html;
}
function textoOtimizacao(){ const o=ultimaOtimizacao; return o?`Imagens otimizadas: ${fmtBytes(o.antes)} → ${fmtBytes(o.depois)} (${o.trocadas} ${o.trocadas===1?"imagem":"imagens"}).`:""; }
async function uploadDeck(epId, file, onProg, source){
  if(deckHidden.has(epId)){ clearTimeout(deckHidden.get(epId)); deckHidden.delete(epId); }
  const isPdf=isPdfName(file.name);
  let html;
  if(isPdf){
    if(file.size>60*1024*1024) throw {code:"too_big"};
    html=await pdfToDeck(file,p=>onProg&&onProg(p*0.6));
  } else html=await file.text();
  ultimaOtimizacao=null;
  if(!isPdf && otimizarLigado() && html.length>1e6) html=await optimizeDeckImages(html,p=>onProg&&onProg(p*0.12));
  const P=x=>onProg&&onProg(isPdf?0.6+x*0.4:x);
  const bytes=new Blob([html]).size;
  if(bytes>MAX_BYTES) throw {code:"too_big"};
  const version=Date.now();
  const pelo_link=!!(K_LINK && source==="apresentador");
  const path=pelo_link?epId+"/"+K_LINK+"/"+version+".html":epId+"/"+version+".html";
  const old=await fetchDeckMeta(epId).catch(()=>null);
  P(.15);
  if(pelo_link){
    const {error:u1}=await SB.storage.from("decks").upload(path,new Blob([html],{type:"text/plain;charset=utf-8"}),{upsert:false,contentType:"text/plain;charset=utf-8"});
    if(u1) throw u1;
    P(.75);
    const {error:u2}=await SB.rpc("int_enviar_deck",{p_episode:epId,p_k:K_LINK,p_name:file.name,p_size:bytes,p_path:path,p_version:version});
    if(u2) throw u2;
    onProg&&onProg(1); deckCache[epId]={version,html}; return html;
  }
  const {error:e1}=await SB.storage.from("decks").upload(path,new Blob([html],{type:"text/plain;charset=utf-8"}),{upsert:true,contentType:"text/plain;charset=utf-8"});
  if(e1) throw e1;
  P(.75);
  const row={episode_id:epId,name:file.name,size:bytes,path,version,uploaded_at:new Date().toISOString(),source:source||"equipe"};
  let {error:e2}=await SB.from("decks").upsert(row);
  if(e2 && /source/.test(e2.message||"")){ delete row.source; ({error:e2}=await SB.from("decks").upsert(row)); }
  if(e2) throw e2;
  await setLive(epId,{step:0,at:Date.now(),v:version});
  if(old&&old.reservaPath){ try{ await SB.from("live_state").update({reserva:false}).eq("episode_id",epId); }catch(e){} }
  if(old&&old.path&&old.path!==path){ try{ await SB.storage.from("decks").remove([old.path]); }catch(e){} }
  onProg&&onProg(1);
  deckCache[epId]={version,html};
  return html;
}
async function removeDeck(epId){
  const meta=await fetchDeckMeta(epId);
  if(meta){ const arq=[meta.path,meta.reservaPath].filter(Boolean); if(arq.length){ try{ await SB.storage.from("decks").remove(arq); }catch(e){} } }
  const {error}=await SB.from("decks").delete().eq("episode_id",epId);
  if(error) throw error;
  try{ await SB.from("live_state").delete().eq("episode_id",epId); }catch(e){}
}
/* Instant slide messages and "who is connected", per episode. */
const PEER_ID=uid()+uid();
function openLiveChannel(epId, mode, {onSlide,onPeers,onStatus,onSaude,onCampo,onVideo,onVideoEstado}){
  const ch=SB.channel("akicast-live-"+epId,{config:{broadcast:{self:false},presence:{key:PEER_ID}}});
  let extra={};
  ch.on("broadcast",{event:"slide"},({payload})=>onSlide(payload||{}))
    .on("broadcast",{event:"saude"},({payload})=>onSaude&&onSaude(payload||{}))
    .on("broadcast",{event:"campo"},({payload})=>onCampo&&onCampo(payload||{}))
    .on("broadcast",{event:"video"},({payload})=>onVideo&&onVideo(payload||{}))
    .on("broadcast",{event:"videoEstado"},({payload})=>onVideoEstado&&onVideoEstado(payload||{}))
    .on("presence",{event:"sync"},()=>onPeers(Object.values(ch.presenceState()).flat()))
    .subscribe(async st=>{ onStatus&&onStatus(st); if(st==="SUBSCRIBED"){ try{ await ch.track({mode,...extra}); }catch(e){} } });
  return {
    send:p=>{ try{ ch.send({type:"broadcast",event:"slide",payload:p}); }catch(e){} },
    sendSaude:p=>{ try{ ch.send({type:"broadcast",event:"saude",payload:p}); }catch(e){} },
    sendCampo:p=>{ try{ ch.send({type:"broadcast",event:"campo",payload:p}); }catch(e){} },
    sendVideo:p=>{ try{ ch.send({type:"broadcast",event:"video",payload:p}); }catch(e){} },
    sendVideoEstado:p=>{ try{ ch.send({type:"broadcast",event:"videoEstado",payload:p}); }catch(e){} },
    track:x=>{ extra=x||{}; try{ ch.track({mode,...extra}); }catch(e){} },
    close:()=>{ try{ ch.untrack(); }catch(e){} SB.removeChannel(ch); }
  };
}

/* ---------- Presentations tab ---------- */
let presUnsub=null, presMeta=null, presMetaReal=null, testFrame=null, presLiveUnsub=null, presCover=false;
function renderCoverCtl(){
  const el=$("#coverCtl"); if(!el) return;
  el.innerHTML=`<div class="cover-info"><b>Tela do AkiCast</b><span class="meta">${presCover?"No ar no lugar dos slides.":"Mostra a logo no lugar dos slides, para pausas e imprevistos."}</span></div>
    <button class="btn ${presCover?"primary cover-on":"ghost"}" id="coverToggle" type="button">${presCover?"Voltar aos slides":"Mostrar tela do AkiCast"}</button>`;
  $("#coverToggle").addEventListener("click",async()=>{
    const b=$("#coverToggle"), on=!presCover; b.disabled=true;
    try{
      const cur=await fetchLive(presEpId);
      await setLive(presEpId,{step:cur?cur.step:0,at:Date.now(),cover:on,v:null});
      presCover=on; renderCoverCtl(); toast(on?"Tela do AkiCast no ar.":"Slides de volta na tela.");
    }catch(e){ b.disabled=false; toast("Não foi possível mudar a tela. Confira a conexão."); }
  });
  // Modo leve (sem animações) para esta apresentação, em todas as telas
  el.insertAdjacentHTML("beforeend",`<div class="cover-info leve-info"><b>Modo leve</b><span class="meta">${presLeve?"Ligado: a apresentação roda sem animações nem transições em todas as telas.":"Tira as animações e transições da apresentação. Use se ela ficar lenta ou travar."}</span></div>
    <button class="btn ${presLeve?"primary":"ghost"}" id="leveToggle" type="button" aria-pressed="${presLeve?"true":"false"}">${presLeve?"Desligar modo leve":"Ligar modo leve"}</button>`);
  $("#leveToggle").addEventListener("click",async()=>{
    const b=$("#leveToggle"), v=!presLeve; b.disabled=true;
    const {error}=await SB.from("live_state").update({leve:v}).eq("episode_id",presEpId);
    if(error){ b.disabled=false; toast(/leve|column|schema/i.test(error.message||"")?"Falta rodar o int-modo-leve.sql no Supabase.":"Não foi possível mudar o modo leve. Suba a apresentação primeiro."); return; }
    presLeve=v; renderCoverCtl(); toast(v?"Modo leve ligado em todas as telas.":"Modo leve desligado.");
  });
  // Tela do apresentador: só aparece no controle dele quando a produção liberar
  el.insertAdjacentHTML("beforeend",`<div class="cover-info leve-info"><b>Tela do apresentador</b><span class="meta">${presTela?"Liberada: o apresentador vê \"Compartilhar minha tela\" no controle dele.":"Deixa o apresentador compartilhar a tela do computador dele (sistema, site, arquivo). Desligado, a opção não aparece para ele."}</span></div>
    <button class="btn ${presTela?"primary":"ghost"}" id="telaLibToggle" type="button" aria-pressed="${presTela?"true":"false"}">${presTela?"Desligar tela do apresentador":"Liberar tela do apresentador"}</button>`);
  $("#telaLibToggle").addEventListener("click",async()=>{
    const b=$("#telaLibToggle"), v=!presTela; b.disabled=true;
    const r=await SB.rpc("int_tela",{p_episode:presEpId,p_k:null,p_acao:v?"liberar":"bloquear"});
    if(r.error){ b.disabled=false; toast(/int_tela|tela_liberada|function|schema/i.test(r.error.message||"")?"Falta rodar o int-tela-liberar.sql no Supabase.":(r.error.message||"Não foi possível mudar.")); return; }
    presTela=v; renderCoverCtl(); toast(v?"Tela do apresentador liberada neste episódio.":"Tela do apresentador desligada.");
  });
  if(presTela){
    el.insertAdjacentHTML("beforeend",`<div class="tela-q"><b>Qualidade da tela</b><div class="tela-q-op" role="radiogroup" aria-label="Qualidade da tela">${Object.keys(TELA_Q).map(k=>`<button type="button" role="radio" aria-checked="${presTelaQ===k}" class="${presTelaQ===k?"on":""}" data-tq="${k}">${TELA_Q[k].nome}</button>`).join("")}</div><span class="meta">${esc(TELA_Q[presTelaQ].dica)}</span></div>`);
    el.querySelectorAll("[data-tq]").forEach(b=>b.addEventListener("click",async()=>{
      const k=b.dataset.tq; if(k===presTelaQ) return;
      const r=await SB.rpc("int_tela",{p_episode:presEpId,p_k:null,p_acao:"q_"+k});
      if(r.error){ toast(/int_tela|tela_qualidade|function|schema|inválida/i.test(r.error.message||"")?"Falta rodar o int-tela-qualidade.sql no Supabase.":(r.error.message||"Não foi possível mudar.")); return; }
      presTelaQ=k; renderCoverCtl(); toast(`Qualidade da tela: ${TELA_Q[k].nome}.`);
    }));
  }
}
let presTelaQ="maxima";
let presTela=false;
let presLeve=false;
const deckHidden=new Map();
function presOnEpisodes(){
  const sel=$("#presEp"); if(!sel) return;
  const today=isoDate(new Date());
  const list=episodes.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  if(!list.length){ sel.innerHTML=""; sel.disabled=true; { const pk=$("#ppPick"), ps=$("#ppSel"); if(pk) pk.hidden=true; if(ps) ps.hidden=true; } $("#presBody").innerHTML='<div class="empty"><h2>Crie um episódio primeiro</h2><p>A apresentação fica guardada dentro do episódio. Crie o episódio na aba Episódios.</p></div>'; presSelect(null); return; }
  sel.disabled=false;
  sel.innerHTML=list.map(e=>`<option value="${esc(e.id)}">${esc(fmtShort(e.date))}: ${esc(e.theme||"Tema a definir")}</option>`).join("");
  if(lugarPres){ const id=lugarPres; lugarPres=null; if(list.find(e=>e.id===id)&&id!==presEpId){ lugarRestaurando=true; presSelect(id); lugarRestaurando=false; } }
  if(!presEpId || !list.find(e=>e.id===presEpId)){
    const up=list.filter(e=>(e.date||"")>=today).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    presSelect((up[0]||list[0]).id);
  }
  sel.value=presEpId;
  renderPresCards(); loadPresDecksSoon();
}
let presDeckMap={}, presPastOpen=false, presDeckT=null;
function loadPresDecksSoon(){ clearTimeout(presDeckT); presDeckT=setTimeout(loadPresDecks,300); }
async function loadPresDecks(){
  if(!SB) return;
  const {data,error}=await SB.from("decks").select("episode_id,name");
  if(error) return;
  presDeckMap={}; (data||[]).forEach(d=>presDeckMap[d.episode_id]=d);
  renderPresCards();
}
function presCardHtml(e,past){
  const d=parseDate(e.date), today=isoDate(new Date())===e.date;
  const wd=d?["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][d.getDay()]:"";
  const pres=parsePresenters(e.presenters), deck=presDeckMap[e.id];
  return `<button class="pp-card${e.id===presEpId?" sel":""}${past?" past":""}" type="button" data-pp="${esc(e.id)}" aria-pressed="${e.id===presEpId}">
    <span class="pp-date"><b>${d?d.getDate():"–"}</b><small>${d?MONTHS_S[d.getMonth()]:""}</small></span>
    <span class="pp-main">
      <span class="pp-when">${esc(wd)}${today?' · <em>Hoje</em>':""}</span>
      <span class="pp-theme">${esc(e.theme||"Tema a definir")}</span>
      ${pres.length?`<span class="pp-pres">${esc(pres.join(", "))}</span>`:""}
      <span class="pp-badge ${deck?"ok":"pend"}">${deck?"Apresentação enviada":"Sem apresentação"}</span>
    </span>
  </button>`;
}
function renderPresCards(){
  const upEl=$("#ppUpcoming"), pastEl=$("#ppPast"), btn=$("#ppPastBtn"), selEl=$("#ppSel"); if(!upEl) return;
  const up=episodes.filter(e=>!isPast(e.date)).sort((a,b)=>(a.date||"9").localeCompare(b.date||"9"));
  const past=episodes.filter(e=>isPast(e.date)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("#ppPick").hidden=!episodes.length;
  upEl.innerHTML = up.length ? up.map(e=>presCardHtml(e,false)).join("") : `<p class="meta pp-empty">Nenhum ${esc(PN())} agendado. Crie o próximo na aba Episódios.</p>`;
  if(presEpId && past.some(e=>e.id===presEpId)) presPastOpen=true;
  btn.hidden=!past.length;
  $("#ppPastLbl").textContent=`${PN()}s passados (${past.length})`;
  btn.setAttribute("aria-expanded",presPastOpen?"true":"false");
  btn.querySelector(".closed-chev").classList.toggle("open",presPastOpen);
  pastEl.hidden=!presPastOpen || !past.length;
  pastEl.innerHTML=past.map(e=>presCardHtml(e,true)).join("");
  document.querySelectorAll("#ppPick [data-pp]").forEach(b=>b.addEventListener("click",()=>{ presSelect(b.dataset.pp); const s=$("#presEp"); if(s) s.value=b.dataset.pp; renderPresCards(); }));
  const ep=episodes.find(e=>e.id===presEpId);
  if(ep){
    const wasPast=isPast(ep.date);
    selEl.hidden=false; selEl.className="pp-sel"+(wasPast?" past":"");
    selEl.innerHTML=`<span class="pp-sel-k">Você está vendo</span><b>${esc(fmtLong(ep.date))}</b><span>${esc(ep.theme||"Tema a definir")}</span>${wasPast?`<span class="pp-sel-warn">Este ${esc(PN())} já aconteceu: confira se é a data certa antes de usar os links.</span>`:""}`;
  } else selEl.hidden=true;
}
$("#ppPastBtn").addEventListener("click",()=>{ presPastOpen=!presPastOpen; renderPresCards(); });
window.presOnEpisodes=presOnEpisodes;
$("#presEp").addEventListener("change",e=>presSelect(e.target.value));

function presSelect(id){
  if(id===presEpId && presUnsub) return;
  setTimeout(()=>lugarSalvar("replace"),0);
  ensCancelar();
  presEpId=id; presMeta=undefined;
  presUnsub&&presUnsub(); presUnsub=null;
  if(testFrame){ testFrame.destroy(); testFrame=null; }
  if(!id) return;
  if(!SB){ renderPresBody(); return; }
  renderPresBody();
  if(presLiveUnsub){ try{presLiveUnsub()}catch(e){} } presCover=false;
  presLiveUnsub=watchLive(id, d=>{ if(presEpId!==id) return; presCover=!!(d&&d.cover); presLeve=!!(d&&d.leve); presTela=!!(d&&d.tela&&d.tela.liberada); presTelaQ=(d&&d.tela&&TELA_Q[d.tela.qualidade])?d.tela.qualidade:"maxima"; renderCoverCtl(); });
  presUnsub=watchDeck(id, m=>{ if(presEpId===id){ if(m) presDeckMap[id]={episode_id:id,name:m.name}; else delete presDeckMap[id]; setTimeout(renderPresCards,0); } if(presEpId!==id) return; presMetaReal=m; presMeta=deckHidden.has(id)?null:m; renderPresBody(); });
}

function noArHtml(){
  if(noArOk===false) return `<div class="noar warn"><b>Links fixos do OBS</b><span>Rode o int-episodio-no-ar.sql no Supabase para os links do OBS seguirem o episódio no ar.</span></div>`;
  const id=NO_AR.geral&&NO_AR.geral.episode_id, ep=NO_AR_EP&&NO_AR_EP.id===id?NO_AR_EP:episodes.find(e=>e.id===id);
  const nome=ep?`${esc((PROGRAMS[ep.program||"akicast"]||PROGRAMS.akicast).name)} · ${esc(fmtShort(ep.date))}${ep.theme?" · "+esc(ep.theme):""}`:"";
  const este=!!id&&id===presEpId;
  return `<div class="noar${este?" on":""}${!id?" vazio":""}">
    <div><b>Links fixos: OBS, sala, frases e ouvintes seguem o que está no ar (nos três programas)</b>
      <span>${id?`No ar agora: <b>${nome||"episódio de outro programa"}</b>`:"<b>Nenhum episódio no ar.</b> As telas do OBS mostram um aviso até você escolher um."}</span>
      ${id&&!este?`<span class="meta">Para trocar, clique em “Colocar este no ar” no episódio que vai acontecer.</span>`:""}</div>
    <div class="noar-acts">${este?'<span class="air-pill on"><span class="dotc on"></span>Este está no ar</span><button class="linkbtn" type="button" data-noar="off">Tirar do ar</button>':`<button class="btn primary sm" type="button" data-noar="set">Colocar este no ar</button>`}</div>
  </div>`;
}
async function noArAction(act){
  const r=await SB.rpc("int_definir_no_ar",{p_program:"geral",p_episode:act==="set"?presEpId:null});
  if(r.error){ toast(/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-episodio-no-ar.sql no Supabase.":(r.error.message||"Não foi possível trocar o episódio no ar.")); return; }
  await loadNoAr(); toast(act==="set"?"Pronto: as telas do OBS passam a mostrar este episódio em até 15 segundos.":"Nenhum episódio no ar nos links do OBS."); renderPresBody();
}
function renderPresBody(){
  const body=$("#presBody"); if(!body) return;
  if(!presMeta) ensCancelar();
  if(presEnqStop){ presEnqStop(); presEnqStop=null; }
  if(!SB){
    body.innerHTML='<div class="pres-card"><h2>Supabase não configurado</h2><p class="meta">O controle de apresentações precisa do Supabase para conectar a tela do OBS e o notebook do apresentador. Preencha a URL e a chave no topo do arquivo index.html.</p></div>';
    return;
  }
  if(presMeta===undefined){ body.innerHTML='<p class="status">Carregando…</p>'; return; }
  if(testFrame){ testFrame.destroy(); testFrame=null; }
  const ep=episodes.find(e=>e.id===presEpId);
  const shareRow=(url,label,qrTitle)=>`<div class="share-row"><input class="share-url" readonly value="${esc(url)}" aria-label="${esc(label)}"><button class="btn ghost qr-share" type="button" data-title="${esc(qrTitle)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>QR Code</button><button class="btn primary copy-share" type="button">Copiar link</button></div>`;
  const linkCard=(grp,tag,title,desc,url,label,qr,extra)=>`<div class="lk-card lk-${grp}">
      <div class="lk-top"><span class="lk-ic">${grp==="obs"?ICON_TAB_PRES:grp==="apr"?ICON_MIC_S:grp==="pub"?ICON_TAB_INT:ICON_TAB_HOME}</span><span class="lk-tag">${tag}</span></div>
      <h3>${title}</h3>
      <p class="meta">${desc}</p>
      <div class="share-row lk-actions"><input class="share-url" readonly value="${esc(url)}" aria-label="${esc(label)}"><button class="btn primary copy-share" type="button">Copiar link</button><button class="btn ghost qr-share" type="button" data-title="${esc(qr)}">QR Code</button><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">Abrir</a></div>
      ${extra||""}
    </div>`;
  const share=`<div class="links-wrap">
      <div class="lk-head"><h2>Links da live</h2><p class="meta">Cada link num card, com quem usa em destaque.</p></div>
      ${noArHtml()}
      <div class="lk-grid">
        ${linkCard("obs","Para o OBS · link fixo","Tela de exibição","Os slides. No OBS: Fonte de navegador, 1920 × 1080.",fixLink("exibir"),"Link da tela de exibição","Tela de exibição (OBS)")}
        ${linkCard("obs","Para o OBS · link fixo","Tela de perguntas","Perguntas em destaque ou faixa. Fonte de navegador acima de todas as outras.",fixLink("interacoes"),"Link da tela de perguntas","Tela de perguntas (OBS)")}
        ${linkCard("obs","Para o OBS · link fixo","Tela do QR Code","Retângulo “Venha participar!” no canto, com agenda automática (padrão: 9h00 por 5 min, 9h10, 9h20, 9h35 e 9h50), editável na sala de controle. Fonte de navegador 1920 × 1080, acima das outras.",fixLink("qrcode"),"Link da tela do QR Code","Tela do QR Code (OBS)",`<a class="linkbtn" href="${esc(obsQrLink(presEpId)+"&teste=1")}" target="_blank" rel="noopener">Ver em modo de teste (sempre visível)</a>`)}
        ${linkCard("obs","Para o OBS · link fixo","Tela do apresentador","Só a tela que o apresentador compartilhar pelo controle, com o som. Use se preferir uma cena própria no OBS; sem ela, a sala mostra a tela no lugar dos slides. Fonte de navegador 1920 × 1080.",fixLink("tela"),"Link da tela do apresentador","Tela do apresentador (OBS)")}
        ${linkCard("obs","Para o OBS · link fixo","Capa do episódio","A capa sozinha, em tela cheia e sempre atualizada (número, título e QR Code), sem botões. Fonte de navegador 1920 × 1080.",fixLink("capa","&obs=1"),"Link da capa para o OBS","Capa do episódio")}
        ${linkCard("apr","Para o apresentador","Controle dos slides","Ele abre no computador dele, passa os slides sozinho e pode compartilhar a própria tela.",ctrlLink(presEpId),"Link do controle do apresentador","Aponte a câmera para abrir o controle")}
        ${linkCard("apr","Para o apresentador","Envio da apresentação","Ele envia o HTML ou PDF antes da live e já vê se falta algo.",sendLink(presEpId),"Link de envio para o apresentador","Envio da apresentação")}
        ${linkCard("prod","Para a produção · link fixo","Frase e QR Code","Tela enxuta com frase de destaque, nome na tela e QR Code, sempre na live no ar. Precisa do login da produção.",fixLink("sala","&modo=frase"),"Link da tela de frase e QR Code","Frase e QR Code")}
        ${linkCard("prod","Para a produção · link fixo","Sala de controle","Slide no ar, perguntas, quiz e pontuação numa tela só, sempre na live no ar. Precisa do login da produção.",fixLink("sala"),"Link da sala de controle","Sala de controle",'<button class="btn primary lk-big" id="openSala" type="button">Abrir sala de controle</button>')}
        ${linkCard("pub","Para o público · link fixo","Página dos ouvintes","Perguntas, quiz e votação, sem login. Link fixo: leva sempre à live no ar (bom para cartaz, Teams e e-mail).",fixLink("ouvintes"),"Link para os ouvintes","Aponte a câmera para mandar sua pergunta")}
      </div>
    </div>`;
  const guide=`<div class="pres-card modelo-card"><div class="modelo-box"><div><b>Apresentação para novos apresentadores</b><span class="meta">Mostra como a central funciona, do envio às perguntas do público. Aberta pela central (num teste do AkiTeste), a enquete, os campos, os cartões e o vídeo funcionam de verdade.</span></div><div class="pres-row" style="margin:0"><a class="btn ghost sm" href="modelo/conheca-a-central.html" target="_blank" rel="noopener">Abrir</a><a class="btn ghost sm" href="modelo/conheca-a-central.html" download>Baixar</a></div></div></div><div class="pres-card"><h2>Como usar na live</h2><ol class="steps">
      <li><b>Computador do OBS:</b> abra esta central, escolha o episódio e clique em "Abrir tela de exibição". Coloque o navegador em tela cheia (F11) e capture a janela no OBS.</li>
      <li><b>Notebook do apresentador:</b> ele abre esta mesma central, escolhe o episódio e clica em "Controlar apresentação".</li>
      <li>Quando a tela do OBS estiver aberta, o controle mostra "Tela de exibição conectada". A partir daí, cada clique do apresentador muda o slide no OBS.</li>
      <li>Tenha um passador de slides por perto como plano B.</li>
    </ol></div>`;
  if(!presMeta){
    body.innerHTML=`<div class="pres-card">
      <h2>Arquivo da apresentação</h2>
      <p class="meta">Nenhuma apresentação enviada para ${esc(ep?fmtShort(ep.date):"este episódio")} ainda.</p>
      <label class="upload" id="upBox" style="margin-top:14px">
        <input type="file" id="upInput" accept=".html,.htm,.pdf,text/html,application/pdf">
        <b>Enviar apresentação (HTML ou PDF)</b>
        <span>Clique para escolher ou arraste o arquivo para cá</span>
      </label>
      <div class="progress-up" id="upProg" hidden><i></i></div>
      <label class="otz-chk"><input type="checkbox" data-otimizar ${otimizarLigado()?"checked":""}> Otimizar imagens grandes (recomendado: deixa a apresentação mais leve)</label>
    </div>${share}${guide}`;
    wireUpload(); wireShare(); wireNoAr();
    { const os=$("#openSala"); if(os) os.addEventListener("click",()=>openSala(presEpId)); }
    return;
  }
  body.innerHTML=`<div class="pres-grid">
    <div class="pres-card">
      <h2>${esc(presMeta.name||"Apresentação")}</h2>
      <p class="meta">${fmtBytes(presMeta.size||0)}, enviada em ${esc(fmtWhen(presMeta.uploadedAt))}${isPdfName(presMeta.name)?'<span class="src-tag">PDF</span>':""}${presMeta.source==="apresentador"?'<span class="src-tag">pelo apresentador</span>':""}</p>
      <div class="warns" id="presWarns"><p class="status">Conferindo o arquivo…</p></div>
      <div class="pres-row">
        <button class="btn primary" id="openCtrl">Controlar apresentação</button>
        <button class="btn ghost" id="openDisp">Abrir tela de exibição</button>
      </div>
      <div class="cover-ctl" id="coverCtl"></div>
      <div class="pres-row">
        <label class="btn ghost" style="position:relative">Trocar arquivo<input type="file" id="upInput" accept=".html,.htm,.pdf,text/html,application/pdf" style="position:absolute;opacity:0;width:1px;height:1px"></label>
        <button class="linkbtn" id="rmDeck">Remover apresentação</button>
      </div>
      <div class="progress-up" id="upProg" hidden><i></i></div>
      <label class="otz-chk"><input type="checkbox" data-otimizar ${otimizarLigado()?"checked":""}> Otimizar imagens grandes (recomendado: deixa a apresentação mais leve)</label>
      <div class="reserva-box" id="reservaBox"></div>
    </div>
    <div class="pres-card">
      <h2>Testar aqui</h2>
      <p class="meta">Navegue pelo arquivo antes da live. Isto não muda o que está no ar.</p>
      <div class="thumb" id="testThumb" style="margin-top:12px"><div class="empty-t">Carregando…</div></div>
      <div class="test-nav"><button class="btn ghost" id="tPrev">Anterior</button><button class="btn ghost" id="tNext">Próximo</button><span id="tCount"></span></div>
    </div>
  </div><div id="enqCard"></div><div id="vidCard"></div>${share}${guide}`;
  wireShare(); wireNoAr();
  { const os=$("#openSala"); if(os) os.addEventListener("click",()=>openSala(presEpId)); }
  $("#openCtrl").addEventListener("click",()=>openController(presEpId));
  renderCoverCtl();
  $("#openDisp").addEventListener("click",()=>openDisplay(presEpId));
  $("#rmDeck").addEventListener("click",()=>{
    if(!confirmInline($("#rmDeck"),"Remover de vez?")) return;
    const id=presEpId;
    deckHidden.set(id, setTimeout(()=>{ deckHidden.delete(id); removeDeck(id).catch(handleErr); },7000));
    presMeta=null; renderPresBody();
    toastAction("Apresentação removida.","Desfazer",()=>{
      clearTimeout(deckHidden.get(id)); deckHidden.delete(id);
      if(presEpId===id){ presMeta=presMetaReal; renderPresBody(); }
      toast("Remoção desfeita.");
    });
  });
  wireUpload();
  const epId=presEpId, meta=presMeta;
  renderReservaBox($("#reservaBox"),meta,epId,"equipe");
  loadDeckHtml(epId,meta).then(html=>{
    if(presEpId!==epId || presMeta!==meta) return;
    const w=scanDeck(html);
    $("#presWarns").innerHTML = w.length ? w.map(x=>`<div class="warn">${esc(x)}</div>`).join("") : '<div class="okmsg">Arquivo autocontido: nada externo foi encontrado.</div>';
    const th=$("#testThumb"); th.innerHTML="";
    testFrame=new DeckFrame(th); testFrame.load(html);
    renderEnqCard(epId,meta,html);
    renderVideoCard($("#vidCard"),epId,meta,html,"equipe");
    videoUrls(meta).then(u=>{ if(testFrame&&presMeta===meta) testFrame.setVideos(u,true); }).catch(()=>{});
    ensMostrar({apos:"#presBody",epId,meta,html,salvar:true,auto:true});
    const P=deckStarts(html);
    if(P) conferirReserva(epId,meta,P.length);
    const upd=f=>{ $("#tCount").textContent = contagem(f); if(!P&&f.total) conferirReserva(epId,meta,f.total); };
    testFrame.onReport=upd;
    $("#tNext").onclick=()=>{ if(testFrame.total && testFrame.pos>=testFrame.total-1) return; testFrame.setTarget((testFrame.pos||0)+1); };
    $("#tPrev").onclick=()=>testFrame.setTarget(Math.max(0,(testFrame.pos||0)-1));
  }).catch(()=>{ const pw=$("#presWarns"); if(pw) pw.innerHTML='<div class="warn">Não foi possível carregar o arquivo. Recarregue a página ou envie o HTML de novo.</div>'; });
}

/* =================== Ensaio automático ===================
   Depois de subir a apresentação, a central passa por todos os slides numa tela própria e mostra um relatório:
   se abriu, quantos slides e passos, se travou, quais slides demoram, se volta ao início, enquetes e PDF de reserva.
   Na aba Apresentações o resultado fica salvo (decks.ensaio) e o ensaio roda de novo a cada versão nova do arquivo. */
const ENS={atual:null};
const ENS_LENTO=1200, ENS_ESPERA=6000;
function ensEsperar(cond,ms){ return new Promise(res=>{ const t0=Date.now(); const iv=setInterval(()=>{ if(cond()){ clearInterval(iv); res(true); } else if(Date.now()-t0>ms){ clearInterval(iv); res(false); } },40); }); }
function ensBox(apos){
  const ref=$(apos); if(!ref) return null;
  let b=document.getElementById("ensaioBox");
  if(!b){ b=document.createElement("div"); b.id="ensaioBox"; }
  if(b.previousElementSibling!==ref) ref.after(b);
  return b;
}
function ensCancelar(){ const A=ENS.atual; if(A&&A.estado==="rodando"){ A.cancelado=true; } if(A&&A.frame){ try{ A.frame.destroy(); }catch(e){} A.frame=null; } ENS.atual=null; const b=document.getElementById("ensaioBox"); if(b) b.innerHTML=""; }
/* Mostra o cartão; roda sozinho se esta versão ainda não foi ensaiada */
function ensMostrar(ctx){
  // ctx: {apos, epId, meta, html, salvar, auto}
  const box=ensBox(ctx.apos); if(!box) return;
  const chave=ctx.epId+":"+ctx.meta.version;
  const A=ENS.atual;
  if(A&&A.chave!==chave) ensCancelar();
  if(ENS.atual&&ENS.atual.chave===chave){ ENS.atual.ctx=ctx; if(ENS.atual.estado!=="rodando") ensDesenhar(); return; }
  const salvo=ctx.meta.ensaio&&ctx.meta.ensaio.version===ctx.meta.version?ctx.meta.ensaio:null;
  ENS.atual={chave,ctx,estado:salvo?"pronto":"novo",rel:salvo};
  if(!salvo&&ctx.auto) ensRodar(); else ensDesenhar();
}
async function ensRodar(){
  const A=ENS.atual; if(!A||A.estado==="rodando") return;
  const {html,meta,epId}=A.ctx;
  A.estado="rodando"; A.passo=0; A.total=null; A.cancelado=false; A.segundoPlano=document.hidden;
  const vis=()=>{ if(document.hidden) A.segundoPlano=true; }; document.addEventListener("visibilitychange",vis);
  ensDesenhar();
  const host=document.querySelector("#ensaioBox .ens-thumb"); if(!host){ A.estado="novo"; return; }
  host.innerHTML="";
  const f=new DeckFrame(host); A.frame=f;
  const rel={version:meta.version,em:new Date().toISOString(),tamanho:meta.size||0,lentos:[]};
  const t0=performance.now(); f.load(html);
  const abriu=await ensEsperar(()=>A.cancelado||f.ready,20000);
  if(A.cancelado) return;
  rel.abriuMs=Math.round(performance.now()-t0); rel.abriu=abriu&&f.ready;
  if(rel.abriu){
    await ensEsperar(()=>A.cancelado||f.pos!=null,3000);
    rel.navega=f.pos!=null;
    if(rel.navega){
      let i=f.pos; const max=400;
      A.total=f.total||null;
      while(!A.cancelado&&i<max){
        if(f.total&&i>=f.total-1) break;
        const alvo=i+1, ts=performance.now(); f.setTarget(alvo);
        const chegou=await ensEsperar(()=>A.cancelado||f.pos===alvo||(f.total&&alvo>f.total-1),ENS_ESPERA);
        if(A.cancelado) return;
        const dt=performance.now()-ts;
        if(!chegou||f.pos!==alvo){
          if(f.total&&alvo>f.total-1) break;                 // passou do fim
          if(!f.total&&f.pos===i){ rel.fimSemTotal=true; break; } // sem total: parou = chegou ao fim
          rel.travouNoPasso=alvo+1; break;
        }
        if(dt>ENS_LENTO) rel.lentos.push({passo:alvo+1,ms:Math.round(dt)});
        i=alvo; A.passo=i+1; A.total=f.total||A.total; ensProgresso();
      }
      rel.passos=(f.total||i+1);
      rel.chegouAoFim=!rel.travouNoPasso;
      if(!A.cancelado){ f.setTarget(0); rel.voltou=await ensEsperar(()=>A.cancelado||f.pos===0,8000)&&f.pos===0; }
    }
  }
  if(A.cancelado) return;
  document.removeEventListener("visibilitychange",vis);
  rel.segundoPlano=!!A.segundoPlano;
  // slides (decks com animação têm vários passos por slide)
  const P=deckStarts(html); rel.slides=P?P.length:(isPdfName(meta.name)?rel.passos:null);
  // enquetes
  const vz=videosDoHtml(html); rel.videos=vz.length; rel.videosOk=vz.filter(z=>meta.videos&&meta.videos[z.k]).length;
  const enq=enquetesDoHtml(html); rel.enquetes=enq.length; rel.enquetesLigadas=(meta.enquetes||[]).slice(0,enq.length).filter(Boolean).length;
  // PDF de reserva
  rel.reserva=!!meta.reservaPath;
  if(meta.reservaPath){ try{ rel.reservaPaginas=paginasPdf(await loadReservaHtml(epId,meta)); }catch(e){} }
  rel.pdf=isPdfName(meta.name);
  try{ f.destroy(); }catch(e){} A.frame=null;
  A.rel=rel; A.estado="pronto"; ensDesenhar();
  if(A.ctx.salvar){ const {error}=await SB.from("decks").update({ensaio:rel}).eq("episode_id",epId); if(error&&!/ensaio|column|schema/i.test(error.message||"")) console.warn("ensaio não salvo:",error.message); }
}
function ensProgresso(){
  const A=ENS.atual; const el=document.querySelector("#ensaioBox [data-ens-prog]"); if(!A||!el) return;
  const t=A.total; el.querySelector("b").textContent=t?`Passo ${A.passo} de ${t}`:`Passo ${A.passo}`;
  const bar=el.querySelector("i"); if(bar) bar.style.width=t?Math.round(A.passo/t*100)+"%":"30%";
}
const ensSeg=ms=>(ms/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" s";
function ensItens(r){
  const it=[]; const ok=(t)=>it.push({k:"ok",t}), at=(t)=>it.push({k:"warn",t}), er=(t)=>it.push({k:"bad",t});
  if(!r.abriu){ er("A apresentação não terminou de abrir em 20 s. Ela pode ser pesada demais ou ter um erro."); return it; }
  (r.abriuMs>5000?at:ok)(`Abriu em ${ensSeg(r.abriuMs)}.`);
  if(!r.navega){ er("A central não conseguiu acompanhar a passagem de slides deste arquivo. O controle do apresentador pode não funcionar; peça o PDF de reserva."); }
  else{
    const sl=r.slides&&r.slides!==r.passos?`${r.slides} slides (${r.passos} passos, contando as animações)`:`${r.passos} ${r.passos===1?"slide":"slides"}`;
    if(r.travouNoPasso) er(`Parou de avançar no passo ${r.travouNoPasso}${r.passos?" de "+r.passos:""}. Confira esse slide no "Testar aqui".`);
    else ok(`Passou por todos: ${sl}.`);
    if(r.lentos&&r.lentos.length){ const l=r.lentos.slice(0,6).map(x=>`${x.passo} (${ensSeg(x.ms)})`).join(", "); at(`${r.lentos.length===1?"Um passo demora":r.lentos.length+" passos demoram"} para aparecer: ${l}${r.lentos.length>6?"…":""}. Se travar na live, use o modo leve.`); }
    else if(!r.travouNoPasso) ok("Nenhum slide lento.");
    if(r.voltou===false) at("Não voltou ao primeiro slide sozinho. Na live, volte pelo controle antes de começar.");
    else if(r.voltou) ok("Volta ao início sem problemas.");
  }
  if(r.tamanho>3e6) at(`Arquivo pesado (${fmtBytes(r.tamanho)}): na live ele abre em várias telas ao mesmo tempo.`);
  if(r.videos){ if(r.videosOk>=r.videos) ok(r.videos===1?"Vídeo enviado para a área de vídeo.":`Vídeos enviados para as ${r.videos} áreas de vídeo.`);
    else at(`${r.videos-r.videosOk===1?"Uma área de vídeo está":(r.videos-r.videosOk)+" áreas de vídeo estão"} sem vídeo: envie no cartão "Vídeos da apresentação".`); }
  if(r.enquetes){ if(r.enquetesLigadas>=r.enquetes) ok(r.enquetes===1?"Enquete conectada à votação do sistema.":`${r.enquetes} enquetes conectadas à votação do sistema.`);
    else at(`${r.enquetes===1?"A enquete do arquivo não está conectada":(r.enquetes-r.enquetesLigadas)+" de "+r.enquetes+" enquetes não estão conectadas"}: o público não vai conseguir votar pela plataforma. Conecte no cartão "Enquete conectada".`); }
  if(!r.pdf){
    if(!r.reserva) at("Sem PDF de reserva. Recomendado para trocar na hora se o HTML travar.");
    else if(r.reservaPaginas&&r.slides&&r.reservaPaginas!==r.slides) at(`PDF de reserva com ${r.reservaPaginas} páginas e HTML com ${r.slides} slides: confira se é a mesma versão.`);
    else ok("PDF de reserva enviado"+(r.reservaPaginas?` (${r.reservaPaginas} páginas)`:"")+".");
  }
  if(r.segundoPlano) at("A aba ficou em segundo plano durante o ensaio, então os tempos podem estar maiores que o real.");
  return it;
}
function ensDesenhar(){
  const A=ENS.atual, box=document.getElementById("ensaioBox"); if(!A||!box) return;
  if(A.estado==="rodando"){
    if(box.querySelector(".ens-thumb")&&box.dataset.estado==="rodando") return;
    box.dataset.estado="rodando";
    box.innerHTML=`<div class="pres-card ens-card"><div class="ens-head"><h2>Ensaio automático</h2><button class="linkbtn" type="button" data-ens-parar>Parar</button></div>
      <p class="meta">A central está passando por todos os slides numa tela própria. Isto não muda o que está no ar.</p>
      <div class="ens-run"><div class="thumb ens-thumb"></div><div class="ens-prog" data-ens-prog><b>Abrindo a apresentação…</b><span class="ens-bar"><i style="width:4%"></i></span></div></div></div>`;
    box.querySelector("[data-ens-parar]").addEventListener("click",()=>{ A.cancelado=true; if(A.frame){ try{ A.frame.destroy(); }catch(e){} A.frame=null; } A.estado=A.rel?"pronto":"novo"; ensDesenhar(); });
    return;
  }
  box.dataset.estado=A.estado;
  if(A.estado==="novo"){
    box.innerHTML=`<div class="pres-card ens-card"><div class="ens-head"><h2>Ensaio automático</h2></div>
      <p class="meta">Passa por todos os slides e confere se a apresentação está pronta para a live: travamentos, slides lentos, volta ao início, enquetes e PDF de reserva.</p>
      <div class="pres-row"><button class="btn primary sm" type="button" data-ens-rodar>Ensaiar agora</button></div></div>`;
  } else {
    const it=ensItens(A.rel), bad=it.filter(x=>x.k==="bad").length, warn=it.filter(x=>x.k==="warn").length;
    const veredito=bad?{c:"bad",t:"Precisa de ajuste antes da live"}:warn?{c:"warn",t:warn===1?"Pronta, com 1 ponto de atenção":`Pronta, com ${warn} pontos de atenção`}:{c:"ok",t:"Pronta para a live"};
    box.innerHTML=`<div class="pres-card ens-card"><div class="ens-head"><h2>Ensaio automático</h2><span class="meta">${esc(fmtWhen(A.rel.em))}</span></div>
      <div class="ens-veredito v-${veredito.c}">${veredito.t}</div>
      <ul class="ens-lista">${it.map(x=>`<li class="ens-${x.k}"><span class="ens-ic" aria-hidden="true">${x.k==="ok"?"✓":"!"}</span><span>${esc(x.t)}</span></li>`).join("")}</ul>
      <div class="pres-row"><button class="btn ghost sm" type="button" data-ens-rodar>Ensaiar de novo</button></div></div>`;
  }
  const b=box.querySelector("[data-ens-rodar]"); if(b) b.addEventListener("click",()=>ensRodar());
}
/* Cartão "Enquete conectada" na aba Apresentações */
let presEnqStop=null;
const ENQ_ESTADO={rascunho:"ainda não aberta",aberta:"aberta para o público",encerrada:"encerrada"};
async function renderEnqCard(epId,meta,html){
  const box=$("#enqCard"); if(!box) return;
  const achadas=enquetesDoHtml(html);
  if(!achadas.length){ box.innerHTML=""; return; }
  box.innerHTML=`<div class="pres-card enq-card"><h2>Enquete conectada</h2><p class="status">Conferindo as votações do episódio…</p></div>`;
  let acts=[];
  try{ let r=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,tipo").eq("episode_id",epId);
    if(r.error && /tipo/.test(r.error.message||"")) r=await SB.from("int_atividades").select("id,pergunta,opcoes,estado").eq("episode_id",epId);
    acts=r.data||[]; }catch(e){ acts=[]; }
  if(presEpId!==epId||!presMeta||presMeta.version!==meta.version) return;
  meta=presMeta;
  const box2=$("#enqCard"); if(!box2) return;
  const ligadas=meta.enquetes||[], byId={}; acts.forEach(a=>byId[a.id]=a);
  const item=(e,i)=>{
    const id=ligadas[i], a=id&&byId[id], n=e.opcoes.length;
    const ops=`<ol class="enq-ops">${e.opcoes.map(o=>`<li>${esc(o||"(sem texto)")}</li>`).join("")}</ol>`;
    const head=`<p class="enq-q"><b>${esc(e.pergunta||"Enquete sem título")}</b><span class="meta"> · ${n} opções</span></p>${ops}`;
    if(n>QZ_LETTERS.length) return `<div class="enq-item">${head}<div class="warn">A votação do sistema aceita até ${QZ_LETTERS.length} opções. Esta enquete tem ${n}.</div></div>`;
    if(a) return `<div class="enq-item on">${head}<div class="okmsg">Conectada à votação “${esc(a.pergunta)}”, ${esc(ENQ_ESTADO[a.estado]||a.estado)}. Quando o slide da enquete ficar 3 s no ar, a sala pergunta se quer abrir a votação (ou abra pela sala, como sempre). O slide mostra as porcentagens ao vivo e deixa de aceitar cliques e teclas.</div>
      <div class="pres-row"><button class="linkbtn" type="button" data-enq-off="${i}">Desconectar</button></div></div>`;
    const compat=acts.filter(x=>(x.tipo||"enquete")==="enquete" && qzOpts(x).length===n);
    return `<div class="enq-item">${head}${id?'<div class="warn">A votação conectada antes foi apagada. Conecte de novo.</div>':""}
      <div class="pres-row"><button class="btn primary sm" type="button" data-enq-new="${i}">Criar votação no sistema e conectar</button>
      ${compat.length?`<select class="enq-sel" data-enq-sel="${i}" aria-label="Votação existente"><option value="">ou escolha uma votação existente…</option>${compat.map(x=>`<option value="${esc(x.id)}">${esc(x.pergunta)}</option>`).join("")}</select>`:""}</div></div>`;
  };
  box2.innerHTML=`<div class="pres-card enq-card"><h2>Enquete conectada</h2>
    <p class="meta">${achadas.length===1?"Encontramos uma enquete nesta apresentação.":"Encontramos "+achadas.length+" enquetes nesta apresentação."} Conectada à votação do sistema, o público vota pela plataforma e a contagem sobe sozinha no slide, em todas as telas. O slide mostra porcentagens, sem a quantidade de votos.</p>
    ${achadas.map(item).join("")}</div>`;
  const salvar=async lista=>{
    const {error}=await SB.from("decks").update({enquetes:lista}).eq("episode_id",epId);
    if(error){ toast(/enquetes|column|schema/i.test(error.message||"")?"Falta rodar o int-enquete-conectada.sql no Supabase.":"Não foi possível salvar a conexão."); return false; }
    return true;
  };
  const com=(i,id)=>{ const l=achadas.map((_,k)=>ligadas[k]||null); l[i]=id; return l; };
  box2.querySelectorAll("[data-enq-new]").forEach(b=>b.addEventListener("click",async()=>{
    const i=+b.dataset.enqNew, e=achadas[i]; b.disabled=true;
    const id=uuidv4();
    const row={id,episode_id:epId,tipo:"enquete",grafico:"barras",pergunta:e.pergunta||"Enquete",opcoes:e.opcoes.map((t,k)=>({id:"abcde"[k],t:t||("Opção "+(k+1))})),correta:null,explicacao:"",ordem:5+i};
    let {error}=await SB.from("int_atividades").insert(row);
    if(error && /tipo|grafico/.test(error.message||"")){ delete row.tipo; delete row.grafico; ({error}=await SB.from("int_atividades").insert(row)); }
    if(error){ b.disabled=false; handleErr(error); return; }
    if(await salvar(com(i,id))) toast("Votação criada e conectada ao slide. Abra pela sala na hora da enquete."); else b.disabled=false;
  }));
  box2.querySelectorAll("[data-enq-sel]").forEach(s=>s.addEventListener("change",async()=>{ if(!s.value) return; s.disabled=true; if(await salvar(com(+s.dataset.enqSel,s.value))) toast("Enquete conectada."); else s.disabled=false; }));
  box2.querySelectorAll("[data-enq-off]").forEach(b=>b.addEventListener("click",async()=>{ if(!confirmInline(b,"Desconectar?")) return; if(await salvar(com(+b.dataset.enqOff,null))) toast("Enquete desconectada: o slide volta ao modo manual."); }));
  if(ligadas.some(Boolean) && testFrame){ const f=testFrame; presEnqStop=enqPoller(()=>presEpId===epId&&presMeta?presMeta.enquetes:[],()=>testFrame===f?[f]:[],epId); }
}
/* Bloco "PDF de reserva" (aba Apresentações e página do apresentador) */
function renderReservaBox(box,meta,epId,source){
  if(!box) return;
  if(isPdfName(meta.name)){ box.innerHTML=""; return; }
  const ap=source==="apresentador", tem=!!meta.reservaPath;
  const info=tem
    ? `<div class="okmsg">PDF de reserva: <b>${esc(meta.reservaName||"reserva.pdf")}</b> (${fmtBytes(meta.reservaSize||0)}), enviado em ${esc(fmtWhen(meta.reservaAt))}${!ap&&meta.reservaSource==="apresentador"?'<span class="src-tag">pelo apresentador</span>':""}.</div><div class="reserva-check" id="${ap?"s":""}reservaCheck"></div>`
    : `<p class="meta">${ap?"Exporte esta mesma apresentação em PDF e envie aqui. Se o HTML der problema na live, a equipe troca para o PDF no mesmo slide, sem parar a sua fala.":"Peça ao apresentador a mesma apresentação em PDF. Se o HTML travar na live, a sala troca todas as telas para o PDF no mesmo slide."}</p>`;
  box.innerHTML=`${ap?"":"<b>PDF de reserva</b>"}${info}
    <div class="pres-row">
      <label class="btn ghost sm" style="position:relative">${tem?"Trocar PDF de reserva":"Enviar PDF de reserva"}<input type="file" accept=".pdf,application/pdf" data-reserva-input style="position:absolute;opacity:0;width:1px;height:1px"></label>
      ${tem&&!ap?'<button class="linkbtn" type="button" data-reserva-rm>Remover PDF de reserva</button>':""}
    </div>
    <div class="progress-up" data-reserva-prog hidden><i></i></div>`;
  const inp=box.querySelector("[data-reserva-input]"), pr=box.querySelector("[data-reserva-prog]");
  inp.addEventListener("change",async()=>{
    const file=inp.files[0]; if(!file) return;
    if(!isPdfName(file.name)){ toast("O arquivo de reserva precisa ser um PDF."); inp.value=""; return; }
    toast("Convertendo o PDF de reserva…"); pr.hidden=false; const bar=pr.querySelector("i");
    try{ await uploadReserva(epId,file,p=>bar.style.width=(p*100)+"%",source); toast("PDF de reserva enviado."); }
    catch(e){
      if(e&&e.code==="too_big") toast("O PDF passa do limite. Exporte com imagens menores.");
      else if(e&&e.code==="sem_deck") toast("Envie a apresentação principal antes do PDF de reserva.");
      else if(ap) toast("Não foi possível enviar"+(e&&e.message?": "+e.message:". Tente de novo."));
      else handleErr(e);
    }finally{ pr.hidden=true; inp.value=""; }
  });
  const rm=box.querySelector("[data-reserva-rm]");
  if(rm) rm.addEventListener("click",async()=>{ if(!confirmInline(rm,"Remover de vez?")) return; try{ await removeReserva(epId); toast("PDF de reserva removido."); }catch(e){ handleErr(e); } });
}
/* Compara o número de slides do HTML com as páginas do PDF */
const reservaConferida={};
function conferirReserva(epId,meta,slides){
  if(!meta||!meta.reservaPath||!slides) return;
  const chave=epId+":"+meta.version+":"+meta.reservaVersion+":"+slides, el0=$("#reservaCheck")||$("#sreservaCheck");
  const feito=reservaConferida[epId];
  if(feito&&feito.chave===chave){ if(el0&&!el0.innerHTML&&feito.html) el0.innerHTML=feito.html; return; }
  reservaConferida[epId]={chave,html:""};
  loadReservaHtml(epId,meta).then(html=>{
    const pg=paginasPdf(html), el=$("#reservaCheck")||$("#sreservaCheck"); if(!pg) return;
    const out = pg===slides
      ? `<p class="meta">O HTML e o PDF têm ${slides} slides: a troca cai no slide certo.</p>`
      : `<div class="warn">O HTML tem ${slides} slides e o PDF tem ${pg} páginas. A troca usa o número do slide, então confira se é a mesma versão da apresentação.</div>`;
    reservaConferida[epId]={chave,html:out}; if(el) el.innerHTML=out;
  }).catch(()=>{});
}
function sendLink(epId){ const k=LINKS[epId]&&LINKS[epId].envio; if(k&&linkCurtoOk) return location.origin+location.pathname+"?e="+encodeURIComponent(k); return location.origin+location.pathname+"?enviar="+encodeURIComponent(epId)+(k?"&k="+k:""); }
function ctrlLink(epId){ const k=LINKS[epId]&&LINKS[epId].controle; if(k&&linkCurtoOk) return location.origin+location.pathname+"?c="+encodeURIComponent(k); return location.origin+location.pathname+"?controle="+encodeURIComponent(epId)+(k?"&k="+k:""); }
async function linkValido(epId,tipo){
  const r=await SB.rpc("int_link_ok",{p_episode:epId,p_k:K_LINK,p_tipo:tipo});
  if(r.error) return true;   // banco ainda sem o SQL de segurança: segue como antes
  return !!r.data;
}
function dispLink(epId){ return location.origin+location.pathname+"?exibir="+encodeURIComponent(epId); }
function wireNoAr(){ document.querySelectorAll("#presBody [data-noar]").forEach(b=>b.addEventListener("click",()=>{ b.disabled=true; noArAction(b.dataset.noar); })); }
function wireShare(){
  document.querySelectorAll(".share-row").forEach(row=>{
    const inp=row.querySelector(".share-url"), b=row.querySelector(".copy-share"), q=row.querySelector(".qr-share");
    if(q) q.addEventListener("click",()=>showQr(inp.value,q.dataset.title));
    inp.addEventListener("focus",()=>inp.select());
    b.addEventListener("click",async()=>{
      try{ await navigator.clipboard.writeText(inp.value); b.textContent="Link copiado"; b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }
      catch(e){ inp.focus(); inp.select(); b.textContent="Copie o link selecionado"; }
      setTimeout(()=>{ if(b.isConnected) b.textContent="Copiar link"; },2200);
    });
  });
}
function confirmInline(btn,msg){
  if(btn.dataset.armed){ return true; }
  btn.dataset.armed="1"; const old=btn.textContent; btn.textContent=msg;
  setTimeout(()=>{ if(btn.isConnected){ delete btn.dataset.armed; btn.textContent=old; } },4000);
  return false;
}

function wireUpload(){
  const inp=$("#upInput"); if(!inp) return;
  const go=async file=>{
    if(!file) return;
    if(isPptName(file.name)){ showPptHelp(file.name); if(inp) inp.value=""; return; }
    if(!/\.(html?|pdf)$/i.test(file.name)){ toast("Envie um arquivo .html ou .pdf."); return; }
    if(isPdfName(file.name)) toast("Convertendo o PDF em slides…");
    const pr=$("#upProg"); pr.hidden=false; const bar=pr.querySelector("i");
    try{
      await uploadDeck(presEpId,file,p=>bar.style.width=(p*100)+"%");
      toast("Apresentação enviada."+(ultimaOtimizacao?" "+textoOtimizacao():""));
    }catch(e){
      if(e&&e.code==="too_big") toast("O arquivo passa de 25 MB. Peça uma versão com imagens menores.");
      else handleErr(e);
    }finally{ pr.hidden=true; inp.value=""; }
  };
  inp.addEventListener("change",()=>go(inp.files[0]));
  const box=$("#upBox");
  if(box){
    box.addEventListener("dragover",e=>{e.preventDefault();box.classList.add("drag")});
    box.addEventListener("dragleave",()=>box.classList.remove("drag"));
    box.addEventListener("drop",e=>{e.preventDefault();box.classList.remove("drag");go(e.dataTransfer.files[0])});
  }
}

/* ---------- Live session shared by display and controller ---------- */
let live=null; // {epId, mode, frames:[], unsubs:[], lastAt, step, total}
function startLive(epId, mode, setup){
  stopLive();
  live={epId,mode,frames:[],unsubs:[],lastAt:0,step:0,cover:false,total:null,deckV:null,peers:[],conn:"connecting"};
  const L=live;
  setup(L);
  wantWake(true);
  const resync=()=>{ if(live!==L) return; fetchLive(epId).then(d=>{ if(live!==L) return; setConn(L,"ok"); if(d) applyState(d); kickWriter(); }).catch(()=>setConn(L,"off")); };
  L.resync=resync;
  const onOnline=()=>resync(), onOffline=()=>setConn(L,"off"), onVis=()=>{ if(!document.hidden) resync(); };
  addEventListener("online",onOnline); addEventListener("offline",onOffline); document.addEventListener("visibilitychange",onVis);
  const poll=setInterval(()=>{ if(L.mode==="display"||!document.hidden) resync(); }, L.mode==="display"?30000:45000);
  L.unsubs.push(()=>{ removeEventListener("online",onOnline); removeEventListener("offline",onOffline); document.removeEventListener("visibilitychange",onVis); clearInterval(poll); });
  L.unsubs.push(watchDeck(epId, meta=>{
    if(live!==L) return;
    if(!meta){ L.deckV=null; L.meta=null; L.loadedKey=null; liveNoDeck(); renderReserva(); return; }
    L.deckV=meta.version; L.meta=meta; renderReserva(); liveLoadDeck(L); videosAplicar(L);
    if(!L.enqStop){ L.enqStop=enqPoller(()=>live===L&&L.meta&&!L.usingReserva?L.meta.enquetes:[],()=>live===L?liveFrames():[],L.epId); L.unsubs.push(()=>L.enqStop()); }
  }));
  L.unsubs.push(watchLive(epId, d=>{ if(live!==L||!d) return; applyState(d); }));
  L.chan=openLiveChannel(epId, mode, {
    onSlide:d=>{ if(live!==L) return; if(typeof d.step==="number") applyState(d); },
    onPeers:list=>{ if(live!==L) return; L.peers=list; renderConn(); videoPainel(); },
    onSaude:d=>{ if(live!==L) return; saudeRecebida(L,d); },
    onCampo:d=>{ if(live!==L) return; camposRemoto(L,d); },
    onVideo:d=>{ if(live!==L||!d.k) return; liveFrames().forEach(f=>f.postVideo(d)); },
    onVideoEstado:d=>{ if(live!==L||!d.k) return; (L.videoRemoto=L.videoRemoto||{})[d.k]={...(L.videoRemoto[d.k]||{}),...d,em:Date.now()}; videoPainel(); },
    onStatus:st=>{
      if(live!==L) return;
      if(st==="SUBSCRIBED"){ const was=L.conn; setConn(L,"ok"); if(was==="off") resync(); }
      else if(st==="CHANNEL_ERROR"||st==="TIMED_OUT"||st==="CLOSED") setConn(L,"off");
    }
  });
  L.unsubs.push(()=>L.chan.close());
  if(L.mode==="display") L.unsubs.push(vigiaTela(L));
}
/* ---------- Vigia da tela de exibição (OBS) ----------
   A cada 4 s a tela "cutuca" a apresentação. Se ela não responder por 8 s (travou), não abrir em 25 s,
   ou ficar mais de 8 s num slide diferente do que está no ar, a tela recarrega sozinha no slide certo
   e avisa a sala. No máximo 3 recargas automáticas a cada 3 minutos, para não entrar em ciclo. */
function vigiaTela(L){
  let n=0, semResp=0, foraDesde=0, relato="", recargas=[], foraTentado=null;
  const iv=setInterval(()=>{
    const fr=live===L&&L.frames&&L.frames[0]; if(!fr||!fr.html) return;
    if(fr.ready){ if(fr.pingPend) semResp++; else semResp=0; fr.pingPend=++n; try{ fr.iframe.contentWindow.postMessage({akicastCmd:"ping",n},"*"); }catch(e){} }
    else semResp=0;
    const alemDoFim=fr.total&&fr.target>fr.total-1;
    const fora=fr.ready&&fr.pos!=null&&fr.pos!==fr.target&&!alemDoFim;
    if(fora){ if(!foraDesde) foraDesde=Date.now(); } else { foraDesde=0; foraTentado=null; }
    let motivo=null;
    if(semResp>=2) motivo="travou";
    else if(!fr.ready&&fr.carregadoEm&&Date.now()-fr.carregadoEm>25000) motivo="nao_abriu";
    else if(foraDesde&&Date.now()-foraDesde>8000&&foraTentado!==fr.target) motivo="fora";
    if(motivo){
      const agora=Date.now(); recargas=recargas.filter(t=>agora-t<180000);
      if(motivo==="fora") foraTentado=fr.target;
      semResp=0; foraDesde=0; fr.pingPend=0;
      if(recargas.length<3){ recargas.push(agora); fr.reload(); L.chan&&L.chan.sendSaude({tipo:"recarregou",motivo,slide:(L.step||0)+1,vezes:recargas.length}); }
      else L.chan&&L.chan.sendSaude({tipo:"desistiu",motivo,slide:(L.step||0)+1});
    }
    const estado=!fr.ready?"carregando":semResp>0?"sem_resposta":(foraDesde&&Date.now()-foraDesde>4000)?"fora":"ok";
    const r={slide:fr.pos!=null?fr.pos+1:null,estado};
    const k=JSON.stringify(r); if(k!==relato){ relato=k; L.chan&&L.chan.track(r); }
  },4000);
  return ()=>clearInterval(iv);
}
/* Na sala e no controle: avisa a produção e sugere o próximo passo */
const SAUDE_MOTIVO={travou:"parou de responder",nao_abriu:"não abriu a apresentação",fora:"ficou num slide diferente do que está no ar"};
function saudeRecebida(L,d){
  if(L.mode==="display") return;
  (L.incidentes=L.incidentes||[]).push({em:new Date().toISOString(),...d});
  const quando=SAUDE_MOTIVO[d.motivo]||"travou";
  if(d.tipo==="desistiu"){ toast(`A tela de exibição ${quando} de novo. Já recarregou 3 vezes; tente o modo leve, o PDF de reserva ou recarregue o OBS.`); return; }
  if((d.vezes||1)>=2){
    if(!L.leve){ toastAction(`A tela de exibição ${quando} e foi recarregada (${d.vezes}ª vez). Ligar o modo leve?`,"Ligar modo leve",()=>toggleLeve()); return; }
    if(L.meta&&L.meta.reservaPath&&!L.reserva){ toastAction(`A tela de exibição ${quando} de novo, mesmo no modo leve. Trocar para o PDF de reserva?`,"Usar o PDF",()=>toggleReserva()); return; }
  }
  toast(`A tela de exibição ${quando} e foi recarregada sozinha no slide ${d.slide}.`);
}
async function liveLoadDeck(L){
  const meta=L.meta; if(!meta||live!==L) return;
  const useR=!!(L.reserva && meta.reservaPath);
  const key=useR?"r"+meta.reservaVersion:"h"+meta.version;
  if(key===L.loadedKey) return;
  L.loadedKey=key;
  try{
    const html=useR?await loadReservaHtml(L.epId,meta):await loadDeckHtml(L.epId,meta);
    if(live!==L||L.loadedKey!==key) return;
    L.usingReserva=useR;
    liveFrames().forEach(f=>{ f.leve=!!L.leve; f.load(html); });
    if(L.cur&&(L.mode==="sala"||L.mode==="controller")) L.cur.onEnqVis=()=>enqSlideMudou(L);
    telaRender();
    if(L.campos){ const a=acoesEstados(L); liveFrames().forEach(f=>{ f.setCampos({...L.campos}); f.setAcoes(a); }); }
    videosAplicar(L);
    liveLoaded(); renderReserva();
  }catch(e){ if(L.loadedKey===key) L.loadedKey=null; toast(useR?"Não foi possível carregar o PDF de reserva.":"Não foi possível carregar a apresentação."); }
}
function renderReserva(){
  if(!live) enqAvisoFechar();
  const tem=!!(live&&live.meta&&live.meta.reservaPath), on=!!(live&&live.reserva&&tem);
  document.querySelectorAll("[data-reserva-btn]").forEach(b=>{ b.hidden=!tem; delete b.dataset.armed; b.textContent=on?"Voltar ao HTML original":"Usar o PDF de reserva"; b.classList.toggle("on",on); b.setAttribute("aria-pressed",on?"true":"false"); });
  document.querySelectorAll("[data-reserva-tag]").forEach(t=>t.hidden=!on);
}
async function toggleReserva(btn){
  const L=live; if(!L||!L.meta||!L.meta.reservaPath){ toast("Este episódio não tem PDF de reserva."); return; }
  const on=!L.reserva;
  if(btn && !confirmInline(btn,on?"Clique de novo para trocar":"Clique de novo para voltar")) return;
  let step=L.step||0;
  try{ const P=deckStarts(await loadDeckHtml(L.epId,L.meta)); step=on?slideDoPasso(P,step):passoDoSlide(P,step); }catch(e){}
  const at=Date.now(); let r;
  if(K_LINK && L.mode==="controller") r=await SB.rpc("int_controle_reserva",{p_episode:L.epId,p_k:K_LINK,p_reserva:on,p_step:step,p_at:at});
  else r=await SB.from("live_state").update({reserva:on,step,at}).eq("episode_id",L.epId);
  if(r.error){ toast(/reserva|column|schema|function/i.test(r.error.message||"")?"Falta rodar o int-pdf-reserva.sql no Supabase.":"Não foi possível trocar a apresentação."); renderReserva(); return; }
  if(live!==L) return;
  L.lastAt=at; L.step=step; L.reserva=on;
  L.chan && L.chan.send({step,reserva:on,at});
  liveLoadDeck(L); renderStep(); renderReserva();
  toast(on?"PDF de reserva no ar em todas as telas, no slide "+(step+1)+".":"De volta à apresentação original em todas as telas.");
}
function liveFrames(){ if(!live) return []; const a=[...(live.frames||[])]; ["cur","next","mini"].forEach(k=>{ if(live[k]&&!a.includes(live[k])) a.push(live[k]); }); return a; }
function renderLeve(){
  const on=!!(live&&live.leve);
  document.querySelectorAll("[data-leve-btn]").forEach(b=>{ b.textContent=on?"Modo leve: ligado":"Modo leve"; b.classList.toggle("on",on); b.setAttribute("aria-pressed",on?"true":"false"); });
}
async function toggleLeve(){
  if(!live) return; const v=!live.leve;
  const {error}=await SB.from("live_state").update({leve:v}).eq("episode_id",live.epId);
  if(error){ toast(/leve|column|schema/i.test(error.message||"")?"Falta rodar o int-modo-leve.sql no Supabase.":"Não foi possível mudar o modo leve."); return; }
  live.leve=v; liveFrames().forEach(f=>f.setLeve(v)); renderLeve();
  toast(v?"Modo leve ligado: sem animações em todas as telas.":"Modo leve desligado.");
}
async function recarregarTelas(){
  if(!live) return; const t=Date.now(); let r;
  if(K_LINK && live.mode==="controller") r=await SB.rpc("int_controle_recarregar",{p_episode:live.epId,p_k:K_LINK});
  else r=await SB.from("live_state").update({recarregar_em:t}).eq("episode_id",live.epId);
  if(r.error){ toast(/recarregar|column|schema|function/i.test(r.error.message||"")?"Falta rodar o int-modo-leve.sql no Supabase.":"Não foi possível recarregar as telas."); return; }
  live.recarregar=t; liveFrames().forEach(f=>f.reload()); toast("Recarregando as telas no slide atual…");
}
function stopLive(){ if(live&&live.telaStream) telaParar(true); ["#salaTela","#ctrlTela","#dispTela"].forEach(s=>{ const b=$(s); if(b){ b.innerHTML=""; b.dataset.src=""; b.dataset.pronto=""; b.classList.remove("on","no-ar"); if(s==="#salaTela") b.hidden=true; } }); if(live) live.telaCompartilhando=false;
  ["#salaAcoes","#ctrlAcoes"].forEach(s=>{ const b=$(s); if(b){ b.hidden=true; b.innerHTML=""; b.dataset.chave=""; } }); enqAvisoFechar(); clearTimeout(ENQ_AVISO.t); ["#salaVideo","#ctrlVideo"].forEach(s=>{ const b=$(s); if(b){ b.hidden=true; b.innerHTML=""; b.dataset.chave=""; } }); { const vb=document.getElementById("vidSom"); if(vb) vb.remove(); } ["#salaCampos","#ctrlCampos"].forEach(s=>{ const b=$(s); if(b){ b.hidden=true; b.innerHTML=""; b.dataset.chave=""; } }); document.querySelectorAll("[data-campos-limpar]").forEach(b=>b.hidden=true);
  if(!live) return;
  live.unsubs.forEach(u=>{ try{u()}catch(e){} });
  live.frames.forEach(f=>f.destroy());
  if(live.timerInt) clearInterval(live.timerInt);
  live=null;
  wantWake(false);
}
function setConn(L,state){ if(L.conn===state) return; L.conn=state; if(live===L) renderConn(); }
function applyState(d){
  if(!live || !d) return;
  // modo leve e recarregar valem mesmo sem mudar de slide
  if(typeof d.leve==="boolean" && d.leve!==!!live.leve){ live.leve=d.leve; liveFrames().forEach(f=>f.setLeve(d.leve)); renderLeve(); }
  if(d.recarregar){ if(live.recarregar && d.recarregar>live.recarregar){ liveFrames().forEach(f=>f.reload()); toast("Telas recarregadas."); } if(!live.recarregar||d.recarregar>live.recarregar) live.recarregar=d.recarregar; }
  if(d.campos) camposDoBanco(live,d.campos);
  if(d.tela){ const a=JSON.stringify(live.tela||{}), b=JSON.stringify(d.tela); if(a!==b){ live.tela=d.tela; telaRender(); } }
  if(typeof d.step!=="number") return;
  if(d.at && d.at<live.lastAt) return;
  live.lastAt=d.at||live.lastAt; live.step=d.step; if(typeof d.cover==="boolean") live.cover=d.cover;
  if(typeof d.reserva==="boolean" && d.reserva!==!!live.reserva){ live.reserva=d.reserva; liveLoadDeck(live); renderReserva(); if(live.mode!=="display") toast(d.reserva?"O PDF de reserva entrou no ar.":"A apresentação original voltou ao ar."); }
  renderStep();
}
function renderStep(){
  if(!live) return;
  const s=live.step;
  if(live.mode==="display"){ live.frames[0].setTarget(s); $("#dispCover").classList.toggle("on",live.cover); return; }
  if(live.mode==="sala"){
    if(live.cur.total && s>live.cur.total-1){ sendState(live.cur.total-1,keepCover()); return; }
    live.cur.setTarget(s);
    $("#salaCount").textContent = live.noDeck?"":contagem(live.cur,s);
    const cb=$("#salaCover"); cb.textContent = live.cover ? "Voltar aos slides" : "Mostrar tela do AkiCast";
    cb.classList.toggle("cover-on",!!live.cover); cb.classList.toggle("primary",!!live.cover);
    if(live.curCover) live.curCover.hidden=!live.cover;
    return;
  }
  { const totK=live.cur.total||live.next.total||null; if(totK && s>totK-1){ sendState(totK-1,keepCover()); return; } }
  live.cur.setTarget(s); live.next.setTarget(s+1); if(live.mini) live.mini.setTarget(s);
  const cv=!!live.cover;
  if(live.curCover) live.curCover.hidden=!cv;
  if(live.miniCover) live.miniCover.hidden=!cv;
  $("#ctrlCoverNote").hidden=!cv;
  const total=live.cur.total||live.next.total||null;
  $("#ctrlCount").textContent = contagem(live.cur,s);
  const last = total && s>=total-1;
  $("#ctrlEnd").hidden=!last; $("#ctrlNext").style.visibility= last?"hidden":"visible";
  $("#ctrlNextBtn").disabled=!!last; $("#ctrlPrev").disabled=s<=0; $("#ctrlFirst").disabled=s<=0;
  const mcn=$("#ctMiniCount"); if(mcn) mcn.textContent = total ? (s+1)+" / "+total : String(s+1);
  const mn=$("#ctMiniNext"), mp=$("#ctMiniPrev"); if(mn) mn.disabled=!!last; if(mp) mp.disabled=s<=0;
}
function liveNoDeck(){
  if(!live) return;
  if(live.mode==="display"){ $("#dispWait").hidden=false; $("#dispWaitMsg").textContent="Nenhuma apresentação neste episódio."; }
  else { live.noDeck=true; renderConn(); }
}
function liveLoaded(){ if(live){ live.noDeck=false; if(live.mode==="display") $("#dispWait").hidden=true; else renderConn(); } renderStep(); }

let writing=false, wantStep=null;
function sendState(step,cover){
  if(!live) return;
  const at=Date.now(); const epId=live.epId;
  // O apresentador só passa slides: a tela do AkiCast é decisão da produção.
  const cv = live.mode==="controller" ? undefined : !!cover;
  live.lastAt=at; live.step=step; if(cv!==undefined) live.cover=cv; renderStep();
  live.chan && live.chan.send(cv===undefined?{step,at}:{step,cover:cv,at});
  wantStep={epId,step,cover:cv,at};
  kickWriter();
  if(live.mode==="controller" && !live.timerStart && step>0) live.timerStart=Date.now();
}
const sendStep=step=>sendState(step,false);
function kickWriter(){
  if(writing||!wantStep) return;
  writing=true;
  (async()=>{
    while(wantStep){ const w=wantStep; wantStep=null;
      try{ await setLive(w.epId,{step:w.step,at:w.at,cover:w.cover,v:live?live.deckV:null}); if(live) setConn(live,"ok"); }
      catch(e){ if(!wantStep) wantStep=w; if(live) setConn(live,"off"); break; }
    }
    writing=false;
  })();
}
function toggleCover(){ if(live) sendState(live.step,!live.cover); }
function keepCover(){ return !!(live && live.mode==="controller" && live.cover); }
function move(delta){
  if(!live) return;
  if(live.cover && live.mode!=="controller"){ sendState(live.step,false); return; }
  const total = live.mode==="controller" ? (live.cur.total||live.next.total) : live.mode==="sala" ? live.cur.total : live.frames[0].total;
  let s=live.step+delta; if(s<0) s=0; if(total && s>total-1) s=total-1;
  if(s!==live.step) sendState(s,keepCover());
}
addEventListener("keydown",e=>{
  if(!live || e.altKey||e.ctrlKey||e.metaKey) return;
  const tag=(document.activeElement&&document.activeElement.tagName)||"";
  if(/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  const k=e.key;
  if(live.mode==="sala"){ if(SALA_MINI) return; if(k==="b"||k==="B"||k==="."){ e.preventDefault(); toggleCover(); } return; }
  if(["ArrowRight","ArrowDown","PageDown"," ","Enter"].includes(k)){ e.preventDefault(); move(1); }
  else if(["ArrowLeft","ArrowUp","PageUp","Backspace"].includes(k)){ e.preventDefault(); move(-1); }
  else if(k==="Home"){ e.preventDefault(); if(live.step!==0) sendState(0,keepCover()); }
  else if((k==="b"||k==="B"||k===".") && live.mode==="display"){ e.preventDefault(); toggleCover(); }
});

/* ---------- Display (OBS) ---------- */
let uiT;
async function renderCoverQr(epId){
  const box=$("#coverQr"), cta=$("#coverCta"); if(!box||!cta) return;
  cta.hidden=true; box.innerHTML="";
  try{
    await loadScript(LIBS.qr);
    const qr=window.qrcode(0,"M"); qr.addData(listenLink(epId)); qr.make();
    box.innerHTML=qr.createSvgTag({cellSize:8,margin:1,scalable:true});
    cta.hidden=false;
  }catch(e){ cta.hidden=true; }
}
function openDisplay(epId){
  if(!SB) return;
  const ov=$("#dispOv"); ov.hidden=false; $("#dispWait").hidden=false; $("#dispWaitMsg").textContent="Carregando apresentação…";
  $("#dispStage").innerHTML="";
  startLive(epId,"display",L=>{ L.frames=[new DeckFrame($("#dispStage"),{full:true})]; L.frames[0].onReport=()=>{}; });
  renderCoverQr(epId);
  ov.classList.add("ui"); clearTimeout(uiT); uiT=setTimeout(()=>ov.classList.remove("ui"),3000);
  document.body.style.overflow="hidden";
}
$("#dispOv").addEventListener("mousemove",()=>{ const ov=$("#dispOv"); ov.classList.add("ui"); clearTimeout(uiT); uiT=setTimeout(()=>ov.classList.remove("ui"),2000); });
$("#dispExit").addEventListener("click",()=>{ clearDirectParam(); stopLive(); $("#dispOv").hidden=true; document.body.style.overflow=""; if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); });
$("#dispFull").addEventListener("click",()=>{
  const el=$("#dispOv");
  if(document.fullscreenElement){ document.exitFullscreen().catch(()=>{}); return; }
  if(el.requestFullscreen) el.requestFullscreen().catch(()=>toast("O navegador não permitiu tela cheia aqui. Use F11."));
  else toast("Use F11 para tela cheia.");
});

/* ---------- Controller (presenter) ---------- */
function openController(epId){
  if(!SB) return;
  const ep=episodes.find(e=>e.id===epId);
  $("#ctrlEp").textContent = ep ? (ep.theme||"AkiCast")+", "+fmtShort(ep.date) : "AkiCast";
  const sl=ep&&normUrl(ep.slido_url); const sa=$("#ctrlSlido"); if(sl){ sa.href=sl; sa.hidden=false; } else sa.hidden=true;
  $("#ctrlOv").hidden=false; document.body.style.overflow="hidden";
  $("#ctrlCur").innerHTML=""; $("#ctrlNext").innerHTML="";
  ctSeen=null; setCtrlTab("pres");
  startLive(epId,"controller",L=>{
    L.cur=new DeckFrame($("#ctrlCur")); L.next=new DeckFrame($("#ctrlNext"));
    $("#ctrlMini").innerHTML=""; L.mini=new DeckFrame($("#ctrlMini")); L.mini.onReport=()=>{};
    L.frames=[L.cur,L.next,L.mini];
    const mc=document.createElement("div"); mc.className="cur-cover mini-cover"; mc.hidden=true; mc.innerHTML="<span>Tela do AkiCast</span>"; $("#ctrlMini").appendChild(mc); L.miniCover=mc;
    const cc=document.createElement("div"); cc.className="cur-cover"; cc.hidden=true;
    cc.innerHTML='<img class="cover-logo" alt=""><span>Tela do AkiCast no ar</span>';
    cc.querySelector("img").src=$("#ctrlLogo").src;
    $("#ctrlCur").appendChild(cc); L.curCover=cc;
    L.cur.onReport=()=>renderStep();
    L.next.onReport=()=>renderStep();
  });
  $("#ctrlWake").textContent = ("wakeLock" in navigator) ? "A tela deste aparelho fica acesa enquanto o controle estiver aberto." : "Este navegador não consegue manter a tela acesa: desative o descanso de tela antes da live.";
  renderStep(); renderConn(); tickClock();
  startCtrlQs(epId);
  live.timerInt=setInterval(tickClock,1000);
  $("#ctrlNextBtn").focus({preventScroll:true});
}
function renderConn(){
  if(live&&live.mode==="sala"){ renderSalaStatus(); return; }
  const el=$("#ctrlStatus"); if(!el||!live||live.mode!=="controller") return;
  el.classList.toggle("off",live.conn==="off");
  if(live.conn==="off"){ el.innerHTML='<span class="dotc bad"></span> Sem conexão. Tentando reconectar… seus cliques serão enviados quando a internet voltar.'; return; }
  if(live.noDeck){ el.innerHTML='<span class="dotc"></span> Ainda não há apresentação enviada para este episódio.'; return; }
  const ds=(live.peers||[]).filter(p=>p&&p.mode==="display"), on=ds.length>0, ruim=ds.find(p=>p.estado&&p.estado!=="ok");
  el.innerHTML = !on ? '<span class="dotc"></span> Aguardando a tela de exibição abrir no computador do OBS'
    : ruim ? '<span class="dotc bad"></span> Tela de exibição '+(ruim.estado==="carregando"?"carregando a apresentação…":"com problema; a central está corrigindo sozinha")
    : '<span class="dotc on"></span> Tela de exibição conectada'+(ds[0].slide!=null?" · slide "+ds[0].slide:"");
}
function tickClock(){
  if(!live||live.mode!=="controller") return;
  const t=live.timerStart?Math.floor((Date.now()-live.timerStart)/1000):0;
  $("#ctrlTimer").textContent=String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");
  const now=new Date(), end=new Date(); end.setHours(10,0,0,0);
  const left=Math.round((end-now)/60000);
  $("#ctrlLeft").textContent = (now.getHours()>=9 && left>0) ? left+" min" : "–";
}
$("#ctTabPres").addEventListener("click",()=>setCtrlTab("pres"));
$("#ctLoginBtn").addEventListener("click",openLogin);
$("#ctTabInt").addEventListener("click",()=>setCtrlTab("int"));
$("#ctMiniView").addEventListener("click",()=>setCtrlTab("pres"));
$("#ctMiniPrev").addEventListener("click",()=>{ $("#ctMiniPrev").blur(); move(-1); });
$("#ctMiniNext").addEventListener("click",()=>{ $("#ctMiniNext").blur(); move(1); });
$("#ctrlExit").addEventListener("click",()=>{ stopCtrlQs(); clearDirectParam(); stopLive(); $("#ctrlOv").hidden=true; document.body.style.overflow=""; });
$("#ctrlNextBtn").addEventListener("click",()=>move(1));
$("#ctrlPrev").addEventListener("click",()=>move(-1));
$("#ctrlFirst").addEventListener("click",()=>{ if(live&&live.step!==0) sendState(0,keepCover()); });

/* ---------- Presenter send page (?enviar=<episódio>) ---------- */
let sendEp=null, sendMeta=undefined, sendFrame=null;
function deadlineOf(dateStr){ const d=parseDate(dateStr); if(!d) return null; d.setDate(d.getDate()-1); d.setHours(23,59,0,0); return d; }
function deadlineHtml(dateStr){
  const dl=deadlineOf(dateStr); if(!dl) return "";
  const label=WEEKDAYS[dl.getDay()].toLowerCase()+", "+dl.getDate()+" de "+MONTHS[dl.getMonth()];
  const ms=dl-new Date();
  let st, late=false;
  if(ms<0){ st="O prazo já passou. Envie mesmo assim e avise a equipe do AkiCast."; late=true; }
  else if(ms<86400000){ st="O prazo termina hoje."; }
  else { const d=Math.ceil(ms/86400000); st="Faltam "+d+" "+(d===1?"dia":"dias")+"."; }
  return `<div class="deadline${late?" late":""}"><span>Prazo para envio: <b>até ${esc(label)}</b>, véspera da live.</span><span>${esc(st)}</span></div>`;
}
async function startSendView(epId){
  { const bl=$("#brandLink"); if(bl){ bl.removeAttribute("href"); bl.style.cursor="default"; bl.removeAttribute("title"); } }
  document.body.classList.add("send-mode");
  const v=$("#sendView"); v.hidden=false;
  v.innerHTML='<p class="status">Carregando…</p>';
  if(!SB){ v.innerHTML='<div class="pres-card"><h2>Central não configurada</h2><p class="meta">Avise a equipe do AkiCast: o Supabase não está configurado nesta central.</p></div>'; return; }
  const {data,error}=await epPublico(epId);
  if(!error&&data&&!(await linkValido(epId,"envio"))){ v.innerHTML='<div class="pres-card"><h2>Link antigo ou incompleto</h2><p class="meta">Este link de envio não tem o código de segurança ou foi substituído. Peça à equipe do AkiCast o link novo, que aparece na aba Apresentações da central.</p></div>'; return; }
  if(error||!data){ v.innerHTML='<div class="pres-card"><h2>Link inválido</h2><p class="meta">Este link de envio não corresponde a nenhum episódio. Peça um novo link para a equipe do AkiCast.</p></div>'; return; }
  sendEp=rowToEp(data); followEpisodeProgram(data);
  watchDeck(epId, m=>{ sendMeta=m; renderSendView(); });
  renderSendView();
}
function renderSendView(){
  const v=$("#sendView"), ep=sendEp; if(!ep) return;
  if(sendFrame){ sendFrame.destroy(); sendFrame=null; }
  const meta=sendMeta;
  const status = meta===undefined ? '<p class="status">Conferindo…</p>'
    : meta ? `<div class="okmsg">Recebemos <b>${esc(meta.name)}</b> (${fmtBytes(meta.size||0)}), enviada em ${esc(fmtWhen(meta.uploadedAt))}. Se precisar corrigir algo, envie uma nova versão: ela substitui a anterior.</div>`
    : '<p class="meta">Nenhum arquivo enviado ainda.</p>';
  v.innerHTML=`
    <div class="list-head"><h1>Envio da apresentação</h1></div>
    <p class="lead-p">AkiCast de ${esc(fmtLong(ep.date).toLowerCase())}, às 9h${ep.theme?`. Tema: <b>${esc(ep.theme)}</b>`:""}.</p>
    ${deadlineHtml(ep.date)}
    <div class="pres-grid">
      <div class="pres-card">
        <h2>Seu arquivo</h2>
        ${status}
        <label class="upload" id="sUpBox" style="margin-top:14px">
          <input type="file" id="sUpInput" accept=".html,.htm,.pdf,text/html,application/pdf">
          <b>${meta?"Enviar nova versão":"Enviar apresentação (HTML ou PDF)"}</b>
          <span>Clique para escolher ou arraste o arquivo para cá</span>
        </label>
        <div class="progress-up" id="sUpProg" hidden><i></i></div>
        <label class="otz-chk"><input type="checkbox" data-otimizar ${otimizarLigado()?"checked":""}> Otimizar imagens grandes (recomendado: deixa a apresentação mais leve)</label>
        <div class="warns" id="sWarns"></div>
      </div>
      <div class="pres-card">
        <h2>Teste seus slides</h2>
        <p class="meta">${meta?"Veja como o arquivo aparece e navegue pelos slides.":"Depois do envio, a prévia aparece aqui."}</p>
        <div class="thumb" id="sThumb" style="margin-top:12px"><div class="empty-t">${meta?"Carregando…":"Sem arquivo"}</div></div>
        <div class="test-nav"><button class="btn ghost" id="sPrev" ${meta?"":"disabled"}>Anterior</button><button class="btn ghost" id="sNext" ${meta?"":"disabled"}>Próximo</button><span id="sCount"></span></div>
      </div>
    </div>
    <div id="sVidCard"></div>
    ${meta&&!isPdfName(meta.name)?'<div class="pres-card"><h2>PDF de reserva <span class="src-tag">recomendado</span></h2><div class="reserva-box solo" id="sReservaBox"></div></div>':""}
    <div class="pres-card">
      <h2>Para funcionar bem na live</h2>
      <div class="modelo-box"><div><b>Primeira vez apresentando?</b><span class="meta">Uma apresentação curta mostra como a live funciona: envio, ensaio automático, o seu controle, o que o público faz e o que acontece se algo der errado.</span></div><a class="btn primary sm" href="modelo/conheca-a-central.html" target="_blank" rel="noopener">Conhecer a central</a></div>
      <ul class="tips">
        <li><b>HTML ou PDF.</b> Se você montou no PowerPoint ou no Canva, exporte em PDF: cada página vira um slide. Animações e vídeos não vão junto no PDF.</li>
        <li><b>Se for HTML, um único arquivo.</b> Imagens, fontes e ícones precisam estar embutidos nele, sem pastas ao lado.</li>
        <li><b>No HTML, slides que avançam pelas setas do teclado</b> (→ e ←). É assim que o controle remoto passa os seus slides.</li>
        <li><b>Formato 16:9</b>, pensado para uma tela de 1920 × 1080.</li>
        <li><b>Tem enquete no HTML?</b> A equipe conecta à votação do sistema: o público vota pela plataforma e as porcentagens aparecem no seu slide. Para garantir que ela seja reconhecida, marque o bloco com <code>data-aki-enquete</code> e cada opção com <code>data-aki-opcao</code>.</li>
        <li><b>Cartões que viram, abas ou botões?</b> A equipe aciona pela sala e todas as telas acompanham. Para dar um nome claro, marque o elemento com <code>data-aki-acao="Virar"</code>.</li>
        <li><b>No dia da live</b>, você controla os slides pelo seu notebook. A equipe do AkiCast te passa o link da central e mostra onde clicar.</li>
      </ul>
    </div>`;
  wireSendUpload();
  if(meta&&!isPdfName(meta.name)) renderReservaBox($("#sReservaBox"),meta,ep.id,"apresentador");
  if(meta){
    loadDeckHtml(ep.id,meta).then(html=>{
      if(sendMeta!==meta) return;
      const w=scanDeck(html);
      $("#sWarns").innerHTML = w.length
        ? '<p style="margin:0;font-weight:700">Atenção antes da live</p>'+w.map(x=>`<div class="warn">${esc(x)}</div>`).join("")
        : '<div class="okmsg">Tudo certo: o arquivo é autocontido e não depende de nada externo.</div>';
      const th=$("#sThumb"); th.innerHTML="";
      sendFrame=new DeckFrame(th); sendFrame.load(html);
      ensMostrar({apos:"#sendView",epId:ep.id,meta,html,salvar:false,auto:true});
      renderVideoCard($("#sVidCard"),ep.id,meta,html,"apresentador");
      const P=deckStarts(html);
      if(P) conferirReserva(ep.id,meta,P.length);
      sendFrame.onReport=f=>{ $("#sCount").textContent = contagem(f); if(!P&&f.total) conferirReserva(ep.id,meta,f.total); };
      $("#sNext").onclick=()=>{ if(sendFrame.total && sendFrame.pos>=sendFrame.total-1) return; sendFrame.setTarget((sendFrame.pos||0)+1); };
      $("#sPrev").onclick=()=>sendFrame.setTarget(Math.max(0,(sendFrame.pos||0)-1));
    }).catch(()=>{ $("#sWarns").innerHTML='<div class="warn">Não foi possível abrir o arquivo enviado. Tente enviar de novo.</div>'; });
  }
}
function wireSendUpload(){
  const inp=$("#sUpInput"), box=$("#sUpBox"); if(!inp) return;
  const go=async file=>{
    if(!file) return;
    if(isPptName(file.name)){ showPptHelp(file.name); if(inp) inp.value=""; return; }
    if(!/\.(html?|pdf)$/i.test(file.name)){ toast("Envie um arquivo .html ou .pdf."); return; }
    if(isPdfName(file.name)) toast("Convertendo o PDF em slides…");
    const pr=$("#sUpProg"); pr.hidden=false; const bar=pr.querySelector("i");
    box.style.pointerEvents="none";
    try{
      const html=await uploadDeck(sendEp.id,file,p=>bar.style.width=(p*100)+"%","apresentador");
      if(!K_LINK){ try{ const r=await SB.rpc("ck_marcar",{p_episode:sendEp.id,p_itens:{materiais:true}}); if(r.error) await SB.rpc("set_check",{ep:sendEp.id,item:"materiais",val:true}); }catch(e){} }
      showSentOk(file.name, (ultimaOtimizacao?[textoOtimizacao()]:[]).concat(scanDeck(html)));
    }catch(e){
      if(e&&e.code==="too_big") toast("O arquivo passa de 25 MB. Reduza o tamanho das imagens e envie de novo.");
      else toast("Não foi possível enviar"+(e&&e.message?": "+e.message:". Tente de novo."));
      pr.hidden=true; box.style.pointerEvents="";
    }
  };
  inp.addEventListener("change",()=>go(inp.files[0]));
  box.addEventListener("dragover",e=>{e.preventDefault();box.classList.add("drag")});
  box.addEventListener("dragleave",()=>box.classList.remove("drag"));
  box.addEventListener("drop",e=>{e.preventDefault();box.classList.remove("drag");go(e.dataTransfer.files[0])});
}

function showSentOk(name, warns){
  const now=new Date();
  $("#sentName").textContent=name;
  $("#sentWhen").textContent="Chegou para a equipe do AkiCast às "+String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0")+" de "+now.getDate()+" de "+MONTHS[now.getMonth()]+". Você não precisa fazer mais nada.";
  $("#sentCheck").innerHTML = warns.length
    ? `<div class="warn">Encontramos ${warns.length===1?"1 ponto":warns.length+" pontos"} para conferir antes da live. Os detalhes estão na página, junto com a prévia dos slides.</div>`
    : '<div class="okmsg">O arquivo está pronto para a live: não depende de nada externo.</div>';
  $("#sentClose").textContent = warns.length ? "Ver os detalhes" : "Ver meu arquivo";
  const ov=$("#sentOv"); ov.hidden=false; $("#sentClose").focus();
}
function closeSentOk(){
  $("#sentOv").hidden=true;
  const t=$("#sWarns"); if(t) t.scrollIntoView({behavior:"smooth",block:"center"});
}
$("#sentClose").addEventListener("click",closeSentOk);
$("#sentOv").addEventListener("click",e=>{ if(e.target.id==="sentOv") closeSentOk(); });
addEventListener("keydown",e=>{ if(e.key==="Escape" && !$("#sentOv").hidden) closeSentOk(); });

{ const hl=document.querySelector("img.logo"), cl=$("#ctrlLogo"); if(hl&&cl) cl.src=hl.src;
  const gl=document.querySelector("img.group-logo");
  document.querySelectorAll(".cover-logo").forEach(i=>{ if(hl) i.src=hl.src; });
  document.querySelectorAll(".cover-group").forEach(i=>{ if(gl) i.src=gl.src; }); }
let wakeLock=null, wakeWanted=false;
async function requestWake(){
  if(!wakeWanted||!("wakeLock" in navigator)||wakeLock||document.hidden) return;
  try{ wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release",()=>{ wakeLock=null; if(wakeWanted&&!document.hidden) requestWake(); }); }catch(e){ wakeLock=null; }
}
function wantWake(on){ wakeWanted=on; if(on) requestWake(); else if(wakeLock){ const w=wakeLock; wakeLock=null; w.release().catch(()=>{}); } }
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) requestWake(); });

/* =================== Bibliotecas sob demanda =================== */
const LIBS={
  pdf:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfWorker:"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  excel:"https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js",
  qr:"https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js"
};
const libLoads={};
function loadScript(src){
  if(!libLoads[src]) libLoads[src]=new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=()=>{ delete libLoads[src]; rej(new Error("Não foi possível carregar "+src)); }; document.head.appendChild(s); });
  return libLoads[src];
}

/* =================== PDF: vira uma apresentação HTML com uma imagem por página =================== */
const isPdfName = n => /\.pdf$/i.test(n||"");
async function pdfToDeck(file, onProg){
  await loadScript(LIBS.pdf);
  const lib=window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc=LIBS.pdfWorker;
  const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const n=doc.numPages, imgs=[];
  const canvas=document.createElement("canvas"), ctx=canvas.getContext("2d");
  for(let i=1;i<=n;i++){
    const page=await doc.getPage(i);
    const v1=page.getViewport({scale:1});
    const scale=Math.min(1920/v1.width,1080/v1.height)*1.0;
    const vp=page.getViewport({scale});
    canvas.width=Math.round(vp.width); canvas.height=Math.round(vp.height);
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    await page.render({canvasContext:ctx,viewport:vp}).promise;
    imgs.push(canvas.toDataURL("image/jpeg",0.9));
    page.cleanup();
    onProg&&onProg(i/n);
  }
  doc.destroy();
  const title=esc(file.name.replace(/\.pdf$/i,""));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}.s{position:absolute;inset:0;display:none;align-items:center;justify-content:center}.s.on{display:flex}.s img{max-width:100%;max-height:100%;display:block}#counter{position:absolute;left:-9999px;top:0}</style></head><body>
${imgs.map((src,i)=>`<div class="s${i===0?" on":""}"><img src="${src}" alt="Slide ${i+1}"></div>`).join("\n")}
<div id="counter">1 / ${n}</div>
<script>(function(){var s=document.querySelectorAll('.s'),c=document.getElementById('counter'),cur=0;
function go(i){cur=Math.max(0,Math.min(s.length-1,i));for(var k=0;k<s.length;k++)s[k].classList.toggle('on',k===cur);c.textContent=(cur+1)+' / '+s.length}
addEventListener('keydown',function(e){var k=e.key;if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].indexOf(k)>=0){e.preventDefault();go(cur+1)}else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].indexOf(k)>=0){e.preventDefault();go(cur-1)}else if(k==='Home')go(0);else if(k==='End')go(s.length-1)});
addEventListener('click',function(e){go(cur+(e.clientX<innerWidth/3?-1:1))});window.__ap={ir:go,total:function(){return s.length}};})();<\/script>
</body></html>`;
}

/* =================== Checklist editável =================== */
const DEFAULT_TEMPLATE = PHASES.map(p=>p.items.map(i=>({...i,phase:p.id}))).flat();
let templateSig="", templateReady=false, templateAvailable=false, progColsMissing=false;
function recomputeTotal(){ TOTAL = PHASES.reduce((a,p)=>a+phaseTotal(p),0); }
function applyTemplate(items){
  const sig=JSON.stringify(items.map(i=>[i.id,i.phase,i.t,i.d,i.flag||""]));
  if(sig===templateSig) return;
  templateSig=sig;
  PHASES.forEach(p=>{ p.items=items.filter(i=>i.phase===p.id).map(i=>({id:i.id,t:i.t,d:i.d,flag:i.flag||undefined})); });
  recomputeTotal();
  if(!store) return;
  renderList();
  if(selectedId && !editing){ builtFor=null; buildView(); updateView(); }
}
function rowToItem(r){ return {id:r.id,phase:r.phase,t:r.title,d:r.description||"",flag:r.flag||"",position:r.position}; }
async function loadTemplate(){
  let {data,error}=await SB.from("checklist_items").select("*").eq("program",PROG).order("position",{ascending:true});
  if(error && /program/.test(error.message||"")){
    if(PROG!=="akicast"){ templateAvailable=false; return; }
    ({data,error}=await SB.from("checklist_items").select("*").order("position",{ascending:true})); progColsMissing=true;
  }
  if(error){ templateAvailable=false; return; }
  templateAvailable=true;
  if(!data.length){
    let base=DEFAULT_TEMPLATE.map((i,idx)=>({id:i.id,phase:i.phase,title:i.t,description:i.d,flag:i.flag||"",position:idx*10}));
    if(PROG!=="akicast"){ // começa como cópia do checklist do AkiCast
      const src=await SB.from("checklist_items").select("*").eq("program","akicast").order("position",{ascending:true});
      if(!src.error && src.data.length) base=src.data.map(r=>({id:r.id,phase:r.phase,title:r.title,description:r.description||"",flag:r.flag||"",position:r.position}));
      base=base.map(r=>({...r,id:PROG+":"+String(r.id).replace(/^[a-z]+:/,""),program:PROG}));
    } else if(!progColsMissing) base=base.map(r=>({...r,program:"akicast"}));
    await SB.from("checklist_items").upsert(base);
    applyTemplate(base.map(rowToItem)); return;
  }
  applyTemplate(data.map(rowToItem));
}
function watchTemplate(){
  let t=null;
  SB.channel("tpl-"+uid()).on("postgres_changes",{event:"*",schema:"public",table:"checklist_items"},()=>{ clearTimeout(t); t=setTimeout(()=>{ if(!editing) loadTemplate(); },400); }).subscribe();
}

let editing=false, draft=null;
function openEditor(){
  if(!SB){ toast("Editar o checklist precisa do Supabase configurado."); return; }
  if(!templateAvailable){ toast("Rode o arquivo supabase-atualizacao-checklist.sql no Supabase para editar o checklist."); return; }
  editing=true;
  draft=PHASES.map(p=>({id:p.id,items:p.items.map(i=>({...i}))}));
  renderEditor(); showView(); window.scrollTo(0,0);
}
function closeEditor(){ editing=false; draft=null; $("#editBody").innerHTML=""; loadTemplate(); showView(); window.scrollTo(0,0); }
const ICON_UP='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
const ICON_DOWN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function renderEditor(focusSel){
  const el=$("#editBody");
  el.innerHTML = draft.map((dp,pi)=>{
    const p=PHASES[pi];
    return `<section class="phase ed-phase" style="color:${p.color}">
      <div class="phase-head"><span class="num">${p.num}</span><h3>${p.name}</h3><span class="whenlbl">${p.when}</span><span class="tally">${dp.items.length} ${dp.items.length===1?"item":"itens"}</span></div>
      <div class="ed-list">
        ${dp.items.map((it,ii)=>`<div class="ed-item">
          <div class="ed-move">
            <button class="icon-btn" data-act="up" data-p="${pi}" data-i="${ii}" ${ii===0?"disabled":""} aria-label="Subir item">${ICON_UP}</button>
            <button class="icon-btn" data-act="down" data-p="${pi}" data-i="${ii}" ${ii===dp.items.length-1?"disabled":""} aria-label="Descer item">${ICON_DOWN}</button>
          </div>
          <div class="ed-fields">
            <input class="ed-t" data-p="${pi}" data-i="${ii}" value="${esc(it.t)}" placeholder="Nome da tarefa" maxlength="120" aria-label="Nome da tarefa">
            <textarea class="ed-d" data-p="${pi}" data-i="${ii}" rows="2" maxlength="400" placeholder="Descrição (opcional)" aria-label="Descrição da tarefa">${esc(it.d)}</textarea>
          </div>
          <button class="linkbtn ed-rm" data-act="rm" data-p="${pi}" data-i="${ii}">Remover</button>
        </div>`).join("")}
      </div>
      ${p.rating?'<p class="ed-note">A avaliação de 1 a 5 continua sempre no fim desta fase.</p>':""}
      <button class="btn ghost ed-add" data-act="add" data-p="${pi}">Adicionar item</button>
    </section>`;
  }).join("");
  el.querySelectorAll(".ed-t").forEach(inp=>inp.addEventListener("input",()=>{ draft[inp.dataset.p].items[inp.dataset.i].t=inp.value; }));
  el.querySelectorAll(".ed-d").forEach(inp=>inp.addEventListener("input",()=>{ draft[inp.dataset.p].items[inp.dataset.i].d=inp.value; }));
  el.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click",()=>{
    const pi=+b.dataset.p, ii=+b.dataset.i, list=draft[pi].items, act=b.dataset.act;
    if(act==="up"&&ii>0){ [list[ii-1],list[ii]]=[list[ii],list[ii-1]]; renderEditor(`[data-act="up"][data-p="${pi}"][data-i="${ii-1}"]`); markMoved(pi,ii-1); }
    else if(act==="down"&&ii<list.length-1){ [list[ii+1],list[ii]]=[list[ii],list[ii+1]]; renderEditor(`[data-act="down"][data-p="${pi}"][data-i="${ii+1}"]`); markMoved(pi,ii+1); }
    else if(act==="rm"){ list.splice(ii,1); renderEditor(); }
    else if(act==="add"){ list.push({id:"i_"+Date.now().toString(36)+uid().slice(0,3),t:"",d:""}); renderEditor(`.ed-t[data-p="${pi}"][data-i="${list.length-1}"]`); }
  }));
  if(focusSel){ const f=el.querySelector(focusSel); if(f&&!f.disabled) f.focus(); }
}
function markMoved(pi,ii){ const t=document.querySelector(`.ed-t[data-p="${pi}"][data-i="${ii}"]`); const it=t&&t.closest(".ed-item"); if(it) it.classList.add("moved"); }
async function saveEditor(){
  const b=$("#edSave"); b.disabled=true; b.textContent="Salvando…";
  const rows=[]; let pos=0;
  draft.forEach(dp=>dp.items.forEach(it=>{ const t=(it.t||"").trim(); if(t) rows.push({id:(PROG!=="akicast"&&!String(it.id).startsWith(PROG+":"))?PROG+":"+it.id:it.id,phase:dp.id,title:t,description:(it.d||"").trim(),flag:it.flag||"",position:(pos+=10),...(progColsMissing?{}:{program:PROG})}); }));
  if(!rows.length){ toast("O checklist precisa de pelo menos um item."); b.disabled=false; b.textContent="Salvar checklist"; return; }
  try{
    let q0=SB.from("checklist_items").select("id"); if(!progColsMissing) q0=q0.eq("program",PROG);
    const {data:cur,error:e0}=await q0; if(e0) throw e0;
    const keep=new Set(rows.map(r=>r.id));
    const gone=cur.map(r=>r.id).filter(id=>!keep.has(id));
    const {error:e1}=await SB.from("checklist_items").upsert(rows); if(e1) throw e1;
    if(gone.length){ const {error:e2}=await SB.from("checklist_items").delete().in("id",gone); if(e2) throw e2; }
    toast("Checklist salvo para todos os episódios.");
    closeEditor();
  }catch(e){ handleErr(e); b.disabled=false; b.textContent="Salvar checklist"; }
}

/* =================== Exportar histórico (planilha formatada) =================== */
async function exportHistory(){
  const b=$("#exportBtn"); const old=b.textContent; b.disabled=true; b.textContent="Gerando planilha…";
  try{
    await loadScript(LIBS.excel);
    let decks={};
    if(SB){ const {data}=await SB.from("decks").select("episode_id,name,source,uploaded_at"); (data||[]).forEach(d=>decks[d.episode_id]=d); }
    const eps=episodes.slice().sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    let inter={status:"indisponivel",rows:[]};
    if(SB && SESSION && SESSION.papel){
      let r=await SB.from("int_perguntas").select("episode_id,texto,nome,status,votos,pedido_apresentador,fila_apresentador,criada_em,no_ar_em");
      if(r.error && /fila_apresentador/.test(r.error.message||"")) r=await SB.from("int_perguntas").select("episode_id,texto,nome,status,votos,pedido_apresentador,criada_em,no_ar_em");
      if(!r.error) inter={status:"ok",rows:r.data||[]};
    } else if(SB) inter={status:"login",rows:[]};
    let rank={status:"indisponivel",list:[]};
    if(SB && SESSION && SESSION.papel==="admin"){
      const out=[]; let erro=false;
      for(const e of eps.filter(x=>x.pontuacao)){ const r=await SB.rpc("int_ranking",{p_episode:e.id}); if(r.error){ erro=true; break; } (r.data||[]).forEach(x=>out.push({ep:e,...x})); }
      rank = erro ? {status:"sql",list:[]} : {status:"ok",list:out};
    } else if(SB) rank={status:"login",list:[]};
    const buf=await buildWorkbook(eps,decks,inter,rank);
    const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=PN()+"-historico-"+isoDate(new Date())+".xlsx";
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
    toast("Planilha baixada.");
  }catch(e){ console.error(e); toast("Não foi possível gerar a planilha. Confira a internet e tente de novo."); }
  finally{ b.disabled=false; b.textContent=old; }
}

async function buildWorkbook(eps,decks,inter,rank){
  rank=rank||{status:"indisponivel",list:[]};
  inter=inter||{status:"indisponivel",rows:[]};
  const C={ purple:"FF"+PG().brand.slice(1).toUpperCase(), purpleDark:"FF"+PG().deep.slice(1).toUpperCase(), lav:"FFF3EEFC", lav2:"FFE7DDF9", line:"FFD9CFEE", ink:"FF241845", muted:"FF6B5F86", white:"FFFFFFFF",
    green:"FF2B8750", greenBg:"FFE3F4EA", cyan:"FF07838C", orange:"FFC9700C", orangeBg:"FFFCEFD9", red:"FFC23B3B", redBg:"FFF9E1E1", grey:"FFF4F2F8" };
  const PH_COL={f1:"FF07838C",f2:"FFC9700C",f3:"FF2B8750",f4:"FF6A16DC"};
  const F=(o={})=>({name:"Arial",size:10,color:{argb:C.ink},...o});
  const fill=argb=>({type:"pattern",pattern:"solid",fgColor:{argb}});
  const thin={style:"thin",color:{argb:C.line}};
  const border={top:thin,left:thin,bottom:thin,right:thin};
  const toDate=s=>{ const d=parseDate(s); return d? new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())) : null; };
  const wb=new ExcelJS.Workbook();
  wb.creator="Central do AkiCast"; wb.created=new Date();
  const n=eps.length, last=Math.max(2,n+1);

  const titleBlock=(ws,title,sub,span)=>{
    ws.mergeCells(1,1,1,span); ws.mergeCells(2,1,2,span);
    const t=ws.getCell(1,1); t.value=title; t.font=F({size:16,bold:true,color:{argb:C.white}}); t.fill=fill(C.purpleDark); t.alignment={vertical:"middle",indent:1};
    const s2=ws.getCell(2,1); s2.value=sub; s2.font=F({size:10,color:{argb:"FFD9CFF2"}}); s2.fill=fill(C.purpleDark); s2.alignment={vertical:"middle",indent:1};
    ws.getRow(1).height=30; ws.getRow(2).height=20;
    for(let c=1;c<=span;c++){ ws.getCell(1,c).fill=fill(C.purpleDark); ws.getCell(2,c).fill=fill(C.purpleDark); }
  };
  const headerRow=(row,cols)=>{
    row.height=30;
    cols.forEach((_,i)=>{ const c=row.getCell(i+1); c.font=F({bold:true,color:{argb:C.white}}); c.fill=fill(C.purple); c.alignment={vertical:"middle",horizontal:"left",wrapText:true,indent:1}; c.border=border; });
  };
  const exported="Exportado em "+new Date().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})+" pela Central do AkiCast";

  /* ---------- Episódios ---------- */
  const wsE=wb.addWorksheet("Episódios",{properties:{tabColor:{argb:C.purple}},views:[{state:"frozen",xSplit:2,ySplit:4,showGridLines:false}]});
  const colsE=[
    {h:"Data",w:12},{h:"Tema",w:34},{h:"Apresentadores",w:32},{h:"Nº de apresentadores",w:14},
    {h:"Checklist concluído",w:14},{h:"Itens concluídos",w:13},{h:"Nota",w:8},{h:"Avaliação",w:30},
    {h:"O que funcionou e o que ajustar",w:46},{h:"Descrição e notas",w:46},{h:"Live no YouTube",w:18},{h:"Slido",w:14},
    {h:"Apresentação",w:30},{h:"Enviada por",w:14},
    {h:"Perguntas do público",w:13},{h:"Votos do público",w:11},{h:"Pergunta mais votada",w:46}
  ];
  const qByEp={}; (inter.rows||[]).forEach(q=>{ (qByEp[q.episode_id]=qByEp[q.episode_id]||[]).push(q); });
  titleBlock(wsE,PN()+": histórico de episódios",exported,colsE.length);
  wsE.columns=colsE.map(c=>({width:c.w}));
  const hE=wsE.getRow(4); colsE.forEach((c,i)=>hE.getCell(i+1).value=c.h); headerRow(hE,colsE);
  eps.forEach((ep,i)=>{
    const r=wsE.getRow(5+i), done=PHASES.reduce((a,p)=>a+phaseDone(p,ep),0), rt=ratingOf(ep.rating), dk=decks[ep.id];
    const pres=parsePresenters(ep.presenters);
    const vals=[toDate(ep.date), ep.theme||"", pres.join("\n"), pres.length||null, TOTAL?done/TOTAL:0, done+" de "+TOTAL, rt?rt.n:null, rt?rt.t:"Sem avaliação",
      ep.review||"", ep.notes||"", null, null, dk?dk.name:"", dk?(dk.source==="apresentador"?"Apresentador":"Equipe"):""];
    const qs=qByEp[ep.id]||[], top=qs.slice().sort((a,b)=>b.votos-a.votos)[0];
    if(inter.status==="ok") vals.push(qs.length, qs.reduce((a,q)=>a+(q.votos||0),0), top&&top.votos>0?top.texto+" ("+top.votos+(top.votos===1?" voto)":" votos)"):"");
    else vals.push("","","");
    vals.forEach((v,j)=>{ r.getCell(j+1).value=v; });
    const yt=normUrl(ep.youtube_url), sl=normUrl(ep.slido_url);
    if(yt) r.getCell(11).value={text:"Abrir live",hyperlink:yt};
    if(sl) r.getCell(12).value={text:"Abrir Slido",hyperlink:sl};
    const zebra = i%2 ? C.grey : C.white;
    for(let j=1;j<=colsE.length;j++){
      const c=r.getCell(j); c.font=F(); c.fill=fill(zebra); c.border=border;
      c.alignment={vertical:"top",wrapText:[2,3,8,9,10,13,17].includes(j),horizontal:[4,5,6,7,15,16].includes(j)?"center":"left",indent:[4,5,6,7,15,16].includes(j)?0:1};
    }
    r.getCell(1).numFmt="dd/mm/yyyy"; r.getCell(1).font=F({bold:true});
    r.getCell(5).numFmt="0%";
    if(yt) r.getCell(11).font=F({color:{argb:C.purple},underline:true});
    if(sl) r.getCell(12).font=F({color:{argb:C.purple},underline:true});
    if(!rt) r.getCell(8).font=F({italic:true,color:{argb:C.muted}});
    if(rt){ const bg={5:C.greenBg,4:"FFDDF3F4",3:C.orangeBg,2:C.redBg,1:C.redBg}[rt.n], fg={5:C.green,4:C.cyan,3:C.orange,2:C.red,1:C.red}[rt.n];
      [7,8].forEach(j=>{ r.getCell(j).fill=fill(bg); r.getCell(j).font=F({bold:j===7,color:{argb:fg}}); }); }
  });
  if(!n){ wsE.mergeCells(5,1,5,colsE.length); const c=wsE.getCell(5,1); c.value="Nenhum episódio cadastrado ainda."; c.font=F({italic:true,color:{argb:C.muted}}); }
  if(n){
    wsE.autoFilter={from:{row:4,column:1},to:{row:4+n,column:colsE.length}};
    wsE.addConditionalFormatting({ref:`E5:E${4+n}`,rules:[{type:"dataBar",priority:1,minLength:0,maxLength:100,cfvo:[{type:"num",value:0},{type:"num",value:1}],color:{argb:"FFD4C2F7"},gradient:false}]});
  }

  /* ---------- Checklist (matriz) ---------- */
  const wsC=wb.addWorksheet("Checklist",{properties:{tabColor:{argb:"FF07838C"}},views:[{state:"frozen",xSplit:2,ySplit:5,showGridLines:false}]});
  const epCols=eps.length, spanC=Math.max(4,3+epCols);
  titleBlock(wsC,"Checklist por episódio","✓ = concluído. A última coluna mostra em quantos episódios cada tarefa foi feita.",spanC);
  wsC.getColumn(1).width=16; wsC.getColumn(2).width=40;
  for(let k=0;k<epCols;k++) wsC.getColumn(3+k).width=12;
  wsC.getColumn(3+epCols).width=14;
  const h1=wsC.getRow(4), h2=wsC.getRow(5);
  h1.getCell(1).value="Fase"; h1.getCell(2).value="Tarefa";
  eps.forEach((ep,k)=>{ h1.getCell(3+k).value=toDate(ep.date); h1.getCell(3+k).numFmt="dd/mm/yy"; h2.getCell(3+k).value=ep.theme||"Sem tema"; });
  h1.getCell(3+epCols).value="Feito em";
  wsC.mergeCells(4,1,5,1); wsC.mergeCells(4,2,5,2); wsC.mergeCells(4,3+epCols,5,3+epCols);
  for(let c=1;c<=3+epCols;c++){
    [h1,h2].forEach((row,ri)=>{ const cell=row.getCell(c); cell.fill=fill(ri===0?C.purple:"FF7B3FE0"); cell.font=F({bold:ri===0,size:ri===0?10:9,color:{argb:C.white}}); cell.alignment={vertical:"middle",horizontal:c>2?"center":"left",wrapText:true,indent:c>2?0:1}; cell.border=border; });
  }
  h1.height=22; h2.height=34;
  let rowIdx=6;
  const colL=k=>wsC.getColumn(k).letter;
  PHASES.forEach(p=>{
    const pr=wsC.getRow(rowIdx); wsC.mergeCells(rowIdx,1,rowIdx,3+epCols);
    const pc=pr.getCell(1); pc.value=p.num+": "+p.name+"  ("+p.when+")"; pc.font=F({bold:true,color:{argb:C.white}}); pc.fill=fill(PH_COL[p.id]); pc.alignment={vertical:"middle",indent:1}; pr.height=22;
    rowIdx++;
    p.items.forEach((it,ii)=>{
      const r=wsC.getRow(rowIdx);
      r.getCell(1).value=p.name; r.getCell(2).value=it.t;
      let cnt=0;
      eps.forEach((ep,k)=>{ const ok=!!(ep.checks||{})[it.id]; if(ok) cnt++; const c=r.getCell(3+k); c.value=ok?"✓":"";
        c.fill=fill(ok?C.greenBg:(ii%2?C.grey:C.white)); c.font=F({bold:true,size:11,color:{argb:C.green}}); c.alignment={horizontal:"center",vertical:"middle"}; c.border=border; });
      const fc=r.getCell(3+epCols);
      if(epCols){ fc.value={formula:`IFERROR(COUNTIF(${colL(3)}${rowIdx}:${colL(2+epCols)}${rowIdx},"✓")/${epCols},0)`,result:cnt/epCols}; }
      else fc.value=0;
      fc.numFmt="0%"; fc.font=F({bold:true}); fc.alignment={horizontal:"center",vertical:"middle"}; fc.border=border; fc.fill=fill(ii%2?C.grey:C.white);
      [1,2].forEach(j=>{ const c=r.getCell(j); c.font=F(j===1?{color:{argb:C.muted},size:9}:{}); c.fill=fill(ii%2?C.grey:C.white); c.border=border; c.alignment={vertical:"middle",wrapText:true,indent:1}; });
      rowIdx++;
    });
    if(p.rating){
      const r=wsC.getRow(rowIdx); r.getCell(1).value=p.name; r.getCell(2).value="Avaliação de 1 a 5";
      let cnt=0;
      eps.forEach((ep,k)=>{ const rt=ratingOf(ep.rating); if(rt) cnt++; const c=r.getCell(3+k); c.value=rt?rt.n:"";
        c.font=F({bold:true,color:{argb:rt?({5:C.green,4:C.cyan,3:C.orange,2:C.red,1:C.red}[rt.n]):C.muted}}); c.fill=fill(rt?({5:C.greenBg,4:"FFDDF3F4",3:C.orangeBg,2:C.redBg,1:C.redBg}[rt.n]):C.white);
        c.alignment={horizontal:"center",vertical:"middle"}; c.border=border; });
      const fc=r.getCell(3+epCols);
      fc.value = epCols ? {formula:`IFERROR(COUNT(${colL(3)}${rowIdx}:${colL(2+epCols)}${rowIdx})/${epCols},0)`,result:cnt/epCols} : 0;
      fc.numFmt="0%"; fc.font=F({bold:true}); fc.alignment={horizontal:"center",vertical:"middle"}; fc.border=border;
      [1,2].forEach(j=>{ const c=r.getCell(j); c.font=F(j===1?{color:{argb:C.muted},size:9}:{italic:true}); c.border=border; c.alignment={vertical:"middle",indent:1}; });
      rowIdx++;
    }
  });
  if(epCols) wsC.addConditionalFormatting({ref:`${colL(3+epCols)}7:${colL(3+epCols)}${rowIdx-1}`,rules:[{type:"dataBar",priority:1,minLength:0,maxLength:100,cfvo:[{type:"num",value:0},{type:"num",value:1}],color:{argb:"FFBFE6CD"},gradient:false}]});

  /* ---------- Avaliações ---------- */
  const rated=eps.filter(e=>ratingOf(e.rating));
  const wsA=wb.addWorksheet("Avaliações",{properties:{tabColor:{argb:"FF2B8750"}},views:[{state:"frozen",ySplit:4,showGridLines:false}]});
  const colsA=[{h:"Data",w:12},{h:"Tema",w:34},{h:"Nota",w:8},{h:"Avaliação",w:34},{h:"O que funcionou e o que ajustar",w:70}];
  titleBlock(wsA,"Avaliações da pós-produção","Só episódios que já receberam nota, do mais recente para o mais antigo.",colsA.length);
  wsA.columns=colsA.map(c=>({width:c.w}));
  const hA=wsA.getRow(4); colsA.forEach((c,i)=>hA.getCell(i+1).value=c.h); headerRow(hA,colsA);
  rated.slice().reverse().forEach((ep,i)=>{
    const rt=ratingOf(ep.rating), r=wsA.getRow(5+i);
    [toDate(ep.date),ep.theme||"",rt.n,rt.t,ep.review||"Sem anotações."].forEach((v,j)=>r.getCell(j+1).value=v);
    const bg={5:C.greenBg,4:"FFDDF3F4",3:C.orangeBg,2:C.redBg,1:C.redBg}[rt.n], fg={5:C.green,4:C.cyan,3:C.orange,2:C.red,1:C.red}[rt.n];
    for(let j=1;j<=5;j++){ const c=r.getCell(j); c.font=F(); c.border=border; c.fill=fill(i%2?C.grey:C.white); c.alignment={vertical:"top",wrapText:j>=4||j===2,horizontal:j===3?"center":"left",indent:j===3?0:1}; }
    r.getCell(1).numFmt="dd/mm/yyyy"; r.getCell(1).font=F({bold:true});
    [3,4].forEach(j=>{ r.getCell(j).fill=fill(bg); r.getCell(j).font=F({bold:j===3,color:{argb:fg}}); });
    if(!ep.review) r.getCell(5).font=F({italic:true,color:{argb:C.muted}});
  });
  if(!rated.length){ wsA.mergeCells(5,1,5,5); const c=wsA.getCell(5,1); c.value="Nenhum episódio avaliado ainda."; c.font=F({italic:true,color:{argb:C.muted}}); }

  /* ---------- Perguntas do público ---------- */
  const wsP=wb.addWorksheet("Perguntas",{properties:{tabColor:{argb:"FF6A16DC"}},views:[{state:"frozen",ySplit:4,showGridLines:false}]});
  const colsP=[{h:"Data",w:12},{h:"Episódio",w:30},{h:"Horário",w:9},{h:"Nome",w:24},{h:"Pergunta",w:60},{h:"Situação",w:15},{h:"Votos",w:8},{h:"Fila do apresentador",w:17},{h:"Foi ao ar",w:10}];
  const subP = inter.status==="ok" ? "Todas as perguntas enviadas pelos ouvintes, por episódio e da mais votada para a menos votada."
    : inter.status==="login" ? "Para incluir as perguntas, exporte com o login da produção ou de um apresentador."
    : "A interação com o público ainda não está ativa nesta central.";
  titleBlock(wsP,"Perguntas do público",subP,colsP.length);
  wsP.columns=colsP.map(c=>({width:c.w}));
  const hP=wsP.getRow(4); colsP.forEach((c,i)=>hP.getCell(i+1).value=c.h); headerRow(hP,colsP);
  const epById={}; eps.forEach(e=>epById[e.id]=e);
  const SIT={nova:"Recebida",aprovada:"Recebida",no_ar:"Na tela",respondida:"Respondida",descartada:"Removida"};
  const SITC={nova:[C.muted,C.grey],aprovada:[C.cyan,"FFDDF3F4"],no_ar:[C.purple,C.lav2],respondida:[C.green,C.greenBg],descartada:[C.muted,C.grey]};
  const qRows=(inter.rows||[]).filter(q=>epById[q.episode_id]).sort((a,b)=>((epById[a.episode_id].date||"").localeCompare(epById[b.episode_id].date||""))||(b.votos-a.votos)||a.criada_em.localeCompare(b.criada_em));
  qRows.forEach((q,i)=>{
    const ep=epById[q.episode_id], r=wsP.getRow(5+i), d=new Date(q.criada_em);
    const hora=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
    const naFila = q.fila_apresentador===true || q.pedido_apresentador!=null;
    const aoAr = !!q.no_ar_em;
    [toDate(ep.date),ep.theme||"",hora,q.nome||"Anônimo",q.texto,SIT[q.status]||q.status,q.votos||0,naFila?"Sim":"Não",aoAr?"Sim":"Não"].forEach((v,j)=>r.getCell(j+1).value=v);
    for(let j=1;j<=colsP.length;j++){ const c=r.getCell(j); c.font=F(); c.border=border; c.fill=fill(i%2?C.grey:C.white);
      c.alignment={vertical:"top",wrapText:[2,5].includes(j),horizontal:[3,6,7,8,9].includes(j)?"center":"left",indent:[3,6,7,8,9].includes(j)?0:1}; }
    r.getCell(1).numFmt="dd/mm/yyyy"; r.getCell(1).font=F({bold:true});
    if(!q.nome) r.getCell(4).font=F({italic:true,color:{argb:C.muted}});
    const sc=SITC[q.status]||[C.ink,C.white]; r.getCell(6).font=F({bold:true,color:{argb:sc[0]}}); r.getCell(6).fill=fill(sc[1]);
    r.getCell(7).font=F({bold:true,color:{argb:C.purple}});
    if(naFila) r.getCell(8).font=F({bold:true,color:{argb:C.orange}});
    if(aoAr) r.getCell(9).font=F({bold:true,color:{argb:C.green}});
  });
  if(!qRows.length){ wsP.mergeCells(5,1,5,colsP.length); const c=wsP.getCell(5,1); c.value=inter.status==="ok"?"Nenhuma pergunta recebida ainda.":subP; c.font=F({italic:true,color:{argb:C.muted}}); }
  else wsP.autoFilter={from:{row:4,column:1},to:{row:4+qRows.length,column:colsP.length}};
  const nQ=qRows.length;

  /* ---------- Ranking (pontuação por episódio) ---------- */
  const wsK=wb.addWorksheet("Ranking",{properties:{tabColor:{argb:"FFFFC93C"}},views:[{state:"frozen",ySplit:4,showGridLines:false}]});
  const colsK=[{h:"Data",w:12},{h:"Episódio",w:30},{h:"Posição",w:9},{h:"Nome",w:28},{h:"Pontos",w:9},{h:"Check-in",w:9},{h:"Quiz",w:8},{h:"Votação",w:9},{h:"Perguntas",w:10},{h:"Votos recebidos",w:12},{h:"Acertos",w:9},{h:"1º lugares",w:10},{h:"2º lugares",w:10},{h:"3º lugares",w:10},{h:"Tempo (s)",w:10}];
  const subK = rank.status==="ok" ? "Ranking de cada episódio com pontuação ligada, na ordem de classificação (desempate: 1º lugares, 2º, 3º e menor tempo)."
    : rank.status==="login" ? "Para incluir o ranking, exporte com o login da produção."
    : rank.status==="sql" ? "Para incluir o ranking, rode os arquivos de pontuação no Supabase."
    : "A pontuação ainda não está ativa nesta central.";
  titleBlock(wsK,"Ranking da pontuação",subK,colsK.length);
  wsK.columns=colsK.map(c=>({width:c.w}));
  const hK=wsK.getRow(4); colsK.forEach((c,i)=>hK.getCell(i+1).value=c.h); headerRow(hK,colsK);
  const kRows=(rank.list||[]).slice().sort((a,b)=>((a.ep.date||"").localeCompare(b.ep.date||""))||(a.posicao-b.posicao));
  const MED={1:"FFFFF3C4",2:"FFEDF0F5",3:"FFF8E6D6"};
  kRows.forEach((k,i)=>{
    const r=wsK.getRow(5+i);
    [toDate(k.ep.date),k.ep.theme||"",k.posicao,k.nome,k.pontos,k.pontos_checkin||0,k.pontos_quiz,k.pontos_votacao,k.pontos_perguntas,k.pontos_votos||0,k.acertos,k.primeiros,k.segundos,k.terceiros,Math.round((Number(k.tempo_ms)||0)/100)/10].forEach((v,j)=>r.getCell(j+1).value=v);
    for(let j=1;j<=colsK.length;j++){ const c=r.getCell(j); c.font=F(); c.border=border; c.fill=fill(MED[k.posicao]||(i%2?C.grey:C.white));
      c.alignment={vertical:"top",wrapText:j===2,horizontal:j>=3&&j!==4?"center":"left",indent:j>=3&&j!==4?0:1}; }
    r.getCell(1).numFmt="dd/mm/yyyy"; r.getCell(1).font=F({bold:true});
    r.getCell(3).font=F({bold:true}); r.getCell(5).font=F({bold:true,color:{argb:C.purple}});
  });
  if(!kRows.length){ wsK.mergeCells(5,1,5,colsK.length); const c=wsK.getCell(5,1); c.value=rank.status==="ok"?"Nenhum episódio com pontuação ligada teve participantes ainda.":subK; c.font=F({italic:true,color:{argb:C.muted}}); }
  else wsK.autoFilter={from:{row:4,column:1},to:{row:4+kRows.length,column:colsK.length}};

  /* ---------- Resumo (primeira aba) ---------- */
  const wsR=wb.addWorksheet("Resumo",{properties:{tabColor:{argb:"FFFFA744"}},views:[{showGridLines:false}]});
  wsR.orderNo=0; wsE.orderNo=1; wsC.orderNo=2; wsA.orderNo=3; wsP.orderNo=4; // Resumo primeiro
  titleBlock(wsR,PN()+": resumo",exported,4);
  wsR.getColumn(1).width=38; wsR.getColumn(2).width=16; wsR.getColumn(3).width=14; wsR.getColumn(4).width=46;
  const eR=`'Episódios'!$A$5:$A$${4+Math.max(n,1)}`, gR=`'Episódios'!$G$5:$G$${4+Math.max(n,1)}`, pR=`'Episódios'!$E$5:$E$${4+Math.max(n,1)}`;
  const avg=rated.length? rated.reduce((a,e)=>a+e.rating,0)/rated.length : 0;
  const avgChk=n? eps.reduce((a,ep)=>a+PHASES.reduce((x,p)=>x+phaseDone(p,ep),0)/TOTAL,0)/n : 0;
  const kpis=[
    ["Episódios cadastrados",{formula:`COUNT(${eR})`,result:n},"0"],
    ["Episódios avaliados",{formula:`COUNT(${gR})`,result:rated.length},"0"],
    ["Nota média (1 a 5)",{formula:`IFERROR(AVERAGE(${gR}),0)`,result:avg},"0.0"],
    ["Checklist concluído em média",{formula:`IFERROR(AVERAGE(${pR}),0)`,result:avgChk},"0%"]
  ];
  const kh=wsR.getRow(4); ["Indicador","Valor"].forEach((h,i)=>kh.getCell(i+1).value=h); headerRow(kh,[1,2]);
  kpis.forEach(([label,val,fmt],i)=>{
    const r=wsR.getRow(5+i); r.height=24;
    r.getCell(1).value=label; r.getCell(2).value=val; r.getCell(2).numFmt=fmt;
    r.getCell(1).font=F(); r.getCell(2).font=F({bold:true,size:13,color:{argb:C.purple}});
    [1,2].forEach(j=>{ const c=r.getCell(j); c.border=border; c.fill=fill(i%2?C.grey:C.white); c.alignment={vertical:"middle",horizontal:j===2?"center":"left",indent:j===1?1:0}; });
  });
  const dh=wsR.getRow(11); ["Nota","Episódios","% dos avaliados","Significado"].forEach((h,i)=>dh.getCell(i+1).value=h); headerRow(dh,[1,2,3,4]);
  RATINGS.forEach((rt,i)=>{
    const r=wsR.getRow(12+i), cnt=rated.filter(e=>e.rating===rt.n).length, rowN=12+i;
    r.getCell(1).value=rt.n; r.getCell(2).value={formula:`COUNTIF(${gR},${rt.n})`,result:cnt};
    r.getCell(3).value={formula:`IFERROR(B${rowN}/$B$6,0)`,result:rated.length?cnt/rated.length:0}; r.getCell(3).numFmt="0%";
    r.getCell(4).value=rt.t;
    const bg={5:C.greenBg,4:"FFDDF3F4",3:C.orangeBg,2:C.redBg,1:C.redBg}[rt.n], fg={5:C.green,4:C.cyan,3:C.orange,2:C.red,1:C.red}[rt.n];
    for(let j=1;j<=4;j++){ const c=r.getCell(j); c.border=border; c.font=F(j===1?{bold:true,color:{argb:fg}}:{}); c.fill=fill(j===1?bg:C.white); c.alignment={vertical:"middle",horizontal:j<=3?"center":"left",indent:j===4?1:0}; }
    r.height=20;
  });
  wsR.addConditionalFormatting({ref:"C12:C16",rules:[{type:"dataBar",priority:1,minLength:0,maxLength:100,cfvo:[{type:"num",value:0},{type:"num",value:1}],color:{argb:"FFD4C2F7"},gradient:false}]});
  // Interação com o público
  const ih=wsR.getRow(19); ["Interação com o público","Valor"].forEach((h,i)=>ih.getCell(i+1).value=h); headerRow(ih,[1,2]);
  const lastP=4+Math.max(nQ,1);
  const pS=`'Perguntas'!$F$5:$F$${lastP}`, pV=`'Perguntas'!$G$5:$G$${lastP}`, pA=`'Perguntas'!$I$5:$I$${lastP}`, pF=`'Perguntas'!$H$5:$H$${lastP}`;
  const cnt=st=>qRows.filter(q=>q.status===st).length;
  const kI = inter.status==="ok" ? [
    ["Perguntas recebidas",{formula:`COUNTA('Perguntas'!$E$5:$E$${lastP})`,result:nQ},"0"],
    ["Respondidas",{formula:`COUNTIF(${pS},"Respondida")`,result:cnt("respondida")},"0"],
    ["Sem resposta",{formula:`COUNTIF(${pS},"Recebida")`,result:cnt("aprovada")+cnt("nova")},"0"],
    ["Removidas pela produção",{formula:`COUNTIF(${pS},"Removida")`,result:cnt("descartada")},"0"],
    ["Foram ao ar",{formula:`COUNTIF(${pA},"Sim")`,result:qRows.filter(q=>q.no_ar_em).length},"0"],
    ["Escolhidas pelo apresentador",{formula:`COUNTIF(${pF},"Sim")`,result:qRows.filter(q=>q.fila_apresentador===true||q.pedido_apresentador!=null).length},"0"],
    ["Votos do público",{formula:`SUM(${pV})`,result:qRows.reduce((a,q)=>a+(q.votos||0),0)},"0"]
  ] : [["Perguntas do público", inter.status==="login"?"Exporte com login da equipe para incluir":"Não disponível", "@"]];
  kI.forEach(([label,val,fmt],i)=>{
    const r=wsR.getRow(20+i); r.height=22;
    r.getCell(1).value=label; r.getCell(2).value=val; if(fmt!=="@") r.getCell(2).numFmt=fmt;
    r.getCell(1).font=F(); r.getCell(2).font=fmt==="@"?F({italic:true,color:{argb:C.muted}}):F({bold:true,size:12,color:{argb:C.purple}});
    [1,2].forEach(j=>{ const c=r.getCell(j); c.border=border; c.fill=fill(i%2?C.grey:C.white); c.alignment={vertical:"middle",horizontal:j===2?"center":"left",indent:j===1?1:0,wrapText:true}; });
  });
  const noteRow=20+kI.length+1;
  const note=wsR.getRow(noteRow).getCell(1);
  note.value="Os indicadores são calculados por fórmulas a partir das abas Episódios e Perguntas. Detalhes de cada tarefa estão na aba Checklist da planilha; os comentários da pós-produção, na aba Avaliações.";
  wsR.mergeCells(noteRow,1,noteRow,4); note.font=F({italic:true,size:9,color:{argb:C.muted}}); note.alignment={wrapText:true,vertical:"top"}; wsR.getRow(noteRow).height=30;

  [wsE,wsC,wsA,wsR,wsP].forEach(w=>{ w.pageSetup={orientation:"landscape",fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9}; });
  return wb.xlsx.writeBuffer();
}

$("#editChk").addEventListener("click",openEditor);
$("#edBack").addEventListener("click",closeEditor);
$("#edCancel").addEventListener("click",closeEditor);
$("#edSave").addEventListener("click",saveEditor);
$("#exportBtn").addEventListener("click",exportHistory);

/* ---------- QR Code ---------- */
let qrCur=null, qrLogoImg=null;
function loadQrLogo(){
  if(qrLogoImg) return qrLogoImg;
  qrLogoImg=new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=(document.querySelector("img.logo")||{}).src||"img/akicast-logo.png"; });
  return qrLogoImg;
}
function wrapLines(ctx,text,maxW){
  const words=String(text||"").split(/\s+/), lines=[]; let cur="";
  words.forEach(w=>{ const t=cur?cur+" "+w:w; if(ctx.measureText(t).width>maxW && cur){ lines.push(cur); cur=w; } else cur=t; });
  if(cur) lines.push(cur); return lines;
}
async function qrPngBlob(){
  if(!qrCur) throw new Error("sem QR");
  if(document.fonts&&document.fonts.ready) await document.fonts.ready;
  const W=1080, H=1350, c=document.createElement("canvas"); c.width=W; c.height=H;
  const x=c.getContext("2d"), font='"Urbanist", system-ui, -apple-system, "Segoe UI", sans-serif';
  x.fillStyle="#ffffff"; x.fillRect(0,0,W,H);
  PG().stripe.forEach((col,i)=>{ x.fillStyle=col; x.fillRect(i*W/4,0,W/4+1,22); });
  const logo=await loadQrLogo();
  const lw=230, lh=logo?Math.round(lw*logo.naturalHeight/logo.naturalWidth):0;
  const n=qrCur.qr.getModuleCount(), cell=Math.floor(700/n), real=cell*n, ox=Math.round((W-real)/2);
  x.font=`800 50px ${font}`; const tl=wrapLines(x,qrCur.title,W-140).slice(0,2);
  x.font=`600 32px ${font}`; const el=qrCur.ep?wrapLines(x,qrCur.ep,W-160).slice(0,2):[];
  const total=(lh?lh+56:0)+real+70+tl.length*62+(el.length?18+el.length*44:0);
  let y=Math.round(22+(H-22-total)/2);
  if(logo){ x.drawImage(logo,Math.round((W-lw)/2),y,lw,lh); y+=lh+56; }
  x.fillStyle="#241845";
  for(let r=0;r<n;r++) for(let col=0;col<n;col++) if(qrCur.qr.isDark(r,col)) x.fillRect(ox+col*cell,y+r*cell,cell,cell);
  y+=real+70;
  x.textAlign="center"; x.textBaseline="top";
  x.fillStyle=PG().brand; x.font=`800 50px ${font}`;
  tl.forEach(l=>{ x.fillText(l,W/2,y); y+=62; });
  if(el.length){ y+=18; x.fillStyle="#655A80"; x.font=`600 32px ${font}`; el.forEach(l=>{ x.fillText(l,W/2,y); y+=44; }); }
  return await new Promise(res=>c.toBlob(res,"image/png"));
}
function qrFileName(){
  const base=(qrCur&&qrCur.title||"qr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);
  return PROG+"-qr-"+(base||"link")+".png";
}
async function showQr(url,title,epId){
  const ov=$("#qrOv"), box=$("#qrBox");
  $("#qrActs").hidden=true; qrCur=null;
  $("#qrTitle").textContent=title||"Aponte a câmera";
  const ep=episodes.find(e=>e.id===(epId||presEpId));
  $("#qrEp").textContent = ep ? "AkiCast de "+fmtShort(ep.date)+(ep.theme?": "+ep.theme:"") : "";
  $("#qrUrl").textContent=url;
  box.innerHTML='<p class="status">Gerando…</p>';
  ov.hidden=false; $("#qrClose").focus();
  try{
    await loadScript(LIBS.qr);
    const qr=window.qrcode(0,"M"); qr.addData(url); qr.make();
    box.innerHTML=qr.createSvgTag({cellSize:8,margin:2,scalable:true});
    qrCur={qr,url,title:title||"Aponte a câmera",ep:$("#qrEp").textContent};
    $("#qrActs").hidden=false;
    let canFile=false; try{ canFile=!!(navigator.canShare&&navigator.canShare({files:[new File([new Blob(["x"])],"x.png",{type:"image/png"})]})); }catch(e){}
    $("#qrShare").hidden=!canFile;
    $("#qrCopyImg").hidden=!(navigator.clipboard&&window.ClipboardItem);
  }catch(e){ box.innerHTML='<p class="status warn">Não foi possível gerar o QR Code. Use o botão Copiar link.</p>'; }
}
function closeQr(){ $("#qrOv").hidden=true; }
$("#qrPng").addEventListener("click",async()=>{
  try{ const blob=await qrPngBlob(); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=qrFileName(); document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); toast("Imagem do QR Code baixada."); }
  catch(e){ toast("Não foi possível gerar a imagem."); }
});
$("#qrCopyImg").addEventListener("click",async()=>{
  try{ const blob=await qrPngBlob(); await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]); toast("Imagem copiada. É só colar (Ctrl+V) na conversa ou no slide."); }
  catch(e){ toast("Este navegador não deixou copiar a imagem. Use Baixar imagem."); }
});
$("#qrShare").addEventListener("click",async()=>{
  try{ const blob=await qrPngBlob(); const f=new File([blob],qrFileName(),{type:"image/png"}); await navigator.share({files:[f],title:qrCur.title,text:qrCur.title+"\n"+qrCur.url}); }
  catch(e){ if(e&&e.name!=="AbortError") toast("Não foi possível compartilhar. Use Baixar imagem."); }
});
$("#qrClose").addEventListener("click",closeQr);
$("#qrOv").addEventListener("click",e=>{ if(e.target.id==="qrOv") closeQr(); });
addEventListener("keydown",e=>{ if(e.key==="Escape" && !$("#qrOv").hidden) closeQr(); });

/* ---------- Swipe no controle ---------- */
function wireSwipe(el){
  let sx=0, sy=0, st=0, active=false, id=null;
  el.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; active=true; id=e.pointerId; sx=e.clientX; sy=e.clientY; st=Date.now(); });
  const end=e=>{
    if(!active||e.pointerId!==id) return; active=false;
    const dx=e.clientX-sx, dy=e.clientY-sy, dt=Date.now()-st;
    if(Math.abs(dx)<50 || Math.abs(dx)<Math.abs(dy)*1.5 || dt>900 || !live) return;
    const cur=$("#ctrlCur"); cur.classList.remove("nudge-l","nudge-r"); void cur.offsetWidth; cur.classList.add(dx<0?"nudge-l":"nudge-r");
    move(dx<0?1:-1);
  };
  el.addEventListener("pointerup",end);
  el.addEventListener("pointercancel",()=>{ active=false; });
}
wireSwipe($("#ctrlCur")); wireSwipe($("#ctrlNext")); wireSwipe($("#ctrlMini"));

/* ---------- Indicador das abas e onda de clique ---------- */
function moveTabInd(){
  const nav=document.querySelector("nav.tabs"); if(!nav) return;
  const sel=nav.querySelector('button[aria-selected="true"]'), ind=nav.querySelector(".tab-ind");
  if(!sel||!ind) return;
  ind.style.width=sel.offsetWidth+"px"; ind.style.transform="translateX("+sel.offsetLeft+"px)";
}
document.querySelector("nav.tabs").addEventListener("click",()=>requestAnimationFrame(moveTabInd));
addEventListener("resize",moveTabInd);
requestAnimationFrame(()=>{ moveTabInd(); requestAnimationFrame(()=>document.querySelector("nav.tabs").classList.remove("no-anim")); });
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(moveTabInd);
const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)");
document.addEventListener("pointerdown",e=>{
  if(reduceMotion.matches) return;
  const b=e.target.closest(".btn,.back,.add-btn,.icon-btn,nav.tabs button");
  if(!b||b.disabled||b.getAttribute("aria-disabled")==="true") return;
  const r=b.getBoundingClientRect(), size=Math.max(r.width,r.height)*2.2;
  const sp=document.createElement("span"); sp.className="ripple";
  sp.style.width=sp.style.height=size+"px";
  sp.style.left=(e.clientX-r.left-size/2)+"px"; sp.style.top=(e.clientY-r.top-size/2)+"px";
  if(getComputedStyle(b).position==="static") b.style.position="relative";
  b.appendChild(sp); sp.addEventListener("animationend",()=>sp.remove());
},{passive:true});

/* =================== Painel inicial =================== */
const DEFAULT_INVENTORY=[
  {id:"inv_lapela",name:"Microfones de lapela",qty:2,location:"",note:"Carregar antes da gravação. Ligam por cabo no dispositivo de controle."},
  {id:"inv_camera",name:"Câmera",qty:1,location:"",note:"Ligar por cabo direto no computador e deixar aberta para não superaquecer."},
  {id:"inv_tripes",name:"Tripés",qty:3,location:"Emprestados",note:"1 para a câmera e 2 para as luzes. Confirmar o empréstimo na véspera."},
  {id:"inv_lampadas",name:"Lâmpadas",qty:2,location:"Caixa azul",note:""},
  {id:"inv_cabos",name:"Cabos e extensões",qty:null,location:"Caixa azul",note:""},
  {id:"inv_rede",name:"Cabo de rede",qty:1,location:"",note:""},
  {id:"inv_tela2",name:"Segunda tela",qty:1,location:"",note:"Em avaliação como apoio visual do apresentador."}
];
let inventory=DEFAULT_INVENTORY.map(x=>({...x})), invAvailable=false, invEditing=false, invDraft=null;
const invRow=r=>({id:r.id,name:r.name,qty:r.qty,location:r.location||"",note:r.note||"",position:r.position||0});
async function loadInventory(){
  if(!SB) return;
  const {data,error}=await SB.from("inventory").select("*").order("position",{ascending:true});
  if(error){ invAvailable=false; renderHome(); return; }
  invAvailable=true;
  if(!data.length){
    await SB.from("inventory").upsert(DEFAULT_INVENTORY.map((x,i)=>({...x,position:(i+1)*10})));
    inventory=DEFAULT_INVENTORY.map(x=>({...x}));
  } else inventory=data.map(invRow);
  if(!invEditing) renderHome();
}
function watchInventory(){
  let t=null;
  SB.channel("inv-"+uid()).on("postgres_changes",{event:"*",schema:"public",table:"inventory"},()=>{ clearTimeout(t); t=setTimeout(()=>{ if(!invEditing) loadInventory(); },400); }).subscribe();
}

function goEpisode(id){ $("#tab-check").click(); openEp(id); }
function goTab(id){ const t=$("#"+id); if(t) t.click(); window.scrollTo(0,0); }

function renderHome(){
  const el=$("#homeBody"); if(!el) return;
  if(!store){ el.innerHTML='<p class="status">Carregando…</p>'; return; }
  const today=isoDate(new Date());
  const upcoming=episodes.filter(e=>!isPast(e.date)).sort((a,b)=>(a.date||"9").localeCompare(b.date||"9"));
  const past=episodes.filter(e=>isPast(e.date)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const next=upcoming[0];
  const rated=episodes.filter(e=>ratingOf(e.rating));
  const avg=rated.length? (rated.reduce((a,e)=>a+e.rating,0)/rated.length) : null;
  const pending=past.filter(e=>!ratingOf(e.rating)).length;
  const doneOf=ep=>PHASES.reduce((a,p)=>a+phaseDone(p,ep),0);
  const miniBars=ep=>PHASES.map(p=>`<div class="bar" style="color:${p.color};flex:${phaseTotal(p)}"><i style="width:${phaseDone(p,ep)/phaseTotal(p)*100}%"></i></div>`).join("");
  const badge=ep=>{ const r=ratingOf(ep.rating); return r?`<span class="badge" style="color:${r.c};background:color-mix(in srgb,${r.c} 16%,transparent)">${r.n}: ${esc(r.t)}</span>`:'<span class="badge" style="color:var(--warn-ink);background:var(--warn-bg)">Avaliação pendente</span>'; };

  let nextHtml;
  if(next){
    const d=parseDate(next.date), start=new Date(d); start.setHours(9,0,0,0);
    const ms=start-new Date(); let cd;
    if(ms<=0) cd="No ar agora";
    else { const days=Math.floor(ms/86400000), h=Math.floor(ms%86400000/3600000), m=Math.floor(ms%3600000/60000);
      cd = days>=1 ? `Faltam ${days} ${days===1?"dia":"dias"} e ${h} h` : (h>=1?`Faltam ${h} h e ${m} min`:`Faltam ${m} min`); }
    const pres=parsePresenters(next.presenters);
    const yt=normUrl(next.youtube_url), sl=normUrl(next.slido_url);
    nextHtml=`<div class="home-card home-next">
      <div class="hc-label">Próximo AkiCast</div>
      <div class="hn-date">${esc(fmtLong(next.date))}, 9h</div>
      <div class="hn-count">${esc(cd)}</div>
      <div class="hn-theme ${next.theme?"":"none"}">${esc(next.theme||"Tema a definir")}</div>
      ${pres.length?`<div class="hn-pres">${pres.map(n=>`<span class="chip sm">${esc(n)}</span>`).join("")}</div>`:""}
      <div class="mini hn-bars">${miniBars(next)}</div>
      <div class="hn-prog">${doneOf(next)} de ${TOTAL} itens do checklist</div>
      <div class="hn-actions">
        <button class="btn primary" data-go-ep="${esc(next.id)}">Abrir checklist</button>
        <button class="btn ghost" data-go-pres="${esc(next.id)}">Apresentação</button>
        ${yt?`<a class="btn ghost" href="${esc(yt)}" target="_blank" rel="noopener">Live no YouTube</a>`:""}
        ${sl?`<a class="btn ghost" href="${esc(sl)}" target="_blank" rel="noopener">Slido</a>`:""}
      </div>
    </div>`;
  } else {
    nextHtml=`<div class="home-card home-next empty-next">
      <div class="hc-label">Próximo AkiCast</div>
      <div class="hn-theme none">Nenhum episódio agendado.</div>
      <div class="hn-actions"><button class="btn primary" id="homeNew">Criar o próximo episódio</button></div>
    </div>`;
  }

  const stats=`<div class="home-card home-stats">
    <div class="hc-label">Em números</div>
    <div class="stat"><span class="sv">${past.length}</span><span class="sk">AkiCasts realizados</span></div>
    <div class="stat"><span class="sv">${avg!=null?avg.toFixed(1).replace(".",","):"–"}</span><span class="sk">Nota média${rated.length?` em ${rated.length} ${rated.length===1?"avaliação":"avaliações"}`:""}</span></div>
    <div class="stat"><span class="sv${pending?" warn-t":""}">${pending}</span><span class="sk">${pending===1?"Avaliação pendente":"Avaliações pendentes"}</span></div>
  </div>`;

  const lastList=past.slice(0,4);
  const lastHtml=`<div class="home-card home-last">
    <div class="hc-head"><div class="hc-label">Últimos AkiCasts</div>${past.length>4?`<button class="linkbtn" data-go-tab="tab-check">Ver todos</button>`:""}</div>
    ${lastList.length? `<ul class="last-list">${lastList.map(ep=>{ const d=parseDate(ep.date); const pres=parsePresenters(ep.presenters);
      return `<li><button class="last-item" data-go-ep="${esc(ep.id)}">
        <span class="li-date"><b>${d?d.getDate():"–"}</b>${d?MONTHS_S[d.getMonth()]:""}</span>
        <span class="li-main"><span class="li-theme">${esc(ep.theme||"Sem tema")}</span><span class="li-pres">${esc(pres.join(", ")||"Sem apresentadores")}</span></span>
        ${badge(ep)}
      </button></li>`; }).join("")}</ul>` : '<p class="meta">Os episódios realizados aparecem aqui.</p>'}
  </div>`;

  const inv = invEditing ? invEditorHtml() : `<div class="home-card home-inv">
    <div class="hc-head"><div class="hc-label">Equipamentos e onde ficam</div><button class="btn ghost sm" id="invEdit" type="button">Editar</button></div>
    <div class="table-wrap inv-wrap"><table class="inv-table">
      <thead><tr><th scope="col">Item</th><th scope="col">Qtd.</th><th scope="col">Onde fica</th><th scope="col">Observação</th></tr></thead>
      <tbody>${inventory.map(it=>`<tr><td class="inv-name">${esc(it.name)}</td><td class="inv-qty">${it.qty??"–"}</td>
        <td>${it.location?`<span class="loc${/emprest/i.test(it.location)?" loan":""}">${esc(it.location)}</span>`:'<span class="loc empty">Definir local</span>'}</td>
        <td class="inv-note">${esc(it.note||"")}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>`;

  const shortcuts=`<div class="home-card home-short">
    <div class="hc-label">Atalhos</div>
    <div class="short-grid">
      <button class="short" data-go-tab="tab-check"><span class="si">${ICON_TAB_CHECK}</span>Episódios e checklist</button>
      <button class="short" data-go-tab="tab-pres"><span class="si">${ICON_TAB_PRES}</span>Apresentações</button>
      <button class="short" data-go-tab="tab-guide"><span class="si">${ICON_TAB_GUIDE}</span>Guia técnico</button>
      <button class="short" id="homeExport"><span class="si">${ICON_DL}</span>Exportar histórico</button>
    </div>
  </div>`;

  el.innerHTML=`<div class="home-grid">${nextHtml}${stats}${lastHtml}${shortcuts}${inv}</div>`;
  el.querySelectorAll("[data-go-ep]").forEach(b=>b.addEventListener("click",()=>goEpisode(b.dataset.goEp)));
  el.querySelectorAll("[data-go-pres]").forEach(b=>b.addEventListener("click",()=>{ goTab("tab-pres"); presSelect(b.dataset.goPres); const s=$("#presEp"); if(s) s.value=b.dataset.goPres; }));
  el.querySelectorAll("[data-go-tab]").forEach(b=>b.addEventListener("click",()=>goTab(b.dataset.goTab)));
  const hn=$("#homeNew"); if(hn) hn.addEventListener("click",()=>{ goTab("tab-check"); createEpisode(); });
  const he=$("#homeExport"); if(he) he.addEventListener("click",()=>$("#exportBtn").click());
  const ie=$("#invEdit"); if(ie) ie.addEventListener("click",startInvEdit);
  if(invEditing) wireInvEditor();
}

function startInvEdit(){
  if(!SB){ toast("Editar os equipamentos precisa do Supabase configurado."); return; }
  if(!invAvailable){ toast("Rode o arquivo supabase-atualizacao-painel.sql no Supabase para editar os equipamentos."); return; }
  invEditing=true; invDraft=inventory.map(x=>({...x})); renderHome();
  const f=document.querySelector(".inv-ed input"); if(f) f.focus();
}
function invEditorHtml(){
  return `<div class="home-card home-inv editing">
    <div class="hc-head"><div class="hc-label">Editar equipamentos</div></div>
    <div class="inv-ed-list">
      ${invDraft.map((it,i)=>`<div class="inv-ed">
        <input data-f="name" data-i="${i}" value="${esc(it.name)}" placeholder="Item" maxlength="80" aria-label="Item">
        <input data-f="qty" data-i="${i}" value="${it.qty??""}" placeholder="Qtd." inputmode="numeric" maxlength="4" aria-label="Quantidade">
        <input data-f="location" data-i="${i}" value="${esc(it.location)}" placeholder="Onde fica (ex.: Caixa azul)" maxlength="80" aria-label="Onde fica">
        <input data-f="note" data-i="${i}" value="${esc(it.note)}" placeholder="Observação (opcional)" maxlength="200" aria-label="Observação">
        <button class="linkbtn ed-rm" data-rm="${i}" type="button">Remover</button>
      </div>`).join("")}
    </div>
    <button class="btn ghost" id="invAdd" type="button">Adicionar item</button>
    <div class="ep-foot"><button class="btn ghost" id="invCancel" type="button">Cancelar</button><button class="btn primary" id="invSave" type="button">Salvar equipamentos</button></div>
  </div>`;
}
function wireInvEditor(){
  document.querySelectorAll(".inv-ed input").forEach(inp=>inp.addEventListener("input",()=>{ invDraft[inp.dataset.i][inp.dataset.f]=inp.value; }));
  document.querySelectorAll(".inv-ed [data-rm]").forEach(b=>b.addEventListener("click",()=>{ invDraft.splice(+b.dataset.rm,1); renderHome(); }));
  $("#invAdd").addEventListener("click",()=>{ invDraft.push({id:"inv_"+Date.now().toString(36)+uid().slice(0,3),name:"",qty:null,location:"",note:""}); renderHome(); const l=[...document.querySelectorAll('.inv-ed input[data-f="name"]')].pop(); if(l) l.focus(); });
  $("#invCancel").addEventListener("click",()=>{ invEditing=false; invDraft=null; renderHome(); });
  $("#invSave").addEventListener("click",saveInventory);
}
async function saveInventory(){
  const b=$("#invSave"); b.disabled=true; b.textContent="Salvando…";
  const rows=invDraft.map((it,i)=>({id:it.id,name:(it.name||"").trim(),qty:(String(it.qty??"").trim()===""?null:(parseInt(it.qty,10)||null)),location:(it.location||"").trim(),note:(it.note||"").trim(),position:(i+1)*10})).filter(r=>r.name);
  try{
    const {data:cur,error:e0}=await SB.from("inventory").select("id"); if(e0) throw e0;
    const keep=new Set(rows.map(r=>r.id)), gone=cur.map(r=>r.id).filter(id=>!keep.has(id));
    if(rows.length){ const {error:e1}=await SB.from("inventory").upsert(rows); if(e1) throw e1; }
    if(gone.length){ const {error:e2}=await SB.from("inventory").delete().in("id",gone); if(e2) throw e2; }
    inventory=rows; invEditing=false; invDraft=null; renderHome(); toast("Equipamentos salvos.");
  }catch(e){ handleErr(e); b.disabled=false; b.textContent="Salvar equipamentos"; }
}
setInterval(()=>{ if(!$("#panel-home").hidden && !invEditing) renderHome(); },60000);

const ICON_TAB_CHECK=document.querySelector("#tab-check .ti").outerHTML;
const ICON_TAB_PRES=document.querySelector("#tab-pres .ti").outerHTML;
const ICON_TAB_GUIDE=document.querySelector("#tab-guide .ti").outerHTML;
const ICON_DL='<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/></svg>';
/* Logo do topo: clique volta ao Painel; botão do meio (ou Ctrl+clique) abre o Painel numa aba nova.
   Nas páginas do apresentador e dos ouvintes ela não leva à central (eles não têm acesso). */
{ const bl=$("#brandLink"); if(bl) bl.setAttribute("href",location.pathname+"#painel"); }
$("#brandLink").addEventListener("click",e=>{
  if(document.body.classList.contains("send-mode")){ e.preventDefault(); return; }
  if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey) return;   // o navegador abre numa aba nova
  e.preventDefault(); flushPending();
  if(PAGINA_PROPRIA){ location.href=location.pathname+"#painel"; return; }
  if(selectedId){ lugarRestaurando=true; closeEp(); lugarRestaurando=false; }
  goTab("tab-home");
});

/* =================== Protótipo de interação · Etapa 1: login e segurança =================== */
let SESSION=null; // {usuario, papel, email}
const PAPEL_NOME={admin:"Produção",apresentador:"Apresentador"};
function loginEmail(usuario){
  const tpl=(window.AKICAST_CONFIG||{}).loginEmail||"akicast+{usuario}@akiyama.com.br";
  return tpl.replace("{usuario}",usuario.trim().toLowerCase());
}
function usuarioDoEmail(email){ const m=/\+([^@]+)@/.exec(email||""); return m?m[1]:(email||"").split("@")[0]; }

async function refreshSession(){
  if(!SB){ SESSION=null; renderSession(); return; }
  const {data}=await SB.auth.getSession();
  const s=data&&data.session;
  if(!s){ SESSION=null; renderSession(); renderInt(); updateGate(); return; }
  let papel=null, semSql=false;
  const {data:p,error}=await SB.rpc("int_papel");
  if(error) semSql=true; else papel=p;
  SESSION={email:s.user.email, usuario:usuarioDoEmail(s.user.email), papel, semSql};
  renderSession(); renderInt(); updateGate();
  if(store&&store.reload) store.reload();
  loadLinks(); loadNoAr().then(()=>{ if($("#presBody")) renderPresBody(); });
  if(typeof renderCtrlQs==="function" && cqEp){ cqSig=""; loadCtrlQs(); }
  if(typeof loadSalaQs==="function" && sqEp){ sqSig=""; loadSalaQs(); }
  if(typeof loadQuizEditor==="function" && $("#quizCard") && selectedId) loadQuizEditor(selectedId);
}
function renderSession(){
  const box=$("#sessionBox"); if(!box) return;
  if(!SB){ box.innerHTML=""; return; }
  if(!SESSION){ box.innerHTML='<button class="btn ghost sm" id="loginBtn" type="button"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>Entrar</button>'; $("#loginBtn").addEventListener("click",openLogin); return; }
  const papel = SESSION.papel ? PAPEL_NOME[SESSION.papel] : "Sem papel";
  box.innerHTML=`<span class="sess-chip ${SESSION.papel||"none"}"><span class="sess-dot"></span><b>${esc(SESSION.usuario)}</b><span class="sess-role">${esc(papel)}</span></span><button class="btn ghost sm" id="logoutBtn" type="button">Sair</button>`;
  $("#logoutBtn").addEventListener("click",async()=>{ await SB.auth.signOut(); toast("Você saiu."); refreshSession(); });
}
function openLogin(){
  $("#loginErr").textContent=""; $("#loginUser").value=""; $("#loginPass").value="";
  $("#loginOv").hidden=false; setTimeout(()=>$("#loginUser").focus(),30);
}
function closeLogin(){ $("#loginOv").hidden=true; }
async function doLogin(e){
  if(e) e.preventDefault();
  const u=$("#loginUser").value.trim(), p=$("#loginPass").value, err=$("#loginErr"), b=$("#loginGo");
  err.textContent="";
  if(!u){ err.textContent="Digite o usuário."; $("#loginUser").focus(); return; }
  if(!p){ err.textContent="Digite a senha."; $("#loginPass").focus(); return; }
  b.disabled=true; b.textContent="Entrando…";
  const {error}=await SB.auth.signInWithPassword({email:loginEmail(u),password:p});
  b.disabled=false; b.textContent="Entrar";
  if(error){ err.textContent = /invalid/i.test(error.message||"") ? "Usuário ou senha incorretos." : "Não foi possível entrar: "+error.message; return; }
  closeLogin(); await refreshSession();
  toast(SESSION&&SESSION.papel ? "Bem-vindo, "+SESSION.usuario+"." : "Login feito, mas este usuário ainda não tem papel. Rode a Parte 5 do SQL.");
}
$("#loginForm").addEventListener("submit",doLogin);
{ const gl=$("#gateLogin"); if(gl) gl.addEventListener("click",openLogin); }
$("#loginCancel").addEventListener("click",closeLogin);
$("#loginOv").addEventListener("click",e=>{ if(e.target.id==="loginOv") closeLogin(); });
addEventListener("keydown",e=>{ if(e.key==="Escape" && !$("#loginOv").hidden) closeLogin(); });
["loginUser","loginPass"].forEach(id=>$("#"+id).addEventListener("input",()=>{ $("#loginErr").textContent=""; }));

/* ---------- Aba Interação ---------- */
const INT_ETAPAS=[
  {n:1,t:"Login da equipe e segurança",d:"Logins de produção e apresentadores, e as regras do banco.",ok:true},
  {n:2,t:"Página do ouvinte e moderação",d:"Envio de perguntas pela plataforma e fila da produção.",ok:true},
  {n:3,t:"Tela de perguntas no OBS",d:"Página transparente com destaque e faixa de baixo.",ok:true},
  {n:4,t:"Votos e apresentador",d:"Placar de votos e “Quero responder” no controle.",ok:true},
  {n:5,t:"Relatório",d:"Perguntas e votos na planilha exportada.",ok:true}
];
function renderInt(){
  const el=$("#intBody"); if(!el) return;
  if(!modEp || !episodes.find(e=>e.id===modEp)){ const saved=lsGet("akicast-int-ep"); modEp = (saved && episodes.find(e=>e.id===saved)) ? saved : defaultIntEp(); }
  const ses = !SB ? '<p class="meta">O protótipo precisa do Supabase configurado.</p>'
    : !SESSION ? `<p class="meta">Você está como <b>ouvinte</b> (sem login). Entre com um usuário da produção ou de apresentador para testar os papéis.</p><button class="btn primary" id="intLogin" type="button">Entrar</button>`
    : SESSION.semSql ? `<div class="warn">Login feito como <b>${esc(SESSION.usuario)}</b>, mas o banco ainda não tem as tabelas do protótipo. Rode o int-etapa1-login-seguranca.sql no Supabase.</div>`
    : !SESSION.papel ? `<div class="warn">Login feito como <b>${esc(SESSION.usuario)}</b>, mas este usuário não tem papel. Rode de novo a Parte 5 do SQL.</div>`
    : `<p class="meta">Você entrou como <b>${esc(SESSION.usuario)}</b>, com o papel <b>${esc(PAPEL_NOME[SESSION.papel])}</b>.</p>
       <ul class="tips">${SESSION.papel==="admin"
          ? "<li>Colocar e tirar perguntas da tela</li><li>Editar o texto das perguntas</li><li>Remover perguntas impróprias</li>"
          : "<li>Ver todas as perguntas, inclusive as novas</li><li>Marcar \"Quero responder\" nas aprovadas</li><li>Não modera nem coloca no ar</li>"}</ul>`;
  el.innerHTML=`
    <div class="pres-grid">
      <div class="pres-card"><h2>Sua sessão</h2>${ses}</div>
      <div class="pres-card"><h2>Etapas do protótipo</h2>
        <ol class="int-steps">${INT_ETAPAS.map(s=>`<li class="${s.ok?"done":""}"><span class="is-n">${s.ok?"✓":s.n}</span><span><b>${esc(s.t)}</b><br><span class="meta">${esc(s.d)}</span></span></li>`).join("")}</ol>
      </div>
    </div>
    ${SB && SESSION && SESSION.papel ? `<div class="epbar int-epbar"><label for="intEp">Episódio</label><select id="intEp" class="ep">${intEpOptions(modEp)}</select></div><div id="modCards">${modCardsHtml()}</div>`
      : SB ? '<div class="pres-card"><h2>Perguntas dos ouvintes</h2><p class="meta">Entre como produção ou apresentador para ver o link dos ouvintes e a fila de perguntas.</p></div>' : ""}
    ${SB && SESSION && SESSION.papel==="admin" ? `<div id="presAcum">${acumCardHtml()}</div>` : ""}
    ${SB && SESSION && SESSION.papel==="admin" ? loadCardHtml() : ""}
    <div class="pres-card">
      <h2>Teste de segurança</h2>
      <p class="meta">Confere, direto no banco, o que cada papel consegue ou não fazer. Rode sem login, depois como apresentador e por último como produção. Cada rodada cria uma pergunta de teste, e a rodada da produção apaga todas no final.</p>
      <div class="pres-row"><button class="btn primary" id="intRun" type="button" ${SB?"":"disabled"}>Rodar teste${SESSION&&SESSION.papel?" como "+esc(PAPEL_NOME[SESSION.papel].toLowerCase()):" como ouvinte"}</button><span class="meta" id="intSummary"></span></div>
      <ul class="int-results" id="intResults"></ul>
    </div>`;
  const il=$("#intLogin"); if(il) il.addEventListener("click",openLogin);
  if(SB && SESSION && SESSION.papel){ wireModCards(); boardSig=""; telaSig=""; if(modSub && modSubEp===modEp){ renderModBoard(null,true); renderTelaPanel(true); } else startMod(modEp); }
  else if(modSub){ try{ SB.removeChannel(modSub); }catch(e){} modSub=null; modSubEp=null; clearInterval(modPoll); }
  const ir=$("#intRun"); if(ir) ir.addEventListener("click",runSecurityTest);
  wireLoadCard();
  if($("#presAcum")){ wireAcum(); loadAcum(); }
}

/* ---------- Teste de segurança ---------- */
let anonClient=null;
function getAnon(){
  if(!anonClient){ const C=window.AKICAST_CONFIG; anonClient=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"akicast-teste-ouvinte"}}); }
  return anonClient;
}
function uuidv4(){ return (crypto.randomUUID&&crypto.randomUUID()) || "10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)); }
async function runSecurityTest(){
  const btn=$("#intRun"), list=$("#intResults"), sum=$("#intSummary");
  btn.disabled=true; list.innerHTML=""; sum.textContent="Testando…";
  const results=[];
  const add=(label,expect,ok,detail)=>{ results.push(ok); const li=document.createElement("li"); li.className=ok?"ok":"bad";
    li.innerHTML=`<span class="ir-i">${ok?"✓":"✗"}</span><span><b>${esc(label)}</b><br><span class="meta">${esc(expect)}${detail?" · "+esc(detail):""}</span></span>`; list.appendChild(li); };
  try{
    const A=getAnon();
    const ep=(episodes.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""))[0]||{}).id;
    if(!ep){ sum.textContent="Crie um episódio na aba Episódios antes de rodar o teste."; btn.disabled=false; return; }
    const {error:e0}=await A.rpc("int_papel");
    if(e0){ sum.textContent="As tabelas do protótipo não existem ainda. Rode o int-etapa1-login-seguranca.sql."; btn.disabled=false; return; }
    const qid=uuidv4(), dev="teste-"+uid()+uid();
    // Ouvinte
    let r=await A.from("int_perguntas").insert({id:qid,episode_id:ep,texto:"[Teste de segurança] pergunta de um ouvinte",nome:"Teste",aparelho:dev});
    add("Ouvinte envia uma pergunta","Deve funcionar",!r.error,r.error&&r.error.message);
    r=await A.from("int_perguntas").insert({episode_id:ep,texto:"[Teste de segurança] tentativa",aparelho:dev,status:"no_ar"});
    add("Ouvinte tenta enviar já \"no ar\"","Deve ser bloqueado",!!r.error);
    r=await A.from("int_perguntas").select("id,status").eq("id",qid);
    add("Pergunta entra aprovada na hora","Deve aparecer para todos",!r.error&&r.data.length===1&&r.data[0].status==="aprovada",r.error&&r.error.message);
    r=await A.from("int_perguntas").select("aparelho").limit(1);
    add("Ouvinte não lê a identificação dos aparelhos","Deve ser bloqueado",!!r.error);
    r=await A.from("int_perguntas").update({status:"aprovada"}).eq("id",qid);
    add("Ouvinte tenta alterar uma pergunta","Deve ser bloqueado",!!r.error);
    r=await A.from("int_perguntas").delete().eq("id",qid);
    add("Ouvinte tenta apagar uma pergunta","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_moderar",{p_id:qid,p_status:"aprovada"});
    add("Ouvinte tenta remover ou editar","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_mostrar",{p_episode:ep,p_pergunta:qid,p_formato:"destaque"});
    add("Ouvinte tenta colocar na tela","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_votar",{p_pergunta:qid,p_aparelho:dev,p_votar:true});
    add("Ouvinte vota na pergunta","Deve contar 1 voto",!r.error&&r.data===1,r.error?r.error.message:"votos: "+r.data);
    r=await A.rpc("int_minhas",{p_ids:[qid]});
    add("Ouvinte acompanha a própria pergunta","Deve mostrar aprovada",!r.error&&r.data&&r.data[0]&&r.data[0].status==="aprovada",r.error&&r.error.message);
    r=await A.rpc("int_pedido_ordem",{p_episode:ep,p_ids:[qid]});
    add("Ouvinte tenta mexer na fila do apresentador","Deve ser bloqueado",!!r.error);
    r=await A.from("int_placar").select("versao").eq("episode_id",ep).maybeSingle();
    add("Ouvinte consulta o placar de votos","Deve funcionar",!r.error,r.error&&r.error.message);
    r=await A.from("int_equipe").select("*");
    add("Ouvinte não vê a lista da equipe","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);

    // Interações novas (quiz, votação, frase, QR Code, pontuação e sorteio)
    r=await A.from("int_atividades").select("correta").limit(1);
    add("Ouvinte tenta ler a resposta certa do quiz","Deve ser bloqueado",!!r.error);
    r=await A.from("int_atividades").insert({episode_id:ep,pergunta:"[Teste de segurança] quiz falso",opcoes:[{id:"a",t:"A"},{id:"b",t:"B"}],estado:"aberta"});
    add("Ouvinte tenta criar um quiz","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_atividade_estado",{p_atividade:uuidv4(),p_estado:"aberta"});
    add("Ouvinte tenta abrir um quiz","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_mostrar_frase",{p_episode:ep,p_frase:"teste",p_formato:"selo"});
    add("Ouvinte tenta colocar uma frase na tela","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_qr_controle",{p_episode:ep,p_acao:"mostrar",p_ate:null});
    add("Ouvinte tenta controlar o QR Code","Deve ser bloqueado",!!r.error);
    r=await A.from("int_participantes").select("nome").limit(1);
    add("Ouvinte tenta ler os nomes de quem pontua","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);
    r=await A.rpc("int_participar",{p_episode:ep,p_aparelho:dev,p_nome:"Teste"});
    add("Nome sem sobrenome para pontuar","Deve ser recusado",!!r.error);
    r=await A.rpc("int_ranking",{p_episode:ep});
    add("Ouvinte tenta ver o ranking","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_encerrar_participacoes",{p_episode:ep,p_encerrar:true});
    add("Ouvinte tenta encerrar as participações","Deve ser bloqueado",!!r.error);
    r=await A.from("int_sorteio").select("top3").limit(1);
    add("Ouvinte tenta ler o Top 3","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);
    r=await A.rpc("int_enviar_top3",{p_episode:ep,p_enviar:true});
    add("Ouvinte tenta enviar o Top 3","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_mostrar_podio",{p_episode:ep,p_mostrar:true,p_formato:"destaque"});
    add("Ouvinte tenta mostrar o pódio","Deve ser bloqueado",!!r.error);

    // Recursos mais novos: frases em dois canais, nomes, mesa, vários na tela, lote, agenda, chamada, votos, capa
    r=await A.rpc("int_mostrar_frase",{p_episode:ep,p_frase:"teste",p_formato:"legenda",p_segundos:30});
    add("Ouvinte tenta colocar uma legenda por 30 s","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_mostrar_nome",{p_episode:ep,p_nome:"Teste Seguranca",p_cargo:"Teste",p_segundos:10,p_lado:"esq"});
    add("Ouvinte tenta colocar um nome na tela","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_mostrar_mesa",{p_episode:ep,p_nomes:[{lado:"esq",nome:"Teste Seguranca",cargo:"Teste"}],p_segundos:10});
    add("Ouvinte tenta apresentar a mesa","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_mostrar_multi",{p_episode:ep,p_tipo:"quiz",p_ids:[uuidv4()],p_layout:"grade"});
    add("Ouvinte tenta mostrar vários na tela","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_atividades_lote",{p_episode:ep,p_ids:[uuidv4()],p_estado:"aberta"});
    add("Ouvinte tenta abrir quizzes em lote","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_qr_agenda",{p_episode:ep,p_agenda:[{min:0,seg:60}]});
    add("Ouvinte tenta mudar a agenda do QR Code","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_chamada_auto",{p_episode:ep,p_ligar:false});
    add("Ouvinte tenta desligar a chamada do quiz","Deve ser bloqueado",!!r.error);
    r=await A.from("int_tela").update({selo_frase:"[Teste de segurança]"}).eq("episode_id",ep).select("episode_id");
    add("Ouvinte tenta alterar a tela direto no banco","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);
    { // sem alterar nada de verdade: regrava o próprio valor atual e vê se o banco aceitou
      const cur=await A.from("episodes").select("theme").eq("id",ep).maybeSingle();
      r=cur.error?cur:await A.from("episodes").update({theme:(cur.data&&cur.data.theme)||""}).eq("id",ep).select("id");
      add("Público sem login tenta editar um episódio","Deve ser bloqueado",!!r.error||(r.data||[]).length===0,(!r.error&&(r.data||[]).length)?"a tabela de episódios aceita edição sem login":""); }
    r=await A.from("episodes").select("notes").eq("id",ep).limit(1);
    add("Público tenta ler as notas internas","Deve ser bloqueado",!!r.error,(!r.error)?"rode o seguranca-central.sql":"");
    r=await A.from("int_links").select("controle").limit(1);
    add("Público tenta ler os códigos dos links","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);
    r=await A.rpc("int_definir_no_ar",{p_program:"geral",p_episode:ep});
    add("Público tenta trocar o que está no ar","Deve ser bloqueado",!!r.error);
    r=await A.from("int_checkins").select("nome").limit(1);
    add("Público tenta ler a lista de check-ins","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);
    r=await A.rpc("int_presencas",{p_desde:null});
    add("Público tenta ver a presença acumulada","Deve ser bloqueado",!!r.error);
    r=await A.from("live_state").upsert({episode_id:ep,step:0});
    add("Público tenta trocar o slide direto no banco","Deve ser bloqueado",!!r.error);
    r=await A.rpc("int_controle_slide",{p_episode:ep,p_k:"codigo-errado",p_step:0,p_at:Date.now(),p_version:null,p_cover:null});
    add("Controle de slides com código errado","Deve ser bloqueado",!!r.error&&!/function|schema cache/i.test(r.error.message||""),r.error&&/function|schema cache/i.test(r.error.message||"")?"rode o seguranca-central.sql":"");
    r=await A.rpc("int_enviar_deck",{p_episode:ep,p_k:"codigo-errado",p_name:"x.html",p_size:1,p_path:ep+"/codigo-errado/1.html",p_version:1});
    add("Envio de apresentação com código errado","Deve ser bloqueado",!!r.error&&!/function|schema cache/i.test(r.error.message||""));
    r=await A.from("decks").upsert({episode_id:ep,name:"[Teste]",size:1,path:"x",version:1});
    add("Público tenta trocar a apresentação direto no banco","Deve ser bloqueado",!!r.error);
    r=await A.storage.from("decks").upload(ep+"/teste-"+uid()+".html",new Blob(["teste"],{type:"text/plain"}),{upsert:false});
    add("Público tenta subir um arquivo fora do link de envio","Deve ser bloqueado",!!r.error);
    r=await A.rpc("set_check",{ep:ep,item:"teste",val:true});
    add("Público tenta marcar o checklist","Deve ser bloqueado",!!r.error);
    r=await A.from("checklist_items").upsert({id:"teste-seguranca",phase:"f1",title:"[Teste]"});
    add("Público tenta editar o modelo de checklist","Deve ser bloqueado",!!r.error);

    /* ---- Funções novas (PDF de reserva, links curtos, checklist em peças, campos, vídeos, tela do apresentador) ---- */
    // "permission denied for function …" = a função existe e recusou: é o resultado certo.
    // Só falta SQL quando o banco diz que a função ou a coluna não existe.
    const naoExiste=m=>/schema cache|could not find the function|does not exist|undefined column|column .* does not exist/i.test(m||"")&&!/permission denied/i.test(m||"");
    const faltaSql=(r,arq)=>r&&r.error&&naoExiste(r.error.message)?"rode o "+arq:"";
    const bloqueou=r=>!!r.error&&!naoExiste(r.error.message);
    r=await A.rpc("ck_marcar",{p_episode:ep,p_itens:{"teste-seguranca":true}});
    add("Público tenta marcar o checklist novo (peças)","Deve ser bloqueado",bloqueou(r),faltaSql(r,"checklist-pecas.sql"));
    r=await A.from("checklist_marcas").select("item_id").limit(1);
    add("Público tenta ler as marcações do checklist","Deve vir vazio",!!r.error||(r.data||[]).length===0);
    r=await A.rpc("int_enviar_reserva",{p_episode:ep,p_k:"codigo-errado",p_name:"x.pdf",p_size:1,p_path:ep+"/codigo-errado/reserva-1.html",p_version:1});
    add("Envio do PDF de reserva com código errado","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-pdf-reserva.sql"));
    r=await A.rpc("int_controle_reserva",{p_episode:ep,p_k:"codigo-errado",p_reserva:true,p_step:0,p_at:Date.now()});
    add("Troca para o PDF de reserva com código errado","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-pdf-reserva.sql"));
    r=await A.rpc("int_link_resolver",{p_k:"codigo-errado-123",p_tipo:"controle"});
    add("Link curto com código errado","Não deve achar episódio",!r.error&&!r.data,r.error?(faltaSql(r,"int-links-curtos.sql")||r.error.message):(r.data?"um código inventado abriu um episódio":""));
    r=await A.rpc("int_campos",{p_episode:ep,p_k:"codigo-errado",p_patch:{"teste-seguranca":"1"},p_limpar:false});
    add("Público tenta preencher os campos do slide","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-campos.sql"));
    r=await A.rpc("int_campos",{p_episode:ep,p_k:null,p_patch:null,p_limpar:true});
    add("Público tenta limpar os campos e cartões","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-campos.sql"));
    r=await A.rpc("int_video_salvar",{p_episode:ep,p_k:"codigo-errado",p_chave:"teste",p_info:{path:ep+"/codigo-errado/videos/teste.mp4"}});
    add("Envio de vídeo com código errado","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-videos.sql"));
    r=await A.from("decks").update({enquetes:[],ensaio:null}).eq("episode_id",ep).select("episode_id");
    add("Público tenta mudar enquetes, vídeos ou ensaio da apresentação","Deve ser bloqueado",!!r.error||(r.data||[]).length===0);
    r=await A.rpc("int_tela",{p_episode:ep,p_k:"codigo-errado",p_acao:"no_ar"});
    add("Público tenta colocar uma tela compartilhada no ar","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-tela.sql"));
    r=await A.rpc("int_tela",{p_episode:ep,p_k:null,p_acao:"liberar"});
    add("Público tenta liberar a tela do apresentador","Deve ser bloqueado",bloqueou(r),faltaSql(r,"int-tela-liberar.sql"));
    { const qa=await A.from("int_atividades").select("id").eq("episode_id",ep).neq("estado","rascunho").limit(1);
      const aid=!qa.error&&qa.data&&qa.data[0]?qa.data[0].id:null;
      if(aid){ r=await A.rpc("int_quiz_resultado",{p_atividade:aid});
        add("Ouvinte não recebe a quantidade de votos","Só porcentagem",!r.error&&r.data&&r.data.qtd==null&&r.data.total==null,r.error?r.error.message:(r.data&&r.data.qtd!=null?"a quantidade veio para o público":""));
        if(SESSION&&SESSION.papel){ r=await SB.rpc("int_quiz_resultado",{p_atividade:aid});
          add("Equipe recebe a quantidade de votos","Deve funcionar",!r.error&&r.data&&r.data.qtd!=null,r.error?r.error.message:(r.data&&r.data.qtd==null?"rode o int-quiz-votos-equipe.sql":"")); } }
      else add("Quantidade de votos","Sem quiz aberto ou encerrado neste episódio para conferir",true,"pulado"); }

    if(SESSION&&SESSION.papel==="apresentador"){
      r=await SB.rpc("int_ranking",{p_episode:ep});
      add("Apresentador tenta ver o ranking completo","Deve ser bloqueado",!!r.error);
      r=await SB.from("int_participantes").select("nome").limit(1);
      add("Apresentador tenta ler os nomes completos","Deve vir vazio",!!r.error||(r.data||[]).length===0);
      r=await SB.from("int_atividades").insert({episode_id:ep,pergunta:"[Teste de segurança] aberto pelo apresentador",opcoes:[{id:"a",t:"A"},{id:"b",t:"B"}],estado:"aberta"});
      add("Apresentador tenta criar quiz já aberto","Deve ser bloqueado",!!r.error);
      r=await SB.from("int_perguntas").select("id").eq("id",qid);
      add("Apresentador vê a pergunta","Deve encontrar 1",!r.error&&r.data.length===1,r.error&&r.error.message);
      r=await SB.rpc("int_moderar",{p_id:qid,p_status:"aprovada"});
      add("Apresentador tenta remover ou editar","Deve ser bloqueado",!!r.error);
      r=await SB.rpc("int_mostrar",{p_episode:ep,p_pergunta:qid,p_formato:"destaque"});
      add("Apresentador tenta colocar na tela","Deve ser bloqueado",!!r.error);
      r=await SB.from("int_perguntas").delete().eq("id",qid).select("id");
      add("Apresentador tenta apagar","Deve apagar nada",!!r.error||(r.data||[]).length===0);
      r=await SB.rpc("int_mostrar_frase",{p_episode:ep,p_frase:"teste",p_formato:"selo"});
      add("Apresentador tenta colocar uma frase na tela","Deve ser bloqueado",!!r.error);
      r=await SB.rpc("int_mostrar_nome",{p_episode:ep,p_nome:"Teste Seguranca",p_cargo:"",p_segundos:null,p_lado:"esq"});
      add("Apresentador tenta colocar um nome na tela","Deve ser bloqueado",!!r.error);
      r=await SB.rpc("int_mostrar_multi",{p_episode:ep,p_tipo:"quiz",p_ids:[],p_layout:"grade"});
      add("Apresentador tenta mexer em vários na tela","Deve ser bloqueado",!!r.error);
      r=await SB.rpc("int_tela",{p_episode:ep,p_k:null,p_acao:"liberar"});
      add("Apresentador tenta liberar a própria tela","Deve ser bloqueado",!!r.error);
      r=await SB.rpc("int_tela",{p_episode:ep,p_k:null,p_acao:"q_leve"});
      add("Apresentador tenta mudar a qualidade da tela","Deve ser bloqueado",!!r.error);
      r=await SB.rpc("int_campos",{p_episode:ep,p_k:null,p_patch:null,p_limpar:true});
      add("Apresentador tenta limpar os campos e cartões","Deve ser bloqueado",!!r.error);
    }
    if(SESSION&&SESSION.papel==="admin"){
      r=await SB.rpc("int_ranking",{p_episode:ep});
      add("Produção vê o ranking","Deve funcionar",!r.error,r.error&&(/function|schema cache/i.test(r.error.message||"")?"rode os SQL de pontuação":r.error.message));
      r=await SB.from("int_participantes").select("nome").limit(1);
      add("Produção lê os nomes de quem pontua","Deve funcionar",!r.error,r.error&&r.error.message);
      r=await SB.rpc("int_presencas",{p_desde:null});
      add("Produção vê a presença acumulada","Deve funcionar",!r.error,r.error&&(/function|schema cache/i.test(r.error.message||"")?"rode o int-checkin-presenca.sql":r.error.message));
      r=await SB.from("checklist_marcas").select("item_id").eq("episode_id",ep).limit(1);
      add("Produção lê o checklist novo (peças)","Deve funcionar",!r.error,r.error&&(faltaSql(r,"checklist-pecas.sql")||r.error.message));
      r=await SB.rpc("int_link_resolver",{p_k:"codigo-errado-123",p_tipo:"envio"});
      add("Links curtos ativos","Deve funcionar",!r.error,r.error&&(faltaSql(r,"int-links-curtos.sql")||r.error.message));
      r=await SB.from("live_state").select("campos,tela_liberada,tela_qualidade").eq("episode_id",ep).limit(1);
      add("Campos e tela do apresentador no banco","Deve funcionar",!r.error,r.error&&(/campos/.test(r.error.message||"")?"rode o int-campos.sql":/tela_qualidade/.test(r.error.message||"")?"rode o int-tela-qualidade.sql":/tela_liberada/.test(r.error.message||"")?"rode o int-tela-liberar.sql":r.error.message));
      r=await SB.from("decks").select("enquetes,ensaio,videos,reserva_path").eq("episode_id",ep).limit(1);
      add("Enquetes, ensaio, vídeos e PDF de reserva no banco","Deve funcionar",!r.error,r.error&&(/videos/.test(r.error.message||"")?"rode o int-videos.sql":/ensaio/.test(r.error.message||"")?"rode o int-ensaio.sql":/enquetes/.test(r.error.message||"")?"rode o int-enquete-conectada.sql":/reserva/.test(r.error.message||"")?"rode o int-pdf-reserva.sql":r.error.message));
      r=await SB.from("int_links").select("episode_id").eq("episode_id",ep);
      add("Produção vê os códigos dos links","Deve funcionar",!r.error&&(r.data||[]).length===1,r.error?r.error.message:((r.data||[]).length?"":"rode o seguranca-central.sql"));
      r=await SB.from("int_perguntas").select("id").eq("id",qid);
      add("Produção vê a pergunta","Deve encontrar 1",!r.error&&r.data.length===1,r.error&&r.error.message);
      r=await SB.rpc("int_moderar",{p_id:qid,p_status:"aprovada",p_texto:"[Teste de segurança] pergunta editada pela produção"});
      add("Produção edita o texto","Deve funcionar",!r.error,r.error&&r.error.message);
      r=await A.from("int_perguntas").select("id,texto,status").eq("id",qid);
      add("Ouvinte vê o texto editado","Deve encontrar 1",!r.error&&r.data.length===1&&/editada/.test(r.data[0].texto),r.error&&r.error.message);
      r=await A.rpc("int_votar",{p_pergunta:qid,p_aparelho:dev,p_votar:true});
      add("Mesmo aparelho vota de novo","Deve continuar 1",!r.error&&r.data===1,r.error?r.error.message:"votos: "+r.data);
      r=await SB.rpc("int_moderar",{p_id:qid,p_status:"descartada"});
      r=await A.from("int_perguntas").select("id").eq("id",qid);
      const removida=!r.error&&r.data.length===0;
      add("Produção remove: some para os ouvintes","Deve sumir da lista",removida,r.error&&r.error.message);
      await SB.rpc("int_moderar",{p_id:qid,p_status:"aprovada"});
      r=await SB.rpc("int_pedido_ordem",{p_episode:ep,p_ids:[qid]});
      add("Equipe marca \"Quero responder\"","Deve funcionar",!r.error,r.error&&r.error.message);
      r=await A.from("int_perguntas").select("pedido_apresentador").eq("id",qid).maybeSingle();
      add("Pergunta aparece como nº 1 na fila","Deve mostrar 1",!r.error&&r.data&&r.data.pedido_apresentador===1,r.error&&r.error.message);
      r=await SB.rpc("int_mostrar",{p_episode:ep,p_pergunta:qid,p_formato:"faixa"});
      add("Produção coloca na tela","Deve funcionar",!r.error,r.error&&r.error.message);
      r=await A.from("int_tela").select("pergunta_id,formato").eq("episode_id",ep).maybeSingle();
      add("Tela do OBS lê o que está no ar","Deve mostrar a pergunta",!r.error&&r.data&&r.data.pergunta_id===qid,r.error&&r.error.message);
      r=await SB.rpc("int_mostrar",{p_episode:ep,p_pergunta:null});
      add("Produção limpa a tela","Deve funcionar",!r.error,r.error&&r.error.message);
      // Frase e nome com tempo: só testa se o lugar estiver livre, para não mexer no que está no ar
      { const tt=await A.from("int_tela").select("frase,frase_ate,nome_faixa,nome_ate").eq("episode_id",ep).maybeSingle();
        const t0=(!tt.error&&tt.data)||{}, livre=(v,ate)=>!v||(ate&&new Date(ate).getTime()<Date.now());
        if(livre(t0.frase,t0.frase_ate)){
          r=await SB.rpc("int_mostrar_frase",{p_episode:ep,p_frase:"🧪",p_formato:"legenda",p_segundos:10});
          add("Produção coloca legenda (só emoji) por 10 s","Deve funcionar",!r.error,r.error&&(/check/i.test(r.error.message||"")?"rode o int-frase-emoji.sql":r.error.message));
          r=await A.from("int_tela").select("frase,frase_ate").eq("episode_id",ep).maybeSingle();
          add("Tela do OBS recebe a legenda com tempo","Deve ter o horário de saída",!r.error&&r.data&&r.data.frase==="🧪"&&!!r.data.frase_ate,r.error&&r.error.message);
          await SB.rpc("int_mostrar_frase",{p_episode:ep,p_frase:"",p_formato:"legenda"});
        } else add("Legenda com tempo","Há uma legenda no ar agora",true,"pulado para não atrapalhar");
        if(livre(t0.nome_faixa,t0.nome_ate)){
          r=await SB.rpc("int_mostrar_nome",{p_episode:ep,p_nome:"Teste Seguranca",p_cargo:"Teste",p_segundos:5,p_lado:"esq"});
          add("Produção coloca um nome na tela","Deve funcionar",!r.error,r.error&&r.error.message);
          await SB.rpc("int_mostrar_nome",{p_episode:ep,p_nome:"",p_cargo:"",p_segundos:null,p_lado:"esq"});
        } else add("Nome na tela","Há um nome no ar agora",true,"pulado para não atrapalhar"); }
      r=await SB.rpc("int_limpar_testes");
      add("Produção apaga as perguntas de teste","Deve funcionar",!r.error,r.error?r.error.message:(r.data+" apagada(s)"));
    }
    const ok=results.filter(Boolean).length;
    sum.innerHTML = ok===results.length ? `<b class="ok-t">Tudo certo: ${ok} de ${results.length} verificações.</b>` : `<b class="bad-t">${results.length-ok} de ${results.length} verificações falharam.</b>`;
    if(!SESSION||!SESSION.papel) sum.innerHTML+=' Entre como produção para completar o teste.';
  }catch(e){ sum.textContent="O teste parou por um erro: "+(e&&e.message||e); }
  finally{ btn.disabled=false; }
}

$("#tab-int").addEventListener("click",()=>renderInt());
/* =================== Etapa 4 · Votos e apresentador =================== */
const ICON_VOTE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6"/></svg>';
const votosKey=ep=>"akicast-votos-"+ep;
function meusVotos(ep){ try{ return new Set(JSON.parse(lsGet(votosKey(ep))||"[]")); }catch(e){ return new Set(); } }
function salvarVotos(ep,set){ lsSet(votosKey(ep),JSON.stringify([...set].slice(-200))); }

/* ---------- Ouvinte: lista para votar, atualizada só quando o placar muda ---------- */
let lvVersao=-1, lvRows=[], lvPoll=null, lvSig="", lvDisponivel=true;
function startVotes(){
  if(lvPoll){ lvPoll.parar(); lvPoll=null; }
  lvPoll=agendador(()=>checkPlacar(),()=>document.hidden?null:(diaDeLive(listenEp&&listenEp.date)?6000:30000),{minGap:2500,jitter:1500});
  if(listenEp&&!startVotes._ch){ const ag=()=>lvPoll&&lvPoll.agora(), ch=SB.channel("ouv-"+uid()); aviso(ch,"int_placar",listenEp.id,ag); aviso(ch,"int_atividades",listenEp.id,ag); ch.subscribe(); startVotes._ch=ch; }
}
async function checkPlacar(force){
  if(!listenEp||!lvDisponivel) return;
  const {data,error}=await SB.from("int_placar").select("versao").eq("episode_id",listenEp.id).maybeSingle();
  if(error){ if(/int_placar|does not exist|schema cache/i.test(error.message||"")){ lvDisponivel=false; renderVotes(); } return; }
  const v=data?Number(data.versao):0;
  if(!force && v===lvVersao) return;
  lvVersao=v;
  const r=await SB.from("int_perguntas").select("id,texto,nome,status,votos,criada_em").eq("episode_id",listenEp.id).in("status",["aprovada","no_ar","respondida"]);
  if(r.error) return;
  lvRows=r.data||[];
  renderVotes();
  refreshMinhas();
  if(!listenAfter) loadListenQuiz();
}
function renderVotes(){
  const box=$("#lsVotesBox"); if(!box) return;
  const db=$("#lsDoneBox");
  if(!lvDisponivel){ box.hidden=true; if(db) db.hidden=true; return; }
  box.hidden=!!listenAfter; if(db) db.hidden=false;
  if(typeof updateListenBadges==="function") updateListenBadges();
  if(typeof renderNow==="function") renderNow();
  const mine=meusVotos(listenEp.id);
  const abertas=lvRows.filter(r=>r.status!=="respondida").sort(lvSort==="recentes"
    ? (a,b)=>b.criada_em.localeCompare(a.criada_em)
    : (a,b)=>(b.status==="no_ar")-(a.status==="no_ar")||b.votos-a.votos||a.criada_em.localeCompare(b.criada_em));
  const feitas=lvRows.filter(r=>r.status==="respondida");
  const sig=JSON.stringify([lvSort,abertas.map(r=>[r.id,r.votos,r.status,r.texto]),feitas.map(r=>r.id),[...mine]]);
  if(sig===lvSig) return; lvSig=sig;
  const item=r=>{ const on=mine.has(r.id);
    return `<li class="vq${r.status==="no_ar"?" onair":""}">
      <button class="vote-btn${on?" on":""}" data-vote="${r.id}" type="button" aria-pressed="${on}" aria-label="${on?"Tirar voto":"Votar"} nesta pergunta">${ICON_VOTE}<span>${r.votos}</span><small>${r.votos===1?"voto":"votos"}</small></button>
      <div class="vq-body"><p>${esc(r.texto)}</p><span class="meta">${esc(r.nome||"Anônimo")}${r.status==="no_ar"?' · <b class="onair-t">Na tela agora</b>':""}</span></div>
    </li>`; };
  $("#lsVotes").innerHTML = abertas.length ? abertas.map(item).join("") : '<li class="meta">As perguntas enviadas aparecem aqui para você votar.</li>';
  $("#lsDone").innerHTML = feitas.length ? feitas.map(r=>`<li class="done-q"><span class="done-ic" aria-hidden="true">✓</span><div><p>${esc(r.texto)}</p><span class="meta">${esc(r.nome||"Anônimo")} · ${r.votos} ${r.votos===1?"voto":"votos"}</span></div></li>`).join("") : '<li class="meta">As perguntas respondidas na live aparecem aqui.</li>';
  $("#lsVotes").querySelectorAll("[data-vote]").forEach(b=>b.addEventListener("click",()=>toggleVote(b.dataset.vote,b)));
}
async function toggleVote(id,btn){
  const ep=listenEp.id, mine=meusVotos(ep), votar=!mine.has(id), row=lvRows.find(r=>r.id===id);
  if(!row) return;
  // resposta imediata na tela; o placar geral se ajusta na próxima consulta
  if(votar) mine.add(id); else mine.delete(id);
  salvarVotos(ep,mine);
  const prev=row.votos; row.votos=Math.max(0,prev+(votar?1:-1));
  btn.classList.toggle("on",votar); btn.setAttribute("aria-pressed",votar); btn.querySelector("span").textContent=row.votos; btn.querySelector("small").textContent=row.votos===1?"voto":"votos";
  btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
  const {data,error}=await SB.rpc("int_votar",{p_pergunta:id,p_aparelho:meuAparelho(),p_votar:votar});
  if(error){
    if(votar) mine.delete(id); else mine.add(id); salvarVotos(ep,mine);
    row.votos=prev; lvSig=""; renderVotes();
    toast(/não está aberta/i.test(error.message)?"Esta pergunta não está mais aberta para votos.":"Não foi possível registrar o voto. Tente de novo.");
    return;
  }
  row.votos=data; btn.querySelector("span").textContent=data; btn.querySelector("small").textContent=data===1?"voto":"votos"; lvSig="";
}

/* ---------- Apresentador: aba "Perguntas" no controle ---------- */
let cqQuizOpen=[], cqQuizResMap={};
let cqRows=[], cqPoll=null, cqSig="", cqEp=null, cqDisponivel=true, cqQuiz=null, cqQuizRes=null, ctSeenQuiz=new Set(), cqMine=[], cqForm=null, cqTop3=null, ctSeenTop3=null;
function startCtrlQs(epId){
  cqEp=epId; cqRows=[]; cqSig=""; cqDisponivel=true;
  if(cqPoll&&cqPoll.parar) cqPoll.parar(); cqPoll=null;
  if(startCtrlQs._ch){ try{ SB.removeChannel(startCtrlQs._ch); }catch(e){} startCtrlQs._ch=null; }
  if(!SB) return;
  renderCtrlQs();
  let cqPrim=true;
  cqPoll=agendador(()=>{ if(cqPrim||!$("#ctrlOv")||!$("#ctrlOv").hidden){ cqPrim=false; return loadCtrlQs(); } },()=>document.hidden?null:(cqQuizOpen&&cqQuizOpen.length?3000:12000));
  { const ag=()=>cqPoll&&cqPoll.agora(), ch=SB.channel("ctrl-q-"+uid()); aviso(ch,"int_perguntas",epId,ag); aviso(ch,"int_atividades",epId,ag); aviso(ch,"int_tela",epId,ag); ch.subscribe(); startCtrlQs._ch=ch; }
}
let ctTab="pres", ctSeen=null;
function setCtrlTab(t){
  ctTab=t;
  const pres=t==="pres";
  $("#ctTabPres").setAttribute("aria-selected",pres?"true":"false");
  $("#ctTabInt").setAttribute("aria-selected",pres?"false":"true");
  $("#ctPanelPres").hidden=!pres; $("#ctPanelInt").hidden=pres;
  $("#ctMini").hidden=pres;
  if(!pres){ markCtrlSeen(); window.scrollTo(0,0); $("#ctrlOv").scrollTop=0; }
  else { $("#ctrlOv").scrollTop=0; }
  // previews were hidden: recalc scale
  requestAnimationFrame(()=>{ if(live&&live.frames) live.frames.forEach(f=>{ if(f.ro&&f.container) f.iframe.style.transform=`scale(${f.container.clientWidth/1920})`; }); });
}
let ctTop3Toasted=null;
function ctrlTop3Html(){
  const list=cqTop3&&Array.isArray(cqTop3.top3)?cqTop3.top3:null;
  if(!list) return "";
  const medal=["🥇","🥈","🥉"];
  return `<div class="cq-top3">
    <div class="cq-head"><b>🏆 Top 3 da live</b><span class="meta">Enviado pela produção às ${hhmm(cqTop3.enviado_em)}</span></div>
    ${list.length?`<div class="podium">${list.map(r=>`<div class="pod pod${r.posicao}"><span class="pod-m">${medal[r.posicao-1]||r.posicao}</span><b>${esc(r.nome)}</b><span>${r.pontos} pontos · ${r.acertos} ${r.acertos===1?"acerto":"acertos"}</span></div>`).join("")}</div>`:'<p class="meta">Ninguém pontuou nesta live.</p>'}
    <p class="cq-note">Decida como fazer o sorteio ou a premiação. Os nomes não aparecem na transmissão: se for anunciar, leia em voz alta.</p>
  </div>`;
}
function markCtrlSeen(){ ctSeen=new Set(cqRows.map(r=>r.id)); updateCtrlBadge(); }
function updateCtrlBadge(){
  const b=$("#ctBadge"); if(!b) return;
  const qOpen=cqQuizOpen.length?cqQuizOpen.map(a=>a.id).sort().join(","):null;
  const t3=cqTop3&&cqTop3.enviado_em||null;
  if(ctTab==="int"){ ctSeen=new Set(cqRows.map(r=>r.id)); if(qOpen) ctSeenQuiz.add(qOpen); if(t3) ctSeenTop3=t3; }
  if(t3 && t3!==ctSeenTop3 && t3!==ctTop3Toasted){ ctTop3Toasted=t3; toast("🏆 A produção enviou o Top 3 da live. Veja na aba Interações."); }
  const n = (ctSeen ? cqRows.filter(r=>!ctSeen.has(r.id)).length : cqRows.length) + (qOpen&&!ctSeenQuiz.has(qOpen)?1:0) + (t3&&t3!==ctSeenTop3?1:0);
  const prev=Number(b.textContent)||0;
  b.textContent=n; b.hidden=n===0;
  if(n>prev){ b.classList.remove("ping"); void b.offsetWidth; b.classList.add("ping"); $("#ctTabInt").classList.add("has-new"); }
  if(n===0) $("#ctTabInt").classList.remove("has-new");
}
function ctrlQuizHtml(){
  if(!cqQuiz) return "";
  if(cqQuizOpen.length>1){
    return `<div class="cq-multi"><div class="cq-head"><b>${cqQuizOpen.length} abertos agora</b><span class="lq-tag">ao vivo</span></div>`+cqQuizOpen.map(a=>ctrlQuizOne(a,cqQuizResMap[a.id])).join("")+`</div>`;
  }
  return ctrlQuizOne(cqQuiz,cqQuizRes);
}
function ctrlQuizOne(cqQuiz,cqQuizRes){
  const a=cqQuiz, res=cqQuizRes||{}, pct=res.pct||{}, done=a.estado==="encerrada", cor=done?res.correta:null;
  return `<div class="cq-quiz ${done?"done":"open"}">
    <div class="cq-head"><b>${tipoNome(a)}</b><span class="lq-tag${done?" done":""}">${done?"Resultado":"Aberto agora"}</span></div>
    <p class="cqz-q">${esc(a.pergunta)}</p>
    <ul class="lq-res">${qzOpts(a).map((o,i)=>{ const p=pct[o.id]||0, ok=cor===o.id;
      return `<li class="${ok?"ok":""}" style="--oc:${CHART_COLORS[i%CHART_COLORS.length]}"><i style="width:${p}%"></i><b>${QZ_LETTERS[i]}</b><span>${esc(o.t)}${ok?' <small>resposta certa ✓</small>':""}</span><em>${p}%${qtdDe(res,o.id)!=null?` <small class="qv">· ${votosTxt(qtdDe(res,o.id))}</small>`:""}</em></li>`; }).join("")}</ul>
    ${res.tem_respostas?totalLinha(res):""}
    ${done?(res.explicacao?`<p class="lq-exp">${esc(res.explicacao)}</p>`:""):`<p class="cq-note">${res.tem_respostas?(a.tipo==="enquete"?"As porcentagens se atualizam enquanto o público vota.":"As porcentagens se atualizam enquanto o público responde."):"Aguardando as primeiras respostas…"}${a.tipo==="enquete"?"":" A resposta certa aparece aqui quando a produção encerrar."}</p>`}
  </div>`;
}
function stopCtrlQs(){ if(cqPoll&&cqPoll.parar) cqPoll.parar(); cqPoll=null; if(startCtrlQs._ch){ try{ SB.removeChannel(startCtrlQs._ch); }catch(e){} startCtrlQs._ch=null; } cqEp=null; }
async function loadCtrlQs(){
  if(!cqEp||!SESSION||!SESSION.papel) { renderCtrlQs(); return; }
  const {data,error}=await SB.from("int_perguntas").select("id,texto,nome,status,votos,pedido_apresentador,criada_em").eq("episode_id",cqEp).in("status",["aprovada","no_ar"]);
  if(error){ if(/int_perguntas|does not exist|schema cache/i.test(error.message||"")) cqDisponivel=false; renderCtrlQs(); return; }
  cqRows=data||[];
  {
    let ar=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,aberta_em,encerrada_em,tipo,grafico,criado_por").eq("episode_id",cqEp).in("estado",["aberta","encerrada"]);
    if(ar.error && /tipo|grafico|criado_por/.test(ar.error.message||"")) ar=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,aberta_em,encerrada_em").eq("episode_id",cqEp).in("estado",["aberta","encerrada"]);
    const mineR=SESSION&&SESSION.usuario?await SB.from("int_atividades").select("id,pergunta,tipo,estado,criada_em").eq("episode_id",cqEp).eq("criado_por",SESSION.usuario):{data:[]};
    cqMine=mineR.error?null:(mineR.data||[]).sort((x,y)=>String(y.criada_em).localeCompare(String(x.criada_em)));
    if(!ar.error){
      const list=(ar.data||[]).sort((x,y)=>String(y.aberta_em||"").localeCompare(String(x.aberta_em||"")));
      cqQuizOpen=list.filter(a=>a.estado==="aberta");
      cqQuiz=cqQuizOpen[0]||list[0]||null;
      cqQuizResMap={};
      for(const a of (cqQuizOpen.length?cqQuizOpen:(cqQuiz?[cqQuiz]:[]))){ cqQuizResMap[a.id]=(await SB.rpc("int_quiz_resultado",{p_atividade:a.id})).data||null; }
      cqQuizRes=cqQuiz?cqQuizResMap[cqQuiz.id]:null;
    }
  }
  if(SESSION&&SESSION.papel){ const so=await SB.from("int_sorteio").select("top3,enviado_em").eq("episode_id",cqEp).maybeSingle(); cqTop3=so.error?null:(so.data||null); }
  renderCtrlQs(); updateCtrlBadge();
}
function renderCtrlQs(){
  const box=$("#ctrlQs"); if(!box) return;
  const tabs=$("#ctrlTabs");
  if(!SB||!cqDisponivel){ box.hidden=true; if(tabs) tabs.hidden=true; { const h=$("#ctLoginHint"); if(h) h.hidden=true; } if(ctTab!=="pres") setCtrlTab("pres"); return; }
  box.hidden=false; if(tabs) tabs.hidden=false;
  { const h=$("#ctLoginHint"); if(h) h.hidden=!!(SESSION&&SESSION.papel); }
  const logged=SESSION&&SESSION.papel;
  const fila=cqRows.filter(r=>r.pedido_apresentador!=null).sort((a,b)=>a.pedido_apresentador-b.pedido_apresentador);
  const outras=cqRows.filter(r=>r.pedido_apresentador==null).sort((a,b)=>b.votos-a.votos||a.criada_em.localeCompare(b.criada_em));
  const sig=JSON.stringify([logged,cqRows.map(r=>[r.id,r.status,r.votos,r.pedido_apresentador,r.texto]),cqQuiz&&[cqQuiz.id,cqQuiz.estado],cqQuizRes,cqQuizOpen.map(a=>a.id),cqQuizResMap,cqMine,!!cqForm,cqTop3]);
  // não redesenhar enquanto o apresentador está escrevendo uma interação nova
  if(cqForm && box.querySelector(".cf-form") && box.querySelector(".cf-form").contains(document.activeElement)) return;
  if(sig===cqSig && box.firstElementChild) return; cqSig=sig;
  if(!logged){
    box.innerHTML=`<div class="cq-head"><b>Perguntas do público</b></div><p class="meta">Entre com seu login de apresentador para ver as perguntas aprovadas e marcar as que quer responder.</p><button class="btn primary sm" id="cqLogin" type="button">Entrar</button>`;
    $("#cqLogin").addEventListener("click",openLogin); return;
  }
  const votos=n=>`<span class="votes-pill${n?"":" zero"}" title="${n} ${n===1?"voto":"votos"} dos ouvintes">${ICON_VOTE}<b>${n}</b> ${n===1?"voto":"votos"}</span>`;
  const onair=r=>r.status==="no_ar"?'<span class="st-badge st-no_ar">Na tela</span>':"";
  box.innerHTML=ctrlTop3Html()+`<div class="cq-split"><section class="cq-col cq-col-perg"><div class="cq-head"><b>Perguntas do público</b><span class="meta">${cqRows.length} ${cqRows.length===1?"aprovada":"aprovadas"}</span></div>
    ${fila.length?`<div class="cq-sub">Quero responder, nesta ordem</div><ol class="cq-list cq-fila">${fila.map((r,i)=>`<li class="cq-item picked">
        <span class="cq-pos">${i+1}</span>
        <div class="cq-body"><p>${esc(r.texto)}</p><div class="cq-meta">${votos(r.votos)}${onair(r)}<span class="meta">${esc(r.nome||"Anônimo")}</span></div></div>
        <div class="cq-acts">
          <button class="icon-btn" data-cq="up" data-id="${r.id}" ${i===0?"disabled":""} aria-label="Subir na fila">${ICON_UP}</button>
          <button class="icon-btn" data-cq="down" data-id="${r.id}" ${i===fila.length-1?"disabled":""} aria-label="Descer na fila">${ICON_DOWN}</button>
          <button class="icon-btn" data-cq="remove" data-id="${r.id}" aria-label="Tirar da fila"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div></li>`).join("")}</ol>`:""}
    ${outras.length?`<div class="cq-sub">${fila.length?"Outras aprovadas":"Aprovadas, das mais votadas"}</div><ul class="cq-list">${outras.map(r=>`<li class="cq-item">
        <div class="cq-body"><p>${esc(r.texto)}</p><div class="cq-meta">${votos(r.votos)}${onair(r)}<span class="meta">${esc(r.nome||"Anônimo")}</span></div></div>
        <button class="btn cq-want" data-cq="add" data-id="${r.id}" type="button"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Quero responder</button></li>`).join("")}</ul>`:""}
    ${!cqRows.length?'<p class="meta">Nenhuma pergunta ainda. Elas aparecem aqui assim que o público enviar.</p>':""}
    <p class="cq-note">A produção vê a sua fila e coloca as perguntas na tela.</p></section>
    <section class="cq-col cq-col-int"><div class="cq-head"><b>Quiz e votações</b></div>
      ${ctrlQuizHtml()||'<p class="meta cq-empty-int">Nenhum quiz ou votação no ar agora. Quando a produção abrir um, você acompanha as porcentagens aqui.</p>'}
      ${ctrlCreateHtml()}
    </section></div>`;
  box.querySelectorAll("[data-cq]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); ctrlQAction(b.dataset.cq,b.dataset.id); }));
  wireCtrlCreate();
}
async function ctrlQAction(act,id){
  const fila=cqRows.filter(r=>r.pedido_apresentador!=null).sort((a,b)=>a.pedido_apresentador-b.pedido_apresentador).map(r=>r.id);
  const i=fila.indexOf(id);
  if(act==="add"&&i<0) fila.push(id);
  else if(act==="remove"&&i>=0) fila.splice(i,1);
  else if(act==="up"&&i>0) [fila[i-1],fila[i]]=[fila[i],fila[i-1]];
  else if(act==="down"&&i>=0&&i<fila.length-1) [fila[i+1],fila[i]]=[fila[i],fila[i+1]];
  else return;
  // resposta imediata; o banco confirma em seguida
  cqRows.forEach(r=>{ const k=fila.indexOf(r.id); r.pedido_apresentador=k<0?null:k+1; }); renderCtrlQs();
  const {error}=await SB.rpc("int_pedido_ordem",{p_episode:cqEp,p_ids:fila});
  if(error){ toast("Não foi possível atualizar a sua fila."); }
  loadCtrlQs();
}

/* =================== Etapa 3 · Tela de perguntas no OBS =================== */
function obsQLink(epId){ return location.origin+location.pathname+"?interacoes="+encodeURIComponent(epId); }
function ovSize(t,f){ const n=(t||"").length;
  if(f==="faixa") return n<=70?46:n<=140?38:n<=220?32:28;
  return n<=70?60:n<=140?50:n<=220?42:36; }
function overlayInner(q,formato){
  if(formato==="quiz") return quizInner(q&&q.a,q&&q.res);
  if(formato==="quiz_faixa") return quizFaixaInner(q&&q.a,q&&q.res);
  if(!q||!formato) return "";
  const nome=q.nome?`Enviada por ${esc(q.nome)}`:"Pergunta do público";
  if(formato==="faixa") return `<div class="ovf">
      <div class="ovf-tag"><img src="${esc(PG().logo||AKICAST_LOGO_SRC||"img/akicast-logo.png")}" alt=""><span>Pergunta</span></div>
      <div class="ovf-body"><p class="ovf-text" style="font-size:${ovSize(q.texto,"faixa")}px">${esc(q.texto)}</p><p class="ovf-name">${nome}</p></div>
    </div>`;
  return `<div class="ovd"><div class="ovd-card">
      <div class="ovd-stripe"></div>
      <div class="ovd-top"><img src="${esc(PG().logo||AKICAST_LOGO_SRC||"img/akicast-logo.png")}" alt=""><span>Pergunta do público</span></div>
      <p class="ovd-text" style="font-size:${ovSize(q.texto,"destaque")}px">${esc(q.texto)}</p>
      <p class="ovd-name">${q.nome?"Enviada por "+esc(q.nome):"Pergunta anônima"}</p>
    </div></div>`;
}

/* ---------- Página da tela de perguntas (?interacoes=<episódio>, antigo ?perguntas=) ---------- */
let ovEp=null, ovKey="", ovBusy=false, ovPending=null;
function fitOverlay(){ const k=`scale(${Math.min(innerWidth/1920,innerHeight/1080)})`; ["#ovCanvas","#ovFrase","#ovSelo","#ovNome","#ovNome2","#ovNome3","#ovPodio","#ovMulti","#ovChamada"].forEach(id=>{ const c=$(id); if(c) c.style.transform=k; }); }
async function startOverlayView(epId){
  if(SB){ epPublico(epId).then(({data})=>{ if(data){ ovEpRow=data; followEpisodeProgram(data); } }); }
  document.documentElement.classList.add("overlay-mode"); document.body.classList.add("overlay-mode");
  const v=$("#overlayView"); v.hidden=false;
  v.innerHTML='<div class="ov-canvas" id="ovCanvas"></div><div class="ov-canvas ov-frase-layer" id="ovFrase"></div><div class="ov-canvas ov-frase-layer" id="ovSelo"></div><div class="ov-canvas ov-nome-layer" id="ovNome"></div><div class="ov-canvas ov-nome-layer" id="ovNome2"></div><div class="ov-canvas ov-nome-layer" id="ovNome3"></div><div class="ov-canvas ov-multi-layer" id="ovMulti"></div><div class="ov-canvas ov-podio-layer" id="ovPodio"></div><div class="ov-canvas ov-chamada-layer" id="ovChamada"></div><div class="ov-hint" id="ovHint"></div>';
  fitOverlay(); addEventListener("resize",fitOverlay);
  ovEp=epId;
  if(!SB){ $("#ovHint").textContent="Central não configurada."; return; }
  const ag=agendador(()=>refreshOverlay().catch(()=>{}),()=>ovQuizCur&&ovQuizCur.estado==="aberta"?2500:(diaDeLive(ovEpRow&&ovEpRow.date)?10000:60000));
  const tick=()=>ag.agora();
  { const ch=SB.channel("ov-"+uid()); aviso(ch,"int_tela",epId,tick); aviso(ch,"int_atividades",epId,tick); aviso(ch,"int_perguntas",epId,tick); ch.subscribe(); }
  { const pch=SB.channel("akicast-live-"+epId,{config:{presence:{key:PEER_ID}}}); pch.subscribe(async st=>{ if(st==="SUBSCRIBED"){ try{ await pch.track({mode:"perguntas"}); }catch(e){} } }); }
  // Dica só no navegador comum (some no OBS depois de 6 s ou ao carregar)
  if(!/OBS/i.test(navigator.userAgent)){ const h=$("#ovHint"); h.textContent="Tela de perguntas pronta. No OBS, adicione este link como Fonte de navegador em 1920 × 1080. O fundo é transparente."; setTimeout(()=>h.classList.add("gone"),6000); }
}
async function refreshOverlay(){
  let {data:t,error}=await SB.from("int_tela").select("*").eq("episode_id",ovEp).maybeSingle();
  if(error && /atividade_id/.test(error.message||"")) ({data:t,error}=await SB.from("int_tela").select("pergunta_id,formato").eq("episode_id",ovEp).maybeSingle());
  if(error) return;
  { const fc=fraseCanais(t); showFrase(fc.legenda||"","legenda"); showSelo(fc.selo||""); }
  { const trio=nomeTrio(t); let mudou=false;
    ["#ovNome","#ovNome2","#ovNome3"].forEach(id=>{ const nl=$(id); if(!nl) return; nl.classList.toggle("base-on",!!baseOcupada(t)); if(nl.classList.contains("trio")!==trio){ nl.classList.toggle("trio",trio); mudou=true; } });
    showNome(nomeAtivo(t,"esq"),"esq"); showNome(nomeAtivo(t,"centro"),"centro"); showNome(nomeAtivo(t,"dir"),"dir");
    if(mudou){ requestAnimationFrame(()=>fitNome($("#overlayView"))); } }
  showPodio(t&&Array.isArray(t.podio)?t.podio:null, t&&t.podio_formato||"destaque");
  { let qrOn=false; try{ if(ovEpRow&&t) qrOn=qrState(ovEpRow,t).show; }catch(e){} ["#ovPodio","#ovMulti","#ovSelo","#ovChamada"].forEach(id=>{ const pl=$(id); if(pl) pl.classList.toggle("qr-on",qrOn); }); }
  showMulti(t&&t.multi);
  checkChamada(t);
  syncLegOverlay();
  if(t&&t.atividade_id){
    let ar=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,tipo,grafico").eq("id",t.atividade_id).maybeSingle();
    if(ar.error && /tipo|grafico/.test(ar.error.message||"")) ar=await SB.from("int_atividades").select("id,pergunta,opcoes,estado").eq("id",t.atividade_id).maybeSingle();
    const a=ar.data;
    if(a){ const rr=await SB.rpc("int_quiz_resultado",{p_atividade:a.id}); const res=rr.data||null;
      const qf=t.formato==="quiz_faixa"?"quiz_faixa":"quiz";
      showOverlay({id:a.id,texto:a.estado+(a.grafico||"")+JSON.stringify((res&&res.pct)||{}),nome:"",a,res,fmt:qf},qf); return; }
  }
  let q=null;
  if(t&&t.pergunta_id){ const r=await SB.from("int_perguntas").select("id,texto,nome").eq("id",t.pergunta_id).maybeSingle(); q=r.data||null; }
  showOverlay(q, q?t.formato:null);
}
let ovQuizCur=null;
function patchQuizOverlay(q){
  const c=$("#ovCanvas"); if(!c) return false;
  const pct=(q.res&&q.res.pct)||{};
  if(q.a.grafico==="pizza" && q.fmt!=="quiz_faixa"){
    const svg=c.querySelector(".ovq-pie svg"); if(!svg) return false;
    patchPie(svg,qzOpts(q.a),pct);
    let ok=true; c.querySelectorAll(".ovq-legend li[data-oid]").forEach(li=>{ const em=li.querySelector("em"); if(!em){ ok=false; return; } em.textContent=(pct[li.dataset.oid]||0)+"%"; });
    return ok;
  }
  let ok=true;
  c.querySelectorAll(".ovq-opts li[data-oid]").forEach(li=>{
    const p=pct[li.dataset.oid]||0, bar=li.querySelector(".ovq-bar"), em=li.querySelector("em");
    if(!bar||!em){ ok=false; return; }
    bar.style.width=p+"%"; em.textContent=p+"%";
  });
  return ok;
}
function showOverlay(q,formato){
  const key=q?[q.id,formato,q.texto,q.nome].join("|"):"";
  if(key===ovKey) return;
  // Mesmo quiz, ainda aberto: só atualiza as barras, sem refazer a animação
  if((formato==="quiz"||formato==="quiz_faixa") && q && q.a && ovQuizCur && ovQuizCur.id===q.id && ovQuizCur.fmt===formato && ovQuizCur.estado==="aberta" && q.a.estado==="aberta" && ovQuizCur.grafico===(q.a.grafico||"barras") && !ovBusy){
    if(patchQuizOverlay(q)){ ovKey=key; return; }
  }
  ovQuizCur = (formato==="quiz"||formato==="quiz_faixa")&&q&&q.a ? {id:q.id,estado:q.a.estado,grafico:q.a.grafico||"barras",fmt:formato} : null;
  if(ovBusy){ ovPending=[q,formato]; return; }
  ovKey=key;
  const c=$("#ovCanvas"), cur=c.firstElementChild;
  const enter=()=>{
    c.innerHTML=overlayInner(q,formato);
    const el=c.firstElementChild; if(el){ el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering"))); }
    ovBusy=false;
    if(ovPending){ const p=ovPending; ovPending=null; showOverlay(p[0],p[1]); }
  };
  if(cur){ ovBusy=true; cur.classList.add("leaving"); setTimeout(enter,480); } else enter();
}

/* ---------- Painel da produção: o que está na tela ---------- */
let modTela=null;
function telaPanelHtml(){
  const canMod=SESSION&&SESSION.papel==="admin";
  const q=modTela&&modTela.pergunta_id ? modRows.find(r=>r.id===modTela.pergunta_id) : null;
  const f=q?modTela.formato:null;
  return `<div class="tela-panel">
    <div class="tp-box" id="tpBox"><div class="tp-canvas" id="tpCanvas">${overlayInner(q,f)}</div>${q?"":'<span class="tp-empty">Nenhuma pergunta na tela</span>'}</div>
    <div class="tp-info">
      <div class="hc-label">Na tela agora</div>
      ${q?`<p class="tp-q">${esc(q.texto)}</p><p class="meta">${q.nome?esc(q.nome):"Anônimo"}</p>`:'<p class="meta">Escolha uma pergunta da lista e clique em Destaque ou Faixa.</p>'}
      ${canMod&&q?`<div class="tp-acts">
        <div class="seg" role="group" aria-label="Formato na tela">
          <button class="seg-b${f==="destaque"?" on":""}" data-tela="destaque" type="button">Destaque</button>
          <button class="seg-b${f==="faixa"?" on":""}" data-tela="faixa" type="button">Faixa</button>
        </div>
        <button class="btn primary sm" data-tela="limpar" type="button">Limpar a tela</button>
      </div>`:""}
    </div>
  </div>`;
}
let telaSig="", telaRO=null;
function renderTelaPanel(force){
  const w=$("#telaWrap"); if(!w) return;
  const q=modTela&&modTela.pergunta_id ? modRows.find(r=>r.id===modTela.pergunta_id) : null;
  const sig=JSON.stringify([SESSION&&SESSION.papel, modTela&&modTela.pergunta_id, modTela&&modTela.formato, q&&q.texto, q&&q.nome]);
  if(!force && sig===telaSig && w.firstElementChild) return;
  telaSig=sig;
  w.innerHTML=telaPanelHtml();
  const box=$("#tpBox"), cv=$("#tpCanvas");
  const fit=()=>{ if(box&&cv) cv.style.transform=`scale(${box.clientWidth/1920})`; };
  fit();
  if(telaRO) telaRO.disconnect();
  if(box){ telaRO=new ResizeObserver(fit); telaRO.observe(box); }
  w.querySelectorAll("[data-tela]").forEach(b=>b.addEventListener("click",()=>{
    const a=b.dataset.tela, q=modTela&&modTela.pergunta_id;
    if(a==="limpar") telaSet(null,null,"Tela limpa.");
    else if(q && modTela.formato!==a) telaSet(q,a,a==="faixa"?"Mudou para a faixa.":"Mudou para o destaque.");
  }));
}
async function telaSet(id,formato,msg){
  const {error}=await SB.rpc("int_mostrar",{p_episode:modEp,p_pergunta:id,p_formato:formato||"destaque"});
  if(error){ toast(/Aprove/i.test(error.message)?"Aprove a pergunta antes de colocá-la na tela.":/produção/i.test(error.message)?"Apenas a produção coloca perguntas na tela.":"Não foi possível atualizar a tela."); return; }
  if(msg) toast(msg);
  loadMod();
}
async function loadTela(){
  if(!SB||!modEp) return;
  const {data}=await SB.from("int_tela").select("pergunta_id,formato,atualizado_em").eq("episode_id",modEp).maybeSingle();
  modTela=data||null;
}

/* =================== Etapa 2 · Ouvintes e moderação =================== */
function listenLink(epId){ return location.origin+location.pathname+"?ouvintes="+encodeURIComponent(epId); }
function meuAparelho(){
  let d=lsGet("akicast-aparelho");
  if(!d||d.length<8){ d="ap-"+uid()+uid()+uid(); lsSet("akicast-aparelho",d); }
  return d;
}
const ST_NOME={nova:"Recebida",aprovada:"Recebida · aberta para votos",no_ar:"Está na tela",respondida:"Respondida",descartada:"Removida pela produção"};
function intErro(e){
  const m=(e&&e.message)||"";
  if(/Limite de envios/i.test(m)) return "Você enviou várias perguntas seguidas. Espere alguns minutos e tente de novo.";
  if(/check constraint|texto_check/i.test(m)) return "A pergunta precisa ter entre 3 e 300 caracteres.";
  if(/nome_check/i.test(m)) return "O nome pode ter no máximo 60 caracteres.";
  if(/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Confira a internet e tente de novo.";
  return "Não foi possível enviar. Tente de novo.";
}

/* ---------- Página do ouvinte (?ouvintes=<episódio>, antigo ?ouvir=) ---------- */
let listenEp=null, listenPoll=null, listenAfter=false;
const minhasKey=ep=>"akicast-minhas-"+ep;
function minhasIds(ep){ try{ return JSON.parse(lsGet(minhasKey(ep))||"[]"); }catch(e){ return []; } }
async function startListenView(epId){
  document.body.classList.add("send-mode","listen-mode");
  { const bl=$("#brandLink"); if(bl){ bl.removeAttribute("href"); bl.style.cursor="default"; bl.removeAttribute("title"); } }
  const v=$("#listenView"); v.hidden=false; v.innerHTML='<p class="status">Carregando…</p>';
  if(!SB){ v.innerHTML='<div class="pres-card"><h2>Página indisponível</h2><p class="meta">Avise a equipe do AkiCast: a central não está configurada.</p></div>'; return; }
  const {data,error}=await epPublico(epId);
  if(data) followEpisodeProgram(data);
  if(error||!data){ v.innerHTML='<div class="pres-card"><h2>Link inválido</h2><p class="meta">Este link não corresponde a nenhum AkiCast. Confira o QR Code na tela da transmissão.</p></div>'; return; }
  listenEp=data;
  listenAfter = (data.program||"akicast")==="learning" && liveEnded(data);
  if(listenAfter){ renderListenAfter(); quizReviewHtml(data).then(h=>{ const el=$("#lsQuizReview"); if(el) el.innerHTML=h; }); } else renderListen();
  clearInterval(listenPoll);
  listenPoll=setInterval(()=>{ if(!document.hidden) refreshMinhas(); },30000);
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) refreshMinhas(); });
  refreshMinhas();
  startVotes();
}
function renderListen(){
  const ep=listenEp, v=$("#listenView");
  const nomeSalvo=lsGet("akicast-meu-nome")||"";
  const yt=normUrl(ep.youtube_url);
  const learning=ep.program==="learning";
  const objs=learning?objectivesHtml(ep):"";
  v.innerHTML=`
    <div class="lsn">
      <header class="lsn-head">
        <div class="lsn-ep">
          <span class="hc-label">${esc(PN())} · ${esc(fmtLong(ep.date).toLowerCase())}</span>
          <h1>${esc(ep.theme||"Mande sua pergunta")}</h1>
          ${learning?audienceHtml(ep):""}
        </div>
        <div class="lsn-head-acts">
          <span class="lsn-status" id="lsStatus"></span>
          ${yt?`<a class="btn ghost sm lsn-watch" href="${esc(yt)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>Assistir à live</a>`:""}
        </div>
      </header>
      ${objs?`<details class="lsn-about"><summary>Sobre esta sessão</summary>${objs}</details>`:""}

      <div class="lsn-ck" id="lsCk" hidden></div>
      <div class="lsn-aviso" id="lsAviso" hidden aria-live="polite"></div>
      <div class="lsn-tabs" role="tablist" aria-label="Seções">
        <button role="tab" type="button" data-lt="perg" aria-selected="true">Perguntas</button>
        <button role="tab" type="button" data-lt="quiz" aria-selected="false">Quiz e votações<span class="lt-n" id="ltQuiz"></span></button>
      </div>

      <div class="lsn-panel" data-lp="perg">
        <div class="lsn-now-card" id="lsNowCard" hidden></div>
        <form class="pres-card lsn-form" id="listenForm" novalidate>
          <label class="field"><span>Sua pergunta ou comentário</span><textarea id="lsTexto" rows="3" maxlength="300" placeholder="Escreva aqui a sua pergunta"></textarea></label>
          <div class="listen-foot"><span class="meta" id="lsCount">0 / 300</span><span class="listen-err" id="lsErr" role="alert"></span></div>
          <label class="lsn-anon"><input type="checkbox" id="lsAnon" checked> Enviar como anônimo</label>
          <label class="field" id="lsNomeWrap" hidden><span>Seu nome</span><input id="lsNome" type="text" maxlength="60" autocomplete="name" placeholder="Ex.: Clark - Akiyama" value="${esc(nomeSalvo)}"></label>
          <button class="btn primary big" id="lsSend" type="submit">Enviar pergunta</button>
        </form>
        <div class="pres-card" id="lsVotesBox">
          <div class="lsn-live-h"><h2>Perguntas da live</h2>
            <div class="lsn-sort" role="group" aria-label="Ordenar"><button type="button" data-ls-sort="votos" class="on">Mais votadas</button><button type="button" data-ls-sort="recentes">Recentes</button></div>
          </div>
          <p class="meta lsn-hint">Toque na seta para votar nas perguntas que você quer ver respondidas.</p>
          <ul class="vote-list" id="lsVotes"><li class="meta">Carregando…</li></ul>
        </div>
        <div class="pres-card lsn-mine"><h2>Suas perguntas</h2><ul class="minhas" id="lsMinhas"><li class="meta">As perguntas que você enviar aparecem aqui, com a situação de cada uma.</li></ul></div>
        <details class="pres-card lsn-done" id="lsDoneBox"><summary><h2>Perguntas já respondidas</h2></summary><ul class="done-list" id="lsDone"><li class="meta">As perguntas respondidas na live aparecem aqui.</li></ul></details>
      </div>

      <div class="lsn-panel" data-lp="quiz" hidden>
        <div class="lsn-part" id="lsPart"></div>
        <div class="pres-card lq-card" id="lsQuiz" hidden></div>
        <div class="pres-card lsn-quiz-empty" id="lsQuizEmpty"><h2>Nada aberto agora</h2><p class="meta">Quando a produção abrir um quiz ou uma votação, ele aparece aqui para você responder. Fique de olho no selo "ao vivo" nesta aba.</p></div>
        <div id="lsQuizHist"></div>
      </div>
    </div>`;
  const t=$("#lsTexto");
  t.addEventListener("input",()=>{ $("#lsCount").textContent=t.value.length+" / 300"; $("#lsErr").textContent=""; });
  $("#listenForm").addEventListener("submit",sendListen);
  const anon=$("#lsAnon"), syncAnon=()=>{ $("#lsNomeWrap").hidden=anon.checked; $("#lsNome").disabled=anon.checked; if(!anon.checked) setTimeout(()=>$("#lsNome").focus(),30); };
  anon.addEventListener("change",syncAnon); syncAnon();
  v.querySelectorAll("[data-lt]").forEach(b=>b.addEventListener("click",()=>setListenTab(b.dataset.lt)));
  v.querySelectorAll("[data-ls-sort]").forEach(b=>b.addEventListener("click",()=>{ lvSort=b.dataset.lsSort; v.querySelectorAll("[data-ls-sort]").forEach(x=>x.classList.toggle("on",x===b)); lvSig=""; renderVotes(); }));
  if(!listenStatusT) listenStatusT=setInterval(renderNow,30000);
  renderNow();
  loadPart(); loadCheckin();
}
let lvSort="votos", lsTab="perg", listenStatusT=null, lsLastOpenQuiz=null, lsLastOpenKey=null;
let lsMineSig="", lsMineCount=0, lsMineLoaded=false, lsSeen={perg:null,minhas:null};
function openAskSheet(){ const t=$("#lsTexto"); if(t){ setListenTab("perg"); t.focus(); } }
function closeAskSheet(){}
function setListenTab(t){
  lsTab=t;
  if(t==="quiz" && !lsPart.asked && pontAtiva()){ lsPart.asked=true; ensurePart(()=>{}); }
  document.querySelectorAll("#listenView [data-lt]").forEach(b=>b.setAttribute("aria-selected",b.dataset.lt===t?"true":"false"));
  document.querySelectorAll("#listenView [data-lp]").forEach(p=>p.hidden=p.dataset.lp!==t);
  renderNow();
}
function updateListenBadges(){}
function markListenSeen(){}
function liveWindow(ep){
  const d=parseDate(ep.date); if(!d) return {state:"none"};
  const start=new Date(d); start.setHours(9,0,0,0); const end=new Date(d); end.setHours(10,0,0,0); const now=new Date();
  if(now<start) return {state:"before",start};
  if(now<end) return {state:"live"};
  return {state:"after"};
}
function renderNow(){
  const st=$("#lsStatus"); if(!st||!listenEp) return;
  const w=liveWindow(listenEp), today=isoDate(new Date())===listenEp.date;
  st.className="lsn-status "+w.state;
  st.textContent = w.state==="live"?"Ao vivo":w.state==="before"?(today?"Hoje, 9h":"Em breve"):w.state==="after"?"Encerrada":"";
  // pergunta na tela (aba Perguntas)
  const card=$("#lsNowCard"), onAir=lvRows.find(r=>r.status==="no_ar");
  if(card){
    if(onAir){ const isMine=new Set(minhasIds(listenEp.id)).has(onAir.id);
      card.hidden=false; card.className="lsn-now-card onair"+(isMine?" mine":"");
      card.innerHTML=`<span class="lsn-now-k">${isMine?"Sua pergunta está no ar agora!":"Na tela agora"}</span><p>${esc(onAir.texto)}</p><span class="meta">${esc(onAir.nome||"Anônimo")}</span>`;
    } else { card.hidden=true; card.innerHTML=""; }
  }
  // aba Quiz e votações
  const opensNow=qzActs.filter(a=>a.estado==="aberta"), open=opensNow[0];
  const qb=$("#lsQuiz"), empty=$("#lsQuizEmpty"), badge=$("#ltQuiz");
  if(empty) empty.hidden=!!(qb && !qb.hidden && qb.innerHTML);
  renderAvisoQuiz();
  if(badge){ const pend=opensNow.filter(a=>!qzMine[a.id]).length; badge.textContent=open?(opensNow.length>1?`${pend||"✓"} ao vivo`:"ao vivo"):""; badge.classList.toggle("live",!!open); }
  const openKey=opensNow.map(a=>a.id).sort().join(","); if(open && openKey!==lsLastOpenKey){ const novos=opensNow.filter(a=>!(lsLastOpenKey||"").split(",").includes(a.id)); lsLastOpenKey=openKey; if(novos.length>1 && lsTab!=="quiz" && !document.getElementById("ptModal") && qzActsLoaded){  lsLastOpenQuiz=open.id; } }
  if(open && open.id!==lsLastOpenQuiz){
    if(document.getElementById("ptModal")){ lsLastOpenQuiz=open.id; }
    else if(lsLastOpenQuiz!==null && lsTab!=="quiz") void 0 /* aviso fixo no topo substitui o toast */;
    if(lsLastOpenQuiz===null && lsTab!=="quiz" && qzActsLoaded) void 0 /* aviso fixo no topo substitui o toast */;
    lsLastOpenQuiz=open.id;
  }
  if(!open && qzActsLoaded && lsLastOpenQuiz===null) lsLastOpenQuiz="";
}
async function sendListen(e){
  e.preventDefault();
  const anonOn=$("#lsAnon")&&$("#lsAnon").checked;
  const texto=$("#lsTexto").value.trim(), nome=anonOn?"":$("#lsNome").value.trim(), err=$("#lsErr"), b=$("#lsSend");
  if(texto.length<3){ err.textContent="Escreva sua pergunta (pelo menos 3 caracteres)."; $("#lsTexto").focus(); return; }
  b.disabled=true; b.textContent="Enviando…";
  const id=uuidv4();
  const {error}=await SB.from("int_perguntas").insert({id,episode_id:listenEp.id,texto,nome,aparelho:meuAparelho()});
  b.disabled=false; b.textContent="Enviar pergunta";
  if(error){ err.textContent=intErro(error); return; }
  if(!anonOn) lsSet("akicast-meu-nome",nome);
  const ids=minhasIds(listenEp.id); ids.unshift(id); lsSet(minhasKey(listenEp.id),JSON.stringify(ids.slice(0,30)));
  const cache=JSON.parse(lsGet("akicast-minhas-txt")||"{}"); cache[id]=texto; lsSet("akicast-minhas-txt",JSON.stringify(cache));
  $("#lsTexto").value=""; $("#lsCount").textContent="0 / 300";
  toast("Pergunta enviada! Ela aparece em \"Suas perguntas\".");
  refreshMinhas();
}
async function refreshMinhas(){
  if(!listenEp) return;
  const ul=$("#lsMinhas"); if(!ul) return;
  const ids=minhasIds(listenEp.id);
  if(!ids.length){ if(!lsMineLoaded){ lsMineLoaded=true; lsSeen.minhas="[]"; } return; }
  const {data,error}=await SB.rpc("int_minhas",{p_ids:ids});
  if(error) return;
  const cache=JSON.parse(lsGet("akicast-minhas-txt")||"{}");
  const byId={}; (data||[]).forEach(r=>byId[r.id]=r);
  lsMineCount=ids.filter(id=>byId[id]).length; lsMineSig=JSON.stringify(ids.filter(id=>byId[id]).map(id=>[id,byId[id].status]));
  if(!lsMineLoaded){ lsMineLoaded=true; lsSeen.minhas=lsMineSig; }
  if(typeof updateListenBadges==="function"){ updateListenBadges(); }
  if(typeof renderNow==="function") renderNow();
  ul.innerHTML=ids.filter(id=>byId[id]).map(id=>{ const r=byId[id];
    return `<li class="minha st-${r.status}"><span class="mt">${esc(cache[id]||"Sua pergunta")}</span><span class="st-badge st-${r.status}">${esc(ST_NOME[r.status]||r.status)}</span></li>`; }).join("") || '<li class="meta">As perguntas que você enviar aparecem aqui.</li>';
}

/* ---------- Painel da produção: fila de perguntas ---------- */
let modEp=null, modSubEp=null, modRows=[], modSub=null, modPoll=null, modSeen=null, modEditing=null;
function defaultIntEp(){
  const up=episodes.filter(e=>!isPast(e.date)).sort((a,b)=>(a.date||"9").localeCompare(b.date||"9"));
  const pastL=episodes.filter(e=>isPast(e.date)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  return (up[0]||pastL[0]||{}).id||null;
}
function intEpOptions(sel){
  return episodes.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(e=>`<option value="${esc(e.id)}"${e.id===sel?" selected":""}>${esc(fmtShort(e.date))}: ${esc(e.theme||"Tema a definir")}</option>`).join("");
}
function modCardsHtml(){
  if(!modEp) return '<p class="meta">Crie um episódio na aba Episódios para receber perguntas.</p>';
  const link=listenLink(modEp);
  const canMod=SESSION&&SESSION.papel==="admin";
  return `
    <div class="int-links-note meta">Os links da página dos ouvintes e da tela de perguntas estão na aba <b>Apresentações</b>, no card "Links da live". <button class="linkbtn" id="goLinks" type="button">Ir para os links</button> · <button class="linkbtn" id="goSala" type="button">Abrir sala de controle</button></div>
    <div class="pres-card mod-card">
      <div class="hc-head"><h2 style="margin:0">Fila de perguntas</h2><span class="meta" id="modStatus"></span></div>
      ${canMod?"":'<div class="warn" style="margin-top:10px">Somente leitura: apenas a produção coloca perguntas na tela, edita ou remove. Entre como produção para usar esses botões.</div>'}
      <div id="telaWrap"></div>
      <div class="mod-board" id="modBoard"><p class="status">Carregando…</p></div>
    </div>`;
}
let modLoading=false, modAgain=false;
async function loadMod(){
  if(!SB||!modEp||!SESSION||!SESSION.papel) return;
  if(modLoading){ modAgain=true; return; }
  modLoading=true;
  try{ await loadModOnce(); } finally { modLoading=false; if(modAgain){ modAgain=false; loadMod(); } }
}
async function loadModOnce(){
  const [{data,error}]=await Promise.all([SB.from("int_perguntas").select("id,texto,nome,status,votos,pedido_apresentador,criada_em,moderada_em,no_ar_em").eq("episode_id",modEp).order("criada_em",{ascending:true}), loadTela()]);
  const st=$("#modStatus");
  if(error){ if(st) st.textContent="Não foi possível carregar a fila."; return; }
  const fresh=[];
  if(modSeen){ data.forEach(r=>{ if(!modSeen.has(r.id) && r.status!=="descartada") fresh.push(r.id); }); }
  modSeen=new Set(data.map(r=>r.id));
  modRows=data;
  if(fresh.length) toast(fresh.length===1?"Nova pergunta na fila.":fresh.length+" novas perguntas na fila.");
  renderModBoard(new Set(fresh));
  renderTelaPanel();
  if(st) st.textContent="Atualizado às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
let boardSig="", boardIds=null;
function renderModBoard(fresh,force){
  const el=$("#modBoard"); if(!el) return;
  if(modEditing && el.querySelector(".mod-edit") && !force) return; // não interromper edição
  const canMod=SESSION&&SESSION.papel==="admin";
  const sig=JSON.stringify([canMod,modEditing,modRows.map(r=>[r.id,r.status,r.texto,r.nome,r.votos,r.pedido_apresentador])]);
  const hasBoard=!!el.querySelector(".mod-col");
  if(!force && hasBoard && sig===boardSig && !(fresh&&fresh.size)) return;
  boardSig=sig;
  const prevIds=hasBoard?boardIds:null;
  boardIds=new Set(modRows.map(r=>r.id));
  const scrollY=window.scrollY;
  const cols=[
    {k:"aprov",t:"Perguntas",f:r=>r.status==="aprovada"||r.status==="no_ar"||r.status==="nova",sort:(a,b)=>((a.pedido_apresentador??999)-(b.pedido_apresentador??999))||(b.votos-a.votos)||a.criada_em.localeCompare(b.criada_em)},
    {k:"fim",t:"Encerradas",f:r=>r.status==="respondida"||r.status==="descartada",sort:(a,b)=>(b.moderada_em||b.criada_em).localeCompare(a.moderada_em||a.criada_em)}
  ];
  const hora=iso=>{ const d=new Date(iso); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
  const acts=r=>{
    if(!canMod) return "";
    const B=(a,l,cls="ghost")=>`<button class="btn ${cls} sm" data-act="${a}" data-id="${r.id}" type="button">${l}</button>`;
    const rm=`<button class="linkbtn mq-rm" data-act="remover" data-id="${r.id}" type="button">Remover</button>`;
    if(r.status==="no_ar") return B("tirar","Tirar da tela","primary")+B("editar","Editar")+rm;
    if(r.status==="aprovada"||r.status==="nova") return B("destaque","Destaque","primary tela-b")+B("faixa","Faixa","primary tela-b")+B("respondida","Respondida")+B("editar","Editar")+rm;
    return B("aprovada","Reabrir")+B("apagar","Apagar","ghost danger-t");
  };
  el.innerHTML=cols.map(c=>{ const rows=modRows.filter(c.f).sort(c.sort);
    return `<section class="mod-col mod-${c.k}"><div class="mod-col-h"><b>${c.t}</b><span class="mod-n">${rows.length}</span></div>
      ${rows.length?rows.map(r=>`<article class="mod-q st-${r.status}${fresh&&fresh.has(r.id)?" fresh":""}${prevIds&&!prevIds.has(r.id)?" in":""}" data-id="${r.id}">
        <div class="mq-top"><span class="mq-name">${esc(r.nome||"Anônimo")}</span><span class="mq-time">${hora(r.criada_em)}</span></div>
        ${modEditing===r.id?`<div class="mod-edit"><textarea id="modEditTxt" maxlength="300" rows="3">${esc(r.texto)}</textarea><div class="mq-acts"><button class="btn primary sm" data-act="salvar" data-id="${r.id}" type="button">Salvar texto</button><button class="btn ghost sm" data-act="cancelar" data-id="${r.id}" type="button">Cancelar</button></div></div>`
          :`<p class="mq-text">${esc(r.texto)}</p>`}
        <div class="mq-meta">${r.status==="no_ar"?'<span class="st-badge st-no_ar">Na tela</span>':""}${r.status==="descartada"?'<span class="st-badge st-descartada">Removida</span>':""}${r.status==="respondida"?'<span class="st-badge st-respondida">Respondida</span>':""}${r.pedido_apresentador!=null?`<span class="st-badge st-pedido">Apresentador: nº ${r.pedido_apresentador}</span>`:""}<span class="votes-pill${r.votos?"":" zero"}">${ICON_VOTE}<b>${r.votos}</b> ${r.votos===1?"voto":"votos"}</span></div>
        ${modEditing===r.id?"":`<div class="mq-acts">${acts(r)}</div>`}
      </article>`).join(""):`<p class="mod-empty">${c.k==="aprov"?"As perguntas dos ouvintes aparecem aqui assim que são enviadas.":"Respondidas e removidas aparecem aqui."}</p>`}
    </section>`; }).join("");
  el.querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click",()=>modAction(b.dataset.act,b.dataset.id,b)));
  if(Math.abs(window.scrollY-scrollY)>1) window.scrollTo({top:scrollY,behavior:"instant"});
  if(modEditing){ const t=$("#modEditTxt"); if(t){ t.focus(); t.setSelectionRange(t.value.length,t.value.length); } }
}
async function modAction(act,id,btn){
  const r=modRows.find(x=>x.id===id); if(!r) return;
  if(act==="editar"){ modEditing=id; renderModBoard(null,true); return; }
  if(act==="destaque"||act==="faixa"){ btn.disabled=true; return telaSet(id,act,act==="faixa"?"Pergunta na faixa de baixo.":"Pergunta em destaque na tela."); }
  if(act==="tirar"){ btn.disabled=true; return telaSet(null,null,"Tela limpa."); }
  if(act==="cancelar"){ modEditing=null; renderModBoard(null,true); return; }
  if(act==="apagar"){ if(!confirmInline(btn,"Apagar de vez?")) return;
    const {error}=await SB.from("int_perguntas").delete().eq("id",id); if(error) return toast("Não foi possível apagar.");
    toast("Pergunta apagada."); return loadMod(); }
  if(act==="remover") act="descartada";
  let status=act, texto=null;
  if(act==="salvar"){ texto=($("#modEditTxt").value||"").trim(); if(texto.length<3) return toast("O texto precisa ter pelo menos 3 caracteres."); status=r.status; }
  btn.disabled=true;
  const prev=r.status;
  const {error}=await SB.rpc("int_moderar",{p_id:id,p_status:status,p_texto:texto});
  if(error){ btn.disabled=false; return toast(/produção/i.test(error.message)?"Apenas a produção pode moderar.":"Não foi possível atualizar a pergunta."); }
  modEditing=null;
  if(act==="salvar") toast("Texto atualizado.");
  else if(status!==prev){
    const nomes={aprovada:"Pergunta reaberta.",descartada:"Pergunta removida para todos.",respondida:"Marcada como respondida.",nova:"Pergunta reaberta."};
    toastAction(nomes[status]||"Atualizada.","Desfazer",async()=>{ await SB.rpc("int_moderar",{p_id:id,p_status:prev}); loadMod(); });
  }
  loadMod();
}
function startMod(ep){
  if(modSub){ try{ SB.removeChannel(modSub); }catch(e){} modSub=null; }
  clearInterval(modPoll); modSeen=null; modRows=[]; modEditing=null; boardSig=""; telaSig=""; boardIds=null;
  modEp=ep;
  if(!SB||!ep||!SESSION||!SESSION.papel) return;
  modSubEp=ep;
  modSub=SB.channel("int-mod-"+uid()).on("postgres_changes",{event:"*",schema:"public",table:"int_perguntas",filter:"episode_id=eq."+ep},()=>{ clearTimeout(startMod._t); startMod._t=setTimeout(loadMod,300); }).subscribe();
  modPoll=setInterval(()=>{ if(!document.hidden && !$("#panel-int").hidden) loadMod(); },30000);
  loadMod();
}
function wireModCards(){
  { const g=$("#goLinks"); if(g) g.addEventListener("click",()=>{ $("#tab-pres").click(); presSelect(modEp); const sel=$("#presEp"); if(sel) sel.value=modEp; setTimeout(()=>{ const lc=document.querySelector(".links-wrap"); if(lc) lc.scrollIntoView({behavior:"smooth",block:"start"}); },400); }); }
  { const g=$("#goSala"); if(g) g.addEventListener("click",()=>openSala(modEp)); }
  const c=$("#lsCopy"), q=$("#lsQr"), inp=$("#lsUrl");
  if(inp) inp.addEventListener("focus",()=>inp.select());
  if(c) c.addEventListener("click",async()=>{ try{ await navigator.clipboard.writeText(inp.value); c.textContent="Link copiado"; }catch(e){ inp.focus(); inp.select(); c.textContent="Copie o link selecionado"; } setTimeout(()=>{ if(c.isConnected) c.textContent="Copiar link"; },2200); });
  if(q) q.addEventListener("click",()=>showQr(inp.value,"Aponte a câmera para mandar sua pergunta",modEp));
  const oc=$("#obsQCopy"), oi=$("#obsQUrl");
  if(oi) oi.addEventListener("focus",()=>oi.select());
  if(oc) oc.addEventListener("click",async()=>{ try{ await navigator.clipboard.writeText(oi.value); oc.textContent="Link copiado"; }catch(e){ oi.focus(); oi.select(); oc.textContent="Copie o link selecionado"; } setTimeout(()=>{ if(oc.isConnected) oc.textContent="Copiar link"; },2200); });
  const s=$("#intEp"); if(s) s.addEventListener("change",()=>{ lsSet("akicast-int-ep",s.value); startMod(s.value); const box=$("#modCards"); box.innerHTML=modCardsHtml(); wireModCards(); loadMod(); });
}


/* =================== Guia técnico editável: pontos críticos e ajustes =================== */
const DEFAULT_GUIDE=[
  {id:"crit_iluminacao",kind:"critico",title:"Iluminação",description:"O AkiCast vai das 9h às 10h, e a luz natural varia bastante de um dia para outro. Por isso o ISO da câmera precisa ser ajustado durante toda a transmissão. Quem cuida disso está em Papéis na live."},
  {id:"crit_camera",kind:"critico",title:"Superaquecimento da câmera",description:"A câmera já desligou no meio de uma transmissão por superaquecimento. Deixar a câmera aberta durante toda a live resolveu o problema."},
  {id:"aj_telas",kind:"ajuste",title:"Telas",description:"Usar apenas uma tela para a operação e deixar o celular como monitor de áudio."},
  {id:"aj_segunda",kind:"ajuste",title:"Segunda tela",description:"Testar como apoio visual para o apresentador ver o que está sendo mostrado ao público."},
  {id:"aj_tv",kind:"ajuste",title:"TV de fundo",description:"Parece essencial em apresentações, porque ajuda a guiar e orientar o apresentador."},
  {id:"aj_cameras",kind:"ajuste",title:"Mais câmeras",description:"Podem ser necessárias com mais apresentadores. Se usar outra câmera, configurar a visualização e os microfones no mesmo padrão da atual."}
].map((x,i)=>({status:"em_teste",decided_at:null,position:(i+1)*10,...x})).concat([
  {id:"papel_camera",kind:"papel",title:"Câmera e iluminação",description:"Controla o ISO da câmera durante toda a transmissão, acompanhando a variação da luz natural entre 9h e 10h.",position:2010},
  {id:"papel_cenarios",kind:"papel",title:"Cenários e telas",description:"Cuida dos cenários e das telas apresentadas, e das trocas de cena no OBS.",position:2020},
  {id:"papel_producao",kind:"papel",title:"Produção e perguntas",description:"Acompanha as perguntas do público, modera e coloca as escolhidas na tela.",position:2030}
].map(x=>({status:"em_teste",decided_at:null,...x})));
let guideItems=DEFAULT_GUIDE.map(x=>({...x})), guideAvailable=false, gEdit=null, gDraft=null, guideRolesDb=false, guideNoProg=false;
async function loadGuide(){
  if(!SB){ renderGuide(); return; }
  let {data,error}=await SB.from("guide_items").select("*").eq("program",PROG).order("position",{ascending:true});
  if(error && /program/.test(error.message||"")){
    if(PROG!=="akicast"){ guideAvailable=false; renderGuide(); return; }
    ({data,error}=await SB.from("guide_items").select("*").order("position",{ascending:true})); guideNoProg=true;
  }
  if(error){ guideAvailable=false; renderGuide(); return; }
  guideAvailable=true;
  if(!data.length){
    let base=DEFAULT_GUIDE.map(x=>({...x}));
    if(PROG!=="akicast"){ // começa como cópia do guia do AkiCast
      const src=await SB.from("guide_items").select("*").eq("program","akicast").order("position",{ascending:true});
      if(!src.error && src.data.length) base=src.data.map(({updated_at,...r})=>r);
      base=base.map(r=>({...r,id:PROG+":"+String(r.id).replace(/^[a-z]+:/,""),program:PROG}));
    } else if(!guideNoProg) base=base.map(r=>({...r,program:"akicast"}));
    await SB.from("guide_items").upsert(base); guideItems=base; data=base;
  }
  else guideItems=data;
  guideRolesDb = data.some(x=>x.kind==="papel");
  if(!guideRolesDb) guideItems=guideItems.concat(DEFAULT_GUIDE.filter(x=>x.kind==="papel"));
  if(!gEdit) renderGuide();
}
function watchGuide(){
  let t=null;
  SB.channel("guide-"+uid()).on("postgres_changes",{event:"*",schema:"public",table:"guide_items"},()=>{ clearTimeout(t); t=setTimeout(()=>{ if(!gEdit) loadGuide(); },400); }).subscribe();
}
const fmtDia=iso=>{ const d=new Date(iso); return isNaN(d)?"":d.getDate()+" "+MONTHS_S[d.getMonth()]+" "+d.getFullYear(); };
function guideHead(kind,title){
  const can = guideAvailable && !gEdit && (kind!=="papel" || guideRolesDb);
  return `<div class="g-head"><h3>${title}</h3>${can?`<button class="btn ghost sm" data-gedit="${kind}" type="button">Editar</button>`:""}</div>`;
}
function renderGuide(){
  const c=$("#gCrit"), a=$("#gAdj"), pr=$("#gRoles"); if(!c||!a) return;
  if(pr){
    if(gEdit==="papel") pr.innerHTML=guideHead("papel","Papéis na live")+guideEditorHtml("papel");
    else {
      const roles=guideItems.filter(x=>x.kind==="papel");
      pr.innerHTML=guideHead("papel","Papéis na live")
        +'<p class="meta">Quem faz o quê durante a transmissão. Ajuste quando a equipe mudar ou quando surgir uma função nova.</p>'
        +(roles.length?`<div class="setup roles-grid">${roles.map((x,i)=>`<div class="card role-card"><div class="role-n">${i+1}</div><div><h4>${esc(x.title)}</h4><p class="g-desc">${esc(x.description)}</p></div></div>`).join("")}</div>`:'<p class="meta">Nenhum papel cadastrado.</p>')
        +(guideAvailable&&!guideRolesDb?'<p class="meta g-note">Para editar os papéis, rode o arquivo supabase-atualizacao-papeis.sql no Supabase.</p>':"");
    }
  }
  const note = !guideAvailable && SB ? '<p class="meta g-note">Para editar esta parte, rode o arquivo supabase-atualizacao-guia.sql no Supabase.</p>' : "";
  // Pontos críticos
  if(gEdit==="critico") c.innerHTML=guideHead("critico","Pontos críticos")+guideEditorHtml("critico");
  else {
    const crit=guideItems.filter(x=>x.kind==="critico");
    c.innerHTML=guideHead("critico","Pontos críticos")+(crit.length?`<div class="setup crit-grid">${crit.map(x=>`<div class="card critical"><h4><span class="crit-ic" aria-hidden="true">!</span>${esc(x.title)}</h4><p class="g-desc">${esc(x.description)}</p></div>`).join("")}</div>`:'<p class="meta">Nenhum ponto crítico cadastrado.</p>')+note;
  }
  // Ajustes
  if(gEdit==="ajuste") a.innerHTML=guideHead("ajuste","Ajustes para a próxima transmissão")+guideEditorHtml("ajuste");
  else {
    const aj=guideItems.filter(x=>x.kind==="ajuste");
    const can=guideAvailable;
    const card=x=>{
      const st=x.status;
      const tag= st==="aprovado"?`<span class="aj-tag ok">Deu certo${x.decided_at?" · "+fmtDia(x.decided_at):""}</span>`
        : st==="reprovado"?`<span class="aj-tag bad">Não funcionou${x.decided_at?" · "+fmtDia(x.decided_at):""}</span>`
        : '<span class="aj-tag test">Em teste</span>';
      const acts=!can?"":st==="em_teste"
        ? `<button class="btn sm aj-ok" data-aj="aprovado" data-id="${esc(x.id)}" type="button">${ICON_CHECK_S}Deu certo</button><button class="btn sm aj-bad" data-aj="reprovado" data-id="${esc(x.id)}" type="button">${ICON_X_S}Não funcionou</button>`
        : `<button class="linkbtn" data-aj="em_teste" data-id="${esc(x.id)}" type="button">Voltar para em teste</button>`;
      return `<div class="card aj-card st-${st}"><div class="aj-top"><h4>${esc(x.title)}</h4>${tag}</div><p class="g-desc">${esc(x.description)}</p>${acts?`<div class="aj-acts">${acts}</div>`:""}</div>`;
    };
    const grp=(t,list,empty)=>`<div class="aj-group"><div class="aj-gh">${t}<span class="mod-n">${list.length}</span></div>${list.length?`<div class="setup">${list.map(card).join("")}</div>`:`<p class="meta">${empty}</p>`}</div>`;
    a.innerHTML=guideHead("ajuste","Ajustes para a próxima transmissão")
      +`<p class="meta">Marque cada ajuste depois de testar numa live: <b>Deu certo</b> vira padrão, <b>Não funcionou</b> fica registrado para não repetir.</p>`
      +grp("Em teste",aj.filter(x=>x.status==="em_teste"),"Nenhum ajuste esperando teste.")
      +grp("Deram certo",aj.filter(x=>x.status==="aprovado"),"Os ajustes aprovados aparecem aqui.")
      +grp("Não funcionaram",aj.filter(x=>x.status==="reprovado"),"Os ajustes que não deram certo aparecem aqui.")+note;
  }
  document.querySelectorAll("[data-gedit]").forEach(b=>b.addEventListener("click",()=>{ gEdit=b.dataset.gedit; gDraft=guideItems.filter(x=>x.kind===gEdit).map(x=>({...x})); renderGuide(); const f=document.querySelector(".g-ed input"); if(f) f.focus(); }));
  document.querySelectorAll("[data-aj]").forEach(b=>b.addEventListener("click",()=>setAjuste(b.dataset.id,b.dataset.aj)));
  if(gEdit) wireGuideEditor();
}
const ICON_CHECK_S='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_X_S='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
async function setAjuste(id,status){
  const it=guideItems.find(x=>x.id===id); if(!it) return;
  const prev={status:it.status,decided_at:it.decided_at};
  const patch={status,decided_at:status==="em_teste"?null:new Date().toISOString(),updated_at:new Date().toISOString()};
  Object.assign(it,patch); renderGuide();
  const {error}=await SB.from("guide_items").update(patch).eq("id",id);
  if(error){ const cur=guideItems.find(x=>x.id===id); if(cur) Object.assign(cur,prev); renderGuide(); toast("Não foi possível salvar."); return; }
  const msg=status==="aprovado"?"Ajuste aprovado: deu certo.":status==="reprovado"?"Registrado: não funcionou.":"Voltou para em teste.";
  toastAction(msg,"Desfazer",async()=>{ const cur=guideItems.find(x=>x.id===id); if(cur) Object.assign(cur,prev); renderGuide(); await SB.from("guide_items").update({...prev,updated_at:new Date().toISOString()}).eq("id",id); });
}
function guideEditorHtml(kind){
  const label=kind==="critico"?"ponto crítico":kind==="papel"?"papel":"ajuste";
  return `<div class="g-ed">
    <div class="ed-list">${gDraft.map((x,i)=>`<div class="ed-item">
      <div class="ed-move">
        <button class="icon-btn" data-ged="up" data-i="${i}" ${i===0?"disabled":""} aria-label="Subir">${ICON_UP}</button>
        <button class="icon-btn" data-ged="down" data-i="${i}" ${i===gDraft.length-1?"disabled":""} aria-label="Descer">${ICON_DOWN}</button>
      </div>
      <div class="ed-fields">
        <input data-gf="title" data-i="${i}" value="${esc(x.title)}" placeholder="${gEdit==="papel"?"Nome do papel (ex.: Câmera e iluminação)":"Título (ex.: Iluminação)"}" maxlength="80" aria-label="Título">
        <textarea data-gf="description" data-i="${i}" rows="3" maxlength="1200" placeholder="${gEdit==="papel"?"O que essa pessoa faz durante a live":"Descrição"}" aria-label="Descrição">${esc(x.description)}</textarea>
      </div>
      <button class="linkbtn ed-rm" data-ged="rm" data-i="${i}" type="button">Remover</button>
    </div>`).join("")}</div>
    <button class="btn ghost ed-add" data-ged="add" type="button">Adicionar ${label}</button>
    <div class="ep-foot"><button class="btn ghost" data-ged="cancel" type="button">Cancelar</button><button class="btn primary" data-ged="save" type="button">Salvar</button></div>
  </div>`;
}
function wireGuideEditor(){
  document.querySelectorAll(".g-ed [data-gf]").forEach(inp=>inp.addEventListener("input",()=>{ gDraft[inp.dataset.i][inp.dataset.gf]=inp.value; }));
  document.querySelectorAll(".g-ed [data-ged]").forEach(b=>b.addEventListener("click",async()=>{
    const act=b.dataset.ged, i=+b.dataset.i;
    if(act==="up"&&i>0){ [gDraft[i-1],gDraft[i]]=[gDraft[i],gDraft[i-1]]; renderGuide(); }
    else if(act==="down"&&i<gDraft.length-1){ [gDraft[i+1],gDraft[i]]=[gDraft[i],gDraft[i+1]]; renderGuide(); }
    else if(act==="rm"){ gDraft.splice(i,1); renderGuide(); }
    else if(act==="add"){ gDraft.push({id:(gEdit==="critico"?"crit_":gEdit==="papel"?"papel_":"aj_")+Date.now().toString(36)+uid().slice(0,3),kind:gEdit,title:"",description:"",status:"em_teste",decided_at:null}); renderGuide(); const l=[...document.querySelectorAll('.g-ed input[data-gf="title"]')].pop(); if(l) l.focus(); }
    else if(act==="cancel"){ gEdit=null; gDraft=null; renderGuide(); }
    else if(act==="save"){ await saveGuide(b); }
  }));
}
async function saveGuide(btn){
  btn.disabled=true; btn.textContent="Salvando…";
  const kind=gEdit, base=kind==="critico"?0:kind==="papel"?2000:1000;
  const rows=gDraft.map((x,i)=>({id:(PROG!=="akicast"&&!String(x.id).startsWith(PROG+":"))?PROG+":"+x.id:x.id,kind,title:(x.title||"").trim(),description:(x.description||"").trim(),status:x.status||"em_teste",decided_at:x.decided_at||null,position:base+(i+1)*10,updated_at:new Date().toISOString(),...(guideNoProg?{}:{program:PROG})})).filter(r=>r.title);
  try{
    const keep=new Set(rows.map(r=>r.id));
    const gone=guideItems.filter(x=>x.kind===kind&&!keep.has(x.id)).map(x=>x.id);
    if(rows.length){ const {error}=await SB.from("guide_items").upsert(rows); if(error) throw error; }
    if(gone.length){ const {error}=await SB.from("guide_items").delete().in("id",gone); if(error) throw error; }
    guideItems=guideItems.filter(x=>x.kind!==kind).concat(rows).sort((a,b)=>a.position-b.position);
    gEdit=null; gDraft=null; renderGuide(); toast("Guia atualizado.");
  }catch(e){ handleErr(e); btn.disabled=false; btn.textContent="Salvar"; }
}

const ICON_TAB_INT=(document.querySelector("#tab-int .ti")||{outerHTML:""}).outerHTML;
const ICON_TAB_HOME=(document.querySelector("#tab-home .ti")||{outerHTML:""}).outerHTML;
const ICON_MIC_S='<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
/* =================== Bloqueio amigável para PowerPoint =================== */
const isPptName=n=>/\.(pptx?|ppsx|pps|pptm|key|odp)$/i.test(n||"");
function showPptHelp(name){
  $("#pptName").textContent=name?`"${name}" é um arquivo de apresentação que o navegador não consegue abrir.`:"";
  $("#pptOv").hidden=false; $("#pptClose").focus();
}
function closePptHelp(){ $("#pptOv").hidden=true; }
$("#pptClose").addEventListener("click",closePptHelp);
$("#pptOv").addEventListener("click",e=>{ if(e.target.id==="pptOv") closePptHelp(); });
addEventListener("keydown",e=>{ if(e.key==="Escape" && !$("#pptOv").hidden) closePptHelp(); });
document.querySelectorAll("#pptOv [data-ppt-tab]").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("#pptOv [data-ppt-tab]").forEach(x=>x.setAttribute("aria-selected",x===b?"true":"false"));
  document.querySelectorAll("#pptOv [data-ppt-panel]").forEach(p=>p.hidden=p.dataset.pptPanel!==b.dataset.pptTab);
}));

/* =================== Sala de controle da live =================== */
function salaLink(epId){ return location.origin+location.pathname+"?sala="+encodeURIComponent(epId); }
function miniLink(epId){ return salaLink(epId)+"&modo=frase"; }
const SALA_MINI=new URLSearchParams(location.search).get("modo")==="frase";
let sqEp=null, sqRows=[], sqTela=null, sqPoll=null, sqSig="", sqSub=null, sqRO=null, sqOff=false, sqT=null;
function openSala(epId){
  if(!SB) return;
  const ep=episodes.find(e=>e.id===epId);
  $("#salaEp").textContent = ep ? (ep.theme||"AkiCast")+", "+fmtShort(ep.date) : "AkiCast";
  $("#salaOv").hidden=false; document.body.style.overflow="hidden";
  $("#salaOv").classList.toggle("sala-mini",SALA_MINI);
  { const lb=document.querySelector("#salaOv .sala-title .hc-label"); if(lb) lb.textContent=SALA_MINI?"Frase de destaque e QR Code":"Sala de controle"; }
  $("#salaCur").innerHTML="";
  startLive(epId,"sala",L=>{
    L.cur=new DeckFrame($("#salaCur")); L.next=null;
    L.frames=[L.cur];
    const cc=document.createElement("div"); cc.className="cur-cover"; cc.hidden=true;
    cc.innerHTML='<img class="cover-logo" alt=""><span>Tela do AkiCast no ar</span>';
    cc.querySelector("img").src=$("#ctrlLogo").src;
    $("#salaCur").appendChild(cc); L.curCover=cc;
    L.cur.onReport=()=>renderStep();
  });
  renderStep(); renderSalaStatus(); tickSala();
  live.timerInt=setInterval(tickSala,1000);
  startSalaQs(epId);
}
function closeSala(){ clearDirectParam(); stopSalaQs(); stopLive(); $("#salaOv").hidden=true; document.body.style.overflow=""; }
function tickSala(){
  if(!live||live.mode!=="sala") return;
  const now=new Date(), end=new Date(); end.setHours(10,0,0,0);
  $("#salaNow").textContent=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  const left=Math.round((end-now)/60000);
  const el=$("#salaLeft");
  el.textContent = (now.getHours()>=9 && left>0) ? left+" min" : "–";
  el.classList.toggle("late", now.getHours()>=9 && left>0 && left<=10);
}
function chipExibicao(peers){
  const d=(peers||[]).filter(p=>p&&p.mode==="display");
  if(!d.length) return '<span class="s-chip"><span class="dotc"></span><b>Tela de exibição</b><span>fechada</span></span>';
  const TXT={carregando:"carregando a apresentação",sem_resposta:"sem resposta · vigiando",fora:"fora do slide no ar · corrigindo"};
  const ruim=d.find(p=>p.estado&&p.estado!=="ok");
  if(ruim) return `<span class="s-chip warn-c"><span class="dotc${ruim.estado==="carregando"?"":" bad"}"></span><b>Tela de exibição</b><span>${TXT[ruim.estado]||ruim.estado}</span></span>`;
  const sl=d[0].slide!=null?" · slide "+d[0].slide:"";
  return `<span class="s-chip on"><span class="dotc on"></span><b>Tela de exibição</b><span>no ar${sl}${d.length>1?" · "+d.length+" abertas":""}</span></span>`;
}
function renderSalaStatus(){
  const el=$("#salaStatus"); if(!el||!live||live.mode!=="sala") return;
  const peers=live.peers||[], has=m=>peers.some(p=>p&&p.mode===m);
  const chip=(ok,label,okTxt,noTxt)=>`<span class="s-chip ${ok?"on":""}"><span class="dotc${ok?" on":""}"></span><b>${label}</b><span>${ok?okTxt:noTxt}</span></span>`;
  el.innerHTML =
    (live.conn==="off" ? '<span class="s-chip bad"><span class="dotc bad"></span><b>Sua conexão</b><span>reconectando…</span></span>' : chip(true,"Sua conexão","ok",""))
    + chip(has("controller"),"Apresentador","conectado","não abriu o controle")
    + chipExibicao(peers)
    + chip(has("perguntas"),"Tela de perguntas","no ar","fechada")
    + (live.noDeck?'<span class="s-chip warn-c"><b>Apresentação</b><span>não enviada</span></span>':"");
}
function startSalaQs(ep){
  stopSalaQs(); sqEp=ep; sqSig=""; sqRows=[]; sqTela=null; sqOff=false;
  if(!SB) return;
  const kick=()=>{ clearTimeout(sqT); sqT=setTimeout(loadSalaQs,250); };
  sqSub=SB.channel("sala-q-"+uid())
    .on("postgres_changes",{event:"*",schema:"public",table:"int_perguntas",filter:"episode_id=eq."+ep},kick)
    .on("postgres_changes",{event:"*",schema:"public",table:"int_tela",filter:"episode_id=eq."+ep},kick)
    .on("postgres_changes",{event:"*",schema:"public",table:"int_atividades",filter:"episode_id=eq."+ep},kick)
    .subscribe();
  let sqPrim=true;
  sqPoll=agendador(()=>{ if(sqPrim||!$("#salaOv")||!$("#salaOv").hidden){ sqPrim=false; return loadSalaQs(); } },()=>document.hidden?null:((sqActs||[]).some(a=>a.estado==="aberta")?3000:15000));
}
function stopSalaQs(){ if(sqPoll&&sqPoll.parar) sqPoll.parar(); sqPoll=null; if(sqSub){ try{ SB.removeChannel(sqSub); }catch(e){} sqSub=null; } sqEp=null; }
async function loadSalaQs(){
  if(!sqEp) return;
  if(!SESSION||SESSION.papel!=="admin"){ renderSalaQs(); return; }
  const [q,t]=await Promise.all([
    SB.from("int_perguntas").select("id,texto,nome,status,votos,pedido_apresentador,criada_em,no_ar_em,moderada_em").eq("episode_id",sqEp),
    SB.from("int_tela").select("*").eq("episode_id",sqEp).maybeSingle()
  ]);
  if(q.error){ if(/int_perguntas|does not exist|schema cache/i.test(q.error.message||"")) sqOff=true; renderSalaQs(); return; }
  sqRows=q.data||[]; sqTela=t.data||null; await Promise.all([loadSalaQuiz(),loadSalaFrases(),loadSalaRank(),loadSalaSorteio()]); renderSalaQs(); renderSalaFrase(); renderSalaNome(); renderSalaQr(); updateSalaQrLive(); syncLegPreview(); renderMiniOnAir(); requestAnimationFrame(()=>fitNome($("#salaTela")));
}
const SALA_FORMATS=[
  {id:"destaque",t:"Destaque",d:"Cartão grande no centro da tela. Para dar ênfase a uma pergunta."},
  {id:"faixa",t:"Faixa",d:"Tarja na parte de baixo. Slides e câmera continuam visíveis."}
];
let salaFmt=lsGet("akicast-sala-fmt")||"destaque";
if(!SALA_FORMATS.find(f=>f.id===salaFmt)) salaFmt="destaque";
function fmtName(id){ const f=SALA_FORMATS.find(x=>x.id===id); return f?f.t:id; }
const sqOpen={resp:true,rem:false,zdone:false};
function closedGroup(key,title,list,acts,empty,V){
  const open=sqOpen[key];
  return `<div class="sala-card sala-closed">
    <button class="closed-h" data-sq-tog="${key}" type="button" aria-expanded="${open}"><span class="closed-chev${open?" open":""}" aria-hidden="true">${ICON_DOWN}</span><h3>${title}</h3><span class="mod-n">${list.length}</span></button>
    ${open?(list.length?`<ul class="sq-list closed-list">${list.map(r=>`<li class="sq-item closed-item">
      <div class="sq-body"><p>${esc(r.texto)}</p><div class="cq-meta">${V(r.votos)}${r.no_ar_em?'<span class="st-badge st-respondida">Foi ao ar</span>':""}<span class="meta">${esc(r.nome||"Anônimo")}</span></div></div>
      <div class="sq-acts">${acts(r)}</div></li>`).join("")}</ul>`:(empty?`<p class="meta" style="margin:8px 0 0">${empty}</p>`:"")):""}
  </div>`;
}
const FMT_ICON={destaque:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><rect x="7.5" y="8" width="9" height="6" rx="1"/></svg>',faixa:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M5.5 14.5h13"/></svg>'};
function showBtns(id,label,quiet){
  return `<span class="show-group" role="group" aria-label="${label}"><span class="sg-lbl">${label}</span>${SALA_FORMATS.map(x=>`<button class="btn sm ${quiet?"tela-b":"primary"} sq-show${salaFmt===x.id?" last":""}" data-sq="show" data-f="${x.id}" data-id="${id}" type="button" title="Colocar na tela como ${x.t}">${FMT_ICON[x.id]||""}${x.t}</button>`).join("")}</span>`;
}
function renderSalaQs(){
  const box=$("#salaQs"), tw=$("#salaTela"); if(!box||!tw) return;
  const admin=SESSION&&SESSION.papel==="admin";
  const onair=sqTela&&sqTela.pergunta_id ? sqRows.find(r=>r.id===sqTela.pergunta_id) : null;
  const doneRows=sqRows.filter(r=>r.status==="respondida").sort((a,b)=>(b.no_ar_em||b.criada_em).localeCompare(a.no_ar_em||a.criada_em));
  const remRows=sqRows.filter(r=>r.status==="descartada").sort((a,b)=>(b.moderada_em||b.criada_em).localeCompare(a.moderada_em||a.criada_em));
  const rows=sqRows.filter(r=>r.status==="nova"||r.status==="aprovada"||r.status==="no_ar").sort((a,b)=>(b.status==="no_ar")-(a.status==="no_ar")||((a.pedido_apresentador??999)-(b.pedido_apresentador??999))||(b.votos-a.votos)||a.criada_em.localeCompare(b.criada_em));
  if(sqForm && document.activeElement && document.activeElement.closest && document.activeElement.closest(".sqf-form")) return;
  const sig=JSON.stringify([admin,sqOff,sqTela,salaFmt,sqOpen,sqActs,sqARes,sqTab,!!sqForm,[...sqMultiSel.quiz],[...sqMultiSel.perg],sqMultiLayout,sqRank,sqRankErr,sqSorteio,sqSorteioErr,(episodes.find(e=>e.id===sqEp)||{}).pontuacao,sqRows.map(r=>[r.id,r.status,r.votos,r.pedido_apresentador,r.texto,r.nome])]);
  if(sig===sqSig && box.firstElementChild) return; sqSig=sig;
  if(sqOff){ tw.innerHTML=""; box.innerHTML='<div class="sala-card"><h3>Perguntas do público</h3><p class="meta">A interação com o público não está ativa nesta central.</p></div>'; return; }
  if(!admin){
    tw.innerHTML='<div class="sala-card"><h3>Na tela agora</h3><p class="meta">Entre como produção para controlar o que aparece na tela.</p></div>';
    box.innerHTML=`<div class="sala-card"><h3>Perguntas do público</h3><p class="meta">Entre com um login da produção para ver as perguntas e colocá-las na tela.</p><button class="btn primary" id="salaLogin" type="button">Entrar</button></div>`;
    $("#salaLogin").addEventListener("click",openLogin); return;
  }
  const f=onair?sqTela.formato:null;
  const qOn=sqTela&&sqTela.atividade_id&&Array.isArray(sqActs) ? sqActs.find(a=>a.id===sqTela.atividade_id) : null;
  const curOnQuiz=!!qOn, curOn=!!(qOn||onair);
  const curFmt=qOn ? (sqTela.formato==="quiz_faixa"?"faixa":"destaque") : (onair?f:null);
  // ---- Na tela agora + formatos
  tw.innerHTML=(qOn?`<div class="sala-card sala-tela">
    <div class="sala-h"><h3>Na tela agora</h3><span class="air-pill on"><span class="dotc on"></span>No ar · ${tipoNome(qOn)} · ${sqTela.formato==="quiz_faixa"?"Faixa":"Destaque"}</span></div>
    <div class="tp-box sala-preview" id="sqBox"><div class="tp-canvas" id="sqCanvas">${sqTela.formato==="quiz_faixa"?quizFaixaInner(qOn,sqARes[qOn.id]):quizInner(qOn,sqARes[qOn.id])}${frasesPreview(sqTela)}${multiOnAir()?multiInner(multiPreviewItems(),sqTela.multi.layout,sqTela.multi.tipo,0):""}</div></div>
    <div class="sala-onair"><p>${esc(qOn.pergunta)}</p><span class="meta">${qOn.estado==="encerrada"?"Mostrando o resultado":"Mostrando as alternativas: o público está respondendo"}</span></div>
    <div class="sala-onair-acts"><button class="btn primary" data-sq="limpar" type="button">Limpar a tela</button></div>
  </div>`:"")+`<div class="sala-card sala-tela"${qOn?" hidden":""}>
    <div class="sala-h"><h3>Na tela agora</h3>${onair?`<span class="air-pill on"><span class="dotc on"></span>No ar · ${esc(fmtName(f))}</span>`:'<span class="air-pill">Tela limpa</span>'}</div>
    <div class="tp-box sala-preview" id="sqBox"><div class="tp-canvas" id="sqCanvas">${overlayInner(onair,f)}${frasesPreview(sqTela)}${sqTela&&Array.isArray(sqTela.podio)?podioInner(sqTela.podio,sqTela.podio_formato):""}${multiOnAir()?multiInner(multiPreviewItems(),sqTela.multi.layout,sqTela.multi.tipo,0):""}</div>${onair||(sqTela&&(sqTela.frase||sqTela.selo_frase||nomeAtivo(sqTela,"esq")||nomeAtivo(sqTela,"dir")||nomeAtivo(sqTela,"centro")))||multiOnAir()?"":'<span class="tp-empty">Nada do público na tela</span>'}</div>
    ${onair?`<div class="sala-onair"><p>${esc(onair.texto)}</p><span class="meta">${esc(onair.nome||"Anônimo")}</span></div>
      <div class="sala-onair-acts"><button class="btn primary" data-sq="limpar" type="button">Limpar a tela</button><button class="btn ghost" data-sq="resp" data-id="${onair.id}" type="button">Marcar como respondida</button></div>`:""}
  </div>
  <div class="sala-card">
    <div class="sala-h"><h3>Formato de exibição</h3><span class="meta">${curOn?`Trocar muda ${curOnQuiz?(qOn.tipo==="enquete"?"a votação":"o quiz"):"a pergunta"} na tela na hora`:"Vale para perguntas, quiz e votação"}</span></div>
    <div class="fmt-list" role="radiogroup" aria-label="Formato de exibição">
      ${SALA_FORMATS.map(x=>{ const sel=curOn?curFmt===x.id:salaFmt===x.id; return `<button class="fmt-card${sel?" sel":""}" role="radio" aria-checked="${sel}" data-sq="fmt" data-f="${x.id}" type="button">
        <span class="fmt-pic fmt-${x.id}" aria-hidden="true"><i></i></span>
        <span class="fmt-txt"><b>${esc(x.t)}${curOn&&curFmt===x.id?' <span class="air-dot">no ar</span>':""}</b><span>${esc(x.d)}</span></span>
      </button>`; }).join("")}
    </div>
    <p class="meta fmt-note">Novos tipos de interação, como enquetes ou o nome do apresentador, entram aqui como novos formatos.</p>
  </div>`;
  const bx=$("#sqBox"), cv=$("#sqCanvas"), fit=()=>{ if(bx&&cv) cv.style.transform=`scale(${bx.clientWidth/1920})`; };
  fit(); if(sqRO) sqRO.disconnect(); if(bx){ sqRO=new ResizeObserver(fit); sqRO.observe(bx); }
  // ---- Perguntas
  const V=n=>`<span class="votes-pill${n?"":" zero"}">${ICON_VOTE}<b>${n}</b> ${n===1?"voto":"votos"}</span>`;
  box.innerHTML=`<div class="sala-card sala-qcard"><div class="sala-h"><h3>Perguntas do público</h3><span class="meta">${rows.length} ${rows.length===1?"pergunta":"perguntas"} · na tela, fila do apresentador e mais votadas</span></div>
    ${rows.length?multiBarHtml("perg"):""}${rows.length?`<ul class="sq-list">${rows.map(r=>`<li class="sq-item${r.status==="no_ar"?" onair":""}">
      <div class="sq-body"><p>${esc(r.texto)}</p>
        <div class="cq-meta">${V(r.votos)}${r.pedido_apresentador!=null?`<span class="st-badge st-pedido">Apresentador: nº ${r.pedido_apresentador}</span>`:""}${r.status==="no_ar"?`<span class="st-badge st-no_ar">Na tela · ${esc(fmtName(f))}</span>`:""}<span class="meta">${esc(r.nome||"Anônimo")}</span>${multiCheck("perg",r.id)}</div>
      </div>
      <div class="sq-acts">${r.status==="no_ar"
        ? `<button class="btn ghost sm" data-sq="limpar" type="button">Tirar da tela</button>`
        : showBtns(r.id,"Mostrar em")}
        <button class="btn ghost sm" data-sq="resp" data-id="${r.id}" type="button">Respondida</button>
        <button class="linkbtn mq-rm" data-sq="rm" data-id="${r.id}" type="button">Remover</button>
      </div></li>`).join("")}</ul>`:'<p class="meta">As perguntas dos ouvintes aparecem aqui assim que são enviadas.</p>'}
  </div>
  ${closedGroup("resp","Já respondidas",doneRows,r=>`<button class="btn ghost sm" data-sq="reabrir" data-id="${r.id}" type="button">Reabrir</button>${showBtns(r.id,"Mostrar de novo em",true)}`,"As perguntas marcadas como respondidas ficam aqui, caso precise reabrir alguma.",V)}
  ${remRows.length?closedGroup("rem","Removidas",remRows,r=>`<button class="btn ghost sm" data-sq="reabrir" data-id="${r.id}" type="button">Restaurar</button>`,"",V):""}`;
  {
    const pergInner=box.innerHTML, quizInnerHtml=salaQuizHtml();
    if(quizInnerHtml){
      const nPerg=rows.length, ativos=(sqActs||[]).filter(a=>a.estado!=="encerrada").length, aoVivo=(sqActs||[]).some(a=>a.estado==="aberta");
      const nRank=(sqRank||[]).length, fechado=sqTela&&sqTela.pontos_encerrados_em;
      const epS=episodes.find(e=>e.id===sqEp), pontOn=!!(epS&&epS.pontuacao);
      if(sqTab==="sort") sqTab="rank";
      if(!pontOn && sqTab==="rank") sqTab="quiz";
      box.innerHTML=`<div class="sm-tabs" role="tablist" aria-label="Interações">
          <button role="tab" type="button" data-smtab="perg" aria-selected="${sqTab==="perg"}">Perguntas<span class="mod-n">${nPerg}</span></button>
          <button role="tab" type="button" data-smtab="quiz" aria-selected="${sqTab==="quiz"}">Quiz e votações<span class="mod-n${aoVivo?" live":""}">${aoVivo?"ao vivo":ativos}</span></button>
          ${pontOn?`<button role="tab" type="button" data-smtab="rank" aria-selected="${sqTab==="rank"}">Pontuação e sorteio${sqSorteio?'<span class="mod-n live-ok" title="Top 3 enviado">✓</span>':`<span class="mod-n">${fechado?"final":nRank}</span>`}</button>`:""}
        </div>
        <div class="sm-panel" data-sp="perg"${sqTab!=="perg"?" hidden":""}>${pergInner}</div>
        <div class="sm-panel" data-sp="quiz"${sqTab!=="quiz"?" hidden":""}>${quizInnerHtml}${pontOn?"":`<p class="meta pt-off-note">Pontuação e sorteio desligados neste episódio: ninguém precisa do nome para participar. <button class="linkbtn" type="button" id="ptOnSala">Ligar agora</button></p>`}</div>
        <div class="sm-panel" data-sp="rank"${sqTab!=="rank"?" hidden":""}>${fechado?salaSorteioHtml()+salaRankHtml():salaRankHtml()+'<p class="meta pt-off-note">Depois de encerrar as participações, aparecem aqui o Top 3, o envio para o apresentador e o pódio no telão.</p>'}</div>`;
      box.querySelectorAll("[data-so]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); sorteioAction(b.dataset.so,b); }));
      box.querySelectorAll("[data-po]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); podioAction(b.dataset.po,b); }));
      box.querySelectorAll("[data-pf]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); podioFmt=b.dataset.pf; lsSet("akicast-podio-fmt",podioFmt); if(sqTela&&Array.isArray(sqTela.podio)) podioAction("mostrar",b); else { sqSig=""; renderSalaQs(); } }));
      box.querySelectorAll("[data-rk]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); rankAction(b.dataset.rk,b); }));
      { const pb=$("#ptOnSala"); if(pb) pb.addEventListener("click",async()=>{ if(!confirmInline(pb,"Ligar mesmo?")) return; try{ await store.update(sqEp,{pontuacao:true}); const e=episodes.find(x=>x.id===sqEp); if(e) e.pontuacao=true; toast("Pontuação e sorteio ligados. A página do público passa a pedir o nome."); sqSig=""; renderSalaQs(); }catch(err){ toast("Não foi possível ligar: "+(err.message||"")); } }); }
      box.querySelectorAll("[data-smtab]").forEach(b=>b.addEventListener("click",()=>{ sqTab=b.dataset.smtab; lsSet("akicast-sala-tab",sqTab); sqSig=""; if(sqTab==="rank"||sqTab==="sort"){ sqRank=null; loadSalaQs(); } else renderSalaQs(); }));
    }
  }
  document.querySelectorAll("#salaOv [data-sq-tog]").forEach(b=>b.addEventListener("click",()=>{ sqOpen[b.dataset.sqTog]=!sqOpen[b.dataset.sqTog]; sqSig=""; renderSalaQs(); }));
  document.querySelectorAll("#salaOv [data-sq]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); salaQAction(b.dataset.sq,b.dataset.id,b.dataset.f,b); }));
  document.querySelectorAll("#salaOv [data-sz]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); salaQuizAction(b.dataset.sz,b.dataset.id,b); }));
  document.querySelectorAll("#salaOv [data-szsel]").forEach(c=>c.addEventListener("change",()=>{ if(c.checked) sqSel.add(c.dataset.szsel); else sqSel.delete(c.dataset.szsel); sqSig=""; renderSalaQs(); }));
  document.querySelectorAll("#salaOv [data-szb]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); salaBulk(b.dataset.szb,b); }));
  wireSalaCreate();
  wireMulti();
  { const ch=$("#chAuto"); if(ch) ch.addEventListener("click",()=>{ ch.blur(); chamadaToggle(ch); }); }
}
async function clearPodioIfConflict(novaZona){
  await clearMultiIfConflict(novaZona);
  if(!sqTela||!Array.isArray(sqTela.podio)) return;
  const zp=(sqTela.podio_formato||"destaque")==="destaque"?"centro":sqTela.podio_formato==="faixa"?"base":"lateral";
  if(zp===novaZona){ await SB.rpc("int_mostrar_podio",{p_episode:sqEp,p_mostrar:false,p_formato:sqTela.podio_formato||"destaque"}); toast("O pódio saiu da tela para dar lugar ao novo conteúdo."); }
}
async function salaQAction(act,id,fmt,btn){
  if(act==="show") await clearPodioIfConflict((fmt||salaFmt)==="faixa"?"base":"centro");
  if(act==="fmt" && sqTela && (sqTela.pergunta_id||sqTela.atividade_id)) await clearPodioIfConflict(fmt==="faixa"?"base":"centro");
  if(act==="fmt"){
    salaFmt=fmt; lsSet("akicast-sala-fmt",fmt); sqSig="";
    if(sqTela&&sqTela.atividade_id){
      const want=fmt==="faixa"?"quiz_faixa":"quiz";
      if(sqTela.formato!==want){ const r=await SB.rpc("int_mostrar_atividade",{p_episode:sqEp,p_atividade:sqTela.atividade_id,p_formato:want}); if(r.error) toast("Não foi possível trocar o formato."); }
    } else if(sqTela&&sqTela.pergunta_id&&sqTela.formato!==fmt){ const r=await SB.rpc("int_mostrar",{p_episode:sqEp,p_pergunta:sqTela.pergunta_id,p_formato:fmt}); if(r.error) toast("Não foi possível trocar o formato."); }
    renderSalaQs(); loadSalaQs(); return;
  }
  if(btn) btn.disabled=true;
  let r;
  if(act==="show"){ const f=fmt||salaFmt; salaFmt=f; lsSet("akicast-sala-fmt",f); r=await SB.rpc("int_mostrar",{p_episode:sqEp,p_pergunta:id,p_formato:f}); }
  else if(act==="limpar") r=await SB.rpc("int_mostrar",{p_episode:sqEp,p_pergunta:null});
  else if(act==="resp") r=await SB.rpc("int_moderar",{p_id:id,p_status:"respondida"});
  else if(act==="reabrir"){ r=await SB.rpc("int_moderar",{p_id:id,p_status:"aprovada"}); if(!r.error) toast("Pergunta reaberta: voltou para a lista e para a votação."); }
  else if(act==="rm"){ r=await SB.rpc("int_moderar",{p_id:id,p_status:"descartada"});
    if(!r.error) toastAction("Pergunta removida para todos.","Desfazer",async()=>{ await SB.rpc("int_moderar",{p_id:id,p_status:"aprovada"}); loadSalaQs(); }); }
  if(r&&r.error){ toast("Não foi possível atualizar."); if(btn) btn.disabled=false; }
  loadSalaQs();
}
$("#salaExit").addEventListener("click",closeSala);
$("#salaCover").addEventListener("click",()=>{ if(live&&live.mode==="sala") toggleCover(); });
document.addEventListener("change",e=>{ const c=e.target; if(c&&c.matches&&c.matches("[data-otimizar]")){ lsSet("akicast-otimizar",c.checked?"1":"0"); document.querySelectorAll("[data-otimizar]").forEach(x=>x.checked=c.checked); } });
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest("[data-leve-btn],[data-recarregar-btn],[data-reserva-btn],[data-campos-limpar]"); if(!b||!live) return; if(b.hasAttribute("data-reserva-btn")){ toggleReserva(b); return; } if(b.hasAttribute("data-campos-limpar")){ camposLimpar(b); return; } b.blur(); if(b.hasAttribute("data-leve-btn")) toggleLeve(); else recarregarTelas(); });
{ const hl=document.querySelector("img.logo"), sl=$("#salaLogo"); if(hl&&sl) sl.src=hl.src; }

/* =================== Teste de carga (ouvintes simulados) =================== */
let LT=null; // estado do teste em andamento
function pct(arr,p){ if(!arr.length) return null; const a=arr.slice().sort((x,y)=>x-y); return a[Math.min(a.length-1,Math.floor(p*a.length))]; }
const fmtMs=v=>v==null?"–":(v<1000?Math.round(v)+" ms":(v/1000).toFixed(1).replace(".",",")+" s");
function loadCardHtml(){
  return `<div class="pres-card load-card" id="loadCard">
    <div class="hc-head"><h2 style="margin:0">Teste de carga</h2><span class="proto-tag">Só para testes</span></div>
    <p class="meta">Simula vários ouvintes com a página de participação aberta ao mesmo tempo, fazendo o que a página de cada um faz hoje: check-in, avisos em tempo real, conferência do placar a cada 6 segundos, perguntas, votos e a resposta de um quiz aberto no meio do teste. O teste cria um episódio temporário e apaga tudo no final. Não use durante uma live de verdade.</p>
    <div class="load-form">
      <label class="field"><span>Ouvintes ao mesmo tempo</span><input id="ltN" type="number" min="5" max="200" value="100"></label>
      <label class="field"><span>Perguntas no total</span><input id="ltQ" type="number" min="1" max="60" value="20"></label>
      <label class="field"><span>Votos por ouvinte (máx.)</span><input id="ltV" type="number" min="0" max="10" value="3"></label>
      <label class="field"><span>Duração</span><select id="ltD" class="ep"><option value="60">1 minuto</option><option value="120" selected>2 minutos</option><option value="180">3 minutos</option></select></label>
    </div>
    <div class="lt-ops">
      <label class="otz-chk"><input type="checkbox" id="ltRt" checked> Avisos em tempo real (uma conexão por ouvinte, como na live)</label>
      <label class="otz-chk"><input type="checkbox" id="ltQz" checked> Abrir um quiz no meio do teste e todos responderem</label>
    </div>
    <div class="pres-row"><button class="btn primary" id="ltStart" type="button">Iniciar teste</button><button class="btn ghost" id="ltStop" type="button" hidden>Parar</button><span class="meta" id="ltState"></span></div>
    <div class="progress-up" id="ltProg" hidden><i></i></div>
    <div id="ltLinks"></div>
    <div id="ltStats"></div>
  </div>`;
}
function wireLoadCard(){
  const s=$("#ltStart"); if(!s) return;
  s.addEventListener("click",startLoadTest);
  $("#ltStop").addEventListener("click",()=>{ if(LT) LT.stopAt=Date.now(); });
  if(LT){
    renderLoadStats();
    if(!LT.done){ s.disabled=true; $("#ltStop").hidden=false; $("#ltProg").hidden=false;
      $("#ltLinks").innerHTML=`<p class="meta">Durante o teste, dá para acompanhar como produção: <a href="${esc(salaLink(LT.epId))}" target="_blank" rel="noopener">abrir a sala de controle do teste</a> · <a href="${esc(listenLink(LT.epId))}" target="_blank" rel="noopener">abrir como ouvinte</a></p>`; }
  }
}
async function startLoadTest(){
  if(LT&&!LT.done) return;
  const N=Math.max(5,Math.min(200,parseInt($("#ltN").value,10)||100));
  const Q=Math.max(1,Math.min(60,parseInt($("#ltQ").value,10)||20));
  const V=Math.max(0,Math.min(10,parseInt($("#ltV").value,10)||0));
  const D=parseInt($("#ltD").value,10)*1000;
  const RT=!!($("#ltRt")&&$("#ltRt").checked), QZ=!!($("#ltQz")&&$("#ltQz").checked);
  $("#ltStart").disabled=true; $("#ltState").textContent="Preparando…";
  let epId;
  try{ epId=await store.create({date:isoDate(new Date()),theme:"Teste de carga (apagado ao final)",presenters:"",people:null,notes:"",checks:{},rating:null,review:""}); }
  catch(e){ $("#ltStart").disabled=false; $("#ltState").textContent="Não foi possível criar o episódio temporário."; return; }
  const A=getAnon();
  LT={epId,N,Q,V,D,RT,QZ,start:Date.now(),stopAt:null,done:false,req:0,err:0,errMsgs:{},lat:{placar:[],lista:[],envio:[],voto:[],checkin:[],resposta:[]},sent:0,sendErr:0,votesOk:0,voteErr:0,arrive:[],sentAt:{},listeners:[],timers:[],peakRps:0,win:[],
    ckOk:0,ckErr:0,ckFechado:0,rtOk:0,rtErr:0,rtAvisos:0,clients:[],quizId:null,quizAt:null,respOk:0,respErr:0,respSemCk:0,respChegou:[]};
  const t0=LT.start;
  const rec=(k,ms,ok,msg)=>{ LT.req++; LT.win.push(Date.now()); if(ok) LT.lat[k].push(ms); else { LT.err++; const m=(msg||"erro").slice(0,80); LT.errMsgs[m]=(LT.errMsgs[m]||0)+1; } };
  // Fila: no máximo 40 pedidos dos ouvintes simulados ao mesmo tempo. Sem ela, quem trava é o navegador deste
  // computador (todos saem da mesma aba), e não o Supabase. O tempo medido começa quando o pedido sai da fila.
  const FILA_MAX=40; let emVoo=0; const filaEspera=[];
  const vez=()=>new Promise(res=>{ if(emVoo<FILA_MAX){ emVoo++; res(); } else filaEspera.push(res); });
  const liberar=()=>{ const prox=filaEspera.shift(); if(prox) prox(); else emVoo--; };
  const ehNavegador=m=>/Failed to fetch|NetworkError|Load failed|ERR_INSUFFICIENT_RESOURCES/i.test(m||"");
  const rec2=(k,ms,ok,msg)=>{ if(!ok&&ehNavegador(msg)) msg="Limite do navegador deste computador (não é o Supabase)"; rec(k,ms,ok,msg); };
  const call=async(k,fn)=>{ await vez(); const a=performance.now(); try{ const r=await fn(); const ok=!r.error; rec2(k,performance.now()-a,ok,r.error&&r.error.message); return r; }catch(e){ rec2(k,performance.now()-a,false,String(e)); return {error:e}; } finally{ liberar(); } };
  // ouvintes virtuais: fazem o que a página de participação faz hoje
  const C=window.AKICAST_CONFIG;
  for(let i=0;i<N;i++){
    const L={dev:"carga-"+uid()+uid()+i,versao:-1,seen:new Set(),voted:new Set(),respondeu:false,t:null};
    LT.listeners.push(L);
    const loop=async()=>{
      clearTimeout(L.t); L.quando=0; L.ultima=Date.now();
      if(LT.done||LT.stopAt) return;
      const r=await call("placar",()=>A.from("int_placar").select("versao").eq("episode_id",epId).maybeSingle());
      const v=r.data?Number(r.data.versao):0;
      if(!r.error && v!==L.versao){
        L.versao=v;
        const lr=await call("lista",()=>A.from("int_perguntas").select("id,votos,status").eq("episode_id",epId).in("status",["aprovada","no_ar","respondida"]));
        if(!lr.error){ const now=Date.now();
          (lr.data||[]).forEach(q=>{ if(!L.seen.has(q.id)){ L.seen.add(q.id); if(LT.sentAt[q.id]) LT.arrive.push(now-LT.sentAt[q.id]); } });
          if(L.voted.size<V){ const cand=(lr.data||[]).filter(q=>!L.voted.has(q.id)&&q.status!=="respondida"); if(cand.length&&Math.random()<0.5){ const q=cand[Math.floor(Math.random()*cand.length)]; L.voted.add(q.id);
            const vr=await call("voto",()=>A.rpc("int_votar",{p_pergunta:q.id,p_aparelho:L.dev,p_votar:true})); if(vr.error) LT.voteErr++; else LT.votesOk++; } }
        }
      }
      // quiz aberto: cada ouvinte responde uma vez, alguns segundos depois de ver
      if(LT.quizId&&!L.respondeu){
        L.respondeu=true;
        const esp=1000+Math.random()*7000;
        LT.timers.push(setTimeout(async()=>{
          if(LT.done) return;
          LT.respChegou.push(Date.now()-LT.quizAt);
          const op="abcd"[Math.floor(Math.random()*4)];
          await vez(); const a1=performance.now();
          let rr; try{ rr=await A.rpc("int_responder",{p_atividade:LT.quizId,p_aparelho:L.dev,p_opcao:op}); }catch(e){ rr={error:e}; } finally{ liberar(); }
          const rm=rr.error&&(rr.error.message||String(rr.error));
          if(rr.error&&/check-?in|abre durante a live|faça o check/i.test(rm||"")) LT.respSemCk++;
          else { rec2("resposta",performance.now()-a1,!rr.error,rm); if(rr.error) LT.respErr++; else LT.respOk++; }
        },esp));
      }
      L.t=setTimeout(loop,6000+Math.random()*600-300);   // mesmo ritmo da página no dia da live
      L.quando=Date.now()+6000; LT.timers.push(L.t);
    };
    L.ultima=0; L.quando=0;
    L.agora=()=>{ // igual à página: no mínimo 2,5 s entre consultas e uma espera aleatória de até 1,5 s
      const espera=Math.max(150,2500-(Date.now()-L.ultima))+Math.random()*1500;
      if(L.quando&&L.quando<=Date.now()+espera) return;
      clearTimeout(L.t); L.t=setTimeout(loop,espera); L.quando=Date.now()+espera; LT.timers.push(L.t);
    };
    const entrar=async()=>{
      if(LT.done||LT.stopAt) return;
      await vez(); const a0=performance.now();
      let ck; try{ ck=await A.rpc("int_checkin",{p_episode:epId,p_aparelho:L.dev,p_nome:"Ouvinte "+(i+1)}); }catch(e){ ck={error:e}; } finally{ liberar(); }
      const ckMsg=ck.error&&(ck.error.message||String(ck.error));
      if(ck.error&&/abre durante a live|fora do hor|não está no ar|nao esta no ar/i.test(ckMsg||"")) LT.ckFechado++;   // regra do banco: check-in só com a live no ar
      else { rec2("checkin",performance.now()-a0,!ck.error,ckMsg); if(ck.error) LT.ckErr++; else LT.ckOk++; }
      if(RT){
        try{
          const cli=window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:"akicast-carga-"+i}});
          LT.clients.push(cli);
          const ch=cli.channel("carga-"+i+"-"+uid());
          ch.on("postgres_changes",{event:"*",schema:"public",table:"int_placar",filter:"episode_id=eq."+epId},()=>{ LT.rtAvisos++; L.agora(); })
            .on("postgres_changes",{event:"*",schema:"public",table:"int_atividades",filter:"episode_id=eq."+epId},()=>{ LT.rtAvisos++; L.agora(); })
            .subscribe(st=>{ if(st==="SUBSCRIBED"){ LT.rtOk++; } else if(st==="CHANNEL_ERROR"||st==="TIMED_OUT"){ LT.rtErr++; } });
        }catch(e){ LT.rtErr++; }
      }
      loop();
    };
    LT.timers.push(setTimeout(entrar,Math.random()*3000)); // entradas espalhadas, como pessoas abrindo o link
  }
  // quiz no meio do teste, aberto pela produção
  if(QZ){
    LT.timers.push(setTimeout(async()=>{
      if(LT.done||LT.stopAt) return;
      const qid=uuidv4(); let r=null;
      for(let tent=0;tent<3;tent++){
        try{
          r=await SB.from("int_atividades").upsert({id:qid,episode_id:epId,tipo:"quiz",grafico:"barras",pergunta:"[Teste de carga] Quiz",opcoes:[{id:"a",t:"A"},{id:"b",t:"B"},{id:"c",t:"C"},{id:"d",t:"D"}],correta:"a",explicacao:"",ordem:1});
          if(!r.error) r=await SB.rpc("int_atividade_estado",{p_atividade:qid,p_estado:"aberta"});
        }catch(e){ r={error:{message:String(e)}}; }
        if(!r.error) break;
        await new Promise(x=>setTimeout(x,1000));
      }
      if(r.error){ LT.quizErro=r.error.message||"erro"; return; }
      LT.quizId=qid; LT.quizAt=Date.now();
    },D*0.35));
  }
  // perguntas espalhadas nos primeiros 60% do tempo, cada uma de um ouvinte diferente
  for(let k=0;k<Q;k++){
    const at=Math.random()*D*0.6+1500, who=LT.listeners[k%N];
    LT.timers.push(setTimeout(async()=>{
      if(LT.done||LT.stopAt) return;
      const id=uuidv4(); LT.sentAt[id]=Date.now();
      const r=await call("envio",()=>A.from("int_perguntas").insert({id,episode_id:epId,texto:`[Teste de carga] Pergunta ${k+1} de ${Q}`,nome:"Ouvinte "+(k+1),aparelho:who.dev}));
      if(r.error){ LT.sendErr++; delete LT.sentAt[id]; } else LT.sent++;
    },at));
  }
  $("#ltStop").hidden=false; $("#ltProg").hidden=false;
  $("#ltLinks").innerHTML=`<p class="meta">Durante o teste, dá para acompanhar como produção: <a href="${esc(salaLink(epId))}" target="_blank" rel="noopener">abrir a sala de controle do teste</a> · <a href="${esc(listenLink(epId))}" target="_blank" rel="noopener">abrir como ouvinte</a></p>`;
  LT.ui=setInterval(async()=>{
    const el=Date.now()-t0;
    const now=Date.now(); LT.win=LT.win.filter(t=>now-t<5000); LT.peakRps=Math.max(LT.peakRps,LT.win.length/5);
    const bar=$("#ltProg"); if(bar) bar.querySelector("i").style.width=Math.min(100,el/D*100)+"%";
    const st=$("#ltState"); if(st) st.textContent=LT.stopAt?"Finalizando…":`Rodando: ${Math.floor(el/1000)} s de ${D/1000} s`;
    renderLoadStats();
    if((el>=D||LT.stopAt) && !LT.finishing){ LT.finishing=true; LT.stopAt=LT.stopAt||now; setTimeout(finishLoadTest,6000); }
  },1000);
}
async function finishLoadTest(){
  if(!LT||LT.done) return;
  LT.done=true; LT.timers.forEach(clearTimeout); clearInterval(LT.ui);
  // fecha as conexões em tempo real dos ouvintes simulados
  for(const cli of LT.clients){ try{ await cli.removeAllChannels(); }catch(e){} }
  // conferência do quiz: quantas respostas o banco contou
  if(LT.quizId){
    const q=await SB.rpc("int_quiz_resultado",{p_atividade:LT.quizId});
    LT.dbResp=q.error?null:(q.data&&q.data.total!=null?q.data.total:null);
    try{ await SB.rpc("int_atividade_estado",{p_atividade:LT.quizId,p_estado:"encerrada"}); }catch(e){}
  }
  // conferência final dos votos no banco
  const r=await SB.from("int_perguntas").select("votos").eq("episode_id",LT.epId);
  LT.dbVotes = r.error?null:(r.data||[]).reduce((a,q)=>a+(q.votos||0),0);
  LT.dbCount = r.error?null:(r.data||[]).length;
  LT.reach = LT.sent ? Math.round(LT.arrive.length/(LT.sent*LT.N)*100) : 0;
  renderLoadStats();
  const st=$("#ltState"); if(st) st.textContent="Apagando os dados do teste…";
  try{ await store.remove(LT.epId); if(st) st.textContent="Teste concluído. Os dados temporários foram apagados."; }
  catch(e){ if(st) st.textContent="Teste concluído. Apague o episódio \"Teste de carga\" manualmente na aba Episódios."; }
  const b=$("#ltStart"); if(b) b.disabled=false; const sp=$("#ltStop"); if(sp) sp.hidden=true; const pr=$("#ltProg"); if(pr) pr.hidden=true;
  const lk=$("#ltLinks"); if(lk) lk.innerHTML="";
}
function renderLoadStats(){
  const el=$("#ltStats"); if(!el||!LT) return;
  const secs=Math.max(1,((LT.stopAt||Date.now())-LT.start)/1000);
  const allLat=[].concat(LT.lat.placar,LT.lat.lista,LT.lat.envio,LT.lat.voto,LT.lat.checkin,LT.lat.resposta);
  const errRate=LT.req?LT.err/LT.req*100:0;
  const rtFalhou=LT.RT&&LT.rtOk<LT.N*0.95, ckFalhou=LT.ckErr>0, qzFalhou=LT.QZ&&(LT.quizErro||LT.respErr>0||(LT.dbResp!=null&&LT.dbResp!==LT.respOk));
  const ok = LT.done && errRate<1 && (pct(LT.arrive,0.95)||0)<8000 && LT.sendErr===0 && (LT.dbVotes==null||LT.dbVotes===LT.votesOk) && !rtFalhou && !ckFalhou && !qzFalhou;
  const verdict = !LT.done ? "" : ok
    ? `<div class="okmsg"><b>Aguentou bem.</b> ${LT.N} ouvintes ao mesmo tempo, ${LT.ckOk} check-ins, ${LT.sent} perguntas, ${LT.votesOk} votos${LT.QZ?` e ${LT.respOk} respostas de quiz`:""}, sem erros relevantes. As perguntas chegaram para 95% dos ouvintes em até ${fmtMs(pct(LT.arrive,0.95))}.</div>`
    : `<div class="warn"><b>Atenção:</b> ${rtFalhou?`Só ${LT.rtOk} de ${LT.N} ouvintes conectaram os avisos em tempo real (limite de conexões do plano?). `:""}${ckFalhou?`${LT.ckErr} check-ins falharam. `:""}${qzFalhou?"O quiz teve falhas ou a contagem no banco não bateu. ":""}${errRate>=1?`${errRate.toFixed(1).replace(".",",")}% das requisições falharam. `:""}${LT.sendErr?`${LT.sendErr} envios falharam. `:""}${(pct(LT.arrive,0.95)||0)>=8000?"Algumas perguntas demoraram mais de 8 s para aparecer. ":""}${LT.dbVotes!=null&&LT.dbVotes!==LT.votesOk?`O banco registrou ${LT.dbVotes} votos, e foram enviados ${LT.votesOk}. `:""}Veja os detalhes abaixo.</div>`;
  const errs=Object.entries(LT.errMsgs).sort((a,b)=>b[1]-a[1]).slice(0,4);
  el.innerHTML=`${verdict}
    <div class="lt-grid">
      <div class="lt-k"><span>Ouvintes simulados</span><b>${LT.N}</b></div>
      <div class="lt-k"><span>Perguntas enviadas</span><b>${LT.sent} de ${LT.Q}</b></div>
      <div class="lt-k"><span>Votos registrados</span><b>${LT.votesOk}</b></div>
      <div class="lt-k"><span>Requisições</span><b>${LT.req}</b><em>${(LT.req/secs).toFixed(1).replace(".",",")} por segundo, pico ${LT.peakRps.toFixed(1).replace(".",",")}</em></div>
      <div class="lt-k"><span>Falhas</span><b class="${LT.err?"bad-t":"ok-t"}">${LT.err}</b><em>${errRate.toFixed(1).replace(".",",")}% do total</em></div>
      <div class="lt-k"><span>Tempo de resposta</span><b>${fmtMs(pct(allLat,0.5))}</b><em>95% em até ${fmtMs(pct(allLat,0.95))}</em></div>
      <div class="lt-k"><span>Pergunta chega aos ouvintes</span><b>${fmtMs(pct(LT.arrive,0.5))}</b><em>95% em até ${fmtMs(pct(LT.arrive,0.95))}</em></div>
      <div class="lt-k"><span>Envio de pergunta</span><b>${fmtMs(pct(LT.lat.envio,0.5))}</b><em>mais lento: ${fmtMs(pct(LT.lat.envio,1))}</em></div>
      <div class="lt-k"><span>Voto</span><b>${fmtMs(pct(LT.lat.voto,0.5))}</b><em>mais lento: ${fmtMs(pct(LT.lat.voto,1))}</em></div>
      <div class="lt-k"><span>Check-ins</span>${LT.ckFechado&&!LT.ckOk?`<b>fechado</b><em>o check-in só abre com a live no ar; o teste seguiu sem ele</em>`:`<b class="${LT.ckErr?"bad-t":""}">${LT.ckOk} de ${LT.N}</b><em>mediana ${fmtMs(pct(LT.lat.checkin,0.5))}${LT.ckErr?` · ${LT.ckErr} falharam`:""}</em>`}</div>
      ${LT.RT?`<div class="lt-k"><span>Avisos em tempo real</span><b class="${rtFalhou&&LT.done?"bad-t":""}">${LT.rtOk} de ${LT.N} conectados</b><em>${LT.rtAvisos} avisos recebidos${LT.rtErr?` · ${LT.rtErr} conexões falharam`:""}</em></div>`:""}
      ${LT.QZ?`<div class="lt-k"><span>Quiz</span><b class="${qzFalhou&&LT.done?"bad-t":""}">${LT.quizErro?"não abriu":LT.quizId?(LT.respSemCk&&!LT.respOk?"sem check-in":`${LT.respOk} de ${LT.N} responderam`):"abre em breve"}</b><em>${LT.quizErro?esc(LT.quizErro):(LT.respSemCk&&!LT.respOk)?"responder exige check-in, que só abre com a live no ar":`resposta em ${fmtMs(pct(LT.lat.resposta,0.5))} · 95% em até ${fmtMs(pct(LT.lat.resposta,0.95))}${LT.done&&LT.dbResp!=null?` · o banco contou ${LT.dbResp}`:""}`}</em></div>`:""}
      ${LT.done?`<div class="lt-k"><span>Conferência no banco</span><b>${LT.dbCount??"–"} perguntas · ${LT.dbVotes??"–"} votos</b><em>${LT.reach}% das entregas esperadas</em></div>`:""}
    </div>
    ${errs.length?`<p class="meta" style="margin-top:10px"><b>Erros mais comuns:</b> ${errs.map(([m,n])=>esc(m)+" ("+n+")").join(" · ")}</p>`:""}
    <p class="meta lt-note">Todos os ouvintes simulados saem deste computador e desta internet. O resultado mostra o que o Supabase aguenta; a rede de cada ouvinte real pode variar.</p>`;
}

/* ---------- Perguntas não respondidas: texto pronto para o apresentador ---------- */
let unansRows=[], unansWithMeta=true;
async function loadUnanswered(epId){
  const card=$("#unansCard"); if(!card||!SB||!epId) return;
  const r=await SB.from("int_perguntas").select("id,texto,nome,votos,status,criada_em").eq("episode_id",epId).in("status",["nova","aprovada"]);
  if(selectedId!==epId) return;
  if(r.error){ card.hidden=true; return; }
  unansRows=(r.data||[]).sort((a,b)=>(b.votos-a.votos)||a.criada_em.localeCompare(b.criada_em));
  renderUnanswered();
}
function unansText(){
  const ep=currentEp()||{};
  const d=parseDate(ep.date), dia=d?d.getDate()+"/"+String(d.getMonth()+1).padStart(2,"0"):"";
  const head=`Perguntas não respondidas do ${PN()}${dia?" de "+dia:""}${ep.theme?" ("+ep.theme+")":""}`;
  const sub=`${unansRows.length} ${unansRows.length===1?"pergunta":"perguntas"}${unansWithMeta?", das mais votadas para as menos votadas":""}:`;
  const lines=unansRows.map((q,i)=>{
    let t=`${i+1}. ${q.texto}`;
    if(unansWithMeta) t+=`\n   ${q.nome?q.nome:"Anônimo"} · ${q.votos} ${q.votos===1?"voto":"votos"}`;
    return t;
  });
  return [head,sub,"",lines.join("\n\n")].join("\n");
}
function renderUnanswered(){
  const card=$("#unansCard"); if(!card) return;
  card.hidden=false;
  if(!unansRows.length){
    card.innerHTML=`<div class="hc-head"><h2 style="margin:0">Perguntas não respondidas</h2><button class="linkbtn" id="unansReload" type="button">Atualizar</button></div><p class="meta">Nenhuma pergunta ficou sem resposta neste episódio. Quando sobrar alguma ao fim da live, ela aparece aqui num texto pronto para enviar ao apresentador.</p>`;
  } else {
    card.innerHTML=`<div class="hc-head"><h2 style="margin:0">Perguntas não respondidas</h2><span class="mod-n">${unansRows.length}</span></div>
      <p class="meta">As perguntas que ficaram sem resposta na live, num texto pronto para copiar e mandar ao apresentador por e-mail, Teams ou WhatsApp.</p>
      <label class="unans-opt"><input type="checkbox" id="unansMeta" ${unansWithMeta?"checked":""}> Incluir nome de quem perguntou e votos</label>
      <textarea class="unans-text" id="unansText" readonly rows="${Math.min(14,4+unansRows.length*2)}"></textarea>
      <div class="pres-row"><button class="btn primary" id="unansCopy" type="button"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>Copiar texto</button><button class="linkbtn" id="unansReload" type="button">Atualizar lista</button></div>`;
    $("#unansText").value=unansText();
    $("#unansMeta").addEventListener("change",e=>{ unansWithMeta=e.target.checked; $("#unansText").value=unansText(); });
    $("#unansText").addEventListener("focus",e=>e.target.select());
    $("#unansCopy").addEventListener("click",async()=>{
      const b=$("#unansCopy"), t=$("#unansText");
      try{ await navigator.clipboard.writeText(t.value); toast("Texto copiado. É só colar na mensagem para o apresentador."); b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }
      catch(e){ t.focus(); t.select(); toast("Texto selecionado: use Ctrl+C para copiar."); }
    });
  }
  const rl=$("#unansReload"); if(rl) rl.addEventListener("click",()=>loadUnanswered(selectedId));
}

/* =================== AkiLearning · conteúdo básico =================== */
const AUD_SUGEST=["Todos","Comercial","Tecnologia","RH","Operações","Marketing","Financeiro"];
let audList=[], matList=[];
function parseList(s){ return String(s||"").split(",").map(x=>x.trim()).filter(Boolean); }
function parseMaterials(m){ if(Array.isArray(m)) return m.filter(x=>x&&x.u); try{ const a=JSON.parse(m||"[]"); return Array.isArray(a)?a.filter(x=>x&&x.u):[]; }catch(e){ return []; } }
function learnFieldsHtml(){
  return `<div class="field wide lrn-block">
      <span>Objetivos de aprendizagem</span>
      <textarea id="fObj" rows="3" maxlength="1500" placeholder="Um objetivo por linha. Ex.: Escrever um bom pedido para o Claude"></textarea>
      <small class="lrn-hint">Aparecem na página do público como "Ao final, você vai saber…".</small>
    </div>
    <div class="field wide lrn-block">
      <span id="audLbl">Para quem é</span>
      <div class="pres-add"><input id="fAud" type="text" maxlength="40" placeholder="Ex.: Comercial" aria-labelledby="audLbl" autocomplete="off"><button class="btn primary add-btn" id="audAdd" type="button" aria-label="Adicionar público"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div>
      <div class="aud-sug" id="audSug"></div>
      <ul class="chips" id="audChips" aria-label="Públicos"></ul>
    </div>
    <div class="field wide lrn-block">
      <span>Materiais de apoio</span>
      <small class="lrn-hint">Links para slides, documentos, planilhas ou pastas (Drive, SharePoint, Notion…). Aparecem na página do público depois da live.</small>
      <div class="mat-list" id="matList"></div>
      <button class="btn ghost sm" id="matAdd" type="button">Adicionar material</button>
    </div>`;
}
function renderAud(){
  const ul=$("#audChips"), sg=$("#audSug"); if(!ul) return;
  ul.innerHTML=audList.map((n,i)=>`<li class="chip"><span>${esc(n)}</span><button type="button" data-aud-rm="${i}" aria-label="Remover ${esc(n)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join("");
  sg.innerHTML=AUD_SUGEST.filter(x=>!audList.some(a=>a.toLowerCase()===x.toLowerCase())).map(x=>`<button type="button" class="sug" data-aud-add="${esc(x)}">+ ${esc(x)}</button>`).join("");
  ul.querySelectorAll("[data-aud-rm]").forEach(b=>b.addEventListener("click",()=>{ audList.splice(+b.dataset.audRm,1); saveAud(); }));
  sg.querySelectorAll("[data-aud-add]").forEach(b=>b.addEventListener("click",()=>{ audList.push(b.dataset.audAdd); saveAud(); }));
}
function saveAud(){ renderAud(); const id=selectedId; queueWrite(()=>store.update(id,{audience:audList.join(", ")})); }
function renderMat(){
  const box=$("#matList"); if(!box) return;
  box.innerHTML=matList.length?matList.map((m,i)=>`<div class="mat-row">
      <input data-mt="t" data-i="${i}" value="${esc(m.t||"")}" placeholder="Nome (ex.: Slides da apresentação)" maxlength="80" aria-label="Nome do material">
      <input data-mt="u" data-i="${i}" value="${esc(m.u||"")}" placeholder="https://…" maxlength="500" inputmode="url" aria-label="Link do material">
      <button class="icon-btn" data-mat-rm="${i}" type="button" aria-label="Remover material"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>`).join(""):'<p class="meta" style="margin:4px 0">Nenhum material ainda.</p>';
  box.querySelectorAll("[data-mt]").forEach(inp=>inp.addEventListener("input",()=>{ matList[inp.dataset.i][inp.dataset.mt]=inp.value; matDirty=true; saveMatSoon(); }));
  box.querySelectorAll("[data-mat-rm]").forEach(b=>b.addEventListener("click",()=>{ matList.splice(+b.dataset.matRm,1); renderMat(); saveMatNow(); }));
}
let matT=null, matDirty=false;
function cleanMats(){ return matList.map(m=>({t:(m.t||"").trim(),u:normUrl(m.u)||""})).filter(m=>m.u); }
function saveMatSoon(){ clearTimeout(matT); matT=setTimeout(saveMatNow,700); }
function saveMatNow(){ clearTimeout(matT); matDirty=false; const id=selectedId, mats=cleanMats(); queueWrite(()=>store.update(id,{materials:mats})); }
function wireLearnFields(){
  matDirty=false; clearTimeout(matT);
  if(!$("#fObj")) return;
  $("#fObj").addEventListener("input",e=>debouncedUpdate("objectives",e.target.value));
  const addAud=()=>{ const inp=$("#fAud"); const v=inp.value.trim(); if(!v) return; if(!audList.some(a=>a.toLowerCase()===v.toLowerCase())) audList.push(v); inp.value=""; inp.focus(); saveAud(); };
  $("#audAdd").addEventListener("click",addAud);
  $("#fAud").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); addAud(); } });
  $("#matAdd").addEventListener("click",()=>{ matList.push({t:"",u:""}); renderMat(); const l=[...document.querySelectorAll('#matList input[data-mt="t"]')].pop(); if(l) l.focus(); });
}
function updateLearnFields(ep){
  if(!$("#fObj")) return;
  setVal($("#fObj"),ep.objectives);
  if(document.activeElement!==$("#fAud")){ audList=parseList(ep.audience); renderAud(); }
  if(!matDirty && !$("#matList").contains(document.activeElement)){ matList=parseMaterials(ep.materials).map(m=>({...m})); renderMat(); }
}

/* ---------- Página do público no AkiLearning ---------- */
function liveEnded(ep){ const d=parseDate(ep.date); if(!d) return false; const end=new Date(d); end.setHours(10,0,0,0); return new Date()>=end; }
function objectivesHtml(ep){
  const objs=String(ep.objectives||"").split("\n").map(x=>x.replace(/^[-•*\s]+/,"").trim()).filter(Boolean);
  if(!objs.length) return "";
  return `<div class="pres-card lrn-obj"><h2>Ao final, você vai saber</h2><ul class="obj-list">${objs.map(o=>`<li><span class="obj-ic" aria-hidden="true">✓</span>${esc(o)}</li>`).join("")}</ul></div>`;
}
function audienceHtml(ep){
  const a=parseList(ep.audience); if(!a.length) return "";
  return `<div class="aud-line"><span class="meta">Para quem é:</span>${a.map(x=>`<span class="chip sm">${esc(x)}</span>`).join("")}</div>`;
}
function materialsHtml(ep){
  const mats=parseMaterials(ep.materials);
  return `<div class="pres-card lrn-mat"><h2>Materiais de apoio</h2>${mats.length?`<ul class="mat-links">${mats.map(m=>`<li><a href="${esc(m.u)}" target="_blank" rel="noopener"><span class="mat-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg></span><span>${esc(m.t||m.u)}</span><span class="mat-go" aria-hidden="true">↗</span></a></li>`).join("")}</ul>`:'<p class="meta">O apresentador ainda não adicionou materiais.</p>'}</div>`;
}
function renderListenAfter(){
  const ep=listenEp, v=$("#listenView");
  const yt=normUrl(ep.youtube_url);
  v.innerHTML=`<div class="listen">
      <div class="listen-head">
        <div class="hc-label">${esc(PN())} de ${esc(fmtLong(ep.date).toLowerCase())} · já aconteceu</div>
        <h1>${esc(ep.theme||"Episódio")}</h1>
        ${audienceHtml(ep)}
        <p class="meta">Este episódio já aconteceu. Reveja a gravação, os objetivos e os materiais quando quiser.</p>
      </div>
      <div class="listen-grid">
        <div class="lg-left">
          <div class="pres-card lrn-rec">
            <h2>Gravação</h2>
            ${yt?`<p class="meta">A live ficou gravada no YouTube.</p><a class="btn primary big rec-btn" href="${esc(yt)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>Assistir à gravação</a>`:'<p class="meta">O link da gravação ainda não foi adicionado. Volte em breve.</p>'}
          </div>
          ${objectivesHtml(ep)}
          ${materialsHtml(ep)}
          <div id="lsQuizReview"></div>
        </div>
        <div class="lg-right">
          <div class="pres-card lg-done" id="lsDoneBox">
            <h2>Perguntas respondidas na live</h2>
            <ul class="done-list" id="lsDone"><li class="meta">Carregando…</li></ul>
          </div>
          <div class="pres-card lg-mine">
            <h2>Suas perguntas</h2>
            <ul class="minhas" id="lsMinhas"><li class="meta">As perguntas que você enviou aparecem aqui.</li></ul>
          </div>
          <div class="pres-card" id="lsVotesBox" hidden><ul id="lsVotes"></ul></div>
        </div>
      </div>
    </div>`;
}

/* =================== AkiLearning · Quiz de fixação =================== */
const QZ_LETTERS="ABCDE";
function qzOpts(a){ return Array.isArray(a&&a.opcoes)?a.opcoes:[]; }
/* ---------- Visual do quiz no OBS (também usado nas prévias) ---------- */
/* ---------- Gráficos de quiz e votação ---------- */
var CHART_COLORS=CHART_COLORS_BASE;
const ATIV_NOME={quiz:"Quiz",enquete:"Votação"};
function tipoNome(a){ return ATIV_NOME[(a&&a.tipo)||"quiz"]||"Quiz"; }
function pieSvg(opts,pct,okId,size){
  let acc=0;
  const slices=opts.map((o,i)=>{ const p=Math.max(0,Math.min(100,pct[o.id]||0)); const off=25-acc; acc+=p;
    return `<circle class="pie-s${okId&&okId!==o.id?" dim":""}" data-oid="${esc(o.id)}" cx="21" cy="21" r="15.915" fill="transparent" stroke="${CHART_COLORS[i%CHART_COLORS.length]}" stroke-width="7.5" pathLength="100" stroke-dasharray="${p} ${100-p}" stroke-dashoffset="${off}"></circle>`; }).join("");
  return `<svg class="pie" viewBox="0 0 42 42" width="${size}" height="${size}" aria-hidden="true"><circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#E6EAF2" stroke-width="7.5"></circle>${slices}</svg>`;
}
function patchPie(root,opts,pct){
  let acc=0;
  opts.forEach(o=>{ const c=root.querySelector(`.pie-s[data-oid="${o.id}"]`); if(!c) return; const p=Math.max(0,Math.min(100,pct[o.id]||0)); c.setAttribute("stroke-dasharray",`${p} ${100-p}`); c.setAttribute("stroke-dashoffset",String(25-acc)); acc+=p; });
}
function quizInner(a,res){
  if(!a) return "";
  const opts=qzOpts(a), done=a.estado==="encerrada", pct=(res&&res.pct)||{}, enq=a.tipo==="enquete", cor=!enq&&done?(res&&res.correta):null;
  const show=done||!!(res&&res.pct), pie=a.grafico==="pizza";
  const title=done?(enq?"Resultado da votação":"Resultado do quiz"):(enq?"Votação":"Quiz");
  const foot=done?(!enq&&res&&res.explicacao?esc(res.explicacao):"Obrigado por participar!"):(enq?"Vote pela plataforma":"Responda pela plataforma");
  const head=`<div class="ovd-stripe"></div><div class="ovd-top"><img src="${esc(PG().logo||AKICAST_LOGO_SRC||"img/akicast-logo.png")}" alt=""><span>${title}</span></div><p class="ovq-q">${esc(a.pergunta)}</p>`;
  if(pie){
    return `<div class="ovq ovq-pie-mode"><div class="ovq-card">${head}
      <div class="ovq-pie">
        <div class="ovq-pie-chart">${pieSvg(opts,show?pct:{},cor,360)}</div>
        <ul class="ovq-legend">${opts.map((o,i)=>{ const p=pct[o.id]||0, ok=cor===o.id;
          return `<li class="${done&&cor?(ok?"ok":"no"):""}" data-oid="${esc(o.id)}"><i style="background:${CHART_COLORS[i%CHART_COLORS.length]}"></i><b>${QZ_LETTERS[i]||"•"}</b><span>${esc(o.t)}</span>${show?`<em>${p}%</em>`:""}${ok?'<strong aria-hidden="true">✓</strong>':""}</li>`; }).join("")}</ul>
      </div>
      <p class="ovq-foot">${foot}</p></div></div>`;
  }
  return `<div class="ovq"><div class="ovq-card">${head}
    <ul class="ovq-opts">${opts.map((o,i)=>{ const p=pct[o.id]||0, ok=cor===o.id;
      return `<li class="${done&&cor?(ok?"ok":"no"):""}" data-oid="${esc(o.id)}" style="--oc:${CHART_COLORS[i%CHART_COLORS.length]}">
        ${show?`<i class="ovq-bar" style="width:${p}%"></i>`:""}
        <b>${QZ_LETTERS[i]||"•"}</b><span>${esc(o.t)}</span>${show?`<em>${p}%</em>`:""}${ok?'<strong aria-hidden="true">✓</strong>':""}
      </li>`; }).join("")}</ul>
    <p class="ovq-foot">${foot}</p>
  </div></div>`;
}
function quizFaixaInner(a,res){
  if(!a) return "";
  const opts=qzOpts(a), done=a.estado==="encerrada", pct=(res&&res.pct)||{}, enq=a.tipo==="enquete", cor=!enq&&done?(res&&res.correta):null, show=done||!!(res&&res.pct);
  const tag=done?(enq?"Resultado":"Resposta"):(enq?"Votação":"Quiz");
  return `<div class="ovqf">
    <div class="ovf-tag"><img src="${esc(PG().logo||AKICAST_LOGO_SRC||"img/akicast-logo.png")}" alt=""><span>${tag}</span></div>
    <div class="ovqf-body">
      <p class="ovqf-q">${esc(a.pergunta)}${done?"":`<small>${enq?"Vote pela plataforma":"Responda pela plataforma"}</small>`}</p>
      <ul class="ovq-opts ovqf-opts" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))">${opts.map((o,i)=>{ const p=pct[o.id]||0, ok=cor===o.id;
        return `<li class="${done&&cor?(ok?"ok":"no"):""}" data-oid="${esc(o.id)}" style="--oc:${CHART_COLORS[i%CHART_COLORS.length]}">${show?`<i class="ovq-bar" style="width:${p}%"></i>`:""}<b>${QZ_LETTERS[i]||"•"}</b><span>${esc(o.t)}</span>${show?`<em>${p}%</em>`:""}${ok?'<strong aria-hidden="true">✓</strong>':""}</li>`; }).join("")}</ul>
    </div>
  </div>`;
}
/* ---------- Ouvinte ---------- */
let qzActsLoaded=false, qzActs=[], qzRes={}, qzMine={}, qzSig="";
const qzMineKey=ep=>"akicast-quiz-"+ep;
function loadMineLocal(ep){ try{ return JSON.parse(lsGet(qzMineKey(ep))||"{}"); }catch(e){ return {}; } }
async function loadListenQuiz(){
  if(!listenEp) return;
  let r=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,aberta_em,encerrada_em,ordem,tipo,grafico").eq("episode_id",listenEp.id).in("estado",["aberta","encerrada"]);
  if(r.error && /tipo|grafico/.test(r.error.message||"")) r=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,aberta_em,encerrada_em,ordem").eq("episode_id",listenEp.id).in("estado",["aberta","encerrada"]);
  if(r.error){ qzActs=[]; renderListenQuiz(); return; }
  qzActs=(r.data||[]).sort((x,y)=>String(y.aberta_em||"").localeCompare(String(x.aberta_em||""))); qzActsLoaded=true;
  qzMine=loadMineLocal(listenEp.id);
  for(const openA of qzActs.filter(a=>a.estado==="aberta" && !qzMine[a.id])){
    const m=await SB.rpc("int_minha_resposta",{p_atividade:openA.id,p_aparelho:meuAparelho()});
    if(m.data){ qzMine[openA.id]=m.data; lsSet(qzMineKey(listenEp.id),JSON.stringify(qzMine)); }
  }
  await Promise.all(qzActs.filter(a=>a.estado==="encerrada").map(async a=>{ if(!qzRes[a.id]){ const rr=await SB.rpc("int_quiz_resultado",{p_atividade:a.id}); if(!rr.error) qzRes[a.id]=rr.data; } }));
  qzActs.filter(a=>a.estado!=="encerrada").forEach(a=>{ delete qzRes[a.id]; });
  renderListenQuiz();
  const hist=$("#lsQuizHist");
  if(hist && qzActs.some(a=>a.estado==="encerrada")){ quizReviewHtml(listenEp).then(h=>{ const el=$("#lsQuizHist"); if(el) el.innerHTML=h.replace("Quiz da sessão","Encerrados"); }); }
}
function quizResultList(a,res,mine){
  const opts=qzOpts(a), pct=(res&&res.pct)||{}, cor=res&&res.correta;
  return `<ul class="lq-res">${opts.map((o,i)=>{ const p=pct[o.id]||0, ok=cor===o.id, me=mine===o.id;
    return `<li class="${ok?"ok":""}${me?" me":""}" style="--oc:${CHART_COLORS[i%CHART_COLORS.length]}"><i style="width:${p}%"></i><b>${QZ_LETTERS[i]}</b><span>${esc(o.t)}${me?` <small>${ok?"sua resposta ✓":(a.tipo==="enquete"?"sua escolha":"sua resposta")}</small>`:""}</span><em>${p}%</em></li>`; }).join("")}</ul>
    ${res&&res.explicacao?`<p class="lq-exp">${esc(res.explicacao)}</p>`:""}`;
}
// Quantidade de votos (só a equipe recebe; o público continua vendo só porcentagem)
const votosTxt=n=>`${n} ${n===1?"voto":"votos"}`;
function qtdDe(res,id){ return res&&res.qtd&&res.qtd[id]!=null?res.qtd[id]:null; }
function totalLinha(res){ return res&&res.total!=null?`<p class="meta qv-total">Total: <b>${votosTxt(res.total)}</b></p>`:""; }
function qzCardOpen(a){
  const mine=qzMine[a.id];
  return `<div class="lq-item open${mine?" done-me":""}" data-qitem="${esc(a.id)}">
    <div class="lq-head">${a._n?`<span class="lq-num">${a._n}</span>`:""}<span class="lq-tag">${a.tipo==="enquete"?tipoNome(a)+" aberta":tipoNome(a)+" aberto"}</span>${mine?'<span class="lq-ok">✓ Respondido</span>':""}<h2>${esc(a.pergunta)}</h2></div>
    <div class="lq-opts${mine?" locked":""}">${qzOpts(a).map((o,i)=>`<button type="button" class="lq-opt${mine===o.id?" sel":""}" data-qz="${esc(o.id)}" data-qa="${esc(a.id)}" ${mine?"disabled":""}><b>${QZ_LETTERS[i]}</b><span>${esc(o.t)}</span>${mine===o.id?'<i class="lq-check" aria-hidden="true">✓</i>':""}</button>`).join("")}</div>
    <p class="meta lq-note">${mine?`${a.tipo==="enquete"?"Voto registrado":"Resposta registrada"}. O resultado aparece em porcentagem quando a produção encerrar.`:"Toque na alternativa. Você vai confirmar antes de enviar, e não dá para trocar depois."}</p>
  </div>`;
}
function renderListenQuiz(){
  const box=$("#lsQuiz"); if(!box) return;
  setTimeout(()=>{ if(typeof renderNow==="function") renderNow(); },0);
  const opens=qzActs.filter(a=>a.estado==="aberta").sort((x,y)=>(x.ordem||0)-(y.ordem||0)||String(x.aberta_em||"").localeCompare(String(y.aberta_em||"")));
  const last=qzActs.find(a=>a.estado==="encerrada");
  const sig=JSON.stringify([opens.map(a=>[a.id,qzMine[a.id]]),last&&last.id,last&&qzMine[last.id],last&&qzRes[last.id]]);
  if(sig===qzSig && box.dataset.ok) return; qzSig=sig; box.dataset.ok="1";
  if(!opens.length && !last){ box.hidden=true; box.innerHTML=""; return; }
  box.hidden=false;
  if(opens.length){
    const faltam=opens.filter(a=>!qzMine[a.id]).length;
    opens.forEach((a,k)=>a._n=opens.length>1?k+1:null);
    box.innerHTML=(opens.length>1?`<div class="lq-multi-h"><b>${opens.length} abertos para responder</b><span class="meta">${faltam?`Faltam ${faltam}`:"Você respondeu todos ✓"}</span></div>`:"")+opens.map(qzCardOpen).join("");
    box.querySelectorAll("[data-qz]").forEach(b=>b.addEventListener("click",()=>{ const a=opens.find(x=>x.id===b.dataset.qa); if(a) ensurePart(()=>confirmQuiz(a,b.dataset.qz)); }));
    return;
  }
  const mine=qzMine[last.id], res=qzRes[last.id];
  box.innerHTML=`<div class="lq-item"><div class="lq-head"><span class="lq-tag done">Resultado ${last.tipo==="enquete"?"da votação":"do quiz"}</span><h2>${esc(last.pergunta)}</h2></div>
    ${res?quizResultList(last,res,mine):'<p class="meta">Carregando resultado…</p>'}
    ${!mine?`<p class="meta lq-note">Você não participou ${last.tipo==="enquete"?"desta votação":"deste quiz"}.</p>`:""}</div>`;
}
function confirmQuiz(a,opt){
  const opts=qzOpts(a), i=opts.findIndex(o=>o.id===opt); if(i<0) return;
  const old=document.getElementById("lqConfirm"); if(old) old.remove();
  const ov=document.createElement("div"); ov.id="lqConfirm"; ov.className="lq-confirm-ov";
  ov.innerHTML=`<div class="lq-confirm" role="dialog" aria-modal="true" aria-labelledby="lqcT">
    <h2 id="lqcT">${a.tipo==="enquete"?"Confirmar seu voto?":"Confirmar sua resposta?"}</h2>
    <div class="lq-cf-opt"><b>${QZ_LETTERS[i]}</b><span>${esc(opts[i].t)}</span></div>
    <p class="meta">Depois de confirmar, não dá para trocar.</p>
    <button class="btn primary big" type="button" id="lqcOk">Confirmar</button>
    <button class="btn ghost" type="button" id="lqcBack">Voltar</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.addEventListener("click",e=>{ if(e.target===ov) close(); });
  document.getElementById("lqcBack").addEventListener("click",close);
  document.getElementById("lqcOk").addEventListener("click",()=>{ close(); answerQuiz(a.id,opt); });
  setTimeout(()=>{ const b=document.getElementById("lqcOk"); if(b) b.focus(); },30);
}
async function answerQuiz(id,opt,btn){
  const prev=qzMine[id];
  qzMine[id]=opt; lsSet(qzMineKey(listenEp.id),JSON.stringify(qzMine)); qzSig=""; renderListenQuiz();
  const r=await SB.rpc("int_responder",{p_atividade:id,p_aparelho:meuAparelho(),p_opcao:opt});
  if(r.error){
    if(/já respondeu/i.test(r.error.message||"")){
      const m=await SB.rpc("int_minha_resposta",{p_atividade:id,p_aparelho:meuAparelho()});
      if(m.data) qzMine[id]=m.data; lsSet(qzMineKey(listenEp.id),JSON.stringify(qzMine)); qzSig=""; renderListenQuiz();
      toast("Você já tinha respondido. Sua primeira resposta foi mantida."); return;
    }
    if(prev) qzMine[id]=prev; else delete qzMine[id]; lsSet(qzMineKey(listenEp.id),JSON.stringify(qzMine)); qzSig=""; renderListenQuiz();
    toast(/não está aberto/i.test(r.error.message)?"Este quiz já foi encerrado.":"Não foi possível registrar sua resposta."); loadListenQuiz(); return; }
  toast("Resposta registrada!");
}
async function quizReviewHtml(ep){
  const r=await SB.from("int_atividades").select("id,pergunta,opcoes,estado,ordem,aberta_em").eq("episode_id",ep.id).eq("estado","encerrada");
  if(r.error||!(r.data||[]).length) return "";
  const mine=loadMineLocal(ep.id);
  const acts=(r.data||[]).sort((x,y)=>(x.ordem-y.ordem)||String(x.aberta_em||"").localeCompare(String(y.aberta_em||"")));
  const res=await Promise.all(acts.map(a=>SB.rpc("int_quiz_resultado",{p_atividade:a.id}).then(x=>x.data)));
  return `<div class="pres-card lrn-quiz"><h2>Quiz da sessão</h2>${acts.map((a,i)=>`<div class="lq-rev"><p class="lq-rev-q"><b>${i+1}.</b> ${esc(a.pergunta)}</p>${quizResultList(a,res[i],mine[a.id])}</div>`).join("")}</div>`;
}
/* ---------- Episódio: criar e editar o quiz ---------- */
let qeRows=[], qeEp=null, qeOff=false;
async function loadQuizEditor(epId){
  const box=$("#quizCard"); if(!box) return;
  qeEp=epId;
  if(!SB){ box.hidden=true; return; }
  box.hidden=false;
  if(!SESSION||SESSION.papel!=="admin"){ box.innerHTML=`<div class="hc-head"><h2 style="margin:0">Quiz de fixação</h2></div><p class="meta">Entre com um login da produção para criar as perguntas do quiz.</p><button class="btn primary sm" id="qeLogin" type="button">Entrar</button>`; $("#qeLogin").addEventListener("click",openLogin); return; }
  const r=await SB.from("int_atividades").select("*").eq("episode_id",epId).order("ordem",{ascending:true});
  if(selectedId!==epId) return;
  if(r.error){ qeOff=true; box.innerHTML=`<div class="hc-head"><h2 style="margin:0">Quiz de fixação</h2></div><div class="warn">Para usar o quiz, rode o arquivo int-learning-quiz.sql no Supabase.</div>`; return; }
  // Mantém o que ainda não foi salvo (rascunhos novos e edições), mesmo se a tela recarregar
  const pend=new Map();
  (qeEp===epId?qeRows:[]).filter(x=>!x.id||x._dirty).forEach(x=>pend.set(x.id||x._k,x));
  qeLoadDraft(epId).forEach(x=>{ const k=x.id||x._k; if(!pend.has(k)) pend.set(k,x); });
  const server=(r.data||[]).map(a=>{ const loc=pend.get(a.id); if(loc && a.estado==="rascunho"){ pend.delete(a.id); return loc; } pend.delete(a.id); return {...a,opcoes:qzOpts(a).map(o=>({...o}))}; });
  const novos=[...pend.values()].filter(x=>!x.id);
  qeRows=server.concat(novos);
  qeSaveDraft();
  renderQuizEditor();
}
const qeDraftKey=ep=>"akicast-quiz-rascunho-"+ep;
function qeLoadDraft(ep){ try{ const a=JSON.parse(lsGet(qeDraftKey(ep))||"[]"); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function qeSaveDraft(){ if(!qeEp) return; const keep=qeRows.filter(x=>!x.id||x._dirty); if(keep.length) lsSet(qeDraftKey(qeEp),JSON.stringify(keep)); else lsSet(qeDraftKey(qeEp),""); }
function qeTouch(i){ const r=qeRows[i]; if(r){ r._dirty=true; if(!r.id&&!r._k) r._k=uuidv4(); } qeSaveDraft(); }
const QE_ST={rascunho:["Rascunho","st-nova"],aberta:["Aberto para o público","st-no_ar"],encerrada:["Encerrado","st-respondida"]};
function renderQuizEditor(){
  const box=$("#quizCard"); if(!box) return;
  box.innerHTML=`<div class="hc-head"><h2 style="margin:0">Quiz e votações</h2><span class="mod-n">${qeRows.length}</span></div>
    <p class="meta">Prepare antes da live. <b>Quiz</b> tem uma resposta certa, revelada ao encerrar. <b>Votação</b> não tem resposta certa: é só para saber a opinião do público. Durante a transmissão, a produção abre cada uma pela sala de controle, e o público vê só porcentagens.</p>
    <div class="qe-list">${qeRows.map((a,qi)=>{ const st=QE_ST[a.estado]||QE_ST.rascunho, lock=a.estado!=="rascunho";
      return `<div class="qe-item" data-qi="${qi}">
        <div class="qe-top"><b>${a.tipo==="enquete"?"Votação":"Quiz"} ${qi+1}</b><span class="st-badge ${st[1]}">${st[0]}</span>${a.criado_por?`<span class="st-badge st-pedido">Criado por ${esc(a.criado_por)}</span>`:""}</div>
        ${lock?"":`<div class="qe-row">${ativTipoSeg(a.tipo,`data-qe="tipo" data-qi="${qi}"`)}${ativGrafSeg(a.grafico,`data-qe="graf" data-qi="${qi}"`)}</div>`}
        <input class="qe-q" data-qi="${qi}" value="${esc(a.pergunta)}" maxlength="300" placeholder="Ex.: Qual é o melhor jeito de pedir um resumo ao Claude?" ${lock?"disabled":""}>
        <div class="qe-opts">${a.opcoes.map((o,oi)=>`<label class="qe-opt${a.tipo!=="enquete"&&a.correta===o.id?" cor":""}">
            ${a.tipo==="enquete"?"":`<input type="radio" name="qe-cor-${qi}" data-qi="${qi}" data-oid="${esc(o.id)}" ${a.correta===o.id?"checked":""} ${lock?"disabled":""} aria-label="Marcar como certa">`}
            <b>${QZ_LETTERS[oi]}</b>
            <input class="qe-ot" data-qi="${qi}" data-oi="${oi}" value="${esc(o.t)}" maxlength="120" placeholder="Alternativa ${QZ_LETTERS[oi]}" ${lock?"disabled":""}>
            ${!lock&&a.opcoes.length>2?`<button class="icon-btn" type="button" data-qe="rmopt" data-qi="${qi}" data-oi="${oi}" aria-label="Remover alternativa"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`:""}
          </label>`).join("")}
          ${!lock&&a.opcoes.length<5?`<button class="linkbtn" type="button" data-qe="addopt" data-qi="${qi}">+ Adicionar alternativa</button>`:""}
        </div>
        ${a.tipo==="enquete"?'<p class="meta qe-cor-hint">Votação: não tem resposta certa.</p>':`<p class="meta qe-cor-hint">${a.correta?"A bolinha marcada é a resposta certa.":"Marque a bolinha da resposta certa."}</p>
        <input class="qe-exp" data-qi="${qi}" value="${esc(a.explicacao||"")}" maxlength="300" placeholder="Explicação curta que aparece com o resultado (opcional)" ${lock?"disabled":""}>`}
        <div class="qe-acts">${lock?`<span class="meta">Para editar, volte para rascunho na sala de controle.</span>`:`<button class="btn primary sm" type="button" data-qe="save" data-qi="${qi}">Salvar pergunta</button>`}<button class="linkbtn ed-rm" type="button" data-qe="del" data-qi="${qi}">Excluir</button></div>
      </div>`; }).join("")}</div>
    <button class="btn ghost" id="qeAdd" type="button">Adicionar quiz ou votação</button>`;
  box.querySelectorAll(".qe-q").forEach(i=>i.addEventListener("input",()=>{ qeRows[i.dataset.qi].pergunta=i.value; qeTouch(i.dataset.qi); }));
  box.querySelectorAll(".qe-ot").forEach(i=>i.addEventListener("input",()=>{ qeRows[i.dataset.qi].opcoes[i.dataset.oi].t=i.value; qeTouch(i.dataset.qi); }));
  box.querySelectorAll(".qe-exp").forEach(i=>i.addEventListener("input",()=>{ qeRows[i.dataset.qi].explicacao=i.value; qeTouch(i.dataset.qi); }));
  box.querySelectorAll('input[type="radio"][data-oid]').forEach(i=>i.addEventListener("change",()=>{ qeRows[i.dataset.qi].correta=i.dataset.oid; qeTouch(i.dataset.qi); renderQuizEditor(); }));
  box.querySelectorAll("[data-qe]").forEach(b=>b.addEventListener("click",()=>quizEditAction(b.dataset.qe,+b.dataset.qi,+b.dataset.oi,b)));
  $("#qeAdd").addEventListener("click",()=>{ qeRows.push({id:null,_k:uuidv4(),_dirty:true,episode_id:qeEp,tipo:"quiz",grafico:"barras",pergunta:"",opcoes:[{id:"a",t:""},{id:"b",t:""},{id:"c",t:""}],correta:null,explicacao:"",estado:"rascunho",ordem:(qeRows.length+1)*10}); qeSaveDraft(); renderQuizEditor(); const l=[...document.querySelectorAll(".qe-q")].pop(); if(l) l.focus(); });
}
async function quizEditAction(act,qi,oi,btn){
  const a=qeRows[qi]; if(!a) return;
  if(act==="tipo"){ a.tipo=btn.dataset.v; qeTouch(qi); renderQuizEditor(); return; }
  if(act==="graf"){ a.grafico=btn.dataset.v; qeTouch(qi); renderQuizEditor(); return; }
  if(act==="addopt"||act==="rmopt") qeTouch(qi);
  if(act==="addopt"){ const used=new Set(a.opcoes.map(o=>o.id)); const id="abcdefgh".split("").find(c=>!used.has(c)); a.opcoes.push({id,t:""}); renderQuizEditor(); return; }
  if(act==="rmopt"){ const rm=a.opcoes.splice(oi,1)[0]; if(a.correta===rm.id) a.correta=null; renderQuizEditor(); return; }
  if(act==="del"){
    if(!a.id){ qeRows.splice(qi,1); qeSaveDraft(); renderQuizEditor(); return; }
    if(!confirmInline(btn,"Excluir de vez?")) return;
    const {error}=await SB.from("int_atividades").delete().eq("id",a.id);
    if(error){ toast("Não foi possível excluir."); return; }
    toast("Pergunta do quiz excluída."); loadQuizEditor(qeEp); return;
  }
  if(act==="save"){
    const q=(a.pergunta||"").trim(), opts=a.opcoes.map(o=>({id:o.id,t:(o.t||"").trim()})).filter(o=>o.t);
    const enq=a.tipo==="enquete";
    if(q.length<3){ toast("Escreva a pergunta."); return; }
    if(opts.length<2){ toast("Preencha pelo menos 2 alternativas."); return; }
    if(!enq&&(!a.correta||!opts.find(o=>o.id===a.correta))){ toast("Marque qual alternativa é a certa."); return; }
    btn.disabled=true;
    const row={episode_id:qeEp,tipo:enq?"enquete":"quiz",grafico:a.grafico||"barras",pergunta:q,opcoes:opts,correta:enq?null:a.correta,explicacao:enq?"":(a.explicacao||"").trim(),ordem:a.ordem||(qi+1)*10};
    const r = a.id ? await SB.from("int_atividades").update(row).eq("id",a.id) : await SB.from("int_atividades").insert(row);
    btn.disabled=false;
    if(r.error){ toast("Não foi possível salvar: "+(r.error.message||"")); return; }
    if(a.id){ a._dirty=false; } else { qeRows.splice(qi,1); }
    qeSaveDraft();
    toast(enq?"Votação salva.":"Quiz salvo."); loadQuizEditor(qeEp);
  }
}
/* ---------- Sala de controle: conduzir o quiz ---------- */
let sqActs=[], sqARes={}, sqKnown=null, sqTab=(["quiz","rank","sort"].includes(lsGet("akicast-sala-tab"))?(lsGet("akicast-sala-tab")==="sort"?"rank":lsGet("akicast-sala-tab")):"perg");
async function loadSalaQuiz(){
  if(!sqEp||!SESSION||SESSION.papel!=="admin"){ sqActs=[]; return; }
  const r=await SB.from("int_atividades").select("*").eq("episode_id",sqEp).order("ordem",{ascending:true});
  if(r.error){ sqActs=null; return; }
  const fresh=(r.data||[]).filter(a=>a.criado_por && sqKnown && !sqKnown.has(a.id));
  sqKnown=new Set((r.data||[]).map(a=>a.id));
  if(fresh.length) toast(fresh.length===1?`${fresh[0].criado_por} criou ${fresh[0].tipo==="enquete"?"uma votação":"um quiz"}. Está na aba Quiz e votações.`:`${fresh.length} novas interações criadas pelo apresentador.`);
  sqActs=r.data||[];
  const live=sqActs.filter(a=>a.estado!=="rascunho");
  const res=await Promise.all(live.map(a=>SB.rpc("int_quiz_resultado",{p_atividade:a.id}).then(x=>x.data)));
  sqARes={}; live.forEach((a,i)=>sqARes[a.id]=res[i]);
}
const sqSel=new Set();
function szItem(a,i,tela){ const res=sqARes[a.id], pct=(res&&res.pct)||{}, st=QE_ST[a.estado]||QE_ST.rascunho, onScreen=tela===a.id;
      return `<li class="sz-item ${a.estado}${onScreen?" onair":""}">
        <div class="sz-top">${a.estado==="rascunho"?`<label class="sz-sel" title="Selecionar para abrir em lote"><input type="checkbox" data-szsel="${a.id}" ${sqSel.has(a.id)?"checked":""}></label>`:""}<b>${i+1}. ${esc(a.pergunta)}</b><span class="st-badge sz-tipo">${tipoNome(a)}</span><span class="st-badge ${st[1]}">${st[0]}</span>${onScreen?'<span class="st-badge st-no_ar">Na tela</span>':""}${a.criado_por?`<span class="st-badge st-pedido">Criado por ${esc(a.criado_por)}</span>`:""}${a.estado!=="rascunho"?multiCheck("quiz",a.id):""}</div>
        ${a.estado!=="rascunho"?`<ul class="sz-bars">${qzOpts(a).map((o,k)=>`<li class="${a.correta===o.id?"ok":""}" style="--oc:${CHART_COLORS[k%CHART_COLORS.length]}"><i style="width:${pct[o.id]||0}%"></i><b>${QZ_LETTERS[k]}</b><span>${esc(o.t)}</span><em>${pct[o.id]||0}%${qtdDe(res,o.id)!=null?` <small class="qv">· ${votosTxt(qtdDe(res,o.id))}</small>`:""}</em></li>`).join("")}</ul>${res&&!res.tem_respostas?'<p class="meta" style="margin:4px 0 0">Aguardando respostas…</p>':totalLinha(res)}`:`<p class="meta" style="margin:4px 0 0">${qzOpts(a).length} alternativas${a.tipo==="enquete"?" · votação, sem resposta certa":` · resposta certa: ${QZ_LETTERS[qzOpts(a).findIndex(o=>o.id===a.correta)]||"–"}`}</p>`}
        <div class="sz-graf"><span class="meta">Gráfico na tela:</span>${ativGrafSeg(a.grafico,`data-sz="graf" data-id="${a.id}"`)}</div>
        <div class="sq-acts">
          ${a.estado==="rascunho"?`<button class="btn primary sm" data-sz="aberta" data-id="${a.id}" type="button">Abrir para o público</button>`:""}
          ${a.estado==="aberta"?`<button class="btn primary sm" data-sz="encerrada" data-id="${a.id}" type="button">Encerrar e mostrar resultado</button>`:""}
          ${a.estado!=="rascunho"?(onScreen?`<span class="show-group"><span class="sg-lbl">Na tela em</span><button class="btn sm ${sqTela.formato!=="quiz_faixa"?"primary":"tela-b"}" data-sz="tela" data-f="quiz" data-id="${a.id}" type="button">${FMT_ICON.destaque}Destaque</button><button class="btn sm ${sqTela.formato==="quiz_faixa"?"primary":"tela-b"}" data-sz="tela" data-f="quiz_faixa" data-id="${a.id}" type="button">${FMT_ICON.faixa}Faixa</button></span><button class="btn ghost sm" data-sz="tirar" data-id="${a.id}" type="button">Tirar da tela</button>`:`<span class="show-group"><span class="sg-lbl">Mostrar em</span><button class="btn sm tela-b" data-sz="tela" data-f="quiz" data-id="${a.id}" type="button">${FMT_ICON.destaque}Destaque</button><button class="btn sm tela-b" data-sz="tela" data-f="quiz_faixa" data-id="${a.id}" type="button">${FMT_ICON.faixa}Faixa</button></span>`):""}
          ${a.estado!=="rascunho"?`<button class="linkbtn mq-rm" data-sz="rascunho" data-id="${a.id}" type="button">Voltar para rascunho</button>`:""}
        </div></li>`; }
function salaQuizHtml(){
  if(sqActs===null) return "";
  const tela=sqTela&&sqTela.atividade_id;
  const ativos=sqActs.filter(a=>a.estado!=="encerrada"||tela===a.id);
  const rasc=sqActs.filter(a=>a.estado==="rascunho"), abertos=sqActs.filter(a=>a.estado==="aberta");
  [...sqSel].forEach(id=>{ if(!rasc.some(a=>a.id===id)) sqSel.delete(id); });
  const bulk=(rasc.length||abertos.length>1)?`<div class="sz-bulk">
      ${rasc.length?`<button class="btn primary sm" data-szb="sel" type="button" ${sqSel.size?"":"disabled"}>Abrir selecionados${sqSel.size?` (${sqSel.size})`:""}</button><button class="btn sm tela-b" data-szb="todos" type="button">Abrir todos os rascunhos (${rasc.length})</button>`:""}
      ${abertos.length>1?`<button class="btn ghost sm" data-szb="fechar" type="button">Encerrar todos os abertos (${abertos.length})</button>`:""}
      <span class="meta">${abertos.length?`${abertos.length} ${abertos.length===1?"aberto":"abertos"} agora. Vários podem ficar abertos ao mesmo tempo.`:"Marque os rascunhos para abrir vários de uma vez."}</span>
    </div>`:"";
  const feitos=sqActs.filter(a=>a.estado==="encerrada"&&tela!==a.id);
  const open=sqOpen.zdone;
  return salaCreateHtml()+`<div class="sala-card sala-quiz"><div class="ch-row"><div><b>Chamada automática no telão</b><span class="meta">Aviso “Quiz aberto” com a pergunta, por 7 s, quando um item abre</span></div><button class="sw-toggle" id="chAuto" type="button" role="switch" aria-checked="${sqTela&&sqTela.chamada_auto===false?"false":"true"}" aria-label="Chamada automática"><span class="sw-txt sw-on">ON</span><span class="sw-txt sw-off">OFF</span><span class="sw-k"></span></button></div>
    <div class="sala-h"><h3>Quiz e votações</h3><span class="meta">${ativos.length} ${ativos.length===1?"ativo":"ativos"}${feitos.length?` · ${feitos.length} ${feitos.length===1?"encerrado":"encerrados"}`:""}</span></div>
    ${bulk}${multiBarHtml("quiz")}${ativos.length?`<ul class="sz-list">${ativos.map((a)=>szItem(a,sqActs.indexOf(a),tela)).join("")}</ul>`:(sqActs.length?'<p class="meta">Todos os itens já foram encerrados. Veja em "Encerrados" abaixo.</p>':'<p class="meta">Nenhum quiz ou votação neste episódio. Crie na aba Episódios, dentro do episódio, ou o apresentador cria pelo controle dele.</p>')}
  </div>
  ${feitos.length?`<div class="sala-card sala-closed">
    <button class="closed-h" data-sq-tog="zdone" type="button" aria-expanded="${open}"><span class="closed-chev${open?" open":""}" aria-hidden="true">${ICON_DOWN}</span><h3>Encerrados</h3><span class="mod-n">${feitos.length}</span></button>
    ${open?`<ul class="sz-list closed-list">${feitos.map(a=>szItem(a,sqActs.indexOf(a),tela)).join("")}</ul>`:""}
  </div>`:""}`;
}
async function salaBulk(act,b){
  const rasc=(sqActs||[]).filter(a=>a.estado==="rascunho").map(a=>a.id), abertos=(sqActs||[]).filter(a=>a.estado==="aberta").map(a=>a.id);
  const ids = act==="sel" ? [...sqSel] : act==="todos" ? rasc : abertos;
  if(!ids.length) return;
  if(act==="fechar" && !confirmInline(b,"Encerrar todos?")) return;
  if(b) b.disabled=true;
  let r=await SB.rpc("int_atividades_lote",{p_episode:sqEp,p_ids:ids,p_estado:act==="fechar"?"encerrada":"aberta"});
  if(r.error && /function|schema cache/i.test(r.error.message||"")){ toast("Falta rodar o int-quiz-lote.sql no Supabase."); if(b) b.disabled=false; return; }
  if(b) b.disabled=false;
  if(r.error){ toast("Não foi possível atualizar."); return; }
  toast(act==="fechar"?`${r.data||ids.length} itens encerrados.`:`${r.data||ids.length} itens abertos para o público ao mesmo tempo.`);
  sqSel.clear(); sqSig=""; loadSalaQs();
}
async function salaQuizAction(act,id,btn){
  if(act==="graf"){ const v=btn.dataset.v; const {error}=await SB.from("int_atividades").update({grafico:v}).eq("id",id); if(error) toast("Não foi possível trocar o gráfico."); sqSig=""; loadSalaQs(); return; }
  if(act==="rascunho" && !confirmInline(btn,"Apagar respostas?")) return;
  if(btn) btn.disabled=true;
  let r;
  if(act==="tela"){ const fq=btn&&btn.dataset.f||(salaFmt==="faixa"?"quiz_faixa":"quiz"); await clearPodioIfConflict(fq==="quiz_faixa"?"base":"centro"); salaFmt=fq==="quiz_faixa"?"faixa":"destaque"; lsSet("akicast-sala-fmt",salaFmt);
    r=await SB.rpc("int_mostrar_atividade",{p_episode:sqEp,p_atividade:id,p_formato:fq});
    if(r.error && /function|p_formato|schema cache/i.test(r.error.message||"")) r=await SB.rpc("int_mostrar_atividade",{p_episode:sqEp,p_atividade:id}); }
  else if(act==="tirar") r=await SB.rpc("int_mostrar_atividade",{p_episode:sqEp,p_atividade:null});
  else { r=await SB.rpc("int_atividade_estado",{p_atividade:id,p_estado:act}); if(!r.error&&act==="encerrada"&&sqTela&&sqTela.atividade_id!==id) toast("Quiz encerrado. Use \"Mostrar na tela\" para exibir o resultado no OBS."); }
  if(r&&r.error){ toast("Não foi possível atualizar o quiz."); if(btn) btn.disabled=false; }
  sqSig=""; loadSalaQs();
}

/* ---------- Seletores de tipo e gráfico ---------- */
function ativTipoSeg(v,attrs){
  v=v||"quiz";
  return `<div class="seg" role="group" aria-label="Tipo"><button class="seg-b${v==="quiz"?" on":""}" ${attrs} data-v="quiz" type="button">Quiz <small>com resposta certa</small></button><button class="seg-b${v==="enquete"?" on":""}" ${attrs} data-v="enquete" type="button">Votação <small>sem resposta</small></button></div>`;
}
function ativGrafSeg(v,attrs){
  v=v||"barras";
  return `<div class="seg" role="group" aria-label="Gráfico"><button class="seg-b${v==="barras"?" on":""}" ${attrs} data-v="barras" type="button">▤ Barras</button><button class="seg-b${v==="pizza"?" on":""}" ${attrs} data-v="pizza" type="button">◔ Pizza</button></div>`;
}
/* ---------- Apresentador: criar quiz ou votação durante a live ---------- */
const CF_ST={rascunho:"Aguardando a produção",aberta:"No ar para o público",encerrada:"Encerrado"};
function ctrlCreateHtml(){
  if(!SESSION||!SESSION.papel||cqMine===null) return "";
  const f=cqForm;
  const mine=(cqMine||[]).slice(0,4);
  return `<div class="cq-create">
    <div class="cq-head"><b>Criar quiz ou votação</b>${f?"":`<button class="btn primary sm" id="cfNew" type="button">+ Nova</button>`}</div>
    ${f?`<div class="cf-form">
      ${ativTipoSeg(f.tipo,'data-cf="tipo"')}
      <input class="cf-q" id="cfQ" maxlength="300" placeholder="${f.tipo==="enquete"?"Ex.: Qual ferramenta você mais usa no dia a dia?":"Ex.: Qual atalho cola um texto?"}" value="${esc(f.pergunta)}">
      <div class="cf-opts">${f.opcoes.map((o,i)=>`<div class="cf-opt${f.tipo!=="enquete"&&f.correta===o.id?" cor":""}">
        ${f.tipo==="enquete"?"":`<input type="radio" name="cf-cor" data-cf="cor" data-oid="${o.id}" ${f.correta===o.id?"checked":""} aria-label="Resposta certa">`}
        <b>${QZ_LETTERS[i]}</b><input class="cf-ot" data-oi="${i}" maxlength="120" placeholder="Alternativa ${QZ_LETTERS[i]}" value="${esc(o.t)}">
        ${f.opcoes.length>2?`<button class="icon-btn" type="button" data-cf="rm" data-oi="${i}" aria-label="Remover alternativa"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`:""}
      </div>`).join("")}
      ${f.opcoes.length<5?'<button class="linkbtn" type="button" data-cf="add">+ Adicionar alternativa</button>':""}</div>
      ${f.tipo==="enquete"?"":'<p class="cq-note">Marque a bolinha da resposta certa. Ela só aparece para o público quando a produção encerrar.</p>'}
      <div class="cf-row"><span class="meta">Gráfico na tela:</span>${ativGrafSeg(f.grafico,'data-cf="graf"')}</div>
      <div class="cf-acts"><button class="btn primary" type="button" data-cf="send">Enviar para a produção</button><button class="btn ghost" type="button" data-cf="cancel">Cancelar</button></div>
      <p class="cq-note">A produção recebe na sala de controle e decide quando abrir e mostrar na tela.</p>
    </div>`:""}
    ${mine.length?`<ul class="cf-mine">${mine.map(a=>`<li><span class="st-badge sz-tipo">${a.tipo==="enquete"?"Votação":"Quiz"}</span><span class="cf-mq">${esc(a.pergunta)}</span><span class="cf-st ${a.estado}">${CF_ST[a.estado]||a.estado}</span>${a.estado==="rascunho"?`<button class="linkbtn ed-rm" type="button" data-cf="del" data-id="${a.id}">Apagar</button>`:""}</li>`).join("")}</ul>`:""}
  </div>`;
}
function wireCtrlCreate(){
  const box=$("#ctrlQs"); if(!box) return;
  const nb=$("#cfNew"); if(nb) nb.addEventListener("click",()=>{ nb.blur(); cqForm={tipo:"enquete",grafico:"pizza",pergunta:"",opcoes:[{id:"a",t:""},{id:"b",t:""},{id:"c",t:""}],correta:null}; cqSig=""; renderCtrlQs(); const q=$("#cfQ"); if(q) q.focus(); });
  if(!cqForm) { box.querySelectorAll('[data-cf="del"]').forEach(b=>b.addEventListener("click",()=>ctrlCreateAction("del",b))); return; }
  const q=$("#cfQ"); if(q) q.addEventListener("input",()=>{ cqForm.pergunta=q.value; });
  box.querySelectorAll(".cf-ot").forEach(i=>i.addEventListener("input",()=>{ cqForm.opcoes[+i.dataset.oi].t=i.value; }));
  box.querySelectorAll("[data-cf]").forEach(b=>{ const ev=b.type==="radio"?"change":"click"; b.addEventListener(ev,()=>ctrlCreateAction(b.dataset.cf,b)); });
}
async function ctrlCreateAction(act,b){
  const f=cqForm;
  if(act==="del"){ const {error}=await SB.from("int_atividades").delete().eq("id",b.dataset.id); if(error) toast("Não foi possível apagar."); else toast("Apagado."); cqSig=""; loadCtrlQs(); return; }
  if(!f) return;
  if(act==="tipo"){ f.tipo=b.dataset.v; if(f.tipo==="enquete") f.correta=null; }
  else if(act==="graf"){ f.grafico=b.dataset.v; }
  else if(act==="cor"){ f.correta=b.dataset.oid; }
  else if(act==="add"){ const used=new Set(f.opcoes.map(o=>o.id)); f.opcoes.push({id:"abcdefgh".split("").find(c=>!used.has(c)),t:""}); }
  else if(act==="rm"){ const rm=f.opcoes.splice(+b.dataset.oi,1)[0]; if(f.correta===rm.id) f.correta=null; }
  else if(act==="cancel"){ cqForm=null; }
  else if(act==="send"){
    const pergunta=(f.pergunta||"").trim(), opts=f.opcoes.map(o=>({id:o.id,t:(o.t||"").trim()})).filter(o=>o.t), enq=f.tipo==="enquete";
    if(pergunta.length<3){ toast("Escreva a pergunta."); return; }
    if(opts.length<2){ toast("Preencha pelo menos 2 alternativas."); return; }
    if(!enq&&(!f.correta||!opts.find(o=>o.id===f.correta))){ toast("Marque qual alternativa é a certa."); return; }
    b.disabled=true;
    const {error}=await SB.from("int_atividades").insert({episode_id:cqEp,tipo:enq?"enquete":"quiz",grafico:f.grafico,pergunta,opcoes:opts,correta:enq?null:f.correta,explicacao:"",ordem:900,criado_por:SESSION.usuario||""});
    b.disabled=false;
    if(error){ toast(/tipo|grafico|criado_por/.test(error.message||"")?"Falta rodar o int-interacoes-votacao.sql no Supabase.":"Não foi possível enviar."); return; }
    cqForm=null; toast(`${enq?"Votação enviada":"Quiz enviado"} para a produção.`);
    cqSig=""; loadCtrlQs(); return;
  }
  b.blur&&b.blur(); cqSig=""; renderCtrlQs();
  if(act==="add"){ const l=[...document.querySelectorAll(".cf-ot")].pop(); if(l) l.focus(); }
}

/* ---------- Nome da aba do navegador ---------- */
function viewName(){
  const vis=id=>{ const el=document.getElementById(id); return el && !el.hidden; };
  const b=document.body;
  if(vis("salaOv")) return SALA_MINI?"Frase e QR Code":"Sala de controle";
  if(vis("ctrlOv")) return "Controle do apresentador";
  if(vis("dispOv")) return "Tela de exibição";
  if(b.classList.contains("qr-mode")) return "Tela do QR Code";
  if(b.classList.contains("overlay-mode")) return "Tela de perguntas";
  if(b.classList.contains("listen-mode")) return (typeof listenAfter!=="undefined"&&listenAfter)?"Rever o episódio":"Perguntas e votação";
  if(b.classList.contains("send-mode")) return "Envio da apresentação";
  const tab=document.querySelector('nav.tabs button[aria-selected="true"]');
  const epDe=id=>(typeof episodes!=="undefined"&&id)?episodes.find(e=>e.id===id):null;
  const dia=ep=>{ if(!ep||!ep.date) return ""; const [y,m,d]=String(ep.date).slice(0,10).split("-"); return d&&m?d+"/"+m:""; };
  if(tab && tab.id==="tab-check"){
    if(typeof editing!=="undefined" && editing) return "Editar checklist";
    if(typeof selectedId!=="undefined" && selectedId){ const ep=epDe(selectedId), d=dia(ep); return (d?d+" · ":"")+((ep&&ep.theme)?String(ep.theme).slice(0,40):"Episódio"); }
  }
  if(tab && tab.id==="tab-pres"){ const d=dia(epDe(typeof presEpId!=="undefined"?presEpId:null)); return "Apresentações"+(d?" · "+d:""); }
  return tab ? tab.textContent.trim() : "Central";
}
function updateTitle(){
  const t=(typeof brandText==="function"?brandText(viewName()):viewName())+" - "+PN();
  if(document.title!==t) document.title=t;
}
document.addEventListener("click",()=>setTimeout(updateTitle,0),true);
setInterval(updateTitle,800);

/* =================== Frase de destaque =================== */
const FRASES_FIXAS=["Mande suas perguntas pelo QR code!","Participe da votação pelo QR code!","Participe do quiz pelo QR code!"];
const FRASE_FORMATS=[{id:"legenda",t:"Legenda",d:"Faixa escura na parte de baixo, largura toda."},{id:"selo",t:"Selo",d:"Pílula no topo. Pode ficar junto com uma pergunta ou quiz."}];
function fraseInner(texto,formato){
  if(!texto) return "";
  if(formato==="selo") return `<div class="ofr ofr-selo"><span class="ofr-t">${esc(texto)}</span></div>`;
  return `<div class="ofr ofr-legenda"><span class="ofr-t">${esc(texto)}</span></div>`;
}
/* ---------- Tela do OBS: camada própria da frase ---------- */
let ovFraseKey="", ovSeloKey="";
function showSelo(texto){
  const c=$("#ovSelo"); if(!c) return;
  const key=texto||""; if(key===ovSeloKey) return; ovSeloKey=key;
  const cur=c.firstElementChild;
  const enter=()=>{ c.innerHTML=fraseInner(texto,"selo"); const el=c.firstElementChild; if(el){ el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering"))); } };
  if(cur){ cur.classList.add("leaving"); setTimeout(()=>{ if(ovSeloKey===key) enter(); },420); } else if(key) enter();
}
function syncLegOverlay(){
  const m=$("#ovCanvas"), lg=document.querySelector("#ovFrase .ofr-legenda:not(.leaving)"); if(!m) return;
  const v=lg?(lg.offsetHeight+16)+"px":"0px"; if(m.style.getPropertyValue("--leg-h")!==v) m.style.setProperty("--leg-h",v);
  ["#ovPodio","#ovMulti","#ovNome","#ovNome2","#ovNome3"].forEach(id=>{ const pd=$(id); if(pd && pd.style.getPropertyValue("--leg-h")!==v) pd.style.setProperty("--leg-h",v); });
}
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ if(typeof syncLegOverlay==="function") syncLegOverlay(); });
function showFrase(texto,formato){
  const c=$("#ovFrase"); if(!c) return;
  const key=texto?formato+"|"+texto:"";
  if(key===ovFraseKey) return; ovFraseKey=key;
  const cur=c.firstElementChild;
  const setLeg=h=>{ const v=h?(h+16)+"px":"0px"; ["#ovCanvas","#ovPodio","#ovMulti","#ovNome","#ovNome2","#ovNome3"].forEach(id=>{ const m=$(id); if(m) m.style.setProperty("--leg-h",v); }); };
  const enter=()=>{ c.innerHTML=fraseInner(texto,formato); const el=c.firstElementChild;
    if(el){ el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering"))); }
    setLeg(el&&formato!=="selo"?el.offsetHeight:0); };
  if(cur){ cur.classList.add("leaving"); if(!texto||formato==="selo") setLeg(0); setTimeout(()=>{ if(ovFraseKey===key) enter(); },420); } else enter();
}
/* ---------- Sala de controle ---------- */
let sqFrases=[], sqFraseFmt=lsGet("akicast-frase-fmt")==="selo"?"selo":"legenda", sqFraseSig="";
async function loadSalaFrases(){
  if(!sqEp||!SESSION||SESSION.papel!=="admin"){ sqFrases=[]; return; }
  const r=await SB.from("int_frases").select("id,texto,criada_em").eq("episode_id",sqEp);
  sqFrases = r.error ? null : (r.data||[]).sort((a,b)=>String(b.criada_em).localeCompare(String(a.criada_em)));
}
const EMOJIS_RAPIDOS=[["👋","👋 Oi, pessoal!"],["😊","😊 Obrigada pelo carinho!"],["👏","👏 Palmas para vocês!"],["❤️","❤️ Obrigado por estarem aqui!"],["🎉","🎉 Que demais!"]];
const EMOJIS_INSERIR=["👋","😊","😄","👏","🙌","❤️","🎉","🚀","💡","✅","👀","🔥"];
function emojiBarHtml(ch){
  return `<div class="sf-emo">
    <div class="sf-emo-row"><span class="meta">Inserir emoji</span>${EMOJIS_INSERIR.map(e=>`<button class="sf-emo-b" data-sf="ins" data-ch="${ch}" data-e="${e}" type="button">${e}</button>`).join("")}</div>
  </div>`;
}
function fraseCanais(t){ t=t||{}; const now=Date.now(), vivo=a=>!a||new Date(a).getTime()>now; const legSelo=t.frase_formato==="selo";
  const leg=legSelo?null:(t.frase||null), selo=t.selo_frase||(legSelo?t.frase:null)||null;
  return {legenda:leg&&vivo(t.frase_ate)?leg:null, selo:selo&&vivo(t.selo_ate)?selo:null, legenda_ate:t.frase_ate||null, selo_ate:t.selo_ate||null}; }
function fraseRestante(c,ch){ const a=c[ch+"_ate"]; if(!a||!c[ch]) return null; return Math.max(0,Math.ceil((new Date(a).getTime()-Date.now())/1000)); }
function frasesPreview(t){ const c=fraseCanais(t); const ns=nomesAtivos(t); return fraseInner(c.legenda,"legenda")+fraseInner(c.selo,"selo")+(ns.esq||ns.dir||ns.centro?`<div class="onm-wrap${baseOcupada(t)?" base-on":""}${ns.esq&&ns.centro&&ns.dir?" trio":""}">${nomeInner(ns.esq,"esq")}${nomeInner(ns.centro,"centro")}${nomeInner(ns.dir,"dir")}</div>`:""); }
const sqFraseDrafts={legenda:"",selo:""};
function renderSalaFrase(){
  const box=$("#salaFrase"); if(!box) return;
  const admin=SESSION&&SESSION.papel==="admin";
  if(!admin||sqFrases===null){ box.innerHTML=""; return; }
  const c=fraseCanais(sqTela);
  const sig=JSON.stringify([SALA_MINI,c.legenda,c.selo,c.legenda_ate,c.selo_ate,sqFraseFmt,sqFrases.map(f=>f.texto)]);
  if(sig===sqFraseSig && box.firstElementChild) return;
  if(box.contains(document.activeElement) && document.activeElement.tagName==="TEXTAREA" && sqFraseSig){ sqFraseSig=sig; updateFraseOnAir(); return; }
  sqFraseSig=sig;
  const hist=(SALA_MINI?sqFrases:sqFrases.filter(f=>!FRASES_FIXAS.includes(f.texto)));
  const histHtml=ch=>hist.length?`<div class="sf-hist"><span class="meta">Já usadas nesta sessão</span>${hist.slice(0,8).map(f=>`<button class="sf-h${c[ch]===f.texto?" on":""}" data-sf="reuse" data-ch="${ch}" data-t="${esc(f.texto)}" type="button">${esc(f.texto)}</button>`).join("")}</div>`:"";
  const canal=(ch,titulo,desc)=>`<div class="sala-card sala-frase" data-canal="${ch}">
    <div class="sala-h"><h3>${titulo}</h3>${c[ch]?`<span class="air-pill on"><span class="dotc on"></span>No ar<span class="sf-cd" data-cd="${ch}">${fraseRestante(c,ch)!=null?` · sai em ${fraseRestante(c,ch)} s`:""}</span></span>`:'<span class="air-pill">Fora da tela</span>'}</div>
    <p class="meta sf-desc">${desc}</p>
    <div class="sf-onair" data-onair="${ch}">${c[ch]?`<p class="sf-on">“${esc(c[ch])}”</p>`:""}</div>
    <textarea data-sft="${ch}" rows="2" maxlength="160" placeholder="Escreva a frase">${esc(sqFraseDrafts[ch])}</textarea>
    <div class="sf-row"><span class="meta" data-sfc="${ch}">${sqFraseDrafts[ch].length} / 160</span></div>
    ${emojiBarHtml(ch)}
    <div class="sf-acts"><button class="btn primary" data-sf="show" data-ch="${ch}" type="button">${c[ch]?"Trocar":"Mostrar"}</button><button class="btn sm tela-b" data-sf="show30" data-ch="${ch}" type="button">${c[ch]?"Trocar por 30 s":"Mostrar por 30 s"}</button>${c[ch]?`<button class="btn ghost" data-sf="off" data-ch="${ch}" type="button">Tirar da tela</button>`:""}</div>
    ${histHtml(ch)}
  </div>`;
  if(SALA_MINI){
    box.innerHTML=canal("selo","Selo","Barra no topo da tela. Pode ficar junto com a legenda.")+canal("legenda","Legenda","Faixa escura na parte de baixo, de ponta a ponta.");
  } else {
    const ch=sqFraseFmt;
    box.innerHTML=`<div class="sala-card sala-frase" data-canal="${ch}">
      <div class="sala-h"><h3>Frase de destaque</h3>${c.legenda||c.selo?'<span class="air-pill on"><span class="dotc on"></span>No ar</span>':""}</div>
      ${c.legenda?`<div class="sf-air-row"><span class="st-badge">Legenda</span><span class="sf-on">“${esc(c.legenda)}”</span><span class="sf-cd meta" data-cd="legenda">${fraseRestante(c,"legenda")!=null?`sai em ${fraseRestante(c,"legenda")} s`:""}</span><button class="btn ghost sm" data-sf="off" data-ch="legenda" type="button">Tirar da tela</button></div>`:""}
      ${c.selo?`<div class="sf-air-row"><span class="st-badge">Selo</span><span class="sf-on">“${esc(c.selo)}”</span><span class="sf-cd meta" data-cd="selo">${fraseRestante(c,"selo")!=null?`sai em ${fraseRestante(c,"selo")} s`:""}</span><button class="btn ghost sm" data-sf="off" data-ch="selo" type="button">Tirar da tela</button></div>`:""}
      <textarea data-sft="${ch}" rows="2" maxlength="160" placeholder="Ex.: Contexto e formato fazem a IA acertar de primeira">${esc(sqFraseDrafts[ch])}</textarea>
      <div class="sf-row"><span class="meta" data-sfc="${ch}">${sqFraseDrafts[ch].length} / 160</span>
        <div class="seg" role="group" aria-label="Onde mostrar">${FRASE_FORMATS.map(x=>`<button class="seg-b${ch===x.id?" on":""}" data-sf="fmt" data-f="${x.id}" type="button" title="${esc(x.d)}">${x.id==="selo"?"▔ ":"▁ "}${x.t}</button>`).join("")}</div>
      </div>
      ${emojiBarHtml(ch)}
      <div class="sf-acts"><button class="btn primary" data-sf="show" data-ch="${ch}" type="button">${c[ch]?`Trocar ${ch==="selo"?"selo":"legenda"}`:`Mostrar como ${ch==="selo"?"selo":"legenda"}`}</button><button class="btn sm tela-b" data-sf="show30" data-ch="${ch}" type="button">Por 30 s</button></div>
      <div class="sf-hist sf-fixas"><span class="meta">Frases prontas</span>${FRASES_FIXAS.map(t=>{ const onCh=c.legenda===t?"legenda":c.selo===t?"selo":null; return `<div class="sf-fx${onCh?" on":""}"><span>${esc(t)}</span>${onCh?`<button class="btn ghost sm" data-sf="off" data-ch="${onCh}" type="button">Tirar</button>`:`<button class="btn sm tela-b" data-sf="reuse" data-ch="${ch}" data-t="${esc(t)}" type="button">Mostrar</button>`}</div>`; }).join("")}</div>
      ${histHtml(ch)}
      <p class="meta sf-note">Legenda e selo são independentes: os dois podem ficar no ar ao mesmo tempo.</p>
    </div>`;
  }
  box.querySelectorAll("textarea[data-sft]").forEach(t=>{ const ch=t.dataset.sft;
    t.addEventListener("input",()=>{ sqFraseDrafts[ch]=t.value; const c2=box.querySelector(`[data-sfc="${ch}"]`); if(c2) c2.textContent=t.value.length+" / 160"; });
    t.addEventListener("keydown",e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); fraseAction("show",{dataset:{ch}}); } }); });
  box.querySelectorAll("[data-sf]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); fraseAction(b.dataset.sf,b); }));
}
function updateFraseOnAir(){ const c=fraseCanais(sqTela); document.querySelectorAll("#salaFrase [data-onair]").forEach(el=>{ const v=c[el.dataset.onair]; el.innerHTML=v?`<p class="sf-on">“${esc(v)}”</p>`:""; }); }
async function fraseRpc(frase,ch,seg){
  let r=await SB.rpc("int_mostrar_frase",{p_episode:sqEp,p_frase:frase,p_formato:ch,p_segundos:seg});
  if(r.error && /p_segundos|function|schema cache/i.test(r.error.message||"")){ if(seg) toast("Para o “por 30 s”, rode o int-frase-tempo.sql no Supabase."); r=await SB.rpc("int_mostrar_frase",{p_episode:sqEp,p_frase:frase,p_formato:ch}); }
  return r;
}
// Contagem regressiva e saída automática na sala (a tela do OBS confere sozinha a cada 2 s)
let fraseTickK="";
function fraseTick(){
  if(!$("#salaFrase")||$("#salaOv").hidden) return;
  const c=fraseCanais(sqTela), k=[!!c.legenda,!!c.selo,!!nomeAtivo(sqTela,"esq"),!!nomeAtivo(sqTela,"dir"),!!nomeAtivo(sqTela,"centro")].join();
  if(k!==fraseTickK){ const first=!fraseTickK; fraseTickK=k; if(!first){ sqFraseSig=""; renderSalaFrase(); sqNomeSig=""; renderSalaNome(); renderMiniOnAir(); sqSig=""; renderSalaQs(); } }
  document.querySelectorAll("#salaNome [data-ncd]").forEach(el=>{ const r=nomeRest(el.dataset.ncd); el.textContent=r!=null?` · sai em ${r} s`:""; });
  document.querySelectorAll("#salaFrase [data-cd]").forEach(el=>{ const r=fraseRestante(c,el.dataset.cd); const full=el.classList.contains("meta"); el.textContent=r==null?"":(full?`sai em ${r} s`:` · sai em ${r} s`); });
}
setInterval(fraseTick,1000);
async function fraseAction(act,b){
  const ch=(b&&b.dataset&&b.dataset.ch)||sqFraseFmt;
  let r=null;
  if(act==="ins"){
    const t=document.querySelector(`#salaFrase textarea[data-sft="${ch}"]`); if(!t) return;
    const e=b.dataset.e, a=t.selectionStart??t.value.length, z=t.selectionEnd??t.value.length;
    const v=(t.value.slice(0,a)+e+t.value.slice(z)).slice(0,160); t.value=v; sqFraseDrafts[ch]=v;
    const c2=document.querySelector(`#salaFrase [data-sfc="${ch}"]`); if(c2) c2.textContent=v.length+" / 160";
    t.focus(); const pos=Math.min(a+e.length,v.length); try{ t.setSelectionRange(pos,pos); }catch(_){}
    return;
  }
  if(act==="emo"){ r=await fraseRpc(b.dataset.t,"selo",8); if(!r.error) toast("Reação no ar por 8 segundos."); if(r&&r.error) toast("Não foi possível mostrar a reação."); sqFraseSig=""; sqSig=""; loadSalaQs(); return; }
  if(act==="fmt"){ sqFraseFmt=b.dataset.f; lsSet("akicast-frase-fmt",sqFraseFmt); sqFraseSig=""; renderSalaFrase(); return; }
  if(act==="show"||act==="show30"){
    const txt=(sqFraseDrafts[ch]||"").trim();
    if(!txt){ toast("Escreva a frase ou escolha um emoji."); const t=document.querySelector(`#salaFrase textarea[data-sft="${ch}"]`); if(t) t.focus(); return; }
    r=await fraseRpc(txt,ch,act==="show30"?30:null);
    if(!r.error){ sqFraseDrafts[ch]=""; toast((ch==="selo"?"Selo no ar":"Legenda no ar")+(act==="show30"?" por 30 segundos.":".")); }
  } else if(act==="off"){
    r=await fraseRpc("",ch,null);
    if(!r.error) toast(ch==="selo"?"Selo retirado.":"Legenda retirada.");
  } else if(act==="reuse"){
    r=await fraseRpc(b.dataset.t,ch,null);
    if(!r.error) toast(ch==="selo"?"Selo no ar.":"Legenda no ar.");
  }
  if(r&&r.error){ const m=r.error.message||""; toast(/int_frases_texto_check|check constraint/i.test(m)?"Para mandar só um emoji, rode o int-frase-emoji.sql no Supabase.":/function|schema cache/i.test(m)?"Falta rodar o SQL da frase de destaque no Supabase.":"Não foi possível atualizar a frase."); }
  sqFraseSig=""; sqSig=""; loadSalaQs();
}
/* ---------- Tela enxuta: lista do que está no ar ---------- */
function renderMiniOnAir(){
  const el=$("#salaMiniList"); if(!el) return;
  if(!SALA_MINI){ el.innerHTML=""; return; }
  const t=sqTela||{}, c=fraseCanais(t), ep=episodes.find(e=>e.id===sqEp);
  let qr=false; try{ qr=ep?qrState(ep,t).show:false; }catch(e){}
  const items=[];
  if(c.selo) items.push(["Selo",`“${c.selo}”`]);
  if(c.legenda) items.push(["Legenda",`“${c.legenda}”`]);
  if(qr) items.push(["QR Code","No ar"]);
  { const ns=nomesAtivos(t); if(ns.esq) items.push(["Nome · esquerda",ns.esq.nome+(ns.esq.cargo?" · "+ns.esq.cargo:"")]); if(ns.centro) items.push(["Nome · centro",ns.centro.nome+(ns.centro.cargo?" · "+ns.centro.cargo:"")]); if(ns.dir) items.push(["Nome · direita",ns.dir.nome+(ns.dir.cargo?" · "+ns.dir.cargo:"")]); }
  if(t.pergunta_id){ const p=(sqRows||[]).find(x=>x.id===t.pergunta_id); items.push([`Pergunta · ${t.formato==="faixa"?"faixa":"destaque"}`, p?p.texto:"Pergunta do público"]); }
  if(t.atividade_id){ const a=(sqActs||[]).find(x=>x.id===t.atividade_id); items.push([`${a&&a.tipo==="enquete"?"Votação":"Quiz"} · ${t.formato==="quiz_faixa"?"faixa":"destaque"}`, a?a.pergunta:""]); }
  if(t.multi&&Array.isArray(t.multi.ids)&&t.multi.ids.length) items.push(["Vários na tela",`${t.multi.ids.length} itens · ${({grade:"grade",lateral:"lateral",faixa:"alternando"})[t.multi.layout]||""}`]);
  if(Array.isArray(t.podio)) items.push(["Pódio",({destaque:"destaque",faixa:"faixa",lateral:"lateral"})[t.podio_formato||"destaque"]]);
  el.innerHTML=`<div class="sala-card mini-list"><div class="sala-h"><h3>O que está na tela</h3><span class="meta">${items.length?items.length+(items.length===1?" item":" itens"):"Tela limpa"}</span></div>
    ${items.length?`<ul>${items.map(([k,v])=>`<li><span class="st-badge">${esc(k)}</span><span>${esc(v)}</span></li>`).join("")}</ul>`:'<p class="meta">Nada da central no ar agora: só a câmera e os slides.</p>'}</div>`;
}

/* =================== Tela do QR Code automática (OBS) =================== */
function obsQrLink(epId){ return location.origin+location.pathname+"?qrcode="+encodeURIComponent(epId); }
// Janelas em segundos a partir do início da live: [início, fim]
const QR_AGENDA=[[0,300],[600,630],[1200,1230],[2100,2135],[3000,3060]];
let qrEp=null, qrStart=null, qrShown=null, qrPreview=false;
async function startQrView(epId){
  document.documentElement.classList.add("overlay-mode"); document.body.classList.add("overlay-mode","qr-mode");
  qrPreview=new URLSearchParams(location.search).get("teste")==="1";
  const v=$("#overlayView"); v.hidden=false;
  v.innerHTML='<div class="ov-canvas" id="qrCanvas"><div class="oqr" id="oqr" hidden><div class="oqr-code" id="oqrCode"></div><div class="oqr-txt"><b>Venha participar!</b><span>Aponte a câmera para o QR Code e participe pela plataforma</span></div></div></div><div class="ov-hint" id="ovHint"></div>';
  const fit=()=>{ const c=$("#qrCanvas"); if(c) c.style.transform=`scale(${Math.min(innerWidth/1920,innerHeight/1080)})`; };
  fit(); addEventListener("resize",fit);
  if(!SB){ $("#ovHint").textContent="Central não configurada."; return; }
  const {data:ep}=await epPublico(epId);
  if(!ep){ $("#ovHint").textContent="Link inválido: episódio não encontrado."; return; }
  qrEp=ep;
  if(typeof followEpisodeProgram==="function") followEpisodeProgram(ep);
  try{
    await loadScript(LIBS.qr);
    const qr=window.qrcode(0,"M"); qr.addData(listenLink(epId)); qr.make();
    $("#oqrCode").innerHTML=qr.createSvgTag({cellSize:8,margin:1,scalable:true});
  }catch(e){ $("#ovHint").textContent="Não foi possível gerar o QR Code."; return; }
  const d=parseDate(ep.date); if(d){ qrStart=new Date(d); qrStart.setHours(9,0,0,0); }
  const pollTela=async()=>{ const r=await SB.from("int_tela").select("*").eq("episode_id",epId).maybeSingle(); if(!r.error) qrTela=r.data||{}; };
  { const ag=agendador(pollTela,()=>15000); const ch=SB.channel("qr-"+uid()); aviso(ch,"int_tela",epId,()=>ag.agora()); ch.subscribe(); }
  if(!/OBS/i.test(navigator.userAgent)){
    const h=$("#ovHint");
    h.textContent=qrPreview?"Modo de teste: o QR Code fica sempre visível. Tire o &teste=1 do link para usar a agenda automática.":"Tela do QR Code pronta. No OBS, adicione como Fonte de navegador em 1920 × 1080. Ele aparece sozinho nos horários da agenda (a partir das 9h). Para conferir agora, abra o link com &teste=1 no final.";
    setTimeout(()=>h.classList.add("gone"),9000);
  }
  qrTick(); setInterval(qrTick,1000);
}
let qrTela={};
function qrShouldShow(){
  if(qrPreview) return true;
  if(!qrEp) return false;
  return qrState(qrEp,qrTela).show;
}
function qrTick(){
  const el=$("#oqr"); if(!el) return;
  const show=qrShouldShow();
  if(show===qrShown) return; qrShown=show;
  if(show){ el.hidden=false; el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering"))); }
  else { el.classList.add("leaving"); setTimeout(()=>{ if(!qrShown){ el.hidden=true; el.classList.remove("leaving"); } },520); }
}

/* ---------- Estado da tela do QR Code (agenda + comandos da produção) ---------- */
// Agenda: do episódio (se a produção editou) ou a padrão. Formato salvo: [{min, seg}]
function qrAgendaItems(tela){ const a=tela&&Array.isArray(tela.qr_agenda)?tela.qr_agenda:null; return a&&a.length?a.map(x=>({min:Number(x.min)||0,seg:Number(x.seg)||30})):QR_AGENDA.map(([a,b])=>({min:a/60,seg:b-a})); }
function qrAgendaList(tela){ return qrAgendaItems(tela).map(x=>[Math.round(x.min*60),Math.round(x.min*60+x.seg)]).sort((p,q)=>p[0]-q[0]); }
const durTxt=s=>s>=60&&s%60===0?`${s/60} min`:(s>=60?`${Math.floor(s/60)} min ${s%60} s`:`${s} s`);
function qrBase(ep,tela){
  if(tela&&tela.qr_inicio) return new Date(tela.qr_inicio);
  const d=parseDate(ep&&ep.date); if(!d) return null; const s=new Date(d); s.setHours(9,0,0,0); return s;
}
function qrState(ep,tela,now){
  now=now||Date.now();
  const base=qrBase(ep,tela), auto=!(tela&&tela.qr_auto===false);
  const man=tela&&tela.qr_manual, ate=tela&&tela.qr_ate?new Date(tela.qr_ate).getTime():null;
  const wins=base?qrAgendaList(tela).map(([a,b])=>[base.getTime()+a*1000,base.getTime()+b*1000]):[];
  const cur=wins.find(([a,b])=>now>=a&&now<b)||null, next=wins.find(([a])=>a>now)||null;
  if(man==="mostrar" && (!ate||now<ate)) return {show:true,why:"manual",until:ate,cur,next,base,auto,wins};
  if(man==="esconder" && ate && now<ate) return {show:false,why:"escondido",until:ate,cur,next,base,auto,wins};
  if(!auto) return {show:false,why:"auto_off",cur,next,base,auto,wins};
  if(cur) return {show:true,why:"agenda",until:cur[1],cur,next,base,auto,wins};
  return {show:false,why:"espera",cur,next,base,auto,wins};
}
const hhmm=t=>{ const d=new Date(t); return String(d.getHours()).padStart(2,"0")+"h"+String(d.getMinutes()).padStart(2,"0")+(d.getSeconds()?":"+String(d.getSeconds()).padStart(2,"0"):""); };
const emQuanto=ms=>{ const s=Math.max(0,Math.round(ms/1000)); return s<60?`${s} s`:(s<3600?`${Math.round(s/60)} min`:`${Math.floor(s/3600)} h ${Math.round(s%3600/60)} min`); };
/* ---------- Sala de controle: card "QR Code na tela" ---------- */
let sqQrSig="", sqQrTimer=null, sqQrEdit=null, miniQrK="";
function qrAgendaEditor(){
  return `<div class="sqr-ed">
    <p class="meta">Minutos contados a partir do início (9h, ou do “Iniciar contagem”).</p>
    ${sqQrEdit.map((x,i)=>`<div class="sqr-ed-row">
      <span>Aos</span><input type="number" min="0" max="240" step="1" value="${x.min}" data-qre="min" data-i="${i}" aria-label="Minuto da aparição ${i+1}"><span>min, por</span>
      <input type="number" min="5" max="1800" step="5" value="${x.seg}" data-qre="seg" data-i="${i}" aria-label="Duração da aparição ${i+1} em segundos"><span>s</span>
      <span class="meta sqr-ed-dur">(${durTxt(x.seg)})</span>
      <button class="icon-btn" type="button" data-qra="rm" data-i="${i}" aria-label="Remover aparição"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>`).join("")}
    ${sqQrEdit.length<12?'<button class="linkbtn" type="button" data-qra="add">+ Adicionar aparição</button>':""}
    <div class="sqr-ed-acts"><button class="btn primary sm" type="button" data-qra="salvar">Salvar agenda</button><button class="btn ghost sm" type="button" data-qra="cancelar">Cancelar</button><button class="linkbtn" type="button" data-qra="padrao">Voltar à agenda padrão</button></div>
  </div>`;
}
function wireQrAgenda(){
  const box=$("#salaQr"); if(!box) return;
  box.querySelectorAll("[data-qre]").forEach(i=>i.addEventListener("input",()=>{ const v=Number(i.value); sqQrEdit[+i.dataset.i][i.dataset.qre]=isNaN(v)?0:v; const d=i.closest(".sqr-ed-row").querySelector(".sqr-ed-dur"); if(d&&i.dataset.qre==="seg") d.textContent=`(${durTxt(Math.max(0,v||0))})`; }));
  box.querySelectorAll("[data-qra]").forEach(b=>b.addEventListener("click",()=>qrAgendaAction(b.dataset.qra,b)));
}
async function qrAgendaAction(act,b){
  if(act==="editar"){ sqQrEdit=qrAgendaItems(sqTela||{}).sort((p,q)=>p.min-q.min).map(x=>({...x})); }
  else if(act==="cancelar"){ sqQrEdit=null; }
  else if(act==="add"){ const last=sqQrEdit[sqQrEdit.length-1]; sqQrEdit.push({min:last?Math.min(240,last.min+10):0,seg:30}); }
  else if(act==="rm"){ sqQrEdit.splice(+b.dataset.i,1); }
  else if(act==="salvar"||act==="padrao"){
    let ag=null;
    if(act==="salvar"){
      ag=sqQrEdit.map(x=>({min:Math.round(Number(x.min)*10)/10,seg:Math.round(Number(x.seg))})).filter(x=>!isNaN(x.min)&&!isNaN(x.seg));
      if(ag.some(x=>x.min<0||x.min>240||x.seg<5||x.seg>1800)){ toast("Use minuto entre 0 e 240 e duração entre 5 s e 30 min."); return; }
      ag.sort((p,q)=>p.min-q.min);
      for(let i=1;i<ag.length;i++){ if(ag[i].min*60<ag[i-1].min*60+ag[i-1].seg){ toast(`A aparição dos ${ag[i].min} min começa antes de a anterior terminar.`); return; } }
      if(!ag.length) ag=null;
    }
    if(b) b.disabled=true;
    const r=await SB.rpc("int_qr_agenda",{p_episode:sqEp,p_agenda:ag});
    if(b) b.disabled=false;
    if(r.error){ toast(/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-qrcode-agenda.sql no Supabase.":(r.error.message||"Não foi possível salvar.")); return; }
    toast(act==="padrao"?"Agenda padrão restaurada.":"Agenda do QR Code salva para este episódio.");
    sqQrEdit=null; sqQrSig=""; loadSalaQs(); return;
  }
  sqQrSig=""; renderSalaQr();
}
function renderSalaQr(){
  const box=$("#salaQr"); if(!box) return;
  const admin=SESSION&&SESSION.papel==="admin";
  const ep=episodes.find(e=>e.id===sqEp);
  if(!admin||!ep){ box.innerHTML=""; return; }
  const t=sqTela||{};
  if(sqQrEdit && box.querySelector(".sqr-ed") && box.querySelector(".sqr-ed").contains(document.activeElement)){ updateSalaQrLive(); return; }
  const sig=JSON.stringify([t.qr_inicio,t.qr_auto,t.qr_manual,t.qr_ate,ep.date,t.qr_agenda,!!sqQrEdit,sqQrEdit&&sqQrEdit.length]);
  if(sig!==sqQrSig || !box.firstElementChild){
    sqQrSig=sig;
    box.innerHTML=`<div class="sala-card sala-qr">
      <div class="sala-h"><h3>QR Code na tela</h3><span class="air-pill" id="sqrPill"></span></div>
      <p class="sqr-status" id="sqrStatus"></p>
      ${SALA_MINI?"":'<div class="sqr-line" id="sqrLine" aria-hidden="true"></div>'}
      <div class="sqr-agenda"${SALA_MINI?" hidden":""}>
        <div class="sqr-ag-h"><b>Agenda${Array.isArray(t.qr_agenda)&&t.qr_agenda.length?"":" padrão"}</b>${sqQrEdit?"":`<button class="linkbtn" data-qra="editar" type="button">Editar agenda</button>`}</div>
        ${sqQrEdit?qrAgendaEditor():`<div class="sqr-chips">${qrAgendaItems(t).sort((p,q)=>p.min-q.min).map(x=>`<span class="sqr-chip">${x.min} min · ${durTxt(x.seg)}</span>`).join("")}</div>`}
      </div>
      <div class="sqr-acts">
        ${SALA_MINI?"":'<button class="btn primary" data-qrc="mostrar" type="button">Mostrar agora</button>'}
        <button class="btn sm tela-b" data-qrc="mostrar30" type="button">Mostrar por 30 s</button>
        <button class="btn ghost" data-qrc="esconder" type="button">Esconder agora</button>
      </div>
      <div class="sqr-acts sqr-sec"${SALA_MINI?" hidden":""}>
        <button class="btn ghost sm" data-qrc="iniciar" type="button">Iniciar contagem agora</button>
        ${t.qr_inicio?'<button class="linkbtn" data-qrc="padrao" type="button">Voltar ao horário padrão (9h)</button>':""}
        <div class="sqr-auto"><span>Agenda automática</span><button class="sw-toggle" id="sqrAuto" type="button" role="switch" aria-checked="${t.qr_auto===false?"false":"true"}" aria-label="Agenda automática"><span class="sw-txt sw-on">ON</span><span class="sw-txt sw-off">OFF</span><span class="sw-k"></span></button></div>
      </div>
    </div>`;
    box.querySelectorAll("[data-qrc]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); qrControl(b.dataset.qrc,b); }));
    wireQrAgenda();
    $("#sqrAuto").addEventListener("click",e=>{ const b=e.currentTarget, on=b.getAttribute("aria-checked")!=="true"; b.setAttribute("aria-checked",on?"true":"false"); qrControl(on?"auto_on":"auto_off"); });
  }
  ensureSalaQrSvg().then(()=>updateSalaQrLive());
  updateSalaQrLive();
  if(!sqQrTimer) sqQrTimer=setInterval(()=>{ if(!$("#salaOv").hidden) updateSalaQrLive(); },1000);
}
let sqQrSvg=null, sqQrSvgEp=null;
async function ensureSalaQrSvg(){
  if(sqQrSvgEp===sqEp && sqQrSvg) return sqQrSvg;
  try{ await loadScript(LIBS.qr); const q=window.qrcode(0,"M"); q.addData(listenLink(sqEp)); q.make(); sqQrSvg=q.createSvgTag({cellSize:8,margin:1,scalable:true}); sqQrSvgEp=sqEp; }catch(e){ sqQrSvg=null; }
  return sqQrSvg;
}
function syncLegPreview(){
  document.querySelectorAll("#salaTela #sqCanvas").forEach(cv=>{ const lg=cv.querySelector(".ofr-legenda"); cv.style.setProperty("--leg-h",lg?(lg.offsetHeight+16)+"px":"0px"); });
}
function syncQrPreview(show){
  document.querySelectorAll("#salaTela #sqCanvas").forEach(cv=>{
    cv.classList.toggle("qr-on",!!show);
    let el=cv.querySelector(".oqr");
    if(show){
      if(!el){ if(!sqQrSvg){ ensureSalaQrSvg().then(()=>updateSalaQrLive()); return; }
        cv.insertAdjacentHTML("beforeend",`<div class="oqr"><div class="oqr-code">${sqQrSvg}</div><div class="oqr-txt"><b>Venha participar!</b><span>Aponte a câmera para o QR Code e participe pela plataforma</span></div></div>`); }
    } else if(el) el.remove();
    const box=cv.parentElement, empty=box&&box.querySelector(".tp-empty"); if(empty) empty.hidden=!!show;
    const card=cv.closest(".sala-tela"), pill=card&&card.querySelector(".sala-h .air-pill");
    if(pill){ if(!pill.dataset.orig) pill.dataset.orig=pill.outerHTML;
      if(show && !pill.classList.contains("on")){ pill.classList.add("on","qr-only"); pill.innerHTML='<span class="dotc on"></span>No ar · QR Code'; }
      else if(!show && pill.classList.contains("qr-only")){ pill.classList.remove("on","qr-only"); pill.textContent="Tela limpa"; } }
  });
}
function updateSalaQrLive(){
  const ep=episodes.find(e=>e.id===sqEp), st=$("#sqrStatus"), pill=$("#sqrPill"), line=$("#sqrLine"); if(!ep||!st) return;
  const s=qrState(ep,sqTela||{}), now=Date.now();
  syncQrPreview(s.show);
  if(SALA_MINI){ const k=String(s.show); if(k!==miniQrK){ miniQrK=k; renderMiniOnAir(); } }
  pill.className="air-pill"+(s.show?" on":""); pill.innerHTML=s.show?'<span class="dotc on"></span>No ar':"Fora da tela";
  st.textContent = s.why==="manual" ? (s.until?`Mostrando manualmente por mais ${emQuanto(s.until-now)}.`:"Mostrando manualmente, até alguém clicar em Esconder.")
    : s.why==="agenda" ? `No ar pela agenda até ${hhmm(s.until)} (${emQuanto(s.until-now)}).`
    : s.why==="escondido" ? `Escondido nesta aparição. A agenda volta ${s.next?"às "+hhmm(s.next[0]):"depois"}.`
    : s.why==="auto_off" ? "Agenda automática desligada. O QR Code só aparece pelos botões."
    : s.next ? `Agenda automática · próximo às ${hhmm(s.next[0])}, em ${emQuanto(s.next[0]-now)}${sqTela&&sqTela.qr_inicio?" (contagem iniciada "+hhmm(sqTela.qr_inicio)+")":""}.` : "Agenda automática · todas as aparições de hoje já passaram.";
  if(s.base && line){
    const t0=s.base.getTime(), span=Math.max(3660*1000,...s.wins.map(w=>w[1]-t0+60000)), pct=x=>Math.max(0,Math.min(100,(x-t0)/span*100));
    line.innerHTML=s.wins.map(([a,b])=>`<i class="sqr-w${now>=a&&now<b?" cur":""}" style="left:${pct(a)}%;width:${Math.max(.9,pct(b)-pct(a))}%"></i>`).join("")
      +(now>=t0&&now<=t0+span?`<b class="sqr-now" style="left:${pct(now)}%"></b>`:"")
      +`<span class="sqr-l0">${hhmm(t0)}</span><span class="sqr-l1">${hhmm(t0+span)}</span>`;
  } else if(line) line.innerHTML="";
}
async function qrControl(act,b){
  const ep=episodes.find(e=>e.id===sqEp);
  let ate=null;
  if(act==="esconder"){ const s=qrState(ep,sqTela||{}); ate = s.cur && s.auto ? new Date(s.cur[1]).toISOString() : null; }
  if(b) b.disabled=true;
  const r=await SB.rpc("int_qr_controle",{p_episode:sqEp,p_acao:act,p_ate:ate});
  if(b) b.disabled=false;
  if(r.error){ toast(/function|qr_|schema cache/i.test(r.error.message||"")?"Falta rodar o int-qrcode-controle.sql no Supabase.":"Não foi possível atualizar o QR Code."); return; }
  const msg={mostrar:"QR Code na tela.",mostrar30:"QR Code na tela por 30 segundos.",esconder:"QR Code escondido.",iniciar:"Contagem da agenda iniciada agora.",padrao:"Agenda voltou para as 9h.",auto_on:"Agenda automática ligada.",auto_off:"Agenda automática desligada."}[act];
  if(msg) toast(msg);
  sqQrSig=""; loadSalaQs();
}

/* ---------- Sala de controle: criar quiz ou votação ---------- */
let sqForm=null;
function salaCreateHtml(){
  const f=sqForm;
  if(!f) return `<div class="sqf-bar"><button class="btn primary" id="sqfNew" type="button">+ Novo quiz ou votação</button></div>`;
  return `<div class="sala-card sqf-form">
    <div class="sala-h"><h3>Novo quiz ou votação</h3></div>
    ${ativTipoSeg(f.tipo,'data-sqf="tipo"')}
    <input class="cf-q" id="sqfQ" maxlength="300" placeholder="${f.tipo==="enquete"?"Ex.: Qual ferramenta você mais usa no dia a dia?":"Ex.: Qual atalho cola um texto?"}" value="${esc(f.pergunta)}">
    <div class="cf-opts">${f.opcoes.map((o,i)=>`<div class="cf-opt${f.tipo!=="enquete"&&f.correta===o.id?" cor":""}">
      ${f.tipo==="enquete"?"":`<input type="radio" name="sqf-cor" data-sqf="cor" data-oid="${o.id}" ${f.correta===o.id?"checked":""} aria-label="Resposta certa">`}
      <b>${QZ_LETTERS[i]}</b><input class="cf-ot sqf-ot" data-oi="${i}" maxlength="120" placeholder="Alternativa ${QZ_LETTERS[i]}" value="${esc(o.t)}">
      ${f.opcoes.length>2?`<button class="icon-btn" type="button" data-sqf="rm" data-oi="${i}" aria-label="Remover alternativa"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`:""}
    </div>`).join("")}
    ${f.opcoes.length<5?'<button class="linkbtn" type="button" data-sqf="add">+ Adicionar alternativa</button>':""}</div>
    ${f.tipo==="enquete"?"":`<p class="cq-note">Marque a bolinha da resposta certa.</p><input class="cf-q sqf-exp" id="sqfExp" maxlength="300" placeholder="Explicação curta que aparece com o resultado (opcional)" value="${esc(f.explicacao||"")}">`}
    <div class="cf-row"><span class="meta">Gráfico na tela:</span>${ativGrafSeg(f.grafico,'data-sqf="graf"')}</div>
    <div class="cf-acts"><button class="btn primary" type="button" data-sqf="open">Criar e abrir agora</button><button class="btn ghost" type="button" data-sqf="save">Só criar (rascunho)</button><button class="linkbtn" type="button" data-sqf="cancel">Cancelar</button></div>
  </div>`;
}
function wireSalaCreate(){
  const nb=$("#sqfNew"); if(nb) nb.addEventListener("click",()=>{ sqForm={tipo:"quiz",grafico:"barras",pergunta:"",opcoes:[{id:"a",t:""},{id:"b",t:""},{id:"c",t:""}],correta:null,explicacao:""}; sqSig=""; renderSalaQs(); const q=$("#sqfQ"); if(q) q.focus(); });
  if(!sqForm) return;
  const q=$("#sqfQ"); if(q) q.addEventListener("input",()=>{ sqForm.pergunta=q.value; });
  const ex=$("#sqfExp"); if(ex) ex.addEventListener("input",()=>{ sqForm.explicacao=ex.value; });
  document.querySelectorAll("#salaOv .sqf-ot").forEach(i=>i.addEventListener("input",()=>{ sqForm.opcoes[+i.dataset.oi].t=i.value; }));
  document.querySelectorAll("#salaOv [data-sqf]").forEach(b=>{ const ev=b.type==="radio"?"change":"click"; b.addEventListener(ev,()=>salaCreateAction(b.dataset.sqf,b)); });
}
async function salaCreateAction(act,b){
  const f=sqForm; if(!f) return;
  if(act==="tipo"){ f.tipo=b.dataset.v; if(f.tipo==="enquete") f.correta=null; }
  else if(act==="graf") f.grafico=b.dataset.v;
  else if(act==="cor") f.correta=b.dataset.oid;
  else if(act==="add"){ const used=new Set(f.opcoes.map(o=>o.id)); f.opcoes.push({id:"abcdefgh".split("").find(c=>!used.has(c)),t:""}); }
  else if(act==="rm"){ const rm=f.opcoes.splice(+b.dataset.oi,1)[0]; if(f.correta===rm.id) f.correta=null; }
  else if(act==="cancel") sqForm=null;
  else if(act==="save"||act==="open"){
    const pergunta=(f.pergunta||"").trim(), opts=f.opcoes.map(o=>({id:o.id,t:(o.t||"").trim()})).filter(o=>o.t), enq=f.tipo==="enquete";
    if(pergunta.length<3){ toast("Escreva a pergunta."); return; }
    if(opts.length<2){ toast("Preencha pelo menos 2 alternativas."); return; }
    if(!enq&&(!f.correta||!opts.find(o=>o.id===f.correta))){ toast("Marque qual alternativa é a certa."); return; }
    b.disabled=true;
    const id=uuidv4(), ordem=((sqActs||[]).reduce((m,a)=>Math.max(m,a.ordem||0),0))+10;
    const {error}=await SB.from("int_atividades").insert({id,episode_id:sqEp,tipo:enq?"enquete":"quiz",grafico:f.grafico,pergunta,opcoes:opts,correta:enq?null:f.correta,explicacao:enq?"":(f.explicacao||"").trim(),ordem});
    if(error){ b.disabled=false; toast(/tipo|grafico/.test(error.message||"")?"Falta rodar o int-interacoes-votacao.sql no Supabase.":"Não foi possível criar."); return; }
    if(sqKnown) sqKnown.add(id);
    if(act==="open"){ const r=await SB.rpc("int_atividade_estado",{p_atividade:id,p_estado:"aberta"}); toast(r.error?"Criado, mas não foi possível abrir.":`${enq?"Votação aberta":"Quiz aberto"} para o público.`); }
    else toast(enq?"Votação criada como rascunho.":"Quiz criado como rascunho.");
    sqForm=null; sqSig=""; loadSalaQs(); return;
  }
  b.blur&&b.blur(); sqSig=""; renderSalaQs();
  if(act==="add"){ const l=[...document.querySelectorAll("#salaOv .sqf-ot")].pop(); if(l) l.focus(); }
}

/* =================== Pontuação: entrar e pontuar (C2) =================== */
let lsPart={nome:null,checked:false,anon:false,asked:false};
const partKeyNome="akicast-part-nome";
const partKeyAnon=ep=>"akicast-part-anon-"+ep;
function partAnonAllowed(){ return (listenEp&&listenEp.program)!=="learning"; }
async function loadPart(){
  if(!listenEp||!SB) return;
  if(!pontAtiva()){ lsPart.checked=true; renderPartChip(); return; }
  lsPart.anon = partAnonAllowed() && lsGet(partKeyAnon(listenEp.id))==="1";
  const r=await SB.rpc("int_meu_participante",{p_episode:listenEp.id,p_aparelho:meuAparelho()});
  lsPart.checked=true;
  if(r.error){ lsPart.off=true; renderPartChip(); return; }  // SQL ainda não rodado: não bloqueia
  lsPart.nome=r.data||null;
  renderPartChip();
}
function pontAtiva(){ return !!(listenEp&&listenEp.pontuacao); }
function partReady(){ return !pontAtiva() || lsPart.off || !!lsPart.nome || (lsPart.anon && partAnonAllowed()); }
function renderPartChip(){
  const el=$("#lsPart"); if(!el) return;
  if(!pontAtiva()){ el.innerHTML=""; return; }
  if(lsPart.off||!lsPart.checked){ el.innerHTML=""; return; }
  if(lsPart.nome) el.innerHTML=`<span class="pt-ic" aria-hidden="true">🎁</span><span>Pontuando como <b>${esc(lsPart.nome)}</b></span><button class="linkbtn" type="button" id="ptChange">Trocar</button>`;
  else if(lsPart.anon) el.innerHTML=`<span class="pt-ic" aria-hidden="true">🙈</span><span>Respondendo sem pontuar</span><button class="linkbtn" type="button" id="ptChange">Entrar e pontuar</button>`;
  else el.innerHTML=`<span class="pt-ic" aria-hidden="true">🎁</span><span>Responda com seu nome para pontuar e concorrer a brindes</span><button class="linkbtn" type="button" id="ptChange">Entrar</button>`;
  const b=$("#ptChange"); if(b) b.addEventListener("click",()=>openPartModal(null,true));
}
function ensurePart(next){
  if(!lsPart.checked){ loadPart().then(()=>ensurePart(next)); return; }
  if(partReady()) return next();
  openPartModal(next,false);
}
function openPartModal(next,trocar){
  const old=document.getElementById("ptModal"); if(old) old.remove();
  const salvo=lsGet(partKeyNome)||"";
  const confirmMode=!trocar && !!salvo && !lsPart.nome;
  const ov=document.createElement("div"); ov.id="ptModal"; ov.className="lq-confirm-ov";
  ov.innerHTML=`<div class="lq-confirm pt-card" role="dialog" aria-modal="true" aria-labelledby="ptT">
    <div class="pt-gift" aria-hidden="true">🎁</div>
    ${confirmMode?`
      <h2 id="ptT">Você é ${esc(salvo)}?</h2>
      <p class="meta pt-sub">Usamos o nome que você digitou da última vez para contar seus pontos nesta live.</p>
      <button class="btn primary big" type="button" id="ptOk">Sim, continuar</button>
      <button class="btn ghost" type="button" id="ptOther">Não, trocar nome</button>`
    :`
      <h2 id="ptT">Digite seu nome para acumular pontos e ganhar brindes!</h2>
      <label class="field"><span>Nome completo</span><input id="ptNome" type="text" maxlength="80" autocomplete="name" placeholder="Ex.: Clark Kent" value="${esc(lsPart.nome||salvo)}"></label>
      <span class="listen-err" id="ptErr" role="alert"></span>
      <div class="pt-lock"><span aria-hidden="true">🔒</span><span>Suas perguntas na transmissão continuam <b>100% anônimas</b> para todos.</span></div>
      <button class="btn primary big" type="button" id="ptOk">Entrar e pontuar 🚀</button>`}
    ${partAnonAllowed()?`<button class="linkbtn pt-skip" type="button" id="ptSkip">${lsPart.nome?"Parar de pontuar nesta live":"Responder sem pontuar"}</button>`:""}
    <div class="pt-privacy"><span>🛡️ Compromisso de privacidade</span><p>Seu nome é usado exclusivamente para contar a pontuação e identificar quem ganhou na entrega dos prêmios. O nome completo não aparece na transmissão nem para os outros participantes. Se você ficar no pódio, pode aparecer na tela só o seu primeiro nome com a inicial do sobrenome.</p></div>
    <button class="linkbtn pt-close" type="button" id="ptClose" aria-label="Fechar">Fechar</button>
  </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.addEventListener("click",e=>{ if(e.target===ov) close(); });
  $("#ptClose").addEventListener("click",close);
  const skip=$("#ptSkip"); if(skip) skip.addEventListener("click",()=>{ lsPart.anon=true; lsPart.nome=null; lsSet(partKeyAnon(listenEp.id),"1"); close(); renderPartChip(); toast("Você vai responder sem pontuar. Dá para entrar a qualquer momento."); if(next) next(); });
  const other=$("#ptOther"); if(other) other.addEventListener("click",()=>{ close(); openPartModal(next,true); });
  const ok=$("#ptOk");
  const save=async nome=>{
    ok.disabled=true;
    const r=await SB.rpc("int_participar",{p_episode:listenEp.id,p_aparelho:meuAparelho(),p_nome:nome});
    ok.disabled=false;
    if(r.error){ const e=$("#ptErr"); const m=/nome completo/i.test(r.error.message||"")?"Digite seu nome completo (nome e sobrenome).":"Não foi possível salvar. Tente de novo."; if(e) e.textContent=m; else toast(m); return; }
    lsPart.nome=nome.replace(/\s+/g," ").trim(); lsPart.anon=false; lsSet(partKeyNome,lsPart.nome); lsSet(partKeyAnon(listenEp.id),"");
    close(); renderPartChip(); toast("Pronto! Suas respostas vão somar pontos."); if(next) next();
  };
  ok.addEventListener("click",()=>{
    if(confirmMode) return save(salvo);
    const v=($("#ptNome").value||"").replace(/\s+/g," ").trim();
    if(v.length<5||v.indexOf(" ")<0){ $("#ptErr").textContent="Digite seu nome completo (nome e sobrenome)."; $("#ptNome").focus(); return; }
    save(v);
  });
  const inp=$("#ptNome"); if(inp){ inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); ok.click(); } }); setTimeout(()=>inp.focus(),40); }
  else setTimeout(()=>ok.focus(),40);
}

/* =================== Sala: pontuação e ranking (C4) =================== */
let sqRank=null, sqRankErr=null;
async function loadSalaRank(){
  if(!sqEp||!SESSION||SESSION.papel!=="admin"){ sqRank=null; return; }
  if(sqTab!=="rank" && sqTab!=="sort" && sqRank) return;   // só atualiza com a aba aberta
  const r=await SB.rpc("int_ranking",{p_episode:sqEp});
  if(r.error){ sqRankErr=/function|schema cache|int_ranking/i.test(r.error.message||"")?"sql":"erro"; sqRank=[]; return; }
  sqRankErr=null; sqRank=r.data||[];
}
const fmtSeg=ms=>{ const s=(Number(ms)||0)/1000; return s<60?s.toFixed(1).replace(".",",")+" s":Math.floor(s/60)+" min "+Math.round(s%60)+" s"; };
function salaRankHtml(){
  const closed=sqTela&&sqTela.pontos_encerrados_em;
  if(sqRankErr==="sql") return `<div class="sala-card"><h3>Pontuação</h3><div class="warn">Para ver o ranking, rode os arquivos int-participantes.sql, int-pontuacao.sql e int-encerrar-participacoes.sql no Supabase.</div></div>`;
  const rows=sqRank||[];
  const medal=["🥇","🥈","🥉"];
  return `<div class="sala-card rank-card">
    <div class="sala-h"><h3>${closed?"Ranking final":"Pontuação ao vivo"}</h3>${closed?`<span class="air-pill">Encerrado às ${hhmm(closed)}</span>`:'<span class="air-pill on"><span class="dotc on"></span>Participações abertas</span>'}</div>
    <p class="meta rank-rules">Check-in: 10. Quiz: 40 · 35 · 30 · 25 por acerto, pela ordem. Votação: 5. Pergunta: 3 (até 3). Votos recebidos nas perguntas: 1 cada (até 10). Só conta quem entrou com o nome.${rows.some(r=>r.pontos_checkin)?` · <b>${rows.filter(r=>r.pontos_checkin).length} check-ins</b>`:""}</p>
    <div class="rank-acts">${closed
      ?`<button class="btn ghost sm" data-rk="reabrir" type="button">Reabrir participações</button><span class="meta">O ranking não muda mais. O sorteio usa esta lista.</span>`
      :`<button class="btn primary" data-rk="encerrar" type="button">Encerrar participações</button><span class="meta">Fecha o que estiver aberto e congela os pontos.</span>`}</div>
    ${rows.length?`<div class="rank-wrap"><table class="rank-tbl">
      <thead><tr><th>#</th><th>Nome</th><th>Pontos</th><th title="Pontos de check-in, quiz, votação, perguntas feitas e votos recebidos nas perguntas">Check · Quiz · Vot · Perg · Votos</th><th title="Acertos e quantos 1º, 2º e 3º lugares">Acertos (1º/2º/3º)</th><th title="Soma do tempo de resposta nos acertos (desempate)">Tempo</th></tr></thead>
      <tbody>${rows.map(r=>`<tr class="${r.posicao<=3?"top top"+r.posicao:""}">
        <td>${r.posicao<=3?medal[r.posicao-1]:r.posicao}</td><td class="rk-nome">${esc(r.nome)}</td><td class="rk-pts">${r.pontos}</td>
        <td class="rk-sub">${r.pontos_checkin||0} · ${r.pontos_quiz} · ${r.pontos_votacao} · ${r.pontos_perguntas} · ${r.pontos_votos||0}</td>
        <td class="rk-sub">${r.acertos} (${r.primeiros}/${r.segundos}/${r.terceiros})</td><td class="rk-sub">${fmtSeg(r.tempo_ms)}</td></tr>`).join("")}</tbody>
    </table></div>`:'<p class="meta">Ninguém entrou com o nome ainda. Quem responder quiz ou votação com o nome aparece aqui.</p>'}
  </div>`;
}
async function rankAction(act,b){
  if(act==="encerrar" && !confirmInline(b,"Encerrar de vez?")) return;
  if(act==="reabrir" && !confirmInline(b,"Reabrir mesmo?")) return;
  if(b) b.disabled=true;
  const r=await SB.rpc("int_encerrar_participacoes",{p_episode:sqEp,p_encerrar:act==="encerrar"});
  if(b) b.disabled=false;
  if(r.error){ toast(/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-encerrar-participacoes.sql no Supabase.":"Não foi possível atualizar."); return; }
  toast(act==="encerrar"?"Participações encerradas. O ranking está congelado.":"Participações reabertas.");
  sqRank=null; sqSig=""; loadSalaQs();
}

/* =================== Sala: sorteio e Top 3 (C5) =================== */
let sqSorteio=null, sqSorteioErr=false;
async function loadSalaSorteio(){
  if(!sqEp||!SESSION||SESSION.papel!=="admin"){ sqSorteio=null; return; }
  if(sqTab!=="rank"&&sqTab!=="sort") return;
  const r=await SB.from("int_sorteio").select("top3,enviado_em").eq("episode_id",sqEp).maybeSingle();
  if(r.error){ sqSorteioErr=true; sqSorteio=null; return; }
  sqSorteioErr=false; sqSorteio=r.data||null;
}
function top3Text(list){
  const ep=episodes.find(e=>e.id===sqEp)||{};
  return `Top 3 do ${PN()} de ${fmtLong(ep.date).toLowerCase()}${ep.theme?" ("+ep.theme+")":""}\n`+list.map(r=>`${r.posicao}º · ${r.nome} · ${r.pontos} pontos`).join("\n");
}
function salaSorteioHtml(){
  if(sqSorteioErr||sqRankErr==="sql") return `<div class="sala-card"><h3>Sorteio</h3><div class="warn">Para usar o sorteio, rode os arquivos de pontuação no Supabase, terminando pelo int-sorteio.sql.</div></div>`;
  const closed=sqTela&&sqTela.pontos_encerrados_em;
  const top=(sqRank||[]).slice(0,3);
  const medal=["🥇","🥈","🥉"];
  const sent=sqSorteio&&Array.isArray(sqSorteio.top3)?sqSorteio.top3:null;
  const podium=list=>list.length?`<div class="podium">${list.map(r=>`<div class="pod pod${r.posicao}"><span class="pod-m">${medal[r.posicao-1]||r.posicao}</span><b>${esc(r.nome)}</b><span>${r.pontos} pontos · ${r.acertos} ${r.acertos===1?"acerto":"acertos"}</span></div>`).join("")}</div>`:'<p class="meta">Ninguém pontuou nesta live.</p>';
  if(!closed) return `<div class="sala-card sort-card">
      <div class="sala-h"><h3>Sorteio</h3><span class="air-pill">Prévia</span></div>
      <div class="warn">Encerre as participações na aba <b>Pontuação</b> para fechar o ranking final. Só depois disso dá para enviar o Top 3.</div>
      <div class="sort-preview">${podium(top)}</div>
      <button class="btn ghost sm" data-so="irrank" type="button">Ir para a aba Pontuação</button>
    </div>`;
  return `<div class="sala-card sort-card">
      <div class="sala-h"><h3>🏆 Sorteio · Top 3</h3>${sent?`<span class="air-pill on"><span class="dotc on"></span>Enviado às ${hhmm(sqSorteio.enviado_em)}</span>`:'<span class="air-pill">Ranking final</span>'}</div>
      ${podium(top)}
      <div class="sort-acts">
        ${sent?`<button class="btn primary" data-so="enviar" type="button">Reenviar Top 3</button><button class="btn ghost" data-so="recolher" type="button">Recolher do apresentador</button>`
              :`<button class="btn primary big" data-so="enviar" type="button" ${top.length?"":"disabled"}>Enviar Top 3 para o apresentador</button>`}
        ${top.length?`<button class="linkbtn" data-so="copiar" type="button">Copiar lista</button>`:""}
      </div>
      <div class="sort-tela">
        <div><b>Pódio no telão</b><span class="meta">Mostra só o primeiro nome e a inicial do sobrenome (ex.: “Bruno R.”).</span></div>
        ${sqTela&&Array.isArray(sqTela.podio)?`<span class="air-pill on"><span class="dotc on"></span>No ar · ${{destaque:"Destaque",faixa:"Faixa",lateral:"Lateral"}[sqTela.podio_formato||"destaque"]}</span>`:""}
      </div>
      <div class="sort-fmt"><span class="meta">Formato:</span><div class="seg" role="group" aria-label="Formato do pódio">${[["destaque","Destaque"],["faixa","Faixa"],["lateral","Lateral"]].map(([k,t])=>{ const cur=sqTela&&Array.isArray(sqTela.podio)?(sqTela.podio_formato||"destaque"):podioFmt; return `<button class="seg-b${cur===k?" on":""}" data-pf="${k}" type="button">${t}</button>`; }).join("")}</div>
        ${sqTela&&Array.isArray(sqTela.podio)?`<button class="btn ghost sm" data-po="tirar" type="button">Tirar da tela</button>`:`<button class="btn sm tela-b" data-po="mostrar" type="button" ${top.length?"":"disabled"}>Mostrar no telão</button>`}
      </div>
      <p class="meta sort-note">${sent?"O apresentador vê o Top 3 no controle dele e decide como fazer o sorteio ou a premiação.":"Ao enviar, o Top 3 aparece no controle do apresentador. Os nomes não vão para a tela da transmissão."}</p>
    </div>`;
}
async function sorteioAction(act,b){
  if(act==="irrank"){ sqTab="rank"; lsSet("akicast-sala-tab","rank"); sqRank=null; sqSig=""; loadSalaQs(); return; }
  if(act==="copiar"){ const t=top3Text((sqRank||[]).slice(0,3)); try{ await navigator.clipboard.writeText(t); toast("Lista do Top 3 copiada."); }catch(e){ toast("Não foi possível copiar."); } return; }
  if(act==="recolher" && !confirmInline(b,"Recolher mesmo?")) return;
  if(b) b.disabled=true;
  const r=await SB.rpc("int_enviar_top3",{p_episode:sqEp,p_enviar:act==="enviar"});
  if(b) b.disabled=false;
  if(r.error){ toast(/Encerre/i.test(r.error.message||"")?"Encerre as participações antes de enviar.":/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-sorteio.sql no Supabase.":"Não foi possível enviar."); return; }
  toast(act==="enviar"?"Top 3 enviado para o apresentador.":"Top 3 recolhido do apresentador.");
  sqSig=""; loadSalaQs();
}

/* =================== Pódio no telão (C7) =================== */
function podioInner(list,formato){
  if(!list||!list.length) return "";
  const medal=["🥇","🥈","🥉"];
  if(formato==="faixa") return `<div class="opf">${list.map(r=>`<div class="opf-c opf${r.posicao}"><span class="opf-m">${medal[r.posicao-1]||r.posicao}</span><div><b>${esc(r.nome)}</b><span>${r.pontos} pontos</span></div></div>`).join("")}</div>`;
  if(formato==="lateral") return `<div class="opl"><span class="opl-t">Pódio da live</span>${list.map(r=>`<div class="opl-r opl${r.posicao}"><span class="opl-m">${medal[r.posicao-1]||r.posicao}</span><b>${esc(r.nome)}</b><em>${r.pontos} pts</em></div>`).join("")}</div>`;
  return `<div class="opd"><div class="opd-card">
    <div class="ovd-stripe"></div>
    <div class="ovd-top"><img src="${esc(PG().logo||AKICAST_LOGO_SRC||"img/akicast-logo.png")}" alt=""><span>Pódio da live</span></div>
    <div class="opd-row">${list.map(r=>`<div class="opd-col opd${r.posicao}"><span class="opd-m">${medal[r.posicao-1]||r.posicao}</span><b>${esc(r.nome)}</b><span class="opd-pts">${r.pontos} pontos</span><i class="opd-base">${r.posicao}</i></div>`).join("")}</div>
    <p class="opd-foot">Parabéns e obrigado a todos que participaram!</p>
  </div></div>`;
}
let ovPodioKey="", ovEpRow=null, podioFmt=["destaque","faixa","lateral"].includes(lsGet("akicast-podio-fmt"))?lsGet("akicast-podio-fmt"):"destaque";
function showPodio(list,formato){
  const c=$("#ovPodio"); if(!c) return;
  const key=list&&list.length?(formato||"destaque")+JSON.stringify(list):"";
  if(key===ovPodioKey) return; ovPodioKey=key;
  const cur=c.firstElementChild;
  const enter=()=>{ c.innerHTML=podioInner(list,formato); const el=c.firstElementChild; if(el){ el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering"))); } };
  if(cur){ cur.classList.add("leaving"); setTimeout(()=>{ if(ovPodioKey===key) enter(); },450); } else if(key) enter();
}
async function podioAction(act,b){
  if(b) b.disabled=true;
  if(act==="mostrar" && sqTela){
    const zonaP=podioFmt==="destaque"?"centro":podioFmt==="faixa"?"base":"lateral";
    const zonaT=sqTela.atividade_id?(sqTela.formato==="quiz_faixa"?"base":"centro"):(sqTela.pergunta_id?(sqTela.formato==="faixa"?"base":"centro"):null);
    await clearMultiIfConflict(zonaP);
    if(zonaT && zonaT===zonaP){ await SB.rpc("int_mostrar",{p_episode:sqEp,p_pergunta:null}); toast(sqTela.atividade_id?"O quiz saiu da tela para dar lugar ao pódio.":"A pergunta saiu da tela para dar lugar ao pódio."); }
  }
  let r=await SB.rpc("int_mostrar_podio",{p_episode:sqEp,p_mostrar:act==="mostrar",p_formato:podioFmt});
  if(r.error && /p_formato|function|schema cache/i.test(r.error.message||"")) r=await SB.rpc("int_mostrar_podio",{p_episode:sqEp,p_mostrar:act==="mostrar"});
  if(b) b.disabled=false;
  if(r.error){ toast(/Encerre/i.test(r.error.message||"")?"Encerre as participações antes de mostrar o pódio.":/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-podio.sql no Supabase.":"Não foi possível atualizar o pódio."); return; }
  toast(act==="mostrar"?`Pódio no telão · ${{destaque:"Destaque",faixa:"Faixa",lateral:"Lateral"}[podioFmt]}.`:"Pódio retirado da tela.");
  sqSig=""; loadSalaQs();
}

/* =================== Vários na tela (grade, lateral, faixa que alterna) =================== */
const MULTI_LIM={grade:4,lateral:3,faixa:8};
const MULTI_NOME={grade:"Grade",lateral:"Lateral",faixa:"Alternando"};
const multiZona=l=>l==="grade"?"centro":l==="lateral"?"lateral":"base";
function multiItemCard(it,compact){
  if(it.kind==="perg") return `<div class="omc" data-mid="${esc(it.id)}"><div class="omc-h"><span class="omc-n">${it.n}</span><b>${esc(it.q)}</b></div><div class="omc-m">${esc(it.nome||"Anônimo")} · ${it.votos} ${it.votos===1?"voto":"votos"}</div></div>`;
  const done=it.estado==="encerrada", cor=done&&it.tipo!=="enquete"?it.correta:null, pct=it.pct||{};
  const ops=(it.opcoes||[]).slice(0,compact?3:5);
  return `<div class="omc" data-mid="${esc(it.id)}"><div class="omc-h"><span class="omc-n">${it.n}</span><b>${esc(it.q)}</b>${done?`<span class="omc-res">resultado</span>`:""}</div>
    ${ops.map((o,k)=>{ const p=pct[o.id]||0, ok=cor===o.id; return `<div class="omc-o${ok?" ok":""}${cor&&!ok?" no":""}" style="--oc:${CHART_COLORS[k%CHART_COLORS.length]}" data-oid="${esc(o.id)}"><i style="width:${p}%"></i><span class="omc-l">${QZ_LETTERS[k]}</span><span class="omc-t">${esc(o.t)}</span><em>${p}%</em>${ok?"<strong>✓</strong>":""}</div>`; }).join("")}</div>`;
}
function multiInner(items,layout,tipo,idx){
  if(!items||!items.length) return "";
  const head=tipo==="quiz"?"Quiz e votação · responda pela plataforma":"Perguntas do público";
  if(layout==="grade") return `<div class="omg"><div class="omg-in"><div class="omg-t">${head}</div><div class="omg-grid n${items.length}">${items.map(it=>multiItemCard(it,false)).join("")}</div></div></div>`;
  if(layout==="lateral") return `<div class="oml"><div class="oml-t">${tipo==="quiz"?"Quiz e votação":"Perguntas da fila"}</div>${items.map(it=>multiItemCard(it,true)).join("")}</div>`;
  const i=((idx||0)%items.length+items.length)%items.length, it=items[i];
  return `<div class="omf"><span class="omf-pos">${i+1} de ${items.length}</span><div class="omf-body">${multiItemCard(it,false)}</div><span class="omf-dots">${items.map((_,k)=>`<i class="${k===i?"on":""}"></i>`).join("")}</span></div>`;
}
async function fetchMultiItems(m,client){
  const ids=Array.isArray(m&&m.ids)?m.ids:[]; if(!ids.length) return [];
  const C=client||SB;
  if(m.tipo==="quiz"){
    let r=await C.from("int_atividades").select("id,pergunta,opcoes,estado,tipo").in("id",ids);
    const rows=r.data||[];
    const res=await Promise.all(rows.map(a=>C.rpc("int_quiz_resultado",{p_atividade:a.id}).then(x=>x.data||null)));
    const map={}; rows.forEach((a,k)=>map[a.id]={kind:"quiz",id:a.id,q:a.pergunta,opcoes:qzOpts(a),estado:a.estado,tipo:a.tipo,pct:(res[k]&&res[k].pct)||{},correta:res[k]&&res[k].correta});
    return ids.map((id,k)=>map[id]?{...map[id],n:k+1}:null).filter(Boolean);
  }
  const r=await C.from("int_perguntas").select("id,texto,nome,votos").in("id",ids);
  const map={}; (r.data||[]).forEach(p=>map[p.id]={kind:"perg",id:p.id,q:p.texto,nome:p.nome,votos:p.votos});
  return ids.map((id,k)=>map[id]?{...map[id],n:k+1}:null).filter(Boolean);
}
/* ---------- Tela do OBS ---------- */
let ovMultiKey="", ovMultiItems=[], ovMultiIdx=0, ovMultiTimer=null, ovMultiLayout=null, ovMultiTipo=null;
async function showMulti(m){
  const c=$("#ovMulti"); if(!c) return;
  if(!m||!Array.isArray(m.ids)||!m.ids.length){ ovMultiKey=""; ovMultiItems=[]; clearInterval(ovMultiTimer); ovMultiTimer=null; const cur=c.firstElementChild; if(cur){ cur.classList.add("leaving"); setTimeout(()=>{ if(!ovMultiKey) c.innerHTML=""; },450); } return; }
  const items=await fetchMultiItems(m);
  const key=m.tipo+"|"+m.layout+"|"+m.ids.join(",");
  ovMultiItems=items; ovMultiLayout=m.layout; ovMultiTipo=m.tipo;
  if(key===ovMultiKey){ patchMulti(); return; }
  ovMultiKey=key; ovMultiIdx=0;
  const enter=()=>{ c.innerHTML=multiInner(items,m.layout,m.tipo,0); const el=c.firstElementChild; if(el){ el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering"))); } };
  const cur=c.firstElementChild; if(cur){ cur.classList.add("leaving"); setTimeout(enter,450); } else enter();
  clearInterval(ovMultiTimer); ovMultiTimer=null;
  if(m.layout==="faixa" && items.length>1) ovMultiTimer=setInterval(rotateMulti,9000);
}
function patchMulti(){
  const c=$("#ovMulti"); if(!c) return;
  ovMultiItems.forEach(it=>{
    const card=c.querySelector(`.omc[data-mid="${it.id}"]`); if(!card) return;
    if(it.kind==="perg"){ const m=card.querySelector(".omc-m"); if(m) m.textContent=`${it.nome||"Anônimo"} · ${it.votos} ${it.votos===1?"voto":"votos"}`; return; }
    const wasDone=!!card.querySelector(".omc-res"); if(wasDone!==(it.estado==="encerrada")){ card.outerHTML=multiItemCard(it,ovMultiLayout==="lateral"); return; }
    card.querySelectorAll(".omc-o[data-oid]").forEach(o=>{ const p=(it.pct||{})[o.dataset.oid]||0; const i=o.querySelector("i"), e=o.querySelector("em"); if(i) i.style.width=p+"%"; if(e) e.textContent=p+"%"; });
  });
}
function rotateMulti(){
  const c=$("#ovMulti"); if(!c||!ovMultiItems.length) return;
  ovMultiIdx=(ovMultiIdx+1)%ovMultiItems.length;
  const body=c.querySelector(".omf-body"), pos=c.querySelector(".omf-pos"), dots=c.querySelector(".omf-dots");
  if(!body){ c.innerHTML=multiInner(ovMultiItems,"faixa",ovMultiTipo,ovMultiIdx); return; }
  body.classList.add("swap");
  setTimeout(()=>{ body.innerHTML=multiItemCard(ovMultiItems[ovMultiIdx],false); if(pos) pos.textContent=`${ovMultiIdx+1} de ${ovMultiItems.length}`; if(dots) dots.innerHTML=ovMultiItems.map((_,k)=>`<i class="${k===ovMultiIdx?"on":""}"></i>`).join(""); body.classList.remove("swap"); },300);
}
/* ---------- Sala de controle ---------- */
const sqMultiSel={quiz:new Set(),perg:new Set()};
let sqMultiLayout=["grade","lateral","faixa"].includes(lsGet("akicast-multi-layout"))?lsGet("akicast-multi-layout"):"lateral";
function multiOnAir(tipo){ const m=sqTela&&sqTela.multi; return m&&Array.isArray(m.ids)&&m.ids.length&&(!tipo||m.tipo===tipo)?m:null; }
function multiBarHtml(tipo){
  const sel=sqMultiSel[tipo], on=multiOnAir(tipo), lay=on?on.layout:sqMultiLayout, lim=MULTI_LIM[lay];
  if(!sel.size && !on) return `<p class="meta mt-hint">Marque <b>“Na tela”</b> em ${tipo==="quiz"?"até 4 itens":"até 4 perguntas"} para mostrar vários ao mesmo tempo no telão.</p>`;
  const over=sel.size>lim;
  return `<div class="mt-bar">
    <div class="mt-row"><b>Vários na tela</b>${on?`<span class="air-pill on"><span class="dotc on"></span>No ar · ${MULTI_NOME[on.layout]} · ${on.ids.length}</span>`:""}</div>
    <div class="mt-row"><div class="seg" role="group" aria-label="Layout">${["grade","lateral","faixa"].map(k=>`<button class="seg-b${lay===k?" on":""}" data-mtl="${k}" data-mtt="${tipo}" type="button">${MULTI_NOME[k]} <small>até ${MULTI_LIM[k]}</small></button>`).join("")}</div></div>
    <div class="mt-row">
      ${sel.size?`<button class="btn primary sm" data-mta="mostrar" data-mtt="${tipo}" type="button" ${over?"disabled":""}>${on?"Trocar pelos selecionados":"Mostrar selecionados"} (${sel.size})</button>`:""}
      ${on?`<button class="btn ghost sm" data-mta="tirar" data-mtt="${tipo}" type="button">Tirar da tela</button>`:""}
      ${sel.size?`<button class="linkbtn" data-mta="limpar" data-mtt="${tipo}" type="button">Limpar seleção</button>`:""}
      ${over?`<span class="mt-warn">Este layout mostra no máximo ${lim}.</span>`:""}
    </div>
  </div>`;
}
function multiCheck(tipo,id){ const sel=sqMultiSel[tipo], on=multiOnAir(tipo), inAir=on&&on.ids.includes(id); return `<label class="mt-chk${inAir?" air":""}" title="Selecionar para mostrar vários na tela"><input type="checkbox" data-mtc="${esc(id)}" data-mtt="${tipo}" ${sel.has(id)?"checked":""}> ${inAir?`Na tela (${on.ids.indexOf(id)+1})`:"Na tela"}</label>`; }
async function clearMultiIfConflict(zona){
  const on=multiOnAir(); if(!on) return;
  if(multiZona(on.layout)===zona){ await SB.rpc("int_mostrar_multi",{p_episode:sqEp,p_tipo:on.tipo,p_ids:[],p_layout:on.layout}); toast("Os itens em “vários na tela” saíram para dar lugar ao novo conteúdo."); }
}
async function multiAction(act,tipo,b){
  if(act==="limpar"){ sqMultiSel[tipo].clear(); sqSig=""; renderSalaQs(); return; }
  if(b) b.disabled=true;
  let r;
  if(act==="tirar"){ const on=multiOnAir(tipo); r=await SB.rpc("int_mostrar_multi",{p_episode:sqEp,p_tipo:tipo,p_ids:[],p_layout:on?on.layout:sqMultiLayout}); }
  else {
    let ids=[...sqMultiSel[tipo]]; const zona=multiZona(sqMultiLayout);
    if(tipo==="quiz") ids.sort((x,y)=>{ const a=(sqActs||[]).find(z=>z.id===x)||{}, b=(sqActs||[]).find(z=>z.id===y)||{}; return (a.ordem||0)-(b.ordem||0)||String(a.aberta_em||"").localeCompare(String(b.aberta_em||"")); });
    // a mesma região da tela não fica com duas coisas
    if(sqTela){
      const zt=sqTela.atividade_id?(sqTela.formato==="quiz_faixa"?"base":"centro"):(sqTela.pergunta_id?(sqTela.formato==="faixa"?"base":"centro"):null);
      if(zt===zona) await SB.rpc("int_mostrar",{p_episode:sqEp,p_pergunta:null});
      if(Array.isArray(sqTela.podio)){ const zp=(sqTela.podio_formato||"destaque")==="destaque"?"centro":sqTela.podio_formato==="faixa"?"base":"lateral"; if(zp===zona) await SB.rpc("int_mostrar_podio",{p_episode:sqEp,p_mostrar:false,p_formato:sqTela.podio_formato||"destaque"}); }
    }
    r=await SB.rpc("int_mostrar_multi",{p_episode:sqEp,p_tipo:tipo,p_ids:ids,p_layout:sqMultiLayout});
    if(!r.error) sqMultiSel[tipo].clear();
  }
  if(b) b.disabled=false;
  if(r&&r.error){ toast(/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-varios-na-tela.sql no Supabase.":/máximo/i.test(r.error.message||"")?r.error.message:"Não foi possível atualizar a tela."); return; }
  toast(act==="tirar"?"Itens retirados da tela.":`No telão: ${MULTI_NOME[sqMultiLayout].toLowerCase()} com ${(sqTela&&sqTela.multi&&sqTela.multi.ids&&sqTela.multi.ids.length)||""} itens.`.replace(" com  itens",""));
  sqSig=""; loadSalaQs();
}
function wireMulti(){
  document.querySelectorAll("#salaOv [data-mtc]").forEach(c=>c.addEventListener("change",()=>{ const s=sqMultiSel[c.dataset.mtt]; if(c.checked) s.add(c.dataset.mtc); else s.delete(c.dataset.mtc); sqSig=""; renderSalaQs(); }));
  document.querySelectorAll("#salaOv [data-mtl]").forEach(b=>b.addEventListener("click",async()=>{ b.blur(); sqMultiLayout=b.dataset.mtl; lsSet("akicast-multi-layout",sqMultiLayout); const on=multiOnAir(b.dataset.mtt);
    if(on && on.layout!==sqMultiLayout){ const lim=MULTI_LIM[sqMultiLayout]; if(on.ids.length>lim){ toast(`O layout ${MULTI_NOME[sqMultiLayout]} mostra no máximo ${lim}.`); sqSig=""; renderSalaQs(); return; }
      sqMultiSel[on.tipo]=new Set(on.ids); await multiAction("mostrar",on.tipo,b); return; }
    sqSig=""; renderSalaQs(); }));
  document.querySelectorAll("#salaOv [data-mta]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); multiAction(b.dataset.mta,b.dataset.mtt,b); }));
}
function multiPreviewItems(){
  const m=multiOnAir(); if(!m) return null;
  if(m.tipo==="quiz") return m.ids.map((id,k)=>{ const a=(sqActs||[]).find(x=>x.id===id); if(!a) return null; const res=sqARes[a.id]||{}; return {kind:"quiz",id,n:k+1,q:a.pergunta,opcoes:qzOpts(a),estado:a.estado,tipo:a.tipo,pct:res.pct||{},correta:res.correta}; }).filter(Boolean);
  return m.ids.map((id,k)=>{ const p=sqRows.find(x=>x.id===id); return p?{kind:"perg",id,n:k+1,q:p.texto,nome:p.nome,votos:p.votos}:null; }).filter(Boolean);
}

/* =================== Capa do YouTube (PNG) =================== */
const CAPA_TPL=window.AKI_ASSETS.capa;
function capaSugestao(ep){
  const prog=ep.program||"akicast";
  const prev=episodes.filter(e=>(e.program||"akicast")===prog && e.id!==ep.id && Number(e.capa_numero) && String(e.date)<=String(ep.date));
  const max=prev.reduce((m,e)=>Math.max(m,Number(e.capa_numero)),0);
  return max?max+1:null;
}
function capaDados(ep){
  const num=ep.capa_numero!=null&&ep.capa_numero!==""?Number(ep.capa_numero):capaSugestao(ep);
  const tit=(ep.capa_titulo||"").trim()||(ep.theme||"").trim();
  return {num, tit, dest:(ep.capa_destaque||"").trim(), prog:ep.program||"akicast"};
}
const capaImgCache={};
function capaImg(src){ if(capaImgCache[src]) return capaImgCache[src]; capaImgCache[src]=new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); return capaImgCache[src]; }
function capaWrap(ctx,words,maxW){ // words: [{t,c}] -> lines of segments
  const lines=[[]]; let w=0;
  words.forEach(wd=>{ const sp=lines[lines.length-1].length?ctx.measureText(" ").width:0, ww=ctx.measureText(wd.t).width;
    if(w+sp+ww>maxW && lines[lines.length-1].length){ lines.push([]); w=0; }
    const L=lines[lines.length-1]; L.push({...wd,x:w+(L.length?ctx.measureText(" ").width:0)}); w+= (L.length>1?ctx.measureText(" ").width:0)+ww; });
  return lines;
}
async function drawCapa(canvas,ep,epId){
  const d=capaDados(ep), W=1920, H=1080; canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d");
  try{ await document.fonts.load('800 100px "Urbanist"'); await document.fonts.load('700 24px "Urbanist"'); await document.fonts.load('500 24px "Urbanist"'); }catch(e){}
  ctx.drawImage(await capaImg(CAPA_TPL[d.prog]||CAPA_TPL.akicast),0,0,W,H);
  if(d.prog!=="akicast"){ try{ const lg=await capaImg((PROGRAMS[d.prog]||{}).logo||LEARNING_LOGO); const lw=165, lh=lw*lg.height/lg.width; ctx.drawImage(lg,32,300+(95-lh)/2,lw,lh); }catch(e){} }
  // número
  if(d.num){ let fs=104; const txt=String(d.num); ctx.fillStyle="#fff"; ctx.textBaseline="alphabetic";
    const total=f=>{ ctx.font=`800 ${f}px Urbanist, system-ui, sans-serif`; const w=ctx.measureText(txt).width; ctx.font=`800 ${Math.round(f*.46)}px Urbanist, system-ui, sans-serif`; return w+4+ctx.measureText("o").width; };
    while(total(fs)>176 && fs>40) fs-=2;
    ctx.font=`800 ${fs}px Urbanist, system-ui, sans-serif`; const w=ctx.measureText(txt).width;
    ctx.font=`800 ${Math.round(fs*.46)}px Urbanist, system-ui, sans-serif`; const wo=ctx.measureText("o").width;
    const x0=Math.round(114-(w+4+wo)/2);   // centralizado na coluna da esquerda
    ctx.font=`800 ${fs}px Urbanist, system-ui, sans-serif`; ctx.fillText(txt,x0,254);
    ctx.font=`800 ${Math.round(fs*.46)}px Urbanist, system-ui, sans-serif`; ctx.fillText("o",x0+w+4,254-fs*.43); }
  // título: parte branca + destaque laranja, em maiúsculas, quebrando linhas
  const words=[...d.tit.toUpperCase().split(/\s+/).filter(Boolean).map(t=>({t,c:"#ffffff",w:500})),...d.dest.toUpperCase().split(/\s+/).filter(Boolean).map(t=>({t,c:d.prog==="culture"?"#14307A":"#ffad40",w:800}))];
  if(words.length){
    let fs=23, lines;
    for(;;){ ctx.font=`700 ${fs}px Urbanist, system-ui, sans-serif`; lines=capaWrap(ctx,words,166); if(lines.length*fs*1.12<=160||fs<=14) break; fs--; }
    lines.forEach((L,i)=>L.forEach(seg=>{ ctx.font=`${seg.w} ${fs}px Urbanist, system-ui, sans-serif`; ctx.fillStyle=seg.c; ctx.fillText(seg.t,32+seg.x,442+i*Math.round(fs*1.12)); }));
  }
  // QR Code da página dos ouvintes
  try{ await loadScript(LIBS.qr); const q=window.qrcode(0,"M"); q.addData(listenLink(epId)); q.make();
    const n=q.getModuleCount(), box=146, x0=40, y0=613; ctx.fillStyle="#fff"; ctx.beginPath(); (ctx.roundRect?ctx.roundRect(x0-3,y0-3,box+6,box+6,10):ctx.rect(x0-3,y0-3,box+6,box+6)); ctx.fill();
    const cell=(box-8)/n; ctx.fillStyle="#000";
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)) ctx.fillRect(Math.floor(x0+4+c*cell),Math.floor(y0+4+r*cell),Math.ceil(cell),Math.ceil(cell));
  }catch(e){}
  return d;
}
function capaFieldsHtml(){
  return `<div class="field wide capa-field"><div class="capa-h"><span class="pt-lbl">Capa do YouTube</span><small class="lrn-hint">Número, título e QR Code da página dos ouvintes deste episódio. O resto da arte é fixo.</small></div>
    <div class="capa-grid">
      <div class="capa-form">
        <label class="field"><span>Número do episódio</span><input id="fCapaNum" type="number" min="1" max="9999" inputmode="numeric"></label>
        <label class="field"><span>Título (branco)</span><input id="fCapaTit" type="text" maxlength="80" placeholder="Ex.: Governança e CSC |"></label>
        <label class="field"><span>Destaque (laranja)</span><input id="fCapaDest" type="text" maxlength="60" placeholder="Ex.: Tudo se conecta"></label>
        <button class="btn primary" id="capaDown" type="button">Baixar PNG (1920 × 1080)</button>
        <button class="btn ghost" id="capaLinkB" type="button">Copiar link da capa</button>
      </div>
      <div class="capa-prev"><canvas id="capaCanvas" width="1920" height="1080" aria-label="Prévia da capa"></canvas></div>
    </div></div>`;
}
let capaT=null, capaEpWired=null;
/* ---------- Links fixos do OBS: seguem o "episódio no ar" de cada programa ---------- */
// Um único conjunto de links para AkiCast, AkiLearning e AkiCulture: a tela muda de cor e logo sozinha
function fixLink(modo,extra){ return location.origin+location.pathname+"?"+modo+"=atual"+(extra||""); }
let NO_AR={}, noArOk=null;
async function loadNoAr(){
  if(!SB) return;
  const r=await SB.from("int_no_ar").select("program,episode_id,atualizado_em");
  if(r.error){ noArOk=false; return; }
  const antes=JSON.stringify(NO_AR);
  noArOk=true; NO_AR={}; (r.data||[]).forEach(x=>NO_AR[x.program]=x);
  if(antes!==JSON.stringify(NO_AR) && loadNoAr._ja && $("#presBody")) setTimeout(renderPresBody,0);
  loadNoAr._ja=true;
  NO_AR_EP=null;
  const id=NO_AR.geral&&NO_AR.geral.episode_id;
  if(id){ const e=await SB.from("episodes").select("id,date,theme,program").eq("id",id).maybeSingle(); if(!e.error) NO_AR_EP=e.data||null; }
}
let NO_AR_EP=null;
// se outra pessoa da produção trocar o episódio no ar, o quadro se atualiza
setInterval(()=>{ if(SB&&SESSION&&!document.hidden&&$("#presBody")) loadNoAr(); },60000);
// Sem escolha manual: usa o episódio de hoje ou o próximo; se não houver, o último que passou
function noArAuto(lista,prog){
  const eps=lista.filter(e=>(prog==="geral"||(e.program||"akicast")===prog) && e.date).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const hoje=new Date().toISOString().slice(0,10);
  return eps.find(e=>String(e.date)>=hoje)||eps[eps.length-1]||null;
}
// Só o episódio escolhido na central (um único, para os três programas). Sem escolha: nenhum.
async function resolverAtual(prog){
  const r=await SB.from("int_no_ar").select("episode_id").eq("program",prog).maybeSingle();
  return !r.error&&r.data&&r.data.episode_id?r.data.episode_id:null;
}
function capaLink(epId){ return location.origin+location.pathname+"?capa="+encodeURIComponent(epId); }
/* Capa por link: ?capa=<episódio> mostra a capa pronta (sempre atualizada).
   &obs=1 esconde o botão, para usar como fundo no OBS. */
async function startCapaView(epId){
  const obs=new URLSearchParams(location.search).get("obs")==="1";
  document.documentElement.classList.add("overlay-mode"); document.body.classList.add("overlay-mode","capa-mode");
  document.title="Capa do YouTube";
  const v=document.createElement("div"); v.className="capa-view"+(obs?" obs":"");
  v.innerHTML=`<canvas id="capaVc" width="1920" height="1080" aria-label="Capa do YouTube"></canvas>${obs?"":`<div class="capa-bar"><span id="capaVt">Carregando…</span><button class="btn primary" id="capaVd" type="button" disabled>Baixar PNG</button></div>`}`;
  document.body.appendChild(v);
  if(!SB){ const t=$("#capaVt"); if(t) t.textContent="Central não configurada."; return; }
  let last="";
  const draw=async()=>{
    const {data:ep,error}=await epPublico(epId);
    if(error||!ep){ const t=$("#capaVt"); if(t) t.textContent="Link inválido: episódio não encontrado."; return; }
    followEpisodeProgram(ep);
    const e=rowToEp(ep), sig=JSON.stringify([e.capa_numero,e.capa_titulo,e.capa_destaque,e.theme,e.program,e.date]);
    if(sig===last) return; last=sig;
    const d=await drawCapa($("#capaVc"),e,epId);
    const t=$("#capaVt"); if(t) t.textContent=`${PN()} · ${d.num?d.num+"º · ":""}${d.tit}${d.dest?" "+d.dest:""}`;
    const b=$("#capaVd"); if(b){ b.disabled=false; b.onclick=()=>$("#capaVc").toBlob(bl=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(bl); a.download=`capa-${({learning:"akilearning",culture:"akiculture",teste:"akiteste"})[d.prog]||"akicast"}-${d.num||"episodio"}.png`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); },"image/png"); }
  };
  await draw();
  setInterval(draw,60000);   // se a produção mudar o título ou o número, a capa se atualiza sozinha
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) draw(); });
}
function wireCapa(ep){
  const n=$("#fCapaNum"), t=$("#fCapaTit"), d=$("#fCapaDest"); if(!n) return;
  const sug=capaSugestao(ep);
  n.value=ep.capa_numero!=null&&ep.capa_numero!==""?ep.capa_numero:""; n.placeholder=sug?String(sug)+" (sugerido)":"Ex.: 63";
  t.value=ep.capa_titulo||""; t.placeholder=ep.theme?ep.theme+" (tema)":"Ex.: Governança e CSC |"; d.value=ep.capa_destaque||"";
  const redraw=()=>{ clearTimeout(capaT); capaT=setTimeout(()=>{ const e=currentEp(); if(e) drawCapa($("#capaCanvas"),{...e,capa_numero:n.value===""?null:Number(n.value),capa_titulo:t.value,capa_destaque:d.value},e.id); },120); };
  n.addEventListener("input",()=>{ debouncedUpdate("capa_numero",n.value===""?null:Number(n.value)); redraw(); });
  t.addEventListener("input",()=>{ debouncedUpdate("capa_titulo",t.value); redraw(); });
  d.addEventListener("input",()=>{ debouncedUpdate("capa_destaque",d.value); redraw(); });
  $("#capaDown").addEventListener("click",async()=>{ const e=currentEp(); if(!e) return; const c=document.createElement("canvas");
    const dd=await drawCapa(c,{...e,capa_numero:n.value===""?null:Number(n.value),capa_titulo:t.value,capa_destaque:d.value},e.id);
    c.toBlob(bl=>{ const a=document.createElement("a"); a.href=URL.createObjectURL(bl); a.download=`capa-${({learning:"akilearning",culture:"akiculture",teste:"akiteste"})[dd.prog]||"akicast"}-${dd.num||"episodio"}.png`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); toast("Capa baixada."); },"image/png"); });
  redraw();
  { const lb=$("#capaLinkB"); if(lb) lb.addEventListener("click",async()=>{ const e=currentEp(); if(!e) return; const url=capaLink(e.id); try{ await navigator.clipboard.writeText(url); toast("Link da capa copiado. Ele mostra a capa sempre atualizada."); }catch(_){ prompt("Copie o link da capa:",url); } }); }
}

/* =================== Chamada automática de quiz e votação =================== */
// Tela do OBS: selo curto no topo quando um quiz ou votação abre
let chSeen=null, chT=null, chVisible=false;
// Chamada de quiz/votação: etiqueta roxa "Quiz aberto" + cartão branco com a pergunta (sem resultados)
function chamadaEtiqueta(list){
  const q=list.filter(a=>a.tipo!=="enquete").length, v=list.length-q;
  if(list.length===1) return q?"Quiz aberto":"Votação aberta";
  if(!v) return `${q} quizzes abertos`;
  if(!q) return `${v} votações abertas`;
  return `${list.length} quizzes e votações abertos`;
}
function chamadaInner(list){
  const ord=list.slice().sort((x,y)=>(x.ordem||0)-(y.ordem||0)||String(x.aberta_em||"").localeCompare(String(y.aberta_em||"")));
  const a=ord[0], enq=list.every(x=>x.tipo==="enquete"), outros=list.length-1;
  return `<div class="och2"><div class="och2-tag"><span class="ofr-ic" aria-hidden="true">!</span>${esc(chamadaEtiqueta(list))}</div>
    <div class="och2-card"><b>${esc(a.pergunta||"")}</b><span>${enq?"Vote pela plataforma":"Participe pela plataforma"}${outros?` · + ${outros} ${outros===1?"outra pergunta aberta":"outras perguntas abertas"}`:""}</span></div></div>`;
}
async function checkChamada(tela){
  if(!ovEp) return;
  const r=await SB.from("int_atividades").select("id,tipo,aberta_em,pergunta,ordem").eq("episode_id",ovEp).eq("estado","aberta");
  if(r.error) return;
  const rows=r.data||[], now=Date.now();
  if(chSeen===null){ // primeira leitura: só anuncia o que abriu agora há pouco
    chSeen=new Set(rows.filter(a=>!a.aberta_em || now-new Date(a.aberta_em).getTime()>20000).map(a=>a.id));
  }
  let novos=rows.filter(a=>!chSeen.has(a.id));
  novos.forEach(a=>chSeen.add(a.id));
  if(novos.length){ const lig=await enqConectadas(ovEp); novos=novos.filter(a=>!lig.includes(a.id)); }
  if(!novos.length) return;
  if(tela && tela.chamada_auto===false) return;
  showChamada(novos);
}
const CHAMADA_SEG=7;
// votações conectadas a uma enquete do slide (o próprio slide já mostra; a chamada cobriria a apresentação)
const enqConCache={};
async function enqConectadas(ep){
  const c=enqConCache[ep]; if(c&&Date.now()-c.t<30000) return c.ids;
  let ids=[]; try{ const r=await SB.from("decks").select("enquetes").eq("episode_id",ep).maybeSingle(); ids=(r.data&&Array.isArray(r.data.enquetes)?r.data.enquetes:[]).filter(Boolean); }catch(e){}
  enqConCache[ep]={t:Date.now(),ids}; return ids;
}
function showChamada(list){
  const c=$("#ovChamada"); if(!c) return;
  clearTimeout(chT);
  c.innerHTML=chamadaInner(list);
  const el=c.firstElementChild; el.classList.add("entering"); requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.remove("entering")));
  chVisible=true; const fr=$("#ovSelo"); if(fr) fr.classList.add("ch-hide");
  chT=setTimeout(()=>{ el.classList.add("leaving"); setTimeout(()=>{ c.innerHTML=""; chVisible=false; const f=$("#ovSelo"); if(f) f.classList.remove("ch-hide"); },500); },CHAMADA_SEG*1000);
}
// Sala: chave ON/OFF
async function chamadaToggle(b){
  const on=b.getAttribute("aria-checked")!=="true"; b.setAttribute("aria-checked",on?"true":"false");
  const r=await SB.rpc("int_chamada_auto",{p_episode:sqEp,p_ligar:on});
  if(r.error){ b.setAttribute("aria-checked",on?"false":"true"); toast(/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-chamada-quiz.sql no Supabase.":"Não foi possível mudar a chamada."); return; }
  toast(on?"Chamada automática ligada: o telão avisa quando um quiz abrir.":"Chamada automática desligada."); sqSig=""; loadSalaQs();
}
// Celular: faixa fixa enquanto houver quiz ou votação aberto sem resposta
let lsAvisoKey="";
function renderAvisoQuiz(){
  const el=$("#lsAviso"); if(!el||!listenEp) return;
  const pend=qzActs.filter(a=>a.estado==="aberta" && !qzMine[a.id]).sort((x,y)=>(x.ordem||0)-(y.ordem||0));
  const show=pend.length && lsTab!=="quiz";
  const key=pend.map(a=>a.id).join(",");
  const prevIds=new Set(lsAvisoKey.split(",").filter(Boolean)), temNovo=pend.some(x=>!prevIds.has(x.id));
  if(temNovo && qzActsLoaded){ try{ navigator.vibrate&&navigator.vibrate(120); }catch(e){} }
  lsAvisoKey=key;
  if(!show){ el.hidden=true; el.innerHTML=""; return; }
  const a=pend[0], enq=pend.every(x=>x.tipo==="enquete");
  el.hidden=false;
  el.innerHTML=`<button class="lsa" type="button" id="lsAvisoBtn"><span class="lsa-ic" aria-hidden="true">📊</span><span class="lsa-t"><small>${pend.length>1?`${pend.length} abertos agora · faltam ${pend.length}`:(enq?"Votação aberta agora":"Quiz aberto agora")}</small><b>${esc(a.pergunta)}</b></span><span class="lsa-go">Responder</span></button>`;
  $("#lsAvisoBtn").addEventListener("click",()=>{ setListenTab("quiz"); setTimeout(()=>{ const t=document.querySelector(`[data-qitem="${a.id}"]`)||$("#lsQuiz"); if(t) t.scrollIntoView({behavior:"smooth",block:"start"}); },60); });
}

/* =================== Nome do apresentador na tela =================== */
// Dois lugares: "esq" (primeiro nome) e "dir" (segundo nome)
const NOME_COL={esq:["nome_faixa","nome_ate"],dir:["nome_faixa2","nome_ate2"],centro:["nome_faixa3","nome_ate3"]};
const NOME_TXT={esq:"esquerda",centro:"centro",dir:"direita"};
function nomeAtivo(t,lado){ t=t||{}; const k=NOME_COL[lado]||NOME_COL.esq, n=t[k[0]], ate=t[k[1]]; if(!n||!n.nome) return null; if(ate && new Date(ate).getTime()<=Date.now()) return null; return n; }
function nomesAtivos(t){ return {esq:nomeAtivo(t,"esq"), centro:nomeAtivo(t,"centro"), dir:nomeAtivo(t,"dir")}; }
// Cada lugar é independente: até 3 nomes (esquerda, centro e direita)
function nomeLivre(on,lado){ return !on[lado]; }
function nomeTrio(t){ const ns=nomesAtivos(t); return !!(ns.esq&&ns.centro&&ns.dir); }
// Nome longo: diminui a letra aos poucos e, se ainda não couber, quebra em duas linhas
function fitNome(root){
  (root||document).querySelectorAll(".onm-txt b").forEach(b=>{
    b.style.fontSize=""; b.style.whiteSpace="nowrap";
    const base=parseFloat(getComputedStyle(b).fontSize)||46, min=Math.round(base*.72);
    let fs=base; while(b.scrollWidth>b.clientWidth+1 && fs>min){ fs-=2; b.style.fontSize=fs+"px"; }
    if(b.scrollWidth>b.clientWidth+1){ b.style.whiteSpace="normal"; b.style.fontSize=Math.round(base*.82)+"px"; }
  });
}
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>fitNome());
function nomeInner(n,lado){
  if(!n||!n.nome) return "";
  return `<div class="onm${lado==="dir"?" onm-dir":lado==="centro"?" onm-centro":""}"><div class="onm-logo"><img src="${esc(PG().logo||AKICAST_LOGO_SRC||"img/akicast-logo.png")}" alt=""></div><div class="onm-txt"><b>${esc(n.nome)}</b>${n.cargo?`<span>${esc(n.cargo)}</span>`:""}</div></div>`;
}
const ovNomeKeys={esq:"",dir:"",centro:""};
function showNome(n,lado){
  lado=lado||"esq"; const c=$(lado==="dir"?"#ovNome2":lado==="centro"?"#ovNome3":"#ovNome"); if(!c) return;
  const key=n?n.nome+"|"+(n.cargo||""):""; if(key===ovNomeKeys[lado]) return; ovNomeKeys[lado]=key;
  const cur=c.firstElementChild;
  const enter=()=>{ c.innerHTML=nomeInner(n,lado); const el=c.firstElementChild; if(el){ el.classList.add("entering"); fitNome(el); requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.classList.remove("entering"); fitNome(el); })); setTimeout(()=>fitNome(el),620); } };
  if(cur){ cur.classList.add("leaving"); setTimeout(()=>{ if(ovNomeKeys[lado]===key) enter(); },450); } else if(key) enter();
}
function baseOcupada(t){ t=t||{}; return (t.pergunta_id&&t.formato==="faixa")||(t.atividade_id&&t.formato==="quiz_faixa")||(Array.isArray(t.podio)&&t.podio_formato==="faixa")||(t.multi&&Array.isArray(t.multi.ids)&&t.multi.ids.length&&t.multi.layout==="faixa"); }
/* ---------- Sala e tela enxuta: card "Nome na tela" ---------- */
let sqNomeSig="", sqNomeNovo={nome:"",cargo:""}, sqNomePick=null;
function pessoasSalvas(ep){ return Array.isArray(ep&&ep.faixa_pessoas)?ep.faixa_pessoas.filter(p=>p&&p.nome):[]; }
function pessoasDoEpisodio(ep){
  const salvas=pessoasSalvas(ep);
  const nomes=new Set(salvas.map(p=>p.nome.trim().toLowerCase()));   // inclui os excluídos, para não voltarem
  const pres=parsePresenters(ep&&ep.presenters).filter(n=>!nomes.has(n.trim().toLowerCase())).map(n=>({nome:n,cargo:""}));
  return pres.concat(salvas.filter(p=>!p.oculto));
}
// Mantém a lista visível na ordem certa e guarda quem foi excluído (para um apresentador do episódio não reaparecer)
function listaComOcultos(ep,visiveis){ return visiveis.concat(pessoasSalvas(ep).filter(p=>p.oculto)); }
const nomeRest=lado=>{ const a=sqTela&&sqTela[(NOME_COL[lado]||NOME_COL.esq)[1]]; return a&&nomeAtivo(sqTela,lado)?Math.max(0,Math.ceil((new Date(a).getTime()-Date.now())/1000)):null; };
function renderSalaNome(){
  const box=$("#salaNome"); if(!box) return;
  const admin=SESSION&&SESSION.papel==="admin", ep=episodes.find(e=>e.id===sqEp);
  if(!admin||!ep){ box.innerHTML=""; return; }
  const on=nomesAtivos(sqTela), pessoas=pessoasDoEpisodio(ep);
  const sig=JSON.stringify([on,sqTela&&sqTela.nome_ate,sqTela&&sqTela.nome_ate2,sqTela&&sqTela.nome_ate3,pessoas,sqNomePick]);
  if(sig===sqNomeSig && box.firstElementChild) return;
  if(box.contains(document.activeElement) && document.activeElement.tagName==="INPUT" && sqNomeSig){ return; }
  sqNomeSig=sig;
  const qtd=(on.esq?1:0)+(on.dir?1:0)+(on.centro?1:0), cheio=!["esq","centro","dir"].some(l=>nomeLivre(on,l));
  const ladoDe=nome=>["esq","centro","dir"].find(l=>on[l]&&on[l].nome===nome)||null;
  const cd=lado=>{ const r=nomeRest(lado); return `<span class="sf-cd" data-ncd="${lado}">${r!=null?` · sai em ${r} s`:""}</span>`; };
  box.innerHTML=`<div class="sala-card sala-nome">
    <div class="sala-h"><h3>Nome na tela</h3>${qtd?`<span class="air-pill on"><span class="dotc on"></span>${qtd===2?"2 nomes no ar":"No ar"}</span>`:'<span class="air-pill">Fora da tela</span>'}</div>
    <p class="meta sf-desc">Escolha onde a faixa aparece: esquerda, centro ou direita (até 3 juntas; com 3, elas ficam compactas). A ordem da lista é a ordem da mesa. O cargo fica salvo no episódio.</p>
    ${pessoas.length>=2?`<button class="btn sm tela-b nm-mesa" data-nm="mesa" type="button">Apresentar a mesa (10 s)<small>${pessoas.length>=3?"os 3 primeiros da lista":"os 2 da lista"}</small></button>`:""}
    ${pessoas.length?`<ul class="nm-list">${pessoas.map((p,i)=>{ const lado=ladoDe(p.nome); return `<li class="${lado?"on":""}">
      <button class="icon-btn nm-del" data-nm="del" data-i="${i}" type="button" aria-label="Excluir ${esc(p.nome)} da lista" title="Excluir da lista"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
      <div class="nm-ord"><button class="icon-btn" data-nm="up" data-i="${i}" type="button" ${i===0?"disabled":""} aria-label="Subir na lista">▲</button><button class="icon-btn" data-nm="down" data-i="${i}" type="button" ${i===pessoas.length-1?"disabled":""} aria-label="Descer na lista">▼</button></div>
      <div class="nm-who"><b>${esc(p.nome)}${lado?` <small class="nm-lado">${({esq:"◀ esquerda",centro:"▲ centro",dir:"direita ▶"})[lado]}${cd(lado)}</small>`:""}</b><input class="nm-cargo" data-nmc="${i}" maxlength="80" placeholder="Cargo ou área (ex.: Analista de Dados)" value="${esc(p.cargo||"")}"></div>
      <div class="nm-acts">${lado?`<button class="btn ghost sm" data-nm="off" data-lado="${lado}" type="button">Tirar da tela</button>`
        :(sqNomePick&&sqNomePick.i===i?`<div class="nm-pick"><span class="meta">${sqNomePick.seg?"Por 10 s em:":"Mostrar em:"}</span>${["esq","centro","dir"].map(l=>`<button class="btn sm ${nomeLivre(on,l)?"primary":"nm-off"}" data-nm="lado" data-i="${i}" data-lado="${l}" type="button" ${nomeLivre(on,l)?"":"disabled"} title="${nomeLivre(on,l)?"":"Já há um nome nesse lugar"}">${({esq:"Esquerda",centro:"Centro",dir:"Direita"})[l]}</button>`).join("")}<button class="linkbtn" data-nm="cancel" type="button">Cancelar</button></div>`
        :`<button class="btn primary sm" data-nm="show" data-i="${i}" type="button" ${cheio?"disabled":""}>Mostrar</button><button class="btn sm tela-b" data-nm="show10" data-i="${i}" type="button" ${cheio?"disabled":""}>Por 10 s</button>`)}</div></li>`; }).join("")}</ul>`:'<p class="meta">Nenhum apresentador cadastrado no episódio. Adicione abaixo.</p>'}
    ${cheio?'<p class="meta nm-cheio">Os 3 lugares estão ocupados. Tire um nome para mostrar outro.</p>':""}
    <div class="nm-add"><input id="nmNovoNome" maxlength="60" placeholder="Nome de um convidado" value="${esc(sqNomeNovo.nome)}"><input id="nmNovoCargo" maxlength="80" placeholder="Cargo" value="${esc(sqNomeNovo.cargo)}"><button class="btn ghost sm" id="nmAdd" type="button">Adicionar</button></div>
  </div>`;
  box.querySelectorAll("[data-nmc]").forEach(inp=>{ let t=null; inp.addEventListener("input",()=>{ clearTimeout(t); t=setTimeout(()=>salvarCargo(+inp.dataset.nmc,inp.value),700); }); inp.addEventListener("blur",()=>{ clearTimeout(t); salvarCargo(+inp.dataset.nmc,inp.value); }); });
  box.querySelectorAll("[data-nm]").forEach(b=>b.addEventListener("click",()=>{ b.blur(); nomeAction(b.dataset.nm,b); }));
  $("#nmNovoNome").addEventListener("input",e=>sqNomeNovo.nome=e.target.value); $("#nmNovoCargo").addEventListener("input",e=>sqNomeNovo.cargo=e.target.value);
  $("#nmAdd").addEventListener("click",async()=>{ const n=sqNomeNovo.nome.trim(); if(n.length<2){ toast("Escreva o nome."); return; } const ep2=episodes.find(e=>e.id===sqEp); ep2.faixa_pessoas=pessoasSalvas(ep2).filter(p=>!(p.oculto&&p.nome.trim().toLowerCase()===n.toLowerCase())); const lista=pessoasDoEpisodio(ep2); const ja=lista.find(p=>p.nome.trim().toLowerCase()===n.toLowerCase()); if(ja){ if(sqNomeNovo.cargo.trim()) ja.cargo=sqNomeNovo.cargo.trim(); } else lista.push({nome:n,cargo:sqNomeNovo.cargo.trim()}); await salvarPessoas(lista); sqNomeNovo={nome:"",cargo:""}; sqNomeSig=""; renderSalaNome(); });
}
async function salvarPessoas(lista){
  const ep=episodes.find(e=>e.id===sqEp); if(!ep) return;
  const vis=lista.filter(p=>!p.oculto), ocultos=pessoasSalvas(ep).filter(p=>p.oculto).concat(lista.filter(p=>p.oculto));
  const vistos=new Set(); const limpa=vis.concat(ocultos).map(p=>({nome:String(p.nome||"").trim(),cargo:String(p.cargo||"").trim(),...(p.oculto?{oculto:true}:{})})).filter(p=>{ const k=p.nome.toLowerCase()+(p.oculto?"#o":""); if(!p.nome||vistos.has(k)) return false; vistos.add(k); return true; });
  ep.faixa_pessoas=limpa;
  try{ await store.update(sqEp,{faixa_pessoas:limpa}); }catch(e){ toast(/faixa_pessoas|column/i.test(e.message||"")?"Falta rodar o int-nome-apresentador.sql no Supabase.":"Não foi possível salvar o cargo."); }
}
async function salvarCargo(i,valor){
  const ep=episodes.find(e=>e.id===sqEp); if(!ep) return;
  const lista=pessoasDoEpisodio(ep); if(!lista[i]||(lista[i].cargo||"")===valor.trim()) return;
  lista[i].cargo=valor.trim(); await salvarPessoas(lista);
}
async function nomeRpc(nome,cargo,seg,lado){
  let r=await SB.rpc("int_mostrar_nome",{p_episode:sqEp,p_nome:nome,p_cargo:cargo,p_segundos:seg,p_lado:lado});
  if(r.error && /p_lado|function|schema cache/i.test(r.error.message||"")){
    if(lado!=="esq"){ toast(lado==="centro"?"Para usar o centro, rode o int-nome-centro.sql no Supabase.":"Para mostrar 2 nomes, rode o int-nome-dois.sql no Supabase."); return {error:{message:"",silent:true}}; }
    r=await SB.rpc("int_mostrar_nome",{p_episode:sqEp,p_nome:nome,p_cargo:cargo,p_segundos:seg});
  }
  return r;
}
async function nomeAction(act,b){
  const ep=episodes.find(e=>e.id===sqEp); if(!ep) return;
  let r, lado="esq";
  if(act==="show"||act==="show10"){ sqNomePick={i:+b.dataset.i,seg:act==="show10"?10:null}; sqNomeSig=""; renderSalaNome(); return; }
  if(act==="cancel"){ sqNomePick=null; sqNomeSig=""; renderSalaNome(); return; }
  if(act==="del"){
    const lista=pessoasDoEpisodio(ep), i=+b.dataset.i, p=lista[i]; if(!p) return;
    if(!confirmInline(b,"Excluir?")) return;
    const on=nomesAtivos(sqTela); for(const l of ["esq","centro","dir"]) if(on[l]&&on[l].nome===p.nome) await nomeRpc("","",null,l);
    lista.splice(i,1);
    const ehApresentador=parsePresenters(ep.presenters).some(n=>n.trim().toLowerCase()===p.nome.trim().toLowerCase());
    await salvarPessoas(ehApresentador?lista.concat([{nome:p.nome,cargo:"",oculto:true}]):lista);
    sqNomePick=null; toast(`${p.nome} saiu da lista.`); sqNomeSig=""; sqSig=""; loadSalaQs(); return;
  }
  if(act==="up"||act==="down"){ const lista=pessoasDoEpisodio(ep), i=+b.dataset.i, j=act==="up"?i-1:i+1; if(j<0||j>=lista.length) return; [lista[i],lista[j]]=[lista[j],lista[i]]; sqNomePick=null; await salvarPessoas(lista); sqNomeSig=""; renderSalaNome(); return; }
  if(act==="mesa"){
    const lista=pessoasDoEpisodio(ep); const lados=lista.length>=3?["esq","centro","dir"]:["esq","dir"];
    if(b) b.disabled=true;
    const nomes=lados.map((l,k)=>({lado:l,nome:lista[k].nome,cargo:lista[k].cargo||""}));
    let rr=await SB.rpc("int_mostrar_mesa",{p_episode:sqEp,p_nomes:nomes,p_segundos:10});
    if(rr.error && /function|schema cache/i.test(rr.error.message||"")){
      // sem o SQL novo: coloca um por vez (pode entrar levemente fora de sincronia)
      toast("Dica: rode o int-nome-mesa.sql para a mesa entrar e sair toda junta.");
      for(const x of nomes){ rr=await nomeRpc(x.nome,x.cargo,10,x.lado); if(rr&&rr.error) break; }
    }
    if(b) b.disabled=false;
    if(rr&&rr.error){ if(!rr.error.silent) toast("Não foi possível apresentar a mesa."); return; } toast(`Mesa na tela por 10 segundos: ${lista.slice(0,lados.length).map(p=>p.nome.split(" ")[0]).join(", ")}.`);
    sqNomeSig=""; sqSig=""; loadSalaQs(); return;
  }
  if(act==="off"){ lado=b.dataset.lado||"esq"; r=await nomeRpc("","",null,lado); }
  else {
    const on=nomesAtivos(sqTela); lado=b.dataset.lado;
    if(!nomeLivre(on,lado)){ toast("Já há um nome nesse lugar."); return; }
    const seg=sqNomePick&&sqNomePick.seg; sqNomePick=null;
    const p=pessoasDoEpisodio(ep)[+b.dataset.i]; if(!p) return;
    const inp=document.querySelector(`[data-nmc="${b.dataset.i}"]`); const cargo=inp?inp.value.trim():(p.cargo||"");
    if(inp && cargo!==(p.cargo||"")) salvarCargo(+b.dataset.i,cargo);
    r=await nomeRpc(p.nome,cargo,seg,lado); act=seg?"show10":"show";
  }
  if(r&&r.error){ if(!r.error.silent) toast(/function|schema cache/i.test(r.error.message||"")?"Falta rodar o int-nome-apresentador.sql no Supabase.":(r.error.message||"Não foi possível atualizar o nome.")); return; }
  toast(act==="off"?"Nome retirado da tela.":`Nome na tela, ${lado==="centro"?"no centro":lado==="dir"?"à direita":"à esquerda"}${act==="show10"?", por 10 segundos":""}.`);
  sqNomeSig=""; sqSig=""; loadSalaQs();
}

function avisoLink(msg){
  let el=$("#linkAviso"); if(!el){ el=document.createElement("div"); el.id="linkAviso"; el.className="link-aviso"; document.body.appendChild(el); }
  el.innerHTML=`<b>Link sem permissão</b><span>${esc(msg)}</span>`;
}
/* ---------- Central: só para quem entrou com o login ---------- */
function updateGate(){
  const g=$("#authGate"); if(!g) return;
  const semLogin=directOpen && (K_LINK || directOpen.mode==="exibir");   // link com código ou tela do OBS: não pede login
  const precisa=!!SB && !SESSION && !semLogin;
  g.hidden=!precisa; document.body.classList.toggle("gate-on",precisa);
}
/* =================== Check-in (página dos ouvintes) =================== */
let lsCk={feito:false,checked:false,abrindo:false,err:""};
const ckKey=ep=>"akicast-ck-"+ep;
function hojeLocal(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
async function loadCheckin(){
  if(!listenEp||!SB) return;
  lsCk.feito=lsGet(ckKey(listenEp.id))==="1";
  if(!lsCk.feito){ const r=await SB.rpc("int_meu_checkin",{p_episode:listenEp.id,p_aparelho:meuAparelho()}); if(!r.error&&r.data) { lsCk.feito=true; lsSet(ckKey(listenEp.id),"1"); } if(r.error) lsCk.off=true; }
  lsCk.checked=true; renderCheckin();
}
function renderCheckin(){
  const el=$("#lsCk"); if(!el||!listenEp) return;
  if(lsCk.off || String(listenEp.date)!==hojeLocal()){ el.hidden=true; el.innerHTML=""; return; }
  el.hidden=false;
  if(lsCk.feito){ el.innerHTML=`<div class="ck-card ok"><span class="ck-ic" aria-hidden="true">✅</span><span><b>Presença confirmada</b>${pontAtiva()?" · +10 pontos nesta live":""}</span></div>`; return; }
  const nome=(lsPart.nome||lsGet(partKeyNome)||"").trim();
  el.innerHTML=`<div class="ck-card">
    <span class="ck-ic" aria-hidden="true">✋</span>
    <div class="ck-txt"><b>Faça seu check-in</b><span>${pontAtiva()?"Vale +10 pontos nesta live. ":""}Confirme que você está acompanhando.</span></div>
    ${lsCk.abrindo||!nome?`<div class="ck-form"><input id="ckNome" type="text" maxlength="80" autocomplete="name" placeholder="Seu nome e sobrenome" value="${esc(nome)}"><button class="btn primary" id="ckGo" type="button">Estou presente</button></div>`
      :`<div class="ck-form"><button class="btn primary" id="ckGo" type="button">Estou presente</button><button class="linkbtn" id="ckTroca" type="button">Não é ${esc(nome.split(" ")[0])}?</button></div>`}
    ${lsCk.err?`<p class="ck-err">${esc(lsCk.err)}</p>`:""}
  </div>`;
  const go=$("#ckGo"); if(go) go.addEventListener("click",fazerCheckin);
  const tr=$("#ckTroca"); if(tr) tr.addEventListener("click",()=>{ lsCk.abrindo=true; renderCheckin(); const i=$("#ckNome"); if(i){ i.value=""; i.focus(); } });
  const ni=$("#ckNome"); if(ni) ni.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); fazerCheckin(); } });
}
async function fazerCheckin(){
  const i=$("#ckNome"), nome=((i?i.value:"")||lsPart.nome||lsGet(partKeyNome)||"").trim().replace(/\s+/g," ");
  if(nome.length<5||!nome.includes(" ")){ lsCk.err="Digite seu nome completo (nome e sobrenome)."; lsCk.abrindo=true; renderCheckin(); return; }
  const b=$("#ckGo"); if(b){ b.disabled=true; b.textContent="Confirmando…"; }
  const r=await SB.rpc("int_checkin",{p_episode:listenEp.id,p_aparelho:meuAparelho(),p_nome:nome});
  if(r.error){ lsCk.err=/function|schema cache/i.test(r.error.message||"")?"O check-in ainda não está disponível.":(r.error.message||"Não foi possível fazer o check-in."); renderCheckin(); return; }
  lsCk.feito=true; lsCk.err=""; lsCk.abrindo=false; lsSet(ckKey(listenEp.id),"1"); lsSet(partKeyNome,nome);
  if(pontAtiva()){ lsPart.nome=nome; lsPart.anon=false; renderPartChip(); }
  renderCheckin(); toast("Presença confirmada! ✋");
}
/* =================== Presença acumulada (produção) =================== */
let acumList=null, acumDesde=lsGet("akicast-pres-desde")||"", acumErr="";
function acumCardHtml(){
  const opts=[["","Desde o começo"],[diasAtras(90),"Últimos 3 meses"],[diasAtras(180),"Últimos 6 meses"],[new Date().getFullYear()+"-01-01","Este ano"]];
  const rows=acumList||[];
  return `<div class="pres-card pres-acum">
    <h2>Presença acumulada</h2>
    <p class="meta">Cada check-in conta 1 presença, somando todas as lives dos três programas. Só a produção vê. Pessoas com o mesmo nome são juntadas.</p>
    <div class="pres-row"><select id="acumDesde" class="ep">${opts.map(([v,t])=>`<option value="${v}" ${acumDesde===v?"selected":""}>${t}</option>`).join("")}</select>
      <button class="btn ghost sm" id="presCopy" type="button" ${rows.length?"":"disabled"}>Copiar lista</button></div>
    ${acumErr?`<div class="warn">${esc(acumErr)}</div>`:acumList===null?'<p class="meta">Carregando…</p>':rows.length?`<div class="rank-wrap"><table class="rank-tbl">
      <thead><tr><th>#</th><th>Nome</th><th>Presenças</th><th>Última live</th><th>Programas</th></tr></thead>
      <tbody>${rows.map((r,k)=>`<tr class="${k<3?"top top"+(k+1):""}"><td>${k+1}</td><td class="rk-nome">${esc(r.nome)}${r.aparelhos>1?` <small class="meta" title="Fez check-in de ${r.aparelhos} aparelhos">· ${r.aparelhos} aparelhos</small>`:""}</td><td class="rk-pts">${r.presencas}</td><td class="rk-sub">${esc(fmtShort(r.ultima))}</td><td class="rk-sub">${esc(r.programas||"")}</td></tr>`).join("")}</tbody></table></div>`
      :'<p class="meta">Ninguém fez check-in neste período ainda.</p>'}
  </div>`;
}
function diasAtras(n){ const d=new Date(Date.now()-n*864e5); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
async function loadAcum(){
  if(!SB||!SESSION||SESSION.papel!=="admin") return;
  const r=await SB.rpc("int_presencas",{p_desde:acumDesde||null});
  acumErr=r.error?(/function|schema cache/i.test(r.error.message||"")?"Para ver a presença acumulada, rode o int-checkin-presenca.sql no Supabase.":r.error.message):"";
  acumList=r.error?[]:(r.data||[]);
  const box=$("#presAcum"); if(box){ box.innerHTML=acumCardHtml(); wireAcum(); }
}
function wireAcum(){
  const s=$("#acumDesde"); if(s) s.addEventListener("change",()=>{ acumDesde=s.value; lsSet("akicast-pres-desde",acumDesde); acumList=null; const box=$("#presAcum"); if(box){ box.innerHTML=acumCardHtml(); wireAcum(); } loadAcum(); });
  const c=$("#presCopy"); if(c) c.addEventListener("click",async()=>{ const t=(acumList||[]).map((r,k)=>`${k+1}. ${r.nome} · ${r.presencas} ${r.presencas===1?"presença":"presenças"}`).join("\n"); try{ await navigator.clipboard.writeText(t); toast("Lista copiada."); }catch(e){ prompt("Copie a lista:",t); } });
}

/* ---------- Boot ---------- */
function startLocal(msg){
  store=makeLocalStore();
  $("#modeNote").innerHTML='<p class="status warn">'+esc(msg||"Supabase não configurado: o checklist fica salvo só neste navegador. Preencha a URL e a chave no topo do index.html.")+'</p>';
  store.subscribe(onData);
}
renderGuide();
(function boot(){
  const CFG=window.AKICAST_CONFIG||{};
  const ok = window.supabase && /^https:\/\//.test(CFG.supabaseUrl||"") && CFG.supabaseAnonKey && !/^COLE_AQUI/.test(CFG.supabaseAnonKey);
  if(!ok && new URLSearchParams(location.search).get("enviar")){ startSendView(null); return; }
  if(!ok){ startLocal(window.supabase?null:"Não foi possível carregar a biblioteca do Supabase. Confira a internet e recarregue a página."); return; }
  SB=window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  const qs0=new URLSearchParams(location.search);
  // nomes novos dos links (os antigos continuam funcionando)
  [["interacoes","perguntas"],["ouvintes","ouvir"]].forEach(([novo,antigo])=>{ if(qs0.get(novo)&&!qs0.get(antigo)) qs0.set(antigo,qs0.get(novo)); });
  // links curtos do apresentador: ?c=<código> (controle) e ?e=<código> (envio)
  const curto=qs0.get("c")?["controle",qs0.get("c")]:qs0.get("e")?["envio",qs0.get("e")]:null;
  if(curto){
    SB.rpc("int_link_resolver",{p_k:curto[1],p_tipo:curto[0]}).then(r=>{
      if(r.error||!r.data){ avisoLink("Este link não é válido ou foi trocado. Peça à produção o link atual, que aparece na aba Apresentações da central."); return; }
      K_LINK=curto[1];
      const q=new URLSearchParams(); q.set(curto[0]==="controle"?"controle":"enviar",String(r.data)); q.set("k",curto[1]);
      seguirBoot(q);
    });
    return;
  }
  const chaveFixa=["exibir","perguntas","qrcode","capa","ouvir","sala","tela"].find(k=>qs0.get(k)==="atual");
  if(chaveFixa){
    const prog=PROGRAMS[qs0.get("p")]?qs0.get("p"):"geral";
    resolverAtual(prog).then(id=>{
      if(!id){ document.documentElement.classList.add("overlay-mode"); document.body.classList.add("overlay-mode");
        const m=document.createElement("p"); m.className="noar-vazio"+(chaveFixa==="ouvir"?" pub":"");
        m.textContent=chaveFixa==="ouvir"?"Nenhuma live acontecendo agora. Volte no horário da próxima live para participar.":"Nenhum episódio no ar"+(prog==="geral"?"":" para "+((PROGRAMS[prog]||{}).name||prog))+". Escolha um na aba Apresentações da central.";
        document.body.appendChild(m);
        const espera=setInterval(async()=>{ const novo=await resolverAtual(prog).catch(()=>null); if(novo){ clearInterval(espera); location.reload(); } },45000);
        return; }
      const q2=new URLSearchParams(qs0); q2.set(chaveFixa,id); seguirBoot(q2);
      // se a produção trocar o episódio no ar, esta tela troca sozinha
      // (nas telas usadas por pessoas, espera ninguém estar digitando ou confirmando algo)
      let trocando=false;
      const ocupado=()=>{ const a=document.activeElement; if(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"||a.isContentEditable)&&(a.value||a.textContent||"").trim()) return true;
        return !![...document.querySelectorAll(".sent-ov,.lq-confirm,.sheet-ov")].find(el=>!el.hidden&&el.offsetParent!==null); };
      const trocar=()=>{ if(ocupado()){ setTimeout(trocar,2000); return; } location.reload(); };
      setInterval(async()=>{ if(trocando) return; const novo=await resolverAtual(prog).catch(()=>id); if(novo!==id){ trocando=true; trocar(); } },45000);
    });
    return;
  }
  seguirBoot(qs0);
})();
function seguirBoot(qs){
  const sendId=qs.get("enviar");
  if(qs.get("controle")){ directOpen={mode:"controle",id:qs.get("controle")};
    linkValido(qs.get("controle"),"controle").then(ok=>{ if(!ok) avisoLink("Este link de controle é antigo ou não tem o código de segurança. Peça à produção o link novo, que aparece na aba Apresentações da central."); }); }
  else if(qs.get("exibir")) directOpen={mode:"exibir",id:qs.get("exibir")};
  else if(qs.get("sala")) directOpen={mode:"sala",id:qs.get("sala")};
  if(sendId){ startSendView(sendId); return; }
  if(qs.get("ouvir")){ startListenView(qs.get("ouvir")); return; }
  if(qs.get("perguntas")){ startOverlayView(qs.get("perguntas")); return; }
  if(qs.get("qrcode")){ startQrView(qs.get("qrcode")); return; }
  if(qs.get("capa")){ startCapaView(qs.get("capa")); return; }
  if(qs.get("tela")){ startTelaView(qs.get("tela")); return; }
  store=makeSupabaseStore(SB);
  loadTemplate().then(()=>watchTemplate());
  loadInventory().then(()=>{ if(invAvailable) watchInventory(); });
  loadGuide().then(()=>{ if(guideAvailable) watchGuide(); });
  refreshSession(); SB.auth.onAuthStateChange(()=>{ setTimeout(refreshSession,0); });
  store.subscribe(onData, e=>{
    const missing = e && (e.code==="42P01" || e.code==="PGRST205" || /does not exist|schema cache/i.test(e.message||""));
    $("#loading").hidden=false;
    $("#loading").className="status warn";
    $("#loading").textContent = missing
      ? "As tabelas ainda não existem no Supabase. Rode o arquivo supabase-setup.sql no SQL Editor do projeto e recarregue."
      : "Não foi possível falar com o Supabase ("+((e&&e.message)||"erro desconhecido")+"). Confira a URL e a chave no topo do index.html.";
  });
}
})();
