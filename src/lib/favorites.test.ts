import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  COVER_PATH,
  DURATION,
  ITEM_ID,
  MAX_ITEMS,
  SECTIONS,
  COMMONS_ORIGIN,
  SUMMARY_LIMITS,
  YOUTUBE_ID,
  coverPath,
  nextTrack,
  rank,
  songTrack,
  songUrl,
  trailerTrack,
  trailerUrl,
  type FavoritesSection,
  type Track,
} from './favorites';

import { previousTrack, trackPosition } from './player-queue';

const track = (id: string): Track => ({ id, video: 'aaaaaaaaaaa', title: id, subtitle: '', url: 'https://x' });

describe('identificadores y direcciones', () => {
  test('un identificador de YouTube son once caracteres de letras, números, guion y guion bajo', () => {
    for (const ok of ['ha3fizDeark', '-uQi0vJK9lk', 'Nng0aSsq_XE', '20T-THqEn2I']) expect(YOUTUBE_ID.test(ok), ok).toBe(true);
    for (const bad of ['', 'corto', 'demasiado-largo-1', 'con espacio!', 'ha3fizDear<', '<script>aa', 'https://x.es', 'ha3fizDeark\n']) expect(YOUTUBE_ID.test(bad), bad).toBe(false);
  });

  test('las direcciones de YouTube se construyen solo con el identificador', () => {
    expect(songUrl('ha3fizDeark')).toBe('https://music.youtube.com/watch?v=ha3fizDeark');
    expect(trailerUrl('qJLh23QBvd4')).toBe('https://www.youtube.com/watch?v=qJLh23QBvd4');
  });

  test('una portada está en la carpeta de su sección y es un .jpg con nombre en minúsculas y guiones', () => {
    expect(coverPath('music', 'droga')).toBe('/favoritos/musica/droga.jpg');
    expect(coverPath('sports', 'basquet')).toBe('/favoritos/deportes/basquet.jpg');
    for (const ok of ['/favoritos/musica/droga.jpg', '/favoritos/libros/1984.jpg']) expect(COVER_PATH.test(ok), ok).toBe(true);
    for (const bad of ['/favoritos/musica/Droga.jpg', '/favoritos/musica/droga.png', '/favoritos/otra/droga.jpg', '/favoritos/musica/../x.jpg', 'https://x.es/a.jpg', '/favoritos/musica/a b.jpg']) {
      expect(COVER_PATH.test(bad), bad).toBe(false);
    }
  });

  test('el nombre de un elemento es kebab-case', () => {
    for (const ok of ['droga', '1984', 'the-sims-4']) expect(ITEM_ID.test(ok), ok).toBe(true);
    for (const bad of ['', 'Droga', 'a_b', '-a', 'a-', 'a--b']) expect(ITEM_ID.test(bad), bad).toBe(false);
  });

  test('una duración es m:ss', () => {
    for (const ok of ['3:45', '10:27', '0:59']) expect(DURATION.test(ok), ok).toBe(true);
    for (const bad of ['345', '3:5', '3:60', '3:45:10', 'tres']) expect(DURATION.test(bad), bad).toBe(false);
  });

  test('los números de la lista van de uno en uno', () => {
    expect([0, 1, 9].map(rank)).toEqual(['1', '2', '10']);
  });
});

describe('qué suena y qué viene después', () => {
  const queue = ['a', 'b', 'c'].map(track);

  test('tras una canción viene la siguiente de la lista; tras la última, nada', () => {
    expect(nextTrack(queue, 'a')?.id).toBe('b');
    expect(nextTrack(queue, 'b')?.id).toBe('c');
    expect(nextTrack(queue, 'c')).toBeNull();
  });

  test('una canción que no está en la lista, o una lista vacía, no tiene siguiente', () => {
    expect(nextTrack(queue, 'z')).toBeNull();
    expect(nextTrack([], 'a')).toBeNull();
  });

  test('antes de una canción va la anterior de la lista; antes de la primera, nada', () => {
    expect(previousTrack(queue, 'c')?.id).toBe('b');
    expect(previousTrack(queue, 'b')?.id).toBe('a');
    expect(previousTrack(queue, 'a')).toBeNull();
  });

  test('una canción que no está en la lista, o una lista vacía, no tiene anterior', () => {
    expect(previousTrack(queue, 'z')).toBeNull();
    expect(previousTrack([], 'a')).toBeNull();
  });

  test('con una lista de un solo elemento no hay anterior ni siguiente', () => {
    expect(previousTrack([track('a')], 'a')).toBeNull();
    expect(nextTrack([track('a')], 'a')).toBeNull();
  });

  test('el lugar en la lista se dice «3 de 10»; un tráiler suelto o una canción ajena no tienen', () => {
    expect(trackPosition(queue, 'a')).toBe('1 de 3');
    expect(trackPosition(queue, 'c')).toBe('3 de 3');
    expect(trackPosition([track('a')], 'a')).toBeNull();
    expect(trackPosition(queue, 'z')).toBeNull();
    expect(trackPosition([], 'a')).toBeNull();
  });

  test('una canción y un tráiler llevan su vídeo, su nombre y dónde verlos en YouTube', () => {
    const s = songTrack({ id: 'droga', title: 'Droga', artist: 'Mora', cover: coverPath('music', 'droga'), video: 'ssVCtZBQyus' });
    expect(s).toEqual({ id: 'song:droga', video: 'ssVCtZBQyus', title: 'Droga', subtitle: 'Mora', url: 'https://music.youtube.com/watch?v=ssVCtZBQyus' });
    const t = trailerTrack({ id: 'matrix', title: 'Matrix', year: 1999, synopsis: 'x'.repeat(30), cover: coverPath('movies', 'matrix'), trailer: 'Pl_H2Lmjn6k' });
    expect(t).toMatchObject({ id: 'trailer:matrix', video: 'Pl_H2Lmjn6k', subtitle: 'Tráiler · 1999', url: 'https://www.youtube.com/watch?v=Pl_H2Lmjn6k' });
  });

  test('un tráiler y una canción con el mismo nombre no se confunden', () => {
    expect(songTrack({ id: 'up', title: 'Up', artist: 'x', cover: coverPath('music', 'up'), video: 'aaaaaaaaaaa' }).id).not.toBe(
      trailerTrack({ id: 'up', title: 'Up', year: 2009, synopsis: 'x'.repeat(30), cover: coverPath('movies', 'up'), trailer: 'aaaaaaaaaaa' }).id,
    );
  });
});

// Guardas sobre el contenido real de src/content/favorites.
const dir = join(process.cwd(), 'src/content/favorites');
const sections = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(dir, f), 'utf8')) as FavoritesSection]),
) as Record<string, FavoritesSection>;

describe('src/content/favorites', () => {
  // Cada sección es opcional: la que existe es una de las cuatro y lleva su tipo.
  test('cada sección es una de las cuatro y lleva su tipo', () => {
    expect(Object.keys(sections).length).toBeGreaterThan(0);
    for (const [name, section] of Object.entries(sections)) {
      expect(SECTIONS.some((s) => s.id === name), `${name} no es una sección`).toBe(true);
      expect(section.kind, name).toBe(name);
    }
  });

  test('las cuatro secciones son deportes, películas y series, libros y música; ya no hay videojuegos', () => {
    expect(SECTIONS.map((s) => [s.id, s.label])).toEqual([
      ['sports', 'Deportes'],
      ['movies', 'Películas y series'],
      ['books', 'Libros'],
      ['music', 'Música'],
    ]);
    expect(Object.keys(sections).sort()).toEqual(['books', 'movies', 'music', 'sports']);
  });

  test('cada sección es un top 10: entre uno y diez elementos, con nombres que no se repiten', () => {
    for (const [name, section] of Object.entries(sections)) {
      expect(section.items.length, name).toBeGreaterThan(0);
      expect(section.items.length, name).toBeLessThanOrEqual(MAX_ITEMS);
      const ids = section.items.map((i) => i.id);
      expect(new Set(ids).size, name).toBe(ids.length);
    }
  });

  test('cada portada es un .jpg de la carpeta de su sección, con el nombre de su elemento, y existe', () => {
    for (const s of SECTIONS.filter((x) => sections[x.id])) {
      for (const item of sections[s.id].items) {
        expect(item.cover, `${s.id}/${item.id}`).toBe(coverPath(s.id, item.id));
        expect(existsSync(join(process.cwd(), 'public', item.cover)), `falta ${item.cover}`).toBe(true);
      }
    }
  });

  test('los deportes son básquet, fútbol y pádel, y cada foto nombra su autor, su licencia y su ficha en Wikimedia Commons', () => {
    const sports = sections.sports;
    if (sports?.kind !== 'sports') throw new Error('tipo');
    expect(sports.title).toBe('Deportes');
    expect(sports.items.map((s) => [s.id, s.title])).toEqual([
      ['basquet', 'Básquet'],
      ['futbol', 'Fútbol'],
      ['padel', 'Pádel'],
    ]);
    for (const s of sports.items) {
      expect(s.photo.author.length, s.id).toBeGreaterThan(1);
      expect(s.photo.license, s.id).toMatch(/^(CC0|CC BY(-SA)? \d\.\d)$/);
      expect(s.photo.url.startsWith(`${COMMONS_ORIGIN}/wiki/File:`), s.id).toBe(true);
    }
  });

  test('las películas llevan año, una sinopsis breve y su tráiler de YouTube', () => {
    const movies = sections.movies;
    if (movies.kind !== 'movies') throw new Error('tipo');
    for (const m of movies.items) {
      expect(m.year, m.id).toBeGreaterThan(1900);
      expect(m.synopsis.length, m.id).toBeGreaterThanOrEqual(20);
      expect(m.synopsis.length, m.id).toBeLessThanOrEqual(240);
      expect(YOUTUBE_ID.test(m.trailer), `${m.id}: ${m.trailer}`).toBe(true);
    }
  });

  test('los libros llevan autor y, si hay enlace final, es https', () => {
    const books = sections.books;
    if (books.kind !== 'books') throw new Error('tipo');
    for (const b of books.items) expect(b.author.length, b.id).toBeGreaterThan(2);
    if (books.link) expect(books.link.url.startsWith('https://')).toBe(true);
  });

  test('los cinco libros tienen su resumen de cinco secciones, Hábitos atómicos incluido', () => {
    const books = sections.books;
    if (books.kind !== 'books') throw new Error('tipo');
    const byId = Object.fromEntries(books.items.map((b) => [b.id, b]));
    for (const id of ['ai-engineering', 'nos-vemos-en-el-barro', 'el-valor-de-la-atencion', 'esto-es-marketing', 'habitos-atomicos']) {
      expect(byId[id]?.summary?.length, id).toBe(5);
    }
    expect(byId['habitos-atomicos']).toMatchObject({ title: 'Hábitos atómicos', author: 'James Clear' });
  });

  test('cada sección de un resumen tiene título y puntos, cada punto dice algo y no sobran espacios', () => {
    const books = sections.books;
    if (books.kind !== 'books') throw new Error('tipo');
    // Un texto limpio: sin espacios al principio ni al final, ni dobles, ni antes de un signo de puntuación.
    const clean = (where: string, text: string, max: number) => {
      expect(text.length, where).toBeGreaterThan(0);
      expect(text.length, where).toBeLessThanOrEqual(max);
      expect(text, where).toBe(text.trim());
      expect(text, where).not.toMatch(/\s{2,}|\s[.,:;]/);
    };
    for (const b of books.items.filter((x) => x.summary)) {
      expect(b.summary!.length, b.id).toBeLessThanOrEqual(SUMMARY_LIMITS.sections);
      for (const [i, s] of b.summary!.entries()) {
        clean(`${b.id} §${i + 1}`, s.title, SUMMARY_LIMITS.title);
        expect(s.points.length, `${b.id} §${i + 1}`).toBeGreaterThan(0);
        expect(s.points.length, `${b.id} §${i + 1}`).toBeLessThanOrEqual(SUMMARY_LIMITS.points);
        const points = s.points.flatMap((p) => [p, ...(p.points ?? [])]);
        for (const p of points) {
          const where = `${b.id} §${i + 1}: ${p.label ?? p.text}`;
          expect(p.label ?? p.text, where).toBeTruthy();
          if (p.label) clean(where, p.label, SUMMARY_LIMITS.label);
          if (p.text) clean(where, p.text, SUMMARY_LIMITS.text);
        }
      }
    }
  });

  test('las canciones llevan artista y su vídeo de YouTube, y no se repite ninguno', () => {
    const music = sections.music;
    if (music.kind !== 'music') throw new Error('tipo');
    for (const s of music.items) {
      expect(s.artist.length, s.id).toBeGreaterThan(1);
      expect(YOUTUBE_ID.test(s.video), `${s.id}: ${s.video}`).toBe(true);
      if (s.duration) expect(DURATION.test(s.duration), s.id).toBe(true);
    }
    const videos = music.items.map((s) => s.video);
    expect(new Set(videos).size).toBe(videos.length);
  });

  test('ningún texto lleva un correo, un teléfono ni HTML', () => {
    for (const [name, section] of Object.entries(sections)) {
      const text = JSON.stringify(section);
      expect(text, name).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+|mailto:|<[a-z/][^>]*>/i);
      expect(text, name).not.toMatch(/\+?\d{9,}/);
    }
  });

  test('los enlaces solo van a Wikimedia Commons o al enlace final de los libros', () => {
    const urls: string[] = [];
    for (const section of Object.values(sections)) {
      if (section.kind === 'sports') urls.push(...section.items.map((i) => i.photo.url));
      if (section.kind === 'books' && section.link) urls.push(section.link.url);
    }
    for (const url of urls) expect(new URL(url).protocol, url).toBe('https:');
  });
});
