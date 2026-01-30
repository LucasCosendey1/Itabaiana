// app/gerenciar-hospitais/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { verificarAutenticacao } from '../utils/helpers';

export default function GerenciarHospitaisPage() {
  const router = useRouter();
  const [unidades, setUnidades] = useState([]);
  const [unidadesFiltradas, setUnidadesFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    verificarAutenticacao(router);
    carregarLista();
  }, [router]);

  useEffect(() => {
    let resultado = [...unidades];

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(u => 
        u.nome.toLowerCase().includes(termo) ||
        u.endereco.toLowerCase().includes(termo)
      );
    }

    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(u => u.tipo === filtroTipo);
    }

    setUnidadesFiltradas(resultado);
  }, [busca, filtroTipo, unidades]);

  const carregarLista = async () => {
    try {
      const response = await fetch('/api/listar-hospitais-completo');
      const data = await response.json();
      if (response.ok) {
        setUnidades(data.unidades || []);
        setUnidadesFiltradas(data.unidades || []);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
    } finally {
      setCarregando(false);
    }
  };

  const getTipoBadge = (tipo) => {
    if (tipo === 'hospital') return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Hospital</span>;
    return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">UBS</span>;
  };

  if (carregando) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Gerenciar Unidades" mostrarVoltar voltarPara="/cadastrar-hospital" />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Unidade</label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome ou Endereço"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="todos">Todos</option>
                <option value="ubs">UBS</option>
                <option value="hospital">Hospital</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">{unidadesFiltradas.length} unidade(s) encontrada(s)</p>
          <button 
            onClick={() => router.push('/adicionar-hospital')} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            + Nova Unidade
          </button>
        </div>

        {unidadesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <p className="text-gray-500">Nenhuma unidade encontrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unidadesFiltradas.map((unidade) => (
              <div 
                key={unidade.id}
                onClick={() => router.push(`/hospital/${unidade.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${unidade.tipo === 'hospital' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                    {unidade.tipo === 'hospital' ? 'H' : 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {unidade.nome}
                      </h3>
                      {getTipoBadge(unidade.tipo)}
                    </div>
                    <p className="text-sm text-gray-600">{unidade.endereco}</p>
                    <div className="text-xs text-gray-500 mt-2 flex gap-4">
                        <span>📞 {unidade.telefone}</span>
                        {unidade.total_medicos > 0 && <span>👨‍⚕️ {unidade.total_medicos} médicos</span>}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}