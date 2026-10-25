# Stack: detección que refleja lo que de verdad uso

**Fecha:** 2026-10-25 15:52
**Tipo:** Fix
**Requisitos:** M-05 (sigue cumplido; se corrigen los datos)

## Qué se hizo
- Una auditoría de los 23 repositorios encontró que el Stack mostraba 37 herramientas en 21 repositorios, con huecos y errores. Tras el arreglo muestra 67 herramientas en 23 repositorios.
- Los forks cuentan, enteros, si tienen commits propios por delante del original. Entran este portfolio (Astro, Svelte, Cloudflare Workers, Vitest, Playwright, pnpm) y el lakehouse de la academia (Airflow, Polars, PostgreSQL, S3).
- Sin topes de muestreo: se leen todos los `.py` y notebooks de hasta 25 MB, que antes eran 8 y 5 de hasta 5 MB. También `environment.yml`, `Pipfile`, `setup.py` y `build.gradle(.kts)`.
- Python: `import a, b` cuenta todos los módulos; `from google import genai` es el SDK de Gemini; `%pip install` cuenta; `spark.*` sin import es PySpark; `CREATE CATALOG` y `dbutils` delatan Databricks y Unity Catalog. `@dlt.table` es Delta Live Tables de Databricks, no dlt de dltHub (que se mostraba por error).
- El catálogo suma SciPy, imbalanced-learn, GeoPandas, Folium, AnyLogic, Chart.js, Android, Wear OS, Jetpack Compose, Delta Lake, Delta Live Tables, Unity Catalog, Polars, PyArrow, SQLAlchemy, PostgreSQL, S3 (boto3), Cursor, SDK de Gemini, Groq, Render y ruff. También Kotlin, Supabase y Playwright en Python. La categoría «Escritorio» pasa a llamarse «Escritorio y móvil».
- Los archivos dentro de skills y plantillas (`.agents/`, `skills/`, `templates/`) ya no cuentan. Un `pytest.ini` de plantilla sumaba pytest.
- Los HTML, CSS y JS de más de 5 MB (presentaciones o mapas exportados) no cuentan como lenguaje.
- Claude Code se declara en todos los repositorios salvo `Analisis-estadistico-de-experimentos` y `Simulacion`, donde no lo usé. Se configura en `src/content/stack-declarado.ts`.
- El año «desde» sale del primer commit que trajo cada evidencia. «Construyendo desde» enseña año y mes del repositorio más antiguo: 2024-09.
- `--dry` enseña el diff herramienta a herramienta.
- `stack` de los proyectos corregido: en scoring-crediticio se quitan Docker y Anthropic API, que no aparecen en el código ni en el historial, y se añaden Plotly y Render. Los demás suman lo que faltaba (XGBoost, Gemini, Groq, Hugging Face, Tailwind, Vitest, Playwright…) y Claude Code.

## Qué se modificó
- `src/lib/stack.ts`, `src/lib/stack-catalog.ts` y `scripts/actualizar-stack.mjs`.
- Nuevo: `src/content/stack-declarado.ts`.
- Datos: `src/content/stack.json` (regenerado) y `src/content/projects/*.json` (campo `stack`).
- `src/os/apps/stack/Stack.svelte` («construyendo desde» y nota).
- Tests: `src/lib/stack.test.ts`, `src/lib/stack-content.test.ts` y `tests/e2e/m-05-stack.spec.ts`.
- Docs: `docs/features/stack.md` y `docs/architecture.md`.

## Por qué
Agustín sospechaba que el Stack no reflejaba su stack real. La simulación del script contra los repositorios reprodujo exactamente el `stack.json` anterior, así que los errores eran del script y del catálogo, no de datos viejos.
