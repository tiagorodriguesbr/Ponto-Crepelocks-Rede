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
  Trash2,
  AlertTriangle,
  X,
  Check,
  Eye,
  FileText
} from 'lucide-react';
import { Store, UserAccount, PunchRecord } from '../types';
import { StorageService } from '../services/storage';

const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

interface StoresManagerProps {
  stores: Store[];
  users: UserAccount[];
  punches: PunchRecord[];
  currentUser?: UserAccount;
  onDataUpdated: () => void;
}

export const StoresManager: React.FC<StoresManagerProps> = ({
  stores,
  users,
  punches,
  currentUser,
  onDataUpdated
}) => {
  const isReadOnly = currentUser?.role !== 'dono' && !currentUser?.permissions?.canEditStores;
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  // New store form state
  const [storeName, setStoreName] = useState<string>('');
  const [storeCode, setStoreCode] = useState<string>('');
  const [storeCnpj, setStoreCnpj] = useState<string>('');
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
      cnpj: storeCnpj ? formatCnpj(storeCnpj) : undefined,
      address: storeAddress || 'Av. Principal, 100',
      city: storeCity || 'São Paulo - SP',
      phone: storePhone || '(11) 3000-0000',
      managerName: storeManager || 'Gerente a definir',
      active: true
    });

    setShowAddModal(false);
    setStoreName('');
    setStoreCode('');
    setStoreCnpj('');
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
      {/* Banner de Modo Somente Leitura para Gerente */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md flex items-center gap-3 text-amber-200">
          <Eye className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-amber-300 block">Modo Acompanhamento (Perfil Gerente)</span>
            <span>Você tem acesso aos indicadores e acompanhamento de todas as unidades da rede Crepelocks. O cadastro e edição de lojas são restritos ao Dono.</span>
          </div>
        </div>
      )}

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

        {!isReadOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Loja</span>
          </button>
        )}
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
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                          {store.code}
                        </span>
                        {store.cnpj && (
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800">
                            CNPJ: {store.cnpj}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingStore(store)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Editar Loja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {stores.length > 1 && (
                        <button
                          onClick={() => setStoreToDelete(store)}
                          className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Excluir Loja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  {store.cnpj && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>CNPJ: <strong className="font-mono text-zinc-300">{store.cnpj}</strong></span>
                    </div>
                  )}
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
                  <label className="block text-zinc-400 mb-1">CNPJ da Loja (Opcional)</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={storeCnpj}
                    onChange={(e) => setStoreCnpj(formatCnpj(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Código da Loja</label>
                  <input
                    type="text"
                    required
                    value={editingStore.code}
                    onChange={(e) => setEditingStore({ ...editingStore, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">CNPJ da Loja</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={editingStore.cnpj || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, cnpj: formatCnpj(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Telefone da Loja</label>
                  <input
                    type="text"
                    placeholder="(11) 3456-7890"
                    value={editingStore.phone || ''}
                    onChange={(e) => setEditingStore({ ...editingStore, phone: e.target.value })}
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

      {/* Modal: Delete Store Confirmation */}
      {storeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-rose-500/40 text-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Loja / Unidade</h3>
                <span className="text-[11px] text-zinc-400">Esta ação é irreversível</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Unidade:</span>
                <span className="font-bold text-white">{storeToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Código:</span>
                <span className="font-mono text-emerald-400">{storeToDelete.code}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Tem certeza que deseja excluir a unidade <strong>{storeToDelete.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  StorageService.deleteStore(storeToDelete.id);
                  setStoreToDelete(null);
                  onDataUpdated();
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
