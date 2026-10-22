import { apiClient } from '@/lib/api-client'

export interface ReporteVentasPdfResponse {
  nombreArchivo: string
  tipoContenido: 'application/pdf'
  contenidoBase64: string
}

export const reporteService = {
  generarVentasPdf(desde: string, hasta: string): Promise<ReporteVentasPdfResponse> {
    return apiClient.get<ReporteVentasPdfResponse>('/dashboard/reportes/pdf', {
      params: { desde, hasta }
    })
  }
}
