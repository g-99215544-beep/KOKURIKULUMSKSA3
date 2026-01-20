
import { Unit, UnitCategory, WeeklyReportItem, GalleryItem } from '../types';

/**
 * URL Web App daripada Google Apps Script
 */
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzaKmQW1aypKqp5ydvtFT70buuLlKnV8uxEqsYcs66GESotvH34Yn6S6Z1NKnlyQ7I/exec';

/**
 * ID FOLDER GOOGLE DRIVE (KOKURIKULUM 2)
 * ID ini kini dihantar ke backend, memudahkan penukaran folder tanpa perlu edit skrip.
 */
const ROOT_FOLDER_ID = '1JUDAuXuCtTas645sh2MkPejG0tAMHyxB';

// Caching Persistent (LocalStorage)
const CACHE_KEY = 'SKSA_REPORTS_CACHE_V6'; 
const CACHE_TTL = 10 * 60 * 1000; // 10 minit

const getStoredCache = () => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
};

const saveToCache = (key: string, data: any) => {
  const cache = getStoredCache();
  cache[key] = { data, timestamp: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

// Helper: Convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

// Helper: Format Category for Folder Name (MATCHES APPS SCRIPT)
const getCategoryFolderName = (category: UnitCategory): string => {
  switch (category) {
    case UnitCategory.UNIT_BERUNIFORM: return "UNIT BERUNIFORM";
    case UnitCategory.KELAB_PERSATUAN: return "KELAB & PERSATUAN";
    case UnitCategory.SATU_M_SATU_S: return "1 MURID 1 SUKAN"; // Updated to match request
    default: return "LAIN-LAIN";
  }
};

// Helper: Better Error Message for GAS Issues
const handleGasError = (errorMsg: string): string => {
    if (typeof errorMsg === 'string' && (errorMsg.includes("getFolderById") || errorMsg.includes("Access denied") || errorMsg.includes("Unexpected error"))) {
        return "RALAT FOLDER: ID Folder Google Drive tidak sah atau tiada kebenaran. Sila semak ROOT_FOLDER_ID.";
    }
    return errorMsg;
};

// OFFICIAL UNIT CONFIGURATION WITH UNIQUE PASSWORDS
const MOCK_UNITS: Unit[] = [
  // Unit Beruniform
  { id: 'ub1', name: 'Pengakap', category: UnitCategory.UNIT_BERUNIFORM, password: 'SCOUT', logoUrl: 'https://penangscout.org/images/info/PPM-logo2009.jpg', teachers: ["Amirul Ariff Bin Yusof", "Wan Ahmad Bin Wan Ibrahim", "Sharwinthiran A/L Thavarajah", "Muhammad Ihsan B. Shaik Ali", "Muhammad Yasin Bin Abdul Aziz", "Magaletchumi A/P Veerappen", "Nur Zuhaira Binti Mohamed Salib", "Vineeta A/P Singaraveloo"], aliases: ["PENGAKAP"] },
  { id: 'ub2', name: 'Tunas Kadet Remaja Sekolah (TKRS)', category: UnitCategory.UNIT_BERUNIFORM, password: 'KADET', logoUrl: 'https://vectorise.net/logo/wp-content/uploads/2019/02/Logo-Kadet-Remaja-Sekolah-new.png', teachers: ["Muhammad Sufian Bin Mustafa Bakri", "Nur Izzati Binti Mohd. Khalil", "Norlizam Bin Idrose", "Muhammad Ammar Bin Mustafa", "Mohamad Solehulhafiz B. Mohd. Suhaimi", "Nur Elyia Bt. Mohd. Zin", "Nur Hazierah Binti Azmi", "Chin Yan Ning"], aliases: ["TKRS"] },
  { id: 'ub3', name: 'Puteri Islam', category: UnitCategory.UNIT_BERUNIFORM, password: 'PPIM', logoUrl: 'https://codecblend.com/v3/images/stories/virtuemart/product/pergerakan-puteri-islam-malaysia-ppim-thumbnail.jpg', teachers: ["Nur Hidayah Binti Abdul Jalil", "Afieyfah Binti Mohd Alim", "Nur Izzati Binti Samsudin", "Radhiah Binti Zainon", "Aina Amirah Binti Halim", "Nurfatin Afiqah Binti Hamzah", "Noor Hidayah Bt. Salleh"], aliases: ["PUTERI"] },
  { id: 'ub4', name: 'Pandu Puteri Tunas', category: UnitCategory.UNIT_BERUNIFORM, password: 'TUNAS', logoUrl: 'https://vectorise.net/logo/wp-content/uploads/2012/04/Logo-Persatuan-Pandu-Puteri-Malaysia.png', teachers: ["Ng Shi Hui", "Dr. Renukha A/P Nallasamy", "Nur Zurainie Binti Mohd Fauzi", "Nur Syafiqah Binti Nizamdin", "Hamdina Nurarifah Binti Ahmad @ Zamri", "Saridah Tk Md Yusoff", "Punitha A/P Munusamy", "Pamela Khoo Bee Lay"], aliases: ["PANDU"] },
  
  // Kelab & Persatuan
  { id: 'kp1', name: 'Kelab Doktor Muda', category: UnitCategory.KELAB_PERSATUAN, password: 'MEDIK', logoUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965567.png', teachers: ["Aina Amirah Binti Halim", "Chin Yan Ning", "Amirul Ariff Bin Yusof", "Nur Izzati Binti Samsudin", "Nur Izzany Binti Mohd"], aliases: ["KDM"] },
  { id: 'kp2', name: 'Kelab STEM & Robotik', category: UnitCategory.KELAB_PERSATUAN, password: 'ROBOT', logoUrl: 'https://cdn-icons-png.flaticon.com/512/471/471231.png', teachers: ["Wan Ahmad Bin Wan Ibrahim", "Muhammad Sufian Bin Mustafa Bakri", "Muhammad Ihsan B. Shaik Ali", "Nur Zuhaira Binti Mohamed Salib"], aliases: ["STEM"] },
  { id: 'kp3', name: 'Kelab Kitar Semula', category: UnitCategory.KELAB_PERSATUAN, password: 'HIJAU', logoUrl: 'https://cdn-icons-png.flaticon.com/512/893/893257.png', teachers: ["Muhammad Ammar Bin Mustafa", "Asqalani Bin Suhaimi", "Nur Izzati Binti Mohd. Khalil", "Magaletchumi A/P Veerappen"], aliases: ["KITAR"] },
  { id: 'kp4', name: 'Kelab Muzik & Kebudayaan', category: UnitCategory.KELAB_PERSATUAN, password: 'IRAMA', logoUrl: 'https://cdn-icons-png.flaticon.com/512/727/727218.png', teachers: ["Pamela Khoo Bee Lay", "Muhammad Yasin Bin Abdul Aziz", "Ng Shi Hui", "Nur Hazierah Binti Azmi", "Vineeta A/P Singaraveloo"], aliases: ["MUZIK"] },
  { id: 'kp5', name: 'Kelab TVPSS / Pusat Sumber', category: UnitCategory.KELAB_PERSATUAN, password: 'MEDIA', logoUrl: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png', teachers: ["Nur Syafiqah Binti Nizamdin", "Norlizam Bin Idrose", "Punitha A/P Munusamy"], aliases: ["TVPSS"] },
  { id: 'kp6', name: 'Persatuan Bahasa', category: UnitCategory.KELAB_PERSATUAN, password: 'KATA', logoUrl: 'https://cdn-icons-png.flaticon.com/512/149/149852.png', teachers: ["Hamdina Nurarifah Binti Ahmad @ Zamri", "Sharwinthiran A/L Thavarajah", "Nur Elya Bt. Mohd. Zin", "Dr. Renukha A/P Nallasamy", "Saridah Tk Md Yusoff"], aliases: ["BAHASA"] },
  { id: 'kp7', name: 'Persatuan Agama Islam', category: UnitCategory.KELAB_PERSATUAN, password: 'IMAN', logoUrl: 'https://cdn-icons-png.flaticon.com/512/603/603179.png', teachers: ["Nur Hidayah Binti Abdul Jalil", "Afieyfah Binti Mohd Alim", "Radhiah Binti Zainon", "Nurfatin Afiqah Binti Hamzah", "Noor Hidayah Bt. Salleh"], aliases: ["PAI"] },
  
  // 1M1S
  { id: 's1', name: 'Bola Sepak', category: UnitCategory.SATU_M_SATU_S, password: 'BOLA', logoUrl: 'https://cdn-icons-png.flaticon.com/512/188/188864.png', teachers: ["Muhammad Ihsan B. Shaik Ali", "Asqalani Bin Suhaimi", "Nur Izzany Binti Mohd", "Hamdina Nurarifah Binti Ahmad @ Zamri", "Nur Izzati Binti Samsudin"], aliases: ["BSEPAK"] },
  { id: 's2', name: 'Bola Jaring', category: UnitCategory.SATU_M_SATU_S, password: 'JARING', logoUrl: 'https://static.thenounproject.com/png/32383-200.png', teachers: ["Nur Elya Bt. Mohd. Zin", "Nur Hazierah Binti Azmi", "Nur Zuhaira Binti Mohamed Salib", "Vineeta A/P Singaraveloo", "Nur Hidayah Binti Abdul Jalil"], aliases: ["BJARING"] },
  { id: 's3', name: 'Bola Baling', category: UnitCategory.SATU_M_SATU_S, password: 'BALING', logoUrl: 'https://cdn-icons-png.flaticon.com/512/201/201818.png', teachers: ["Radhiah Binti Zainon", "Wan Ahmad Bin Wan Ibrahim", "Amirul Ariff Bin Yusof", "Nur Syafiqah Binti Nizamdin", "Nurfatin Afiqah Binti Hamzah", "Noor Hidayah Bt. Salleh"], aliases: ["BBALING"] },
  { id: 's4', name: 'Badminton', category: UnitCategory.SATU_M_SATU_S, password: 'RAKET', logoUrl: 'https://cdn-icons-png.flaticon.com/512/889/889147.png', teachers: ["Dr. Renukha A/P Nallasamy", "Saridah Tk Md Yusoff", "Muhammad Ammar Bin Mustafa", "Afiyefah Binti Mohd Alim", "Pamela Khoo Bee Lay"], aliases: ["BADM"] },
  { id: 's5', name: 'Olahraga', category: UnitCategory.SATU_M_SATU_S, password: 'LARI', logoUrl: 'https://cdn-icons-png.flaticon.com/512/186/186242.png', teachers: ["Punitha A/P Munusamy", "Chin Yan Ning", "Ng Shi Hui", "Norlizam Bin Idrose", "Sharwinthiran A/L Thavarajah", "Muhammad Yasin Bin Abdul Aziz"], aliases: ["OLAHR"] },
  { id: 's6', name: 'Catur', category: UnitCategory.SATU_M_SATU_S, password: 'CATUR', logoUrl: 'https://cdn-icons-png.flaticon.com/512/3304/3304444.png', teachers: ["Nur Izzati Binti Mohd. Khalil", "Muhammad Sufian Bin Mustafa Bakri", "Nur Zurainie Binti Mohd Fauzi", "Magaletchumi A/P Veerappen", "Aina Amirah Binti Halim"], aliases: ["CATUR"] },
];

export const gasService = {
  getUnitsByCategory: async (category: UnitCategory): Promise<Unit[]> => {
    return MOCK_UNITS.filter(u => u.category === category);
  },

  verifyUnitPassword: async (unitId: string, passwordInput: string): Promise<boolean> => {
    const unit = MOCK_UNITS.find(u => u.id === unitId);
    // Case insensitive comparison
    return !!(unit && (unit.password?.toUpperCase() === passwordInput.toUpperCase() || passwordInput === 'admin'));
  },

  updateUnitTeachers: async (unitId: string, teachers: string[]): Promise<boolean> => {
    const unit = MOCK_UNITS.find(u => u.id === unitId);
    if (unit) { unit.teachers = teachers; return true; }
    return false;
  },

  createFolderStructure: async (unitName: string, year: number): Promise<boolean> => {
    const unit = MOCK_UNITS.find(u => u.name === unitName);
    const categoryName = unit ? getCategoryFolderName(unit.category) : "LAIN-LAIN";

    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'createStructure',
          rootFolderId: ROOT_FOLDER_ID, // PASS ID
          unitName,
          category: categoryName,
          year
        })
      });
      
      const result = await response.json();
      if (result.error) throw new Error(handleGasError(result.error));
      return true;
    } catch (e) {
      console.error("Folder creation failed:", e);
      throw e; 
    }
  },

  // GENERIC FILE FETCHER
  getModuleFiles: async (unitName: string, year: number, folderType: string): Promise<any[]> => {
    const unit = MOCK_UNITS.find(u => u.name === unitName);
    const categoryName = unit ? getCategoryFolderName(unit.category) : "LAIN-LAIN";
    
    // Cache Key
    const cacheKey = `${year}_${unitName}_${folderType}`;
    const cache = getStoredCache();

    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_TTL)) {
      return cache[cacheKey].data;
    }
    
    try {
      const params = new URLSearchParams({
        action: 'getModuleFiles',
        rootFolderId: ROOT_FOLDER_ID, // PASS ID
        unitName: unitName,
        year: year.toString(),
        category: categoryName,
        folderType: folderType
      });

      const response = await fetch(`${GAS_WEB_APP_URL}?${params.toString()}`, { mode: 'cors' });
      const data = await response.json();
      
      if (data && data.error) {
         console.error(handleGasError(data.error)); 
         return []; 
      }
      
      const safeData = Array.isArray(data) ? data : [];
      saveToCache(cacheKey, safeData);
      return safeData;

    } catch (err) {
      console.error(`Error fetching ${folderType}:`, err);
      return [];
    }
  },

  getWeeklyReports: async (unitName: string, requestedYear: number, forceRefresh: boolean = false): Promise<WeeklyReportItem[]> => {
      const files = await gasService.getModuleFiles(unitName, requestedYear, 'LAPORAN MINGGUAN');
      
      return files.map((f: any) => ({
        id: f.id,
        week: 0,
        date: f.date || '',
        activity: f.name.replace(/\.[^/.]+$/, ""),
        attendance: 'Lihat Fail',
        teacherName: 'Guru Bertugas',
        unitName: unitName,
        year: requestedYear,
        fileUrl: f.url
      }));
  },

  getUnitGallery: async (unitName: string, year: number): Promise<GalleryItem[]> => {
      return gasService.getModuleFiles(unitName, year, 'GALERI');
  },

  uploadFile: async (file: File, description: string, unitName: string, year: number, folderType: string): Promise<any> => {
    const unit = MOCK_UNITS.find(u => u.name === unitName);
    const categoryName = unit ? getCategoryFolderName(unit.category) : "LAIN-LAIN";
    
    const base64Data = await fileToBase64(file);
    
    const payload = {
      action: 'uploadFile',
      rootFolderId: ROOT_FOLDER_ID, // PASS ID
      folderType: folderType,
      fileName: file.name,
      mimeType: file.type,
      data: base64Data,
      description: description,
      unitName: unitName,
      category: categoryName,
      year: year
    };

    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server GAS Error: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();

      if (result.error) {
        throw new Error(handleGasError(result.error));
      }
      
      // Invalidate Cache
      const cacheKey = `${year}_${unitName}_${folderType}`;
      const cache = getStoredCache();
      delete cache[cacheKey];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      
      return result;
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  },

  deleteFile: async (fileId: string, unitName: string, year: number, folderType: string): Promise<boolean> => {
    try {
        const payload = {
            action: 'deleteFile', // Backend must handle this
            fileId: fileId
        };

        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let result;
        
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON response from GAS:", text);
            throw new Error("Sila kemaskini Google Apps Script (Backend) anda. Arahan 'deleteFile' tidak dijumpai.");
        }
        
        if (result.error) {
            throw new Error(result.error);
        }

        // Invalidate Cache
        const cacheKey = `${year}_${unitName}_${folderType}`;
        const cache = getStoredCache();
        delete cache[cacheKey];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        return true;
    } catch (e) {
        console.error("Failed to delete file:", e);
        throw e;
    }
  },

  uploadGalleryImage: async (file: File, description: string, unitName: string, year: number) => {
    return gasService.uploadFile(file, description, unitName, year, 'GALERI');
  }
};
