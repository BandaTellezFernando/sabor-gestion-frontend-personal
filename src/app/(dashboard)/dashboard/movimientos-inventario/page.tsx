'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  RefreshCw,
  Search,
} from 'lucide-react';

import { RoleGuard } from '@/components/auth/role-guard';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { movimientoInventarioService } from '@/services/movimiento-inventario.service';
import type {
  MovimientoInventario,
  RespuestaMovimientosInventario,
} from '@/types/movimiento-inventario';

const LIMITE_PAGINA = 25;

const RESULTADO_INICIAL: RespuestaMovimientosInventario = {
  movimientos: [],
  paginacion: {
    pagina: 1,
    limite: LIMITE_PAGINA,
    total: 0,
    totalPaginas: 0,
  },
};

function formatearFecha(valor: string): string {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return valor;

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(fecha);
}

function formatearCantidad(valor: number): string {
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 9,
  }).format(Number(valor));
}

function nombreUsuario(movimiento: MovimientoInventario): string {
  const usuario = movimiento.usuario;

  if (typeof usuario !== 'object' || usuario === null) {
    return 'Usuario registrado';
  }

  const nombre = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .join(' ')
    .trim();

  return nombre || 'Usuario registrado';
}

function MovimientosInventarioContent() {
  const [resultado, setResultado] =
    useState<RespuestaMovimientosInventario>(RESULTADO_INICIAL);

  const [pagina, setPagina] = useState(1);
  const [codigoPedido, setCodigoPedido] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const [filtrosActivos, setFiltrosActivos] = useState<{
    codigoPedido?: string;
    desde?: string;
    hasta?: string;
  }>({});

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movimientoExpandido, setMovimientoExpandido] =
    useState<string | null>(null);

  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await movimientoInventarioService.getMovimientos({
        pagina,
        limite: LIMITE_PAGINA,
        ...filtrosActivos,
      });

      setResultado(respuesta);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el historial de inventario.',
      );
    } finally {
      setCargando(false);
    }
  }, [pagina, filtrosActivos]);

  useEffect(() => {
    queueMicrotask(() => {
      void cargarMovimientos();
    });
  }, [cargarMovimientos]);

  const aplicarFiltros = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (desde && hasta && desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    setError(null);
    setPagina(1);
    setMovimientoExpandido(null);
    setFiltrosActivos({
      codigoPedido: codigoPedido.trim() || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    });
  };

  const limpiarFiltros = () => {
    setCodigoPedido('');
    setDesde('');
    setHasta('');
    setError(null);
    setPagina(1);
    setMovimientoExpandido(null);
    setFiltrosActivos({});
  };

  const irAPagina = (nuevaPagina: number) => {
    if (nuevaPagina < 1) return;
    if (resultado.paginacion.totalPaginas > 0 &&
        nuevaPagina > resultado.paginacion.totalPaginas) return;

    setPagina(nuevaPagina);
    setMovimientoExpandido(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              Historial de inventario
            </h1>
          </div>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Consumos registrados al procesar pedidos, con las cantidades guardadas en ese momento.
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={() => void cargarMovimientos()}
          disabled={cargando}
          className="flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </header>

      <form
        onSubmit={aplicarFiltros}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 rounded-sm border border-amber-700/25 bg-zinc-900 p-4 shadow-md"
      >
        <div>
          <label
            htmlFor="filtro-codigo-pedido"
            className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300"
          >
            Código del pedido
          </label>
          <input
            id="filtro-codigo-pedido"
            value={codigoPedido}
            onChange={(event) => setCodigoPedido(event.target.value)}
            placeholder="Ej. PED-001"
            className="w-full rounded-sm border border-amber-700/30 bg-zinc-950 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label
            htmlFor="filtro-desde"
            className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300"
          >
            Desde
          </label>
          <input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
            className="w-full rounded-sm border border-amber-700/30 bg-zinc-950 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label
            htmlFor="filtro-hasta"
            className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-300"
          >
            Hasta
          </label>
          <input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
            className="w-full rounded-sm border border-amber-700/30 bg-zinc-950 px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={cargando}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={limpiarFiltros}
          >
            Limpiar
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="error" title="No se pudo consultar el historial">
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void cargarMovimientos()}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </Alert>
      )}

      <section className="overflow-hidden rounded-sm border border-amber-700/25 bg-zinc-900 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-200 dark:border-stone-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-stone-500" />
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Movimientos registrados
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {resultado.paginacion.total} registro(s) en total
          </p>
        </div>

        {cargando && resultado.movimientos.length === 0 ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-stone-500 dark:text-stone-400">
            <Spinner size="md" />
            Cargando historial...
          </div>
        ) : resultado.movimientos.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <History className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-700" />
            <h3 className="mt-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
              No hay movimientos para mostrar
            </h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Los consumos aparecerán cuando se registren pedidos que descuenten ingredientes del inventario.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Consumos</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {resultado.movimientos.map((movimiento) => {
                const expandido = movimientoExpandido === movimiento._id;

                return (
                  <React.Fragment key={movimiento._id}>
                    <TableRow>
                      <TableCell className="min-w-36 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <CalendarDays className="h-4 w-4 shrink-0 text-stone-400" />
                          {formatearFecha(movimiento.fechaHora)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {movimiento.codigoPedido}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {nombreUsuario(movimiento)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {movimiento.consumos.length} ingrediente(s)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setMovimientoExpandido(expandido ? null : movimiento._id)
                          }
                          aria-expanded={expandido}
                        >
                          {expandido ? 'Ocultar' : 'Ver detalle'}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expandido && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-stone-50/70 dark:bg-stone-950/40">
                          <div className="space-y-3 py-2">
                            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                              Consumo registrado para el pedido {movimiento.codigoPedido}
                            </h3>

                            {movimiento.consumos.map((consumo, indice) => (
                              <article
                                key={`${movimiento._id}-${consumo.ingrediente}-${indice}`}
                                className="rounded-sm border border-amber-700/25 bg-zinc-950/70 p-3 sm:p-4"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                      {consumo.nombreIngrediente}
                                    </h4>
                                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                                      Unidad de inventario: {consumo.unidadStock}
                                    </p>
                                  </div>
                                  <div className="rounded-sm bg-amber-950/20 border border-amber-700/30 px-3 py-2">
                                    <span className="block text-xs text-amber-800 dark:text-amber-300">
                                      Consumo total
                                    </span>
                                    <span className="font-mono text-sm font-bold text-amber-900 dark:text-amber-200">
                                      {formatearCantidad(consumo.cantidadTotal)} {consumo.unidadStock}
                                    </span>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                  {consumo.detallePlatos.map((detalle, detalleIndice) => (
                                    <div
                                      key={`${detalle.plato}-${detalleIndice}`}
                                      className="rounded-sm bg-zinc-950/80 border border-amber-900/20 p-3 text-sm"
                                    >
                                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                                        {detalle.nombrePlato} × {detalle.cantidadPlatos}
                                      </p>
                                      <p className="mt-1 text-xs leading-5 text-stone-600 dark:text-stone-400">
                                        Receta: {formatearCantidad(detalle.cantidadNecesariaPorPlato)} {detalle.unidadReceta} por plato.
                                        {' '}Equivalente al registrar el consumo: {formatearCantidad(detalle.cantidadPorPlatoEnStock)} {detalle.unidadStock} por plato.
                                      </p>
                                      <p className="mt-1 text-xs font-semibold text-stone-700 dark:text-stone-300">
                                        Consumo total de esta línea: {formatearCantidad(detalle.consumoTotal)} {detalle.unidadStock}
                                      </p>
                                      {detalle.observacion && (
                                        <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">
                                          {detalle.observacion}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </article>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-stone-200 dark:border-stone-800 px-4 py-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Página {resultado.paginacion.pagina} de {Math.max(1, resultado.paginacion.totalPaginas)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => irAPagina(pagina - 1)}
              disabled={cargando || pagina <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => irAPagina(pagina + 1)}
              disabled={cargando || pagina >= resultado.paginacion.totalPaginas}
              className="flex items-center gap-1"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function MovimientosInventarioPage() {
  return (
    <RoleGuard allowedRoles={['Administrador', 'Cocinero']}>
      <MovimientosInventarioContent />
    </RoleGuard>
  );
}
