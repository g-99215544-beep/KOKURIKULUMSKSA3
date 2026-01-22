
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, serverTimestamp, query, orderByChild, equalTo, get, remove, update } from "firebase/database";
import { MeetingSchedule, WeeklyReportData, UnitFlare } from '../types';
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

export interface OrgChartData {
  id?: string;
  unitId: string;
  unitName: string;
  year: number;
  pengerusi: string;
  naibPengerusi: string;
  setiausaha: string;
  penSetiausaha: string;
  bendahari: string;
  penBendahari: string;
  ajk: string;
  pdfUrl?: string;
  timestamp?: any;
  updatedAt?: any;
}

export interface AnnualPlanData {
  id?: string;
  unitId: string;
  unitName: string;
  year: number;
  planItems: {
    month: string;
    date: string;
    activity: string;
    remarks: string;
  }[];
  pdfUrl?: string;
  timestamp?: any;
  updatedAt?: any;
}

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

  // Update existing attendance record
  updateAttendance: async (recordId: string, record: AttendanceRecord) => {
    try {
      const attendanceRef = ref(db, `kehadiran_murid/${recordId}`);
      await update(attendanceRef, {
        ...record,
        updatedAt: serverTimestamp()
      });
      console.log("Kehadiran berjaya dikemaskini:", recordId);
      return { success: true, id: recordId };
    } catch (e) {
      console.error("Ralat kemaskini kehadiran:", e);
      throw e;
    }
  },

  // Delete attendance record
  deleteAttendance: async (recordId: string) => {
    try {
      const attendanceRef = ref(db, `kehadiran_murid/${recordId}`);
      await remove(attendanceRef);
      console.log("Kehadiran dipadam:", recordId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam kehadiran:", e);
      throw e;
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

  // Update existing weekly report
  updateWeeklyReport: async (reportId: string, report: WeeklyReportData) => {
    try {
      const reportRef = ref(db, `laporan_mingguan/${reportId}`);
      await update(reportRef, {
        ...report,
        updatedAt: serverTimestamp()
      });
      console.log("Laporan mingguan berjaya dikemaskini:", reportId);
      return { success: true, id: reportId };
    } catch (e) {
      console.error("Ralat kemaskini laporan:", e);
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

  updateMeetingSchedule: async (scheduleId: string, schedule: MeetingSchedule) => {
    try {
      const scheduleRef = ref(db, `meeting_schedules/${scheduleId}`);
      await update(scheduleRef, {
        ...schedule,
        updatedAt: Date.now()
      });
      console.log("Jadual dikemaskini:", scheduleId);
      return { success: true, id: scheduleId };
    } catch (e) {
      console.error("Gagal kemaskini jadual:", e);
      throw e;
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
  },

  // ======= CARTA ORGANISASI FUNCTIONS =======
  saveOrgChart: async (data: OrgChartData) => {
    try {
      const newRef = push(ref(db, 'carta_organisasi'));
      await set(newRef, {
        ...data,
        timestamp: serverTimestamp()
      });
      console.log("Carta organisasi disimpan:", newRef.key);
      return { success: true, id: newRef.key };
    } catch (e) {
      console.error("Ralat simpan carta:", e);
      throw e;
    }
  },

  updateOrgChart: async (chartId: string, data: OrgChartData) => {
    try {
      const chartRef = ref(db, `carta_organisasi/${chartId}`);
      await update(chartRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log("Carta organisasi dikemaskini:", chartId);
      return { success: true, id: chartId };
    } catch (e) {
      console.error("Ralat kemaskini carta:", e);
      throw e;
    }
  },

  getOrgChartByUnit: async (unitName: string, year: number): Promise<OrgChartData[]> => {
    try {
      const dbRef = ref(db, 'carta_organisasi');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const records: OrgChartData[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        return records.filter(r =>
          r.unitName?.toLowerCase().trim() === unitName.toLowerCase().trim() &&
          r.year === year
        );
      }
      return [];
    } catch (e) {
      console.error("Gagal ambil carta:", e);
      return [];
    }
  },

  deleteOrgChart: async (chartId: string) => {
    try {
      const chartRef = ref(db, `carta_organisasi/${chartId}`);
      await remove(chartRef);
      console.log("Carta organisasi dipadam:", chartId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam carta:", e);
      throw e;
    }
  },

  // ======= RANCANGAN TAHUNAN FUNCTIONS =======
  saveAnnualPlan: async (data: AnnualPlanData) => {
    try {
      const newRef = push(ref(db, 'rancangan_tahunan'));
      await set(newRef, {
        ...data,
        timestamp: serverTimestamp()
      });
      console.log("Rancangan tahunan disimpan:", newRef.key);
      return { success: true, id: newRef.key };
    } catch (e) {
      console.error("Ralat simpan rancangan:", e);
      throw e;
    }
  },

  updateAnnualPlan: async (planId: string, data: AnnualPlanData) => {
    try {
      const planRef = ref(db, `rancangan_tahunan/${planId}`);
      await update(planRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log("Rancangan tahunan dikemaskini:", planId);
      return { success: true, id: planId };
    } catch (e) {
      console.error("Ralat kemaskini rancangan:", e);
      throw e;
    }
  },

  getAnnualPlanByUnit: async (unitName: string, year: number): Promise<AnnualPlanData[]> => {
    try {
      const dbRef = ref(db, 'rancangan_tahunan');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const records: AnnualPlanData[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        return records.filter(r =>
          r.unitName?.toLowerCase().trim() === unitName.toLowerCase().trim() &&
          r.year === year
        );
      }
      return [];
    } catch (e) {
      console.error("Gagal ambil rancangan:", e);
      return [];
    }
  },

  deleteAnnualPlan: async (planId: string) => {
    try {
      const planRef = ref(db, `rancangan_tahunan/${planId}`);
      await remove(planRef);
      console.log("Rancangan tahunan dipadam:", planId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam rancangan:", e);
      throw e;
    }
  },

  // ======= FLARE/PERINGATAN FUNCTIONS =======
  saveFlare: async (flare: UnitFlare) => {
    try {
      const newRef = push(ref(db, 'unit_flares'));
      await set(newRef, {
        ...flare,
        createdAt: Date.now()
      });
      console.log("Flare disimpan:", newRef.key);
      return { success: true, id: newRef.key };
    } catch (e) {
      console.error("Ralat simpan flare:", e);
      throw e;
    }
  },

  getFlaresByUnit: async (unitName: string, year: number): Promise<UnitFlare[]> => {
    try {
      const dbRef = ref(db, 'unit_flares');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const flares: UnitFlare[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        return flares.filter(f =>
          f.unitName?.toLowerCase().trim() === unitName.toLowerCase().trim() &&
          f.year === year
        );
      }
      return [];
    } catch (e) {
      console.error("Gagal ambil flares:", e);
      return [];
    }
  },

  getFlaresByCategory: async (category: string, year: number): Promise<UnitFlare[]> => {
    try {
      const dbRef = ref(db, 'unit_flares');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const flares: UnitFlare[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        return flares.filter(f => f.category === category && f.year === year);
      }
      return [];
    } catch (e) {
      console.error("Gagal ambil flares by category:", e);
      return [];
    }
  },

  deleteFlare: async (flareId: string) => {
    try {
      const flareRef = ref(db, `unit_flares/${flareId}`);
      await remove(flareRef);
      console.log("Flare dipadam:", flareId);
      return { success: true };
    } catch (e) {
      console.error("Gagal padam flare:", e);
      throw e;
    }
  },

  deleteFlareByTypeAndUnit: async (unitName: string, flareType: string, year: number, weekNumber?: number) => {
    try {
      const dbRef = ref(db, 'unit_flares');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        for (const key of Object.keys(data)) {
          const flare = data[key];
          const matchesUnit = flare.unitName?.toLowerCase().trim() === unitName.toLowerCase().trim();
          const matchesType = flare.flareType === flareType;
          const matchesYear = flare.year === year;
          const matchesWeek = weekNumber ? flare.weekNumber === weekNumber : true;

          if (matchesUnit && matchesType && matchesYear && matchesWeek) {
            await remove(ref(db, `unit_flares/${key}`));
            console.log("Flare auto-removed:", key);
          }
        }
      }
      return { success: true };
    } catch (e) {
      console.error("Gagal auto-remove flare:", e);
      throw e;
    }
  }
};
