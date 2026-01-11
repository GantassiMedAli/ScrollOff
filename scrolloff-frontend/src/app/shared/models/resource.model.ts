export interface Resource {
  id: number;
  titre: string;
  description: string;
  lien: string;
  type: string; // 'Article' | 'Video' | 'Poster' | 'External link'
  date_ajout?: string;
}
