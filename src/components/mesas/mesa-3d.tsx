'use client';

import React, { useState, useMemo } from 'react';
import { Mesa, EstadoMesa } from '@/types';
import { Users, Move } from 'lucide-react';

export interface Mesa3DProps {
  mesa: Mesa;
  onClick?: (mesa: Mesa) => void;
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
 * Sub-componente Silla3D: Silla volumétrica con relieve tridimensional.
 * Asiento compuesto con grosor (translateZ) y respaldo inclinado de alto contraste.
 */
function Silla3D({ orientation, style }: SillaProps) {
  const getRespaldoStyle = (): React.CSSProperties => {
    switch (orientation) {
      case 'top':
        return {
          top: '-2px',
          left: 0,
          right: 0,
          height: '9px',
          transformOrigin: 'bottom',
          transform: 'rotateX(-80deg)',
        };
      case 'bottom':
        return {
          bottom: '-2px',
          left: 0,
          right: 0,
          height: '9px',
          transformOrigin: 'top',
          transform: 'rotateX(80deg)',
        };
      case 'left':
        return {
          left: '-2px',
          top: 0,
          bottom: 0,
          width: '9px',
          transformOrigin: 'right',
          transform: 'rotateY(80deg)',
        };
      case 'right':
        return {
          right: '-2px',
          top: 0,
          bottom: 0,
          width: '9px',
          transformOrigin: 'left',
          transform: 'rotateY(-80deg)',
        };
    }
  };

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...style,
        width: '14px',
        height: '14px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Sombra de oclusión en el piso */}
      <div
        className="absolute inset-0 bg-black/45 rounded-xs blur-[1px]"
        style={{ transform: 'translateZ(1px)' }}
      />

      {/* Asiento volumétrico con grosor: base en translateZ(4px) y tapa acolchada en translateZ(7px) */}
      <div
        className="absolute inset-0 bg-stone-400 rounded-xs border border-stone-500/80 shadow-xs"
        style={{
          transform: 'translateZ(4px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Tapa del asiento con tono claro y borde luminoso */}
        <div
          className="absolute inset-0 bg-stone-300 rounded-xs border-t border-white/60 shadow-xs"
          style={{
            transform: 'translateZ(3px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Respaldo de la silla con volumen y definición */}
          <div
            className="absolute bg-stone-400 rounded-t-xs border border-stone-500 shadow-sm"
            style={{
              ...getRespaldoStyle(),
              transformStyle: 'preserve-3d',
            }}
          />
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
    sideRight: 'bg-emerald-800',
    sideBottom: 'bg-emerald-950',
    glow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.7)]',
    pulsing: false,
    badgeBg: 'bg-emerald-950/95',
    badgeBorder: 'border-emerald-400/60',
    badgeText: 'text-emerald-100',
    dotColor: 'bg-emerald-400',
  },
  Ocupada: {
    top: 'bg-[#C84B26] hover:bg-[#db5229]',
    sideRight: 'bg-[#9A3515]',
    sideBottom: 'bg-[#712710]',
    glow: 'hover:shadow-[0_0_24px_rgba(200,75,38,0.7)]',
    pulsing: false,
    badgeBg: 'bg-stone-950/95',
    badgeBorder: 'border-[#C84B26]/70',
    badgeText: 'text-amber-100',
    dotColor: 'bg-[#C84B26]',
  },
  'Cuenta Solicitada': {
    top: 'bg-amber-500 hover:bg-amber-400',
    sideRight: 'bg-amber-700',
    sideBottom: 'bg-amber-900',
    glow: 'shadow-[0_0_28px_rgba(245,158,11,0.9)]',
    pulsing: true,
    badgeBg: 'bg-amber-950/95',
    badgeBorder: 'border-amber-400/80',
    badgeText: 'text-amber-100',
    dotColor: 'bg-amber-400',
  },
};

export function Mesa3D({
  mesa,
  onClick,
  className = '',
  isProcessing = false,
  isEditMode = false,
  isSelected = false,
  style,
}: Mesa3DProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Detectar si la mesa es una unión física (ej. "1+2", "Mesa 4 y 5")
  const esUnida = useMemo(() => {
    return mesa.numero.includes('+') || /\by\b/i.test(mesa.numero);
  }, [mesa.numero]);

  const scheme = COLOR_SCHEMES[mesa.estado] || COLOR_SCHEMES.Libre;
  const tableHeight = 22; // Altura tridimensional de elevación del prisma (translateZ)

  // Separación ajustada de las sillas respecto al borde de la mesa
  const CHAIR_OFFSET = '-12px';

  // Distribución matemática de sillas alrededor del perímetro de la mesa
  const sillas = useMemo(() => {
    const capacidad = Math.max(1, mesa.capacidad || 2);
    const result: Array<{
      id: string;
      orientation: 'top' | 'bottom' | 'left' | 'right';
      style: React.CSSProperties;
    }> = [];

    if (esUnida) {
      // Mesa Unida rectangular (w-[120px] h-16): Proporción 2:1 con más sillas en top y bottom
      if (capacidad === 1) {
        result.push({
          id: 's-0',
          orientation: 'bottom',
          style: { left: '50%', bottom: CHAIR_OFFSET, transform: 'translateX(-50%)' },
        });
      } else if (capacidad === 2) {
        result.push(
          {
            id: 's-0',
            orientation: 'top',
            style: { left: '50%', top: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          },
          {
            id: 's-1',
            orientation: 'bottom',
            style: { left: '50%', bottom: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          }
        );
      } else {
        // Cabeceras izquierda y derecha (1 silla en cada extremo corto)
        result.push({
          id: 's-left',
          orientation: 'left',
          style: { left: CHAIR_OFFSET, top: '50%', transform: 'translateY(-50%)' },
        });
        result.push({
          id: 's-right',
          orientation: 'right',
          style: { right: CHAIR_OFFSET, top: '50%', transform: 'translateY(-50%)' },
        });

        // Reparto equitativo del resto en los bordes largos (top y bottom)
        const resto = capacidad - 2;
        const topCount = Math.ceil(resto / 2);
        const bottomCount = resto - topCount;

        for (let i = 0; i < topCount; i++) {
          const ratio = (i + 1) / (topCount + 1);
          result.push({
            id: `s-top-${i}`,
            orientation: 'top',
            style: {
              left: `${ratio * 100}%`,
              top: CHAIR_OFFSET,
              transform: 'translateX(-50%)',
            },
          });
        }

        for (let i = 0; i < bottomCount; i++) {
          const ratio = (i + 1) / (bottomCount + 1);
          result.push({
            id: `s-bottom-${i}`,
            orientation: 'bottom',
            style: {
              left: `${ratio * 100}%`,
              bottom: CHAIR_OFFSET,
              transform: 'translateX(-50%)',
            },
          });
        }
      }
    } else {
      // Mesa Normal cuadrada 1x1 (w-16 h-16): Distribución equitativa en los 4 bordes
      if (capacidad === 1) {
        result.push({
          id: 's-0',
          orientation: 'bottom',
          style: { left: '50%', bottom: CHAIR_OFFSET, transform: 'translateX(-50%)' },
        });
      } else if (capacidad === 2) {
        result.push(
          {
            id: 's-0',
            orientation: 'top',
            style: { left: '50%', top: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          },
          {
            id: 's-1',
            orientation: 'bottom',
            style: { left: '50%', bottom: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          }
        );
      } else if (capacidad === 3) {
        result.push(
          {
            id: 's-0',
            orientation: 'top',
            style: { left: '50%', top: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          },
          {
            id: 's-1',
            orientation: 'bottom',
            style: { left: '50%', bottom: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          },
          {
            id: 's-2',
            orientation: 'right',
            style: { right: CHAIR_OFFSET, top: '50%', transform: 'translateY(-50%)' },
          }
        );
      } else if (capacidad === 4) {
        result.push(
          {
            id: 's-0',
            orientation: 'top',
            style: { left: '50%', top: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          },
          {
            id: 's-1',
            orientation: 'bottom',
            style: { left: '50%', bottom: CHAIR_OFFSET, transform: 'translateX(-50%)' },
          },
          {
            id: 's-2',
            orientation: 'left',
            style: { left: CHAIR_OFFSET, top: '50%', transform: 'translateY(-50%)' },
          },
          {
            id: 's-3',
            orientation: 'right',
            style: { right: CHAIR_OFFSET, top: '50%', transform: 'translateY(-50%)' },
          }
        );
      } else {
        // Más de 4 comensales en mesa cuadrada
        const base = Math.floor(capacidad / 4);
        const extra = capacidad % 4;
        const counts = {
          top: base + (extra > 0 ? 1 : 0),
          bottom: base + (extra > 1 ? 1 : 0),
          left: base + (extra > 2 ? 1 : 0),
          right: base,
        };

        (['top', 'bottom', 'left', 'right'] as const).forEach((side) => {
          const count = counts[side];
          for (let i = 0; i < count; i++) {
            const ratio = (i + 1) / (count + 1);
            if (side === 'top') {
              result.push({
                id: `s-${side}-${i}`,
                orientation: side,
                style: {
                  left: `${ratio * 100}%`,
                  top: CHAIR_OFFSET,
                  transform: 'translateX(-50%)',
                },
              });
            } else if (side === 'bottom') {
              result.push({
                id: `s-${side}-${i}`,
                orientation: side,
                style: {
                  left: `${ratio * 100}%`,
                  bottom: CHAIR_OFFSET,
                  transform: 'translateX(-50%)',
                },
              });
            } else if (side === 'left') {
              result.push({
                id: `s-${side}-${i}`,
                orientation: side,
                style: {
                  left: CHAIR_OFFSET,
                  top: `${ratio * 100}%`,
                  transform: 'translateY(-50%)',
                },
              });
            } else {
              result.push({
                id: `s-${side}-${i}`,
                orientation: side,
                style: {
                  right: CHAIR_OFFSET,
                  top: `${ratio * 100}%`,
                  transform: 'translateY(-50%)',
                },
              });
            }
          }
        });
      }
    }

    return result;
  }, [mesa.capacidad, esUnida]);

  // Elevación dinámica: Si está seleccionada en modo edición, flota más alto
  const hoverTranslateZ = isSelected ? 22 : isHovered ? 10 : 0;

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
      className={`relative select-none cursor-pointer transition-transform duration-300 ease-out origin-center pointer-events-auto ${
        esUnida ? 'w-[120px] h-16' : 'w-16 h-16'
      } ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {/* SOMBRA PARALELA PROYECTADA EN EL SUELO (DIRECCIONAL) */}
      <div
        className={`absolute inset-0 bg-black/60 rounded-xl blur-md pointer-events-none transition-all duration-300 ${
          isSelected
            ? 'scale-125 bg-cyan-500/80 blur-lg opacity-90'
            : isHovered
            ? 'scale-115 opacity-75'
            : 'scale-105 opacity-60'
        }`}
        style={{
          transform: 'translate3d(6px, 8px, 1px)',
        }}
      />

      {/* Sillas 3D volumétricas con grosor colocadas alrededor de la mesa */}
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
            ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-stone-900 rounded-md shadow-[0_0_35px_rgba(34,211,238,0.95)] animate-bounce'
            : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(${hoverTranslateZ}px)`,
        }}
      >
        {/* CARA SUPERIOR (Top Face) con borde brillante, reflejos y sombra interna */}
        <div
          className={`absolute inset-0 rounded-lg transition-all duration-300 flex items-center justify-center border border-white/30 border-t-white/60 shadow-inner ${
            scheme.top
          } ${scheme.glow}`}
          style={{
            transform: `translateZ(${tableHeight}px)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Reflejo simulado de la luz cenital del techo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/40 rounded-lg pointer-events-none" />

          {/* Ranura divisoria visual en mesas unidas centrada exactamente a la mitad */}
          {esUnida && (
            <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-black/40 shadow-[1px_0_0_rgba(255,255,255,0.3)] pointer-events-none" />
          )}

          {/* Número de la mesa impreso sobre el tablero */}
          <span className="text-[13px] font-black tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none">
            {mesa.numero}
          </span>
        </div>

        {/* CARA LATERAL DERECHA (Right Face) */}
        <div
          className={`absolute top-0 right-0 h-full rounded-r-xs transition-colors duration-300 ${scheme.sideRight} border-r border-black/40 shadow-xs`}
          style={{
            width: `${tableHeight}px`,
            transformOrigin: 'right center',
            transform: 'rotateY(90deg)',
          }}
        />

        {/* CARA LATERAL INFERIOR (Bottom / South Face) */}
        <div
          className={`absolute bottom-0 left-0 w-full rounded-b-xs transition-colors duration-300 ${scheme.sideBottom} border-b border-black/50 shadow-xs`}
          style={{
            height: `${tableHeight}px`,
            transformOrigin: 'center bottom',
            transform: 'rotateX(-90deg)',
          }}
        />
      </div>

      {/* INDICADOR FLOTANTE (BILLBOARD EFFECT): Centrado matemáticamente y con pointer-events-none estricto */}
      <div
        className="absolute left-1/2 top-1/2 pointer-events-none select-none z-30"
        style={{
          transform: 'rotateZ(45deg) rotateX(-60deg) translate(-50%, -75px)',
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
              <span className="font-bold tracking-tight text-cyan-200">Mover Mesa {mesa.numero}</span>
            </>
          ) : (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full ${scheme.dotColor} ${
                  mesa.estado === 'Cuenta Solicitada' ? 'animate-ping' : ''
                }`}
              />
              <span className="font-bold tracking-tight">Mesa {mesa.numero}</span>
              <span className="opacity-30">|</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium opacity-85">
                <Users className="w-2.5 h-2.5 inline" />
                {mesa.capacidad}
              </span>
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
      </div>
    </div>
  );
}
