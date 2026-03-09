
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { api } from '../services/api';
import { UserPlus, Trash2, Shield, Mail, Lock, AlertCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await api.createAdminUser({ email, password, role });
      if (result.error) {
        setError(result.error);
      } else {
        setIsModalOpen(false);
        setEmail('');
        setPassword('');
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Todos os dados dele serão apagados.')) {
      await api.deleteAdminUser(id);
      loadUsers();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">👥 Gerenciar Usuários</h1>
          <p className="text-slate-400">Administração central de contas e permissões.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-all font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/20"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Criado em</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                        {u.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== 'admin-user-id' && (
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-8 shadow-2xl scale-in-center">
            <h2 className="text-2xl font-bold text-white mb-2">➕ Criar Novo Usuário</h2>
            <p className="text-slate-400 text-sm mb-8">O usuário poderá acessar o painel com as credenciais abaixo.</p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 ml-1">Usuário ou Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ex: joao_apostador"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 ml-1">Senha Inicial</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-emerald-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 ml-1">Nível de Acesso</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    <option value="user">Usuário Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
