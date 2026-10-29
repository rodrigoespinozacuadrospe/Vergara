"""Genera el cuaderno de Google Colab a partir de código fuente Python.

Ejecutar ``python colab_launcher.py`` después de modificar las celdas.
El cuaderno resultante es un artefacto generado; no contiene credenciales.
"""

import json
from pathlib import Path
from textwrap import dedent


SETUP = dedent('''\
    from pathlib import Path
    import subprocess
    import sys

    PROJECT_DIR = Path("/content/Vergara")
    if not PROJECT_DIR.exists():
        subprocess.run([
            "git", "clone", "--depth", "1", "--branch", "main",
            "https://github.com/rodrigoespinozacuadrospe/Vergara.git",
            str(PROJECT_DIR),
        ], check=True)
    elif not (PROJECT_DIR / ".git").is_dir():
        raise RuntimeError("/content/Vergara ya existe y no es un repositorio. No se sobrescribió.")

    subprocess.run([
        sys.executable, "-m", "pip", "install", "--quiet",
        "-r", str(PROJECT_DIR / "requirements.lock"),
    ], check=True)
    print("Instalación lista. Ejecuta la siguiente celda.")
''')

START = dedent('''\
    import json
    import socket
    import subprocess
    import sys
    import time
    from urllib.request import urlopen

    # Detener solamente el servidor iniciado por este mismo cuaderno al repetir la celda.
    previous = globals().get("_vergara_process")
    if previous is not None and previous.poll() is None:
        previous.terminate()
        try:
            previous.wait(timeout=10)
        except subprocess.TimeoutExpired:
            previous.kill()
            previous.wait(timeout=5)

    PORT = 3000
    with socket.socket() as port_check:
        port_check.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            port_check.bind(("127.0.0.1", PORT))
        except OSError:
            raise RuntimeError("El puerto 3000 está ocupado por otro proceso. Reinicia el entorno de Colab.") from None
    _vergara_log_path = PROJECT_DIR / "instance" / "colab-server.log"
    _vergara_log_path.parent.mkdir(parents=True, exist_ok=True)
    with _vergara_log_path.open("w") as log:
        _vergara_process = subprocess.Popen([
            sys.executable, "-m", "gunicorn", "--bind", f"0.0.0.0:{PORT}",
            "--workers", "1", "--threads", "2", "app:create_app()",
        ], cwd=PROJECT_DIR, stdout=log, stderr=subprocess.STDOUT)

    for _ in range(60):
        if _vergara_process.poll() is not None:
            raise RuntimeError(_vergara_log_path.read_text())
        try:
            with urlopen(f"http://127.0.0.1:{PORT}/health", timeout=2) as response:
                health = json.load(response)
            if health.get("status") == "ok" and health.get("products") == 8:
                break
        except (OSError, ValueError):
            pass
        time.sleep(1)
    else:
        _vergara_process.terminate()
        raise RuntimeError("El servidor no respondió. Revisa instance/colab-server.log.")

    print("Vergara está funcionando. Ejecuta la última celda para abrir la tienda.")
''')

OPEN = dedent('''\
    from google.colab import output

    output.serve_kernel_port_as_window(PORT, anchor_text="Abrir tienda Vergara")
''')


def notebook():
    cells = [{
        "id": "intro", "cell_type": "markdown", "metadata": {}, "source": [
            "# Vergara · Python + Bootstrap en Google Colab\n",
            "Ejecuta **Entorno de ejecución → Ejecutar todas**. Al terminar, pulsa **Abrir tienda Vergara**.\n\n",
            "La sesión debe seguir conectada. El acceso es temporal y depende de Google Colab; no es un alojamiento permanente.\n",
            "Los datos se guardan en la máquina temporal de Colab y pueden perderse al finalizar la sesión.\n\n",
            "Cuaderno generado desde `colab_launcher.py`. La aplicación y las celdas están escritas en Python.\n",
            "La selección de roles es una demostración; no utilices datos personales o de producción.\n",
        ],
    }]
    for index, source in enumerate((SETUP, START, OPEN), 1):
        cells.append({"id": f"step-{index}", "cell_type": "code", "execution_count": None, "metadata": {},
                      "outputs": [], "source": source.splitlines(keepends=True)})
    return {"cells": cells, "metadata": {
        "colab": {"name": "Ejecutar_Vergara.ipynb", "provenance": []},
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python"},
    }, "nbformat": 4, "nbformat_minor": 5}


if __name__ == "__main__":
    destination = Path(__file__).resolve().parent / "colab" / "Ejecutar_Vergara.ipynb"
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps(notebook(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Cuaderno generado: {destination.name}")
