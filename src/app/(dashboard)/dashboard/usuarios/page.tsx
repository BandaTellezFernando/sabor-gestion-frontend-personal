'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Usuario } from '@/types';
import { usuarioService } from '@/services/usuario.service';
import { RoleGuard } from '@/components/auth/role-guard';
import { UsuarioModal } from '@/components/usuarios/usuario-modal';
import { UsuarioDeleteModal } from '@/components/usuarios/usuario-delete-modal';
import { UsuarioEstadoModal } from '@/components/usuarios/usuario-estado-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, Search, RefreshCw, Pencil, Trash2, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ROL_LABELS } from '@/lib/constants';

function UsuariosPageContent() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [usuarioToEdit, setUsuarioToEdit] = useState<Usuario | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  const [isEstadoOpen, setIsEstadoOpen] = useState<boolean>(false);
  const [usuarioToChangeStatus, setUsuarioToChangeStatus] = useState<Usuario | null>(null);

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usuarioService.getUsuarios();
      setUsuarios(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los usuarios.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadUsuarios();
    });
  }, [loadUsuarios]);

  // Filtrado
  const filteredUsuarios = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    const term = searchTerm.toLowerCase().trim();
    return usuarios.filter((u) => 
      u.nombre.toLowerCase().includes(term) ||
      u.apellido.toLowerCase().includes(term) ||
      u.ci.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.rol.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  // Auto-cerrar notificación de éxito
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenCreate = () => {
    setUsuarioToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (usuario: Usuario) => {
    setUsuarioToEdit(usuario);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setIsDeleteOpen(true);
  };

  const handleOpenEstado = (usuario: Usuario) => {
    setUsuarioToChangeStatus(usuario);
    setIsEstadoOpen(true);
  };

  const handleSave = async (data: any) => {
    if (usuarioToEdit) {
      await usuarioService.actualizarUsuario(usuarioToEdit._id || usuarioToEdit.id, data);
      setNotification({ type: 'success', message: `Usuario "${data.nombre} ${data.apellido}" actualizado exitosamente.` });
    } else {
      await usuarioService.crearUsuario(data);
      setNotification({ type: 'success', message: `Usuario "${data.nombre} ${data.apellido}" creado exitosamente.` });
    }
    await loadUsuarios();
  };

  const handleDelete = async () => {
    if (!usuarioToDelete) return;
    await usuarioService.eliminarUsuario(usuarioToDelete._id || usuarioToDelete.id);
    setNotification({ type: 'success', message: `Usuario "${usuarioToDelete.nombre}" eliminado exitosamente.` });
    await loadUsuarios();
  };

  const handleChangeEstado = async () => {
    if (!usuarioToChangeStatus) return;
    const nuevoEstado = !usuarioToChangeStatus.estado;
    await usuarioService.cambiarEstadoUsuario(usuarioToChangeStatus._id || usuarioToChangeStatus.id, nuevoEstado);
    setNotification({ type: 'success', message: `Usuario "${usuarioToChangeStatus.nombre}" ha sido ${nuevoEstado ? 'activado' : 'desactivado'}.` });
    await loadUsuarios();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Gestión de Usuarios
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Administra el personal del sistema, asigna roles y controla su acceso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={loadUsuarios}
            disabled={isLoading}
            title="Recargar usuarios"
            className="rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {notification && (
        <Alert
          variant={notification.type === 'success' ? 'success' : 'error'}
          title={notification.type === 'success' ? 'Operación exitosa' : 'Aviso'}
        >
          {notification.message}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error al cargar datos">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <div>
              <Button variant="outline" size="sm" onClick={loadUsuarios} className="rounded-xl">
                Reintentar
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex-1 max-w-md">
          <Input
            id="buscar-usuario"
            placeholder="Buscar por nombre, CI, email o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-stone-500 dark:text-stone-400 self-center sm:self-auto font-medium">
          Total: {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuario' : 'usuarios'}
        </div>
      </div>

      {/* Estado de Carga */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Spinner size="lg" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
            Cargando usuarios del sistema...
          </p>
        </div>
      )}

      {/* Lista / Tabla de Usuarios */}
      {!isLoading && filteredUsuarios.length === 0 && (
        <EmptyState
          icon={Users}
          title={searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          description={
            searchTerm
              ? `No hay ningún usuario que coincida con "${searchTerm}".`
              : 'Empieza registrando al primer usuario del sistema.'
          }
          action={
            <Button
              variant={searchTerm ? 'outline' : 'primary'}
              size="sm"
              onClick={searchTerm ? () => setSearchTerm('') : handleOpenCreate}
            >
              {searchTerm ? 'Limpiar búsqueda' : 'Crear Usuario'}
            </Button>
          }
        />
      )}

      {!isLoading && filteredUsuarios.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" role="table">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Personal</th>
                  <th scope="col" className="px-6 py-3.5">C.I.</th>
                  <th scope="col" className="px-6 py-3.5">Rol</th>
                  <th scope="col" className="px-6 py-3.5">Estado</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredUsuarios.map((u) => (
                  <tr
                    key={u._id || u.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{u.nombre} {u.apellido}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-700 dark:text-stone-300">
                      {u.ci}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          u.rol === 'Administrador'
                            ? 'admin'
                            : u.rol === 'Mesero'
                            ? 'mesero'
                            : u.rol === 'Cajero'
                            ? 'cajero'
                            : 'cocinero'
                        }
                        className="text-xs"
                      >
                        {ROL_LABELS[u.rol] || u.rol}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.estado ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs font-semibold ${u.estado ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                          {u.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEstado(u)}
                          className={u.estado ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30 rounded-xl' : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 rounded-xl'}
                          title={u.estado ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-xl"
                          title="Editar usuario"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(u)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-xl"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        usuarioToEdit={usuarioToEdit}
      />

      <UsuarioDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        usuario={usuarioToDelete}
      />

      <UsuarioEstadoModal
        isOpen={isEstadoOpen}
        onClose={() => setIsEstadoOpen(false)}
        onConfirm={handleChangeEstado}
        usuario={usuarioToChangeStatus}
      />
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <RoleGuard allowedRoles={['Administrador']}>
      <UsuariosPageContent />
    </RoleGuard>
  );
}
