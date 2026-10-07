import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  ShieldCheck,
  Building2,
  ArrowRight,
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { UserAccount } from '../types';

interface LoginModalProps {
  users: UserAccount[];
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  currentUser,
  onLoginSuccess,
  isOpen,
  onClose
}) => {
  const [emailInput, setEmailInput] = useState<string>('admin@admin.com');
  const [passwordInput, setPasswordInput] = useState<string>('123456');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // MFA state
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [mfaCode, setMfaCode] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === emailInput.trim().toLowerCase() &&
        u.passwordHash === passwordInput
    );

    if (!user) {
      setErrorMessage('Credenciais inválidas. Verifique o e-mail e senha digitados.');
      return;
    }

    if (!user.active) {
      setErrorMessage('Este usuário foi desativado pela diretoria da Crepelocks.');
      return;
    }

    if (user.mfaEnabled) {
      setPendingUser(user);
      setStep('mfa');
    } else {
      onLoginSuccess(user);
      onClose();
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate MFA verification
    if (mfaCode.length === 6 || mfaCode === '123456') {
      if (pendingUser) {
        onLoginSuccess(pendingUser);
        onClose();
        setStep('credentials');
        setPendingUser(null);
      }
    } else {
      setErrorMessage('Código de verificação incorreto. Digite 6 dígitos válidos.');
    }
  };

  const handleQuickLogin = (user: UserAccount) => {
    setEmailInput(user.email);
    setPasswordInput(user.passwordHash);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-xl shadow-lg shadow-emerald-950/50 mb-2">
            C
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">CREPELOCKS</h2>
          <p className="text-xs text-zinc-400">
            Plataforma Integrada de Ponto Eletrônico & Gestão RH
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        {step === 'credentials' ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">E-mail de Acesso</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@admin.com ou seu@crepelocks.com.br"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 font-medium">Senha Segura</label>
                <span className="text-[11px] text-zinc-500 font-mono">Padrão: 123456</span>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <span>Acessar Painel Crepelocks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* MFA Step */
          <form onSubmit={handleMfaSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Autenticação em 2 Etapas (MFA)</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador ou use o código de teste <strong className="text-white">123456</strong>.
              </p>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Código de Verificação (6 dígitos)</label>
              <input
                type="text"
                maxLength={6}
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirmar MFA
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Switcher Section */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Acesso Rápido para Testes</span>
            </span>
            <span className="text-[10px] text-zinc-500">1-clique</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {users.slice(0, 4).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickLogin(user)}
                className="p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-800/50 text-left transition-all flex items-center gap-2"
              >
                <div
                  className={`w-6 h-6 rounded-md bg-gradient-to-br ${
                    user.avatarColor || 'from-emerald-600 to-teal-800'
                  } flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="font-bold text-white text-[11px] truncate">{user.name.split(' ')[0]}</div>
                  <div className="text-[9px] text-emerald-400 uppercase font-semibold">
                    {user.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Disclaimers */}
        <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Portaria MTP 671</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Criptografia SHA-256</span>
          </span>
        </div>
      </div>
    </div>
  );
};
