export type MangaGenre =
  | 'Shonen'
  | 'Shojo'
  | 'Seinen'
  | 'Horror'
  | 'Romance'
  | 'Fantasy'
  | 'Action'
  | 'Sci-Fi';

export type ArtDirectionStyle =
  | 'Black-and-white manga'
  | 'Traditional screentone'
  | 'Modern manga'
  | 'Detailed ink illustration'
  | 'Anime-inspired'
  | 'Custom visual direction';

export type ProjectStatus = 'Draft' | 'In Production' | 'Ready to Export' | 'Published';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: 'Free' | 'Creator' | 'Studio';
  monthlyPagesUsed: number;
  monthlyPagesLimit: number;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

export type OtpPurpose = 'signup' | 'login' | 'reset';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

export interface ResetOtpVerifyResponse {
  verified: boolean;
  resetToken: string;
}

export interface CharacterExpression {
  id: string;
  label: string;
  notes: string;
}

export interface Character {
  id: string;
  name: string;
  role: 'Protagonist' | 'Deuteragonist' | 'Antagonist' | 'Supporting' | 'Mentor';
  personality: string;
  hairstyle: string;
  facialFeatures: string;
  clothing: string;
  bodyType: string;
  appearanceSummary: string;
  consistencyNotes: string;
  referenceImageUrl: string;
  expressions: CharacterExpression[];
  associatedProjectIds: string[];
  updatedAt: string;
}

export type BubbleStyle = 'speech' | 'shout' | 'thought' | 'narration' | 'whisper';
export type TailDirection = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'none';
export type PanelBorderStyle = 'solid' | 'double' | 'dashed' | 'none';
export type PanelCornerShape = 'sharp' | 'beveled' | 'subtle-round';
export type CameraAngle =
  | 'Wide cinematic shot'
  | 'Extreme close-up'
  | 'Low-angle perspective'
  | 'Dynamic action perspective'
  | 'Emotional character close-up';

export interface BaseCanvasElement {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  opacity: number;
}

export interface PanelElement extends BaseCanvasElement {
  type: 'panel';
  borderWidth: number;
  borderStyle: PanelBorderStyle;
  cornerShape: PanelCornerShape;
  backgroundColor: string;
  screentone: 'none' | 'light' | 'dense' | 'speedlines';
  imageUrl?: string;
  imageBrightness: number;
  imageContrast: number;
  imageFlipX: boolean;
  cameraAngle?: CameraAngle;
  promptNote?: string;
}

export interface SpeechBubbleElement extends BaseCanvasElement {
  type: 'bubble';
  text: string;
  bubbleStyle: BubbleStyle;
  tailDirection: TailDirection;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  borderWidth: number;
  fontWeight: 400 | 600 | 700;
}

export interface TextElement extends BaseCanvasElement {
  type: 'text';
  text: string;
  fontFamily: 'Outfit' | 'Plus Jakarta Sans' | 'JetBrains Mono';
  fontSize: number;
  fontWeight: 400 | 600 | 700 | 800;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  color: string;
  effect: 'none' | 'outline' | 'impact-shadow';
}

export interface ImageElement extends BaseCanvasElement {
  type: 'image';
  imageUrl: string;
  brightness: number;
  contrast: number;
  flipX: boolean;
  caption?: string;
}

export interface EffectElement extends BaseCanvasElement {
  type: 'effect';
  effectKind: 'speed-lines' | 'impact-burst' | 'halftone-wash';
  intensity: number;
  color: string;
}

export type CanvasElement =
  | PanelElement
  | SpeechBubbleElement
  | TextElement
  | ImageElement
  | EffectElement;

export interface MangaPage {
  id: string;
  pageNumber: number;
  chapterId: string;
  title: string;
  gutterSize: number;
  backgroundColor: string;
  elements: CanvasElement[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  synopsis: string;
}

export interface MangaProject {
  id: string;
  title: string;
  description: string;
  genre: MangaGenre;
  artStyle: ArtDirectionStyle;
  targetAudience: string;
  language: string;
  readingDirection: 'rtl' | 'ltr';
  status: ProjectStatus;
  coverImageUrl: string;
  chapters: Chapter[];
  pages: MangaPage[];
  characterIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryEntry {
  id: string;
  title: string;
  genre: MangaGenre;
  logline: string;
  scriptExcerpt: string;
  sceneCount: number;
  updatedAt: string;
}

export interface StudioTemplate {
  id: string;
  name: string;
  category: 'Action' | 'Dialogue' | 'Splash' | 'Climax' | 'Opening';
  panelCount: number;
  description: string;
  presetKey: 'four-panel-grid' | 'dynamic-action' | 'splash-focus' | 'dialogue-strip' | 'cinematic-widescreen';
}

export interface AssetItem {
  id: string;
  title: string;
  category: 'Character Reference' | 'Background' | 'Illustration' | 'Effect' | 'Uploaded';
  imageUrl: string;
  tags: string[];
  createdAt: string;
  storagePath?: string;
}

export type ExportFormat = 'PDF' | 'PNG' | 'JPEG';

export interface ExportJob {
  id: string;
  projectId: string;
  projectTitle: string;
  format: ExportFormat;
  resolution: '150 DPI' | '300 DPI' | '600 DPI';
  pageSize: 'B5 Manga' | 'A4 Editorial' | 'US Tankobon' | 'Webtoon Vertical';
  scope: 'Single Page' | 'Complete Chapter';
  quality: 'Standard' | 'Print Master';
  includeDialogue: boolean;
  colorMode: 'Grayscale' | 'Color';
  status: 'Queued' | 'Rendering' | 'Completed' | 'Failed';
  progress: number;
  createdAt: string;
  downloadFilename?: string;
  downloadUrl?: string;
}

export type StudioTool =
  | 'select'
  | 'panels'
  | 'images'
  | 'text'
  | 'bubbles'
  | 'characters'
  | 'backgrounds'
  | 'templates'
  | 'effects'
  | 'layers';

export interface CreateMangaPayload {
  title: string;
  description: string;
  genre: MangaGenre;
  targetAudience: string;
  language: string;
  artStyle: ArtDirectionStyle;
  customVisualDirection?: string;
  storyMode: 'idea' | 'script' | 'chapter' | 'scenes';
  storyContent: string;
  characterName: string;
  characterRole: Character['role'];
  characterPersonality: string;
  characterHairstyle: string;
  characterFacialFeatures: string;
  characterClothing: string;
  characterBodyType: string;
  characterNotes: string;
  chaptersCount: number;
  pagesPerChapter: number;
  panelsPerPage: number;
  dialogueGeneration: boolean;
  characterConsistency: boolean;
  compositionPreference: string;
}

export interface AiActionRequest {
  projectId: string;
  pageId: string;
  elementId: string;
  action:
    | 'regenerate-image'
    | 'improve-composition'
    | 'change-expression'
    | 'change-camera-angle'
    | 'modify-background'
    | 'enhance-details'
    | 'rewrite-dialogue'
    | 'continue-scene';
  cameraAngle?: CameraAngle;
  note?: string;
}
