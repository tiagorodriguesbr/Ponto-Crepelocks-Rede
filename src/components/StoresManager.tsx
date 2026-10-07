import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Users,
  CheckCircle,
  TrendingUp,
  Clock,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { Store, UserAccount, PunchRecord } from '../types';
import { StorageService } from '../services/storage';

interface StoresManagerProps {
  stores: Store[];
  users: UserAccount[];
  punches: PunchRecord[];
  onDataUpdated: () => void;
}

export const StoresManager: React.FC<StoresManagerProps> = ({
  stores,
  users,
  punches,
  onDataUpdated
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  // New store form state
  const [storeName, setStoreName] = useState<string>('');
  const [storeCode, setStoreCode] = useState<string>('');
  const [storeAddress, setStoreAddress] = useState<string>('');
  const [storeCity, setStoreCity] = useState<string>('São Paulo - SP');
  const [storePhone, setStorePhone] = useState<string>('');
  const [storeManager, setStoreManager] = useState<string>('');

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !storeCode) return;

    StorageService.addStore({
      id: `store-${Date.now()}`,
      name: storeName,
      code: storeCode.toUpperCase(),
      address: storeAddress || 'Av. Principal, 100',
      city: storeCity || 'São Paulo - SP',
      phone: storePhone || '(11) 3000-0000',
      managerName: storeManager || 'Gerente a definir',
      active: true
    });

    setShowAddModal(false);
    setStoreName('');
    setStoreCode('');
    setStoreAddress('');
    setStorePhone('');
    setStoreManager('');
    onDataUpdated();
  };

  const handleUpdateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    StorageService.updateStore(editingStore);
    setEditingStore(null);
    onDataUpdated();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Gestão de Lojas & Unidades Crepelocks</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre novas franquias/lojas, vincule gerentes e monitore o desempenho operacional por unidade.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Loja</span>
        </button>
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stores.map((store) => {
          const storeEmployees = users.filter((u) => u.storeId === store.id && u.active);
          const storePunches = punches.filter((p) =>
            storeEmployees.some((e) => e.id === p.employeeId)
          );

          const delayCount = storePunches.filter((p) => p.status === 'atraso').length;
          const punctualityScore =
            storePunches.length > 0
              ? Math.round(
                  storePunches.reduce((acc, p) => acc + (p.adherencePercentage || 100), 0) /
                    storePunches.length
                )
              : 98;

          return (
            <div
              key={store.id}
              className="p-5 rounded-2xl border bg-card/60 backdrop-blur-md border-border shadow-md flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{store.name}</h3>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        Código: {store.code}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingStore(store)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Editar Loja"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{store.address} - {store.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>{store.phone || '(11) 3456-7890'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>Gerente: <strong className="text-zinc-200">{store.managerName || 'Não definido'}</strong></span>
                  </div>
                </div>

                {/* Performance stats per store */}
                <div className="mt-4 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Equipe</span>
                    <p className="font-bold text-white text-sm">{storeEmployees.length} colaboradores</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Pontualidade</span>
                    <p className="font-bold text-emerald-400 text-sm">{punctualityScore}%</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle className="w-3 h-3" />
                  <span>Unidade Operando Ativa</span>
                </span>
                <span className="text-[11px] text-zinc-400">
                  {delayCount > 0 ? `${delayCount} atraso(s)` : 'Sem ocorrências'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add New Store */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Cadastrar Nova Loja Crepelocks</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nome da Loja / Unidade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Crepelocks Shopping Morumbi"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Código da Unidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LJ-04"
                    value={storeCode}
                    onChange={(e) => setStoreCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Telefone da Loja</label>
                  <input
                    type="text"
                    placeholder="(11) 3333-4444"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Av. Roque Petroni Júnior, 1089 - Piso L2"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Gerente de Loja</label>
                  <input
                    type="text"
                    placeholder="Nome do gerente"
                    value={storeManager}
                    onChange={(e) => setStoreManager(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Salvar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Store */}
      {editingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Editar Informações da Loja</span>
              </h3>
              <button onClick={() => setEditingStore(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStore} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Nome da Loja</label>
                <input
                  type="text"
                  required
                  value={editingStore.name}
                  onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Endereço</label>
                <input
                  type="text"
                  value={editingStore.address}
                  onChange={(e) => setEditingStore({ ...editingStore, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Gerente Responsável</label>
                <input
                  type="text"
                  value={editingStore.managerName || ''}
                  onChange={(e) => setEditingStore({ ...editingStore, managerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                >
                  Atualizar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
