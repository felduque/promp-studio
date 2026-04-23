'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/me', { name, email });
      await fetchUser();
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setChangingPw(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b1326] overflow-y-auto ps-editor-scroll">
      <header className="px-8 py-6 shrink-0">
        <h1 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-2xl tracking-tight">
          Profile
        </h1>
        <p className="text-[#c7c4d7] text-sm mt-1">
          Gestiona tu información personal
        </p>
      </header>

      <div className="flex-1 px-8 pb-8 space-y-6 max-w-2xl">
        {/* Profile Info */}
        <div className="bg-[#131b2e] border border-[rgba(70,69,84,0.1)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-5 h-5 text-[#c0c1ff]" />
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-base">
              Información Personal
            </h2>
          </div>
          <p className="text-[#c7c4d7] text-sm mb-5">Tu nombre y email de la cuenta</p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">Nombre</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-[#c7c4d7]/50" />
                </span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd] pl-10 focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-[#c7c4d7]/50" />
                </span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd] pl-10 focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-[#c0c1ff] to-[#8083ff] text-[#1000a9] font-bold rounded px-6 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[#131b2e] border border-[rgba(70,69,84,0.1)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-[#c0c1ff]" />
            <h2 className="font-[var(--font-space-grotesk)] font-bold text-[#dae2fd] text-base">
              Cambiar Contraseña
            </h2>
          </div>
          <p className="text-[#c7c4d7] text-sm mb-5">Actualiza tu contraseña de acceso</p>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">Contraseña actual</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#c7c4d7]/50" />
                </span>
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd] pl-10 pr-10 placeholder-[#908fa0] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#c7c4d7] hover:text-[#dae2fd] transition-colors"
                >
                  {showCurrent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.05em] text-[#c7c4d7]">Nueva contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#c7c4d7]/50" />
                </span>
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="bg-[#060e20] border-[rgba(70,69,84,0.3)] text-[#dae2fd] pl-10 pr-10 placeholder-[#908fa0] focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#c7c4d7] hover:text-[#dae2fd] transition-colors"
                >
                  {showNew ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPw || !currentPassword || !newPassword}
              className="text-[#c0c1ff] hover:bg-[#2d3449]/30 px-4 py-2 rounded text-sm font-medium transition-colors border border-[rgba(70,69,84,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              {changingPw ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
