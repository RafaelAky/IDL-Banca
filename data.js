/* Conteúdo real da Banca Final IDL Tech — Trilha 2026.
   Programação: "Programacao-IDL-Tech-2026" (versão de outubro de 2026).
   Ordem das equipes: a mesma da planilha anterior, agora em blocos de 7 min.
   Votação do público: os cinco Heróis candidatos (candidato:true), cujas
   campanhas passam às 9h15 — informados pela organização em outubro.
   Projetos e Heróis: PDF "Apresentação Herói Projeto final 2" (16 pôsteres),
   conferido pôster por pôster em outubro. "Ações" e "Impacto" ficam um item
   por linha; o campo meaning guarda o SIGNIFICADO de cada pôster. */
window.IDL_SEED = {
  event: {
    name: 'Banca Final IDL Tech',
    subtitle: 'Encerramento da Trilha 2026',
    dateISO: '2026-11-14',
    dateLabel: '14 de novembro de 2026',
    timeLabel: '9h às 13h',
    recepcao: 'Recepção a partir das 8h',
    place: 'Sebrae',
    logo: '',
    playlist: 'PLKyXA-fTeK4g',
    // horário em que a votação dos Heróis abre (ao fim dos vídeos dos candidatos)
    votacaoAbre: '9h30',
    // total oficial de trilheiros informado pela organização. Os pôsteres somam
    // 76 nomes porque alguns se repetem entre grupos. Deixe '' para usar a soma.
    totalTrilheiros: 75
  },
  // Manifesto da campanha Trilhei 2026, transcrito do KV do Instituto.
  trilhei: {
    eyebrow: 'De sementes a raízes',
    title: 'Por que Trilhei?',
    lead: 'Trilhei é o nome que a Trilha ganhou no fim do caminho. Não é um diploma nem uma linha no currículo: é o que fica em quem andou por ela.',
    blocos: [
      {
        tipo: 'escuro',
        eyebrow: '',
        title: 'O que acontece depois que a semente é plantada?',
        texto: 'Nenhuma semente cresce no dia em que é plantada.\n\nHá raiz. Há o tempo em que o aprendizado desce fundo e se enraiza, se firma no que ninguém vê e passa a sustentar tudo o que vem depois.',
        forte: 'e passa a sustentar tudo o que vem depois.'
      },
      {
        tipo: 'arvore',
        title: 'Quem foi semente agora é quem semeia.',
        texto: 'E entende que a próxima colheita depende do que ele escolhe plantar a partir de agora.'
      },
      {
        tipo: 'conceito',
        eyebrow: 'Conceito 2026',
        title: 'Raízes e Sementes',
        itens: [
          ['Raiz', 'é o que sustenta: fé, família, escola, comunidade.'],
          ['Semente', 'é o que segue: cada aluno que sai daqui carregando o que recebeu.']
        ]
      }
    ],
    lema: 'Incentivamos sonhos e trabalhamos para que se tornem realidade'
  },
  retro: {
    title: 'A Trilha em 2026',
    capa: 'img/2026/t03.webp',
    lead: 'Antes da Banca vieram as rodas de conversa, as visitas, os erros, os ensaios e as ideias que mudaram de forma pelo caminho. Um ano inteiro cabe nestas imagens.',
    photos: [
      ['img/2026/t06.webp', 2, 'A Trilha começa numa roda'],
      ['img/2026/t08.webp', 1, 'A vez de falar'],
      ['img/2026/t05.webp', 1, 'Risada no meio da aula'],
      ['img/2026/t12.webp', 2, 'Uma carta para o futuro'],
      ['img/2026/t14.webp', 1, 'O projeto tomando forma'],
      ['img/2026/t07.webp', 1, 'Escutar antes de propor'],
      ['img/2026/t03.webp', 2, 'Mãos na terra'],
      ['img/2026/t04.webp', 1, 'Nas comunidades'],
      ['img/2026/t11.webp', 1, 'A turma inteira junto'],
      ['img/2026/t01.webp', 1, 'As histórias viraram vídeo'],
      ['img/2026/t02.webp', 1, 'Cada trilheiro contou a sua'],
      ['img/2026/t13.webp', 2, 'Ensaio para a Banca'],
      ['img/2026/t09.webp', 1, 'Defendendo a ideia'],
      ['img/2026/t10.webp', 1, 'O grupo por perto']
    ]
  },
  schedule: [
    ['08:00','09:00','Credenciamento e café da manhã','',''],
    ['09:00','09:04','Abertura oficial','Boas-vindas e aviso sobre os cinco vídeos e a votação dos Heróis durante a manhã.',''],
    ['09:04','09:08','Vídeo retrospectiva da Trilha','',''],
    ['09:08','09:15','Fala da Kellen e apresentação da banca','Orientações sobre o formato e o tempo das apresentações.',''],
    ['09:15','09:30','Vídeos dos candidatos a Herói','Cinco vídeos de 3 minutos. Abertura da votação ao final da exibição.',''],
    ['09:30','11:22','Apresentação dos projetos · 16 equipes','Bloco contínuo, sem pausas. 6 minutos de apresentação + 1 minuto de troca por equipe, sem perguntas da banca.',''],
    ['11:22','11:37','Deliberação da banca e preparação do palco','Encerramento e apuração da votação, reunião da banca e organização das premiações. Para o público: vídeo dos trilheiros.',''],
    ['11:37','11:45','Devolutiva da banca e trilheiros destaque','Reconhecimento, entrega e registro dos destaques no palco.',''],
    ['11:45','11:50','Revelação e premiação do Herói','',''],
    ['11:50','11:54','Homenagens','Agradecimento à Akiyama e às instituições parceiras.',''],
    ['11:54','11:56','Entrega coletiva da Semente','',''],
    ['11:56','11:59','Foto oficial dos trilheiros','',''],
    ['11:59','12:00','Encerramento da cerimônia','Agradecimentos finais e liberação para o almoço.',''],
    ['12:00','13:00','Almoço e confraternização','Fotos com as famílias e entrega dos demais certificados.',''],
    ['13:00','13:00','Finalização do evento','','']
  ],
  // avisos que acompanham a programação oficial
  avisos: [
    ['Votação dos Heróis · 9h30 às 11h22', 'O QR Code será apresentado após os vídeos e ficará disponível durante as apresentações.'],
    ['Reconhecimento no palco', 'Apenas os trilheiros destaque e os premiados serão chamados. Os demais certificados serão entregues fora da cerimônia.']
  ],

  // "how" e "impact": um item por linha (\n). "meaning" = SIGNIFICADO do pôster.
  projects: [
  {
    id:'prj_maos', name:'Mãos que acolhem', slot:'09:30', block:'Manhã', category:'Ação Social',
    group:'INH', members:['Abner','Heloá','Isa','Rebeca'],
    values:['Altruísmo','Humildade','Persistência','Fé','Coragem'],
    heroes:[{id:'her_marks', video:'eJJNl-CI_NU', name:'Mrs Marks', inspiration:'Markenson Marks', image:'img/heroi-08.webp',
      story:'Mr. Marks acredita que transformar uma vida é transformar todas as pessoas ao seu redor. Ao conhecer Milton, um homem que vivia nas ruas por causa da dependência química, uniu pessoas dispostas a acolher, acreditar e oferecer uma nova oportunidade. Com fé, coragem e perseverança, ajudou Milton a reencontrar sua família e descobrir que nunca é tarde para recomeçar. Sua história prova que uma mão estendida pode mudar não apenas um destino, mas muitas gerações.'}],
    tagline:'Acolher um integrante que sonha em ver seu pai recomeçar também significa cuidar de toda a família.',
    meaning:'Este projeto nasceu da dor, mas também da esperança. O grupo compreendeu que, por trás da dependência química, existe uma pessoa que continua precisando de amor, apoio e oportunidades. Unidos, decidiram fortalecer um integrante que sonha em ver seu pai recomeçar, mostrando que acolher uma pessoa também significa cuidar de toda a família. Para eles, desistir nunca é uma opção.',
    problem:'A dependência química afeta não apenas quem faz uso das drogas, mas também toda a família. Muitas vezes, o sofrimento, o cansaço e a falta de esperança fazem com que as pessoas deixem de acreditar na recuperação, aumentando o isolamento e a vulnerabilidade de quem mais precisa de ajuda. E o apoio é essencial para a possível cura do indivíduo.',
    why:'O grupo acredita que toda vida merece uma nova oportunidade. Quando uma família encontra apoio para continuar acreditando, ela fortalece a esperança de quem luta contra a dependência. Mais do que buscar uma internação, este projeto pretende mostrar que acolhimento, fé e perseverança podem ser o início de uma transformação verdadeira.',
    solution:'Encontrar Milton, oferecer a oportunidade de internação e apoiar sua família durante todo o processo. O grupo reconhece que a recuperação não termina com a internação, mas acredita que dar o primeiro passo já representa salvar uma vida e mostrar que ninguém deve ser abandonado quando mais precisa de ajuda.',
    how:'Contar com o mentor Victor para orientar todo o projeto.\nLocalizar Milton e estabelecer contato.\nEncaminhá-lo para internação (Cristolândia).\nBuscar apoio psicológico para a família, especialmente para o adolescente envolvido diretamente no projeto.\nAcompanhar a família durante o processo de recuperação.\nIncentivar a construção de uma rede de apoio para que a esperança permaneça após a internação.\nVerificar os critérios e exigências do local de internação.',
    impact:'Oferecer uma nova oportunidade de vida para Milton.\nFortalecer emocionalmente sua família.\nDemonstrar que o acolhimento pode transformar histórias.\nSensibilizar outras pessoas sobre a importância de não desistir de quem enfrenta a dependência química.\nInspirar novas ações de solidariedade e apoio dentro da comunidade.'
  },
  {
    id:'prj_corrente', name:'Corrente do bem', slot:'09:37', block:'Manhã', category:'Educação',
    group:'Senhorinha', members:['Erick','Lorena','Maria Ester','Pérola','Sofia'],
    values:['Coragem','Disciplina','Altruísmo','Resiliência','Responsabilidade'],
    heroes:[{id:'her_sofia', candidato:true, campanha:'Campanha no Senhorinha, com o projeto Corrente do Bem na sala de reforço.', video:'TTGm2X3YbGE', name:'Sofia', inspiration:'Malala e professora Helen de Abreu', image:'img/heroi-12.webp',
      story:'Sofia percebeu que muitos colegas tinham dificuldade em aprender e não havia uma sala de apoio na escola para ajudá-los. Ao mesmo tempo, viu que vários estudantes dominavam os conteúdos e poderiam compartilhar seus conhecimentos. Assim nasceu a Corrente do Bem, um projeto em que os próprios alunos se ajudam, fortalecendo a aprendizagem, a empatia e a colaboração. O verdadeiro herói é a união entre os estudantes, mostrando que quando um ajuda o outro, todos crescem juntos.'}],
    tagline:'Uma união entre estudantes que acreditam que pequenas atitudes podem transformar a aprendizagem e fazer com que ninguém fique para trás.',
    meaning:'A Corrente do Bem nasceu quando os alunos perceberam que muitos colegas enfrentavam dificuldades para acompanhar os conteúdos em sala de aula. Em vez de esperar que a escola ou o poder público disponibilizassem uma sala de reforço, decidiram agir com os recursos que já possuíam: conhecimento, empatia e vontade de ajudar. O projeto representa a união entre estudantes que acreditam que pequenas atitudes podem transformar a aprendizagem e fazer com que ninguém fique para trás.',
    problem:'Existe uma grande diferença no nível de aprendizagem entre alunos da mesma turma. Em salas numerosas, os professores nem sempre conseguem oferecer atendimento individualizado a quem mais precisa, e a escola não possui uma sala de reforço para suprir essa necessidade. Como consequência, muitos estudantes acumulam dificuldades ao longo do ano e perdem a confiança em seu potencial.',
    why:'O grupo acredita que não basta esperar por soluções externas quando é possível fazer a diferença com as próprias ações. O objetivo é contribuir para que todos os alunos concluam o ano letivo com um nível de aprendizagem mais equilibrado, promovendo a colaboração entre colegas. A Corrente do Bem demonstra que compartilhar conhecimento fortalece tanto quem ensina quanto quem aprende, criando um ambiente escolar mais acolhedor, solidário e comprometido com o sucesso de todos.',
    solution:'A proposta consiste na criação de um aplicativo chamado Corrente do Bem, que conectará alunos dispostos a ensinar com estudantes que desejam receber apoio em disciplinas específicas. O aplicativo reunirá informações como matérias disponíveis, alunos voluntários, estudantes interessados, horários e turnos de atendimento, facilitando a organização dos encontros de reforço escolar. Dessa forma, a tecnologia será utilizada para aproximar pessoas, incentivar a colaboração e ampliar as oportunidades de aprendizagem.',
    how:'Apresentar o projeto à direção da escola para obter autorização.\nIdentificar alunos com bom desempenho nas diferentes disciplinas.\nDivulgar o aplicativo em todas as turmas.\nCadastrar alunos voluntários e estudantes que desejam receber apoio.\nOrganizar uma sala para os encontros de reforço.\nDefinir horários de atendimento conforme a disponibilidade dos participantes.\nCriar formas de reconhecimento para os alunos voluntários, incentivando novas adesões.\nAcompanhar o desempenho dos alunos atendidos por meio de avaliações e feedbacks.\nAvaliar os resultados do projeto e realizar melhorias contínuas.',
    impact:'Redução das dificuldades de aprendizagem.\nMelhoria no desempenho escolar dos estudantes atendidos.\nAumento da autoestima e da confiança dos alunos.\nFortalecimento da colaboração entre colegas.\nDesenvolvimento de liderança e responsabilidade nos alunos voluntários.\nCriação de uma cultura de solidariedade dentro da escola.\nUso da tecnologia como ferramenta de inclusão e aprendizagem.\nFormação de uma comunidade escolar mais unida, participativa e comprometida com o sucesso coletivo.'
  },
  {
    id:'prj_reciclagem', name:'Da reciclagem à mesa', slot:'09:44', block:'Manhã', category:'Sustentabilidade',
    group:'Educa', members:['Cauê','Juliana','Mel','Pietro','Tahynara'],
    values:['Dignidade','Sustentabilidade','Liderança','Resiliência','Justiça Social'],
    heroes:[{id:'her_miguel', candidato:true, campanha:'Campanha no Crescer, com o projeto da reciclagem.', video:'Q-tw8qkzEFQ', name:'Miguel — Eco Mensageiro', inspiration:'Tião dos Santos', image:'img/heroi-07.webp',
      story:'Miguel percebeu que sua comunidade sofria com o descarte incorreto de materiais recicláveis. Inspirado por um projeto que troca recicláveis por alimentos, criou o Eco Mensageiro para incentivar a reciclagem, cuidar do meio ambiente e ajudar famílias em situação de vulnerabilidade. Lema: "Recicle hoje, alimente o amanhã!"'}],
    tagline:'Pequenas atitudes podem transformar a comunidade — e reciclar é também uma forma de cuidar das pessoas.',
    meaning:'Este projeto nasceu do olhar atento do grupo para a própria comunidade. Ao perceberem a grande quantidade de lixo descartado nas ruas, decidiram buscar uma solução que unisse conscientização ambiental e benefício social. O grupo acredita que pequenas atitudes podem transformar a comunidade e que reciclar é também uma forma de cuidar das pessoas.',
    problem:'O descarte incorreto de materiais recicláveis contribui para a poluição das ruas e para o desperdício de recursos que poderiam gerar benefícios à comunidade. Muitas famílias desconhecem programas que transformam materiais recicláveis em alimentos, reduzindo o potencial de participação da população.',
    why:'O grupo acredita que conscientizar a comunidade sobre a destinação correta dos recicláveis é uma forma de promover sustentabilidade, responsabilidade coletiva e apoio às famílias. Compartilhar essa informação amplia o acesso ao programa e incentiva uma comunidade mais limpa.',
    solution:'Conhecer o funcionamento do programa de troca de recicláveis por alimentos e divulgar essa oportunidade para a comunidade, começando pelas famílias dos integrantes. O objetivo é incentivar mais pessoas a reciclar, reduzir o descarte irregular e ampliar o número de famílias beneficiadas.',
    how:'Conhecer os pontos de coleta e os canais de troca por meio do site da Prefeitura.\nAgendar uma reunião com o vereador do bairro para compreender melhor o funcionamento do programa.\nRealizar estudo de campo nos pontos de troca e conversar com os participantes.\nLevantar informações sobre a quantidade de recicláveis necessária, frequência das trocas e funcionamento do programa.\nIdentificar quantas famílias da comunidade já conhecem a iniciativa.\nVerificar com os responsáveis a possibilidade de ampliar o número de famílias atendidas.\nDesenvolver ações de divulgação na comunidade.\nAcompanhar e registrar quantas famílias passaram a participar do programa durante o projeto.',
    impact:'Redução do descarte irregular de materiais recicláveis.\nComunidade mais limpa e consciente sobre a importância da reciclagem.\nAumento do número de famílias participantes do programa de troca.\nMaior acesso a alimentos por meio da reciclagem.\nFortalecimento da responsabilidade ambiental e da cidadania.\nIncentivo a práticas sustentáveis que beneficiem toda a comunidade.'
  },
  {
    id:'prj_conecta', name:'Conecta +', slot:'09:51', block:'Manhã', category:'Educação',
    group:'INH', members:['Adryan','Giovana','Lara'],
    values:['Humildade','Empatia','Sabedoria','Fé'],
    heroes:[{id:'her_teo', video:'It5mVYpWFi4', name:'Téo Benevides', inspiration:'Padre João Batista Chemin', image:'img/heroi-09.webp',
      story:'Chemin é um jovem seminarista apaixonado pelo aprendizado e pelo desenvolvimento das pessoas. Durante sua caminhada, percebeu que muitos estudantes enfrentavam dificuldades para lidar com emoções, desafios e relações do dia a dia, comprometendo seu crescimento pessoal e escolar. Convencido de que o conhecimento também passa pelo fortalecimento emocional, criou um clube para incentivar o desenvolvimento socioemocional, promovendo apoio, diálogo e crescimento coletivo entre os alunos.'}],
    tagline:'Mais do que criar um clube, existe o desejo de compartilhar esse conhecimento e levá-lo adiante.',
    meaning:'Este projeto nasce da sensibilidade do grupo ao perceber a importância do desenvolvimento socioemocional na vida dos jovens, a partir do que vivenciam e aprendem no IDLTECH. Mais do que criar um clube, existe o desejo de compartilhar esse conhecimento e levá-lo adiante, fazendo com que o aprendizado atravesse distâncias através da empatia e da vontade de transformar vidas.',
    problem:'A adolescência é marcada por intensas mudanças emocionais, físicas e sociais. Sem uma base socioemocional fortalecida, muitos jovens enfrentam dificuldades para lidar com emoções, relações e desafios, o que impacta fases futuras da vida como estudos, trabalho e escolhas pessoais.',
    why:'É essencial que adolescentes estejam preparados socioemocionalmente para enfrentar as transições da vida. O desenvolvimento dessas habilidades contribui para o autoconhecimento, equilíbrio emocional e melhores relações interpessoais.',
    solution:'Criação do CONECTA +, um clube que reúne jovens do Educa e do Sertão em encontros online (lives), com acompanhamento de um responsável, abordando pilares do desenvolvimento socioemocional.',
    how:'Solicitar autorização das coordenações de Campo Largo e do Sertão.\nApresentar e validar o projeto com ambas as instituições.\nApós aprovação, convidar os jovens participantes.\nCriar grupo de WhatsApp para organização e comunicação.\nEstruturar o cronograma das lives e encontros online.\nRealizar os encontros online com acompanhamento de um responsável.\nIncentivar participação ativa, diálogo e reflexão dos jovens.\nAcompanhar o engajamento e desenvolvimento dos participantes ao longo do projeto.',
    impact:'Fortalecimento socioemocional dos jovens.\nMaior empatia e autoconsciência.\nTroca de experiências entre realidades diferentes.\nMelhora na gestão emocional.\nFormação de jovens mais preparados para a vida.'
  },
  {
    id:'prj_som', name:'O som do respeito', slot:'09:58', block:'Manhã', category:'Educação e Tecnologia',
    group:'Senhorinha', members:['David','Melissa','Maria Eduarda','Marina','Jake','Isak','Kauã','Maria Clara','Phelipe'],
    values:['Respeito','Empatia','Força','Coragem','Resiliência','Altruísmo','Sabedoria','Criatividade','Persistência','Generosidade'],
    // duas equipes (manhã e tarde) apresentam juntas; cada uma com seu Herói
    teams:[
      { label:'Equipe da Kiara', hero:'her_kiara',
        members:['David','Melissa','Maria Eduarda','Marina','Jake'],
        values:['Respeito','Empatia','Força','Coragem','Resiliência'] },
      { label:'Equipe do Neo', hero:'her_neo',
        members:['Isak','Kauã','Maria Clara','Phelipe'],
        values:['Altruísmo','Sabedoria','Criatividade','Persistência','Generosidade'] }
    ],
    heroes:[{id:'her_kiara', video:'mlzLQwC1SAc', name:'Kiara', inspiration:'Professora Geise e Malala', image:'img/heroi-17a.webp',
      story:'Kiara cresceu em uma comunidade onde o excesso de barulho fazia parte da rotina. Anos depois, realizou o sonho de se tornar professora e voltou para a escola onde estudou. Ao perceber que o excesso de ruídos também prejudicava a aprendizagem e a convivência escolar, criou o projeto Som do Respeito. Utilizando um medidor de decibéis e promovendo ações de conscientização com alunos, professores e funcionários, incentivou toda a comunidade escolar a refletir sobre a importância de um ambiente mais harmonioso. Com pequenas mudanças de atitude, a escola tornou-se um espaço mais acolhedor, organizado e favorável ao aprendizado.'},
      {id:'her_neo', video:'n2NSUNTJyks', name:'Neo', inspiration:'Mário Sérgio Cortella', image:'img/heroi-17b.webp',
      story:'Neo sempre teve sensibilidade auditiva e era incomodado pelo excesso de barulho, principalmente na escola. Um dia, encontrou no porão de casa um medidor de decibéis e o projeto inacabado de seu avô, que também tinha sensibilidade auditiva e sonhava criar uma solução para reduzir os ruídos nas escolas. Inspirado por esse legado, Neo decidiu concluir a ideia, desenvolvendo um semáforo inteligente de ruído para conscientizar alunos e professores sobre a importância de um ambiente mais harmonioso. Seu projeto mostrou que a tecnologia pode ser uma grande aliada na construção de uma escola mais respeitosa e favorável à aprendizagem.'}],
    tagline:'Dois grupos que identificaram o mesmo problema e uniram forças para criar um projeto mais completo.',
    meaning:'O projeto nasceu da preocupação dos alunos com o excesso de barulho na Escola Senhorinha. A realidade é vivenciada diariamente por todos e afeta ainda mais estudantes com sensibilidade auditiva. Os grupos da manhã e da tarde acreditam que, unindo conscientização e tecnologia, é possível tornar a escola um ambiente mais harmonioso e favorável à aprendizagem.',
    integration:'Os grupos da manhã e da tarde identificaram o mesmo problema: o excesso de barulho na Escola Senhorinha. Inicialmente, cada turma desenvolveu uma solução diferente. Após um momento de diálogo, perceberam que, em vez de competir, poderiam unir forças para criar um projeto mais completo.\nDurante essa construção, desenvolveram habilidades como diálogo, escuta, negociação e gestão de conflitos. O grupo da Kiara passou a atuar na sensibilização da comunidade escolar, enquanto o grupo do Neo ficou responsável pelo desenvolvimento do semáforo inteligente de ruído. Essa parceria mostrou que a colaboração fortalece as ideias e aumenta o impacto das soluções.',
    problem:'Com aproximadamente 2.000 alunos, a escola apresenta altos níveis de ruído, principalmente nas trocas de aula e nos corredores. O excesso de barulho prejudica a concentração, dificulta o trabalho dos professores e interfere no aprendizado e no bem-estar da comunidade escolar.',
    why:'Um ambiente escolar mais silencioso favorece a aprendizagem, a concentração e o respeito entre as pessoas. Promover a conscientização sobre os níveis de ruído é uma forma de melhorar a convivência e garantir mais qualidade no processo de ensino.',
    solution:'O projeto será desenvolvido em duas frentes. O grupo da Kiara realizará ações de sensibilização por meio de palestras, dinâmicas, campanhas, cartazes e bottons. O grupo do Neo desenvolverá um semáforo inteligente de ruído para monitorar o nível sonoro em algumas salas. As turmas serão incentivadas a manter o ambiente dentro dos níveis recomendados e poderão participar de um sistema de reconhecimento pelas boas práticas.',
    how:'Apresentar o projeto à direção e professores.\nElaborar o cronograma de execução.\nDesenvolver a campanha de sensibilização.\nLevantar os custos e construir os semáforos inteligentes.\nDefinir os locais de instalação.\nOrientar os alunos sobre o funcionamento do projeto.\nEstabelecer critérios para reconhecimento das turmas.\nMonitorar os resultados e avaliar os impactos.',
    impact:'Redução dos níveis de ruído na escola.\nMelhoria da concentração e do aprendizado.\nAmbiente mais acolhedor e respeitoso.\nInclusão de alunos com sensibilidade auditiva.\nMaior conscientização sobre convivência e respeito coletivo.\nIntegração entre tecnologia e educação.\nDesenvolvimento do protagonismo estudantil e do trabalho em equipe.'
  },
  {
    id:'prj_lutando', name:'Lutando por um futuro melhor', slot:'10:05', block:'Manhã', category:'Ação Social',
    group:'ABASC', members:['Erick','Marina','Victor','Vinícius'],
    values:['Altruísmo','Coragem','Perseverança','Empatia','Solidariedade'],
    heroes:[{id:'her_samuel', candidato:true, campanha:'Campanha na ABASC Colombo, com o Projeto Barracão.', video:'1Ke1mtXMH-8', name:'Samuel', inspiration:'Samuel significa "nome de Deus" ou "Deus ouve"', image:'img/heroi-02.webp',
      story:'Samuel cresceu em Colombo, em uma região vulnerável, e encontrou no Muay Thai, através de um projeto social, disciplina, respeito e propósito. Ao perceber que muitos jovens não tinham as mesmas oportunidades por falta de espaço, nasceu seu sonho de construir um barracão para ampliar o projeto e transformar mais vidas por meio do esporte, assim como o esporte transformou a sua.'}],
    tagline:'Mais do que construir um barracão, ampliar oportunidades para crianças e adolescentes da comunidade.',
    meaning:'Mais do que construir um barracão, este projeto busca ampliar oportunidades para crianças e adolescentes da comunidade. Por meio do esporte, queremos fortalecer valores, desenvolver disciplina, despertar sonhos e incentivar a construção de novos projetos de vida. A proposta é expandir uma iniciativa que já transforma realidades, permitindo que mais jovens tenham acesso a um ambiente seguro, acolhedor e inspirador para um futuro melhor.',
    problem:'O projeto de Muay Thai já transforma vidas, mas atualmente enfrenta limitações que impedem seu crescimento. As aulas acontecem em um espaço improvisado, com a necessidade constante de montar e desmontar os tatames, o que causa desgaste dos equipamentos e dos voluntários.\nAlém disso, o principal problema é a falta de capacidade para atender a demanda. Muitas crianças e adolescentes interessados não conseguem participar por falta de espaço, perdendo a oportunidade de desenvolver valores, disciplina e novas perspectivas de futuro.\nProblema central: falta de espaço adequado para ampliar o atendimento e oferecer a mais jovens acesso a uma iniciativa que já promove transformação social.',
    why:'O projeto de Muay Thai já transforma vidas por meio do esporte, promovendo disciplina, respeito e oportunidades para crianças e adolescentes da comunidade. No entanto, a falta de um espaço adequado limita o atendimento e impede que mais jovens participem.\nA ampliação da estrutura permitirá acolher mais crianças, fortalecer a inclusão social e oferecer um ambiente seguro para o desenvolvimento pessoal e a construção de um futuro melhor. Investir neste projeto é ampliar oportunidades e transformar vidas por meio do esporte.',
    solution:'Construção de um espaço próprio para ampliar o atendimento do projeto, acolher mais crianças e adolescentes e possibilitar novas modalidades, como balé, promovendo inclusão, desenvolvimento e transformação social por meio do esporte e da cultura.',
    how:'Identificação da demanda por mais vagas.\nPlanejamento da construção do barracão.\nVerificação da situação jurídica do terreno/espaço (propriedade, cessão de uso ou locação).\nMobilização de parceiros e apoiadores.\nCaptação de recursos e materiais.\nPlanejamento da ampliação das atividades e inclusão de novas modalidades.',
    impact:'Ampliação do atendimento a crianças e adolescentes da comunidade.\nRedução da ociosidade e da exposição a situações de vulnerabilidade social.\nDesenvolvimento de valores como disciplina, respeito, responsabilidade e perseverança.\nFortalecimento da autoestima, da confiança e da perspectiva de futuro dos participantes.\nImpacto positivo nas famílias e fortalecimento dos vínculos comunitários.'
  },
  {
    id:'prj_ia', name:'Aprender a pensar na era da IA', slot:'10:12', block:'Manhã', category:'Educação e Tecnologia',
    group:'Senhorinha', members:['Sthefany','Henrique','João','Milena','Victor'],
    values:['Sabedoria','Empatia','Coragem','Resiliência','Generosidade'],
    heroes:[{id:'her_lydia', video:'4TeTVFBmZ-k', name:'Lydia', inspiration:'Tânia Guerreiro', image:'img/heroi-16.webp',
      story:'Lydia entrou no mercado de trabalho como jovem aprendiz e utilizava a inteligência artificial para realizar praticamente todas as suas tarefas, sem utilizá-la como ferramenta de apoio ao aprendizado. Com o tempo, isso fez com que ela deixasse de desenvolver autonomia e compreensão dos processos. Um dia, quando a internet da empresa falhou, ela precisou realizar uma atividade sozinha e percebeu que não conseguia, o que a levou a refletir sobre sua forma de uso da IA. A partir dessa experiência, decidiu mudar sua postura e passou a estudar sobre o uso consciente da tecnologia. Ela desenvolveu uma inteligência artificial baseada no método socrático e nos "cinco porquês", que não entrega respostas prontas, mas estimula o raciocínio e o pensamento crítico. A solução foi tão eficiente que passou a ser adotada pela empresa e também por uma escola, promovendo um uso mais consciente e educativo da inteligência artificial.'}],
    tagline:'A tecnologia não é um problema em si, mas precisa ser usada de forma consciente, como ferramenta de apoio ao aprendizado.',
    meaning:'O projeto surgiu a partir de observações feitas em sala de aula, onde os alunos perceberam que o uso constante da inteligência artificial estava impactando a forma de aprender. Muitos relataram se sentir mais dependentes da IA e menos ativos no processo de leitura e raciocínio. Assim, o grupo compreendeu que a tecnologia não é um problema em si, mas precisa ser utilizada de forma consciente, como ferramenta de apoio ao aprendizado e não como substituição do pensamento crítico.',
    problem:'O acesso à inteligência artificial está cada vez mais fácil e presente no dia a dia dos estudantes. No entanto, muitos acabam utilizando a tecnologia de forma passiva, copiando respostas sem leitura crítica ou verificação das informações. Esse comportamento contribui para a diminuição do hábito de leitura, da interpretação de texto e do desenvolvimento do pensamento crítico. Em um cenário atual, inclusive o mercado de trabalho já aponta a leitura e a interpretação como habilidades essenciais em falta.',
    why:'A inteligência artificial é uma ferramenta poderosa e pode contribuir significativamente para o aprendizado e para o desenvolvimento pessoal e profissional. No entanto, seu uso precisa ser consciente e orientado, para que não substitua o raciocínio humano, mas o fortaleça. O projeto busca incentivar o uso responsável da tecnologia, promovendo autonomia, reflexão e desenvolvimento do pensamento crítico entre os estudantes.',
    solution:'O grupo propõe o desenvolvimento de uma inteligência artificial educativa baseada no método socrático e nos "cinco porquês", que não fornece respostas prontas, mas estimula o aluno a pensar por meio de perguntas guiadas. Essa IA seria implementada na escola como ferramenta de apoio ao aprendizado. Caso a criação da IA não seja viável no momento, o plano alternativo é a realização de cursos e treinamentos sobre o uso consciente da inteligência artificial para os alunos da escola.',
    how:'Consultar a professora técnica (Caroline) e especialistas em IA para avaliar a viabilidade do desenvolvimento da ferramenta.\nPesquisar modelos já existentes de IA educacional.\nDefinir se o projeto seguirá para criação da IA ou para o plano de capacitação.\nElaborar um cronograma de desenvolvimento ou de cursos, dependendo da decisão.\nBuscar profissionais da área para ministrar formações.\nOrganizar oficinas e palestras sobre uso consciente da IA.\nAplicar atividades práticas com os alunos sobre pensamento crítico e verificação de informações.',
    impact:'Maior uso consciente da inteligência artificial pelos estudantes.\nDesenvolvimento do pensamento crítico e da autonomia intelectual.\nRedução da dependência de respostas prontas.\nAumento da capacidade de leitura e interpretação de textos.\nMelhoria do desempenho escolar com aprendizado mais ativo.\nPreparação dos alunos para o mercado de trabalho.\nUso da tecnologia como ferramenta de aprendizagem, e não substituição do pensamento.\nFormação de uma cultura escolar mais crítica, reflexiva e responsável no uso da IA.'
  },
  {
    id:'prj_troca', name:'Moeda de Troca', slot:'10:19', block:'Manhã', category:'Educação',
    group:'INH', members:['Eloisa','Isa','Matheus','Victória'],
    values:['Responsabilidade','Disciplina','Paciência','Empatia','Sabedoria'],
    heroes:[{id:'her_virtus', name:'Virtus', inspiration:'José Pacheco (educador) e professora Carol (IDL Tech). Virtus significa virtude, coragem e excelência.', image:'img/heroi-10.webp',
      story:'Virtus percebeu que muitas pessoas queriam aprender novas habilidades, mas não tinham condições de pagar por cursos. Para mudar essa realidade, criou o TrocaDeTalentos, um aplicativo onde as pessoas ensinam o que sabem e aprendem umas com as outras. Assim, mostrou que compartilhar conhecimento é uma forma de transformar vidas e criar oportunidades para todos.'}],
    tagline:'Compartilhar conhecimento fortalece a comunidade, cria novas conexões e mostra que todos têm algo valioso para ensinar e aprender.',
    meaning:'Este projeto nasceu da percepção de que muitas pessoas possuem talentos e conhecimentos que podem transformar a vida de outras. Ao mesmo tempo, muitas gostariam de aprender novas habilidades, mas encontram barreiras financeiras. O grupo acredita que compartilhar conhecimento fortalece a comunidade, cria novas conexões e mostra que todos têm algo valioso para ensinar e aprender.',
    problem:'Muitas pessoas possuem conhecimentos e habilidades que poderiam compartilhar, enquanto outras desejam aprender, mas não têm acesso a cursos. Além disso, as relações na comunidade tornam-se cada vez mais limitadas aos próprios círculos sociais, reduzindo as oportunidades de troca, colaboração e aprendizado entre as pessoas.',
    why:'O grupo acredita que facilitar a troca gratuita de conhecimentos fortalece a comunidade e amplia o acesso ao aprendizado. Compartilhar talentos gera oportunidades, aproxima pessoas e demonstra que o conhecimento é um recurso capaz de transformar vidas quando é dividido.',
    solution:'Desenvolver o TrocaDeTalentos, um aplicativo onde as pessoas poderão cadastrar os conhecimentos que desejam ensinar e as habilidades que gostariam de aprender. O sistema organizará os participantes, facilitará o agendamento das trocas e será testado inicialmente em um projeto piloto no INH, envolvendo alunos e professores.',
    how:'Buscar parceria com instrutores ou desenvolvedores para criação do aplicativo.\nApresentar o projeto à coordenação do INH e solicitar autorização para o projeto piloto.\nDefinir como acontecerão as trocas de conhecimento (presenciais, online ou híbridas).\nLevantar os custos e recursos necessários para desenvolver o aplicativo.\nEstruturar o cadastro de participantes e dos talentos disponíveis.\nImplementar e acompanhar o projeto piloto no INH.',
    impact:'Democratização do acesso ao conhecimento.\nFortalecimento da colaboração entre as pessoas.\nCriação de novas conexões dentro da comunidade.\nValorização dos talentos individuais.\nAmpliação das oportunidades de aprendizagem sem custo.\nFormação de uma comunidade mais participativa, colaborativa e conectada.'
  },
  {
    id:'prj_ponte', name:'Projeto ponte', slot:'10:26', block:'Manhã', category:'Saúde',
    group:'ABASC', members:['Gabrielle','Júlia','Paolla'],
    values:['Altruísmo','Justiça','Igualdade','Coragem','Solidariedade'],
    heroes:[{id:'her_clara', video:'oBfJ3IkU0NU', name:'Clara', inspiration:'Marilene Proença Rebelo de Souza, ativa na Lei nº 13.935/2019, que garante a atuação de psicólogos e assistentes sociais', image:'img/heroi-01.webp',
      story:'Clara enfrentou dificuldades emocionais na infância e descobriu como o apoio psicológico pode transformar vidas. Inspirada por essa experiência, passou a defender que todas as crianças tenham acesso a esse cuidado nas escolas, acreditando que a presença de profissionais garantidos pela Lei 13.935/2019 pode acolher, prevenir sofrimentos e oferecer mais esperança para o futuro.'}],
    tagline:'Cuidar da saúde mental das crianças é investir em seu desenvolvimento e no futuro da sociedade.',
    meaning:'Este projeto nasceu da convicção de que cuidar da saúde mental das crianças é investir em seu desenvolvimento e no futuro da sociedade. Ao perceberem que a presença de psicólogos nas escolas ainda é uma realidade distante, mesmo sendo prevista em lei, o grupo decidiu compreender os motivos dessa situação e buscar caminhos para que esse direito seja efetivamente garantido.',
    problem:'Embora a Lei nº 13.935/2019 preveja a atuação de psicólogos e assistentes sociais na rede pública de ensino, muitas escolas ainda não contam com esses profissionais. Essa ausência dificulta a prevenção de problemas emocionais e reduz o suporte oferecido aos estudantes em uma fase fundamental do desenvolvimento.',
    why:'A escola é um espaço essencial para o desenvolvimento das crianças e adolescentes, e o cuidado com a saúde mental faz parte desse processo. Compreender por que a legislação ainda não é plenamente aplicada é um passo importante para fortalecer as políticas públicas e contribuir para que mais estudantes tenham acesso ao acolhimento e ao acompanhamento de que precisam.',
    solution:'Investigar como a Lei nº 13.935/2019 está sendo implementada na rede pública de ensino, identificando os desafios que impedem sua efetivação e dialogando com profissionais e órgãos responsáveis para compreender quais ações podem contribuir para ampliar o acesso aos serviços de Psicologia nas escolas.',
    how:'Estudar a Lei nº 13.935/2019 e seu processo de implementação.\nConversar com uma assistente social sobre a realidade da rede pública.\nEntrevistar uma pedagoga para compreender as necessidades da escola.\nIdentificar como ocorre a solicitação de psicólogos pelas instituições de ensino.\nBuscar informações junto ao Núcleo Regional de Educação.\nReunir-se com a Secretaria de Educação para compreender os desafios e possibilidades de implementação da lei.',
    impact:'Maior conscientização sobre o direito ao atendimento psicológico nas escolas.\nAproximação entre estudantes, escolas e órgãos públicos.\nFortalecimento da discussão sobre saúde mental no ambiente escolar.\nIncentivo à efetivação da Lei nº 13.935/2019.\nContribuição para que mais crianças e adolescentes tenham acesso ao apoio psicológico.\nFormação de estudantes mais conscientes sobre cidadania, direitos e participação social.'
  },
  {
    id:'prj_conexao', name:'Conexão de verdade', slot:'10:33', block:'Manhã', category:'Saúde',
    group:'Educa', members:['Aghata','Emily','Felipe','Gleyciani','Lanna'],
    values:['Responsabilidade','Empatia','Altruísmo','Coragem'],
    heroes:[{id:'her_duda', name:'Duda', inspiration:'Professora Bruna do Educa', image:'img/heroi-06.webp',
      story:'Duda percebeu que as crianças estavam passando muito tempo no celular e criou a ação Conexão de Verdade. Com brincadeiras e atividades em grupo, ajudou as crianças a fortalecer amizades e se divertir longe das telas. Sua mensagem é: "Desligue a tela. Ligue a vida!".'}],
    tagline:'Fortalecer a conexão dentro de casa é o primeiro passo para fortalecer a sociedade.',
    meaning:'O projeto nasceu da própria vivência do grupo no Educa. Eles perceberam que o uso excessivo do celular afastava os jovens e dificulta o relacionamento de amizades. Com as ações promovidas pela professora Bruna, descobriram que, quando as telas perdem espaço, o diálogo, as brincadeiras e os vínculos ganham força. Inspirados por essa transformação, decidiram levar esse aprendizado também para as famílias, acreditando que fortalecer a conexão dentro de casa é o primeiro passo para fortalecer a sociedade.',
    problem:'O uso excessivo de telas tem causado uma quebra nas conexões sociais e familiares. No Educa, o grupo observou que muitos jovens passam grande parte do tempo no celular, o que reduz a interação entre amigos e afeta o convívio coletivo. Essa realidade também é percebida em muitas famílias, incluindo dentro das próprias casas dos integrantes, onde irmãos e crianças convivem mais com telas do que entre si. Esse cenário evidencia um problema crescente: a dificuldade de comunicação, convivência e vínculo entre as pessoas devido ao uso exagerado da tecnologia.',
    why:'Este projeto se justifica pela importância da conexão familiar e social para o desenvolvimento das crianças e adolescentes. A convivência e o diálogo são fundamentais para fortalecer vínculos e promover bem-estar emocional. Diante do aumento do uso de telas, da ansiedade e até de comportamentos de dependência digital entre crianças, o grupo entende a necessidade de conscientizar as famílias sobre esse tema. Além disso, muitos pais também fazem uso excessivo de celulares, o que reforça a urgência de uma ação educativa que envolva toda a família, ajudando a reconstruir relações mais próximas e saudáveis.',
    solution:'O grupo desenvolverá o Programa Conexão de Verdade, composto por três encontros presenciais com as famílias do Educa, realizados nos meses de agosto, setembro e outubro. No primeiro encontro, será apresentado o programa e identificadas as famílias interessadas em participar. A partir daí, elas receberão desafios e atividades em formato de jogos, com metas, tarefas e um sistema de pontuação que incentivará a participação de todos os membros da família.\nAo longo dos três meses, as famílias serão estimuladas a reduzir o tempo de tela e substituí-lo por momentos de convivência, diálogo e interação. Ao final do programa, os participantes serão reconhecidos pelos resultados alcançados, incentivando a continuidade dos hábitos construídos. O principal objetivo da iniciativa é promover uma verdadeira desconexão das telas para fortalecer as conexões entre as pessoas.',
    how:'Solicitar autorização da direção do Educa para realização de três encontros (agosto, setembro e outubro).\nPlanejar o cronograma completo do programa/desafio.\nDefinir atividades, metas e sistema de pontuação (possível ranking familiar).\nEstruturar as regras e formato do “jogo da desconexão digital”.\nOrganizar palestra de lançamento do projeto.\nConvidar as famílias do Educa para participação (aproximadamente 90 famílias).\nRealizar o primeiro encontro em agosto para apresentação e adesão ao desafio.\nAcompanhar o desenvolvimento das atividades ao longo dos três meses.\nRealizar o encontro final em outubro para avaliação e encerramento.',
    impact:'Redução do uso excessivo de telas entre crianças e famílias participantes.\nAumento da comunicação e convivência entre pais, filhos e irmãos.\nFortalecimento dos vínculos familiares e sociais.\nMaior consciência sobre o uso saudável da tecnologia.\nMelhoria no comportamento social e emocional das crianças.\nEngajamento das famílias em práticas mais presentes e conectadas no dia a dia.\nCriação de uma cultura de equilíbrio entre vida digital e vida real dentro da comunidade do Educa.'
  },
  {
    id:'prj_ouvir', name:'Ouvir para transformar', slot:'10:40', block:'Manhã', category:'Saúde e Bem-Estar',
    group:'Senhorinha', members:['Alice','Gustavo','Luna','Maria Fernanda','Maurício','Vitória'],
    values:['Confiança','Empatia','Altruísmo','Coragem','Lealdade'],
    heroes:[{id:'her_samantha', candidato:true, campanha:'Campanha no Senhorinha, com o projeto da escuta compassiva.', video:'fwRmOxP5ZpE', name:'Samantha', inspiration:'Júlia (irmã de aluna) e Camila (mãe de aluna)', image:'img/heroi-13.webp',
      story:'Samantha era uma adolescente que não se sentia ouvida em casa e, por isso, tinha medo de se expressar. Após participar de uma palestra sobre escuta compassiva, percebeu que seus pais apenas repetiam um padrão que também viveram na infância. Ao convidá-los para uma nova palestra, a família compreendeu a importância de ouvir sem julgamentos, fortalecendo o diálogo e os vínculos. Anos depois, Samantha tornou-se psicóloga e passou a levar palestras sobre escuta compassiva às escolas, ajudando outras famílias a romperem esse ciclo e construírem relações mais saudáveis.'}],
    tagline:'A escuta compassiva é um dos pilares para famílias saudáveis e para uma convivência mais respeitosa entre todas as pessoas.',
    meaning:'Este projeto nasceu da realidade vivida pelo próprio grupo. Durante as conversas, muitos integrantes perceberam que também enfrentam a falta de escuta compassiva dentro de casa. Mais do que apresentar uma ideia para a escola, este projeto representa um desejo de transformar relacionamentos por meio do diálogo, da empatia e da escuta verdadeira. O grupo acredita que a escuta compassiva é um dos pilares para famílias saudáveis e para uma convivência mais respeitosa entre todas as pessoas.',
    problem:'O diálogo dentro das famílias tem se tornado cada vez mais escasso. A rotina acelerada, o excesso de compromissos e o uso constante da tecnologia contribuem para que as pessoas conversem menos e escutem umas às outras com menos atenção. Essa realidade também está presente na escola e em outros ambientes, onde muitas vezes alunos, professores, amigos e familiares escutam apenas para responder, e não para compreender. A falta da escuta compassiva enfraquece os relacionamentos, aumenta os conflitos e dificulta a construção de vínculos saudáveis.',
    why:'A escuta compassiva fortalece a confiança, reduz conflitos e cria ambientes mais acolhedores. Quando uma pessoa se sente verdadeiramente ouvida, ela desenvolve mais segurança para expressar seus sentimentos e construir relacionamentos saudáveis. O grupo acredita que incentivar a escuta compassiva entre pais e filhos, professores e alunos, amigos e familiares pode transformar a convivência e contribuir para o desenvolvimento emocional de toda a comunidade escolar.',
    solution:'A proposta é realizar o Dia D da Escuta Compassiva, um evento na escola envolvendo toda a comunidade. O encontro contará com palestras, apresentação da história da heroína Samantha, dinâmicas entre pais e filhos, atividades de integração, exposição de cartazes produzidos pelos alunos e venda de pastéis para arrecadar recursos em benefício da escola. Além disso, o grupo pretende incentivar ações práticas de escuta compassiva durante todo o projeto, incluindo uma visita a um asilo, proporcionando aos estudantes a oportunidade de ouvir histórias, valorizar os idosos e colocar em prática a empatia e o acolhimento.',
    how:'Solicitar autorização da direção para realização do projeto.\nElaborar um cronograma com todas as etapas.\nOrganizar a equipe responsável por cada atividade.\nBuscar parcerias e doações para o evento e para a venda de pastéis.\nProduzir cartazes e materiais de conscientização.\nConvidar as famílias para participarem do Dia D.\nPreparar palestras e dinâmicas sobre escuta compassiva.\nRealizar a visita ao asilo para incentivar a prática da escuta compassiva com os idosos.\nAvaliar os resultados e incentivar que a prática da escuta continue fazendo parte da rotina da escola e das famílias.',
    impact:'Fortalecimento do diálogo dentro das famílias.\nDesenvolvimento da empatia e do respeito entre as pessoas.\nMelhoria no relacionamento entre pais e filhos.\nAproximação entre professores e alunos.\nIncentivo à escuta ativa entre amigos e colegas.\nRedução de conflitos causados pela falta de comunicação.\nMaior sentimento de pertencimento e acolhimento na escola.\nFormação de uma comunidade escolar mais humana, colaborativa e preparada para ouvir antes de julgar.'
  },
  {
    id:'prj_familycast', name:'Escuta compassiva: Family Cast', slot:'10:47', block:'Manhã', category:'Saúde',
    group:'INH', members:['Flávia','Héric','Júlia','Kauany'],
    values:['Persistência','Família','Respeito','Ética','Responsabilidade'],
    heroes:[{id:'her_kizuna', video:'tTXq107j__8', name:'Kizuna', inspiration:'Içami Tiba. Kizuna significa laço, vínculo, conexão entre pessoas.', image:'img/heroi-11.webp',
      story:'Kizuna, o Guardião dos Laços, percebeu que sentimentos como abandono, rejeição e falta de diálogo enfraqueciam as relações entre as pessoas. Por meio da escuta compassiva, do respeito e da empatia, passou a fortalecer os vínculos familiares e a combater os Fragmentos Sombrios, mostrando que ouvir com o coração é o primeiro passo para transformar vidas.'}],
    tagline:'Ouvir com empatia pode restaurar relacionamentos, fortalecer famílias e transformar vidas.',
    meaning:'Este projeto representa a continuidade de um propósito que nasceu no ano anterior. Ao perceber a importância da escuta compassiva para fortalecer os vínculos familiares, um dos integrantes decidiu não desistir do Family Cast, mas dar continuidade ao sonho de fazer essa mensagem chegar a mais pessoas. O grupo abraçou essa ideia por acreditar que ouvir com empatia pode restaurar relacionamentos, fortalecer famílias e transformar vidas.',
    problem:'Muitas famílias enfrentam dificuldades causadas pela falta de diálogo, pela ausência emocional e pelos conflitos constantes. Quando as pessoas deixam de se ouvir com atenção e empatia, surgem sentimentos como solidão, insegurança, rejeição e baixa autoestima, enfraquecendo os vínculos familiares e afetando o desenvolvimento emocional de todos.',
    why:'A família é o primeiro espaço onde aprendemos valores, respeito e convivência. O grupo acredita que incentivar a escuta compassiva pode fortalecer os relacionamentos, prevenir conflitos e contribuir para famílias mais unidas. Compartilhar esse conhecimento significa promover uma cultura de diálogo, acolhimento e compreensão.',
    solution:'Fortalecer o Family Cast como um canal de divulgação sobre escuta compassiva, ampliando sua presença por meio do YouTube e de outros meios de comunicação. O objetivo é levar conteúdos que incentivem o diálogo e a restauração dos vínculos familiares, alcançando cada vez mais pessoas.',
    how:'Criar e estruturar o canal do Family Cast no YouTube.\nPublicar o primeiro episódio gravado com a profissional Giselle Cipilli.\nConvidar Giselle Cipilli para orientar o projeto e participar de novos episódios.\nBuscar parceria com a Akiyama para realizar uma live sobre escuta compassiva.\nEntrar em contato com a Rádio Marumby para apresentar o projeto e buscar espaço na programação.\nProduzir e divulgar novos episódios, ampliando o alcance da mensagem.',
    impact:'Fortalecimento do diálogo e da escuta dentro das famílias.\nMaior conscientização sobre a importância da escuta compassiva.\nAmpliação do alcance do Family Cast e da mensagem do projeto.\nIncentivo à resolução saudável de conflitos familiares.\nFamílias mais unidas, acolhedoras e emocionalmente fortalecidas.\nFormação de uma comunidade mais empática, baseada no respeito, na compreensão e no diálogo.'
  },
  {
    id:'prj_fronteira', name:'Além das Fronteiras', slot:'10:54', block:'Manhã', category:'Ação Social',
    group:'Educa', members:['Gabriel','Gustavo','Lívia','Mannu','Nycolas'],
    values:['Disciplina','Determinação','Superação','Perseverança'],
    heroes:[{id:'her_felix', video:'Ui3-XNh46jQ', name:'Félix', inspiration:'Cristiano Ronaldo', image:'img/heroi-05.webp',
      story:'Félix estudou no Projeto Azul quando criança e viveu os benefícios de um espaço acolhedor, seguro e cheio de oportunidades. Inspirado pela perseverança de Cristiano Ronaldo, decidiu agir para revitalizar o projeto, mobilizando a comunidade para que mais crianças e adolescentes tenham acesso ao cuidado, aprendizado e desenvolvimento que ele também recebeu.'}],
    tagline:'Olhar além do próprio contexto e ajudar quem também precisa — gratidão, empatia e solidariedade.',
    meaning:'Este projeto se justifica pela necessidade real existente na comunidade. Também representa gratidão, empatia e solidariedade. Ao conhecer a realidade do Projeto Azul, o grupo percebeu a importância de olhar além do próprio contexto e ajudar quem também precisa. A iniciativa tem um significado ainda mais especial porque dois integrantes já estudaram no Projeto Azul e agora desejam retribuir, contribuindo para melhorar o espaço que fez parte de suas histórias.',
    problem:'Muitas famílias da comunidade de Colombo precisam trabalhar durante o dia e dependem de projetos sociais para garantir que seus filhos estejam em ambientes seguros, acolhedores e educativos. Entretanto, durante uma visita ao Projeto Azul, o grupo identificou que o espaço apresenta condições precárias, com ambientes necessitando de reformas e melhorias. Diante dessa realidade, surge a preocupação de garantir que as crianças atendidas pelo projeto tenham acesso a um local mais adequado para seu desenvolvimento, bem-estar e aprendizagem.',
    why:'Este projeto se justifica pela necessidade real existente na comunidade. O número de vagas em projetos sociais é insuficiente para atender toda a demanda, havendo inclusive fila de espera em outras instituições. Dessa forma, fortalecer o Projeto Azul significa ampliar as oportunidades de acolhimento e cuidado para crianças e adolescentes da região. Ao contribuir para a melhoria de um dos espaços do projeto, o grupo busca proporcionar mais conforto, segurança e qualidade no atendimento, beneficiando diretamente as crianças e suas famílias.',
    solution:'Considerando que não é possível realizar a reforma completa da instituição, o grupo concentrará seus esforços na revitalização de um ambiente específico do Projeto Azul. A proposta é identificar o espaço com maior necessidade, levantar os recursos necessários e mobilizar a comunidade e empresários locais para arrecadar os materiais e valores necessários para a reforma. A iniciativa busca gerar uma transformação concreta e inspirar outras ações de apoio à instituição.',
    how:'Realizar reunião com a diretora do Projeto Azul para apresentar a proposta e obter autorização.\nApresentar o projeto à coordenação do Educa para obter apoio e alinhamento institucional.\nEscolher o ambiente que será reformado.\nRealizar levantamento das necessidades e custos da reforma.\nElaborar estratégias de captação de recursos.\nPromover encontros e apresentações para empresários da região.\nUtilizar redes sociais para divulgar a campanha e buscar apoiadores (se necessário).\nAcompanhar a execução da reforma.',
    impact:'Melhoria da estrutura física de um dos ambientes do Projeto Azul.\nMais conforto, segurança e bem-estar para as crianças atendidas.\nFortalecimento da rede de apoio entre projetos sociais da comunidade.\nDesenvolvimento da empatia, cidadania e protagonismo dos integrantes do grupo.\nSensibilização de empresários para as necessidades sociais da região.\nInspiração para futuras ações solidárias e colaborativas na comunidade.\nValorização do Projeto Azul como espaço de acolhimento, desenvolvimento e transformação social.'
  },
  {
    id:'prj_protagonismo', name:'Protagonismo estudantil na transformação do espaço escolar', slot:'11:01', block:'Manhã', category:'Inovação e Protagonismo Juvenil',
    group:'Senhorinha', members:['Igor','Kayla','Lukas','Maria Alice','Maria Clara'],
    values:['Criatividade','Altruísmo','Sabedoria','Persistência','Coragem'],
    heroes:[{id:'her_faisca', video:'cg_1Rtpzmsk', name:'Faísca', inspiration:'Illan Kriger (moço do eu te amo), Giuliana Mafra e Giba', image:'img/heroi-15.webp',
      story:'Faísca era um aluno de origem simples que percorria um longo caminho para chegar à escola. Seu sonho era ter uma bicicleta, e após muito esforço conseguiu comprá-la. Ao chegar na escola, percebeu que não havia um espaço adequado para guardar as bicicletas, que ficavam espalhadas e em meio ao desorganizado bicicletário. Diante disso, decidiu agir: pediu autorização à direção e construiu um bicicletário melhor organizado. Com o tempo, outros alunos se inspiraram em sua iniciativa e passaram a ajudar, ampliando as melhorias no ambiente escolar. Faísca mostrou que, ao cuidar do espaço onde estudamos, todos podem contribuir para tornar a escola mais acolhedora e organizada.'}],
    tagline:'Em vez de apenas identificar problemas, decidiram agir coletivamente para transformar a escola em um espaço mais organizado, funcional e acolhedor.',
    meaning:'O projeto nasceu quando os alunos observaram o próprio ambiente escolar e perceberam que ele precisava de melhorias. Em vez de apenas identificar problemas, decidiram agir coletivamente para transformar a escola em um espaço mais organizado, funcional e acolhedor. A ideia central é mostrar que, quando os alunos se unem, eles podem cuidar e melhorar o lugar onde estudam todos os dias.',
    problem:'A escola atende cerca de 1.500 a 2.000 alunos diariamente e apresenta desafios de organização estrutural. Há mais de 50 bicicletas deixadas de forma desorganizada, ocupando espaços como a quadra de vôlei. A horta escolar está abandonada, com mato e sem uso. Além disso, há carteiras danificadas, necessidade de pintura de muros e uma percepção geral de desorganização do ambiente escolar, o que impacta o uso adequado dos espaços e a convivência dos alunos.',
    why:'Os alunos passam grande parte do dia na escola, portanto, faz sentido que também sejam agentes de transformação desse ambiente. Ao cuidar do espaço escolar, eles desenvolvem senso de responsabilidade, pertencimento e exemplo para outros estudantes. A melhoria da escola não depende apenas da gestão, mas também do envolvimento coletivo e da vontade de fazer diferente.',
    solution:'O projeto propõe a revitalização de espaços da escola, incluindo a construção de um bicicletário organizado, a recuperação da horta escolar e a implementação de um sistema de irrigação automatizado utilizando Arduino, tornando o ambiente mais funcional e agradável para todos.',
    how:'Solicitar autorização da direção para intervenções na horta e no espaço do bicicletário.\nMapear e medir os espaços disponíveis na escola.\nElaborar um projeto técnico do bicicletário.\nSolicitar orçamento com apoio de um profissional (mestre de obras ou similar).\nBuscar apoio de empresários e parceiros locais para viabilizar a execução.\nRecuperar e reorganizar a horta escolar.\nDesenvolver o sistema de irrigação com Arduino nas aulas de tecnologia.\nMobilizar alunos para participação ativa nas melhorias.\nExecutar as reformas e acompanhar a manutenção dos espaços.',
    impact:'Melhoria na organização e no visual da escola.\nMelhor aproveitamento dos espaços, como quadra e horta.\nMaior senso de pertencimento dos alunos com o ambiente escolar.\nIncentivo ao cuidado coletivo e à responsabilidade.\nDesenvolvimento de habilidades práticas e tecnológicas (Arduino).\nIntegração entre teoria e prática nas aulas.\nInspiração para outros alunos participarem de melhorias.\nCriação de uma cultura de protagonismo estudantil.\nValorização da escola como espaço de convivência e aprendizagem.'
  },
  {
    id:'prj_memorias', name:'Construindo memórias de cuidado', slot:'11:08', block:'Manhã', category:'Ação Social',
    group:'ABASC', members:['Anderson','Evellyn','Marcelo','Victor'],
    values:['Coragem','Empatia','Solidariedade','Responsabilidade','Altruísmo'],
    heroes:[{id:'her_lumen', candidato:true, campanha:'Campanha na ABASC Colombo, com o Projeto Parquinho.', video:'LXtThKVfC3Q', name:'Lumen', inspiration:'Lumen significa luz, brilho, fonte de luz', image:'img/heroi-03.webp',
      story:'Lumen teve uma infância difícil, marcada por separação dos pais, violência e abandono, encontrando no parquinho um refúgio de esperança e acolhimento. Essa experiência o marcou profundamente e o inspirou, já adulto e professor, a criar espaços que ofereçam alegria, pertencimento e novas oportunidades para crianças que vivem realidades semelhantes à que ele viveu.'}],
    tagline:'Oferecer a crianças em vulnerabilidade momentos de alegria, acolhimento e pertencimento.',
    meaning:'Construindo Memórias de Cuidado é um projeto que busca oferecer a crianças em vulnerabilidade momentos de alegria, acolhimento e pertencimento. Mais do que um parquinho, pretende criar experiências positivas e seguras que se tornem memórias afetivas, ajudando-as a brincar, sonhar e viver com mais esperança mesmo em contextos difíceis.',
    problem:'Durante atividades na ABASC de Colombo, foi observado que crianças da Casa Lar e de famílias vulneráveis não possuem um espaço adequado para brincar. Apesar do ambiente acolhedor e dos voluntários, elas utilizam apenas um pátio cimentado e recursos simples, o que limita o brincar, a socialização e o desenvolvimento de experiências mais significativas dentro da instituição.',
    why:'Muitas das crianças atendidas pela ABASC enfrentam situações familiares delicadas, como afastamento dos pais, acompanhamento do Conselho Tutelar ou acolhimento institucional. Diante dessa realidade, torna-se fundamental oferecer espaços que promovam bem-estar, convivência e esperança. A criação de um parquinho e de atividades voltadas à infância poderá contribuir para que essas crianças vivenciem momentos de felicidade, fortaleçam vínculos sociais e construam memórias positivas que ajudem a tornar sua trajetória mais leve e significativa.',
    solution:'Consiste na construção de um parquinho interativo em um espaço cedido pela igreja, com aproximadamente 7,5 m x 12 m (ou 17 m x 7 m), voltado para as crianças do projeto social. O ambiente será complementado com atividades pedagógicas adequadas às faixas etárias (6 a 10 anos) promovendo brincadeiras, aprendizagem e convivência.',
    how:'Verificação de aspectos jurídicos da estrutura da igreja (concessão).\nSolicitar autorização formal da igreja e do coordenador do projeto.\nLevantar dados sobre o número de crianças atendidas e o público-alvo do projeto.\nRealizar estudo de campo com observação das crianças durante algumas horas, identificando quais atividades realizam, como brincam e como interagem no espaço atual.\nPesquisar normas de segurança para parquinhos infantis (estrutura, materiais e acessibilidade).\nElaborar o projeto completo do parquinho.',
    impact:'Criação de um espaço seguro e acolhedor para brincadeiras.\nMelhoria na socialização entre as crianças.\nEstímulo ao desenvolvimento cognitivo, motor e emocional.\nGeração de memórias positivas e sentimento de pertencimento.\nFortalecimento do vínculo entre comunidade, igreja e projeto social.\nTransformação do tempo de permanência das crianças em momentos significativos de cuidado.'
  },
  {
    id:'prj_acolher', name:'Espaço acolher', slot:'11:15', block:'Manhã', category:'Educação Inclusiva',
    group:'Senhorinha', members:['Andrew','Daniel','Rafael','Victória','Vitinho'],
    values:['Criatividade','Altruísmo','Coragem','Persistência','Sabedoria'],
    heroes:[{id:'her_karol', video:'SG9mMaAMzuo', name:'Karol', inspiration:'Professora Cris da sala Multifuncional', image:'img/heroi-14.webp',
      story:'Karol cresceu ao lado de sua irmã autista e acompanhou de perto os desafios que ela enfrentava na escola. Em momentos de sobrecarga, sua irmã conseguia se acalmar utilizando um cubo mágico e outros objetos de regulação, mas a escola não possuía um espaço tranquilo nem recursos que ajudassem alunos nessas situações. Essa realidade despertou em Karol o desejo de fazer a diferença. Depois de se formar, ela buscou parcerias e recursos para criar uma Sala Calma, um ambiente acolhedor com materiais sensoriais e estratégias de regulação emocional. O espaço passou a atender não apenas estudantes autistas, mas todos os alunos que, em algum momento, precisassem recuperar o equilíbrio emocional para voltar às atividades com mais tranquilidade e segurança.'}],
    tagline:'Inclusão vai além da presença do aluno na escola: ela acontece quando todos têm condições reais de aprender.',
    meaning:'Este projeto nasceu quando o grupo percebeu que alguns colegas neurodivergentes e outros estudantes com necessidades específicas enfrentavam dificuldades para permanecer em sala de aula durante momentos de sobrecarga emocional ou sensorial. Inicialmente, os alunos acreditavam que a solução seria conseguir professores de apoio para todos. Porém, após conversar com uma especialista, compreenderam que essa realidade depende de diversos fatores e não possui uma solução simples. Em vez de apenas apontar o problema, decidiram criar uma alternativa que estivesse ao alcance da escola: uma Sala Calma, oferecendo um ambiente acolhedor para que qualquer estudante possa se regular emocionalmente e retornar às aulas com mais tranquilidade.',
    problem:'Muitas escolas não possuem espaços adequados para acolher alunos que, em determinados momentos, precisam de um ambiente tranquilo para recuperar o equilíbrio emocional. Durante crises ou situações de sobrecarga, esses estudantes frequentemente precisam deixar a sala de aula, acabam perdendo conteúdos e enfrentam dificuldades ainda maiores no processo de aprendizagem. Essa necessidade não se limita aos alunos autistas, mas também pode atingir estudantes com TDAH, ansiedade, outras condições ou até aqueles que estejam vivendo momentos difíceis.',
    why:'O grupo acredita que a inclusão vai além da presença do aluno na escola: ela acontece quando todos têm condições reais de aprender. Uma Sala Calma oferece acolhimento, respeito às diferenças e melhores condições para que os estudantes retornem às atividades mais tranquilos e preparados para aprender. O projeto demonstra que pequenas ações podem promover uma escola mais inclusiva, humana e acessível para todos.',
    solution:'Criar uma Sala Calma dentro da escola, equipada com materiais sensoriais, iluminação adequada e recursos de regulação emocional. O espaço será destinado a qualquer estudante que necessite de um momento para se reorganizar emocionalmente antes de retornar às atividades escolares, promovendo bem-estar, inclusão e melhores condições de aprendizagem.',
    how:'Desenvolver o projeto em parceria com a direção da escola (já está autorizado).\nRealizar uma visita técnica à IBB para conhecer o funcionamento da Sala Calma já existente.\nLevantar os materiais e os custos necessários para implantação.\nBuscar parcerias, doações e estratégias para arrecadação de recursos.\nReformar e preparar o espaço disponibilizado pela escola.\nAdquirir os materiais sensoriais e mobiliário necessários.\nOrganizar orientações para utilização da Sala Calma.\nDivulgar o projeto para toda a comunidade escolar.',
    impact:'Redução da sobrecarga emocional durante o período escolar.\nDiminuição da perda de conteúdos por saídas frequentes da sala de aula.\nMelhoria do bem-estar e da qualidade de vida dos estudantes.\nAmbiente escolar mais acolhedor e respeitoso com as diferenças.\nFortalecimento da permanência e da participação dos alunos nas atividades.\nSensibilização da comunidade escolar sobre inclusão e regulação emocional.\nCriação de um espaço que beneficie toda a escola, não apenas um grupo específico de estudantes.'
  }
  ]
};
