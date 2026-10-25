/**
 * Herramientas que uso aunque el código no lo delate (M-05): las suma scripts/actualizar-stack.mjs a cada repositorio.
 * Este archivo se publica, así que `exceptRepos` solo puede nombrar repositorios públicos (el script lo comprueba).
 */
export const STACK_DECLARADO = {
  /** Ids del catálogo (src/lib/stack-catalog.ts) que cuentan en todos los repositorios. */
  tools: ['claude-code'],
  /** Repositorios donde no las usé. */
  exceptRepos: ['Analisis-estadistico-de-experimentos', 'Simulacion'],
};
