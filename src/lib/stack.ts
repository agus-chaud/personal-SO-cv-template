/**
 * Lógica pura del Stack (M-05): de los datos de cada repositorio a lo que enseña la ventana. La usan
 * scripts/actualizar-stack.mjs (sin compilar), la ventana y los tests, así que solo lleva sintaxis que Node ejecuta
 * tal cual y nada de `node:`.
 */
import { CATEGORIES, TOOLS, type CategoryId, type ToolDef } from './stack-catalog.ts';

/** Lo que el script averigua de cada repositorio. Nunca lleva su nombre. */
export interface RepoFacts {
  createdYear: number;
  /** Bytes de código por lenguaje, como los da GitHub. */
  languages: Record<string, number>;
  /** Dependencias de todos sus `package.json`, las de Cargo como `cargo:nombre` y las de Python como `py:nombre`. */
  deps: string[];
  /** Rutas de los archivos del repositorio. */
  files: string[];
  /** Ids de herramientas que el autor declara haber usado aunque el código no lo delate (Claude Code). */
  declared?: string[];
  /**
   * Año del primer commit que trajo cada evidencia: la clave es una dependencia de `deps` o una ruta de `files`. Lo que
   * no esté aquí toma el año de creación del repositorio.
   */
  evidenceYears?: Record<string, number>;
}

export interface StackTool {
  id: string;
  name: string;
  category: CategoryId;
  /** En cuántos repositorios aparece. */
  repos: number;
  /** Año del primer repositorio en que aparece. */
  since: number;
}

export interface StackData {
  generatedAt: string;
  /** `since`: año y mes (`2024-09`) del repositorio más antiguo de los analizados. */
  repos: { total: number; public: number; private: number; since?: string };
  tools: StackTool[];
}

/** Nombre de un paquete de Python como lo compara pip: en minúsculas y con `_` o `.` como `-`. */
const pyName = (name: string) => `py:${name.toLowerCase().replace(/[_.]+/g, '-')}`;
const unique = (list: string[]) => [...new Set(list)];

/** El paquete de un módulo importado: casi siempre su primer nombre, salvo los SDK que viven dentro de `google`. */
function moduleToPackage(dotted: string, names = ''): string {
  if (dotted === 'google' && /\bgenai\b/.test(names)) return 'google-genai';
  if (dotted === 'google.genai' || dotted.startsWith('google.genai.')) return 'google-genai';
  if (dotted === 'google.generativeai' || dotted.startsWith('google.generativeai.')) return 'google-generativeai';
  return dotted.split('.')[0];
}

/** Los módulos que importa un código de Python, todos los de `import a, b`. */
function importsOf(code: string): string[] {
  const found: string[] = [];
  for (const line of code.split('\n')) {
    const from = line.match(/^[ \t]*from[ \t]+([A-Za-z_][\w.]*)[ \t]+import[ \t]+([^#\n]*)/);
    if (from) {
      found.push(pyName(moduleToPackage(from[1], from[2])));
      continue;
    }
    const plain = line.match(/^[ \t]*import[ \t]+([^#\n;]+)/);
    if (!plain) continue;
    for (const part of plain[1].split(',')) {
      const dotted = part.trim().split(/\s+/)[0];
      if (/^[A-Za-z_][\w.]*$/.test(dotted)) found.push(pyName(moduleToPackage(dotted)));
    }
  }
  return found;
}

/** Los paquetes de `%pip install` y `!pip install` de un notebook. */
function pipInstalls(code: string): string[] {
  const found: string[] = [];
  for (const [, args] of code.matchAll(/^[ \t]*[%!][ \t]*(?:pip3?|uv[ \t]+pip|conda)[ \t]+install[ \t]+([^\n]*)/gm)) {
    for (const arg of args.trim().split(/\s+/)) {
      const name = arg.startsWith('-') ? null : arg.match(/^[A-Za-z0-9][A-Za-z0-9._-]*/)?.[0];
      if (name) found.push(pyName(name));
    }
  }
  return found;
}

/** Lo que delata el código sin importarlo: la sesión `spark` de Databricks y su SQL de Unity Catalog. */
function implicitDeps(code: string): string[] {
  const found: string[] = [];
  if (/\bspark\.(?:sql|read|readStream|table|createDataFrame|range)\b/.test(code)) found.push('py:pyspark');
  // `%sql` no basta: también es la magia de JupySQL.
  if (/\bdbutils\.|\bCREATE[ \t]+CATALOG\b/i.test(code)) found.push('sql:databricks');
  if (/\bCREATE[ \t]+CATALOG\b|\bON[ \t]+CATALOG\b/i.test(code)) found.push('sql:unity-catalog');
  return found;
}

/** Las dependencias de un código de Python: lo que importa y lo que usa sin importar. */
function codeDeps(code: string): string[] {
  const deps = [...importsOf(code), ...implicitDeps(code)];
  // Delta Live Tables de Databricks también se importa como `dlt`, igual que dlt de dltHub: lo delatan sus decoradores.
  if (/@dlt\.(?:table|view|expect\w*)\b|\bdlt\.read(?:_stream)?\(/.test(code)) return [...deps.filter((d) => d !== 'py:dlt'), 'databricks:delta-live-tables'];
  return deps;
}

function requirementsDeps(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter((line) => line && !line.startsWith('-'))
    .map((line) => line.match(/^[A-Za-z0-9][A-Za-z0-9._-]*/)?.[0])
    .filter((name): name is string => !!name)
    .map(pyName);
}

function pyprojectDeps(text: string): string[] {
  const names: string[] = [];
  for (const [, list] of text.matchAll(/dependencies\s*=\s*\[([\s\S]*?)\]/g)) {
    for (const [, name] of list.matchAll(/["']([A-Za-z0-9][A-Za-z0-9._-]*)/g)) names.push(name);
  }
  const poetry = text.match(/^\[tool\.poetry\.dependencies\]\s*\n([\s\S]*?)(?=^\[|$(?![\s\S]))/m)?.[1] ?? '';
  for (const [, name] of poetry.matchAll(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*=/gm)) if (name.toLowerCase() !== 'python') names.push(name);
  // ruff no es una dependencia: se configura en su propia sección.
  if (/^\[tool\.ruff[\].]/m.test(text)) names.push('ruff');
  return names.map(pyName);
}

/** environment.yml de conda: la lista `dependencies`, incluida su sublista `pip`. */
function condaDeps(text: string): string[] {
  const names: string[] = [];
  let inside = false;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) inside = /^dependencies\s*:/.test(line);
    else if (inside) {
      const name = line.match(/^\s*-\s*([A-Za-z0-9][A-Za-z0-9._-]*)/)?.[1];
      if (name && !['python', 'pip'].includes(name.toLowerCase())) names.push(name);
    }
  }
  return names.map(pyName);
}

/** Pipfile: las secciones `[packages]` y `[dev-packages]`. */
function pipfileDeps(text: string): string[] {
  const names: string[] = [];
  let inside = false;
  for (const line of text.split('\n')) {
    const section = line.match(/^\s*\[([^\]]+)\]/)?.[1];
    if (section) inside = section === 'packages' || section === 'dev-packages';
    else if (inside) {
      const name = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*=/)?.[1];
      if (name) names.push(name);
    }
  }
  return names.map(pyName);
}

/** setup.py: `install_requires`, además de lo que importa. */
function setupDeps(text: string): string[] {
  const names: string[] = [];
  for (const [, list] of text.matchAll(/install_requires\s*=\s*\[([\s\S]*?)\]/g)) {
    for (const [, name] of list.matchAll(/["']([A-Za-z0-9][A-Za-z0-9._-]*)/g)) names.push(name);
  }
  return [...names.map(pyName), ...codeDeps(text)];
}

function notebookDeps(text: string): string[] {
  try {
    const cells: { cell_type?: string; source?: string | string[] }[] = JSON.parse(text).cells ?? [];
    const code = cells
      .filter((c) => c.cell_type === 'code')
      .map((c) => (Array.isArray(c.source) ? c.source.join('') : (c.source ?? '')))
      .join('\n');
    return [...codeDeps(code), ...pipInstalls(code)];
  } catch {
    return [];
  }
}

/**
 * Las librerías de Python de un archivo, como `py:nombre`: requirements, pyproject.toml, environment.yml, Pipfile,
 * setup.py, código `.py` o notebooks. El SQL de Databricks sale como `sql:databricks` y `sql:unity-catalog`, y Delta Live
 * Tables como `databricks:delta-live-tables`.
 */
export function pythonDeps(path: string, text: string): string[] {
  const name = path.split('/').pop() ?? path;
  if (/^requirements.*\.txt$/i.test(name)) return unique(requirementsDeps(text));
  if (name === 'pyproject.toml') return unique(pyprojectDeps(text));
  if (/^environment\.ya?ml$/.test(name)) return unique(condaDeps(text));
  if (name === 'Pipfile') return unique(pipfileDeps(text));
  if (name === 'setup.py') return unique(setupDeps(text));
  if (name.endsWith('.py')) return unique(codeDeps(text));
  if (name.endsWith('.ipynb')) return unique(notebookDeps(text));
  return [];
}

const gradleName = (name: string) => `gradle:${name.toLowerCase().replace(/[-_:]+/g, '.')}`;

/** Las dependencias de un `build.gradle(.kts)`, como `gradle:grupo.nombre`: alias `libs.…` y coordenadas `"grupo:nombre:versión"`. */
export function gradleDeps(path: string, text: string): string[] {
  if (!/\.gradle(\.kts)?$/.test(path)) return [];
  const found: { at: number; dep: string }[] = [];
  for (const m of text.matchAll(/\blibs\.((?!plugins\.|versions\.|bundles\.)[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)/g)) found.push({ at: m.index ?? 0, dep: gradleName(m[1]) });
  for (const m of text.matchAll(/["']([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)(?::[^"'\s]*)?["']/g)) found.push({ at: m.index ?? 0, dep: gradleName(`${m[1]}.${m[2]}`) });
  return unique(found.sort((a, b) => a.at - b.at).map((f) => f.dep));
}

/** Por encima de este tamaño, un HTML, CSS o JS es casi seguro generado (una presentación, un mapa exportado). */
export const LARGE_FILE_BYTES = 5 * 1024 * 1024;
const LANGUAGE_BY_EXTENSION: Record<string, string> = { html: 'HTML', htm: 'HTML', css: 'CSS', js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript' };

/** Los bytes por lenguaje sin los archivos enormes, que inflarían un lenguaje que nadie escribió a mano. */
export function withoutLargeFiles(languages: Record<string, number>, blobs: readonly { path: string; size: number }[], limit = LARGE_FILE_BYTES): Record<string, number> {
  const result = { ...languages };
  for (const { path, size } of blobs) {
    const language = LANGUAGE_BY_EXTENSION[path.split('.').pop()?.toLowerCase() ?? ''];
    if (size > limit && language && language in result) result[language] = Math.max(0, result[language] - size);
  }
  return result;
}

/** Un lenguaje cuenta si supera este porcentaje del código del repositorio (si no, HTML y CSS saldrían en todos). */
export const LANGUAGE_MIN_SHARE = 5;

/** Las skills de agentes y las plantillas traen archivos de ejemplo (un `pytest.ini`) que no son del proyecto. */
export const isSkillOrTemplate = (path: string) => /(^|\/)(\.agents|skills|templates)\//.test(path);

const fileMatches = (path: string, wanted: string) =>
  path === wanted || path.endsWith(`/${wanted}`) || path.startsWith(`${wanted}/`) || path.includes(`/${wanted}/`);

/**
 * Las evidencias de que un repositorio usa una herramienta: las dependencias y rutas que la delatan, o `lang:` y
 * `declared` cuando cuenta por lenguaje o por declaración del autor. Vacío si no la usa.
 */
export function evidenceOf(repo: RepoFacts, tool: ToolDef): string[] {
  const total = Object.values(repo.languages).reduce((sum, b) => sum + b, 0);
  const languages = (tool.languages ?? []).filter((name) => total > 0 && ((repo.languages[name] ?? 0) / total) * 100 >= LANGUAGE_MIN_SHARE);
  const deps = repo.deps.filter((dep) => (tool.deps ?? []).includes(dep) || (tool.depPrefixes ?? []).some((p) => dep.startsWith(p)));
  const own = repo.files.filter((f) => !isSkillOrTemplate(f));
  const files = own.filter(
    (f) => (tool.files ?? []).some((wanted) => fileMatches(f, wanted)) || (tool.extensions ?? []).some((ext) => f.toLowerCase().endsWith(`.${ext}`)),
  );
  const declared = repo.declared?.includes(tool.id) ? ['declared'] : [];
  return [...languages.map((l) => `lang:${l}`), ...deps, ...files, ...declared];
}

export const usesTool = (repo: RepoFacts, tool: ToolDef) => evidenceOf(repo, tool).length > 0;

/** El año en que el repositorio empezó a usar la herramienta: el de su evidencia más antigua, o el de creación. */
const yearInRepo = (repo: RepoFacts, evidence: readonly string[]) => Math.min(...evidence.map((e) => repo.evidenceYears?.[e] ?? repo.createdYear));

/** Cuenta cada herramienta del catálogo en los repositorios. Las que no aparecen en ninguno no salen. */
export function buildTools(repos: readonly RepoFacts[], catalog: readonly ToolDef[] = TOOLS): StackTool[] {
  const order = new Map<CategoryId, number>(CATEGORIES.map((c, i) => [c.id, i]));
  const tools: StackTool[] = [];
  for (const tool of catalog) {
    const using = repos.map((r) => ({ repo: r, evidence: evidenceOf(r, tool) })).filter((u) => u.evidence.length > 0);
    if (using.length === 0) continue;
    tools.push({
      id: tool.id,
      name: tool.name,
      category: tool.category,
      repos: using.length,
      // El año de la primera evidencia, pero nunca antes de que la herramienta existiera.
      since: Math.max(tool.introduced ?? 0, Math.min(...using.map((u) => yearInRepo(u.repo, u.evidence)))),
    });
  }
  return tools.sort(
    (a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) || b.repos - a.repos || a.name.localeCompare(b.name, 'es'),
  );
}

export interface CategoryGroup {
  id: CategoryId;
  label: string;
  tools: StackTool[];
}

/** Las herramientas agrupadas por categoría, en el orden del catálogo y sin categorías vacías. */
export function groupByCategory(tools: readonly StackTool[]): CategoryGroup[] {
  return CATEGORIES.map((c) => ({ id: c.id, label: c.label, tools: tools.filter((t) => t.category === c.id) })).filter((g) => g.tools.length > 0);
}

/** Ancho de la barra de una herramienta: proporcional al uso de la más usada, con un mínimo para que se vea. */
export function barPercent(repos: number, max: number): number {
  if (max <= 0 || repos <= 0) return 0;
  return Math.max(4, Math.round((repos / max) * 100));
}

export interface YearEntry {
  year: number;
  tools: string[];
}

/** Qué herramientas entraron cada año, de más antiguo a más reciente. */
export function byYear(tools: readonly StackTool[]): YearEntry[] {
  const years = new Map<number, StackTool[]>();
  for (const t of tools) years.set(t.since, [...(years.get(t.since) ?? []), t]);
  return [...years.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, list]) => ({ year, tools: [...list].sort((a, b) => b.repos - a.repos || a.name.localeCompare(b.name, 'es')).map((t) => t.name) }));
}

export const summary = (data: Pick<StackData, 'repos' | 'tools'>) => ({ tools: data.tools.length, repos: data.repos.total });

/** Desde cuándo construyo: el mes del repositorio más antiguo, o el primer año con herramientas en datos antiguos. */
export function buildingSince(data: Pick<StackData, 'repos' | 'tools'>): string {
  if (data.repos.since) return data.repos.since;
  return data.tools.length > 0 ? String(Math.min(...data.tools.map((t) => t.since))) : '';
}

/** Dos resultados son iguales si solo difiere la fecha: así la tarea diaria no hace commits sin cambios reales. */
export const sameData = (a: StackData, b: StackData) => JSON.stringify({ ...a, generatedAt: '' }) === JSON.stringify({ ...b, generatedAt: '' });
