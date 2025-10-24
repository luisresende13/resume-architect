
export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: string;
  storage_path: string;
  status: 'processed' | 'processing' | 'pending' | 'uploaded';
  created_at: string;
  updated_at: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  github: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  dates: string;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  date: string;
}

export interface Award {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: string;
}

export interface MasterProfile {
  personal_info: PersonalInfo;
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  awards: Award[];
  languages: Language[];
}

export interface SavedJobDescription {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
}

export interface SavedResume {
  id: string;
  user_id: string;
  name: string;
  markdown_content: string;
  created_at: string;
}

export type MasterProfileSection = keyof MasterProfile;

export type GeneratedItem = Experience | Skill | Project | Education | Certification | Award | Language;

export interface AppData {
  documents: Document[];
  masterProfile: MasterProfile;
  savedJobDescriptions: SavedJobDescription[];
  savedResumes: SavedResume[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export type AppView = 'dashboard' | 'generate-resume' | 'review' | 'login' | 'register' | 'password-reset' | 'account';

export type GenerationMode = 'replace' | 'complement';
