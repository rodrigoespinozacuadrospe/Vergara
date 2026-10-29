"""Pruebas funcionales sin red de la tienda y sus operaciones Python."""

import csv
import io
import json
from pathlib import Path
import tempfile
import unittest
from urllib.parse import parse_qs, urlsplit

from app import create_app
from store import Store


class AppTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.database = str(Path(self.directory.name) / "vergara.db")
        self.app = create_app({
            "TESTING": True,
            "DATABASE": self.database,
            "SECRET_KEY": "a-test-key-never-used-outside-tests",
        })
        self.client = self.app.test_client()
        self.store = self.app.extensions["store"]
        with self.client.session_transaction() as state:
            state["_csrf_token"] = "test-csrf"

    def post(self, path, data=None, follow=True):
        return self.client.post(
            path,
            data={"csrf_token": "test-csrf", **(data or {})},
            follow_redirects=follow,
        )

    def role(self, role):
        response = self.post("/roles", {"role": role})
        self.assertEqual(response.status_code, 200)

    def stock(self, code="7750001"):
        return next(p["stock"] for p in self.store.products() if p["code"] == code)

    def place_order(self):
        self.assertEqual(self.post("/cart/add/7750001", {"quantity": "2"}).status_code, 200)
        self.assertEqual(self.post("/checkout", {"client_id": "0"}).status_code, 200)
        return self.store.orders()[0]["id"]

    def test_order_reserves_stock_then_is_prepared_and_delivered(self):
        order_id = self.place_order()
        order = self.store.orders()[0]
        self.assertEqual(order["total"], 4800)
        self.assertEqual(order["status"], "Pendiente")
        self.assertEqual(self.stock(), 118)
        self.assertEqual(self.store.movements()[0]["quantity"], -2)
        with self.client.session_transaction() as state:
            self.assertEqual(state.get("cart"), {})
            self.assertIn(order_id, state["order_ids"])

        self.role("almacen")
        self.assertEqual(self.post(f"/orders/{order_id}/prepare").status_code, 200)
        self.assertEqual(self.store.orders()[0]["status"], "Listo")
        self.role("repartidor")
        # A named receiver and the demo photo confirmation are both required.
        self.post(f"/orders/{order_id}/deliver", {"signature": "Ana"})
        self.assertEqual(self.store.orders()[0]["status"], "Listo")
        self.post(f"/orders/{order_id}/deliver", {"signature": "Ana", "photo": "on"})
        delivered = self.store.orders()[0]
        self.assertEqual(delivered["status"], "Entregado")
        self.assertEqual(delivered["signature"], "Ana")
        self.assertTrue(delivered["photo"])
        # Repeated delivery cannot reserve or consume stock twice.
        self.post(f"/orders/{order_id}/deliver", {"signature": "Ana", "photo": "on"})
        self.assertEqual(self.stock(), 118)

    def test_invalid_cart_quantities_cannot_create_orders(self):
        for quantity in ["-1", "0", "1.5", "not-a-number", "999999"]:
            with self.subTest(quantity=quantity):
                self.post("/cart/add/7750001", {"quantity": quantity})
                self.assertEqual(self.stock(), 120)
                self.assertEqual(self.store.orders(), [])
                with self.client.session_transaction() as state:
                    self.assertFalse(state.get("cart", {}).get("7750001"))
        self.post("/cart/add/7750001", {"quantity": "2"})
        self.post("/cart/update/7750001", {"quantity": "0"})
        self.post("/checkout", {"client_id": "0"})
        self.assertEqual(self.store.orders(), [])
        self.assertEqual(self.stock(), 120)

    def test_csrf_and_role_checks_prevent_mutation(self):
        self.assertEqual(
            self.client.post("/cart/add/7750001", data={"quantity": "1"}).status_code, 400
        )
        self.assertEqual(
            self.client.post("/cart/add/7750001", data={"quantity": "1", "csrf_token": "wrong"}).status_code,
            400,
        )
        self.role("cliente")
        for endpoint, data in [
            ("/inventory", {"code": "7750001", "quantity": "10"}),
            ("/inventory/replenish", {}),
            ("/orders/1/prepare", {}),
            ("/orders/1/deliver", {"signature": "Ana", "photo": "on"}),
        ]:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.post(endpoint, data).status_code, 403)
        for endpoint in ["/operations/dashboard", "/operations/almacen", "/export/inventory.csv"]:
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(endpoint).status_code, 403)
        self.assertEqual(self.stock(), 120)
        self.assertEqual(self.store.movements(), [])

    def test_catalog_search_category_and_favorites(self):
        response = self.client.get("/?q=Arroz")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Arroz extra", response.get_data(as_text=True))
        self.assertNotIn("Café tostado y molido", response.get_data(as_text=True))
        response = self.client.get("/?category=Limpieza")
        self.assertIn("Detergente en polvo", response.get_data(as_text=True))
        self.assertNotIn("Arroz extra", response.get_data(as_text=True))
        self.post("/favorites/7750006")
        response = self.client.get("/?favorites=1")
        self.assertIn("Café tostado y molido", response.get_data(as_text=True))
        self.assertNotIn("Arroz extra", response.get_data(as_text=True))
        self.post("/favorites/7750006")
        with self.client.session_transaction() as state:
            self.assertNotIn("7750006", state.get("favorites", []))

    def test_public_orders_are_limited_to_the_current_session(self):
        self.place_order()
        another = self.app.test_client()
        response = another.get("/orders")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Bodega Los Olivos", response.get_data(as_text=True))
        self.assertIn("Bodega Los Olivos", self.client.get("/orders").get_data(as_text=True))

    def test_inventory_validation_and_csv_reflect_persistent_state(self):
        self.role("almacen")
        self.post("/inventory", {"code": "7750001", "quantity": "8"})
        self.assertEqual(self.stock(), 128)
        for quantity in ["-129", "0", "1.5", "wrong"]:
            self.post("/inventory", {"code": "7750001", "quantity": quantity})
            self.assertEqual(self.stock(), 128)
        response = self.client.get("/export/inventory.csv")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/csv", response.content_type)
        rows = list(csv.reader(io.StringIO(response.get_data(as_text=True))))
        rice = next(row for row in rows if "7750001" in row)
        self.assertIn("128", rice)
        reopened = create_app({"TESTING": True, "DATABASE": self.database, "SECRET_KEY": "other-test-key"})
        products = reopened.extensions["store"].products()
        self.assertEqual(next(p["stock"] for p in products if p["code"] == "7750001"), 128)
        self.assertEqual(len(products), 8)

    def test_every_operations_module_renders_and_chat_is_escaped(self):
        self.role("gerencia")
        for module in ["dashboard", "cliente", "ventas", "almacen", "distribucion", "asistente", "laboratorio"]:
            with self.subTest(module=module):
                self.assertEqual(self.client.get(f"/operations/{module}").status_code, 200)
        payload = "<script>alert('unsafe')</script>"
        response = self.post("/assistant", {"message": payload})
        html = response.get_data(as_text=True)
        self.assertNotIn(payload, html)
        self.assertIn("&lt;script&gt;", html)

    def test_catalog_actions_preserve_filters_and_workspace(self):
        fields = {"q": "arroz", "category": "Abarrotes", "sort": "price-low", "only_favorites": "1"}
        response = self.post("/favorites/7750001", fields, follow=False)
        location = urlsplit(response.headers["Location"])
        self.assertEqual(location.path, "/")
        self.assertEqual(parse_qs(location.query), {"q": ["arroz"], "category": ["Abarrotes"], "sort": ["price-low"], "favorites": ["1"]})
        response = self.post("/cart/add/7750001", {**fields, "quantity": "3"}, follow=False)
        self.assertEqual(parse_qs(urlsplit(response.headers["Location"]).query)["q"], ["arroz"])
        with self.client.session_transaction() as state:
            self.assertEqual(state["cart"]["7750001"], 3)
        self.role("ventas")
        response = self.post("/cart/add/7750001", {"quantity": "1", "return_to": "cliente"}, follow=False)
        self.assertEqual(response.headers["Location"], "/operations/cliente")
        response = self.post("/cart/add/7750001", {"quantity": "1", "return_to": "https://example.com"}, follow=False)
        self.assertFalse(urlsplit(response.headers["Location"]).netloc)

    def test_remove_and_clear_cart_never_change_inventory(self):
        self.post("/cart/add/7750001", {"quantity": "3"})
        self.post("/cart/add/7750002", {"quantity": "2"})
        self.assertEqual(self.client.post("/cart/clear").status_code, 400)
        self.post("/cart/remove/7750001")
        with self.client.session_transaction() as state:
            self.assertEqual(state["cart"], {"7750002": 2})
        self.post("/cart/clear")
        with self.client.session_transaction() as state:
            self.assertEqual(state["cart"], {})
        self.assertEqual(self.stock(), 120)
        self.assertEqual(self.store.movements(), [])

    def test_assistant_uses_current_reorder_and_order_data(self):
        self.role("gerencia")
        self.post("/assistant", {"message": "¿Qué productos necesitan reposición?"})
        with self.client.session_transaction() as state:
            reply = state["messages"][-1]["text"]
            self.assertIn("Aceite vegetal", reply)
            self.assertIn("Leche evaporada", reply)
            self.assertNotIn("Arroz extra", reply)
        self.store.adjust_stock("7750002", 100)
        self.post("/assistant", {"message": "¿Qué productos necesitan reposición?"})
        with self.client.session_transaction() as state:
            self.assertNotIn("Aceite vegetal", state["messages"][-1]["text"])
        self.place_order()
        self.post("/assistant", {"message": "¿Cómo van los pedidos?"})
        with self.client.session_transaction() as state:
            self.assertIn("pendientes: 1", state["messages"][-1]["text"])

    def test_errors_offer_a_recovery_path(self):
        response = self.client.get("/pagina-inexistente")
        self.assertEqual(response.status_code, 404)
        self.assertIn("Volver a la tienda", response.text)
        response = self.client.post("/checkout", data={"client_id": "0"})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Elegir mi espacio", response.text)

    def test_product_detail_uses_local_reference_photography(self):
        from app import PHOTOS
        for product in self.store.products():
            with self.subTest(product=product["code"]):
                response = self.client.get(f"/product/{product['code']}")
                self.assertEqual(response.status_code, 200)
                self.assertIn(product["name"], response.text)
                self.assertIn("Fotografía referencial", response.text)
                photo = self.client.get("/media/" + PHOTOS[product["image"]])
                self.addCleanup(photo.close)
                self.assertEqual(photo.status_code, 200)
                self.assertTrue(photo.mimetype.startswith("image/"))
                self.assertGreater(len(photo.data), 1000)
        self.assertEqual(self.client.get("/product/no-existe").status_code, 404)
        response = self.post("/cart/add/7750001", {"quantity": "2", "return_to": "product", "product_code": "7750001"}, follow=False)
        self.assertEqual(response.headers["Location"], "/product/7750001")

    def test_repeat_order_uses_current_stock_without_reserving_it(self):
        order_id = self.place_order()
        response = self.post(f"/orders/{order_id}/reorder")
        self.assertEqual(response.status_code, 200)
        with self.client.session_transaction() as state:
            self.assertEqual(state["cart"], {"7750001": 2})
        self.assertEqual(self.stock(), 118)
        self.assertEqual(len(self.store.orders()), 1)
        another = self.app.test_client()
        with another.session_transaction() as state:
            state["_csrf_token"] = "other-token"
        self.assertEqual(another.post(f"/orders/{order_id}/reorder", data={"csrf_token": "other-token"}).status_code, 404)

    def test_repeat_order_fails_atomically_if_stock_was_reduced(self):
        self.post("/cart/add/7750001", {"quantity": "2"})
        self.post("/cart/add/7750002", {"quantity": "2"})
        self.post("/checkout", {"client_id": "0"})
        order_id = self.store.orders()[0]["id"]
        self.post("/cart/add/7750003", {"quantity": "1"})
        self.store.adjust_stock("7750002", -31)
        self.post(f"/orders/{order_id}/reorder")
        with self.client.session_transaction() as state:
            self.assertEqual(state["cart"], {"7750003": 1})
        self.assertEqual(len(self.store.orders()), 1)

    def test_numpy_comparison_and_downloads(self):
        self.role("gerencia")
        raw = self.client.get("/operations/laboratorio").get_data(as_text=True)
        excluded = self.client.get("/operations/laboratorio?exclude=1").get_data(as_text=True)
        self.assertIn("95.00", raw)
        self.assertIn("65.89", raw)
        self.assertIn("76.36", excluded)
        self.assertIn("23.85", excluded)
        python_download = self.client.get("/laboratorio/python")
        self.addCleanup(python_download.close)
        self.assertEqual(python_download.status_code, 200)
        compile(python_download.get_data(as_text=True), "download.py", "exec")
        notebook_download = self.client.get("/laboratorio/notebook")
        self.addCleanup(notebook_download.close)
        self.assertEqual(notebook_download.status_code, 200)
        notebook = json.loads(notebook_download.get_data(as_text=True))
        self.assertEqual(notebook["nbformat"], 4)
        self.assertTrue(any(c["cell_type"] == "code" for c in notebook["cells"]))


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.store = Store(Path(self.directory.name) / "store.db")

    def test_checkout_is_atomic_when_one_of_several_items_is_unavailable(self):
        before = self.store.products()
        with self.assertRaises(ValueError):
            self.store.checkout({"7750001": 2, "7750005": 19}, 0)
        self.assertEqual(self.store.products(), before)
        self.assertEqual(self.store.orders(), [])
        self.assertEqual(self.store.movements(), [])

    def test_exact_integer_quantities_and_valid_clients_are_required(self):
        for cart, client in [
            ({"7750001": True}, 0),
            ({"7750001": 1.5}, 0),
            ({"7750001": -1}, 0),
            ({"missing": 1}, 0),
            ({"7750001": 1}, -1),
        ]:
            with self.subTest(cart=cart, client=client), self.assertRaises(ValueError):
                self.store.checkout(cart, client)
        self.assertEqual(self.store.orders(), [])

    def test_route_only_contains_prepared_orders_in_nearest_neighbor_order(self):
        distant = self.store.checkout({"7750001": 1}, 3)
        close = self.store.checkout({"7750001": 1}, 0)
        pending = self.store.checkout({"7750001": 1}, 1)
        self.store.prepare(distant)
        self.store.prepare(close)
        route = self.store.route()
        self.assertEqual([o["id"] for o in route], [close, distant])
        self.assertNotIn(pending, [o["id"] for o in route])
        self.assertGreater(route[-1]["total_km"], route[0]["total_km"])
        self.store.deliver(close, "Ana", True)
        self.assertEqual([o["id"] for o in self.store.route()], [distant])


if __name__ == "__main__":
    unittest.main()
