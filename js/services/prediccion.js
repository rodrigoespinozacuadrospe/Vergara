/* Predicción de demanda (simulada con promedio móvil de las últimas semanas). */
Vergara.prediccion = {
  unidadesVendidasEnSesion(codigo) {
    return Vergara.state.pedidos.reduce((total, ped) =>
      total + ped.items.filter(i => i.codigo === codigo).reduce((s, i) => s + i.cantidad, 0), 0);
  },

  // Proyección de unidades a 30 días (≈ 4.3 semanas)
  demanda30Dias(producto) {
    const ultimas3 = producto.historial.slice(-3);
    const vendidas = this.unidadesVendidasEnSesion(producto.codigo);
    const muestras = ultimas3.length + (vendidas ? 1 : 0);
    const promedio = (ultimas3.reduce((a, b) => a + b, 0) + vendidas) / muestras;
    return Math.round(promedio * 4.3);
  }
};
