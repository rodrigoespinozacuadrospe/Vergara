/* Vista: selección de rol (simula el inicio de sesión con control de acceso). */
Vergara.views = Vergara.views || {};
Vergara.views.login = function () {
  const botones = Object.entries(Vergara.data.roles).map(([id, r]) =>
    `<button class="btn secundario ancho" data-action="entrar" data-rol="${id}">
       <b>${r.titulo}</b><br><span class="muted">${r.descripcion}</span></button>`).join("");
  return `<section class="card login">
    <h2>Ingresar al sistema</h2>
    <p class="muted">Seleccione un rol. Cada rol solo ve las pantallas de su función (control de acceso).</p>
    ${botones}</section>`;
};
