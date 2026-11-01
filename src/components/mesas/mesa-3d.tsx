//src/components/mesas/mesa-3d.tsx
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
 * Sub-componente Silla3D: Silla de alta gastronomía en madera de nogal oscuro
 * con tapizado en cuero negro/bronce y costuras o ribetes dorados.
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
            'rounded-t-xs bg-gradient-to-b from-stone-800 via-stone-900 to-zinc-950 border border-amber-900/60 border-t-amber-500/40 shadow-xs',
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
            'rounded-b-xs bg-gradient-to-t from-stone-800 via-stone-900 to-zinc-950 border border-amber-900/60 border-b-amber-500/40 shadow-xs',
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
            'rounded-l-xs bg-gradient-to-r from-stone-800 via-stone-900 to-zinc-950 border border-amber-900/60 border-l-amber-500/40 shadow-xs',
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
            'rounded-r-xs bg-gradient-to-l from-stone-800 via-stone-900 to-zinc-950 border border-amber-900/60 border-r-amber-500/40 shadow-xs',
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
      {/* Sombra de oclusión proyectada sobre el suelo */}
      <div
        className="absolute inset-0 bg-black/75 rounded-xs blur-[1px]"
        style={{ transform: 'translateZ(0.5px)' }}
      />

      {/* Patas de nogal macizo y herrajes bronce */}
      <div
        className="absolute top-0.5 left-0.5 w-[2px] h-[2px] bg-stone-950 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />
      <div
        className="absolute top-0.5 right-0.5 w-[2px] h-[2px] bg-stone-950 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />
      <div
        className="absolute bottom-0.5 left-0.5 w-[2px] h-[2px] bg-stone-950 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />
      <div
        className="absolute bottom-0.5 right-0.5 w-[2px] h-[2px] bg-stone-950 rounded-full"
        style={{ transform: 'translateZ(1px)' }}
      />

      {/* Base inferior del asiento en madera oscura */}
      <div
        className="absolute inset-0.5 bg-stone-900 rounded-xs border border-amber-950/60 shadow-xs"
        style={{
          transform: 'translateZ(3.5px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Asiento acolchado en cuero refinado con relieve cenital */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-zinc-950 rounded-xs border-t border-amber-500/30 shadow-inner"
          style={{
            transform: 'translateZ(2.5px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Respaldo volumétrico */}
          <div
            className={`absolute ${respaldo.className}`}
            style={{
              ...respaldo.style,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Ribete de lujo */}
            <div className="absolute inset-0.5 opacity-20 border-t border-amber-400/40 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Configuración de materiales y acabados de lujo para cada estado de la mesa */
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
    // Mármol negro / Nogal oscuro con reflejo esmeralda sutil y herraje bronce
    top: 'bg-gradient-to-br from-zinc-900 via-stone-900 to-zinc-950 hover:from-stone-800 hover:to-zinc-900',
    sideRight: 'from-stone-900 via-zinc-950 to-black',
    sideBottom: 'from-stone-950 via-zinc-950 to-black',
    glow: 'hover:shadow-[0_0_15px_rgba(217,119,6,0.18)]',
    pulsing: false,
    badgeBg: 'bg-zinc-950/95',
    badgeBorder: 'border-emerald-700/50',
    badgeText: 'text-emerald-300',
    dotColor: 'bg-emerald-400',
  },
  Ocupada: {
    // Nogal tostado de lujo con bisel en oro viejo y brillo ámbar difuso
    top: 'bg-gradient-to-br from-amber-950/85 via-stone-900 to-zinc-950 hover:from-amber-900/90 hover:to-stone-850',
    sideRight: 'from-amber-950 via-stone-950 to-black',
    sideBottom: 'from-stone-950 via-zinc-950 to-black',
    glow: 'shadow-[0_0_15px_rgba(217,119,6,0.18)] hover:shadow-[0_0_20px_rgba(217,119,6,0.28)]',
    pulsing: false,
    badgeBg: 'bg-zinc-950/95',
    badgeBorder: 'border-amber-600/60',
    badgeText: 'text-amber-200',
    dotColor: 'bg-amber-400',
  },
  'Cuenta Solicitada': {
    // Ónix pulido con ribetes de oro champaña y pulso dorado sutil
    top: 'bg-gradient-to-br from-stone-900 via-zinc-950 to-amber-950 hover:from-stone-850 hover:to-amber-900',
    sideRight: 'from-amber-900 via-stone-950 to-black',
    sideBottom: 'from-stone-900 via-zinc-950 to-black',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    pulsing: true,
    badgeBg: 'bg-amber-950/95',
    badgeBorder: 'border-amber-400/80',
    badgeText: 'text-amber-100',
    dotColor: 'bg-amber-300',
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

  // La existencia y el tamaño de una fusión provienen de los metadatos del backend
  const esUnida = useMemo(
    () => mesa.estadoFusion === 'Fusionada' && (mesa.mesasOrigen?.length ?? 0) >= 2,
    [mesa.estadoFusion, mesa.mesasOrigen]
  );

  const subNombres = useMemo(() => {
    if (!esUnida) return [mesa.numero];
    return mesa.mesasOrigen?.map((origen) => origen.numero) ?? [mesa.numero];
  }, [mesa.numero, mesa.mesasOrigen, esUnida]);

  const mesasCount = useMemo(() => (esUnida ? subNombres.length : 1), [esUnida, subNombres]);

  const forma = useMemo<'normal' | 'lineal' | 'cuadrada'>(() => {
    if (!esUnida) return 'normal';
    return mesa.formaFusion === 'Cuadrada' || (!mesa.formaFusion && mesasCount >= 3) ? 'cuadrada' : 'lineal';
  }, [esUnida, mesasCount, mesa.formaFusion]);

  // Generación exacta de sub-bloques reales
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

    // FORMA BLOQUE / CUADRADA
    let colCount = 2;
    let rowCount = 2;
    const bPositions: Array<{ col: number; row: number }> = [];

    if (mesasCount === 2) {
      colCount = 2;
      rowCount = 1;
      bPositions.push({ col: 0, row: 0 }, { col: 1, row: 0 });
    } else if (mesasCount === 3) {
      colCount = 2;
      rowCount = 2;
      bPositions.push(
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 1 }
      );
    } else if (mesasCount === 4) {
      colCount = 2;
      rowCount = 2;
      bPositions.push(
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 0, row: 1 },
        { col: 1, row: 1 }
      );
    } else if (mesasCount === 5) {
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

  // Centroide de los bloques reales
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
  const tableHeight = 22; // Altura tridimensional del prisma

  // Distribución de sillas en el perímetro exterior
  const sillas = useMemo(() => {
    const capacidad = Math.max(1, mesa.capacidad || 2);
    const externalEdges: ExternalEdge[] = [];

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

  // Elevación dinámica
  const hoverTranslateZ = isSelected ? 22 : isHovered ? 10 : 0;
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
      {/* SOMBRA SUAVE PROYECTADA EN EL SUELO */}
      {blocks.map((block) => (
        <div
          key={`shadow-${block.id}`}
          className={`absolute rounded-xs blur-[4px] pointer-events-none transition-all duration-300 ${
            isSelected
              ? 'scale-125 bg-amber-500/30 blur-md opacity-90'
              : isHovered
              ? 'scale-110 bg-black/80 opacity-80'
              : 'scale-100 bg-black/70 opacity-60'
          }`}
          style={{
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${BLOCK_SIZE}px`,
            height: `${BLOCK_SIZE}px`,
            transform: 'translate3d(4px, 6px, 1px)',
          }}
        />
      ))}

      {/* Sillas 3D de alta gama */}
      {sillas.map((silla) => (
        <Silla3D
          key={silla.id}
          orientation={silla.orientation}
          style={silla.style}
        />
      ))}

      {/* VOLUMEN DEL PRISMA DE LA MESA (Fine Dining) */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`absolute inset-0 cursor-pointer transition-transform duration-300 ease-out ${
          scheme.pulsing && !isSelected ? 'animate-pulse' : ''
        } ${
          isSelected
            ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 rounded-xs shadow-[0_0_25px_rgba(245,158,11,0.5)]'
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
              {/* CARA SUPERIOR: Tablero en madera de nogal o mármol con bisel de latón */}
              <div
                className={`absolute inset-0 rounded-xs transition-all duration-300 flex flex-col items-center justify-center border border-amber-700/40 border-t border-t-amber-400/60 shadow-inner ${scheme.top} ${scheme.glow}`}
                style={{
                  transform: `translateZ(${tableHeight}px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Veta sutil de lujo y reflejo superior */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-amber-400/15 rounded-xs pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[1px] bg-amber-300/40 rounded-t-xs pointer-events-none" />

                {/* Número de la mesa con tipografía Serif */}
                <span className="font-serif text-[11px] font-semibold tracking-wider text-stone-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pointer-events-none truncate px-1 max-w-full text-center">
                  {block.nombre || mesa.numero.replace(/\[.*?\]/g, '').trim()}
                </span>
              </div>

              {/* CARA LATERAL DERECHA (Madera de nogal en penumbra) */}
              {!hasRight && (
                <div
                  className={`absolute top-0 right-0 h-full rounded-r-none transition-colors duration-300 bg-gradient-to-b ${scheme.sideRight} border-r border-black/60 shadow-xs`}
                  style={{
                    width: `${tableHeight}px`,
                    transformOrigin: 'right center',
                    transform: 'rotateY(90deg)',
                  }}
                />
              )}

              {/* CARA LATERAL INFERIOR */}
              {!hasBottom && (
                <div
                  className={`absolute bottom-0 left-0 w-full rounded-b-none transition-colors duration-300 bg-gradient-to-b ${scheme.sideBottom} border-b border-black/70 shadow-xs`}
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

      {/* INDICADOR FLOTANTE (BILLBOARD EFFECT): Estética Haute Cuisine */}
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
          className={`pointer-events-none flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[11px] font-medium shadow-xl backdrop-blur-md border whitespace-nowrap transition-transform duration-300 ${
            isSelected
              ? 'bg-amber-950/95 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-110'
              : `${scheme.badgeBg} ${scheme.badgeBorder} ${scheme.badgeText} ${
                  isHovered ? 'scale-105' : 'scale-100'
                }`
          }`}
        >
          {isSelected ? (
            <>
              <Move className="w-3 h-3 text-amber-300 animate-spin" />
              <span className="font-serif font-semibold tracking-wide text-amber-200">
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
              <span className="font-serif font-semibold tracking-wide">
                {mesa.numero.replace(/\[.*?\]/g, '').trim()}
              </span>
              <span className="opacity-30">|</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-light opacity-90">
                <Users className="w-2.5 h-2.5 inline text-amber-500/80" />
                {mesa.capacidad}
              </span>
              {forma === 'cuadrada' && (
                <span className="text-[8px] px-1 py-0.2 rounded-xs bg-amber-950/80 border border-amber-700/40 text-amber-300 font-medium tracking-wide">
                  Bloque ({mesasCount})
                </span>
              )}
              {isEditMode && (
                <span className="ml-1 text-[9px] px-1 py-0.2 rounded-xs bg-stone-800 text-amber-400 font-mono border border-amber-700/30">
                  EDIT
                </span>
              )}
              {isProcessing && (
                <span className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin ml-0.5" />
              )}
            </>
          )}
        </div>

        {/* Botón condicional de Desunir Mesas */}
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
            className="pointer-events-auto cursor-pointer relative z-50 bg-rose-950/90 hover:bg-rose-900 text-rose-200 text-[9px] font-medium px-2.5 py-0.5 rounded-sm mt-1 flex items-center gap-1 transition-all border border-rose-800/60 shadow-xs hover:scale-105 active:scale-95"
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
