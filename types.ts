
export enum UnitCategory {
  UNIT_BERUNIFORM = 'UNIT_BERUNIFORM',
  KELAB_PERSATUAN = 'KELAB_PERSATUAN',
  SATU_M_SATU_S = '1M1S'
}

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
  password?: string;
  teachers: string[];
  logoUrl?: string; 
  aliases?: string[]; // Singkatan seperti ["PAI", "ISLAM"]
}

export enum UserRole {
  GUEST = 'GUEST',
  UNIT_ADMIN = 'UNIT_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface User {
  role: UserRole;
  unitId?: string;
}

export interface Achievement {
  id: number;
  year: number;
  level: string;
  event: string;
  result: string;
  unit: string;
  description: string;
  imageUrl: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  description: string;
  year: number;
  dateUploaded: string;
  uploadedBy?: string;
}

// Data for submitting form
export interface WeeklyReportData {
  unitId: string;
  date: string;
  activity: string;
  attendanceCount: number;
  notes: string;
}

// Data for viewing list
export interface WeeklyReportItem {
  id: string;
  week: number;
  date: string;
  activity: string;
  attendance: string;
  teacherName: string;
  unitName: string;
  year: number;
  fileUrl?: string;
}

export interface AppState {
  currentTab: 'INTERNAL' | 'EXTERNAL';
  view: 'HOME' | 'UNIT_DASHBOARD' | 'FORM_REPORT' | 'VIEW_ATTENDANCE' | 'FORM_ATTENDANCE' | 'VIEW_ORG' | 'VIEW_PLAN' | 'VIEW_GALLERY' | 'MANAGE_TEACHERS';
  selectedYear: number;
  selectedUnit: Unit | null;
  user: User;
}

export const CATEGORY_LABELS: Record<UnitCategory, string> = {
  [UnitCategory.UNIT_BERUNIFORM]: 'Unit Beruniform',
  [UnitCategory.KELAB_PERSATUAN]: 'Kelab & Persatuan',
  [UnitCategory.SATU_M_SATU_S]: '1 Murid 1 Sukan (1M1S)'
};
