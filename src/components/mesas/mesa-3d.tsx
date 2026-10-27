'use client';

import React, { useState, useMemo } from 'react';
import { Mesa, EstadoMesa } from '@/types';
import { Users, Move, Unlink } from 'lucide-react';

export interface Mesa3DProps {
  mesa: Mesa;
  onClick?: (mesa: Mesa) => void;
  onDesunirMesa?: (mesa: Mesa) => void;
  className?: string;
  isProcessing?: boolean;
  isEditMode?: boolean;
  isSelected?: boolean;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
}

interface SillaProps {
  orientation: 'top' | 'bottom' | 'left' | 'right';
  style?: React.CSSProperties;
}

/**
 * Sub-componente Silla3D: Silla volumétrica con relieve tridimensional y mobiliario realista.
 * - Sombra de contacto direccional sobre el suelo (translateZ 0.5px).
 * - 4 patas de soporte ancladas firmemente al suelo (translateZ 1px).
 * - Asiento volumétrico con grosor visible (plataforma + tapizado acolchado con translateZ).
 * - Respaldo curvado (rounded-t-lg, etc.) inclinado ergonómicamente hacia atrás (rotateX / rotateY).
 */
function Silla3D({ orientation, style }: SillaProps) {
  const getRespaldoConfig = (): { style: React.CSSProperties; className: string } => {
    switch (orientation) {
      case 'top':
        return {
          style: {
            top: '-5px',
            left: '1px',
            right: '1px',
            height: '11px',
            transformOrigin: 'bottom center',
            transform: 'rotateX(-28deg)',
          },
          className:
            'rounded-t-lg bg-gradient-to-b from-stone-300 via-stone-400 to-stone-500 border border-stone-500/90 border-t-white/70 shadow-sm',
        };
      case 'bottom':
        return {
          style: {
            bottom: '-5px',
            left: '1px',
            right: '1px',
            height: '11px',
            transformOrigin: 'top center',
            transform: 'rotateX(28deg)',
          },
          className:
            'rounded-b-lg bg-gradient-to-t from-stone-300 via-stone-400 to-stone-500 border border-stone-500/90 border-b-white/70 shadow-sm',
        };
      case 'left':
        return {
          style: {
            left: '-5px',
            top: '1px',
            bottom: '1px',
            width: '11px',
            transformOrigin: 'right center',
            transform: 'rotateY(28deg)',
          },
          className:
            'rounded-l-lg bg-gradient-to-r from-stone-300 via-stone-400 to-stone-500 border border-stone-500/90 border-l-white/70 shadow-sm',
        };
      case 'right':
        return {
          style: {
            right: '-5px',
            top: '1px',
            bottom: '1px',
            width: '11px',
            transformOrigin: 'left center',
            transform: 'rotateY(-28deg)',
          },
          className:
            'rounded-r-lg bg-gradient-to-l from-stone-300 via-stone-400 to-stone-500 border border-stone-500/90 border-r-white/70 shadow-sm',
        };
    }
  };

  const respaldo = getRespaldoConfig();

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...style,
        width: '16px',
        height: '16px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Sombra de oclusión proyectada directamente sobre la superficie del suelo */}
      <div
        className="absolute inset-0 bg-black/55 rounded-sm blur-[1.5px]"
        style={{ transform: 'translateZ(0.5px)' }}
      />

      {/* Patas de la silla ancladas al suelo para evitar efecto flotante */}
      <div
        className="absolute top-0.5 left-0.5 w-[2px] h-[2px] bg-stone-800 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />
      <div
        className="absolute top-0.5 right-0.5 w-[2px] h-[2px] bg-stone-800 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />
      <div
        className="absolute bottom-0.5 left-0.5 w-[2px] h-[2px] bg-stone-800 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />
      <div
        className="absolute bottom-0.5 right-0.5 w-[2px] h-[2px] bg-stone-800 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />

      {/* Base inferior del asiento con grosor volumétrico */}
      <div
        className="absolute inset-0.5 bg-stone-500 rounded-xs border border-stone-600/90 shadow-xs"
        style={{
          transform: 'translateZ(3.5px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Tapa acolchada del asiento con elevación y relieve luminoso */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400 dark:from-stone-600 dark:via-stone-700 dark:to-stone-800 rounded-xs border-t border-white/60 shadow-inner"
          style={{
            transform: 'translateZ(2.5px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Respaldo volumétrico ergonómicamente inclinado */}
          <div
            className={`absolute ${respaldo.className}`}
            style={{
              ...respaldo.style,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Ranura sutil de tapicería */}
            <div className="absolute inset-0.5 opacity-25 border-t border-black/30 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Configuración de colores tridimensionales según el estado de la mesa */
interface ColorScheme3D {
  top: string;
  sideRight: string;
  sideBottom: string;
  glow: string;
  pulsing: boolean;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
}

const COLOR_SCHEMES: Record<EstadoMesa, ColorScheme3D> = {
  Libre: {
    top: 'bg-emerald-600 hover:bg-emerald-500',
    sideRight: 'from-emerald-700 via-emerald-800 to-emerald-950',
    sideBottom: 'from-emerald-800 via-emerald-900 to-stone-950',
    glow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.7)]',
    pulsing: false,
    badgeBg: 'bg-emerald-950/95',
    badgeBorder: 'border-emerald-400/60',
    badgeText: 'text-emerald-100',
    dotColor: 'bg-emerald-400',
  },
  Ocupada: {
    top: 'bg-[#C84B26] hover:bg-[#db5229]',
    sideRight: 'from-[#A83C1A] via-[#8B3014] to-[#5C1F0C]',
    sideBottom: 'from-[#8B3014] via-[#712710] to-stone-950',
    glow: 'hover:shadow-[0_0_24px_rgba(200,75,38,0.7)]',
    pulsing: false,
    badgeBg: 'bg-stone-950/95',
    badgeBorder: 'border-[#C84B26]/70',
    badgeText: 'text-amber-100',
    dotColor: 'bg-[#C84B26]',
  },
  'Cuenta Solicitada': {
    top: 'bg-amber-500 hover:bg-amber-400',
    sideRight: 'from-amber-600 via-amber-700 to-amber-900',
    sideBottom: 'from-amber-700 via-amber-800 to-stone-950',
    glow: 'shadow-[0_0_28px_rgba(245,158,11,0.9)]',
    pulsing: true,
    badgeBg: 'bg-amber-950/95',
    badgeBorder: 'border-amber-400/80',
    badgeText: 'text-amber-100',
    dotColor: 'bg-amber-400',
  },
};

const BLOCK_SIZE = 58;
const BLOCK_STEP = 60;

interface SubBlock {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  nombre?: string;
}

interface ExternalEdge {
  id: string;
  blockCol: number;
  blockRow: number;
  x: number;
  y: number;
  orientation: 'top' | 'bottom' | 'left' | 'right';
}

export function Mesa3D({
  mesa,
  onClick,
  onDesunirMesa,
  className = '',
  isProcessing = false,
  isEditMode = false,
  isSelected = false,
  style,
}: Mesa3DProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Detectar si la mesa es una unión física
  const esUnida = useMemo(() => {
    return (
      mesa.numero.includes('+') ||
      mesa.numero.includes('&') ||
      /\b(?:y|and)\b/i.test(mesa.numero) ||
      /\[(?:cuadrad[ao]|lineal|bloque)\]/i.test(mesa.numero)
    );
  }, [mesa.numero]);

  // Extraer nombres reales de las sub-mesas fusionadas
  const subNombres = useMemo(() => {
    if (!esUnida) return [mesa.numero.replace(/\[.*?\]/g, '').trim()];
    const clean = mesa.numero.replace(/\[.*?\]/g, '').trim();
    const parts = clean
      .split(/\+|\b(?:y|and)\b|&/i)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [clean];
  }, [mesa.numero, esUnida]);

  // Contar cantidad estricta de sub-mesas reales que conforman esta unión
  const mesasCount = useMemo(() => {
    if (!esUnida) return 1;
    return Math.max(2, subNombres.length);
  }, [esUnida, subNombres]);

  // Determinar la forma geométrica: "cuadrada" (bloque/compacta) o "lineal"
  const forma = useMemo<'normal' | 'lineal' | 'cuadrada'>(() => {
    if (!esUnida) return 'normal';
    if (/cuadrad[ao]|bloque/i.test(mesa.numero)) {
      return 'cuadrada';
    }
    return 'lineal';
  }, [esUnida, mesa.numero]);

  // Generación exacta de sub-bloques reales (NUNCA agregar mesas fantasma)
  const { blocks, widthPx, heightPx } = useMemo(() => {
    if (forma === 'normal' || mesasCount <= 1) {
      return {
        blocks: [
          {
            id: 'block-0',
            col: 0,
            row: 0,
            x: 3,
            y: 3,
            nombre: subNombres[0] || mesa.numero.replace(/\[.*?\]/g, '').trim(),
          },
        ],
        widthPx: 64,
        heightPx: 64,
      };
    }

    if (forma === 'lineal') {
      const bList: SubBlock[] = [];
      for (let i = 0; i < mesasCount; i++) {
        bList.push({
          id: `block-${i}`,
          col: i,
          row: 0,
          x: 2 + i * BLOCK_STEP,
          y: 3,
          nombre: subNombres[i] || `Mesa ${i + 1}`,
        });
      }
      return {
        blocks: bList,
        widthPx: mesasCount * BLOCK_STEP + 4,
        heightPx: 64,
      };
    }

    // FORMA BLOQUE / CUADRADA:
    // Renderizado estricto del número exacto de mesas fusionadas.
    let colCount = 2;
    let rowCount = 2;
    const bPositions: Array<{ col: number; row: number }> = [];

    if (mesasCount === 2) {
      colCount = 2;
      rowCount = 1;
      bPositions.push({ col: 0, row: 0 }, { col: 1, row: 0 });
    } else if (mesasCount === 3) {
      // 3 mesas: figura orgánica en L (2x2 con la esquina (1,1) completamente vacía)
      colCount = 2;
      rowCount = 2;
      bPositions.push(
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 1 }
      );
    } else if (mesasCount === 4) {
      // 4 mesas: bloque 2x2 completo
      colCount = 2;
      rowCount = 2;
      bPositions.push(
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 1 },
        { col: 1, row: 1 }
      );
    } else if (mesasCount === 5) {
      // 5 mesas: matriz 3x2 con 5 bloques exactos (3 arriba, 2 abajo; (2,1) vacía)
      colCount = 3;
      rowCount = 2;
      bPositions.push(
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 0, row: 1 },
        { col: 1, row: 1 }
      );
    } else {
      // Generalización para N >= 6: columnas calculadas con ceil(sqrt(N))
      colCount = Math.ceil(Math.sqrt(mesasCount));
      rowCount = Math.ceil(mesasCount / colCount);
      for (let i = 0; i < mesasCount; i++) {
        bPositions.push({
          col: i % colCount,
          row: Math.floor(i / colCount),
        });
      }
    }

    const bList: SubBlock[] = bPositions.map((pos, idx) => ({
      id: `block-${idx}`,
      col: pos.col,
      row: pos.row,
      x: 2 + pos.col * BLOCK_STEP,
      y: 2 + pos.row * BLOCK_STEP,
      nombre: subNombres[idx] || `M${idx + 1}`,
    }));

    return {
      blocks: bList,
      widthPx: colCount * BLOCK_STEP + 4,
      heightPx: rowCount * BLOCK_STEP + 4,
    };
  }, [forma, mesasCount, subNombres, mesa.numero]);

  // Centroide de los bloques reales para anclar el Billboard con precisión
  const { centerX, centerY } = useMemo(() => {
    if (blocks.length === 0) return { centerX: widthPx / 2, centerY: heightPx / 2 };
    const sumX = blocks.reduce((acc, b) => acc + (b.x + BLOCK_SIZE / 2), 0);
    const sumY = blocks.reduce((acc, b) => acc + (b.y + BLOCK_SIZE / 2), 0);
    return {
      centerX: sumX / blocks.length,
      centerY: sumY / blocks.length,
    };
  }, [blocks, widthPx, heightPx]);

  const scheme = COLOR_SCHEMES[mesa.estado] || COLOR_SCHEMES.Libre;
  const tableHeight = 22; // Altura tridimensional del prisma (translateZ)

  // Distribución de sillas únicamente en el perímetro exterior de los bloques reales
  const sillas = useMemo(() => {
    const capacidad = Math.max(1, mesa.capacidad || 2);
    const externalEdges: ExternalEdge[] = [];

    // Determinar qué bordes de cada bloque dan al exterior (sin vecino contiguo)
    blocks.forEach((b) => {
      const hasTop = blocks.some((o) => o.col === b.col && o.row === b.row - 1);
      const hasBottom = blocks.some((o) => o.col === b.col && o.row === b.row + 1);
      const hasLeft = blocks.some((o) => o.col === b.col - 1 && o.row === b.row);
      const hasRight = blocks.some((o) => o.col === b.col + 1 && o.row === b.row);

      if (!hasTop) {
        externalEdges.push({
          id: `edge-${b.id}-top`,
          blockCol: b.col,
          blockRow: b.row,
          x: b.x,
          y: b.y,
          orientation: 'top',
        });
      }
      if (!hasBottom) {
        externalEdges.push({
          id: `edge-${b.id}-bottom`,
          blockCol: b.col,
          blockRow: b.row,
          x: b.x,
          y: b.y,
          orientation: 'bottom',
        });
      }
      if (!hasLeft) {
        externalEdges.push({
          id: `edge-${b.id}-left`,
          blockCol: b.col,
          blockRow: b.row,
          x: b.x,
          y: b.y,
          orientation: 'left',
        });
      }
      if (!hasRight) {
        externalEdges.push({
          id: `edge-${b.id}-right`,
          blockCol: b.col,
          blockRow: b.row,
          x: b.x,
          y: b.y,
          orientation: 'right',
        });
      }
    });

    const result: Array<{
      id: string;
      orientation: 'top' | 'bottom' | 'left' | 'right';
      style: React.CSSProperties;
    }> = [];

    const topEdges = externalEdges.filter((e) => e.orientation === 'top');
    const bottomEdges = externalEdges.filter((e) => e.orientation === 'bottom');
    const leftEdges = externalEdges.filter((e) => e.orientation === 'left');
    const rightEdges = externalEdges.filter((e) => e.orientation === 'right');

    const createSillaStyle = (
      edge: ExternalEdge,
      ratio: number = 0.5
    ): React.CSSProperties => {
      if (edge.orientation === 'top') {
        return {
          left: `${edge.x + BLOCK_SIZE * ratio}px`,
          top: `${edge.y - 14}px`,
          transform: 'translate3d(-50%, 0, 0px)',
        };
      }
      if (edge.orientation === 'bottom') {
        return {
          left: `${edge.x + BLOCK_SIZE * ratio}px`,
          top: `${edge.y + BLOCK_SIZE + 2}px`,
          transform: 'translate3d(-50%, 0, 0px)',
        };
      }
      if (edge.orientation === 'left') {
        return {
          left: `${edge.x - 14}px`,
          top: `${edge.y + BLOCK_SIZE * ratio}px`,
          transform: 'translate3d(0, -50%, 0px)',
        };
      }
      return {
        left: `${edge.x + BLOCK_SIZE + 2}px`,
        top: `${edge.y + BLOCK_SIZE * ratio}px`,
        transform: 'translate3d(0, -50%, 0px)',
      };
    };

    // Caso 1: Capacidad menor o igual a la cantidad de segmentos exteriores
    if (capacidad <= externalEdges.length) {
      const selectedEdges: ExternalEdge[] = [];
      let tIdx = 0;
      let bIdx = 0;
      let lIdx = 0;
      let rIdx = 0;

      while (selectedEdges.length < capacidad) {
        let added = false;
        if (tIdx < topEdges.length && selectedEdges.length < capacidad) {
          selectedEdges.push(topEdges[tIdx++]);
          added = true;
        }
        if (bIdx < bottomEdges.length && selectedEdges.length < capacidad) {
          selectedEdges.push(bottomEdges[bIdx++]);
          added = true;
        }
        if (lIdx < leftEdges.length && selectedEdges.length < capacidad) {
          selectedEdges.push(leftEdges[lIdx++]);
          added = true;
        }
        if (rIdx < rightEdges.length && selectedEdges.length < capacidad) {
          selectedEdges.push(rightEdges[rIdx++]);
          added = true;
        }
        if (!added) break;
      }

      selectedEdges.forEach((edge, idx) => {
        result.push({
          id: `silla-${edge.id}-${idx}`,
          orientation: edge.orientation,
          style: createSillaStyle(edge, 0.5),
        });
      });

      return result;
    }

    // Caso 2: Capacidad mayor a la cantidad de segmentos exteriores
    const basePerEdge = Math.floor(capacidad / externalEdges.length);
    let extra = capacidad % externalEdges.length;

    externalEdges.forEach((edge, idx) => {
      const chairsForThisEdge = basePerEdge + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;

      for (let c = 0; c < chairsForThisEdge; c++) {
        const ratio = (c + 1) / (chairsForThisEdge + 1);
        result.push({
          id: `silla-${edge.id}-${idx}-${c}`,
          orientation: edge.orientation,
          style: createSillaStyle(edge, ratio),
        });
      }
    });

    return result;
  }, [blocks, mesa.capacidad]);

  // Elevación dinámica: Si está seleccionada en modo edición, flota más alto
  const hoverTranslateZ = isSelected ? 22 : isHovered ? 10 : 0;

  // Altura compacta y no invasiva del billboard
  const billboardTranslateY = forma === 'cuadrada' ? '-64px' : '-52px';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(mesa);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(mesa);
        }
      }}
      aria-label={`Mesa ${mesa.numero}, ${mesa.estado}, capacidad ${mesa.capacidad} personas${
        isSelected ? ' (Seleccionada)' : ''
      }`}
      className={`relative select-none cursor-pointer transition-transform duration-300 ease-out origin-top-left pointer-events-auto ${className}`}
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {/* SOMBRA PARALELA PROYECTADA EN EL SUELO (DIRECCIONAL) PARA CADA BLOQUE REAL */}
      {blocks.map((block) => (
        <div
          key={`shadow-${block.id}`}
          className={`absolute bg-black/60 rounded-xl blur-md pointer-events-none transition-all duration-300 ${
            isSelected
              ? 'scale-125 bg-cyan-500/80 blur-lg opacity-90'
              : isHovered
              ? 'scale-115 opacity-75'
              : 'scale-105 opacity-60'
          }`}
          style={{
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${BLOCK_SIZE}px`,
            height: `${BLOCK_SIZE}px`,
            transform: 'translate3d(6px, 8px, 1px)',
          }}
        />
      ))}

      {/* Sillas 3D volumétricas ancladas al suelo alrededor del perímetro exterior */}
      {sillas.map((silla) => (
        <Silla3D
          key={silla.id}
          orientation={silla.orientation}
          style={silla.style}
        />
      ))}

      {/* VOLUMEN DEL PRISMA DE LA MESA */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`absolute inset-0 cursor-pointer transition-transform duration-300 ease-out ${
          scheme.pulsing && !isSelected ? 'animate-pulse' : ''
        } ${
          isSelected
            ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-stone-900 rounded-lg shadow-[0_0_35px_rgba(34,211,238,0.95)] animate-bounce'
            : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(${hoverTranslateZ}px)`,
        }}
      >
        {blocks.map((block) => {
          const hasRight = blocks.some((o) => o.col === block.col + 1 && o.row === block.row);
          const hasBottom = blocks.some((o) => o.col === block.col && o.row === block.row + 1);

          return (
            <div
              key={block.id}
              className="absolute"
              style={{
                left: `${block.x}px`,
                top: `${block.y}px`,
                width: `${BLOCK_SIZE}px`,
                height: `${BLOCK_SIZE}px`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* CARA SUPERIOR (Top Face) con bisel simulado, brillo cenital y sombras internas */}
              <div
                className={`absolute inset-0 rounded-md transition-all duration-300 flex flex-col items-center justify-center border border-white/25 border-t-2 border-t-white/50 shadow-inner ${scheme.top} ${scheme.glow}`}
                style={{
                  transform: `translateZ(${tableHeight}px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Reflejo simulado de la luz cenital del techo */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/40 rounded-md pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/45 rounded-t-md pointer-events-none" />

                {/* Nombre o número del sub-bloque en el tablero */}
                <span className="text-[11px] font-black tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none truncate px-1 max-w-full text-center">
                  {block.nombre || mesa.numero.replace(/\[.*?\]/g, '').trim()}
                </span>
              </div>

              {/* CARA LATERAL DERECHA (Right Face) - Solo si no tiene bloque adyacente a la derecha */}
              {!hasRight && (
                <div
                  className={`absolute top-0 right-0 h-full rounded-r-xs transition-colors duration-300 bg-gradient-to-b ${scheme.sideRight} border-r border-black/40 shadow-xs`}
                  style={{
                    width: `${tableHeight}px`,
                    transformOrigin: 'right center',
                    transform: 'rotateY(90deg)',
                  }}
                />
              )}

              {/* CARA LATERAL INFERIOR (Bottom Face) - Solo si no tiene bloque adyacente abajo */}
              {!hasBottom && (
                <div
                  className={`absolute bottom-0 left-0 w-full rounded-b-xs transition-colors duration-300 bg-gradient-to-b ${scheme.sideBottom} border-b border-black/50 shadow-xs`}
                  style={{
                    height: `${tableHeight}px`,
                    transformOrigin: 'center bottom',
                    transform: 'rotateX(-90deg)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* INDICADOR FLOTANTE (BILLBOARD EFFECT): Elevado en Z por encima del prisma para evitar oclusión 3D */}
      <div
        className="absolute pointer-events-none select-none z-50 flex flex-col items-center"
        style={{
          left: `${centerX}px`,
          top: `${centerY}px`,
          transform: `translate3d(0, 0, ${tableHeight + 42 + hoverTranslateZ}px) rotateZ(45deg) rotateX(-60deg) translate(-50%, ${billboardTranslateY})`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`pointer-events-none flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-xl backdrop-blur-md border whitespace-nowrap transition-transform duration-300 ${
            isSelected
              ? 'bg-cyan-950/95 border-cyan-400 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.7)] scale-110'
              : `${scheme.badgeBg} ${scheme.badgeBorder} ${scheme.badgeText} ${
                  isHovered ? 'scale-105' : 'scale-100'
                }`
          }`}
        >
          {isSelected ? (
            <>
              <Move className="w-3 h-3 text-cyan-300 animate-spin" />
              <span className="font-bold tracking-tight text-cyan-200">
                Mover {mesa.numero.replace(/\[.*?\]/g, '').trim()}
              </span>
            </>
          ) : (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full ${scheme.dotColor} ${
                  mesa.estado === 'Cuenta Solicitada' ? 'animate-ping' : ''
                }`}
              />
              <span className="font-bold tracking-tight">
                {mesa.numero.replace(/\[.*?\]/g, '').trim()}
              </span>
              <span className="opacity-30">|</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium opacity-85">
                <Users className="w-2.5 h-2.5 inline" />
                {mesa.capacidad}
              </span>
              {forma === 'cuadrada' && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-white/20 font-semibold tracking-tight">
                  Bloque ({mesasCount})
                </span>
              )}
              {isEditMode && (
                <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-white/20 font-mono">
                  EDIT
                </span>
              )}
              {isProcessing && (
                <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin ml-0.5" />
              )}
            </>
          )}
        </div>

        {/* Botón condicional de Desunir Mesas (re-activa pointer-events con z-50 para click directo) */}
        {esUnida && onDesunirMesa && !isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDesunirMesa(mesa);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            className="pointer-events-auto cursor-pointer relative z-50 bg-red-500/85 hover:bg-red-500 text-white text-[9px] font-semibold px-2.5 py-0.5 rounded-full mt-1 flex items-center gap-1 transition-all shadow-sm hover:scale-105 active:scale-95"
            style={{
              transform: 'translateZ(12px)',
            }}
            title={`Separar mesa ${mesa.numero}`}
          >
            <Unlink className="w-2.5 h-2.5 pointer-events-none" />
            <span className="pointer-events-none">{mesasCount >= 3 ? `Desunir (${mesasCount})` : 'Desunir'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
