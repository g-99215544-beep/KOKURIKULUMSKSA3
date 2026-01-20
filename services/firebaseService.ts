
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, serverTimestamp, query, orderByChild, equalTo, get, remove } from "firebase/database";
import { MeetingSchedule } from '../types';

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
  }
};
