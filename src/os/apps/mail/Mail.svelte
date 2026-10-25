<script lang="ts">
  import { PERSONA } from '../../../content/persona';
  import { contactLines } from '../../../lib/contact-card';
  import { UI_SVG } from '../../icons';

  // Correo (M-08): una tarjeta de contacto, sin formulario ni servidor. El correo se abre en el programa del visitante.
  const lines = contactLines();
</script>

<div class="mail" data-testid="mail">
  <div class="card">
    <header class="head">
      <span class="avatar" aria-hidden="true">{PERSONA.initials}</span>
      <h2 data-testid="mail-name">{PERSONA.name}</h2>
    </header>
    <dl class="list">
      {#each lines as line (line.label)}
        <div class="row" data-testid={`mail-contact-${line.label.toLowerCase()}`}>
          <dt>{line.label}</dt>
          <dd>
            {#if line.external}
              <a href={line.href} target="_blank" rel="noopener noreferrer" aria-label={`${line.label}: ${line.text} (se abre en una pestaña nueva)`}>
                {line.text}<span class="ext" aria-hidden="true">{@html UI_SVG.external}</span>
              </a>
            {:else}
              <a href={line.href}>{line.text}</a>
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
  </div>
</div>

<style>
  .mail {
    height: 100%;
    overflow-y: auto;
    padding: 28px 22px;
    background: var(--win-bg);
    color: var(--fg);
  }
  .card {
    max-width: 440px;
    margin: 0 auto;
    padding: 22px;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: inset 0 0 0 1px var(--line);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
  }
  .avatar {
    width: 44px;
    height: 44px;
    flex: none;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: calc(16px * var(--text-scale));
    font-weight: 700;
    color: var(--accent-fg);
    background: var(--accent-solid);
  }
  h2 {
    margin: 0;
    font-size: calc(18px * var(--text-scale));
  }
  .list {
    display: grid;
    gap: 12px;
    margin: 0;
  }
  .row {
    display: grid;
    grid-template-columns: 76px 1fr;
    gap: 10px;
    align-items: baseline;
  }
  dt {
    font-size: calc(13px * var(--text-scale));
    color: var(--muted);
  }
  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  a {
    color: var(--accent-text);
    font-weight: 600;
  }
  a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .ext {
    display: inline-block;
    margin-left: 4px;
    vertical-align: -1px;
  }
  .ext :global(svg) {
    width: 12px;
    height: 12px;
  }
</style>
