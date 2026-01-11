export interface Story {
  id: number;
  contenu: string;
  is_anonymous: boolean;
  date_creation: string;
  titre?: string; // Fallback title from content
}
