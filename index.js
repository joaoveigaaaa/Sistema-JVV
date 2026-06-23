const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io'); 

dotenv.config();

const app = express(); 
const server = http.createServer(app);

const io = new Server(server, { 
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Front conectado: ${socket.id}`); 
  socket.on('disconnect', () => console.log(`Front desconectado: ${socket.id}`));
});

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'meu_token_secreto';

const leadsDatabase = {};

app.get('/api/v1/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verificado com sucesso!');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/api/v1/webhooks/whatsapp', (req, res) => {
  const body = req.body;
  if (body.object === 'whatsapp_business_account') {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages && messages.length > 0) {
      const msg = messages[0];
      const contact = msg.from;
      const text = msg.text?.body || '(mídia não suportada)';
      console.log(`[WhatsApp] Mensagem de ${contact}: "${text}"`);
      setTimeout(() => processarMensagemComIA(contact, text, 'whatsapp'), 50);
    }
  }
  return res.sendStatus(200);
});

app.get('/api/v1/webhooks/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Instagram Webhook] Verificado com sucesso!');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/api/v1/webhooks/instagram', (req, res) => {
  const body = req.body;
  if (body.object === 'instagram') {
    const messaging = body.entry?.[0]?.messaging?.[0];
    if (messaging) {
      const senderId = messaging.sender?.id;
      const text = messaging.message?.text || '(mídia não suportada)';
      console.log(`[Instagram] Mensagem de ${senderId}: "${text}"`);
      setTimeout(() => processarMensagemComIA(senderId, text, 'instagram'), 50);
    }
  }
  return res.sendStatus(200);
});

app.post('/api/v1/webhooks/incoming', (req, res) => {
  const { contact, message, channel = 'manual' } = req.body;
  if (!contact || !message) {
    return res.status(400).json({ error: 'Envie contact e message no corpo da requisição.' });
  }
  setTimeout(() => processarMensagemComIA(contact, message, channel), 50);
  return res.status(200).json({ success: true });
});

async function processarMensagemComIA(contact, message, channel = 'manual') {
  try {
    if (!leadsDatabase[contact]) {
      leadsDatabase[contact] = {
        contact, score: 0, classification: 'Frio', history: [],
        intent_detected: 'Conversa genérica', urgency_level: 'low',
        lastMessage: message, channel, createdAt: new Date().toISOString(),
      };
    }

    const lead = leadsDatabase[contact];
    const msgLower = message.toLowerCase();
    lead.lastMessage = message;

    let score_increment = 5;
    let reply = "Entendi! Como posso te ajudar a organizar melhor as vendas da sua empresa?";
    let request_human_intervention = false;

    if (msgLower.includes("bom dia")) {
      score_increment = 2; lead.intent_detected = "Saudação (Bom dia)";
      reply = "Bom dia! Como posso ajudar?";
    } else if (msgLower.includes("boa tarde")) {
      score_increment = 2; lead.intent_detected = "Saudação (Boa tarde)";
      reply = "Boa tarde! Como posso ajudar?";
    } else if (msgLower.includes("boa noite")) {
      score_increment = 2; lead.intent_detected = "Saudação (Boa noite)";
      reply = "Boa noite! Como posso ajudar?";
    } else if (msgLower.includes("preço") || msgLower.includes("quanto custa") || msgLower.includes("valor") || msgLower.includes("mensalidade")) {
      score_increment = 10; lead.intent_detected = "Perguntou preço";
      reply = "O nosso plano básico começa em R$ 197/mês com IA inclusa. Qual o tamanho do seu time de vendas hoje?";
    } else if (msgLower.includes("prazo") || msgLower.includes("quando") || msgLower.includes("demora")) {
      score_increment = 15; lead.intent_detected = "Perguntou prazo de entrega/uso";
      reply = "A liberação do sistema é imediata! Assim que configurarmos o seu WhatsApp, a IA começa a atender.";
    } else if (msgLower.includes("proposta") || msgLower.includes("reunião") || msgLower.includes("agendar") || msgLower.includes("call")) {
      score_increment = 20; lead.intent_detected = "Pediu proposta ou reunião"; lead.urgency_level = "medium";
      reply = "Perfeito! Vou preparar a proposta customizada. Prefere que eu chame um specialist agora para agendarmos?";
    } else if (msgLower.includes("pagamento") || msgLower.includes("link") || msgLower.includes("comprar") || msgLower.includes("aceito") || msgLower.includes("fechar")) {
      score_increment = 25; lead.intent_detected = "Intenção de fechamento"; lead.urgency_level = "high";
      request_human_intervention = true;
      reply = "Excelente! Um de nossos vendedores foi notificado e está entrando para gerar o seu link de pagamento.";
    }

    lead.history.push({ sender: 'lead', text: message, timestamp: new Date().toISOString() });
    lead.history.push({ sender: 'ai', text: reply, timestamp: new Date().toISOString() });
    lead.score = Math.min(lead.score + score_increment, 100);

    if (lead.score >= 75 || request_human_intervention) {
      lead.classification = 'Quente (Prioritário)';
    } else if (lead.score >= 40) {
      lead.classification = 'Morno';
    } else {
      lead.classification = 'Frio';
    }

    io.emit('nova_mensagem_chat', { contact, channel, classification: lead.classification, score: lead.score });
    console.log(`[CRM] ${channel.toUpperCase()} | ${contact} | Score: ${lead.score} | ${lead.classification}`);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

app.get('/api/v1/leads', (req, res) => {
  const listaLeads = Object.values(leadsDatabase).map(lead => ({
    contact: lead.contact,
    score: lead.score,
    classification: lead.classification,
    intent_detected: lead.intent_detected,
    lastMessage: lead.lastMessage,
    history: lead.history || [],
    createdAt: lead.createdAt,
    urgency_level: lead.urgency_level || 'baixa',
    canal: lead.channel || 'whatsapp', 
    channel: lead.channel || 'whatsapp',
    contato: lead.contact,
    classificacao: lead.classification,
    intencao_detectada: lead.intent_detected,
    ultima_mensagem: lead.lastMessage,
    valor_estimado: lead.score >= 75 ? 197 : lead.score >= 40 ? 50 : 0,
    data_criacao: lead.createdAt,
  }));
  return res.status(200).json(listaLeads);
});

app.get('/api/v1/reports', (req, res) => {
  const leads = Object.values(leadsDatabase);
  const totalLeads = leads.length;
  const totalQuentes = leads.filter(l => l.score >= 75).length;
  const totalMornos = leads.filter(l => l.score >= 40 && l.score < 75).length;
  const totalFrios = leads.filter(l => l.score < 40).length;
  const faturamentoEstimado = totalQuentes * 197;
  const taxaConversao = totalLeads > 0 ? ((totalQuentes / totalLeads) * 100).toFixed(1) : 0;
  return res.status(200).json({
    totalLeads, totalQuentes, totalMornos, totalFrios,
    taxaConversao: `${taxaConversao}%`,
    faturamento: `R$ ${faturamentoEstimado.toLocaleString('pt-BR')}`,
    tempoResposta: '5s'
  });
});

server.listen(PORT, () => {
  console.log(`BACKEND JVV RODANDO NA PORTA ${PORT}`);
  console.log(`Socket.io ativo`);
  console.log(`Webhook WhatsApp: POST /api/v1/webhooks/whatsapp`);
  console.log(`Webhook Instagram: POST /api/v1/webhooks/instagram`);
});