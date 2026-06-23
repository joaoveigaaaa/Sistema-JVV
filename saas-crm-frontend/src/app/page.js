'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { io } from 'socket.io-client';
import { 
  
  User, MessageSquare, CheckCircle2, Send, BarChart3, RefreshCw,
  Calendar, LayoutGrid, Settings, BotMessageSquare, Cpu
} from 'lucide-react';

const SOCKET_SERVER_URL = 'http://localhost:3000';

export default function CRMExpressDashboard() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [activeTab, setActiveTab] = useState('reports'); 

  const [periodoSelecionado, setPeriodoSelecionado] = useState('Este Mês'); 
  const [intervaloDatas, setIntervaloDatas] = useState({
    inicio: "2026-06-01",
    fim: "2026-06-20"
  });

  const [realStats, setRealStats] = useState({
    totalLeads: 0,
    totalQuentes: 0,
    totalMornos: 0,
    totalFrios: 0, 
    taxaConversao: "0%",
    faturamento: "R$ 0",
    tempoResposta: "0s"
  });

  const mapearSingleLead = (lead) => {
    const historico = lead.history || [];
    const ultimaMensagem = historico.length > 0 ? historico[historico.length - 1] : null;
    const iaRespondeu = ultimaMensagem?.sender === 'ai'; // Otimizado com Optional Chaining
    return { ...lead, iaAtiva: iaRespondeu };
  };

  const carregarDadosDoBackend = async () => {
    try {
      const resLeads = await fetch(`${SOCKET_SERVER_URL}/api/v1/leads`);
      const dadosLeads = await resLeads.json();
      
      const listaSegura = Array.isArray(dadosLeads) ? dadosLeads : [];
      const leadsMapeados = listaSegura.map(mapearSingleLead);

      setLeads(leadsMapeados);
      
      if (leadsMapeados.length > 0 && !selectedLead) {
        setSelectedLead(leadsMapeados[0]);
      } else if (selectedLead) {
        const atualizado = leadsMapeados.find(l => l.contact === selectedLead.contact);
        if (atualizado) setSelectedLead(atualizado);
      }

      const resStats = await fetch(`${SOCKET_SERVER_URL}/api/v1/reports`);
      const dadosStats = await resStats.json();
      setRealStats(dadosStats);
    } catch (error) {
      console.error("Erro ao conectar com o backend:", error);
    }
  };

  useEffect(() => {
    carregarDadosDoBackend();

    const socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      console.log('🔌 Conectado ao fluxo de dados em tempo real (Socket.io)');
    });

    socket.on('nova_mensagem_chat', () => {
      carregarDadosDoBackend();
    });

    return () => {
      socket.disconnect();
    };
  }, [intervaloDatas]); 

  useEffect(() => {
    if (selectedLead && leads.length > 0) {
      const atualizado = leads.find(l => l.contact === selectedLead.contact);
      if (atualizado) setSelectedLead(atualizado);
    }
  }, [leads]);

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !selectedLead) return;
    const novoHistorico = [...(selectedLead.history || []), { sender: 'agent', text: typedMessage, timestamp: new Date().toISOString() }];
    setSelectedLead({ ...selectedLead, history: novoHistorico });
    setTypedMessage('');
  };

  // --- KANBAN DRAG AND DROP ---
  const colunasKanban = [
    { id: 'Novos', titulo: 'Sem Atendimento (Lead Novo)', cor: 'bg-slate-400' },
    { id: 'IA Ativa', titulo: 'Em Atendimento (IA Respondeu)', cor: 'bg-blue-400' }, 
    { id: 'Humano Ativo', titulo: 'Em Triagem (Humano)', cor: 'bg-blue-600' },
    { id: 'Quente', titulo: 'Oportunidade Quente', cor: 'bg-[#FF7A1A]' },
    { id: 'Convertido', titulo: 'Fechamento / Ganho', cor: 'bg-emerald-500' }
  ];

  const handleDragStart = (e, leadContact) => {
    e.dataTransfer.setData('text/plain', leadContact);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const leadContact = e.dataTransfer.getData('text/plain');
    const leadsAtualizados = leads.map(l => {
      if (l.contact === leadContact) return { ...l, classification: targetStatus };
      return l;
    });
    setLeads(leadsAtualizados);
  };

  const renderBadgeCanal = (canal) => {
    const nomeCanal = canal ? canal.toLowerCase() : 'whatsapp';
    if (nomeCanal === 'instagram') {
      return <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">IG</span>;
    }
    return <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">WPP</span>;
  };

  // Funções para simplificar a estilização do histórico do Chat e evitar ternários complexos inline
  const obterEstiloBalaoChat = (sender) => {
    if (sender === 'lead') return 'bg-white text-slate-800 border border-slate-100 rounded-tl-none';
    if (sender === 'ai') return 'bg-blue-50 text-slate-800 rounded-tr-none border border-blue-100';
    return 'bg-[#0B1220] text-white rounded-tr-none';
  };

  const obterNomeRemetente = (sender) => {
    if (sender === 'lead') return 'Cliente';
    if (sender === 'ai') return '🤖 Motor IA JVV';
    return 'Você (JVV Comercial)';
  };

  return (
    <div className="flex h-screen bg-[#F4F5F7] text-[#0B1220] font-sans overflow-hidden">

      <div className="w-64 bg-[#070B14] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div className="flex flex-col pt-4">
          <div className="px-6 pb-5 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 relative bg-white p-1 rounded-lg flex items-center justify-center shadow-md">
              <Image src="/JVV.png" alt="JVV Logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">JVV <span className="text-[#FF7A1A]">Sistemas</span></span>
          </div>

          <div className="m-4 p-3 bg-white/5 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 relative bg-white p-0.5 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
              <Image src="/JVV.png" alt="JVV Logo Mini" width={20} height={20} className="object-contain" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">CRM Express JVV</p>
              <p className="text-[10px] text-slate-400 truncate">Operação Realtime</p>
            </div>
          </div>

          <div className="px-3 space-y-0.5 text-xs font-medium text-slate-400">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Geral</p>
            
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'reports' ? 'bg-white/10 text-[#FF7A1A] font-bold' : 'hover:bg-white/5 hover:text-white'}`}>
              <BarChart3 size={16} className={activeTab === 'reports' ? 'text-[#FF7A1A]' : 'text-slate-400'} />
              <span>Painel de controle</span>
            </button>

            <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'chat' ? 'bg-white/10 text-[#FF7A1A] font-bold' : 'hover:bg-white/5 hover:text-white'}`}>
              <MessageSquare size={16} className={activeTab === 'chat' ? 'text-[#FF7A1A]' : 'text-slate-400'} />
              <span>Conversas</span>
            </button>

            <button onClick={() => setActiveTab('kanban')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'kanban' ? 'bg-white/10 text-[#FF7A1A] font-bold' : 'hover:bg-white/5 hover:text-white'}`}>
              <LayoutGrid size={16} className={activeTab === 'kanban' ? 'text-[#FF7A1A]' : 'text-slate-400'} />
              <span>Funil de Vendas (Kanban)</span>
            </button>

          </div>
        </div>
        <div className="p-3 border-t border-slate-800 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-white cursor-pointer transition">
            <Settings size={16} />
            <span>Configurações</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">

        <div className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 shrink-0 shadow-sm z-10 relative">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-[#FF7A1A] rounded-lg">
              <LayoutGrid size={16} />
            </div>
            <h1 className="text-base font-bold text-[#0F172A]">Painel Operacional</h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center font-semibold text-slate-600">
              <button 
                onClick={() => { setPeriodoSelecionado('Hoje'); setIntervaloDatas({inicio: '2026-06-20', fim: '2026-06-20'}) }}
                className={`px-3 py-1.5 rounded-lg ${periodoSelecionado === 'Hoje' ? 'bg-[#0B1220] text-white' : 'hover:bg-slate-200'}`}
              >
                Hoje
              </button>
              <button 
                onClick={() => { setPeriodoSelecionado('Este Mês'); setIntervaloDatas({inicio: '2026-06-01', fim: '2026-06-20'}) }}
                className={`px-3 py-1.5 rounded-lg ${periodoSelecionado === 'Este Mês' ? 'bg-[#0B1220] text-white' : 'hover:bg-slate-200'}`}
              >
                Este Mês
              </button>
              <button 
                onClick={() => { setPeriodoSelecionado('Este Ano'); setIntervaloDatas({inicio: '2026-01-01', fim: '2026-06-20'}) }}
                className={`px-3 py-1.5 rounded-lg ${periodoSelecionado === 'Este Ano' ? 'bg-[#0B1220] text-white' : 'hover:bg-slate-200'}`}
              >
                Este Ano
              </button>
            </div>

            <div className="bg-white border border-[#E2E8F0] px-4 py-2 rounded-xl text-slate-600 font-medium flex items-center gap-3 shadow-sm cursor-pointer hover:border-slate-300">
              <Calendar size={15} className="text-slate-400" />
              <span>Intervalo:</span>
              <input 
                type="date" 
                value={intervaloDatas.inicio} 
                onChange={(e) => setIntervaloDatas({...intervaloDatas, inicio: e.target.value})}
                className="font-bold text-[#0F172A] text-[11px] outline-none"
              />
              <span>➔</span>
              <input 
                type="date" 
                value={intervaloDatas.fim} 
                onChange={(e) => setIntervaloDatas({...intervaloDatas, fim: e.target.value})}
                className="font-bold text-[#0F172A] text-[11px] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {activeTab === 'reports' && (
            <div className="space-y-6">
              
              <div className="text-xs text-[#FF7A1A] font-bold flex items-center gap-1 cursor-pointer hover:underline">
                <span>• Exibindo relatório comercial para: {periodoSelecionado} ({intervaloDatas.inicio} ➔ {intervaloDatas.fim})</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Card 1: Status */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative">
                  <span className="text-xs font-semibold text-slate-500 block tracking-wide">Status da oportunidade ({periodoSelecionado})</span>
                  <div className="text-4xl font-bold text-[#0F172A] mt-2">{realStats.totalLeads}</div>
                  <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-2"></div>

                  <div className="mt-8 flex items-center justify-center relative h-32">
                    <div className="w-24 h-24 rounded-full border-8 border-slate-100 border-t-[#FF7A1A] flex items-center justify-center font-bold text-slate-700 text-sm">
                      {realStats.totalLeads}
                    </div>
                    <div className="absolute right-2 bottom-2 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF7A1A] rounded-sm"></span> Mornos - {realStats.totalMornos}</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#0B1220] rounded-sm"></span> Quentes - {realStats.totalQuentes}</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Pipeline */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative">
                  <span className="text-xs font-semibold text-slate-500 block tracking-wide">Volume Estimado ({periodoSelecionado})</span>
                  <div className="text-4xl font-bold text-[#0F172A] mt-2">{realStats.faturamento}</div>
                  <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-2"></div>

                  <div className="mt-10 flex flex-col items-center justify-center h-32 text-center text-xs space-y-2">
                    <BarChart3 className="text-[#0B1220]" size={40} />
                    <p className="text-slate-500 font-medium">Pipeline gerado multiplicando leads qualificados pelo ticket JVV.</p>
                  </div>
                </div>

                {/* Card 3: Taxa de conversão */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm relative">
                  <span className="text-xs font-semibold text-slate-500 block tracking-wide">Taxa de conversão ({periodoSelecionado})</span>
                  <div className="text-4xl font-bold text-[#0F172A] mt-2">{realStats.taxaConversao}</div>
                  <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-2"></div>

                  <div className="mt-8 flex items-center justify-center h-32">
                    <div className="w-24 h-24 rounded-full border-8 border-slate-100 border-t-[#FF7A1A] border-r-[#FF7A1A] flex items-center justify-center font-bold text-slate-700 text-sm">
                      {realStats.taxaConversao}
                    </div>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pipeline de Vendas (Volume) ({periodoSelecionado})</span>
                  </div>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1"><strong>Leads em Triagem Operacional</strong><span>{realStats.totalMornos} un</span></div>
                      <div className="w-full bg-slate-100 h-7 rounded overflow-hidden relative border border-slate-200"><div className="bg-[#FF7A1A]/90 h-full transition-all" style={{width: `${(realStats.totalMornos / (realStats.totalLeads || 1)) * 100}%`}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1"><strong>Leads em Triagem Operacional</strong><span>{realStats.totalQuentes} un</span></div>
                      <div className="w-full bg-slate-100 h-7 rounded overflow-hidden relative border border-slate-200"><div className="bg-[#0B1220]/90 h-full transition-all" style={{width: `${(realStats.totalQuentes / (realStats.totalLeads || 1)) * 100}%`}}></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1"><strong>Prospecção / Contatos Iniciais</strong><span>{realStats.totalFrios} un</span></div>
                      <div className="w-full bg-slate-100 h-7 rounded overflow-hidden relative border border-slate-200"><div className="bg-slate-300 h-full transition-all" style={{width: `${(realStats.totalFrios / (realStats.totalLeads || 1)) * 100}%`}}></div></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Distribuição de Status Operacional</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Realtime</span>
                    </div>
                    
                    <div className="mb-5">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Volume de Leads Filtrados</span>
                      <div className="text-3xl font-black text-[#0F172A] flex items-baseline gap-1.5 mt-0.5">
                        {realStats.totalLeads} 
                        <span className="text-xs font-medium text-slate-400">contatos no período</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 rounded-xl transition hover:bg-blue-50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm">
                          <BotMessageSquare size={16} className="animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Interação Automatizada</p>
                          <p className="text-[11px] text-slate-500">Leads sendo nutridos ou já respondidos pela IA</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
                        {realStats.totalLeads - realStats.totalFrios}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-100 rounded-xl transition hover:bg-amber-50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white text-slate-700 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center font-bold text-[10px]">CRM</div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Atendimento Humano</p>
                          <p className="text-[11px] text-slate-500">Em triagem / Conversas ativas com o comercial</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-md">
                        {realStats.totalMornos}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl transition hover:bg-emerald-50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Ganhos / Convertidos</p>
                          <p className="text-[11px] text-slate-500">Sucesso comercial e fechamentos concluídos</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-md">
                        {realStats.totalQuentes}
                      </span>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl h-[calc(100vh-180px)] flex overflow-hidden shadow-sm">
              <div className="w-80 border-r border-[#E2E8F0] flex flex-col bg-slate-50">
                <div className="p-4 border-b border-[#E2E8F0] bg-white font-bold text-xs text-slate-700 flex justify-between items-center">Contatos <RefreshCw size={12} className="text-slate-400 animate-spin"/></div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {leads.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">Nenhum lead encontrado para este período.</div>
                  ) : (
                    leads.map((lead) => (
                      <div 
                        key={lead.contact}
                        onClick={() => setSelectedLead(lead)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedLead(lead)}
                        role="button"
                        tabIndex={0}
                        className={`p-3 rounded-lg cursor-pointer transition text-xs border ${selectedLead?.contact === lead.contact ? 'bg-orange-50 border-[#FF7A1A] font-medium shadow-inner' : 'bg-white border-transparent hover:bg-slate-100'}`}
                      >
                        <div className="flex justify-between font-bold text-slate-800 items-baseline">
                          <div className="flex items-center gap-2 truncate">
                            {renderBadgeCanal(lead.canal)}
                            <span className="truncate">{lead.contact}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${lead.iaAtiva ? 'bg-blue-50 text-blue-700' : 'text-[#FF7A1A]'}`}>
                            Sc: {lead.score}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate mt-1 leading-snug">{lead.lastMessage}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between bg-white relative">
                {selectedLead ? (
                  <>
                    <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-slate-50/50 shadow-sm z-10 shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          {renderBadgeCanal(selectedLead.canal)}
                          <h4 className="font-bold text-xs text-[#0F172A]">{selectedLead.contact}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">Status: {selectedLead.classification} {selectedLead.iaAtiva && <BotMessageSquare size={12} className="text-blue-500 animate-pulse"/>}</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/20 z-0">
                      {(selectedLead.history || []).map((msg) => (
                        <div key={msg.id || msg.timestamp || Math.random().toString()} className={`flex ${msg.sender === 'lead' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`p-2.5 rounded-xl max-w-md ${obterEstiloBalaoChat(msg.sender)}`}>
                            <div className="text-[9px] font-bold mb-1 uppercase tracking-wider text-slate-400 select-none">
                              {obterNomeRemetente(msg.sender)}
                            </div>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-[#E2E8F0] flex gap-2 items-center bg-white z-10 shrink-0 shadow-inner">
                      <input 
                        type="text" 
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={`Intervenção Humana no ${selectedLead.canal === 'instagram' ? 'Instagram' : 'WhatsApp'}: Escreva uma resposta...`} 
                        className="flex-1 bg-slate-50 border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0B1220] focus:outline-none focus:border-[#FF7A1A] transition"
                      />
                      <button onClick={handleSendMessage} className="p-2.5 bg-[#FF7A1A] text-white rounded-xl shadow-md hover:bg-[#E66910] transition shrink-0"><Send size={15} /></button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                    <Cpu size={24} className="text-[#FF7A1A] animate-spin"/>
                    <span>Aguardando seleção de lead real.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 h-[calc(100vh-180px)] overflow-hidden">
              {colunasKanban.map((coluna) => {
                const leadsDaColuna = leads.filter(l => {
                  const classe = String(l.classification).toLowerCase();
                  if (coluna.id === 'Novos') return (classe.includes('novo') || classe.includes('lead') || classe.includes('frio')) && !l.iaAtiva;
                  if (coluna.id === 'IA Ativa') return l.iaAtiva && !classe.includes('quente') && !classe.includes('convertido'); 
                  if (coluna.id === 'Humano Ativo') return (classe.includes('atendimento') || classe.includes('morno')) && !l.iaAtiva;
                  if (coluna.id === 'Quente') return classe.includes('quente') || classe.includes('hot') || classe.includes('prioritário');
                  if (coluna.id === 'Convertido') return classe.includes('convertido') || classe.includes('ganho') || classe.includes('fechado');
                  return false;
                });

                return (
                  <div 
                    key={coluna.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, coluna.id)}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex flex-col h-full shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${coluna.cor}`}></span>
                        <h3 className="font-bold text-xs text-[#0F172A] truncate tracking-tight">{coluna.titulo}</h3>
                      </div>
                      <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full">{leadsDaColuna.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {leadsDaColuna.map((lead) => (
                        <div
                          key={lead.contact}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.contact)}
                          className="bg-slate-50 p-2.5 rounded-lg border border-[#E2E8F0] cursor-grab active:cursor-grabbing hover:border-[#FF7A1A] transition-all text-xs relative"
                        >
                          {lead.iaAtiva && <BotMessageSquare size={13} className="text-blue-500 absolute top-2 right-2 animate-pulse"/>}
                          <div className="flex items-center gap-1.5 mb-1">
                            {renderBadgeCanal(lead.canal)}
                            <p className="font-bold text-slate-800 truncate pr-4">{lead.contact}</p>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{lead.lastMessage}</p>
                          <div className="mt-2 text-[9px] text-[#FF7A1A] font-semibold">Score: {lead.score}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
