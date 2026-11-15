import heroMangaPageImg from '../assets/images/hero_samurai.jpg';
import showcaseShonenImg from '../assets/images/shonen_fist.jpg';
import showcaseSeinenImg from '../assets/images/seinen_tokyo.jpg';
import showcaseFantasyImg from '../assets/images/fantasy_citadel.jpg';
import showcaseScifiImg from '../assets/images/scifi_cockpit.jpg';
import characterRefProtagonistImg from '../assets/images/character_sheet.jpg';
import workflowStoryboardImg from '../assets/images/workflow_storyboard.jpg';
import mangaDuelSplashImg from '../assets/images/duel_spread.jpg';
import type { MangaGenre } from '../types/manga';

export const MANGA_ARTWORK = {
  heroPage: heroMangaPageImg,
  shonen: showcaseShonenImg,
  seinen: showcaseSeinenImg,
  fantasy: showcaseFantasyImg,
  scifi: showcaseScifiImg,
  characterTurnaround: characterRefProtagonistImg,
  workflowStoryboard: workflowStoryboardImg,
  duelSplash: mangaDuelSplashImg,
} as const;

export interface ShowcaseItem {
  id: string;
  title: string;
  genre: MangaGenre;
  volumeLabel: string;
  chapters: number;
  authorNote: string;
  imageUrl: string;
  accentHex: string;
  samplePages: {
    title: string;
    caption: string;
    dialogue: string;
    imageUrl: string;
  }[];
}

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'sc-shonen',
    title: 'Crimson Gale: Skyward Fist',
    genre: 'Shonen',
    volumeLabel: 'Vol. 01 · Ch. 04',
    chapters: 18,
    authorNote: 'High-velocity kinetic paneling with crisp Ben-Day halftone impact frames.',
    imageUrl: showcaseShonenImg,
    accentHex: '#E63946',
    samplePages: [
      {
        title: 'Page 14 — The Ascent',
        caption: 'Low-angle action perspective · Dynamic speed lines',
        dialogue: 'Ren: "Even if the mountain splits—I am not stopping here!"',
        imageUrl: showcaseShonenImg,
      },
      {
        title: 'Page 15 — Counterstrike',
        caption: 'Extreme close-up · Ink brush impact',
        dialogue: 'Kuro: "Show me the weight behind that stance."',
        imageUrl: heroMangaPageImg,
      },
    ],
  },
  {
    id: 'sc-seinen',
    title: 'Rain Over Shinjuku',
    genre: 'Seinen',
    volumeLabel: 'Vol. 02 · Ch. 11',
    chapters: 24,
    authorNote: 'Moody cross-hatched ink shadows and nocturnal architectural perspective.',
    imageUrl: showcaseSeinenImg,
    accentHex: '#E63946',
    samplePages: [
      {
        title: 'Page 03 — Alleyway Lanterns',
        caption: 'Wide cinematic establishing shot · Rain screentone',
        dialogue: 'Narration: The third witness vanished before the last train left Kabukicho.',
        imageUrl: showcaseSeinenImg,
      },
      {
        title: 'Page 04 — Witness File',
        caption: 'Over-the-shoulder close-up',
        dialogue: 'Detective Sato: "Check the ledger again. Somebody forged the ink."',
        imageUrl: characterRefProtagonistImg,
      },
    ],
  },
  {
    id: 'sc-fantasy',
    title: 'Citadel of Ash & Gold',
    genre: 'Fantasy',
    volumeLabel: 'Vol. 01 · Ch. 01',
    chapters: 12,
    authorNote: 'Stippled atmospheric clouds paired with fine nib-pen medieval linework.',
    imageUrl: showcaseFantasyImg,
    accentHex: '#FFB703',
    samplePages: [
      {
        title: 'Page 01 — The Floating Spire',
        caption: 'Two-page horizon reveal · Gold rim highlight',
        dialogue: 'Vesper: "Seven centuries adrift, and the bell still rings."',
        imageUrl: showcaseFantasyImg,
      },
      {
        title: 'Page 02 — Oath of Iron',
        caption: 'Medium dramatic profile',
        dialogue: 'Vesper: "We cross the ridge before nightfall."',
        imageUrl: heroMangaPageImg,
      },
    ],
  },
  {
    id: 'sc-scifi',
    title: 'Orbital Ring 09',
    genre: 'Sci-Fi',
    volumeLabel: 'Vol. 03 · Ch. 19',
    chapters: 31,
    authorNote: 'Precision technical cockpit drafting with crisp geometric screentones.',
    imageUrl: showcaseScifiImg,
    accentHex: '#E63946',
    samplePages: [
      {
        title: 'Page 08 — Docking Vector',
        caption: 'Interior cockpit framing · Visor reflection',
        dialogue: 'Aoi: "Telemetry locked. Entering Ring Nine shadow."',
        imageUrl: showcaseScifiImg,
      },
      {
        title: 'Page 09 — Horizon Burn',
        caption: 'Dynamic tilt shot',
        dialogue: 'Control: "All thrusters nominal—brace for burn."',
        imageUrl: showcaseFantasyImg,
      },
    ],
  },
  {
    id: 'sc-action',
    title: 'Blade of the Seventh Wind',
    genre: 'Action',
    volumeLabel: 'Vol. 01 · Ch. 07',
    chapters: 15,
    authorNote: 'Razor-sharp samurai ink slashes with classic Japanese vertical rhythm.',
    imageUrl: heroMangaPageImg,
    accentHex: '#E63946',
    samplePages: [
      {
        title: 'Page 22 — Silent Draw',
        caption: 'Medium tension shot · Brush slash accent',
        dialogue: 'Kenshin: "Draw only if you intend to finish the stroke."',
        imageUrl: heroMangaPageImg,
      },
    ],
  },
  {
    id: 'sc-horror',
    title: 'Static at Midnight Station',
    genre: 'Horror',
    volumeLabel: 'Vol. 01 · Ch. 03',
    chapters: 9,
    authorNote: 'Heavy ink blacks and claustrophobic vertical gutter pacing.',
    imageUrl: showcaseSeinenImg,
    accentHex: '#E63946',
    samplePages: [
      {
        title: 'Page 11 — Platform Four',
        caption: 'High-contrast silhouette shot',
        dialogue: 'Whisper: "The announcement never said which year the train arrives."',
        imageUrl: showcaseSeinenImg,
      },
    ],
  },
  {
    id: 'sc-shojo',
    title: 'Paper Cranes in April',
    genre: 'Shojo',
    volumeLabel: 'Vol. 02 · Ch. 08',
    chapters: 20,
    authorNote: 'Delicate expressive eyes, airy white space, and soft dot screentones.',
    imageUrl: characterRefProtagonistImg,
    accentHex: '#FFB703',
    samplePages: [
      {
        title: 'Page 06 — Rooftop Breeze',
        caption: 'Emotional character close-up',
        dialogue: 'Hana: "If I fold one more, will you stay until graduation?"',
        imageUrl: characterRefProtagonistImg,
      },
    ],
  },
  {
    id: 'sc-romance',
    title: 'Last Ferry from Kamakura',
    genre: 'Romance',
    volumeLabel: 'Vol. 01 · Ch. 05',
    chapters: 14,
    authorNote: 'Warm editorial pacing with clean natural dialogue framing.',
    imageUrl: showcaseFantasyImg,
    accentHex: '#FFB703',
    samplePages: [
      {
        title: 'Page 18 — Golden Tide',
        caption: 'Wide scenic framing',
        dialogue: 'Haru: "Meet me at the pier when the bell clears."',
        imageUrl: showcaseFantasyImg,
      },
    ],
  },
];
