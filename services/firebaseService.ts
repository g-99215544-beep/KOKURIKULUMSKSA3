
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, serverTimestamp, query, orderByChild, equalTo, get, remove, update } from "firebase/database";
import { MeetingSchedule, WeeklyReportData } from '../types';
import type { Achievement } from '../types';

// Konfigurasi ini BETUL untuk projek anda
const firebaseConfig = {
  apiKey: "AIzaSyAm32BnHvNzO41haR8umdrjBs0qN5E_37o",
  authDomain: "kokodata-5d5e2.firebaseapp.com",
  databaseURL: "https://kokodata-5d5e2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kokodata-5d5e2",
  storageBucket: "kokodata-5d5e2.firebasestorage.app",
  messagingSenderId: "589237221293",
  appId: "1:589237221293:web:3feec373a23c8c0d4fd324",
  measurementId: "G-9FVLQJ38RT"
};

const app = initializeApp(firebaseConfig);

// PENYELESAIAN UTAMA: 
// Kita mesti masukkan URL penuh database di sini kerana database anda berada di region Asia (Singapore).
// Tanpa URL ini, app akan cuba cari data di US (default) dan memulangkan kosong.
const db = getDatabase(app, "https://kokodata-5d5e2-default-rtdb.asia-southeast1.firebasedatabase.app");

export interface AttendanceRecord {
  id?: string;
  unitId: string;
  unitName: string;
  week: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  percentage: string;
  classes: {
    className: string;
    students: {
      name: string;
      status: 'HADIR' | 'TIDAK HADIR';
    }[];
  }[];
  timestamp?: any;
}

export const firebaseService = {
  submitAttendance: async (record: AttendanceRecord) => {
    try {
      // Simpan ke node 'kehadiran_murid'
      const attendanceRef = ref(db, 'kehadiran_murid');
      const newRecordRef = push(attendanceRef);
      await set(newRecordRef, {
        ...record,
        timestamp: serverTimestamp()
      });
      console.log("Data berjaya disimpan ke Asia Region DB:", newRecordRef.key);
      return { success: true, id: newRecordRef.key };
    } catch (e) {
      console.error("Ralat Firebase:", e);
      throw e;
    }
  },

  getAttendanceByUnit: async (unitName: string): Promise<AttendanceRecord[]> => {
    try {
      const dbRef = ref(db, 'kehadiran_murid');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const records: AttendanceRecord[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Tapis ikut nama unit (case insensitive & buang whitespace)
        return records
          .filter(r => r.unitName && r.unitName.toLowerCase().trim() === unitName.toLowerCase().trim())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch (e) {
      console.error("Gagal mengambil data kehadiran:", e);
      return [];
    }
  },

  // Weekly Report Functions
  submitWeeklyReport: async (report: WeeklyReportData) => {
    try {
      // Simpan ke node 'laporan_mingguan'
      const reportRef = ref(db, 'laporan_mingguan');
      const newReportRef = push(reportRef);
      await set(newReportRef, {
        ...report,
        timestamp: serverTimestamp()
      });
      console.log("Laporan mingguan berjaya disimpan ke Firebase:", newReportRef.key);
      return { success: true, id: newReportRef.key };
    } catch (e) {
      console.error("Ralat Firebase simpan laporan:", e);
      throw e;
    }
  },

  getWeeklyReportsByUnit: async (unitName: string, year?: number): Promise<WeeklyReportData[]> => {
    try {
      const dbRef = ref(db, 'laporan_mingguan');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const reports: WeeklyReportData[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Tapis ikut nama unit dan tahun (jika diberi)
        let filtered = reports.filter(r =>
          r.unitName && r.unitName.toLowerCase().trim() === unitName.toLowerCase().trim()
        );

        if (year) {
          filtered = filtered.filter(r => r.year === year);
        }

        return filtered.sort((a, b) => new Date(b.tarikh).getTime() - new Date(a.tarikh).getTime());
      }
      return [];
    } catch (e) {
      console.error("Gagal mengambil laporan mingguan:", e);
      return [];
    }
  },

  updateWeeklyReportPdfUrl: async (reportId: string, pdfUrl: string) => {
    try {
      const reportRef = ref(db, `laporan_mingguan/${reportId}`);
      await update(reportRef, { pdfUrl });
      console.log("PDF URL dikemaskini untuk laporan:", reportId);
      return { success: true };
    } catch (e) {
      console.error("Gagal kemaskini PDF URL:", e);
      throw e;
    }
  },

  deleteWeeklyReport: async (reportId: string) => {
    try {
      const reportRef = ref(db, `laporan_mingguan/${reportId}`);
      await remove(reportRef);
      console.log("Laporan dipadam dari Firebase:", reportId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam laporan:", e);
      throw e;
    }
  },

  // Meeting Schedule Functions
  saveMeetingSchedule: async (schedule: MeetingSchedule) => {
    try {
      const scheduleRef = ref(db, 'meeting_schedules');
      const newScheduleRef = push(scheduleRef);
      await set(newScheduleRef, {
        ...schedule,
        createdAt: Date.now()
      });
      console.log("Jadual perjumpaan disimpan:", newScheduleRef.key);
      return { success: true, id: newScheduleRef.key };
    } catch (e) {
      console.error("Gagal simpan jadual:", e);
      throw e;
    }
  },

  getMeetingSchedules: async (year: number): Promise<MeetingSchedule[]> => {
    try {
      const dbRef = ref(db, 'meeting_schedules');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const schedules: MeetingSchedule[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        return schedules
          .filter(s => s.year === year)
          .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
      }
      return [];
    } catch (e) {
      console.error("Gagal ambil jadual:", e);
      return [];
    }
  },

  deleteMeetingSchedule: async (scheduleId: string) => {
    try {
      const scheduleRef = ref(db, `meeting_schedules/${scheduleId}`);
      await remove(scheduleRef);
      console.log("Jadual dipadam:", scheduleId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam jadual:", e);
      throw e;
    }
  },

  // Achievement/Hall of Fame Functions
  saveAchievement: async (achievement: Omit<Achievement, 'id'> | Achievement) => {
    try {
      if ('id' in achievement && achievement.id) {
        // Update existing
        const achievementRef = ref(db, `achievements/${achievement.id}`);
        await update(achievementRef, achievement);
        console.log("Achievement updated:", achievement.id);
        return { success: true, id: achievement.id };
      } else {
        // Create new
        const achievementsRef = ref(db, 'achievements');
        const newAchievementRef = push(achievementsRef);
        const newId = newAchievementRef.key!;
        await set(newAchievementRef, {
          ...achievement,
          id: newId,
          createdAt: Date.now()
        });
        console.log("Achievement created:", newId);
        return { success: true, id: newId };
      }
    } catch (e) {
      console.error("Failed to save achievement:", e);
      throw e;
    }
  },

  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const dbRef = ref(db, 'achievements');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const achievements: Achievement[] = Object.keys(data).map(key => ({
          ...data[key],
          id: data[key].id || key
        }));

        return achievements.sort((a, b) => b.year - a.year);
      }
      return [];
    } catch (e) {
      console.error("Failed to fetch achievements:", e);
      return [];
    }
  },

  deleteAchievement: async (achievementId: string | number) => {
    try {
      const achievementRef = ref(db, `achievements/${achievementId}`);
      await remove(achievementRef);
      console.log("Achievement deleted:", achievementId);
      return { success: true };
    } catch (e) {
      console.error("Failed to delete achievement:", e);
      throw e;
    }
  }
};
