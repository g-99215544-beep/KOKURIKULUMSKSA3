
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
  id?: string;
  unitId: string;
  unitName: string;
  unitCategory: string;
  year: number;
  perjumpaanKali: string;
  tarikh: string;
  hari: string;
  masa: string;
  tempat: string;
  muridHadir: string;
  jumlahMurid: string;
  selectedTeachers: string[];
  aktiviti1: string;
  aktiviti2: string;
  aktiviti3: string;
  pikebm: string;
  refleksi: string;
  imageUrls?: string[]; // URLs of images in cloud storage
  pdfUrl?: string; // URL of generated PDF
  timestamp?: any;
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

export interface MeetingSchedule {
  id?: string;
  category: UnitCategory;
  weekNumber: number;
  meetingDate: string; // Format: YYYY-MM-DD
  deadline: string; // Format: YYYY-MM-DD (date before which records must be submitted)
  year: number;
  createdAt?: number;
}

export interface ComplianceStatus {
  unitId: string;
  unitName: string;
  weekNumber: number;
  hasAttendance: boolean;
  hasReport: boolean;
  isCompliant: boolean;
  deadline: string;
}

// Flare/Reminder types for coordinator assignments
export type FlareType = 'KEHADIRAN' | 'LAPORAN_MINGGUAN' | 'CARTA_ORGANISASI' | 'RANCANGAN_TAHUNAN';

export interface UnitFlare {
  id?: string;
  unitId: string;
  unitName: string;
  category: UnitCategory;
  flareType: FlareType;
  weekNumber?: number; // For attendance/weekly report
  message?: string; // Optional custom message
  assignedBy: string; // Coordinator category (UB/KP/1M1S)
  createdAt?: number;
  year: number;
}

export const FLARE_LABELS: Record<FlareType, string> = {
  'KEHADIRAN': 'Kehadiran',
  'LAPORAN_MINGGUAN': 'Laporan Mingguan',
  'CARTA_ORGANISASI': 'Carta Organisasi',
  'RANCANGAN_TAHUNAN': 'Rancangan Tahunan'
};

export interface AppState {
  currentTab: 'INTERNAL' | 'EXTERNAL';
  view: 'HOME' | 'UNIT_DASHBOARD' | 'FORM_REPORT' | 'VIEW_ATTENDANCE' | 'FORM_ATTENDANCE' | 'VIEW_ORG' | 'VIEW_PLAN' | 'VIEW_GALLERY' | 'MANAGE_TEACHERS' | 'MEETING_SCHEDULE' | 'COORDINATOR' | 'ADMIN_DASHBOARD';
  selectedYear: number;
  selectedUnit: Unit | null;
  user: User;
  coordinatorCategory?: UnitCategory; // For coordinator view
}

export const CATEGORY_LABELS: Record<UnitCategory, string> = {
  [UnitCategory.UNIT_BERUNIFORM]: 'Unit Beruniform',
  [UnitCategory.KELAB_PERSATUAN]: 'Kelab & Persatuan',
  [UnitCategory.SATU_M_SATU_S]: '1 Murid 1 Sukan (1M1S)'
};
