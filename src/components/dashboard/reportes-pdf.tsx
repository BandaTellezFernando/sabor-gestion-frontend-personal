'use client'

import { useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileDown,
  FileText,
  LoaderCircle
} from 'lucide-react'
import { ApiError } from '@/lib/api-error'
import { reporteService } from '@/services/reporte.service'

function obtenerPartesFechaBolivia(): { anio: string; mes: string; dia: string } {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())

  return {
    anio: partes.find((parte) => parte.type === 'year')?.value ?? '2026',
    mes: partes.find((parte) => parte.type === 'month')?.value ?? '01',
    dia: partes.find((parte) => parte.type === 'day')?.value ?? '01'
  }
}

function obtenerFechaHoyBolivia(): string {
  const { anio, mes, dia } = obtenerPartesFechaBolivia()
  return `${anio}-${mes}-${dia}`
}

function obtenerInicioMesBolivia(): string {
  const { anio, mes } = obtenerPartesFechaBolivia()
  return `${anio}-${mes}-01`
}

function descargarPdfBase64(nombreArchivo: string, contenidoBase64: string): void {
  const binario = window.atob(contenidoBase64)
  const bytes = new Uint8Array(binario.length)

  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice)
  }

  const archivo = new Blob([bytes], { type: 'application/pdf' })
  const urlTemporal = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = urlTemporal
  enlace.download = nombreArchivo || 'reporte-ventas-sabor-y-gestion.pdf'
  enlace.style.display = 'none'
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(urlTemporal), 1500)
}

export function ReportesPdfSection() {
  const [desde, setDesde] = useState(obtenerInicioMesBolivia)
  const [hasta, setHasta] = useState(obtenerFechaHoyBolivia)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const generarReporte = async () => {
    setError(null)
    setMensaje(null)

    if (!desde || !hasta) {
      setError('Selecciona la fecha inicial y la fecha final.')
      return
    }
    if (desde > hasta) {
      setError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    setGenerando(true)
    try {
      const reporte = await reporteService.generarVentasPdf(desde, hasta)
      descargarPdfBase64(reporte.nombreArchivo, reporte.contenidoBase64)
      setMensaje('El reporte PDF se generó y la descarga comenzó.')
    } catch (errorDesconocido: unknown) {
      if (errorDesconocido instanceof ApiError) {
        setError(errorDesconocido.getUserMessage())
      } else {
        setError('No se pudo generar el reporte. Comprueba la conexión e inténtalo nuevamente.')
      }
    } finally {
      setGenerando(false)
    }
  }

  const claseCampo = 'mt-1 block w-full rounded-sm border border-amber-700/30 bg-zinc-950 px-3 py-2 text-sm text-stone-100 shadow-xs outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40'

  return (
    <section className="overflow-hidden rounded-sm border border-amber-700/25 bg-zinc-900 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      <div className="border-b border-stone-200/80 bg-stone-50/70 px-5 py-4 dark:border-stone-800 dark:bg-[#1A1816]/70 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="rounded-sm border border-amber-700/30 bg-amber-950/30 p-2.5 text-amber-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-50 sm:text-lg">
              Reportes de ventas
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Genera un solo PDF con ventas, propinas, métodos de pago, rendimiento por mesero, productos y categorías.
            </p>
          </div>
          <FileText className="hidden h-5 w-5 text-stone-400 sm:block" />
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reporte-desde" className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
              <CalendarDays className="h-4 w-4 text-stone-400" />
              Fecha inicial
            </label>
            <input
              id="reporte-desde"
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(evento) => setDesde(evento.target.value)}
              className={claseCampo}
            />
          </div>
          <div>
            <label htmlFor="reporte-hasta" className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
              <CalendarDays className="h-4 w-4 text-stone-400" />
              Fecha final
            </label>
            <input
              id="reporte-hasta"
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(evento) => setHasta(evento.target.value)}
              className={claseCampo}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            'Resumen de ventas y propinas',
            'Totales por método de pago',
            'Pedidos asociados a cada mesero',
            'Productos y categorías más vendidos'
          ].map((opcion) => (
            <div key={opcion} className="flex items-center gap-2 rounded-sm bg-stone-50 px-3 py-2.5 text-sm text-stone-700 dark:bg-stone-900/70 dark:text-stone-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{opcion}</span>
            </div>
          ))}
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mensaje && (
          <div role="status" className="flex items-start gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{mensaje}</span>
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-5 text-stone-500 dark:text-stone-400">
            El reporte usa pagos confirmados dentro del periodo seleccionado y no cambia pedidos, inventario ni cobros.
          </p>
          <button
            type="button"
            onClick={() => void generarReporte()}
            disabled={generando || !desde || !hasta}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-[0_0_15px_rgba(217,119,6,0.2)] transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-stone-900"
          >
            {generando ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {generando ? 'Generando PDF…' : 'Generar reporte PDF'}
          </button>
        </div>
      </div>
    </section>
  )
}
