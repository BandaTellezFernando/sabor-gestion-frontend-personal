//src/components/mesas/mapa-isometrico.tsx
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
  onDesunirMesa?: (mesa: Mesa) => void;
  className?: string;
  isEditMode?: boolean;
  /** RBAC: solo un administrador puede activar el Modo Edición y mover/reubicar mesas. */
  isAdmin?: boolean;
}

interface ZonaData {
  nombre: string;
  mesas: Mesa[];
}

export type TileType = 'floor' | 'wall';
export type MapLayout = Record<string, TileType>; // Clave: `${zona}_${x}_${y}`
export type TablePositions = Record<string, { x: number; y: number }>; // Clave: mesa._id

// Lienzo geométrico optimizado: 16x16 baldosas de 64px = 1024px x 1024px (256 baldosas)
export const GRID_SIZE = 16;
export const TILE_SIZE = 64;

export const STORAGE_LAYOUT_KEY = 'sabor_isometric_map_layout_v5';
export const STORAGE_POSITIONS_KEY = 'sabor_isometric_table_positions_v5';
export const STORAGE_ORIGINAL_POSITIONS_KEY = 'sabor_isometric_original_table_positions_v1';

export function getMesaStorageKey(zona: string, numero: string): string {
  const cleanZona = (zona || 'Salón Principal').trim().toLowerCase();
  const cleanNum = (numero || '').replace(/\[.*?\]/g, '').trim().toLowerCase();
  return `${cleanZona}__${cleanNum}`;
}

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
// Utilidades de cuadrícula y distribución espacial para mesas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determina las dimensiones en cuadrícula (unidades de baldosa) para una mesa.
 * - Mesa normal: 1x1 baldosas
 * - Mesa unida lineal de N sub-mesas: Nx1 baldosas (mínimo 2x1)
 * - Mesa unida cuadrada/bloque:
 *   - 2 mesas: 2x1 baldosas
 *   - 3 o 4 mesas: 2x2 baldosas
 *   - 5 o 6 mesas: 3x2 baldosas
 *   - N mesas: ceil(sqrt(N)) x ceil(N / cols)
 */
export function getMesaGridUnits(mesa: Mesa): { unitsX: number; unitsY: number } {
  const count = mesa.estadoFusion === 'Fusionada' && Array.isArray(mesa.mesasOrigen)
    ? mesa.mesasOrigen.length
    : 1;
  if (count < 2) return { unitsX: 1, unitsY: 1 };

  const formaCuadrada = mesa.formaFusion ? mesa.formaFusion === 'Cuadrada' : count >= 3;
  if (!formaCuadrada || count === 2) return { unitsX: count, unitsY: 1 };
  if (count <= 4) return { unitsX: 2, unitsY: 2 };
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { unitsX: cols, unitsY: rows };
}

/**
 * Reasigna automáticamente las coordenadas espaciales al desunir una mesa.
 * - Toma (x, y) de la mesa madre como punto de partida.
 * - Asigna a cada mesa hija dejando EXACTAMENTE un cuadro (tile libre) de separación
 *   entre ellas (ej. si la primera está en (x, y), la siguiente se coloca en (x + 2, y)).
 * - Garantiza que las mesas hijas nunca compartan casilla ni queden pegadas sin margen.
 * - Purga el ID de la mesa original de tablePositions para eliminar huérfanas.
 * - Actualiza localStorage y despacha el evento global 'tablePositionsUpdated'.
 */
export function distribuirPosicionesDesunir(
  mesaOriginal: Mesa,
  mesasCreadas: Mesa[],
  allMesas?: Mesa[]
): TablePositions {
  if (typeof window === 'undefined') return {};

  let currentPositions: TablePositions = {};
  let currentLayout: MapLayout = {};
  let savedOriginals: TablePositions = {};

  try {
    const savedPos = localStorage.getItem(STORAGE_POSITIONS_KEY);
    if (savedPos) currentPositions = JSON.parse(savedPos);
  } catch {
    currentPositions = {};
  }

  try {
    const savedLayout = localStorage.getItem(STORAGE_LAYOUT_KEY);
    if (savedLayout) currentLayout = JSON.parse(savedLayout);
  } catch {
    currentLayout = {};
  }

  try {
    const savedOrig = localStorage.getItem(STORAGE_ORIGINAL_POSITIONS_KEY);
    if (savedOrig) savedOriginals = JSON.parse(savedOrig);
  } catch {
    savedOriginals = {};
  }

  const zona = mesaOriginal.ubicacion?.trim() || 'Salón Principal';

  // 1. Coordenada base de la mesa unida
  const baseCoord = currentPositions[mesaOriginal._id] || { x: 3, y: 3 };

  // 2. PURGAR la mesa unida original eliminada
  delete currentPositions[mesaOriginal._id];

  // 3. Limpiar IDs huérfanos que ya no existan en el catálogo
  if (allMesas && allMesas.length > 0) {
    const validIds = new Set(allMesas.map((m) => m._id));
    mesasCreadas.forEach((m) => validIds.add(m._id));
    validIds.delete(mesaOriginal._id);
    Object.keys(currentPositions).forEach((id) => {
      if (!validIds.has(id)) {
        delete currentPositions[id];
      }
    });
  }

  // 4. Mapear mesas preexistentes en la zona (excluyendo hijas en creación)
  const creadasIds = new Set(mesasCreadas.map((m) => m._id));
  const otherTables: Array<{ id: string; x: number; y: number; unitsX: number; unitsY: number }> = [];
  Object.entries(currentPositions).forEach(([id, coords]) => {
    if (id === mesaOriginal._id || creadasIds.has(id)) return;
    const mesaObj = allMesas?.find((m) => m._id === id);
    const mesaZona = mesaObj?.ubicacion?.trim() || zona;
    if (mesaZona !== zona) return;
    const dims = mesaObj ? getMesaGridUnits(mesaObj) : { unitsX: 1, unitsY: 1 };
    otherTables.push({ id, x: coords.x, y: coords.y, unitsX: dims.unitsX, unitsY: dims.unitsY });
  });

  // Lista para rastrear posiciones asignadas a las mesas hijas
  const assignedDaughters: Array<{ id: string; x: number; y: number; unitsX: number; unitsY: number }> = [];

  // Función de comprobación de validez estricta para una mesa hija
  const isValidDaughterCell = (
    x: number,
    y: number,
    unitsX: number,
    unitsY: number,
    requireMarginWithOthers: boolean = false
  ): boolean => {
    if (x < 0 || x > GRID_SIZE - unitsX || y < 0 || y > GRID_SIZE - unitsY) {
      return false;
    }

    // Ninguna celda de la mesa puede ser pared/vacío
    for (let dx = 0; dx < unitsX; dx++) {
      for (let dy = 0; dy < unitsY; dy++) {
        const tileKey = `${zona}_${x + dx}_${y + dy}`;
        if (currentLayout[tileKey] === 'wall') {
          return false;
        }
      }
    }

    // REGLA CRÍTICA DE SEPARACIÓN: Guardar al menos un cuadro de separación libre
    // (exactamente un tile de separación) respecto a cualquier otra mesa hija ya ubicada
    for (const d of assignedDaughters) {
      const overlapX = x < d.x + d.unitsX + 1 && x + unitsX > d.x - 1;
      const overlapY = y < d.y + d.unitsY + 1 && y + unitsY > d.y - 1;
      if (overlapX && overlapY) {
        return false;
      }
    }

    // Comprobación con mesas preexistentes
    for (const other of otherTables) {
      if (requireMarginWithOthers) {
        const overlapX = x < other.x + other.unitsX + 1 && x + unitsX > other.x - 1;
        const overlapY = y < other.y + other.unitsY + 1 && y + unitsY > other.y - 1;
        if (overlapX && overlapY) return false;
      } else {
        const overlapX = x < other.x + other.unitsX && x + unitsX > other.x;
        const overlapY = y < other.y + other.unitsY && y + unitsY > other.y;
        if (overlapX && overlapY) return false;
      }
    }

    return true;
  };

  // 6. Asignar posiciones dejando exactamente un cuadro de separación entre hijas
  mesasCreadas.forEach((mesaNueva, index) => {
    const { unitsX, unitsY } = getMesaGridUnits(mesaNueva);
    let assignedCoord: { x: number; y: number } | null = null;

    // Prioridad 0: Si la mesa hija tiene una posición histórica registrada (donde estaba originalmente),
    // y esa celda está libre y válida, RESTAURARLA A SU POSICIÓN ORIGINAL EXACTA.
    const origKey = getMesaStorageKey(mesaNueva.ubicacion || zona, mesaNueva.numero);
    const historicalCoord = savedOriginals[origKey] || savedOriginals[mesaNueva._id];

    if (
      historicalCoord &&
      typeof historicalCoord.x === 'number' &&
      typeof historicalCoord.y === 'number' &&
      isValidDaughterCell(historicalCoord.x, historicalCoord.y, unitsX, unitsY, false)
    ) {
      assignedCoord = { x: historicalCoord.x, y: historicalCoord.y };
    }

    // Prioridad 1: Despliegue lineal horizontal con salto de 2 baldosas (deja 1 celda vacía en medio)
    // ej. índice 0 -> (baseCoord.x, baseCoord.y)
    // ej. índice 1 -> (baseCoord.x + 2, baseCoord.y) [baseCoord.x + 1 queda libre]
    // ej. índice 2 -> (baseCoord.x + 4, baseCoord.y) [baseCoord.x + 3 queda libre]
    const linX = baseCoord.x + index * 2;
    const linY = baseCoord.y;
    if (isValidDaughterCell(linX, linY, unitsX, unitsY, true)) {
      assignedCoord = { x: linX, y: linY };
    }

    // Prioridad 2: Despliegue en matriz con separación de 2 baldosas en X e Y
    if (!assignedCoord) {
      const offsetsConSalto = [
        { dx: index * 2, dy: 0 },
        { dx: (index % 2) * 2, dy: Math.floor(index / 2) * 2 },
        { dx: 0, dy: index * 2 },
        { dx: index * 2, dy: 2 },
        { dx: index * 2, dy: -2 },
        { dx: 2, dy: index * 2 },
        { dx: -2, dy: index * 2 },
        { dx: -index * 2, dy: 0 },
        { dx: 0, dy: -index * 2 },
      ];

      for (const off of offsetsConSalto) {
        const candX = baseCoord.x + off.dx;
        const candY = baseCoord.y + off.dy;
        if (isValidDaughterCell(candX, candY, unitsX, unitsY, true)) {
          assignedCoord = { x: candX, y: candY };
          break;
        }
      }
    }

    // Prioridad 3: Búsqueda concéntrica alrededor de baseCoord con resguardo respecto a existentes
    if (!assignedCoord) {
      let bestDist = Infinity;
      for (let y = 1; y <= GRID_SIZE - unitsY; y++) {
        for (let x = 1; x <= GRID_SIZE - unitsX; x++) {
          if (isValidDaughterCell(x, y, unitsX, unitsY, true)) {
            const dist = Math.abs(x - baseCoord.x) + Math.abs(y - baseCoord.y);
            if (dist < bestDist) {
              bestDist = dist;
              assignedCoord = { x, y };
            }
          }
        }
      }
    }

    // Prioridad 4: Si el salón está muy lleno, mantener separación estricta entre hijas y evitar colisión directa
    if (!assignedCoord) {
      let bestDist = Infinity;
      for (let y = 0; y <= GRID_SIZE - unitsY; y++) {
        for (let x = 0; x <= GRID_SIZE - unitsX; x++) {
          if (isValidDaughterCell(x, y, unitsX, unitsY, false)) {
            const dist = Math.abs(x - baseCoord.x) + Math.abs(y - baseCoord.y);
            if (dist < bestDist) {
              bestDist = dist;
              assignedCoord = { x, y };
            }
          }
        }
      }
    }

    // Fallback defensivo que garantiza que nunca compartan coordenadas
    if (!assignedCoord) {
      assignedCoord = {
        x: Math.max(0, Math.min(baseCoord.x + index * 2, GRID_SIZE - unitsX)),
        y: baseCoord.y,
      };
    }

    assignedDaughters.push({
      id: mesaNueva._id,
      x: assignedCoord.x,
      y: assignedCoord.y,
      unitsX,
      unitsY,
    });
    currentPositions[mesaNueva._id] = assignedCoord;
  });

  // 7. Persistir en localStorage
  try {
    localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(currentPositions));
  } catch (e) {
    console.error('Error guardando tablePositions tras desunir', e);
  }

  // 8. Notificar a oyentes activos
  window.dispatchEvent(
    new CustomEvent('tablePositionsUpdated', { detail: currentPositions })
  );

  return currentPositions;
}

/**
 * Actualiza las coordenadas al unir mesas:
 * - Ubica la nueva mesa unida respetando al menos un cuadro (1 celda de baldosa)
 *   de distancia libre respecto a las mesas vecinas, evitando colisiones visuales.
 * - Purga todos los IDs de las mesas eliminadas de tablePositions.
 */
export function actualizarPosicionesAlUnir(
  mesasEliminadasIds: string[],
  mesaNueva: Mesa,
  allMesas?: Mesa[]
): TablePositions {
  if (typeof window === 'undefined') return {};

  let currentPositions: TablePositions = {};
  let currentLayout: MapLayout = {};
  let savedOriginals: TablePositions = {};

  try {
    const savedPos = localStorage.getItem(STORAGE_POSITIONS_KEY);
    if (savedPos) currentPositions = JSON.parse(savedPos);
  } catch {
    currentPositions = {};
  }

  try {
    const savedLayout = localStorage.getItem(STORAGE_LAYOUT_KEY);
    if (savedLayout) currentLayout = JSON.parse(savedLayout);
  } catch {
    currentLayout = {};
  }

  try {
    const savedOrig = localStorage.getItem(STORAGE_ORIGINAL_POSITIONS_KEY);
    if (savedOrig) savedOriginals = JSON.parse(savedOrig);
  } catch {
    savedOriginals = {};
  }

  const zona = mesaNueva.ubicacion?.trim() || 'Salón Principal';
  const { unitsX, unitsY } = getMesaGridUnits(mesaNueva);

  // Tomar la coordenada de la primera mesa eliminada como punto de partida
  let baseCoord = { x: 3, y: 3 };
  for (const id of mesasEliminadasIds) {
    if (currentPositions[id]) {
      baseCoord = currentPositions[id];
      break;
    }
  }

  // Guardar en el historial de posiciones originales antes de purgar
  mesasEliminadasIds.forEach((id) => {
    const coord = currentPositions[id];
    if (coord) {
      const mesaObj = allMesas?.find((m) => m._id === id);
      if (mesaObj) {
        const key = getMesaStorageKey(mesaObj.ubicacion || zona, mesaObj.numero);
        savedOriginals[key] = { x: coord.x, y: coord.y };
      }
      savedOriginals[id] = { x: coord.x, y: coord.y };
    }
    delete currentPositions[id];
  });

  try {
    localStorage.setItem(STORAGE_ORIGINAL_POSITIONS_KEY, JSON.stringify(savedOriginals));
  } catch {
    // Noop
  }

  // Mapear todas las demás mesas activas de esta zona
  const otherTables: Array<{ id: string; x: number; y: number; unitsX: number; unitsY: number }> = [];
  Object.entries(currentPositions).forEach(([id, coords]) => {
    if (id === mesaNueva._id) return;
    const mesaObj = allMesas?.find((m) => m._id === id);
    const mesaZona = mesaObj?.ubicacion?.trim() || zona;
    if (mesaZona !== zona) return;
    const dims = mesaObj ? getMesaGridUnits(mesaObj) : { unitsX: 1, unitsY: 1 };
    otherTables.push({ id, x: coords.x, y: coords.y, unitsX: dims.unitsX, unitsY: dims.unitsY });
  });

  // Función de verificación de posición
  const isValidMergedPosition = (x: number, y: number, withClearance: boolean): boolean => {
    if (x < 0 || x > GRID_SIZE - unitsX || y < 0 || y > GRID_SIZE - unitsY) {
      return false;
    }

    for (let dx = 0; dx < unitsX; dx++) {
      for (let dy = 0; dy < unitsY; dy++) {
        const tileKey = `${zona}_${x + dx}_${y + dy}`;
        if (currentLayout[tileKey] === 'wall') {
          return false;
        }
      }
    }

    for (const other of otherTables) {
      if (withClearance) {
        // Al menos 1 cuadro de separación libre en todos los costados
        const overlapX = x < other.x + other.unitsX + 1 && x + unitsX > other.x - 1;
        const overlapY = y < other.y + other.unitsY + 1 && y + unitsY > other.y - 1;
        if (overlapX && overlapY) return false;
      } else {
        const overlapX = x < other.x + other.unitsX && x + unitsX > other.x;
        const overlapY = y < other.y + other.unitsY && y + unitsY > other.y;
        if (overlapX && overlapY) return false;
      }
    }

    return true;
  };

  // 4. Ubicar la nueva mesa unida guardando al menos 1 baldosa de resguardo
  let chosenCoord: { x: number; y: number } | null = null;

  // A. Coordenada base si ya tiene al menos 1 baldosa de distancia con las vecinas
  if (isValidMergedPosition(baseCoord.x, baseCoord.y, true)) {
    chosenCoord = { ...baseCoord };
  }

  // B. Búsqueda concéntrica más cercana con 1 baldosa libre de distancia
  if (!chosenCoord) {
    let bestDist = Infinity;
    for (let y = 1; y <= GRID_SIZE - unitsY; y++) {
      for (let x = 1; x <= GRID_SIZE - unitsX; x++) {
        if (isValidMergedPosition(x, y, true)) {
          const dist = Math.abs(x - baseCoord.x) + Math.abs(y - baseCoord.y);
          if (dist < bestDist) {
            bestDist = dist;
            chosenCoord = { x, y };
          }
        }
      }
    }
  }

  // C. Fallback sin colisión directa si no hay espacio con resguardo perimetral completo
  if (!chosenCoord) {
    if (isValidMergedPosition(baseCoord.x, baseCoord.y, false)) {
      chosenCoord = { ...baseCoord };
    } else {
      let bestDist = Infinity;
      for (let y = 0; y <= GRID_SIZE - unitsY; y++) {
        for (let x = 0; x <= GRID_SIZE - unitsX; x++) {
          if (isValidMergedPosition(x, y, false)) {
            const dist = Math.abs(x - baseCoord.x) + Math.abs(y - baseCoord.y);
            if (dist < bestDist) {
              bestDist = dist;
              chosenCoord = { x, y };
            }
          }
        }
      }
    }
  }

  if (!chosenCoord) {
    chosenCoord = {
      x: Math.max(0, Math.min(baseCoord.x, GRID_SIZE - unitsX)),
      y: Math.max(0, Math.min(baseCoord.y, GRID_SIZE - unitsY)),
    };
  }

  // Asignar posición a la mesa nueva unida
  currentPositions[mesaNueva._id] = chosenCoord;

  try {
    localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(currentPositions));
  } catch (e) {
    console.error('Error guardando tablePositions tras unir', e);
  }

  window.dispatchEvent(
    new CustomEvent('tablePositionsUpdated', { detail: currentPositions })
  );

  return currentPositions;
}

/**
 * Purga el ID de una mesa eliminada de tablePositions en localStorage
 */
export function purgarPosicionMesa(mesaId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const savedPos = localStorage.getItem(STORAGE_POSITIONS_KEY);
    if (savedPos) {
      const positions: TablePositions = JSON.parse(savedPos);
      delete positions[mesaId];
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(positions));
      window.dispatchEvent(
        new CustomEvent('tablePositionsUpdated', { detail: positions })
      );
    }
  } catch (e) {
    console.error('Error purgando posición de mesa', e);
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
      onPointerDown={(e) => {
        onPointerDown(e, zonaNombre, x, y, isWall);
      }}
      onPointerEnter={(e) => onPointerEnter(e, zonaNombre, x, y)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e, zonaNombre, x, y, isWall);
      }}
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
  onDesunirMesa?: (mesa: Mesa) => void;
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
  onDesunirMesa,
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

  useEffect(() => {
    const handleResize = () => {
      centerViewport();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerViewport]);

  const count = zona.mesas.length;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800/80 bg-stone-900/5 dark:bg-black/30 p-3 sm:p-5 lg:p-6 overflow-hidden relative shadow-sm w-full">
      {/* Encabezado de la Zona */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2 border-b border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
            {zona.nombre}
          </h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            ({count} {count === 1 ? 'mesa' : 'mesas'})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {/* CONTENEDOR VIEWPORT SCROLLABLE ADAPTATIVO */}
      <div
        ref={viewportRef}
        className="w-full h-[460px] sm:h-[580px] lg:h-[660px] overflow-auto relative rounded-xl sm:rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-950/20 dark:bg-black/50 shadow-inner scroll-smooth touch-pan-x touch-pan-y"
      >
        {/* HUD FLOTANTE SUPERIOR IZQUIERDO */}
        <div className="sticky top-2 sm:top-4 left-2 sm:left-4 z-50 pointer-events-auto inline-block max-w-[calc(100vw-3rem)] sm:max-w-sm">
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-stone-900/90 dark:bg-stone-900/95 border border-stone-700/80 text-stone-100 shadow-2xl backdrop-blur-md space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 border-b border-stone-700/60 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-200">
                {isEditMode ? (
                  <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className="truncate">{isEditMode ? 'Editor de Plano (Tilemap)' : 'Plano 3D Isométrico'}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono shrink-0">
                {GRID_SIZE}x{GRID_SIZE}
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
          className="min-w-[1100px] sm:min-w-[1400px] lg:min-w-[1600px] min-h-[900px] sm:min-h-[1200px] lg:min-h-[1350px] p-6 sm:p-14 lg:p-20 flex items-center justify-center select-none pointer-events-none"
          style={{
            perspective: '2500px',
            perspectiveOrigin: 'center center',
          }}
        >
          {/* ENVOLTORIO ADAPTATIVO CON ESCALA SUAVE EN PANTALLAS PEQUEÑAS */}
          <div
            className="transform scale-[0.80] sm:scale-90 md:scale-95 lg:scale-100 origin-center transition-transform duration-300 pointer-events-none"
            style={{ transformStyle: 'preserve-3d' }}
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

              // Anclaje estricto al origen (top-left) de la baldosa asignada.
              // La mesa crece naturalmente hacia la derecha (+X) sin invadir la baldosa anterior a la izquierda.
              const posX = pos.x * TILE_SIZE;
              const posY = pos.y * TILE_SIZE;

              return (
                <div
                  key={`mesa-3d-node-${mesa._id}`}
                  className="absolute transition-all duration-300 ease-out pointer-events-auto"
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transformStyle: 'preserve-3d',
                    zIndex: isSelected ? 50 : 10 + (pos.x + pos.y),
                  }}
                >
                  <Mesa3D
                    mesa={mesa}
                    isEditMode={isEditMode}
                    isSelected={isSelected}
                    x={pos.x}
                    y={pos.y}
                    onClick={() => onTableClick(mesa)}
                    onDesunirMesa={onDesunirMesa}
                  />
                </div>
              );
            })}
          </div>
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
  onDesunirMesa,
  className = '',
  isEditMode: isEditModeProp,
  isAdmin = false,
}: MapaIsometricoProps) {
  // Soporte de modo edición tanto controlado por prop como interno
  const [internalEditMode, setInternalEditMode] = useState<boolean>(false);
  // RBAC: el Modo Edición queda forzado a desactivado si el usuario no es administrador,
  // ignorando cualquier bandera/estado interno o externo que intente activarlo.
  const isEditMode =
    isAdmin && (isEditModeProp !== undefined ? isEditModeProp : internalEditMode);

  // Agrupar mesas por ubicación física (ej. "Interior", "Terraza", "Salón Principal")
  const zonas: ZonaData[] = useMemo(() => {
    const mapa = new Map<string, { nombre: string; mesas: Mesa[] }>();
    const seenMesaIds = new Set<string>();

    mesas.forEach((m) => {
      if (!m || !m._id || seenMesaIds.has(m._id)) return;
      seenMesaIds.add(m._id);

      const raw = (m.ubicacion || '').trim();
      const displayName = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Salón Principal';
      const canonicalKey = displayName.toLowerCase();

      if (!mapa.has(canonicalKey)) {
        mapa.set(canonicalKey, { nombre: displayName, mesas: [] });
      }
      mapa.get(canonicalKey)!.mesas.push(m);
    });

    const result: ZonaData[] = [];
    const seenNames = new Set<string>();

    mapa.forEach((item) => {
      const normalized = item.nombre.trim();
      const normKey = normalized.toLowerCase();
      if (!seenNames.has(normKey)) {
        seenNames.add(normKey);
        result.push({
          nombre: normalized,
          mesas: item.mesas.sort((a, b) =>
            a.numero.localeCompare(b.numero, undefined, { numeric: true })
          ),
        });
      }
    });

    return result;
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
  const gestureToggledTilesRef = useRef<Set<string>>(new Set());

  // Listener global para cancelar arrastre
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isDrawingRef.current = false;
      gestureToggledTilesRef.current.clear();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Sincronizar tablePositions cuando se emita el evento global de actualización
  useEffect(() => {
    const handlePositionsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<TablePositions>;
      if (customEvent.detail) {
        setTablePositions({ ...customEvent.detail });
      } else {
        const saved = localStorage.getItem(STORAGE_POSITIONS_KEY);
        if (saved) {
          try {
            setTablePositions(JSON.parse(saved));
          } catch {
            // ignore
          }
        }
      }
    };
    window.addEventListener('tablePositionsUpdated', handlePositionsUpdate);
    return () => {
      window.removeEventListener('tablePositionsUpdated', handlePositionsUpdate);
    };
  }, []);

  // Asignación de coordenadas calculada para mesas que no tienen posición guardada
  const effectiveTablePositions = useMemo(() => {
    const result: TablePositions = { ...tablePositions };
    const occupiedTiles = new Set<string>();

    let savedOriginals: TablePositions = {};
    try {
      const saved = localStorage.getItem(STORAGE_ORIGINAL_POSITIONS_KEY);
      if (saved) savedOriginals = JSON.parse(saved);
    } catch {
      savedOriginals = {};
    }

    // Registrar baldosas ya ocupadas y purgar mesas huérfanas
    Object.entries(result).forEach(([mesaId, coords]) => {
      const mesaObj = mesas.find((m) => m._id === mesaId);
      if (!mesaObj) {
        delete result[mesaId];
        return;
      }
      const zona = mesaObj.ubicacion?.trim() || 'Salón Principal';
      const { unitsX, unitsY } = getMesaGridUnits(mesaObj);
      for (let dx = 0; dx < unitsX; dx++) {
        for (let dy = 0; dy < unitsY; dy++) {
          occupiedTiles.add(`${zona}_${coords.x + dx}_${coords.y + dy}`);
        }
      }
    });

    zonas.forEach((zona) => {
      zona.mesas.forEach((mesa) => {
        const currentCoord = result[mesa._id];
        const { unitsX, unitsY } = getMesaGridUnits(mesa);
        if (
          !currentCoord ||
          typeof currentCoord.x !== 'number' ||
          typeof currentCoord.y !== 'number' ||
          currentCoord.x < 0 ||
          currentCoord.x > GRID_SIZE - unitsX ||
          currentCoord.y < 0 ||
          currentCoord.y > GRID_SIZE - unitsY
        ) {
          let assigned = false;

          // Prioridad A: Comprobar si tiene una posición histórica guardada
          const origKey = getMesaStorageKey(zona.nombre, mesa.numero);
          const savedOrig = savedOriginals[origKey] || savedOriginals[mesa._id];
          if (
            savedOrig &&
            typeof savedOrig.x === 'number' &&
            typeof savedOrig.y === 'number' &&
            savedOrig.x >= 0 &&
            savedOrig.x <= GRID_SIZE - unitsX &&
            savedOrig.y >= 0 &&
            savedOrig.y <= GRID_SIZE - unitsY
          ) {
            let canFit = true;
            for (let dx = 0; dx < unitsX && canFit; dx++) {
              for (let dy = 0; dy < unitsY && canFit; dy++) {
                const tileKey = `${zona.nombre}_${savedOrig.x + dx}_${savedOrig.y + dy}`;
                if (mapLayout[tileKey] === 'wall' || occupiedTiles.has(tileKey)) {
                  canFit = false;
                }
              }
            }
            if (canFit) {
              result[mesa._id] = { x: savedOrig.x, y: savedOrig.y };
              for (let dx = 0; dx < unitsX; dx++) {
                for (let dy = 0; dy < unitsY; dy++) {
                  occupiedTiles.add(`${zona.nombre}_${savedOrig.x + dx}_${savedOrig.y + dy}`);
                }
              }
              assigned = true;
            }
          }

          const stepX = unitsX + 1;
          const stepY = unitsY + 1;

          // Asignar en el interior del plano evitando las orillas
          for (let y = 2; y <= GRID_SIZE - unitsY - 2 && !assigned; y += stepY) {
            for (let x = 2; x <= GRID_SIZE - unitsX - 2 && !assigned; x += stepX) {
              let canFit = true;
              for (let dx = 0; dx < unitsX && canFit; dx++) {
                for (let dy = 0; dy < unitsY && canFit; dy++) {
                  const tileKey = `${zona.nombre}_${x + dx}_${y + dy}`;
                  if (mapLayout[tileKey] === 'wall' || occupiedTiles.has(tileKey)) {
                    canFit = false;
                  }
                }
              }

              if (canFit) {
                result[mesa._id] = { x, y };
                for (let dx = 0; dx < unitsX; dx++) {
                  for (let dy = 0; dy < unitsY; dy++) {
                    occupiedTiles.add(`${zona.nombre}_${x + dx}_${y + dy}`);
                  }
                }
                assigned = true;
              }
            }
          }

          // Si el centro está ocupado, buscar en cualquier celda libre
          if (!assigned) {
            for (let y = 1; y <= GRID_SIZE - unitsY && !assigned; y++) {
              for (let x = 1; x <= GRID_SIZE - unitsX && !assigned; x++) {
                let canFit = true;
                for (let dx = 0; dx < unitsX && canFit; dx++) {
                  for (let dy = 0; dy < unitsY && canFit; dy++) {
                    const tileKey = `${zona.nombre}_${x + dx}_${y + dy}`;
                    if (mapLayout[tileKey] === 'wall' || occupiedTiles.has(tileKey)) {
                      canFit = false;
                    }
                  }
                }

                if (canFit) {
                  result[mesa._id] = { x, y };
                  for (let dx = 0; dx < unitsX; dx++) {
                    for (let dy = 0; dy < unitsY; dy++) {
                      occupiedTiles.add(`${zona.nombre}_${x + dx}_${y + dy}`);
                    }
                  }
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

  // Serializaciones estables para dependencias de hooks sin disparar desalineaciones
  const serializedPositions = useMemo(
    () => JSON.stringify(effectiveTablePositions),
    [effectiveTablePositions]
  );
  const serializedMesas = useMemo(
    () => JSON.stringify(mesas.map((m) => `${m._id}:${m.ubicacion}:${m.numero}`)),
    [mesas]
  );

  // Sincronización en localStorage con arreglo de dependencias de tamaño y orden estrictamente fijos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(effectiveTablePositions));
      const saved = localStorage.getItem(STORAGE_ORIGINAL_POSITIONS_KEY);
      const origs = saved ? JSON.parse(saved) : {};
      mesas.forEach((m) => {
        const pos = effectiveTablePositions[m._id];
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
          const key = getMesaStorageKey(m.ubicacion || '', m.numero);
          origs[key] = { x: pos.x, y: pos.y };
          origs[m._id] = { x: pos.x, y: pos.y };
        }
      });
      localStorage.setItem(STORAGE_ORIGINAL_POSITIONS_KEY, JSON.stringify(origs));
    } catch (e) {
      console.error('Error guardando tablePositions en localStorage', e);
    }
  }, [serializedPositions, serializedMesas, effectiveTablePositions, mesas]);

  // Clic en baldosa:
  // - Si hay mesa seleccionada y se hace clic en suelo válido: reubicar la mesa inmediatamente,
  //   actualizar tablePositions, guardar en localStorage, despachar evento y limpiar selección.
  // - Si NO hay mesa seleccionada: alternar baldosa (Suelo <-> Vacío) SOLO si SHIFT está presionado.
  //   Si no hay Shift, no hacer absolutamente nada para evitar borrado accidental.
  const handleTileClick = useCallback(
    (e: React.MouseEvent, zona: string, x: number, y: number, isWall: boolean) => {
      if (!isAdmin) return;
      if (!isEditMode) return;

      // 1. REUBICACIÓN INMEDIATA DE MESA SELECCIONADA EN MODO EDICIÓN
      if (selectedTableId) {
        // No colocar la mesa sobre el vacío o paredes
        if (isWall) return;

        const selectedMesa = mesas.find((m) => m._id === selectedTableId);
        const { unitsX, unitsY } = selectedMesa
          ? getMesaGridUnits(selectedMesa)
          : { unitsX: 1, unitsY: 1 };

        // Anclar respetando los límites del lienzo (sin permitir desborde)
        const clampedX = Math.max(0, Math.min(x, GRID_SIZE - unitsX));
        const clampedY = Math.max(0, Math.min(y, GRID_SIZE - unitsY));

        const updatedPositions: TablePositions = {
          ...effectiveTablePositions,
          ...tablePositions,
          [selectedTableId]: { x: clampedX, y: clampedY },
        };

        // 1. Actualizar estado local
        setTablePositions(updatedPositions);

        // 2. Guardar inmediatamente en localStorage
        try {
          localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(updatedPositions));
          if (selectedMesa) {
            const saved = localStorage.getItem(STORAGE_ORIGINAL_POSITIONS_KEY);
            const origs = saved ? JSON.parse(saved) : {};
            const key = getMesaStorageKey(selectedMesa.ubicacion || zona, selectedMesa.numero);
            origs[key] = { x: clampedX, y: clampedY };
            origs[selectedTableId] = { x: clampedX, y: clampedY };
            localStorage.setItem(STORAGE_ORIGINAL_POSITIONS_KEY, JSON.stringify(origs));
          }
        } catch (err) {
          console.error('Error guardando tablePositions en localStorage', err);
        }

        // 3. Notificar globalmente para mantener sincronizados todos los componentes
        window.dispatchEvent(
          new CustomEvent('tablePositionsUpdated', { detail: updatedPositions })
        );

        // 4. Limpiar selección
        setSelectedTableId(null);
        return;
      }

      // 2. EDICIÓN DE BALDOSAS: Requiere estrictamente SHIFT presionado
      if (!e.shiftKey) {
        return; // Sin Shift no se altera nada, evitando accidentes
      }

      // Si la baldosa ya fue alternada en el evento pointerdown del mismo gesto, no duplicar
      const key = `${zona}_${x}_${y}`;
      if (gestureToggledTilesRef.current.has(key)) {
        return;
      }
      gestureToggledTilesRef.current.add(key);

      const nextType: TileType = isWall ? 'floor' : 'wall';
      setMapLayout((prev) => ({
        ...prev,
        [key]: nextType,
      }));
    },
    [isAdmin, isEditMode, selectedTableId, effectiveTablePositions, tablePositions, mesas]
  );

  // Arrastre continuo protegido: SOLO se activa si SHIFT está presionado
  const handleTilePointerDown = useCallback(
    (e: React.PointerEvent, zona: string, x: number, y: number, isWall: boolean) => {
      if (!isAdmin) return;
      if (!isEditMode) return;

      if (e.shiftKey && e.button === 0) {
        e.stopPropagation();
        gestureToggledTilesRef.current.clear();

        const targetMode: 'add' | 'remove' = isWall ? 'add' : 'remove';
        isDrawingRef.current = true;
        drawModeRef.current = targetMode;

        const key = `${zona}_${x}_${y}`;
        gestureToggledTilesRef.current.add(key);

        const nextType: TileType = targetMode === 'add' ? 'floor' : 'wall';
        setMapLayout((prev) => {
          if (prev[key] === nextType) return prev;
          return { ...prev, [key]: nextType };
        });
      }
    },
    [isAdmin, isEditMode]
  );

  const handleTilePointerEnter = useCallback(
    (e: React.PointerEvent, zona: string, x: number, y: number) => {
      if (!isAdmin) return;
      if (!isEditMode) return;

      // El arrastre continuo requiere estrictamente isDrawingRef Y Shift
      if (isDrawingRef.current && e.shiftKey && e.buttons === 1) {
        const key = `${zona}_${x}_${y}`;
        if (gestureToggledTilesRef.current.has(key)) return;
        gestureToggledTilesRef.current.add(key);

        const nextType: TileType = drawModeRef.current === 'add' ? 'floor' : 'wall';
        setMapLayout((prev) => {
          if (prev[key] === nextType) return prev;
          return { ...prev, [key]: nextType };
        });
      }
    },
    [isAdmin, isEditMode]
  );

  // Clic en mesa
  const handleTableClick = useCallback(
    (mesa: Mesa) => {
      if (isAdmin && isEditMode) {
        // En modo edición (solo administrador): seleccionar o deseleccionar mesa
        setSelectedTableId((prev) => (prev === mesa._id ? null : mesa._id));
      } else {
        // En modo vista: abrir comanda
        onMesaClick?.(mesa);
      }
    },
    [isAdmin, isEditMode, onMesaClick]
  );

  // Restablecer todas las baldosas de la zona a suelo completo
  const handleResetZoneLayout = useCallback((zonaNombre: string) => {
    if (!isAdmin) return;
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
  }, [isAdmin]);

  const handleCancelSelection = useCallback(() => {
    setSelectedTableId(null);
  }, []);

  const zonasFiltradas = useMemo(() => {
    if (zonaActiva === 'todas') {
      const seen = new Set<string>();
      return zonas.filter((z) => {
        const key = z.nombre.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    const activaLower = zonaActiva.toLowerCase().trim();
    return zonas.filter((z) => z.nombre.toLowerCase().trim() === activaLower);
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
          {/* Botón interactivo para alternar Modo Edición (exclusivo de administradores) */}
          {isAdmin && (
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
          )}

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
              {zonas.map((z, idx) => (
                <button
                  key={`zona-tab-${z.nombre.toLowerCase().trim()}-${idx}`}
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
        zonasFiltradas.map((zona, index) => (
          <ZonaViewport
            key={`zona-viewport-${zona.nombre.toLowerCase().trim()}-${index}`}
            zona={zona}
            isEditMode={isEditMode}
            selectedTableId={selectedTableId}
            mapLayout={mapLayout}
            effectiveTablePositions={effectiveTablePositions}
            mesaSeleccionadaObj={mesaSeleccionadaObj}
            onTableClick={handleTableClick}
            onDesunirMesa={onDesunirMesa}
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
