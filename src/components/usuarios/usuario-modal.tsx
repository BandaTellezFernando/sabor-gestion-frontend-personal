'use client';

import React, { useState } from 'react';
import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO, RolUsuario } from '@/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ROLES } from '@/lib/constants';

export interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  usuarioToEdit?: Usuario | null;
}

interface UsuarioFormContentProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  usuarioToEdit?: Usuario | null;
}

function UsuarioFormContent({
  onClose,
  onSave,
  usuarioToEdit,
}: UsuarioFormContentProps) {
  const isEditing = !!usuarioToEdit;
  const [nombre, setNombre] = useState(usuarioToEdit?.nombre || '');
  const [apellido, setApellido] = useState(usuarioToEdit?.apellido || '');
  const [ci, setCi] = useState(usuarioToEdit?.ci || '');
  const [email, setEmail] = useState(usuarioToEdit?.email || '');
  const [rol, setRol] = useState<RolUsuario>(usuarioToEdit?.rol || 'Mesero');
  const [password, setPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNombre = nombre.trim();
    const cleanApellido = apellido.trim();
    const cleanCi = ci.trim();
    const cleanEmail = email.trim();

    if (!cleanNombre || !cleanApellido || !cleanCi || !cleanEmail) {
      setFormError('Todos los campos básicos son obligatorios.');
      return;
    }

    if (!isEditing && !password) {
      setFormError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        nombre: cleanNombre,
        apellido: cleanApellido,
        ci: cleanCi,
        email: cleanEmail,
        rol,
      };
      if (password) {
        data.password = password;
      }
      
      await onSave(data);
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al procesar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <Alert variant="error" title="Error en los datos">
          {formError}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="usuario-nombre"
          name="nombre"
          label="Nombre"
          placeholder="Ej: Juan"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
        />
        <Input
          id="usuario-apellido"
          name="apellido"
          label="Apellido"
          placeholder="Ej: Pérez"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />
        <Input
          id="usuario-ci"
          name="ci"
          label="Cédula de Identidad"
          placeholder="Ej: 1234567"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          required
        />
        <Input
          id="usuario-email"
          name="email"
          type="email"
          label="Correo Electrónico"
          placeholder="Ej: juan@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <label htmlFor="usuario-rol" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Rol del Sistema
          </label>
          <select
            id="usuario-rol"
            name="rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as RolUsuario)}
            className="w-full h-10 px-3 py-2 bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-2 focus:ring-[#E05A36] focus:border-[#E05A36] dark:bg-[#1A1816] dark:border-stone-800 dark:text-stone-100"
            required
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="usuario-password"
          name="password"
          type="password"
          label={isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
          placeholder="******"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!isEditing}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}

export function UsuarioModal({
  isOpen,
  onClose,
  onSave,
  usuarioToEdit,
}: UsuarioModalProps) {
  const isEditing = !!usuarioToEdit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
      description={
        isEditing
          ? 'Modifica los datos del usuario en el sistema.'
          : 'Crea un nuevo usuario con acceso al sistema y asígnale un rol.'
      }
      maxWidth="md"
    >
      {isOpen && (
        <UsuarioFormContent
          key={usuarioToEdit?._id || 'nuevo-usuario'}
          onClose={onClose}
          onSave={onSave}
          usuarioToEdit={usuarioToEdit}
        />
      )}
    </Modal>
  );
}
