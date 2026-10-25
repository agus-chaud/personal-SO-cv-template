/**
 * Catálogo del Stack (M-05): qué dependencias, lenguajes y archivos cuentan como cada herramienta. Lo que no está aquí
 * no aparece en la ventana, así no salen librerías menores. Lo usa scripts/actualizar-stack.mjs sin compilar, así que
 * solo lleva sintaxis que Node ejecuta tal cual.
 */

export const CATEGORIES = [
  { id: 'lenguajes', label: 'Lenguajes' },
  { id: 'ml', label: 'Ciencia de datos y ML' },
  { id: 'interfaz', label: 'Interfaz' },
  { id: 'escritorio', label: 'Escritorio' },
  { id: 'datos', label: 'Datos y servidor' },
  { id: 'ia', label: 'IA' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'publicacion', label: 'Publicación' },
  { id: 'calidad', label: 'Calidad' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export interface ToolDef {
  id: string;
  name: string;
  category: CategoryId;
  /** Nombres exactos de dependencias de `package.json`. Las de Cargo van como `cargo:nombre` y las de Python como `py:nombre`. */
  deps?: string[];
  /** Prefijos de dependencias (`@radix-ui/` cubre todos sus paquetes). */
  depPrefixes?: string[];
  /** Lenguajes de GitHub. Cuenta si superan el 5 % del código del repositorio. */
  languages?: string[];
  /** Archivos que delatan la herramienta: la ruta completa, o el nombre en cualquier carpeta. */
  files?: string[];
  /**
   * Año en que la herramienta existió por primera vez. El año que se enseña no puede ser anterior: un repositorio de 2023
   * puede haber recibido un `CLAUDE.md` en 2026, pero Claude Code no existía en 2023.
   */
  introduced?: number;
}

export const TOOLS: readonly ToolDef[] = [
  // Lenguajes
  { id: 'typescript', name: 'TypeScript', category: 'lenguajes', languages: ['TypeScript'], deps: ['typescript'] },
  { id: 'javascript', name: 'JavaScript', category: 'lenguajes', languages: ['JavaScript'] },
  { id: 'html-css', name: 'HTML y CSS', category: 'lenguajes', languages: ['HTML', 'CSS'] },
  // Los notebooks cuentan como Python, igual que cualquier librería de Python detectada.
  { id: 'python', name: 'Python', category: 'lenguajes', languages: ['Python', 'Jupyter Notebook'], depPrefixes: ['py:'] },
  { id: 'rust', name: 'Rust', category: 'lenguajes', languages: ['Rust'], deps: ['cargo:tauri'] },
  { id: 'swift', name: 'Swift', category: 'lenguajes', languages: ['Swift'] },
  { id: 'sql', name: 'SQL (Postgres)', category: 'lenguajes', languages: ['PLpgSQL'] },
  // Ciencia de datos y ML (las de Python van con su nombre de pip y, si es otro, con el del import)
  { id: 'jupyter', name: 'Jupyter', category: 'ml', languages: ['Jupyter Notebook'] },
  { id: 'pandas', name: 'pandas', category: 'ml', deps: ['py:pandas'] },
  { id: 'numpy', name: 'NumPy', category: 'ml', deps: ['py:numpy'] },
  { id: 'scikit-learn', name: 'scikit-learn', category: 'ml', deps: ['py:scikit-learn', 'py:sklearn'] },
  { id: 'xgboost', name: 'XGBoost', category: 'ml', deps: ['py:xgboost'] },
  { id: 'lightgbm', name: 'LightGBM', category: 'ml', deps: ['py:lightgbm'] },
  { id: 'pytorch', name: 'PyTorch', category: 'ml', deps: ['py:torch', 'py:torchvision'] },
  { id: 'statsmodels', name: 'statsmodels', category: 'ml', deps: ['py:statsmodels'] },
  { id: 'pymc', name: 'PyMC', category: 'ml', deps: ['py:pymc', 'py:pymc-marketing'] },
  { id: 'matplotlib', name: 'Matplotlib', category: 'ml', deps: ['py:matplotlib'] },
  { id: 'seaborn', name: 'seaborn', category: 'ml', deps: ['py:seaborn'] },
  { id: 'plotly', name: 'Plotly', category: 'ml', deps: ['py:plotly'] },
  // Interfaz
  { id: 'react', name: 'React', category: 'interfaz', deps: ['react', 'react-dom'] },
  { id: 'nextjs', name: 'Next.js', category: 'interfaz', deps: ['next'] },
  { id: 'astro', name: 'Astro', category: 'interfaz', deps: ['astro'], languages: ['Astro'] },
  { id: 'svelte', name: 'Svelte', category: 'interfaz', deps: ['svelte', '@sveltejs/kit'], languages: ['Svelte'] },
  { id: 'vite', name: 'Vite', category: 'interfaz', deps: ['vite'] },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'interfaz', deps: ['tailwindcss'] },
  { id: 'shadcn', name: 'shadcn/ui', category: 'interfaz', files: ['components.json'], introduced: 2023 },
  { id: 'radix', name: 'Radix UI', category: 'interfaz', depPrefixes: ['@radix-ui/'] },
  { id: 'threejs', name: 'Three.js', category: 'interfaz', deps: ['three'] },
  { id: 'streamlit', name: 'Streamlit', category: 'interfaz', deps: ['py:streamlit'] },
  { id: 'tanstack', name: 'TanStack', category: 'interfaz', depPrefixes: ['@tanstack/'], introduced: 2022 },
  // Escritorio
  { id: 'tauri', name: 'Tauri', category: 'escritorio', deps: ['@tauri-apps/cli', '@tauri-apps/api', 'cargo:tauri'], introduced: 2022 },
  // Datos y servidor
  { id: 'supabase', name: 'Supabase', category: 'datos', deps: ['@supabase/supabase-js', '@supabase/ssr'], files: ['supabase/config.toml'] },
  { id: 'cloudflare', name: 'Cloudflare Workers', category: 'datos', deps: ['wrangler', '@cloudflare/workers-types'], files: ['wrangler.jsonc', 'wrangler.toml', 'wrangler.json'] },
  { id: 'hono', name: 'Hono', category: 'datos', deps: ['hono'], introduced: 2022 },
  { id: 'upstash', name: 'Upstash', category: 'datos', depPrefixes: ['@upstash/'] },
  { id: 'zod', name: 'Zod', category: 'datos', deps: ['zod'] },
  { id: 'fastapi', name: 'FastAPI', category: 'datos', deps: ['py:fastapi'] },
  { id: 'pyspark', name: 'PySpark', category: 'datos', deps: ['py:pyspark'] },
  { id: 'databricks', name: 'Databricks', category: 'datos', deps: ['py:databricks', 'py:databricks-sdk', 'py:delta', 'py:delta-spark'], files: ['databricks.yml'] },
  { id: 'dbt', name: 'dbt', category: 'datos', depPrefixes: ['py:dbt-'], files: ['dbt_project.yml'] },
  { id: 'duckdb', name: 'DuckDB', category: 'datos', deps: ['py:duckdb'] },
  { id: 'airflow', name: 'Airflow', category: 'datos', deps: ['py:airflow', 'py:apache-airflow'] },
  { id: 'dlt', name: 'dlt', category: 'datos', deps: ['py:dlt'] },
  // IA
  { id: 'claude-code', name: 'Claude Code', category: 'ia', files: ['CLAUDE.md'], introduced: 2025 },
  { id: 'anthropic', name: 'SDK de Anthropic', category: 'ia', deps: ['@anthropic-ai/sdk', 'py:anthropic'], introduced: 2023 },
  { id: 'mcp', name: 'MCP', category: 'ia', deps: ['@modelcontextprotocol/sdk', 'mcp-handler', 'py:mcp', 'py:fastmcp'], introduced: 2024 },
  { id: 'langchain', name: 'LangChain', category: 'ia', depPrefixes: ['py:langchain'], introduced: 2022 },
  { id: 'langgraph', name: 'LangGraph', category: 'ia', deps: ['py:langgraph'], introduced: 2024 },
  { id: 'faiss', name: 'FAISS', category: 'ia', deps: ['py:faiss', 'py:faiss-cpu', 'py:faiss-gpu'] },
  { id: 'huggingface', name: 'Hugging Face', category: 'ia', deps: ['py:transformers', 'py:sentence-transformers', 'py:huggingface-hub'] },
  { id: 'vercel-ai', name: 'Vercel AI SDK', category: 'ia', deps: ['ai'], depPrefixes: ['@ai-sdk/'], introduced: 2023 },
  { id: 'openai', name: 'SDK de OpenAI', category: 'ia', deps: ['openai', 'py:openai'] },
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'ia', deps: ['elevenlabs'], depPrefixes: ['@elevenlabs/'] },
  // Servicios
  { id: 'resend', name: 'Resend', category: 'servicios', deps: ['resend'], introduced: 2023 },
  { id: 'twilio', name: 'Twilio', category: 'servicios', deps: ['twilio'] },
  { id: 'stripe', name: 'Stripe', category: 'servicios', deps: ['stripe'] },
  { id: 'liveblocks', name: 'Liveblocks', category: 'servicios', depPrefixes: ['@liveblocks/'] },
  { id: 'mapbox', name: 'Mapbox', category: 'servicios', deps: ['mapbox-gl'] },
  // Publicación
  { id: 'vercel', name: 'Vercel', category: 'publicacion', deps: ['@vercel/analytics', '@vercel/speed-insights'], files: ['vercel.json'] },
  { id: 'pnpm', name: 'pnpm', category: 'publicacion', files: ['pnpm-lock.yaml', 'pnpm-workspace.yaml'] },
  { id: 'github-actions', name: 'GitHub Actions', category: 'publicacion', files: ['.github/workflows'] },
  { id: 'docker', name: 'Docker', category: 'publicacion', files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yaml'] },
  // Calidad
  { id: 'vitest', name: 'Vitest', category: 'calidad', deps: ['vitest'], introduced: 2022 },
  { id: 'playwright', name: 'Playwright', category: 'calidad', deps: ['@playwright/test', 'playwright'] },
  { id: 'eslint', name: 'ESLint', category: 'calidad', deps: ['eslint'] },
  { id: 'pytest', name: 'pytest', category: 'calidad', deps: ['py:pytest'], files: ['pytest.ini', 'conftest.py'] },
];
