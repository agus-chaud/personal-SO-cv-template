#!/usr/bin/env node
/**
 * Actualiza `src/content/stack.json` (la ventana Stack, M-05) analizando los repositorios de Pol en GitHub:
 * lenguajes, dependencias de `package.json`, de Cargo, de Gradle y de Python (requirements, pyproject.toml, environment.yml,
 * Pipfile, setup.py y los imports de todos los `.py` y notebooks), archivos reveladores y el año del primer commit que trajo
 * cada evidencia. Cada dependencia se traduce a una herramienta con el catálogo de `src/lib/stack-catalog.ts`, y se suman
 * las herramientas declaradas en `src/content/stack-declarado.ts`.
 *
 * Los forks cuentan, enteros, si tienen commits propios por delante del original.
 *
 * Privacidad: de los repositorios privados solo se publican recuentos. Ningún nombre de repositorio llega al archivo, y
 * el script se niega a escribirlo si alguno se colara.
 *
 * Necesita un token de GitHub en `STACK_GITHUB_TOKEN`, `GH_TOKEN` o `GITHUB_TOKEN`:
 *  - con un token de Pol (permiso de lectura de sus repositorios) cuenta también los privados;
 *  - con el token por defecto de GitHub Actions, solo los públicos.
 * Sin token el límite de peticiones de GitHub (60 por hora) se agota enseguida, así que no se intenta.
 *
 *   node scripts/actualizar-stack.mjs           # actualiza el archivo si hay cambios
 *   node scripts/actualizar-stack.mjs --dry     # solo enseña el resultado
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildTools, evidenceOf, gradleDeps, isSkillOrTemplate, pythonDeps, sameData, withoutLargeFiles } from '../src/lib/stack.ts';
import { TOOLS } from '../src/lib/stack-catalog.ts';
import { PERSONA } from '../src/content/persona.ts';
import { STACK_DECLARADO } from '../src/content/stack-declarado.ts';

const OWNER = PERSONA.github;
const salida = new URL('../src/content/stack.json', import.meta.url);
const dry = process.argv.includes('--dry');
const token = process.env.STACK_GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Falta un token de GitHub (STACK_GITHUB_TOKEN, GH_TOKEN o GITHUB_TOKEN).');
  process.exit(1);
}
const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'pol-os-actualizar-stack' };

async function get(path, { allow = [] } = {}) {
  const res = await fetch(path.startsWith('http') ? path : `https://api.github.com/${path}`, { headers });
  if (allow.includes(res.status)) return null;
  if (!res.ok) throw new Error(`${path.split('?')[0].replace(/repos\/[^/]+\/[^/]+/, 'repos/…')}: ${res.status} ${res.statusText}`);
  return res.json();
}

async function paginated(path) {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await get(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

// ¿El token es de Pol? Entonces ve también sus repositorios privados.
const yo = await get('user', { allow: [401, 403] }).catch(() => null);
const esDePol = yo?.login === OWNER;
const listado = esDePol ? await paginated('user/repos?affiliation=owner&visibility=all') : await paginated(`users/${OWNER}/repos?type=owner`);
// Un fork cuenta si tiene commits propios por delante de su original.
async function forkConCommitsPropios(repo) {
  const detalle = await get(`repos/${repo.full_name}`);
  const padre = detalle.parent;
  if (!padre) return false;
  const comparacion = await get(`repos/${padre.full_name}/compare/${padre.default_branch}...${OWNER}:${repo.name}:${repo.default_branch}`, { allow: [404] });
  return (comparacion?.ahead_by ?? 0) > 0;
}
const propios = listado.filter((r) => r.owner.login === OWNER);
const repos = [];
for (const r of propios) if (!r.fork || (await forkConCommitsPropios(r))) repos.push(r);
console.log(`Repositorios a analizar: ${repos.length}, ${repos.filter((r) => r.fork).length} forks (${esDePol ? 'públicos y privados' : 'solo públicos'}).`);

// stack-declarado.ts se publica: no puede nombrar un repositorio privado.
const privados = new Set(propios.filter((r) => r.private).map((r) => r.name.toLowerCase()));
if (STACK_DECLARADO.exceptRepos.some((n) => privados.has(n.toLowerCase()))) {
  console.error('src/content/stack-declarado.ts nombra un repositorio privado; no se escribe nada.');
  process.exit(1);
}
const exceptuados = new Set(STACK_DECLARADO.exceptRepos.map((n) => n.toLowerCase()));

const decodificar = (c) => Buffer.from(c.content, 'base64').toString('utf8');

// Texto crudo de un archivo: sirve también para los de más de 1 MB, que la API de contenidos no devuelve en base64.
async function textoDe(base, ruta) {
  const res = await fetch(`https://api.github.com/${base}/contents/${encodeURI(ruta)}`, { headers: { ...headers, Accept: 'application/vnd.github.raw' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${base.replace(/repos\/[^/]+\/[^/]+/, 'repos/…')}/contents: ${res.status} ${res.statusText}`);
  return res.text();
}

// Los notebooks con salidas pueden pesar decenas de MB: se leen los de hasta 25 MB.
const NOTEBOOK_MAX_BYTES = 25 * 1024 * 1024;
const rutasDe = (arbol, patron) => arbol.filter((p) => patron.test(p) && !p.includes('node_modules/'));

// Año del primer commit que tocó una ruta: la última página de su historial, de un commit por página.
const añosPorRuta = new Map();
async function primerAño(base, ruta) {
  const clave = `${base}:${ruta}`;
  if (añosPorRuta.has(clave)) return añosPorRuta.get(clave);
  const res = await fetch(`https://api.github.com/${base}/commits?path=${encodeURIComponent(ruta)}&per_page=1`, { headers });
  if (!res.ok) throw new Error(`${base.replace(/repos\/[^/]+\/[^/]+/, 'repos/…')}/commits: ${res.status} ${res.statusText}`);
  const ultima = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="last"/)?.[1];
  const commits = ultima ? await get(ultima) : await res.json();
  const fecha = commits.at(-1)?.commit?.author?.date;
  const año = fecha ? new Date(fecha).getFullYear() : null;
  añosPorRuta.set(clave, año);
  return año;
}

async function analizar(repo) {
  const base = `repos/${repo.full_name}`;
  const [lenguajes, arbol] = await Promise.all([get(`${base}/languages`), get(`${base}/git/trees/HEAD?recursive=1`, { allow: [409, 404] })]);
  const nodos = (arbol?.tree ?? []).filter((n) => n.type === 'blob' || n.type === 'tree');
  const files = nodos.map((n) => n.path);
  // De qué archivos sale cada dependencia, para fecharla después.
  const origenes = new Map();
  const anotar = (ruta, lista) => {
    for (const dep of lista) origenes.set(dep, [...(origenes.get(dep) ?? []), ruta]);
  };
  for (const ruta of rutasDe(files, /(^|\/)package\.json$/)) {
    const archivo = await get(`${base}/contents/${ruta}`, { allow: [404] });
    if (!archivo?.content) continue;
    try {
      const json = JSON.parse(decodificar(archivo));
      anotar(ruta, Object.keys({ ...json.dependencies, ...json.devDependencies }));
    } catch {
      /* un package.json roto no debe tumbar el análisis */
    }
  }
  for (const ruta of rutasDe(files, /(^|\/)Cargo\.toml$/)) {
    const archivo = await get(`${base}/contents/${ruta}`, { allow: [404] });
    if (!archivo?.content) continue;
    anotar(ruta, [...decodificar(archivo).matchAll(/^\s*([A-Za-z0-9_-]+)\s*=/gm)].map(([, nombre]) => `cargo:${nombre}`));
  }
  for (const ruta of rutasDe(files, /(^|\/)build\.gradle(\.kts)?$/)) {
    const contenido = await textoDe(base, ruta);
    if (contenido) anotar(ruta, gradleDeps(ruta, contenido));
  }
  // Entornos virtuales, copias de Jupyter, skills y plantillas no son código del repositorio.
  const fuera = (p) => /(^|\/)(\.venv|venv|site-packages|\.ipynb_checkpoints)\//.test(p) || isSkillOrTemplate(p);
  const propios = nodos.filter((n) => !fuera(n.path));
  const python = [
    ...rutasDe(files, /(^|\/)(requirements[^/]*\.txt|pyproject\.toml|environment\.ya?ml|Pipfile)$/i),
    ...rutasDe(propios.map((n) => n.path), /\.py$/),
    ...rutasDe(propios.filter((n) => (n.size ?? 0) <= NOTEBOOK_MAX_BYTES).map((n) => n.path), /\.ipynb$/),
  ];
  for (const ruta of python) {
    const contenido = await textoDe(base, ruta);
    if (contenido) anotar(ruta, pythonDeps(ruta, contenido));
  }
  const blobs = nodos.filter((n) => n.type === 'blob').map((n) => ({ path: n.path, size: n.size ?? 0 }));
  const hechos = {
    createdYear: new Date(repo.created_at).getFullYear(),
    languages: withoutLargeFiles(lenguajes ?? {}, blobs),
    deps: [...origenes.keys()],
    files,
    declared: exceptuados.has(repo.name.toLowerCase()) ? [] : STACK_DECLARADO.tools,
  };
  // Si el repositorio solo tuvo actividad el año en que se creó, todas sus evidencias son de ese año y no hace falta preguntar.
  if (new Date(repo.pushed_at).getFullYear() > hechos.createdYear) {
    const evidencias = new Set(TOOLS.flatMap((t) => evidenceOf(hechos, t)).filter((e) => !e.startsWith('lang:') && e !== 'declared'));
    hechos.evidenceYears = {};
    for (const evidencia of evidencias) {
      const años = [];
      for (const ruta of origenes.get(evidencia) ?? [evidencia]) {
        const año = await primerAño(base, ruta);
        if (año) años.push(año);
      }
      if (años.length > 0) hechos.evidenceYears[evidencia] = Math.min(...años);
    }
  }
  return hechos;
}

// Pocas peticiones a la vez: GitHub limita las simultáneas y esto no tiene prisa.
const hechos = new Array(repos.length);
const errores = [];
let siguiente = 0;
await Promise.all(
  Array.from({ length: 5 }, async () => {
    while (siguiente < repos.length) {
      const i = siguiente++;
      try {
        hechos[i] = await analizar(repos[i]);
      } catch (error) {
        errores.push(error.message);
      }
    }
  }),
);
if (errores.length > 0) {
  // Publicar recuentos a medias sería peor que no publicar nada.
  console.error(`No se pudo analizar ${errores.length} repositorio(s); no se escribe nada:\n  ${[...new Set(errores)].slice(0, 5).join('\n  ')}`);
  process.exit(1);
}

const datos = {
  generatedAt: new Date().toISOString().slice(0, 10),
  repos: {
    total: repos.length,
    public: repos.filter((r) => !r.private).length,
    private: repos.filter((r) => r.private).length,
    since: repos.map((r) => r.created_at.slice(0, 7)).sort()[0],
  },
  tools: buildTools(hechos),
};

// Red de seguridad: ningún nombre de repositorio puede llegar al archivo.
const texto = `${JSON.stringify(datos, null, 2)}\n`;
const filtrados = repos.map((r) => r.name).filter((n) => n.length > 3 && texto.toLowerCase().includes(n.toLowerCase()));
if (filtrados.length > 0) {
  console.error(`El resultado contiene ${filtrados.length} nombre(s) de repositorio; no se escribe nada.`);
  process.exit(1);
}

let anterior = null;
try {
  anterior = JSON.parse(readFileSync(salida, 'utf8'));
} catch {
  /* primera vez */
}
// Si antes se contaban repositorios privados y ahora no, el token de Pol falta o ha caducado: publicar eso recortaría
// los números en silencio. Mejor que la tarea falle y se vea.
if (anterior && anterior.repos.private > 0 && datos.repos.private === 0) {
  console.error('Antes había repositorios privados y ahora no: el token de Pol (STACK_GITHUB_TOKEN) falta o ha caducado. No se escribe nada.');
  process.exit(1);
}
console.log(`${datos.tools.length} herramientas en ${datos.repos.total} repositorios (${datos.repos.public} públicos, ${datos.repos.private} privados).`);
if (anterior && sameData(anterior, datos)) {
  console.log('Sin cambios.');
} else if (dry) {
  // Qué cambiaría, herramienta a herramienta: «repos · desde» antes y después.
  const resumen = (lista) => new Map((lista ?? []).map((t) => [t.name, `${t.repos} · ${t.since}`]));
  const [antes, despues] = [resumen(anterior?.tools), resumen(datos.tools)];
  for (const nombre of new Set([...antes.keys(), ...despues.keys()])) {
    if (antes.get(nombre) !== despues.get(nombre)) console.log(`  ${nombre}: ${antes.get(nombre) ?? '—'} → ${despues.get(nombre) ?? '—'}`);
  }
  if (anterior?.repos.since !== datos.repos.since) console.log(`  Construyendo desde: ${anterior?.repos.since ?? '—'} → ${datos.repos.since}`);
  console.log('Habría cambios (modo --dry: no se escribe).');
} else {
  writeFileSync(salida, texto);
  console.log('src/content/stack.json actualizado.');
}
