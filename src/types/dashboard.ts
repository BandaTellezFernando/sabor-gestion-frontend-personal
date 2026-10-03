export interface KPIsDashboard {
  ventasHoy: number;
  ordenesHoy: number;
  clientesEstimados: number;
  mesasActivas: number;
  ocupacionPorcentaje: number;
}

export interface PlatoPopularDTO {
  nombre: string;
  cantidad: number;
  imagen?: string;
}

export interface CategoriaPopularDTO {
  nombre: string;
  pedidos: number;
  porcentaje: number;
}

export interface OrdenRecienteDTO {
  id: string;
  mesa: string;
  hora: string;
  estado: string;
  total: number;
}

export interface ResumenDashboardDTO {
  kpis: KPIsDashboard;
  platosMasVendidos: PlatoPopularDTO[];
  categoriasPopulares: CategoriaPopularDTO[];
  ordenesRecientes: OrdenRecienteDTO[];
}
