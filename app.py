"""Vergara: tienda y centro de operaciones en Python, Flask y Bootstrap."""

import csv
import hmac
import io
import json
import os
from pathlib import Path
import secrets
import unicodedata

import numpy as np
from flask import (
    Flask, Response, abort, flash, redirect, render_template_string,
    request, send_from_directory, session, url_for,
)
from flask_bootstrap import Bootstrap5
from markupsafe import Markup

from store import Store
import ui


ROOT = Path(__file__).resolve().parent
PHOTOS = {name: f"photos/{name}.{'png' if name in ('arroz', 'aceite', 'cafe') else 'jpg'}"
          for name in ('arroz', 'aceite', 'azucar', 'fideos', 'leche', 'cafe', 'detergente', 'galletas')}
MODULES = {
    "dashboard": "Resumen general", "cliente": "Nuevo pedido",
    "ventas": "Pedidos y ventas", "almacen": "Control de inventario",
    "distribucion": "Distribución", "asistente": "Asistente virtual",
    "laboratorio": "Laboratorio de IA y NumPy",
}
ROLES = {
    "cliente": {"title": "Cliente", "description": "Realiza pedidos y consulta su estado", "modules": ["cliente", "asistente"]},
    "ventas": {"title": "Ventas", "description": "Registra pedidos y revisa ventas", "modules": ["cliente", "ventas"]},
    "almacen": {"title": "Almacén", "description": "Controla inventario y prepara pedidos", "modules": ["almacen"]},
    "repartidor": {"title": "Repartidor", "description": "Sigue la ruta y confirma entregas", "modules": ["distribucion"]},
    "gerencia": {"title": "Gerencia", "description": "Ve todos los módulos e indicadores", "modules": list(MODULES)},
}


def normalized(text):
    return "".join(c for c in unicodedata.normalize("NFD", text.casefold()) if not unicodedata.combining(c))


def laboratory(excluded=False):
    values = np.array([45, 60, 90, 120, 60, 85, 300, 45, 90, 60, 110, 75])
    q1, q3 = np.percentile(values, [25, 75], method="linear")
    iqr = q3 - q1
    selected = np.delete(values, 6) if excluded else values
    return {
        "count": int(selected.size), "mean": float(np.mean(selected)),
        "median": float(np.median(selected)), "std": float(np.std(selected)),
        "variance": float(np.var(selected)), "q1": float(q1), "q3": float(q3),
        "iqr": float(iqr), "lower": float(q1 - 1.5 * iqr),
        "upper": float(q3 + 1.5 * iqr), "values": values.tolist(), "excluded": excluded,
    }


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_mapping(
        DATABASE=str(ROOT / "instance" / "vergara.sqlite3"),
        SECRET_KEY=os.environ.get("VERGARA_SECRET_KEY"),
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
        MAX_CONTENT_LENGTH=64 * 1024, BOOTSTRAP_SERVE_LOCAL=True,
    )
    if config:
        app.config.update(config)
    if not app.config["SECRET_KEY"]:
        secret_file = ROOT / "instance" / "secret.key"
        secret_file.parent.mkdir(parents=True, exist_ok=True)
        try:
            with secret_file.open("x") as target:
                target.write(secrets.token_hex(32))
            secret_file.chmod(0o600)
        except FileExistsError:
            pass
        app.config["SECRET_KEY"] = secret_file.read_text().strip()
    Bootstrap5(app)
    store = Store(app.config["DATABASE"])
    app.extensions["store"] = store

    def csrf_token():
        if "_csrf_token" not in session:
            session["_csrf_token"] = secrets.token_urlsafe(32)
        return session["_csrf_token"]

    @app.before_request
    def protect_forms():
        if request.method == "POST":
            expected = session.get("_csrf_token", "")
            actual = request.form.get("csrf_token", "")
            if not expected or not hmac.compare_digest(expected, actual):
                abort(400, description="El formulario venció. Recarga la página e inténtalo otra vez.")

    def money(cents):
        return f"S/ {int(cents) / 100:,.2f}"

    app.jinja_env.filters["money"] = money
    app.jinja_env.globals.update(csrf_token=csrf_token, money=money)
    app.jinja_env.globals["photo"] = lambda image: url_for("media", filename=PHOTOS.get(image, image + ".svg"))

    def allowed_modules():
        role = ROLES.get(session.get("role"), {})
        return {key: MODULES[key] for key in role.get("modules", [])}

    def require_module(module):
        if module not in allowed_modules():
            abort(403, description="El rol seleccionado no tiene acceso a esta función.")

    def page(template, title, **context):
        cart_items = session.get("cart", {})
        context.update(
            title=title, cart_count=sum(cart_items.values()), cart_items=cart_items,
            cart_total=sum(p["price"] * cart_items.get(p["code"], 0) for p in store.products()),
            role=session.get("role"), modules=allowed_modules(),
        )
        body = render_template_string(template, **context)
        return render_template_string(ui.BASE, body=Markup(body), **context)

    def catalog_destination():
        """Conserva los filtros al comprar sin aceptar redirecciones externas."""
        if request.form.get("return_to") == "cliente" and "cliente" in allowed_modules():
            return url_for("operations", module="cliente")
        if request.form.get("return_to") == "product" and request.form.get("product_code") in {p["code"] for p in store.products()}:
            return url_for("product", code=request.form["product_code"])
        return url_for("shop", q=request.form.get("q", "")[:200],
                       category=request.form.get("category", "Todos"),
                       sort=request.form.get("sort", "recommended"),
                       favorites="1" if request.form.get("only_favorites") == "1" else "0",
                       _anchor="catalogo")

    def product_by_code(code):
        product = next((p for p in store.products() if p["code"] == code), None)
        if product is None:
            abort(404)
        return product

    def integer(name, default=None):
        raw = request.form.get(name, default)
        try:
            value = int(raw)
            if abs(value) > 1_000_000:
                raise ValueError
            return value
        except (ValueError, TypeError, OverflowError):
            raise ValueError("Introduce una cantidad entera válida.") from None

    def action(function, destination, success):
        try:
            function()
        except ValueError as error:
            flash(str(error), "danger")
        else:
            flash(success, "success")
        return redirect(destination)

    @app.get("/")
    def shop():
        products = store.products()
        q = request.args.get("q", "").strip()[:200]
        category = request.args.get("category", "Todos")
        sort = request.args.get("sort", "recommended")
        favorites = session.get("favorites", [])
        only_favorites = request.args.get("favorites") == "1"
        if category != "Todos":
            products = [p for p in products if p["category"] == category]
        if q:
            products = [p for p in products if normalized(q) in normalized(f"{p['name']} {p['category']} {p['code']}")]
        if only_favorites:
            products = [p for p in products if p["code"] in favorites]
        if sort in ("price-low", "price-high"):
            products.sort(key=lambda p: p["price"], reverse=sort == "price-high")
        elif sort == "name":
            products.sort(key=lambda p: normalized(p["name"]))
        return page(ui.SHOP, "Todo para tu negocio", products=products, q=q,
                    category=category, sort=sort, favorites=favorites,
                    only_favorites=only_favorites, categories=["Todos", "Abarrotes", "Desayunos", "Limpieza"])

    @app.post("/favorites/<code>")
    def favorite(code):
        product_by_code(code)
        favorites = session.get("favorites", [])
        session["favorites"] = [c for c in favorites if c != code] if code in favorites else favorites + [code]
        return redirect(catalog_destination())

    @app.get("/product/<code>")
    def product(code):
        selected = product_by_code(code)
        related = [p for p in store.products() if p["category"] == selected["category"] and p["code"] != code][:3]
        return page(ui.PRODUCT, selected["name"], product=selected, related=related)

    @app.post("/orders/<int:order_id>/reorder")
    def reorder(order_id):
        if order_id not in session.get("order_ids", []):
            abort(404)
        order = next((o for o in store.orders() if o["id"] == order_id), None)
        if order is None:
            abort(404)
        def repeat():
            products = {p["code"]: p for p in store.products()}
            cart = session.get("cart", {}).copy()
            for item in order["items"]:
                p = products.get(item["code"])
                quantity = cart.get(item["code"], 0) + item["quantity"]
                if p is None or quantity > p["stock"]:
                    raise ValueError(f"No hay stock suficiente para volver a pedir {item['name']}. Tu carrito no cambió.")
                cart[item["code"]] = quantity
            session["cart"] = cart
        return action(repeat, url_for("cart"), "Agregamos los productos de tu pedido al carrito. Revisa cantidades y precios actuales.")

    @app.post("/cart/add/<code>")
    def cart_add(code):
        product = product_by_code(code)
        def add():
            quantity = integer("quantity", "1")
            cart = session.get("cart", {}).copy()
            result = cart.get(code, 0) + quantity
            if quantity < 1:
                raise ValueError("La cantidad debe ser un entero positivo.")
            if result > product["stock"]:
                raise ValueError(f"Stock insuficiente para {product['name']}.")
            cart[code] = result
            session["cart"] = cart
        return action(add, catalog_destination(), "Producto agregado al carrito.")

    @app.post("/cart/update/<code>")
    def cart_update(code):
        product = product_by_code(code)
        def update():
            quantity = integer("quantity")
            if quantity < 0 or quantity > product["stock"]:
                raise ValueError("La cantidad debe estar entre cero y el stock disponible.")
            cart = session.get("cart", {}).copy()
            if quantity:
                cart[code] = quantity
            else:
                cart.pop(code, None)
            session["cart"] = cart
        return action(update, url_for("cart"), "Carrito actualizado.")

    @app.post("/cart/remove/<code>")
    def cart_remove(code):
        cart = session.get("cart", {}).copy()
        cart.pop(code, None)
        session["cart"] = cart
        flash("Producto retirado del carrito.", "success")
        return redirect(url_for("cart"))

    @app.post("/cart/clear")
    def cart_clear():
        session["cart"] = {}
        flash("Carrito vaciado. Puedes empezar un nuevo pedido.", "success")
        return redirect(url_for("cart"))

    @app.get("/cart")
    def cart():
        selected = session.get("cart", {})
        rows = [{"product": p, "quantity": selected[p["code"]], "subtotal": p["price"] * selected[p["code"]]}
                for p in store.products() if p["code"] in selected]
        return page(ui.CART, "Mi carrito", rows=rows, total=sum(row["subtotal"] for row in rows), clients=store.clients())

    @app.post("/checkout")
    def checkout():
        try:
            order_id = store.checkout(session.get("cart", {}), integer("client_id"))
        except ValueError as error:
            flash(str(error), "danger")
            return redirect(url_for("cart"))
        session["cart"] = {}
        session["order_ids"] = (session.get("order_ids", []) + [order_id])[-100:]
        flash(f"Pedido #{order_id} confirmado. ¡Gracias por elegir Vergara!", "success")
        return redirect(url_for("orders"))

    @app.get("/orders")
    def orders():
        order_ids = session.get("order_ids", [])
        visible = [order for order in store.orders() if order["id"] in order_ids]
        return page(ui.ORDERS, "Mis pedidos", orders=visible)

    @app.route("/roles", methods=["GET", "POST"])
    def roles():
        if request.method == "POST":
            role = request.form.get("role")
            if role not in ROLES:
                abort(400)
            session["role"] = role
            return redirect(url_for("operations", module=ROLES[role]["modules"][0]))
        return page(ui.ROLES, "Elige tu espacio de trabajo", roles=ROLES)

    @app.get("/operations", defaults={"module": None})
    @app.get("/operations/<module>")
    def operations(module):
        if not allowed_modules():
            return redirect(url_for("roles"))
        if module is None:
            return redirect(url_for("operations", module=next(iter(allowed_modules()))))
        if module not in MODULES:
            abort(404)
        require_module(module)
        stats = store.summary()
        stats["low_stock"] = len(stats["low_stock"])
        return page(ui.OPERATIONS, MODULES[module], module=module, module_title=MODULES[module],
                    products=store.products(), orders=store.orders(), clients=store.clients(),
                    movements=store.movements(), stats=stats, route=store.route(),
                    messages=session.get("messages", []), lab=laboratory(request.args.get("exclude") == "1"))

    @app.post("/inventory")
    def inventory():
        require_module("almacen")
        return action(lambda: store.adjust_stock(request.form.get("code", "").strip(), integer("quantity")),
                      url_for("operations", module="almacen"), "Movimiento registrado.")

    @app.post("/inventory/replenish")
    def replenish():
        require_module("almacen")
        return action(store.replenish, url_for("operations", module="almacen"), "Reposición EOQ completada.")

    @app.post("/orders/<int:order_id>/prepare")
    def prepare(order_id):
        require_module("almacen")
        return action(lambda: store.prepare(order_id), url_for("operations", module="almacen"), "Pedido preparado para reparto.")

    @app.post("/orders/<int:order_id>/deliver")
    def deliver(order_id):
        require_module("distribucion")
        return action(lambda: store.deliver(order_id, request.form.get("signature", "")[:200], request.form.get("photo") == "on"),
                      url_for("operations", module="distribucion"), "Entrega confirmada.")

    @app.post("/assistant")
    def assistant():
        require_module("asistente")
        message = request.form.get("message", "").strip()[:1000]
        if not message:
            flash("Escribe tu consulta.", "warning")
            return redirect(url_for("operations", module="asistente"))
        query = normalized(message)
        products = store.products()
        matched = [p for p in products if normalized(p["name"].split()[0]) in query]
        if "reposicion" in query or "reponer" in query or "stock bajo" in query:
            low = [p for p in products if p["stock"] <= p["reorder"]]
            response = "Necesitan reposición: " + "; ".join(f"{p['name']} ({p['stock']} unidades; reorden {p['reorder']})" for p in low) if low else "Todos los productos están por encima de su punto de reorden."
        elif matched:
            response = " · ".join(f"{p['name']}: {money(p['price'])}, {p['stock']} unidades disponibles" for p in matched)
        elif "stock" in query or "inventario" in query:
            response = f"Tenemos {sum(p['stock'] for p in products)} unidades. Consulta Control de inventario para ver el detalle."
        elif "pedido" in query:
            current_orders = store.orders()
            counts = {status: sum(o["status"] == status for o in current_orders) for status in ("Pendiente", "Listo", "Entregado")}
            response = (f"Pedidos pendientes: {counts['Pendiente']}; listos: {counts['Listo']}; entregados: {counts['Entregado']}. "
                        "Consulta Mis pedidos para seguir tus compras.")
        elif "producto" in query or "catalogo" in query:
            response = "Nuestro catálogo: " + "; ".join(f"{p['name']} ({money(p['price'])})" for p in products) + "."
        elif "entrega" in query or "ruta" in query:
            response = "Coordinamos entregas en Lima. Los pedidos preparados se ordenan por cercanía desde el almacén."
        else:
            response = "¡Hola! Puedo ayudarte con productos, precios, stock, pedidos y entregas. Prueba: ¿Cuánto cuesta el arroz?"
        session["messages"] = (session.get("messages", []) + [{"sender": "user", "text": message}, {"sender": "assistant", "text": response}])[-20:]
        return redirect(url_for("operations", module="asistente"))

    @app.get("/export/<kind>.csv")
    def export(kind):
        if kind == "orders":
            require_module("ventas")
            headers = ["id", "client_name", "created", "status", "total"]
            rows = store.orders()
        elif kind == "inventory":
            require_module("almacen")
            headers = ["code", "name", "stock", "reorder", "price", "eoq", "demand"]
            rows = store.products()
        elif kind == "movements":
            require_module("almacen")
            headers = ["code", "name", "quantity", "balance", "reason", "created"]
            rows = store.movements()
        else:
            abort(404)
        target = io.StringIO(newline="")
        writer = csv.writer(target)
        writer.writerow([f"{key}_centimos" if key in ("price", "total") else key for key in headers])
        writer.writerows([[row[key] for key in headers] for row in rows])
        return Response("\ufeff" + target.getvalue(), content_type="text/csv; charset=utf-8",
                        headers={"Content-Disposition": f'attachment; filename="vergara-{kind}.csv"'})

    @app.get("/laboratorio/<kind>")
    def download_lab(kind):
        if kind == "python":
            return send_from_directory(ROOT / "laboratorio", "analisis_numpy.py", as_attachment=True)
        if kind == "notebook":
            source = (ROOT / "laboratorio" / "analisis_numpy.py").read_text()
            notebook = {"cells": [{"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": source.splitlines(keepends=True)}],
                        "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}}, "nbformat": 4, "nbformat_minor": 5}
            return Response(json.dumps(notebook, ensure_ascii=False), content_type="application/x-ipynb+json",
                            headers={"Content-Disposition": 'attachment; filename="Laboratorio_IA_NumPy.ipynb"'})
        abort(404)

    @app.get("/media/<path:filename>")
    def media(filename):
        return send_from_directory(ROOT / "assets", filename)

    @app.get("/health")
    def health():
        return {"status": "ok", "products": len(store.products())}

    def friendly_error(error):
        titles = {400: "Vamos a intentarlo otra vez", 403: "Elige otro espacio de trabajo", 404: "Este camino no lleva a la tienda"}
        descriptions = {400: "El formulario no se pudo enviar. Abre de nuevo la pantalla y vuelve a intentarlo.",
                        403: "Tu rol actual no incluye esta sección. Puedes cambiar de rol en la demostración.",
                        404: "La página que buscas no está disponible. Puedes volver al catálogo y seguir explorando."}
        return page(ui.ERROR, titles[error.code], error_code=error.code,
                    error_title=titles[error.code], error_description=descriptions[error.code]), error.code

    for code in (400, 403, 404):
        app.register_error_handler(code, friendly_error)

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=int(os.environ.get("PORT", "3000")))
