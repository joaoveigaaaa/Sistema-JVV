'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  User, MessageSquare, Flame, Snowflake, AlertCircle, 
  CheckCircle2, Send, ShieldAlert, BarChart3, RefreshCw,
  TrendingUp, Calendar
} from 'lucide-react';

export default function CRMExpressDashboard() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  
  // Estado para armazenar os dados REAIS vindos do backend
  const [realStats, setRealStats] = useState({
    totalLeads: 0,
    totalQuentes: 0,
    totalMornos: 0,
    totalFrios: 0,
    taxaConversao: "0%",
    faturamento: "R$ 0",
    tempoResposta: "5s"
  });

  const carregarDadosDoBackend = async () => {
    try {
     
      const resLeads = await fetch('http://localhost:3000/api/v1/leads');
      const dadosLeads = await resLeads.json();
      setLeads(dadosLeads);
      
      if (dadosLeads.length > 0 && !selectedLead) {
        setSelectedLead(dadosLeads[0]);
      } else if (selectedLead) {
        const atualizado = dadosLeads.find(l => l.contact === selectedLead.contact);
        if (atualizado) setSelectedLead(atualizado);
      }

      const resStats = await fetch('http://localhost:3000/api/v1/reports');
      const dadosStats = await resStats.json();
      setRealStats(dadosStats);

    } catch (error) {
      console.error("Erro ao conectar com o backend:", error);
    }
  };

  useEffect(() => {
    carregarDadosDoBackend();
    const interval = setInterval(carregarDadosDoBackend, 3000);
    return () => clearInterval(interval);
  }, [selectedLead]);

  const handleSendMessage = () => {
    if (!typedMessage.trim() || !selectedLead) return;
    
    const novoHistorico = [...(selectedLead.history || []), { sender: 'agent', text: typedMessage }];
    setSelectedLead({ ...selectedLead, history: novoHistorico });
    setTypedMessage('');
  };

  return (
    <div className="flex h-screen bg-white text-[#0B1220] font-sans overflow-hidden">
      
      {}
      <div className="w-20 bg-[#070B14] border-r border-slate-200 flex flex-col items-center py-6 justify-between">
        <div className="flex flex-col items-center gap-8 w-full">
          <div className="w-12 h-12 relative bg-white p-1 rounded-xl shadow-lg flex items-center justify-center">
            <Image 
              src="/JVV.png" 
              alt="JVV Sistemas Logo" 
              width={40} 
              height={40} 
              className="object-contain"
            />
          </div>
          
          <button 
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition ${activeTab === 'chat' ? 'bg-white/10 text-[#FF7A1A]' : 'text-slate-400 hover:text-white'}`}
          >
            <MessageSquare size={20} />
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`p-3 rounded-xl transition ${activeTab === 'reports' ? 'bg-white/10 text-[#FF7A1A]' : 'text-slate-400 hover:text-white'}`}
          >
            <BarChart3 size={20} />
          </button>
        </div>
        
        {}
        <div className="w-10 h-10 relative bg-white p-1 rounded-full shadow-md flex items-center justify-center overflow-hidden">
          <Image 
            src="/JVV.png" 
            alt="JVV Sistemas" 
            width={32} 
            height={32} 
            className="object-contain"
          />
        </div>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* COLUNA 1: LISTA DE LEADS */}
          <div className="w-96 bg-slate-50 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
              <div>
                <h1 className="text-base font-bold text-[#0B1220]">Painel Triagem JVV</h1>
                <p className="text-xs text-[#FF7A1A] font-semibold mt-0.5">Motor de IA ativo</p>
              </div>
              <RefreshCw size={14} className="text-[#FF7A1A] animate-spin" />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {leads.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Aguardando leads reais do backend...<br/>Dispare uma mensagem no Postman!
                </div>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedLead && lead.contact === selectedLead.contact;
                  const isQuente = lead.score >= 75;
                  const isMorno = lead.score >= 40 && lead.score < 75;

                  return (
                    <div
                      key={lead.contact}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 rounded-xl cursor-pointer transition border ${isSelected ? 'bg-[#FF7A1A]/10 border-[#FF7A1A]' : 'bg-white border-slate-200 hover:border-[#0B1220]/30'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm block truncate max-w-[180px] text-[#0B1220]">{lead.contact}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${isQuente ? 'bg-rose-100 text-rose-700' : isMorno ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {isQuente ? <Flame size={12} /> : <Snowflake size={12} />} Score: {lead.score}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-1">{lead.lastMessage}</p>
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <span className="bg-[#0B1220] px-2 py-0.5 rounded text-white font-medium">{lead.classification}</span>
                        {isQuente && <span className="text-rose-600 font-bold flex items-center gap-0.5 animate-pulse"><AlertCircle size={10} /> Prioritário</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUNA 2: CENTRAL DE CHAT */}
          <div className="flex-1 bg-white flex flex-col justify-between">
            {selectedLead ? (
              <>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#0B1220] rounded-xl flex items-center justify-center text-white"><User size={20} /></div>
                    <div>
                      <h2 className="font-bold text-sm text-[#0B1220]">{selectedLead.contact}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Ativo</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">Intenção: <strong className="text-[#FF7A1A]">{selectedLead.intent_detected}</strong></span>
                      </div>
                    </div>
                  </div>
                  {selectedLead.score >= 75 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 px-4 flex items-center gap-2">
                      <ShieldAlert className="text-rose-600" size={18} />
                      <span className="text-xs text-rose-700 font-bold">Intervenção Comercial Necessária!</span>
                    </div>
                  )}
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                  {(selectedLead.history || []).map((msg, index) => {
                    const isLead = msg.sender === 'lead';
                    const isAI = msg.sender === 'ai';
                    return (
                      <div key={index} className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xl rounded-2xl p-3 text-sm shadow-sm border ${isLead ? 'bg-white text-[#0B1220] border-slate-200 rounded-tl-none' : isAI ? 'bg-[#FF7A1A]/5 text-[#FF7A1A] border-[#FF7A1A]/30 rounded-tr-none' : 'bg-[#FF7A1A] text-white rounded-tr-none'}`}>
                          <div className="text-[10px] font-bold mb-1 uppercase tracking-wider text-slate-400">
                            {isLead ? 'Cliente' : isAI ? '🤖 Assistente IA JVV' : 'Você (JVV)'}
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-white border-t border-slate-200 flex gap-2 items-center">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Responda o cliente por aqui..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#0B1220] focus:outline-none focus:border-[#FF7A1A] transition"
                  />
                  <button onClick={handleSendMessage} className="p-3 bg-[#FF7A1A] text-white rounded-xl shadow-md hover:bg-[#E66910]"><Send size={18} /></button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                <RefreshCw size={24} className="animate-spin text-[#FF7A1A] mb-2" />
                Aguardando mensagens do Postman para iniciar...
              </div>
            )}
          </div>
        </>
      ) : (
        
        <div className="flex-1 bg-white p-8 overflow-y-auto">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <h2 className="text-xl font-extrabold text-[#0B1220] flex items-center gap-2">
              <BarChart3 className="text-[#FF7A1A]" /> Relatório Operacional em Tempo Real
            </h2>
            <p className="text-sm text-slate-500 mt-1">Exibindo dados dinâmicos coletados diretamente do banco de dados em memória.</p>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Leads na Base</span>
              <div className="text-2xl font-bold text-[#0B1220] mt-2">{realStats.totalLeads}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Oportunidades Quentes</span>
              <div className="text-2xl font-bold text-rose-600 mt-2">{realStats.totalQuentes}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Taxa de Conversão</span>
              <div className="text-2xl font-bold text-[#FF7A1A] mt-2">{realStats.taxaConversao}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Tempo de Resposta</span>
              <div className="text-2xl font-bold text-purple-600 mt-2">&lt; {realStats.tempoResposta}</div>
            </div>
          </div>

          {}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B1220] text-white text-xs uppercase font-bold">
                  <th className="p-4 pl-6">Indicador Real do Sistema</th>
                  <th className="p-4">Métrica Atual</th>
                  <th className="p-4 pr-6 text-right">Mapeamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                <tr>
                  <td className="p-4 pl-6 font-semibold text-[#0B1220]">Leads Triados com Sucesso</td>
                  <td className="p-4 text-base text-[#0B1220]">{realStats.totalLeads} contatos</td>
                  <td className="p-4 pr-6 text-right"><span className="bg-blue-100 text-[#0B1220] text-xs px-2.5 py-1 rounded-full font-bold">Total Geral</span></td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold text-[#0B1220]">Leads Quentes (Intervenção Comercial)</td>
                  <td className="p-4 text-base text-rose-600 font-bold">{realStats.totalQuentes} contatos</td>
                  <td className="p-4 pr-6 text-right"><span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">Crítico</span></td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold text-[#0B1220]">Contatos em Nutrição (Mornos)</td>
                  <td className="p-4 text-base text-amber-600 font-bold">{realStats.totalMornos} contatos</td>
                  <td className="p-4 pr-6 text-right"><span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">Intermediário</span></td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-semibold text-[#0B1220]">Contatos Iniciais (Frios)</td>
                  <td className="p-4 text-base text-slate-500">{realStats.totalFrios} contatos</td>
                  <td className="p-4 pr-6 text-right"><span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">Inicial</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PROJEÇÃO DE VENDAS */}
          <div className="p-6 bg-[#0B1220] text-white rounded-2xl flex flex-col md:flex-row justify-between items-center">
            <div>
              <h4 className="font-bold text-base text-[#FF7A1A] flex items-center gap-2">
                <Calendar size={18} /> Projeção Comercial Real do Pipeline
              </h4>
              <p className="text-sm text-slate-300 mt-1">Volume calculado multiplicando os leads com Score Comercial ativo pelo ticket do plano de entrada.</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 text-center min-w-[220px] mt-4 md:mt-0">
              <div className="text-xs font-bold text-slate-300 uppercase">Faturamento Estimado</div>
              <div className="text-2xl font-extrabold text-[#FF7A1A] mt-1">{realStats.faturamento}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}