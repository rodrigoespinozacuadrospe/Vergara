Vergara.views.laboratorio = function () {
 const all=[45,60,90,120,60,85,300,45,90,60,110,75];
 const filtered=!!Vergara.state.excluirAtipico, data=filtered?all.filter(x=>x!==300):all;
 const mean=data.reduce((a,b)=>a+b)/data.length, sd=Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/data.length);
 return `<div class="lab-intro"><span class="badge purple">S11.s2 · Innovación y transformación digital</span><h2>¿Qué nos dicen 12 usuarios sobre su consumo?</h2><p>Una empresa de streaming analiza sus minutos de reproducción. Exploramos el promedio, la dispersión y un posible dato atípico.</p><a class="btn secundario" href="laboratorio/analisis_numpy.py" download>↓ Descargar solución Python</a> <a class="btn secundario" href="laboratorio/Laboratorio_IA_NumPy.ipynb" download>↓ Cuaderno para Colab</a></div>
 <div class="kpis dashboard-kpis">${[['Usuarios analizados',data.length],['Media',mean.toFixed(2)+' min'],['Mediana',filtered?'75 min':'80 min'],['Desviación estándar',sd.toFixed(2)+' min']].map(([k,v])=>`<div class="card metric"><div class="metric-top">${k}</div><strong>${v}</strong><small>Población observada · ddof=0</small></div>`).join('')}</div>
 <div class="dashboard-grid"><section class="card"><div class="section-title"><h2>Minutos por usuario</h2><label class="toggle"><input id="exclude-outlier" type="checkbox" ${filtered?'checked':''}> Comparar sin U7</label></div><div class="lab-bars">${all.map((n,i)=>`<div><b>${n}</b><span style="height:${n/300*190}px;${i===6?'background:#e7a54b':''};${i===6&&filtered?'opacity:.15':''}"></span><small>U${i+1}</small></div>`).join('')}</div><p class="muted">U7 se conserva en la gráfica para mostrar el efecto de excluirlo del cálculo. Los datos originales no se modifican.</p></section>
 <section class="card"><h2>Detección de atípicos: regla del IQR</h2><div class="fila"><span>Q1 / Q3</span><b>60 / 95 min</b></div><div class="fila"><span>Rango intercuartílico</span><b>35 min</b></div><div class="fila"><span>Límites Q1 − 1.5×IQR / Q3 + 1.5×IQR</span><b>7.5 / 147.5</b></div><div class="tip"><b>U7: 300 minutos</b><p>Supera el límite de 147.5 minutos. Es un dato atípico estadístico; no necesariamente es un error.</p></div></section></div>
 <section class="card"><h2>Respuestas y recomendación</h2><div class="answer-grid"><article><span>01</span><h3>¿Cuánto reproducen?</h3><p>La media es <b>95 minutos</b> y la mediana, <b>80 minutos</b>. Sin U7, la media baja a 76.36 minutos: una diferencia de 18.64 minutos.</p></article><article><span>02</span><h3>¿Se comportan de forma similar?</h3><p>Hay dispersión: desviación de <b>65.89 minutos</b> y rango de 255 minutos. Sin U7, la desviación baja a 23.85. Un solo usuario explica buena parte de la variabilidad.</p></article><article><span>03</span><h3>¿Qué debería hacer la empresa?</h3><p>Validar el registro de U7 antes de descartarlo; podría ser un usuario intensivo real. Usar la mediana como referencia robusta y estudiar segmentos de consumo.</p></article></div><div class="alerta"><b>Alcance de la conclusión</b><p>El tiempo reproducido no permite atribuir resultados al recomendador. Se necesitan más usuarios, un periodo definido y una prueba A/B con métricas de satisfacción, retención e interacción.</p></div></section>
 <section class="card"><h2>Solución reproducible con NumPy</h2><p class="muted">Cuartiles con interpolación lineal; varianza y desviación poblacionales.</p><pre><code>import numpy as np
minutos = np.array([45, 60, 90, 120, 60, 85,
                    300, 45, 90, 60, 110, 75])
media = np.mean(minutos)             # 95.0
mediana = np.median(minutos)         # 80.0
varianza = np.var(minutos, ddof=0)   # 4341.67
desviacion = np.std(minutos, ddof=0) # 65.89
q1, q3 = np.percentile(minutos, [25, 75])
iqr = q3 - q1
atipicos = (minutos &lt; q1 - 1.5*iqr) | (minutos &gt; q3 + 1.5*iqr)
sin_atipicos = minutos[~atipicos]
print(minutos[atipicos])             # [300]
print(np.mean(sin_atipicos))         # 76.36</code></pre></section>`;
};
document.addEventListener('change',e=>{if(e.target.id==='exclude-outlier'){Vergara.state.excluirAtipico=e.target.checked;document.getElementById('contenido').innerHTML=Vergara.views.laboratorio();}});
