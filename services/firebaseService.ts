
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, serverTimestamp, query, orderByChild, equalTo, get, remove, update } from "firebase/database";
import { MeetingSchedule, WeeklyReportData, OrgChartData, AnnualPlanData } from '../types';
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

  updateMeetingSchedule: async (scheduleId: string, schedule: Partial<MeetingSchedule>) => {
    try {
      const scheduleRef = ref(db, `meeting_schedules/${scheduleId}`);
      await update(scheduleRef, schedule);
      console.log("Jadual dikemaskini:", scheduleId);
      return { success: true };
    } catch (e) {
      console.error("Gagal kemaskini jadual:", e);
      throw e;
    }
  },

  // Bulk seed 1M1S schedules for 2026
  seed1M1SSchedules2026: async () => {
    try {
      const schedules: MeetingSchedule[] = [
        // UB (Unit Beruniform) - 13 weeks
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 1, meetingDate: '2026-01-21', deadline: '2026-01-28', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 2, meetingDate: '2026-02-04', deadline: '2026-02-11', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 3, meetingDate: '2026-02-25', deadline: '2026-03-04', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 4, meetingDate: '2026-03-11', deadline: '2026-03-18', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 5, meetingDate: '2026-06-10', deadline: '2026-06-24', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 6, meetingDate: '2026-07-01', deadline: '2026-07-08', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 7, meetingDate: '2026-07-15', deadline: '2026-07-22', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 8, meetingDate: '2026-07-29', deadline: '2026-08-05', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 9, meetingDate: '2026-08-12', deadline: '2026-08-19', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 10, meetingDate: '2026-08-26', deadline: '2026-09-09', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 11, meetingDate: '2026-09-23', deadline: '2026-09-30', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 12, meetingDate: '2026-10-07', deadline: '2026-10-14', year: 2026 },
        { category: 'UNIT_BERUNIFORM' as UnitCategory, weekNumber: 13, meetingDate: '2026-10-21', deadline: '2026-10-28', year: 2026 },

        // KP (Kelab Persatuan) - 13 weeks
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 1, meetingDate: '2026-01-28', deadline: '2026-02-04', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 2, meetingDate: '2026-02-11', deadline: '2026-02-25', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 3, meetingDate: '2026-03-04', deadline: '2026-03-11', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 4, meetingDate: '2026-03-18', deadline: '2026-06-10', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 5, meetingDate: '2026-06-24', deadline: '2026-07-01', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 6, meetingDate: '2026-07-08', deadline: '2026-07-15', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 7, meetingDate: '2026-07-22', deadline: '2026-07-29', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 8, meetingDate: '2026-08-05', deadline: '2026-08-12', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 9, meetingDate: '2026-08-19', deadline: '2026-08-26', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 10, meetingDate: '2026-09-09', deadline: '2026-09-23', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 11, meetingDate: '2026-09-30', deadline: '2026-10-07', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 12, meetingDate: '2026-10-14', deadline: '2026-10-21', year: 2026 },
        { category: 'KELAB_PERSATUAN' as UnitCategory, weekNumber: 13, meetingDate: '2026-10-28', deadline: '2026-11-04', year: 2026 },
      ];

      // Save all schedules
      const promises = schedules.map(schedule => {
        const schedulesRef = ref(db, 'meeting_schedules');
        const newScheduleRef = push(schedulesRef);
        return set(newScheduleRef, {
          ...schedule,
          createdAt: Date.now()
        });
      });

      await Promise.all(promises);
      console.log("✅ 1M1S 2026 schedules seeded successfully!");
      return { success: true, count: schedules.length };
    } catch (e) {
      console.error("Failed to seed 1M1S schedules:", e);
      throw e;
    }
  },

  // Check if 2026 schedules already exist
  check2026SchedulesExist: async (): Promise<boolean> => {
    try {
      const dbRef = ref(db, 'meeting_schedules');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const schedules = Object.values(data) as MeetingSchedule[];
        const has2026 = schedules.some(s => s.year === 2026);
        return has2026;
      }
      return false;
    } catch (e) {
      console.error("Failed to check 2026 schedules:", e);
      return false;
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
  },

  // Organizational Chart Functions
  submitOrgChart: async (orgChart: OrgChartData) => {
    try {
      // Simpan ke node 'carta_organisasi'
      const orgChartRef = ref(db, 'carta_organisasi');
      const newOrgChartRef = push(orgChartRef);
      await set(newOrgChartRef, {
        ...orgChart,
        timestamp: serverTimestamp()
      });
      console.log("Carta Organisasi berjaya disimpan ke Firebase:", newOrgChartRef.key);
      return { success: true, id: newOrgChartRef.key };
    } catch (e) {
      console.error("Ralat Firebase simpan carta organisasi:", e);
      throw e;
    }
  },

  getOrgChartsByUnit: async (unitName: string, year?: number): Promise<OrgChartData[]> => {
    try {
      const dbRef = ref(db, 'carta_organisasi');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const orgCharts: OrgChartData[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Tapis ikut nama unit dan tahun (jika diberi)
        let filtered = orgCharts.filter(r =>
          r.unitName && r.unitName.toLowerCase().trim() === unitName.toLowerCase().trim()
        );

        if (year) {
          filtered = filtered.filter(r => r.year === year);
        }

        return filtered.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        });
      }
      return [];
    } catch (e) {
      console.error("Gagal mengambil carta organisasi:", e);
      return [];
    }
  },

  updateOrgChartPdfUrl: async (orgChartId: string, pdfUrl: string) => {
    try {
      const orgChartRef = ref(db, `carta_organisasi/${orgChartId}`);
      await update(orgChartRef, { pdfUrl });
      console.log("PDF URL dikemaskini untuk carta organisasi:", orgChartId);
      return { success: true };
    } catch (e) {
      console.error("Gagal kemaskini PDF URL:", e);
      throw e;
    }
  },

  deleteOrgChart: async (orgChartId: string) => {
    try {
      const orgChartRef = ref(db, `carta_organisasi/${orgChartId}`);
      await remove(orgChartRef);
      console.log("Carta Organisasi dipadam dari Firebase:", orgChartId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam carta organisasi:", e);
      throw e;
    }
  },

  // Annual Plan Functions
  submitAnnualPlan: async (annualPlan: AnnualPlanData) => {
    try {
      // Simpan ke node 'rancangan_tahunan'
      const annualPlanRef = ref(db, 'rancangan_tahunan');
      const newAnnualPlanRef = push(annualPlanRef);
      await set(newAnnualPlanRef, {
        ...annualPlan,
        timestamp: serverTimestamp()
      });
      console.log("Rancangan Tahunan berjaya disimpan ke Firebase:", newAnnualPlanRef.key);
      return { success: true, id: newAnnualPlanRef.key };
    } catch (e) {
      console.error("Ralat Firebase simpan rancangan tahunan:", e);
      throw e;
    }
  },

  getAnnualPlansByUnit: async (unitName: string, year?: number): Promise<AnnualPlanData[]> => {
    try {
      const dbRef = ref(db, 'rancangan_tahunan');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const annualPlans: AnnualPlanData[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Tapis ikut nama unit dan tahun (jika diberi)
        let filtered = annualPlans.filter(r =>
          r.unitName && r.unitName.toLowerCase().trim() === unitName.toLowerCase().trim()
        );

        if (year) {
          filtered = filtered.filter(r => r.year === year);
        }

        return filtered.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        });
      }
      return [];
    } catch (e) {
      console.error("Gagal mengambil rancangan tahunan:", e);
      return [];
    }
  },

  updateAnnualPlanPdfUrl: async (annualPlanId: string, pdfUrl: string) => {
    try {
      const annualPlanRef = ref(db, `rancangan_tahunan/${annualPlanId}`);
      await update(annualPlanRef, { pdfUrl });
      console.log("PDF URL dikemaskini untuk rancangan tahunan:", annualPlanId);
      return { success: true };
    } catch (e) {
      console.error("Gagal kemaskini PDF URL:", e);
      throw e;
    }
  },

  deleteAnnualPlan: async (annualPlanId: string) => {
    try {
      const annualPlanRef = ref(db, `rancangan_tahunan/${annualPlanId}`);
      await remove(annualPlanRef);
      console.log("Rancangan Tahunan dipadam dari Firebase:", annualPlanId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam rancangan tahunan:", e);
      throw e;
    }
  }
};
