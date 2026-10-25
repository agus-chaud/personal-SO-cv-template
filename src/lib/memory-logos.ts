/**
 * Los logos del memory (C-05): qué herramienta lleva qué logo. Salen de `simple-icons` (SVG con licencia CC0; las marcas son de sus
 * dueños y aquí solo sirven para nombrar la herramienta), importados uno a uno para que solo entren los que se usan. Este archivo solo lo
 * importa la ventana del memory, que se carga al abrirla.
 *
 * Solo logos que se reconocen a simple vista (decisión de Pol, 2026-10-16): fuera los de nicho aunque estén en el Stack (GitHub Actions, MCP,
 * TanStack, Hono, Zod…). Todos son herramientas del Stack salvo GitHub, que va aparte en `MEMORY_EXTRAS`.
 */
import {
  siAnthropic,
  siApachespark,
  siClaude,
  siDatabricks,
  siDocker,
  siDuckdb,
  siFastapi,
  siGithub,
  siHtml5,
  siHuggingface,
  siJavascript,
  siJupyter,
  siLangchain,
  siNextdotjs,
  siNumpy,
  siPandas,
  siPlotly,
  siPytest,
  siPython,
  siReact,
  siScikitlearn,
  siStreamlit,
  siTailwindcss,
  siTypescript,
  siVercel,
} from 'simple-icons';

/** El trazo de cada logo, en una caja de 24 × 24, por el id de la herramienta (el de `stack.json`, o el de `MEMORY_EXTRAS`). */
export const MEMORY_LOGOS: Readonly<Record<string, string>> = {
  python: siPython.path,
  typescript: siTypescript.path,
  javascript: siJavascript.path,
  'html-css': siHtml5.path,
  jupyter: siJupyter.path,
  pandas: siPandas.path,
  numpy: siNumpy.path,
  'scikit-learn': siScikitlearn.path,
  plotly: siPlotly.path,
  react: siReact.path,
  nextjs: siNextdotjs.path,
  tailwind: siTailwindcss.path,
  streamlit: siStreamlit.path,
  fastapi: siFastapi.path,
  pyspark: siApachespark.path,
  databricks: siDatabricks.path,
  duckdb: siDuckdb.path,
  langchain: siLangchain.path,
  huggingface: siHuggingface.path,
  'claude-code': siClaude.path,
  anthropic: siAnthropic.path,
  docker: siDocker.path,
  vercel: siVercel.path,
  pytest: siPytest.path,
  github: siGithub.path,
};

/** Nombres más cortos que los del Stack, para que quepan en la carta. */
export const MEMORY_NAMES: Readonly<Record<string, string>> = { anthropic: 'Anthropic', pyspark: 'Spark' };

/** Lo que entra en el juego sin estar en el Stack (que cuenta dependencias, no dónde vive el código). */
export const MEMORY_EXTRAS: readonly { id: string; name: string }[] = [{ id: 'github', name: 'GitHub' }];
