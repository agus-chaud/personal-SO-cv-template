import { describe, expect, test } from 'vitest';
import { CATEGORIES, TOOLS } from './stack-catalog';
import { barPercent, buildTools, byYear, groupByCategory, pythonDeps, sameData, summary, usesTool, type RepoFacts, type StackData } from './stack';

const repo = (over: Partial<RepoFacts> = {}): RepoFacts => ({ createdYear: 2025, languages: {}, deps: [], files: [], ...over });
const tool = (id: string) => TOOLS.find((t) => t.id === id)!;

describe('usesTool: cuándo un repositorio usa una herramienta', () => {
  test('por dependencia: react-dom cuenta como React', () => {
    expect(usesTool(repo({ deps: ['react-dom'] }), tool('react'))).toBe(true);
    expect(usesTool(repo({ deps: ['preact'] }), tool('react'))).toBe(false);
  });

  test('por prefijo: cualquier paquete de @radix-ui cuenta como Radix UI', () => {
    expect(usesTool(repo({ deps: ['@radix-ui/react-select'] }), tool('radix'))).toBe(true);
    expect(usesTool(repo({ deps: ['radix-ui-falso'] }), tool('radix'))).toBe(false);
  });

  test('por archivo: CLAUDE.md es Claude Code, y wrangler.jsonc en una subcarpeta es Cloudflare', () => {
    expect(usesTool(repo({ files: ['CLAUDE.md'] }), tool('claude-code'))).toBe(true);
    expect(usesTool(repo({ files: ['packages/server/wrangler.jsonc'] }), tool('cloudflare'))).toBe(true);
    expect(usesTool(repo({ files: ['docs/CLAUDE.mdx'] }), tool('claude-code'))).toBe(false);
  });

  test('por carpeta: cualquier archivo de .github/workflows cuenta como GitHub Actions', () => {
    expect(usesTool(repo({ files: ['.github/workflows/ci.yml'] }), tool('github-actions'))).toBe(true);
    expect(usesTool(repo({ files: ['docs/.github-no/workflows'] }), tool('github-actions'))).toBe(false);
  });

  test('por lenguaje: solo si supera el 5 % del código (si no, HTML y CSS saldrían en todos)', () => {
    expect(usesTool(repo({ languages: { TypeScript: 900, HTML: 100 } }), tool('html-css'))).toBe(true);
    expect(usesTool(repo({ languages: { TypeScript: 990, HTML: 10 } }), tool('html-css'))).toBe(false);
    expect(usesTool(repo({ languages: {} }), tool('html-css'))).toBe(false);
  });

  test('Tauri también se detecta por Cargo, y entonces Rust cuenta', () => {
    const tauri = repo({ deps: ['cargo:tauri'] });
    expect(usesTool(tauri, tool('tauri'))).toBe(true);
    expect(usesTool(tauri, tool('rust'))).toBe(true);
  });

  test('un repositorio de notebooks cuenta como Python aunque el código .py sea poco', () => {
    expect(usesTool(repo({ languages: { 'Jupyter Notebook': 980, Python: 20 } }), tool('python'))).toBe(true);
  });

  test('las librerías de Python se detectan por su nombre de pip o por el del import', () => {
    expect(usesTool(repo({ deps: ['py:scikit-learn'] }), tool('scikit-learn'))).toBe(true);
    expect(usesTool(repo({ deps: ['py:sklearn'] }), tool('scikit-learn'))).toBe(true);
    expect(usesTool(repo({ deps: ['py:torch'] }), tool('pytorch'))).toBe(true);
    expect(usesTool(repo({ deps: ['py:langchain-community'] }), tool('langchain'))).toBe(true);
    expect(usesTool(repo({ deps: ['py:pandas'] }), tool('scikit-learn'))).toBe(false);
  });

  test('las librerías de Python cuentan como Python', () => {
    expect(usesTool(repo({ deps: ['py:pandas'] }), tool('python'))).toBe(true);
  });
});

describe('pythonDeps: dependencias de Python', () => {
  test('requirements.txt: nombre normalizado, sin versiones, extras, comentarios ni opciones', () => {
    const txt = '# base\npandas>=2.0\nscikit_learn==1.5 # ML\nfastapi[standard]\n-r dev.txt\n\nPyMC-Marketing';
    expect(pythonDeps('requirements.txt', txt)).toEqual(['py:pandas', 'py:scikit-learn', 'py:fastapi', 'py:pymc-marketing']);
  });

  test('pyproject.toml: las listas de dependencias y las de Poetry', () => {
    const toml = '[project]\nname = "demo"\ndependencies = [\n  "langgraph>=0.2",\n  "duckdb",\n]\n[tool.poetry.dependencies]\npython = "^3.12"\nxgboost = "^2"\n';
    expect(pythonDeps('pyproject.toml', toml)).toEqual(['py:langgraph', 'py:duckdb', 'py:xgboost']);
  });

  test('archivos .py: los módulos que se importan', () => {
    const code = 'import pandas as pd\nfrom sklearn.model_selection import train_test_split\nimport os, json\n  from torch import nn\nx = "import falso"';
    expect(pythonDeps('src/train.py', code)).toEqual(['py:pandas', 'py:sklearn', 'py:os', 'py:torch']);
  });

  test('notebooks: los imports de las celdas de código, no los del texto', () => {
    const nb = JSON.stringify({
      cells: [
        { cell_type: 'markdown', source: ['import matplotlib\n'] },
        { cell_type: 'code', source: ['import numpy as np\n', 'from pyspark.sql import functions as F\n'] },
        { cell_type: 'code', source: 'import seaborn as sns' },
      ],
    });
    expect(pythonDeps('analisis.ipynb', nb)).toEqual(['py:numpy', 'py:pyspark', 'py:seaborn']);
  });

  test('un notebook roto o un archivo desconocido no tumban el análisis', () => {
    expect(pythonDeps('roto.ipynb', '{no es json')).toEqual([]);
    expect(pythonDeps('README.md', 'import pandas')).toEqual([]);
  });
});

describe('buildTools', () => {
  const repos = [
    repo({ createdYear: 2024, deps: ['react', 'react-dom', 'next', 'tailwindcss'], languages: { TypeScript: 100 } }),
    repo({ createdYear: 2025, deps: ['react', 'react-dom', 'vitest'], files: ['CLAUDE.md'], languages: { TypeScript: 100 } }),
    repo({ createdYear: 2026, deps: ['astro'], files: ['CLAUDE.md'], languages: { Astro: 100 } }),
  ];
  const tools = buildTools(repos);
  const by = (id: string) => tools.find((t) => t.id === id)!;

  test('cuenta en cuántos repositorios aparece cada herramienta', () => {
    expect(by('react').repos).toBe(2);
    expect(by('typescript').repos).toBe(2);
    expect(by('claude-code').repos).toBe(2);
    expect(by('nextjs').repos).toBe(1);
  });

  test('el año es el del primer repositorio donde aparece', () => {
    expect(by('react').since).toBe(2024);
    expect(by('claude-code').since).toBe(2025);
    expect(by('astro').since).toBe(2026);
  });

  test('el año nunca es anterior a la existencia de la herramienta (un repo de 2023 con CLAUDE.md no usa Claude Code desde 2023)', () => {
    const old = buildTools([repo({ createdYear: 2023, files: ['CLAUDE.md'], deps: ['react'] })]);
    expect(old.find((t) => t.id === 'claude-code')!.since).toBe(2025);
    expect(old.find((t) => t.id === 'react')!.since).toBe(2023);
  });

  test('lo que no aparece en ningún repositorio no sale, y lo que no está en el catálogo tampoco', () => {
    expect(tools.find((t) => t.id === 'swift')).toBeUndefined();
    expect(buildTools([repo({ deps: ['una-libreria-menor'] })])).toEqual([]);
  });

  test('sale ordenado por categoría, luego por uso y luego por nombre', () => {
    const order = CATEGORIES.map((c) => c.id);
    const categories = tools.map((t) => order.indexOf(t.category));
    expect(categories).toEqual([...categories].sort((a, b) => a - b));
    const interfaz = tools.filter((t) => t.category === 'interfaz');
    expect(interfaz[0].id).toBe('react');
  });

  test('sin repositorios no hay herramientas', () => {
    expect(buildTools([])).toEqual([]);
  });

  test('cada herramienta del catálogo tiene un id único y una categoría que existe', () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TOOLS) expect(CATEGORIES.some((c) => c.id === t.category), t.id).toBe(true);
  });
});

describe('presentación', () => {
  const tools = buildTools([
    repo({ createdYear: 2023, deps: ['react-dom'], languages: { JavaScript: 100 } }),
    repo({ createdYear: 2026, deps: ['react-dom', 'astro'], files: ['CLAUDE.md'] }),
  ]);

  test('groupByCategory conserva el orden del catálogo y omite las categorías vacías', () => {
    const groups = groupByCategory(tools);
    expect(groups.map((g) => g.id)).toEqual(['lenguajes', 'interfaz', 'ia']);
    expect(groups.every((g) => g.tools.length > 0)).toBe(true);
  });

  test('barPercent es proporcional al más usado y siempre se ve algo', () => {
    expect(barPercent(10, 10)).toBe(100);
    expect(barPercent(5, 10)).toBe(50);
    expect(barPercent(1, 100)).toBe(4);
    expect(barPercent(0, 10)).toBe(0);
    expect(barPercent(3, 0)).toBe(0);
  });

  test('byYear agrupa por año de primer uso, del más antiguo al más reciente', () => {
    const years = byYear(tools);
    expect(years.map((y) => y.year)).toEqual([2023, 2026]);
    expect(years[0].tools).toContain('React');
    expect(years[1].tools).toEqual(expect.arrayContaining(['Astro', 'Claude Code']));
  });

  test('summary da el número de herramientas y de repositorios', () => {
    expect(summary({ repos: { total: 12, public: 3, private: 9 }, tools })).toEqual({ tools: tools.length, repos: 12 });
  });

  test('sameData ignora la fecha de generación pero no los datos', () => {
    const a: StackData = { generatedAt: '2026-10-01', repos: { total: 1, public: 1, private: 0 }, tools };
    expect(sameData(a, { ...a, generatedAt: '2026-10-09' })).toBe(true);
    expect(sameData(a, { ...a, repos: { total: 2, public: 2, private: 0 } })).toBe(false);
    expect(sameData(a, { ...a, tools: tools.slice(1) })).toBe(false);
  });
});
