const express = require('express');
const cors = require('cors'); 
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Banco de dados temporário em memória (Simulação)
const leadsDatabase = {};

// Função que processa a mensagem usando a lógica simulada do CRM Inteligente
async function processarMensagemComIA(contact, message) {
  try {
    console.log(`[Fila em Memória] A processar mensagem de ${contact}... (Modo Simulação Comercial)`);

    // Busca o histórico do lead ou cria um novo
    if (!leadsDatabase[contact]) {
      leadsDatabase[contact] = { 
        contact: contact,
        score: 0, 
        classification: 'Frio', 
        history: [],
        intent_detected: 'Conversa genérica',
        urgency_level: 'low',
        lastMessage: message
      };
    }

    const lead = leadsDatabase[contact];
    const msgLower = message.toLowerCase();
    lead.lastMessage = message; 

    // Valores padrão para mensagens genéricas
    let score_increment = 5; 
    let reply = "Entendi! Como posso te ajudar a organizar melhor as vendas da sua empresa?";
    let request_human_intervention = false;

    // 🌟 Validação de Saudações (Bom dia / Boa tarde / Boa noite)
    if (msgLower.includes("bom dia")) {
      score_increment = 2;
      lead.intent_detected = "Saudação (Bom dia)";
      reply = "Bom dia! Como posso ajudar?";
    } 
    else if (msgLower.includes("boa tarde")) {
      score_increment = 2;
      lead.intent_detected = "Saudação (Boa tarde)";
      reply = "Boa tarde! Como posso ajudar?";
    } 
    else if (msgLower.includes("boa noite")) {
      score_increment = 2;
      lead.intent_detected = "Saudação (Boa noite)";
      reply = "Boa noite! Como posso ajudar?";
    }
    // 📊 Análise de gatilhos comerciais (Preço, Prazo, Proposta, Fechamento)
    else if (msgLower.includes("preço") || msgLower.includes("quanto custa") || msgLower.includes("valor") || msgLower.includes("mensalidade")) {
      score_increment = 10;
      lead.intent_detected = "Perguntou preço";
      reply = "O nosso plano básico começa em R$ 197/mês com IA inclusa. Qual o tamanho do seu time de vendas hoje?";
    } 
    else if (msgLower.includes("prazo") || msgLower.includes("quando") || msgLower.includes("demora")) {
      score_increment = 15;
      lead.intent_detected = "Perguntou prazo de entrega/uso";
      reply = "A liberação do sistema é imediata! Assim que configurarmos o seu WhatsApp, a IA começa a atender.";
    } 
    else if (msgLower.includes("proposta") || msgLower.includes("reunião") || msgLower.includes("agendar") || msgLower.includes("call")) {
      score_increment = 20;
      lead.intent_detected = "Pediu proposta ou reunião";
      lead.urgency_level = "medium";
      reply = "Perfeito! Vou preparar a proposta customizada. Prefere que eu chame um specialist agora para agendarmos?";
    }
    else if (msgLower.includes("pagamento") || msgLower.includes("link") || msgLower.includes("comprar") || msgLower.includes("aceito") || msgLower.includes("fechar")) {
      score_increment = 25;
      lead.intent_detected = "Intenção clara de fechamento / Pediu link de pagamento";
      lead.urgency_level = "high";
      request_human_intervention = true;
      reply = "Excelente escolha! Um de nossos vendedores já foi notificado e está entrando na conversa para gerar o seu link de pagamento seguro e finalizar sua ativação.";
    }

    // Atualiza histórico e score acumulativo
    lead.history.push({ sender: 'lead', text: message });
    lead.history.push({ sender: 'ai', text: reply });
    lead.score = Math.min(lead.score + score_increment, 100);

    // Classificação oficial
    if (lead.score >= 75 || request_human_intervention) {
      lead.classification = 'Quente (Prioritário)';
    } else if (lead.score >= 40) {
      lead.classification = 'Morno';
    } else {
      lead.classification = 'Frio';
    }

    console.log(`\n====================================================`);
    console.log(`📊 [SIMULADOR CRM IA] LEAD ATUALIZADO: ${contact}`);
    console.log(`🎯 Intenção Detectada: ${lead.intent_detected.toUpperCase()}`);
    console.log(`📈 Incremento: +${score_increment} | NOVO SCORE: ${lead.score}`);
    console.log(`🏷️ Classificação: ${lead.classification.toUpperCase()}`);
    console.log(`🤖 Resposta do Robô: "${reply}"`);
    console.log(`====================================================\n`);

  } catch (error) {
    console.error('Erro na simulação:', error.message);
  }
}

// Rota atualizada para o Frontend (inglês) e Power BI (português)
app.get('/api/v1/leads', (req, res) => {
  const listaLeads = Object.values(leadsDatabase).map(lead => {
    // Garante que o lead tenha uma data de criação
    if (!lead.createdAt) {
      lead.createdAt = new Date().toISOString();
    }
    
    // Calcula o valor estimado
    let valorPossivel = 0;
    if (lead.score >= 75) {
      valorPossivel = 197; 
    } else if (lead.score >= 40) {
      valorPossivel = 50;
    }

    return {
      // --- CAMPOS QUE O FRONTEND PRECISA ---
      contact: lead.contact,
      score: lead.score,
      classification: lead.classification,
      intent_detected: lead.intent_detected,
      lastMessage: lead.lastMessage,
      history: lead.history || [],
      createdAt: lead.createdAt,
      urgency_level: lead.urgency_level || "baixa",

      // --- CAMPOS QUE O POWER BI PRECISA ---
      contato: lead.contact,
      classificacao: lead.classification,
      intencao_detectada: lead.intent_detected,
      ultima_mensagem: lead.lastMessage,
      valor_estimado: valorPossivel,
      data_criacao: lead.createdAt,
      data_status: lead.statusChangedAt || lead.createdAt 
    };
  });

  return res.status(200).json(listaLeads);
});

// 📊 ROTA NOVA: Retorna métricas REAIS calculadas com base nos leads atuaiss
app.get('/api/v1/reports', (req, res) => {
  const leads = Object.values(leadsDatabase);
  const totalLeads = leads.length;
  
  const totalQuentes = leads.filter(l => l.score >= 75).length;
  const totalMornos = leads.filter(l => l.score >= 40 && l.score < 75).length;
  const totalFrios = leads.filter(l => l.score < 40).length;

  // Regra de negócio real: faturamento estimado baseado em leads quentes (ex: R$197 por plano comercial)
  const faturamentoEstimado = totalQuentes * 197;

  // Taxa de conversão real baseada em quantos leads viraram quentes do total
  const taxaConversao = totalLeads > 0 ? ((totalQuentes / totalLeads) * 100).toFixed(1) : 0;

  // Resposta estruturada para o frontend
  return res.status(200).json({
    totalLeads,
    totalQuentes,
    totalMornos,
    totalFrios,
    taxaConversao: `${taxaConversao}%`,
    faturamento: `R$ ${faturamentoEstimado.toLocaleString('pt-BR')}`,
    tempoResposta: "5s"
  });
});

// Rota do Webhook que vai receber as mensagens
app.post('/api/v1/webhooks/incoming', (req, res) => {
  const { contact, message } = req.body;

  if (!contact || !message) {
    return res.status(400).json({ error: 'Envie contact e message no corpo da requisição.' });
  }

  console.log(`[Webhook Recebido] Mensagem de ${contact}: "${message}"`);

  setTimeout(() => {
    processarMensagemComIA(contact, message);
  }, 50);

  return res.status(200).json({ success: true, message: 'Mensagem recebida com sucesso.' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 BACKEND JVV SISTEMAS RODANDO NA PORTA ${PORT}`);
  console.log(`====================================================`);
});