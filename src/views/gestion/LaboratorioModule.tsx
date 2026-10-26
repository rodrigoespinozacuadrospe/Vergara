import React from 'react';
import { useApp } from '../../context/AppContext';

export const LaboratorioModule: React.FC = () => {
  const { excludeOutlier, setExcludeOutlier } = useApp();

  const allMinutes = [45, 60, 90, 120, 60, 85, 300, 45, 90, 60, 110, 75];
  const activeData = excludeOutlier ? allMinutes.filter(x => x !== 300) : allMinutes;

  const mean = activeData.reduce((a, b) => a + b, 0) / activeData.length;
  const variance = activeData.reduce((a, b) => a + (b - mean) ** 2, 0) / activeData.length;
  const sd = Math.sqrt(variance);

  const kpis = [
    { label: 'Usuarios analizados', val: activeData.length.toString() },
    { label: 'Media', val: `${mean.toFixed(2)} min` },
    { label: 'Mediana', val: excludeOutlier ? '75 min' : '80 min' },
    { label: 'Desviación estándar', val: `${sd.toFixed(2)} min` }
  ];

  return (
    <>
      <div className="lab-intro">
        <span className="badge purple">S11.s2 · Innovación y transformación digital</span>
        <h2>¿Qué nos dicen 12 usuarios sobre su consumo?</h2>
        <p>
          Una empresa de streaming analiza sus minutos de reproducción. Exploramos el promedio, la dispersión y un posible dato atípico.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
          <a
            className="btn secundario"
            href="/laboratorio/analisis_numpy.py"
            download="analisis_numpy.py"
          >
            ↓ Descargar solución Python
          </a>
          <a
            className="btn secundario"
            href="/laboratorio/Laboratorio_IA_NumPy.ipynb"
            download="Laboratorio_IA_NumPy.ipynb"
          >
            ↓ Cuaderno para Colab
          </a>
        </div>
      </div>

      <div className="kpis dashboard-kpis">
        {kpis.map((k, idx) => (
          <div className="card metric" key={idx}>
            <div className="metric-top">{k.label}</div>
            <strong>{k.val}</strong>
            <small>Población observada · ddof=0</small>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="section-title">
            <h2>Minutos por usuario</h2>
            <label className="toggle">
              <input
                id="exclude-outlier"
                type="checkbox"
                checked={excludeOutlier}
                onChange={e => setExcludeOutlier(e.target.checked)}
              />{' '}
              Comparar sin U7
            </label>
          </div>
          <div className="lab-bars">
            {allMinutes.map((n, i) => {
              const isU7 = i === 6;
              const barHeight = (n / 300) * 190;
              return (
                <div key={i}>
                  <b>{n}</b>
                  <span
                    style={{
                      height: `${barHeight}px`,
                      background: isU7 ? '#e7a54b' : undefined,
                      opacity: isU7 && excludeOutlier ? 0.15 : 1
                    }}
                  />
                  <small>U{i + 1}</small>
                </div>
              );
            })}
          </div>
          <p className="muted">
            U7 se conserva en la gráfica para mostrar el efecto de excluirlo del cálculo. Los datos originales no se modifican.
          </p>
        </section>

        <section className="card">
          <h2>Detección de atípicos: regla del IQR</h2>
          <div className="fila">
            <span>Q1 / Q3</span>
            <b>60 / 95 min</b>
          </div>
          <div className="fila">
            <span>Rango intercuartílico</span>
            <b>35 min</b>
          </div>
          <div className="fila">
            <span>Límites Q1 − 1.5×IQR / Q3 + 1.5×IQR</span>
            <b>7.5 / 147.5</b>
          </div>
          <div className="tip">
            <b>U7: 300 minutos</b>
            <p>
              Supera el límite de 147.5 minutos. Es un dato atípico estadístico; no necesariamente es un error.
            </p>
          </div>
        </section>
      </div>

      <section className="card">
        <h2>Respuestas y recomendación</h2>
        <div className="answer-grid">
          <article>
            <span>01</span>
            <h3>¿Cuánto reproducen?</h3>
            <p>
              La media es <b>95 minutos</b> y la mediana, <b>80 minutos</b>. Sin U7, la media baja a 76.36 minutos: una diferencia de 18.64 minutos.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>¿Se comportan de forma similar?</h3>
            <p>
              Hay dispersión: desviación de <b>65.89 minutos</b> y rango de 255 minutos. Sin U7, la desviación baja a 23.85. Un solo usuario explica buena parte de la variabilidad.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>¿Qué debería hacer la empresa?</h3>
            <p>
              Validar el registro de U7 antes de descartarlo; podría ser un usuario intensivo real. Usar la mediana como referencia robusta y estudiar segmentos de consumo.
            </p>
          </article>
        </div>
        <div className="alerta">
          <b>Alcance de la conclusión</b>
          <p>
            El tiempo reproducido no permite atribuir resultados al recomendador. Se necesitan más usuarios, un periodo definido y una prueba A/B con métricas de satisfacción, retención e interacción.
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Solución reproducible con NumPy</h2>
        <p className="muted">Cuartiles con interpolación lineal; varianza y desviación poblacionales.</p>
        <pre>
          <code>{`import numpy as np
minutos = np.array([45, 60, 90, 120, 60, 85,
                    300, 45, 90, 60, 110, 75])
media = np.mean(minutos)             # 95.0
mediana = np.median(minutos)         # 80.0
varianza = np.var(minutos, ddof=0)   # 4341.67
desviacion = np.std(minutos, ddof=0) # 65.89
q1, q3 = np.percentile(minutos, [25, 75])
iqr = q3 - q1
atipicos = (minutos < q1 - 1.5*iqr) | (minutos > q3 + 1.5*iqr)
sin_atipicos = minutos[~atipicos]
print(minutos[atipicos])             # [300]
print(np.mean(sin_atipicos))         # 76.36`}</code>
        </pre>
      </section>
    </>
  );
};
