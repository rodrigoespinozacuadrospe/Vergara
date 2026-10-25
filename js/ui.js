/* Utilidades de interfaz: formatos, mensajes y etiquetas. */
Vergara.ui = {
  moneda(valor) { return "S/ " + valor.toFixed(2); },

  fecha(ts) {
    return new Date(ts).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  },

  duracion(ms) {
    const s = ms / 1000;
    return s < 90 ? Math.round(s) + " s" : (s / 60).toFixed(1) + " min";
  },

  // Evita que el texto escrito por el usuario se interprete como HTML
  escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  normalizar(texto) {
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  },

  toast(texto) {
    const el = document.getElementById("toast");
    el.textContent = texto;
    el.classList.add("visible");
    setTimeout(() => el.classList.remove("visible"), 2300);
  },

  // Etiqueta y color según el nivel de stock
  estadoStock(p) {
    if (p.stock <= 0) return { texto: "Agotado", clase: "bad" };
    if (p.stock <= p.reorden) return { texto: "Stock bajo", clase: "warn" };
    return { texto: "Disponible", clase: "ok" };
  },

  // Línea de tiempo simple del pedido
  pasosPedido(estado) {
    const orden = [Vergara.ESTADO.PENDIENTE, Vergara.ESTADO.LISTO, Vergara.ESTADO.ENTREGADO];
    const actual = orden.indexOf(estado);
    return `<div class="pasos">${orden.map((e, i) => `<span class="${i <= actual ? "hecho" : ""}">${i <= actual ? "●" : "○"} ${e}</span>`).join("")}</div>`;
  }
};
