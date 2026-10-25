---
title: Messi es un outlier
description: "En estadística, el dato que no encaja se elimina. Messi es ese dato, y eliminarlo sin entender por qué existe es sesgo, no limpieza."
date: 2026-10-24
order: 1
tags: [estadística, ciencia de datos]
---

En estadística, cuando un dato no encaja, se elimina. Se llama outlier.
Messi es ese dato que no encaja.

- 91 goles en un año, un récord que llevaba 40 años sin romperse.
- 900 goles en su carrera.
- 8 Balones de Oro.
- Récord de goles y récord de asistencias en La Liga.
- Habiendo ganado todo, sigue con la misma humildad que cuando ni siquiera había debutado.

Todo eso al mismo tiempo.

Si lo graficás contra cualquier jugador de la historia, cualquier test estadístico lo marca para eliminación. Z-score, IQR, Grubbs: todos lo descartan.

Pero acá está el problema.

En la práctica, se suelen eliminar outliers casi por costumbre. Bakker y Wicherts (2014) simularon lo que pasa cuando se sacan outliers con los umbrales de z-score más comunes: la tasa de falsos positivos puede pasar del 20%. Sacás el dato incómodo y el p-value baja de 0,06 a 0,04. Publicable.

Eliminar un outlier sin entender por qué existe es sesgo, no limpieza.

Los outliers pueden ser tres cosas:

1. **Un error de medición:** lo eliminás.
2. **Ruido aleatorio:** lo tratás con métodos robustos.
3. **Una señal real** de que algo extraordinario está pasando.

Messi es la tercera categoría.
