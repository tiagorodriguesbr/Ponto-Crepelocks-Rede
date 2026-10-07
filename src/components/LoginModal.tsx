import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
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
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
      setErrorMessage('Credenciais inválidas. Verifique o e-mail e a senha digitados.');
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
    if (mfaCode.length === 6) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
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
            Plataforma Corporativa de Ponto Eletrônico & Gestão RH
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
              <label className="block text-zinc-400 mb-1 font-medium">Senha</label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <span>Acessar Painel</span>
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
                Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
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
                placeholder="000000"
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

        {/* Security Disclaimers */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-4 text-[10px] text-zinc-500">
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
