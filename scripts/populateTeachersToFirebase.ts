/**
 * Skrip untuk populate semua senarai guru ke Firebase
 * Jalankan sekali sahaja untuk migration
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Konfigurasi Firebase
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
const db = getDatabase(app, "https://kokodata-5d5e2-default-rtdb.asia-southeast1.firebasedatabase.app");

// Senarai lengkap semua unit dengan guru-guru mereka
const allUnitsTeachers = [
  // Unit Beruniform
  {
    unitId: 'ub1',
    unitName: 'Pengakap',
    teachers: [
      "Amirul Ariff Bin Yusof",
      "Wan Ahmad Bin Wan Ibrahim",
      "Sharwinthiran A/L Thavarajah",
      "Muhammad Ihsan B. Shaik Ali",
      "Muhammad Yasin Bin Abdul Aziz",
      "Magaletchumi A/P Veerappen",
      "Nur Zuhaira Binti Mohamed Salib",
      "Vineeta A/P Singaraveloo"
    ]
  },
  {
    unitId: 'ub2',
    unitName: 'Tunas Kadet Remaja Sekolah (TKRS)',
    teachers: [
      "Muhammad Sufian Bin Mustafa Bakri",
      "Nur Izzati Binti Mohd. Khalil",
      "Norlizam Bin Idrose",
      "Muhammad Ammar Bin Mustafa",
      "Mohamad Solehulhafiz B. Mohd. Suhaimi",
      "Nur Elyia Bt. Mohd. Zin",
      "Nur Hazierah Binti Azmi",
      "Chin Yan Ning"
    ]
  },
  {
    unitId: 'ub3',
    unitName: 'Puteri Islam',
    teachers: [
      "Nur Hidayah Binti Abdul Jalil",
      "Afieyfah Binti Mohd Alim",
      "Nur Izzati Binti Samsudin",
      "Radhiah Binti Zainon",
      "Aina Amirah Binti Halim",
      "Nurfatin Afiqah Binti Hamzah",
      "Noor Hidayah Bt. Salleh"
    ]
  },
  {
    unitId: 'ub4',
    unitName: 'Pandu Puteri Tunas',
    teachers: [
      "Ng Shi Hui",
      "Dr. Renukha A/P Nallasamy",
      "Nur Zurainie Binti Mohd Fauzi",
      "Nur Syafiqah Binti Nizamdin",
      "Hamdina Nurarifah Binti Ahmad @ Zamri",
      "Saridah Tk Md Yusoff",
      "Punitha A/P Munusamy",
      "Pamela Khoo Bee Lay",
      "Nur Izzany Binti Mohd"  // TAMBAHAN BARU
    ]
  },

  // Kelab & Persatuan
  {
    unitId: 'kp1',
    unitName: 'Kelab Doktor Muda',
    teachers: [
      "Aina Amirah Binti Halim",
      "Chin Yan Ning",
      "Amirul Ariff Bin Yusof",
      "Nur Izzati Binti Samsudin",
      "Nur Izzany Binti Mohd"
    ]
  },
  {
    unitId: 'kp2',
    unitName: 'Kelab STEM & Robotik',
    teachers: [
      "Wan Ahmad Bin Wan Ibrahim",
      "Muhammad Sufian Bin Mustafa Bakri",
      "Muhammad Ihsan B. Shaik Ali",
      "Nur Zuhaira Binti Mohamed Salib"
    ]
  },
  {
    unitId: 'kp3',
    unitName: 'Kelab Kitar Semula',
    teachers: [
      "Muhammad Ammar Bin Mustafa",
      "Asqalani Bin Suhaimi",
      "Nur Izzati Binti Mohd. Khalil",
      "Magaletchumi A/P Veerappen"
    ]
  },
  {
    unitId: 'kp4',
    unitName: 'Kelab Muzik & Kebudayaan',
    teachers: [
      "Pamela Khoo Bee Lay",
      "Muhammad Yasin Bin Abdul Aziz",
      "Ng Shi Hui",
      "Nur Hazierah Binti Azmi",
      "Vineeta A/P Singaraveloo"
    ]
  },
  {
    unitId: 'kp5',
    unitName: 'Kelab TVPSS / Pusat Sumber',
    teachers: [
      "Nur Syafiqah Binti Nizamdin",
      "Norlizam Bin Idrose",
      "Punitha A/P Munusamy"
    ]
  },
  {
    unitId: 'kp6',
    unitName: 'Persatuan Bahasa',
    teachers: [
      "Hamdina Nurarifah Binti Ahmad @ Zamri",
      "Sharwinthiran A/L Thavarajah",
      "Nur Elya Bt. Mohd. Zin",
      "Dr. Renukha A/P Nallasamy",
      "Saridah Tk Md Yusoff"
    ]
  },
  {
    unitId: 'kp7',
    unitName: 'Persatuan Agama Islam',
    teachers: [
      "Nur Hidayah Binti Abdul Jalil",
      "Afieyfah Binti Mohd Alim",
      "Radhiah Binti Zainon",
      "Nurfatin Afiqah Binti Hamzah",
      "Noor Hidayah Bt. Salleh"
    ]
  },

  // 1M1S
  {
    unitId: 's1',
    unitName: 'Bola Sepak',
    teachers: [
      "Muhammad Ihsan B. Shaik Ali",
      "Asqalani Bin Suhaimi",
      "Nur Izzany Binti Mohd",
      "Hamdina Nurarifah Binti Ahmad @ Zamri",
      "Nur Izzati Binti Samsudin"
    ]
  },
  {
    unitId: 's2',
    unitName: 'Bola Jaring',
    teachers: [
      "Nur Elya Bt. Mohd. Zin",
      "Nur Hazierah Binti Azmi",
      "Nur Zuhaira Binti Mohamed Salib",
      "Vineeta A/P Singaraveloo",
      "Nur Hidayah Binti Abdul Jalil"
    ]
  },
  {
    unitId: 's3',
    unitName: 'Bola Baling',
    teachers: [
      "Radhiah Binti Zainon",
      "Wan Ahmad Bin Wan Ibrahim",
      "Amirul Ariff Bin Yusof",
      "Nur Syafiqah Binti Nizamdin",
      "Nurfatin Afiqah Binti Hamzah",
      "Noor Hidayah Bt. Salleh"
    ]
  },
  {
    unitId: 's4',
    unitName: 'Badminton',
    teachers: [
      "Dr. Renukha A/P Nallasamy",
      "Saridah Tk Md Yusoff",
      "Muhammad Ammar Bin Mustafa",
      "Afiyefah Binti Mohd Alim",
      "Pamela Khoo Bee Lay"
    ]
  },
  {
    unitId: 's5',
    unitName: 'Olahraga',
    teachers: [
      "Punitha A/P Munusamy",
      "Chin Yan Ning",
      "Ng Shi Hui",
      "Norlizam Bin Idrose",
      "Sharwinthiran A/L Thavarajah",
      "Muhammad Yasin Bin Abdul Aziz"
    ]
  },
  {
    unitId: 's6',
    unitName: 'Catur',
    teachers: [
      "Nur Izzati Binti Mohd. Khalil",
      "Muhammad Sufian Bin Mustafa Bakri",
      "Nur Zurainie Binti Mohd Fauzi",
      "Magaletchumi A/P Veerappen",
      "Aina Amirah Binti Halim"
    ]
  }
];

async function populateTeachers() {
  console.log("🚀 Mula populate senarai guru ke Firebase...\n");

  let successCount = 0;
  let failCount = 0;

  for (const unit of allUnitsTeachers) {
    try {
      const teacherRef = ref(db, `unit_teachers/${unit.unitId}`);
      await set(teacherRef, {
        unitId: unit.unitId,
        unitName: unit.unitName,
        teachers: unit.teachers,
        updatedAt: Date.now()
      });

      console.log(`✅ ${unit.unitName} - ${unit.teachers.length} guru disimpan`);
      successCount++;
    } catch (error) {
      console.error(`❌ Gagal simpan ${unit.unitName}:`, error);
      failCount++;
    }
  }

  console.log(`\n📊 Ringkasan:`);
  console.log(`   Berjaya: ${successCount}`);
  console.log(`   Gagal: ${failCount}`);
  console.log(`   Jumlah unit: ${allUnitsTeachers.length}`);
  console.log(`\n✨ Selesai! Semua senarai guru telah disimpan ke Firebase.`);

  process.exit(0);
}

populateTeachers().catch(error => {
  console.error("❌ Ralat kritikal:", error);
  process.exit(1);
});
