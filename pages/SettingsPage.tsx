
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { api } from '../services/api';
import { StakeConfig, StakeMode } from '../types';
import { AlertCircle, Lock, Trash2, X } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [stakeConfig, setStakeConfig] = useState<StakeConfig | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    api.getStakeConfig().then(setStakeConfig);
  }, []);

  const handleUpdateConfig = async (updates: Partial<StakeConfig>) => {
    if (!stakeConfig) return;
    const newConfig = { ...stakeConfig, ...updates };
    const saved = await api.updateStakeConfig(newConfig);
    setStakeConfig(saved);
  };

  const handleResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setIsResetting(true);

    try {
      const result = await api.resetData(resetPassword);
      if (result.error) {
        setResetError(result.error);
      } else {
        alert('Todos os dados foram resetados com sucesso!');
        setIsResetModalOpen(false);
        setResetPassword('');
        window.location.reload(); // Reload to refresh all stats
      }
    } catch (err: any) {
      setResetError('Erro ao processar solicitação');
    } finally {
      setIsResetting(false);
    }
  };

  if (!stakeConfig) return null;

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400">Personalize sua banca, modelos de gestão e visualização.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full border-emerald-500/20">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🛡️</span>
            <h3 className="text-lg font-bold text-white">Modelo de Gestão de Stake</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {(['manual', 'percent', 'kelly', 'market'] as StakeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleUpdateConfig({ mode })}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    stakeConfig.mode === mode
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1">
                    {mode === 'manual' ? 'Manual' : mode === 'percent' ? '% Banca' : mode === 'kelly' ? 'Kelly' : 'Por Mercado'}
                  </span>
                  <span className="text-[8px] opacity-60 text-center">
                    {mode === 'manual' && 'Valor livre em cada aposta'}
                    {mode === 'percent' && 'Fração fixa do capital total'}
                    {mode === 'kelly' && 'Cálculo matemático de valor'}
                    {mode === 'market' && 'Gestão por tipo de entrada'}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              {stakeConfig.mode === 'percent' && (
                <div className="animate-in slide-in-from-left duration-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">Percentual da Banca (%)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0.1" max="10" step="0.1"
                      value={stakeConfig.percent}
                      onChange={(e) => handleUpdateConfig({ percent: Number(e.target.value) })}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg font-mono text-emerald-400 font-bold min-w-[80px] text-center">
                      {stakeConfig.percent}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 px-1">Sua stake será recalculada automaticamente a cada variação do capital total.</p>
                </div>
              )}

              {stakeConfig.mode === 'kelly' && (
                <div className="animate-in slide-in-from-left duration-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 px-1">Fração de Kelly (Segurança)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Full', val: 1 },
                      { label: '1/2', val: 0.5 },
                      { label: '1/4', val: 0.25 },
                      { label: '1/8', val: 0.125 },
                    ].map((f) => (
                      <button
                        key={f.val}
                        onClick={() => handleUpdateConfig({ kellyFraction: f.val })}
                        className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                          stakeConfig.kellyFraction === f.val 
                          ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' 
                          : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {f.label} ({f.val * 100}%)
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 px-1">O Critério de Kelly otimiza o crescimento da banca baseado no seu EV (Vantagem Estimada). Frações menores (1/4 ou 1/8) são recomendadas para reduzir volatilidade.</p>
                </div>
              )}

              {stakeConfig.mode === 'market' && (
                <div className="animate-in slide-in-from-left duration-200 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-2">
                    <span>💡</span> Gestão Institucional Ativa
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Neste modo, o sistema busca a % de stake definida em cada mercado específico na aba <strong>Centro de Mercados</strong>. Se um mercado não tiver valor definido, o padrão é 1%.
                  </p>
                </div>
              )}

              {stakeConfig.mode === 'manual' && (
                <div className="animate-in slide-in-from-left duration-200">
                  <p className="text-[10px] text-slate-500 px-1 italic">
                    Modo manual ativado. Você deverá digitar o valor da stake individualmente em cada operação. Recomendado apenas para traders experientes com gestão emocional robusta.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-bold text-white mb-6">Regionalização</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Moeda</p>
                  <p className="text-xs text-slate-500">Símbolo monetário exibido</p>
                </div>
                <select className="bg-slate-950 border border-slate-800 rounded px-4 py-2 text-white outline-none focus:border-emerald-500 text-sm shadow-inner">
                  <option>BRL (R$)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-white mb-6">Backup e Sistema</h3>
            <div className="space-y-3">
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-widest border border-slate-700">
                Exportar Histórico (XLS/JSON)
              </button>
              <button 
                onClick={() => setIsResetModalOpen(true)}
                className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500 font-bold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-widest border border-red-500/20"
              >
                Resetar Todos os Dados
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-red-500/20 w-full max-w-md rounded-2xl p-8 shadow-2xl scale-in-center">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-500" />
                Resetar Tudo?
              </h2>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Atenção: Esta ação é irreversível!</p>
                <p className="opacity-80">Isso apagará permanentemente todo o seu histórico de apostas e resetará sua banca para o valor inicial.</p>
              </div>
            </div>

            <form onSubmit={handleResetData} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 ml-1">Confirme sua Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-red-500 transition-colors"
                    placeholder="Sua senha atual"
                  />
                </div>
                {resetError && <p className="text-red-500 text-xs mt-2 ml-1">{resetError}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isResetting}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
                >
                  {isResetting ? 'Resetando...' : 'Confirmar Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
