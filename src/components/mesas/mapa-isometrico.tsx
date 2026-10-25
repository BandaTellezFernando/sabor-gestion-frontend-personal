'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Mesa } from '@/types';
import { Mesa3D } from './mesa-3d';
import {
  MapPin,
  Layers,
  Edit3,
  RotateCcw,
  Compass,
} from 'lucide-react';

export interface MapaIsometricoProps {
  mesas: Mesa[];
  onMesaClick?: (mesa: Mesa) => void;
  className?: string;
  isEditMode?: boolean;
}

interface ZonaData {
  nombre: string;
  mesas: Mesa[];
}

export type TileType = 'floor' | 'wall';
export type MapLayout = Record<string, TileType>; // Clave: `${zona}_${x}_${y}`
export type TablePositions = Record<string, { x: number; y: number }>; // Clave: mesa._id

// Lienzo geométrico optimizado: 16x16 baldosas de 64px = 1024px x 1024px (256 baldosas)
const GRID_SIZE = 16;
const TILE_SIZE = 64;

const STORAGE_LAYOUT_KEY = 'sabor_isometric_map_layout_v5';
const STORAGE_POSITIONS_KEY = 'sabor_isometric_table_positions_v5';

/** Función auxiliar para inicializar el estado desde localStorage de forma segura para SSR */
function getInitialStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUB-COMPONENTE BALDOSA INDIVIDUAL MEMOIZADO
// REGLA CRÍTICA DE ALINEACIÓN: El div raíz receptor de eventos es un plano 2D
// perfecto sin translateZ ni bordes que alteren su hitbox geométrico.
// Todos los efectos visuales y bordes residen en el div hijo con pointer-events-none.
// ─────────────────────────────────────────────────────────────────────────────
interface BaldosaProps {
  x: number;
  y: number;
  zonaNombre: string;
  isWall: boolean;
  isEditMode: boolean;
  hasSelectedTable: boolean;
  onPointerDown: (e: React.PointerEvent, zona: string, x: number, y: number, isWall: boolean) => void;
  onPointerEnter: (e: React.PointerEvent, zona: string, x: number, y: number) => void;
  onClick: (e: React.MouseEvent, zona: string, x: number, y: number, isWall: boolean) => void;
}

const Baldosa = React.memo(function Baldosa({
  x,
  y,
  zonaNombre,
  isWall,
  isEditMode,
  hasSelectedTable,
  onPointerDown,
  onPointerEnter,
  onClick,
}: BaldosaProps) {
  const posX = x * TILE_SIZE;
  const posY = y * TILE_SIZE;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, zonaNombre, x, y, isWall)}
      onPointerEnter={(e) => onPointerEnter(e, zonaNombre, x, y)}
      onClick={(e) => onClick(e, zonaNombre, x, y, isWall)}
      className={`absolute select-none ${
        isWall && !isEditMode ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'
      }`}
      style={{
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${TILE_SIZE}px`,
        height: `${TILE_SIZE}px`,
        // Plano 2D puro a Z=0: sin transforms ni translateZ para hit-testing exacto
      }}
      title={
        isEditMode
          ? hasSelectedTable
            ? !isWall
              ? 'Clic para colocar la mesa aquí'
              : undefined
            : 'Shift + Clic para alternar Suelo / Vacío'
          : undefined
      }
    >
      {/* CAPA VISUAL Y RELIEVE (100% pointer-events-none para no alterar la hitbox) */}
      <div
        className={`w-full h-full pointer-events-none transition-colors duration-100 ${
          isWall
            ? isEditMode
              ? 'opacity-25 hover:opacity-50 border border-dashed border-stone-500/50 bg-stone-500/10'
              : 'opacity-0'
            : isEditMode
            ? hasSelectedTable
              ? 'bg-stone-800/80 border border-stone-600 ring-2 ring-cyan-400 bg-cyan-500/20'
              : 'bg-stone-800/70 border border-stone-700/80 hover:bg-stone-700/80'
            : 'bg-stone-800/60 dark:bg-stone-800/80 border border-stone-700 dark:border-stone-600/90 shadow-xs'
        }`}
      >
        {/* Losa activa: reflejo sutil */}
        {!isWall && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25 pointer-events-none" />
        )}

        {/* Glifo '+' en baldosas vacías en modo edición */}
        {isWall && isEditMode && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-stone-400 opacity-60">
            +
          </span>
        )}

        {/* Coordenadas en modo edición */}
        {!isWall && isEditMode && (
          <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-stone-400/40">
            {x},{y}
          </span>
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUB-COMPONENTE ZONA VIEWPORT
// ─────────────────────────────────────────────────────────────────────────────
interface ZonaViewportProps {
  zona: ZonaData;
  isEditMode: boolean;
  selectedTableId: string | null;
  mapLayout: MapLayout;
  effectiveTablePositions: TablePositions;
  mesaSeleccionadaObj: Mesa | null;
  onTableClick: (mesa: Mesa) => void;
  onTileClick: (e: React.MouseEvent, zona: string, x: number, y: number, isWall: boolean) => void;
  onTilePointerDown: (e: React.PointerEvent, zona: string, x: number, y: number, isWall: boolean) => void;
  onTilePointerEnter: (e: React.PointerEvent, zona: string, x: number, y: number) => void;
  onResetZoneLayout: (zonaNombre: string) => void;
  onCancelSelection: () => void;
}

function ZonaViewport({
  zona,
  isEditMode,
  selectedTableId,
  mapLayout,
  effectiveTablePositions,
  mesaSeleccionadaObj,
  onTableClick,
  onTileClick,
  onTilePointerDown,
  onTilePointerEnter,
  onResetZoneLayout,
  onCancelSelection,
}: ZonaViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Centrar suavemente en el medio del plano
  const centerViewport = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollLeft = (vp.scrollWidth - vp.clientWidth) / 2;
    vp.scrollTop = (vp.scrollHeight - vp.clientHeight) / 2;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      centerViewport();
    }, 60);
    return () => clearTimeout(timer);
  }, [centerViewport]);

  const count = zona.mesas.length;

  return (
    <div className="rounded-3xl border border-stone-200 dark:border-stone-800/80 bg-stone-900/5 dark:bg-black/30 p-4 sm:p-6 overflow-hidden relative shadow-sm">
      {/* Encabezado de la Zona */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
            {zona.nombre}
          </h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            ({count} {count === 1 ? 'mesa' : 'mesas'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={centerViewport}
            className="flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 transition-colors shadow-2xs"
            title="Centrar la cámara en el medio del plano"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            Centrar vista
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={() => onResetZoneLayout(zona.nombre)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 transition-colors"
              title="Restablece todas las baldosas a suelo completo"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer suelo
            </button>
          )}
        </div>
      </div>

      {/* CONTENEDOR VIEWPORT SCROLLABLE */}
      <div
        ref={viewportRef}
        className="w-full h-[620px] overflow-auto relative rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-950/20 dark:bg-black/50 shadow-inner"
      >
        {/* HUD FLOTANTE SUPERIOR IZQUIERDO */}
        <div className="sticky top-4 left-4 z-50 pointer-events-auto inline-block max-w-sm">
          <div className="p-3.5 rounded-2xl bg-stone-900/90 dark:bg-stone-900/95 border border-stone-700/80 text-stone-100 shadow-2xl backdrop-blur-md space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 border-b border-stone-700/60 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-200">
                {isEditMode ? (
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-primary" />
                )}
                <span>{isEditMode ? 'Editor de Plano (Tilemap)' : 'Plano 3D Isométrico'}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                {GRID_SIZE}x{GRID_SIZE} baldosas
              </span>
            </div>

            {isEditMode ? (
              <div className="space-y-2">
                <ul className="space-y-1.5 text-[11px] text-stone-300">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-[10px] font-mono border border-stone-600 text-amber-300">Shift</kbd> + <strong>Clic / Arrastrar:</strong> Alternar Suelo / Vacío
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>
                      <strong>Clic en Mesa:</strong> Seleccionar para mover
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>
                      <strong>Clic en Suelo:</strong> Colocar mesa seleccionada
                    </span>
                  </li>
                </ul>

                {mesaSeleccionadaObj && (
                  <div className="pt-2 border-t border-stone-700/60 flex items-center justify-between gap-2 text-cyan-300">
                    <span className="font-semibold truncate">
                      Mesa {mesaSeleccionadaObj.numero} seleccionada
                    </span>
                    <button
                      type="button"
                      onClick={onCancelSelection}
                      className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 text-[11px] text-stone-400">
                <p>Haz clic en cualquier mesa para abrir o gestionar su comanda.</p>
                <div className="flex items-center gap-3 pt-1 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Libre
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C84B26]" /> Ocupada
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Cuenta
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ESCENARIO CENTRADO: La perspectiva 3D se concentra en el centro exacto del plano para evitar desfase de hitbox */}
        <div
          className="min-w-[1500px] min-h-[1300px] p-20 flex items-center justify-center select-none"
          style={{
            perspective: '2500px',
            perspectiveOrigin: 'center center',
          }}
        >
          {/* PLANO ISOMÉTRICO 3D */}
          <div
            className="relative pointer-events-none origin-center transition-all duration-300 ease-out"
            style={{
              width: `${GRID_SIZE * TILE_SIZE}px`,
              height: `${GRID_SIZE * TILE_SIZE}px`,
              transform: 'rotateX(60deg) rotateZ(-45deg)',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
            }}
          >
            {/* RENDERIZADO DE LAS BALDOSAS MEMOIZADAS (PLANOS 2D PUROS A Z=0) */}
            {Array.from({ length: GRID_SIZE }).map((_, y) =>
              Array.from({ length: GRID_SIZE }).map((_, x) => {
                const tileKey = `${zona.nombre}_${x}_${y}`;
                const isWall = mapLayout[tileKey] === 'wall';

                return (
                  <Baldosa
                    key={tileKey}
                    x={x}
                    y={y}
                    zonaNombre={zona.nombre}
                    isWall={isWall}
                    isEditMode={isEditMode}
                    hasSelectedTable={selectedTableId !== null}
                    onPointerDown={onTilePointerDown}
                    onPointerEnter={onTilePointerEnter}
                    onClick={onTileClick}
                  />
                );
              })
            )}

            {/* RENDERIZADO DE LAS MESAS 3D POSICIONADAS EN COORDENADAS */}
            {zona.mesas.map((mesa) => {
              const pos = effectiveTablePositions[mesa._id] || { x: 8, y: 8 };
              const isSelected = selectedTableId === mesa._id;

              const isUnida = mesa.numero.includes('+') || /\by\b/i.test(mesa.numero);

              // Si es unida, el centro se desplaza hacia la derecha para alinearse sobre las dos baldosas [x, x+1]
              const posX = isUnida
                ? pos.x * TILE_SIZE + TILE_SIZE
                : pos.x * TILE_SIZE + TILE_SIZE / 2;
              const posY = pos.y * TILE_SIZE + TILE_SIZE / 2;

              return (
                <div
                  key={mesa._id}
                  className="absolute transition-all duration-300 ease-out pointer-events-auto"
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: 'translate(-50%, -50%)',
                    transformStyle: 'preserve-3d',
                    zIndex: isSelected ? 40 : 10,
                  }}
                >
                  <Mesa3D
                    mesa={mesa}
                    isEditMode={isEditMode}
                    isSelected={isSelected}
                    x={pos.x}
                    y={pos.y}
                    onClick={() => onTableClick(mesa)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPONENTE PRINCIPAL MAPA ISOMETRICO
// ─────────────────────────────────────────────────────────────────────────────
export function MapaIsometrico({
  mesas,
  onMesaClick,
  className = '',
  isEditMode: isEditModeProp,
}: MapaIsometricoProps) {
  // Soporte de modo edición tanto controlado por prop como interno
  const [internalEditMode, setInternalEditMode] = useState<boolean>(false);
  const isEditMode = isEditModeProp !== undefined ? isEditModeProp : internalEditMode;

  // Agrupar mesas por ubicación física (ej. "Interior", "Terraza", "Salón Principal")
  const zonas: ZonaData[] = useMemo(() => {
    const mapa = new Map<string, Mesa[]>();

    mesas.forEach((m) => {
      const nombreZona = m.ubicacion?.trim() || 'Salón Principal';
      const actual = mapa.get(nombreZona) || [];
      actual.push(m);
      mapa.set(nombreZona, actual);
    });

    return Array.from(mapa.entries()).map(([nombre, list]) => ({
      nombre,
      mesas: list.sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true })),
    }));
  }, [mesas]);

  // Zona activa para visualización enfocada (o 'todas' para ver todas las zonas)
  const [zonaActiva, setZonaActiva] = useState<string>('todas');

  // Estado de mesa seleccionada en Modo Edición
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Estados persistentes en localStorage
  const [mapLayout, setMapLayout] = useState<MapLayout>(() =>
    getInitialStorage<MapLayout>(STORAGE_LAYOUT_KEY, {})
  );
  const [tablePositions, setTablePositions] = useState<TablePositions>(() =>
    getInitialStorage<TablePositions>(STORAGE_POSITIONS_KEY, {})
  );

  // Referencias para el arrastre opcional con Shift
  const isDrawingRef = useRef<boolean>(false);
  const drawModeRef = useRef<'add' | 'remove'>('add');

  // Listener global para cancelar arrastre
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isDrawingRef.current = false;
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Asignación de coordenadas calculada para mesas que no tienen posición guardada
  const effectiveTablePositions = useMemo(() => {
    const result: TablePositions = { ...tablePositions };
    const occupiedTiles = new Set<string>();

    Object.entries(result).forEach(([mesaId, coords]) => {
      const mesaObj = mesas.find((m) => m._id === mesaId);
      const zona = mesaObj?.ubicacion?.trim() || 'Salón Principal';
      occupiedTiles.add(`${zona}_${coords.x}_${coords.y}`);
      if (mesaObj && (mesaObj.numero.includes('+') || /\by\b/i.test(mesaObj.numero))) {
        occupiedTiles.add(`${zona}_${coords.x + 1}_${coords.y}`);
      }
    });

    zonas.forEach((zona) => {
      zona.mesas.forEach((mesa) => {
        const currentCoord = result[mesa._id];
        const isUnida = mesa.numero.includes('+') || /\by\b/i.test(mesa.numero);
        if (
          !currentCoord ||
          typeof currentCoord.x !== 'number' ||
          typeof currentCoord.y !== 'number' ||
          currentCoord.x < 0 ||
          currentCoord.x >= GRID_SIZE ||
          currentCoord.y < 0 ||
          currentCoord.y >= GRID_SIZE
        ) {
          let assigned = false;
          // Asignar en el interior del plano evitando las orillas
          for (let y = 3; y < GRID_SIZE - 2 && !assigned; y += 2) {
            for (let x = 2; x < GRID_SIZE - (isUnida ? 3 : 2) && !assigned; x += isUnida ? 3 : 2) {
              const tileKey1 = `${zona.nombre}_${x}_${y}`;
              const tileKey2 = `${zona.nombre}_${x + 1}_${y}`;
              const isWall1 = mapLayout[tileKey1] === 'wall';
              const isWall2 = isUnida ? mapLayout[tileKey2] === 'wall' : false;

              if (
                !isWall1 &&
                !isWall2 &&
                !occupiedTiles.has(tileKey1) &&
                (!isUnida || !occupiedTiles.has(tileKey2))
              ) {
                result[mesa._id] = { x, y };
                occupiedTiles.add(tileKey1);
                if (isUnida) occupiedTiles.add(tileKey2);
                assigned = true;
              }
            }
          }

          // Si el centro está ocupado, buscar en cualquier celda libre
          if (!assigned) {
            for (let y = 1; y < GRID_SIZE - 1 && !assigned; y++) {
              for (let x = 1; x < GRID_SIZE - (isUnida ? 2 : 1) && !assigned; x++) {
                const tileKey1 = `${zona.nombre}_${x}_${y}`;
                const tileKey2 = `${zona.nombre}_${x + 1}_${y}`;
                const isWall1 = mapLayout[tileKey1] === 'wall';
                const isWall2 = isUnida ? mapLayout[tileKey2] === 'wall' : false;

                if (
                  !isWall1 &&
                  !isWall2 &&
                  !occupiedTiles.has(tileKey1) &&
                  (!isUnida || !occupiedTiles.has(tileKey2))
                ) {
                  result[mesa._id] = { x, y };
                  occupiedTiles.add(tileKey1);
                  if (isUnida) occupiedTiles.add(tileKey2);
                  assigned = true;
                }
              }
            }
          }
        }
      });
    });

    return result;
  }, [tablePositions, mesas, zonas, mapLayout]);

  // Sincronización en localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(mapLayout));
    } catch (e) {
      console.error('Error guardando mapLayout en localStorage', e);
    }
  }, [mapLayout]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(effectiveTablePositions));
    } catch (e) {
      console.error('Error guardando tablePositions en localStorage', e);
    }
  }, [effectiveTablePositions]);

  // Clic en baldosa:
  // - Con SHIFT: Alternar Suelo <-> Vacío
  // - Sin SHIFT: Si hay mesa seleccionada, colocarla en la baldosa de suelo; si no, NO HACER NADA.
  const handleTileClick = useCallback(
    (e: React.MouseEvent, zona: string, x: number, y: number, isWall: boolean) => {
      if (!isEditMode) return;

      // REGLA OBLIGATORIA: Alternar baldosa REQUIERE estrictamente Shift presionado
      if (e.shiftKey) {
        const key = `${zona}_${x}_${y}`;
        const nextType: TileType = isWall ? 'floor' : 'wall';
        setMapLayout((prev) => ({
          ...prev,
          [key]: nextType,
        }));
        return;
      }

      // Si hace clic SIN Shift y hay una mesa seleccionada, colocarla en suelo
      if (selectedTableId && !isWall) {
        setTablePositions((prev) => ({
          ...prev,
          ...effectiveTablePositions,
          [selectedTableId]: { x, y },
        }));
        setSelectedTableId(null);
        return;
      }

      // Clic sin Shift y sin mesa seleccionada -> NO hace nada para evitar borrado accidental
    },
    [isEditMode, selectedTableId, effectiveTablePositions]
  );

  // Arrastre continuo protegido: SOLO se activa si SHIFT está presionado
  const handleTilePointerDown = useCallback(
    (e: React.PointerEvent, zona: string, x: number, y: number, isWall: boolean) => {
      if (!isEditMode) return;

      if (e.shiftKey && e.button === 0) {
        e.stopPropagation();
        const targetMode: 'add' | 'remove' = isWall ? 'add' : 'remove';
        isDrawingRef.current = true;
        drawModeRef.current = targetMode;

        const key = `${zona}_${x}_${y}`;
        const nextType: TileType = targetMode === 'add' ? 'floor' : 'wall';
        setMapLayout((prev) => {
          if (prev[key] === nextType) return prev;
          return { ...prev, [key]: nextType };
        });
      }
    },
    [isEditMode]
  );

  const handleTilePointerEnter = useCallback(
    (e: React.PointerEvent, zona: string, x: number, y: number) => {
      if (!isEditMode) return;

      // El arrastre continuo requiere estrictamente isDrawingRef Y Shift
      if (isDrawingRef.current && e.shiftKey && e.buttons === 1) {
        const key = `${zona}_${x}_${y}`;
        const nextType: TileType = drawModeRef.current === 'add' ? 'floor' : 'wall';
        setMapLayout((prev) => {
          if (prev[key] === nextType) return prev;
          return { ...prev, [key]: nextType };
        });
      }
    },
    [isEditMode]
  );

  // Clic en mesa
  const handleTableClick = useCallback(
    (mesa: Mesa) => {
      if (isEditMode) {
        // En modo edición: seleccionar o deseleccionar mesa
        setSelectedTableId((prev) => (prev === mesa._id ? null : mesa._id));
      } else {
        // En modo vista: abrir comanda
        onMesaClick?.(mesa);
      }
    },
    [isEditMode, onMesaClick]
  );

  // Restablecer todas las baldosas de la zona a suelo completo
  const handleResetZoneLayout = useCallback((zonaNombre: string) => {
    if (!window.confirm(`¿Deseas restablecer todas las baldosas de "${zonaNombre}" a suelo completo?`)) {
      return;
    }

    setMapLayout((prev) => {
      const next = { ...prev };
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          delete next[`${zonaNombre}_${x}_${y}`];
        }
      }
      return next;
    });

    setSelectedTableId(null);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectedTableId(null);
  }, []);

  const zonasFiltradas = useMemo(() => {
    if (zonaActiva === 'todas') return zonas;
    return zonas.filter((z) => z.nombre === zonaActiva);
  }, [zonas, zonaActiva]);

  const mesaSeleccionadaObj = useMemo(() => {
    if (!selectedTableId) return null;
    return mesas.find((m) => m._id === selectedTableId) || null;
  }, [selectedTableId, mesas]);

  return (
    <div className={`space-y-4 select-none ${className}`}>
      {/* Barra de Controles y Selector de Zonas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Plano Isométrico 3D (Tilemap de Precisión)
              </h2>
              {isEditMode && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                  <Edit3 className="w-3 h-3" />
                  EDICIÓN ACTIVA
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isEditMode
                ? 'Mantén Shift para alternar baldosas, o haz clic en una mesa para reubicarla.'
                : 'Supervisión espacial 3D con alineación geométrica y colisiones precisas.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón interactivo para alternar Modo Edición */}
          <button
            type="button"
            onClick={() => {
              setSelectedTableId(null);
              setInternalEditMode((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              isEditMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
            }`}
            title={isEditMode ? 'Terminar edición y volver al modo operativo' : 'Activar modo edición del plano'}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditMode ? 'Terminar Edición' : 'Modo Edición'}
          </button>

          {/* Selector de Zonas */}
          {zonas.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-stone-500 mr-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Zona:
              </span>
              <button
                type="button"
                onClick={() => setZonaActiva('todas')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  zonaActiva === 'todas'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Todas ({mesas.length})
              </button>
              {zonas.map((z) => (
                <button
                  key={z.nombre}
                  type="button"
                  onClick={() => setZonaActiva(z.nombre)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    zonaActiva === z.nombre
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {z.nombre} ({z.mesas.length})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Renderizado de Planos por cada Zona */}
      {zonasFiltradas.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No se encontraron mesas activas para la zona seleccionada.
          </p>
        </div>
      ) : (
        zonasFiltradas.map((zona) => (
          <ZonaViewport
            key={zona.nombre}
            zona={zona}
            isEditMode={isEditMode}
            selectedTableId={selectedTableId}
            mapLayout={mapLayout}
            effectiveTablePositions={effectiveTablePositions}
            mesaSeleccionadaObj={mesaSeleccionadaObj}
            onTableClick={handleTableClick}
            onTileClick={handleTileClick}
            onTilePointerDown={handleTilePointerDown}
            onTilePointerEnter={handleTilePointerEnter}
            onResetZoneLayout={handleResetZoneLayout}
            onCancelSelection={handleCancelSelection}
          />
        ))
      )}
    </div>
  );
}
