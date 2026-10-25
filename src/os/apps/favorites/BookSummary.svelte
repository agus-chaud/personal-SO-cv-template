<script lang="ts">
  import type { BookItem, SummaryPoint } from '../../../lib/favorites';

  // El resumen de un libro, dentro de la ventana de Favoritos: portada, título y autor, y las secciones con sus puntos. Siempre texto plano.
  let { book }: { book: BookItem & { summary: NonNullable<BookItem['summary']> } } = $props();

  let heading = $state<HTMLHeadingElement>();

  // Al abrirse, el foco pasa al título (y la vista sube hasta él) para que el lector de pantalla anuncie el libro.
  $effect(() => {
    heading?.focus();
  });
</script>

{#snippet item(p: Omit<SummaryPoint, 'points'>)}
  {#if p.label}<strong>{p.label}:</strong>{/if}
  {#if p.text}{p.text}{/if}
{/snippet}

<article class="book" data-testid={`favorites-summary-${book.id}`}>
  <header class="head">
    <img class="cover" src={book.cover} alt="" />
    <div>
      <h2 bind:this={heading} tabindex="-1" data-testid="favorites-summary-title">{book.title}</h2>
      <p class="author">{book.author}</p>
    </div>
  </header>
  {#each book.summary as section, i (i)}
    <section>
      <h3>{i + 1}. {section.title}</h3>
      <ul>
        {#each section.points as point, j (j)}
          <li>
            {@render item(point)}
            {#if point.points}
              <ul>
                {#each point.points as sub, k (k)}
                  <li>{@render item(sub)}</li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</article>

<style>
  .book {
    max-width: 640px;
  }
  .head {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 14px;
    align-items: center;
    margin-bottom: 18px;
  }
  .cover {
    display: block;
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    border-radius: 6px;
    background: var(--hover);
    box-shadow: 0 0 0 1px var(--line);
  }
  h2 {
    margin: 0;
    font-size: calc(20px * var(--text-scale));
    line-height: 1.2;
  }
  h2:focus {
    outline: none;
  }
  .author {
    margin: 4px 0 0;
    font-size: calc(14px * var(--text-scale));
    color: var(--muted);
  }
  section + section {
    margin-top: 18px;
  }
  h3 {
    margin: 0 0 8px;
    font-size: calc(15px * var(--text-scale));
    font-weight: 600;
  }
  ul {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 6px;
  }
  ul ul {
    margin-top: 6px;
  }
  li {
    font-size: calc(14px * var(--text-scale));
    line-height: 1.5;
  }
  li::marker {
    color: var(--muted);
  }
</style>
