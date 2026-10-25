"""Laboratorio S11.s2: tiempos de reproducción. Ejecutar: python analisis_numpy.py."""
import numpy as np

minutos = np.array([45, 60, 90, 120, 60, 85, 300, 45, 90, 60, 110, 75])

def resumen(datos):
    return {
        "usuarios": int(datos.size),
        "media": float(np.mean(datos)),
        "mediana": float(np.median(datos)),
        "varianza_poblacional": float(np.var(datos, ddof=0)),
        "desviacion_poblacional": float(np.std(datos, ddof=0)),
        "minimo": int(np.min(datos)),
        "maximo": int(np.max(datos)),
    }

q1, q3 = np.percentile(minutos, [25, 75], method="linear")
iqr = q3 - q1
inferior, superior = q1 - 1.5 * iqr, q3 + 1.5 * iqr
atipicos = (minutos < inferior) | (minutos > superior)
sin_atipicos = minutos[~atipicos]

if __name__ == "__main__":
    print("Todos los usuarios:", resumen(minutos))
    print(f"Q1={q1}, Q3={q3}, IQR={iqr}, límites=[{inferior}, {superior}]")
    print("Usuarios atípicos (índice desde 1):", np.flatnonzero(atipicos) + 1)
    print("Minutos atípicos:", minutos[atipicos])
    print("Comparación sin atípicos:", resumen(sin_atipicos))
    print("Recomendación: validar U7, conservar los datos originales y usar la mediana como referencia robusta.")
    print("Los tiempos por sí solos no prueban la eficacia del recomendador; se requiere una prueba A/B y otras métricas.")
