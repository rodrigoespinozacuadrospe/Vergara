/* Exportación de reportes a CSV (se abre en Excel). */
Vergara.exportar = {
  descargar(nombreArchivo, filas) {
    const celda = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = "\ufeff" + filas.map(f => f.map(celda).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = nombreArchivo; a.click();
    URL.revokeObjectURL(url);
  },

  pedidos() {
    const filas = [["ID", "Cliente", "Productos", "Total (S/)", "Estado", "Fecha"]];
    Vergara.state.pedidos.forEach(o => filas.push([o.id, Vergara.pedidos.cliente(o).nombre,
      o.items.map(i => i.cantidad + " " + i.nombre).join(", "), o.total.toFixed(2), o.estado, Vergara.ui.fecha(o.creado)]));
    this.descargar("pedidos_vergara.csv", filas);
  },

  inventario() {
    const filas = [["Código", "Producto", "Stock", "Punto de reorden", "EOQ sugerido"]];
    Vergara.state.productos.forEach(p => filas.push([p.codigo, p.nombre, p.stock, p.reorden, Vergara.inventario.eoq(p)]));
    this.descargar("inventario_vergara.csv", filas);
  },

  movimientos() {
    const filas = [["Fecha", "Código", "Producto", "Motivo", "Cantidad", "Saldo"]];
    Vergara.state.movimientos.forEach(m => filas.push([Vergara.ui.fecha(m.fecha), m.codigo, m.nombre, m.motivo, m.cantidad, m.saldo]));
    this.descargar("movimientos_vergara.csv", filas);
  }
};
