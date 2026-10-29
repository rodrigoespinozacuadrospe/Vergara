"""Persistencia y operaciones de Vergara, expresadas únicamente en Python."""

from contextlib import contextmanager
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sqlite3


PRODUCTS = [
    ("7750001", "Arroz extra", "Abarrotes", "Bolsa de 5 kg", "arroz", 2400, 120, 60, [30, 34, 28, 36, 40, 38]),
    ("7750002", "Aceite vegetal", "Abarrotes", "Botella de 1 L", "aceite", 950, 34, 40, [22, 25, 24, 30, 28, 33]),
    ("7750003", "Azúcar rubia", "Abarrotes", "Bolsa de 1 kg", "azucar", 420, 90, 50, [40, 38, 45, 42, 47, 44]),
    ("7750004", "Fideos spaghetti", "Abarrotes", "Paquete de 500 g", "fideos", 310, 55, 50, [50, 48, 52, 55, 53, 60]),
    ("7750005", "Leche evaporada", "Desayunos", "Lata de 400 g", "leche", 480, 18, 30, [35, 30, 34, 38, 36, 40]),
    ("7750006", "Café tostado y molido", "Desayunos", "Bolsa de 250 g", "cafe", 1250, 64, 20, [14, 17, 15, 18, 21, 19]),
    ("7750007", "Detergente en polvo", "Limpieza", "Bolsa de 800 g", "detergente", 890, 80, 25, [20, 22, 25, 24, 21, 28]),
    ("7750008", "Galletas de vainilla", "Desayunos", "Paquete de 6 unidades", "galletas", 650, 96, 30, [25, 28, 30, 27, 32, 34]),
]

CLIENTS = [
    (0, "Bodega Los Olivos", 2, 3),
    (1, "Minimarket Aurora", 5, 1),
    (2, "Bodega San José", 1, 6),
    (3, "Tienda Doña Rosa", 6, 5),
]


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _positive_id(value):
    if type(value) is not int or value < 1:
        raise ValueError("El pedido no es válido.")


class Store:
    """Almacén SQLite con precios en céntimos y escrituras atómicas.

    Las conexiones viven durante una sola operación; por eso ``path`` debe
    apuntar a un archivo, no a la base volátil ``:memory:`` de SQLite.
    """

    def __init__(self, path):
        self.path = str(path)
        if self.path == ":memory:":
            raise ValueError("Utilice una ruta de archivo para conservar los datos.")
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self._connection(write=True) as db:
            for sql in (
                """CREATE TABLE IF NOT EXISTS products (
                    code TEXT PRIMARY KEY, name TEXT NOT NULL,
                    category TEXT NOT NULL, format TEXT NOT NULL,
                    image TEXT NOT NULL, price INTEGER NOT NULL CHECK(price > 0),
                    stock INTEGER NOT NULL CHECK(stock >= 0),
                    reorder INTEGER NOT NULL CHECK(reorder >= 0), history TEXT NOT NULL
                )""",
                """CREATE TABLE IF NOT EXISTS clients (
                    id INTEGER PRIMARY KEY, name TEXT NOT NULL,
                    x REAL NOT NULL, y REAL NOT NULL
                )""",
                """CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER NOT NULL REFERENCES clients(id),
                    created TEXT NOT NULL,
                    status TEXT NOT NULL CHECK(status IN ('Pendiente', 'Listo', 'Entregado')),
                    total INTEGER NOT NULL CHECK(total > 0),
                    signature TEXT NOT NULL DEFAULT '',
                    photo INTEGER NOT NULL DEFAULT 0 CHECK(photo IN (0, 1))
                )""",
                """CREATE TABLE IF NOT EXISTS order_items (
                    order_id INTEGER NOT NULL REFERENCES orders(id),
                    code TEXT NOT NULL REFERENCES products(code),
                    name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0),
                    price INTEGER NOT NULL CHECK(price > 0),
                    PRIMARY KEY(order_id, code)
                )""",
                """CREATE TABLE IF NOT EXISTS movements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT NOT NULL REFERENCES products(code),
                    name TEXT NOT NULL, quantity INTEGER NOT NULL,
                    balance INTEGER NOT NULL CHECK(balance >= 0),
                    reason TEXT NOT NULL, created TEXT NOT NULL
                )""",
            ):
                db.execute(sql)
            db.executemany(
                "INSERT OR IGNORE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [(*p[:-1], json.dumps(p[-1])) for p in PRODUCTS],
            )
            db.executemany("INSERT OR IGNORE INTO clients VALUES (?, ?, ?, ?)", CLIENTS)

    @contextmanager
    def _connection(self, write=False):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
        try:
            if write:
                db.execute("BEGIN IMMEDIATE")
            yield db
            if write:
                db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @staticmethod
    def _products(db):
        rows = db.execute(
            """SELECT p.*, COALESCE(s.sold, 0) AS sold
               FROM products p LEFT JOIN (
                   SELECT code, SUM(quantity) AS sold FROM order_items GROUP BY code
               ) s ON s.code = p.code ORDER BY p.code"""
        ).fetchall()
        products = []
        for row in rows:
            product = dict(row)
            history = json.loads(product.pop("history"))[-3:]
            sold = product.pop("sold")
            samples = len(history) + bool(sold)
            demand = math.floor((sum(history) + sold) / samples * 4.3 + 0.5)
            holding_cost = product["price"] / 100 * 0.25
            product["demand"] = demand
            product["eoq"] = max(1, math.floor(math.sqrt(2 * demand * 12 * 40 / holding_cost) + 0.5))
            products.append(product)
        return products

    def products(self):
        """Devuelve el catálogo y la demanda/EOQ calculadas con las ventas."""
        with self._connection() as db:
            return self._products(db)

    def clients(self):
        """Devuelve los clientes de demostración y sus coordenadas."""
        with self._connection() as db:
            return [dict(row) for row in db.execute("SELECT * FROM clients ORDER BY id")]

    @staticmethod
    def _orders(db):
        rows = db.execute(
            """SELECT o.*, c.name AS client_name FROM orders o
               JOIN clients c ON c.id = o.client_id ORDER BY o.id DESC"""
        ).fetchall()
        result = []
        for row in rows:
            order = dict(row)
            order["photo"] = bool(order["photo"])
            order["items"] = [
                dict(item)
                for item in db.execute(
                    """SELECT code, name, quantity, price, quantity * price AS subtotal
                       FROM order_items WHERE order_id = ? ORDER BY code""",
                    (order["id"],),
                )
            ]
            result.append(order)
        return result

    def orders(self):
        """Devuelve los pedidos completos del más reciente al más antiguo."""
        with self._connection() as db:
            return self._orders(db)

    def movements(self):
        """Devuelve el kardex, con saldos después de cada movimiento."""
        with self._connection() as db:
            return [dict(row) for row in db.execute("SELECT * FROM movements ORDER BY id DESC")]

    @staticmethod
    def _movement(db, product, quantity, reason, created):
        balance = product["stock"] + quantity
        if balance < 0:
            raise ValueError(f"Stock insuficiente para {product['name']}.")
        db.execute("UPDATE products SET stock = ? WHERE code = ?", (balance, product["code"]))
        db.execute(
            """INSERT INTO movements (code, name, quantity, balance, reason, created)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (product["code"], product["name"], quantity, balance, reason, created),
        )

    def checkout(self, cart, client_id):
        """Confirma un carrito y reserva su stock en una única transacción."""
        if not isinstance(cart, dict) or not cart:
            raise ValueError("Agrega productos al carrito antes de confirmar.")
        if type(client_id) is not int:
            raise ValueError("Selecciona un cliente válido.")
        for code, quantity in cart.items():
            if not isinstance(code, str) or type(quantity) is not int or quantity < 1:
                raise ValueError("Las cantidades del carrito deben ser enteros positivos.")
        with self._connection(write=True) as db:
            if not db.execute("SELECT 1 FROM clients WHERE id = ?", (client_id,)).fetchone():
                raise ValueError("Selecciona un cliente válido.")
            products = {product["code"]: product for product in self._products(db)}
            total = 0
            for code, quantity in cart.items():
                product = products.get(code)
                if product is None:
                    raise ValueError("El carrito contiene un producto no disponible.")
                if quantity > product["stock"]:
                    raise ValueError(f"Stock insuficiente para {product['name']}.")
                total += quantity * product["price"]
            created = _now()
            cursor = db.execute(
                "INSERT INTO orders (client_id, created, status, total) VALUES (?, ?, 'Pendiente', ?)",
                (client_id, created, total),
            )
            order_id = cursor.lastrowid
            for code, quantity in cart.items():
                product = products[code]
                db.execute(
                    "INSERT INTO order_items VALUES (?, ?, ?, ?, ?)",
                    (order_id, code, product["name"], quantity, product["price"]),
                )
                self._movement(db, product, -quantity, f"Pedido #{order_id}", created)
            return order_id

    def adjust_stock(self, code, quantity):
        """Registra una entrada o salida sin permitir existencias negativas."""
        if type(quantity) is not int or quantity == 0:
            raise ValueError("La cantidad debe ser un entero distinto de cero.")
        if not isinstance(code, str):
            raise ValueError("Introduce un código de producto válido.")
        with self._connection(write=True) as db:
            product = db.execute("SELECT * FROM products WHERE code = ?", (code.strip(),)).fetchone()
            if product is None:
                raise ValueError("No se encontró un producto con ese código.")
            self._movement(db, product, quantity, "Recepción" if quantity > 0 else "Salida", _now())

    def replenish(self):
        """Repone los productos en o bajo el punto de reorden según su EOQ."""
        with self._connection(write=True) as db:
            products = [p for p in self._products(db) if p["stock"] <= p["reorder"]]
            created = _now()
            for product in products:
                self._movement(db, product, product["eoq"], "Reposición automática (EOQ)", created)
            return len(products)

    def prepare(self, order_id):
        """Pasa un pedido pendiente a preparado; no permite saltar etapas."""
        _positive_id(order_id)
        with self._connection(write=True) as db:
            cursor = db.execute(
                "UPDATE orders SET status = 'Listo' WHERE id = ? AND status = 'Pendiente'",
                (order_id,),
            )
            if cursor.rowcount != 1:
                raise ValueError("El pedido no existe o ya no está pendiente.")

    def deliver(self, order_id, signature, photo):
        """Confirma una entrega preparada con receptor y constancia de foto."""
        _positive_id(order_id)
        if not isinstance(signature, str) or not signature.strip():
            raise ValueError("Escribe el nombre de quien recibe el pedido.")
        if photo is not True:
            raise ValueError("Confirma que se tomó la foto de entrega.")
        signature = signature.strip()
        if len(signature) > 200:
            raise ValueError("El nombre del receptor no puede superar los 200 caracteres.")
        with self._connection(write=True) as db:
            cursor = db.execute(
                """UPDATE orders SET status = 'Entregado', signature = ?, photo = 1
                   WHERE id = ? AND status = 'Listo'""",
                (signature, order_id),
            )
            if cursor.rowcount != 1:
                raise ValueError("El pedido no existe o todavía no está preparado.")

    def route(self):
        """Ordena los pedidos listos por vecino más cercano desde el almacén."""
        with self._connection() as db:
            clients = {row["id"]: dict(row) for row in db.execute("SELECT * FROM clients")}
            pending = [order for order in self._orders(db) if order["status"] == "Listo"]
        result = []
        x, y, distance = 0, 0, 0
        while pending:
            order = min(
                pending,
                key=lambda o: (
                    math.hypot(clients[o["client_id"]]["x"] - x, clients[o["client_id"]]["y"] - y),
                    o["id"],
                ),
            )
            pending.remove(order)
            client = clients[order["client_id"]]
            leg = math.hypot(client["x"] - x, client["y"] - y)
            distance += leg
            order.update(x=client["x"], y=client["y"], leg_km=leg, total_km=distance)
            result.append(order)
            x, y = client["x"], client["y"]
        return result

    def summary(self):
        """Calcula los indicadores y devuelve los productos con stock bajo."""
        with self._connection() as db:
            orders = self._orders(db)
            products = self._products(db)
        count = len(orders)
        delivered = sum(order["status"] == "Entregado" for order in orders)
        return {
            "revenue": sum(order["total"] for order in orders),
            "order_count": count,
            "delivered_count": delivered,
            "delivery_percent": round(delivered / count * 100, 1) if count else 0,
            "low_stock": [p for p in products if p["stock"] <= p["reorder"]],
        }
