/**
 * Lógica pura de Favoritos (S-03): las cuatro secciones, sus formas de dato, las direcciones de YouTube y el orden de reproducción. La usan el
 * esquema de la colección, la ventana, el mini reproductor y los tests, así que no toca red ni DOM.
 */

export const SECTIONS = [
  { id: 'sports', label: 'Deportes', dir: 'deportes', aspect: '3 / 4' },
  { id: 'movies', label: 'Películas y series', dir: 'peliculas', aspect: '2 / 3' },
  { id: 'books', label: 'Libros', dir: 'libros', aspect: '2 / 3' },
  { id: 'music', label: 'Música', dir: 'musica', aspect: '1 / 1' },
] as const;
export type SectionId = (typeof SECTIONS)[number]['id'];

/** Cada sección es un top 10. */
export const MAX_ITEMS = 10;

/** El identificador de un vídeo de YouTube: once caracteres de letras, números, guion y guion bajo. */
export const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Las fotos de los deportes son de Wikimedia Commons, con licencia libre: cada una enlaza con su ficha, donde están el autor y la licencia. */
export const COMMONS_ORIGIN = 'https://commons.wikimedia.org';

export const COVER_PATH = /^\/favoritos\/(deportes|peliculas|libros|musica)\/[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/;
export const ITEM_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** La dirección de una portada: en la carpeta de su sección y con el nombre del elemento. */
export const coverPath = (section: SectionId, id: string) => `/favoritos/${SECTIONS.find((s) => s.id === section)!.dir}/${id}.jpg`;

/** De dónde sale una foto con licencia libre: lo que hace falta para atribuirla. */
export interface PhotoCredit {
  author: string;
  /** El nombre corto de la licencia, como «CC BY 2.0» o «CC0». */
  license: string;
  /** La ficha de la foto en Wikimedia Commons. */
  url: string;
}
export interface SportItem {
  id: string;
  title: string;
  cover: string;
  photo: PhotoCredit;
}
export interface MovieItem {
  id: string;
  title: string;
  year: number;
  synopsis: string;
  cover: string;
  /** El identificador del tráiler en YouTube. */
  trailer: string;
}
/** Los topes del resumen de un libro, en secciones, puntos por sección y caracteres. */
export const SUMMARY_LIMITS = { sections: 10, points: 10, title: 80, label: 80, text: 500 } as const;

/** Un punto del resumen: una etiqueta en negrita («Velocidad»), un texto, o las dos cosas. Puede tener subpuntos, que ya no se anidan más. */
export interface SummaryPoint {
  label?: string;
  text?: string;
  points?: Omit<SummaryPoint, 'points'>[];
}
export interface SummarySection {
  title: string;
  points: SummaryPoint[];
}
export interface BookItem {
  id: string;
  title: string;
  author: string;
  cover: string;
  /** El resumen que escribió el dueño del portfolio, por secciones. Opcional: sin él, la portada no abre nada. */
  summary?: SummarySection[];
}
export interface SongItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  /** El identificador del vídeo en YouTube. */
  video: string;
  /** `m:ss`, opcional. */
  duration?: string;
}

interface SectionBase<K extends SectionId, I> {
  kind: K;
  title: string;
  items: I[];
}
export type SportsSection = SectionBase<'sports', SportItem>;
export interface BooksSection extends SectionBase<'books', BookItem> {
  /** Un enlace final, por ejemplo al perfil de Yoleo. */
  link?: { label: string; url: string };
}
export type MoviesSection = SectionBase<'movies', MovieItem>;
export type MusicSection = SectionBase<'music', SongItem>;
export type FavoritesSection = SportsSection | MoviesSection | BooksSection | MusicSection;

export const songUrl = (video: string) => `https://music.youtube.com/watch?v=${video}`;
export const trailerUrl = (video: string) => `https://www.youtube.com/watch?v=${video}`;

/** Lo que el mini reproductor necesita saber de lo que suena: un vídeo, cómo llamarlo y dónde verlo en YouTube. */
export interface Track {
  id: string;
  video: string;
  title: string;
  subtitle: string;
  url: string;
}

export const songTrack = (s: SongItem): Track => ({ id: `song:${s.id}`, video: s.video, title: s.title, subtitle: s.artist, url: songUrl(s.video) });
export const trailerTrack = (m: MovieItem): Track => ({ id: `trailer:${m.id}`, video: m.trailer, title: m.title, subtitle: `Tráiler · ${m.year}`, url: trailerUrl(m.trailer) });

/** La canción que viene después de la actual en la lista, o null si es la última (o no está en ella). */
export function nextTrack(queue: readonly Track[], currentId: string): Track | null {
  const i = queue.findIndex((t) => t.id === currentId);
  return i >= 0 && i < queue.length - 1 ? queue[i + 1] : null;
}

/** Los números de la lista, de uno en uno: «1» a «10». */
export const rank = (index: number) => String(index + 1);

/** Un tiempo `m:ss` válido (de 0:01 a 99:59). */
export const DURATION = /^\d{1,2}:[0-5]\d$/;
