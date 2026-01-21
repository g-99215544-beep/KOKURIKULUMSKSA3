
import React, { useState, useEffect } from 'react';
import { Unit, WeeklyReportItem, UnitCategory, WeeklyReportData } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { gasService } from '../services/gasService';
import { firebaseService } from '../services/firebaseService';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

// Declare external library type
declare var html2pdf: any;

// LocalStorage key for draft
const DRAFT_KEY_PREFIX = 'weekly_report_draft_';

interface WeeklyReportFormProps {
  unit: Unit;
  year: number;
  onBack: () => void;
}

export const WeeklyReportForm: React.FC<WeeklyReportFormProps> = ({ unit, year, onBack }) => {
  const [reports, setReports] = useState<WeeklyReportItem[]>([]);
  const [firebaseReports, setFirebaseReports] = useState<WeeklyReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PDF Viewer State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Delete State
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [firebaseReportToDelete, setFirebaseReportToDelete] = useState<string | null>(null);

  // State Borang Baru
  const [showFormModal, setShowFormModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Edit Mode State
  const [editingReport, setEditingReport] = useState<WeeklyReportData | null>(null);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordError, setEditPasswordError] = useState('');
  const [pendingEditReport, setPendingEditReport] = useState<WeeklyReportData | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    perjumpaanKali: '',
    tarikh: '',
    hari: '',
    masa: '1.10 - 2.10 petang', // Default
    tempat: '',
    muridHadir: '',
    jumlahMurid: '',
    aktiviti1: '',
    aktiviti2: '',
    aktiviti3: '',
    pikebm: '',
    refleksi: ''
  });

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [reportImages, setReportImages] = useState<(File | null)[]>([null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(['', '', '', '']);

  const isEditMode = !!editingReport;

  // Fetch Reports Logic - from both Google Drive and Firebase
  const fetchReports = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    try {
      // Fetch from Google Drive (PDFs)
      const driveData = await gasService.getWeeklyReports(unit.name, year, force);
      const matchedData = driveData.filter(r => r.year === year);
      setReports(matchedData);

      // Fetch from Firebase (actual data for editing)
      const fbData = await firebaseService.getWeeklyReportsByUnit(unit.name, year);
      setFirebaseReports(fbData);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setReports([]);
    setFirebaseReports([]);
    setIsLoading(true);
    fetchReports();
    // Auto-select all teachers initially
    setSelectedTeachers(unit.teachers || []);
  }, [unit.name, year]);

  // Helper function to get localStorage key for this unit
  const getDraftKey = () => `${DRAFT_KEY_PREFIX}${unit.id}_${year}`;

  // Load draft from localStorage when form opens (only for new reports)
  useEffect(() => {
    if (showFormModal && !editingReport) {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(draft.formData || formData);
          setSelectedTeachers(draft.selectedTeachers || unit.teachers || []);
          console.log("✅ Draf dimuat semula dari cache");
        } catch (e) {
          console.error("Gagal muat draf:", e);
        }
      }
    }
  }, [showFormModal]);

  // Auto-save draft to localStorage when user types (only for new reports)
  useEffect(() => {
    if (showFormModal && !editingReport) {
      const draftKey = getDraftKey();
      const draftData = {
        formData,
        selectedTeachers,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [formData, selectedTeachers, showFormModal]);

  // Function to clear draft
  const clearDraft = () => {
    const draftKey = getDraftKey();
    localStorage.removeItem(draftKey);
    console.log("🗑️ Draf dipadam dari cache");
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      perjumpaanKali: '', tarikh: '', hari: '', masa: '1.10 - 2.10 petang', tempat: '',
      muridHadir: '', jumlahMurid: '', aktiviti1: '', aktiviti2: '', aktiviti3: '', pikebm: '', refleksi: ''
    });
    setImagePreviews(['', '', '', '']);
    setReportImages([null, null, null, null]);
    setSelectedTeachers(unit.teachers || []);
    setEditingReport(null);
  };

  // Handle Edit Password Confirmation
  const handleEditPasswordConfirm = () => {
    const isValidPassword =
      editPassword.trim().toUpperCase() === (unit.password || '').toUpperCase() ||
      editPassword === 'admin';

    if (!isValidPassword) {
      setEditPasswordError('Kata laluan salah!');
      return;
    }

    // Password valid, proceed to edit
    if (pendingEditReport) {
      setEditingReport(pendingEditReport);
      // Pre-fill form data
      setFormData({
        perjumpaanKali: pendingEditReport.perjumpaanKali || '',
        tarikh: pendingEditReport.tarikh || '',
        hari: pendingEditReport.hari || '',
        masa: pendingEditReport.masa || '1.10 - 2.10 petang',
        tempat: pendingEditReport.tempat || '',
        muridHadir: pendingEditReport.muridHadir || '',
        jumlahMurid: pendingEditReport.jumlahMurid || '',
        aktiviti1: pendingEditReport.aktiviti1 || '',
        aktiviti2: pendingEditReport.aktiviti2 || '',
        aktiviti3: pendingEditReport.aktiviti3 || '',
        pikebm: pendingEditReport.pikebm || '',
        refleksi: pendingEditReport.refleksi || ''
      });
      setSelectedTeachers(pendingEditReport.selectedTeachers || unit.teachers || []);
      // Load existing image previews if available
      if (pendingEditReport.imageUrls && pendingEditReport.imageUrls.length > 0) {
        const previews = [...imagePreviews];
        pendingEditReport.imageUrls.forEach((url, idx) => {
          if (idx < 4) previews[idx] = url;
        });
        setImagePreviews(previews);
      }
      setShowFormModal(true);
    }

    setShowEditPasswordModal(false);
    setEditPassword('');
    setEditPasswordError('');
    setPendingEditReport(null);
  };

  // Handle requesting edit (show password modal first)
  const handleRequestEdit = (report: WeeklyReportData) => {
    setPendingEditReport(report);
    setShowEditPasswordModal(true);
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      try {
        // Delete from Google Drive
        await gasService.deleteFile(fileToDelete, unit.name, year, 'LAPORAN MINGGUAN');

        // Also delete from Firebase if we have the corresponding record
        if (firebaseReportToDelete) {
          await firebaseService.deleteWeeklyReport(firebaseReportToDelete);
        }

        alert("✅ Laporan berjaya dipadam.");
        fetchReports(true);
      } catch (e: any) {
        alert("❌ Gagal memadam fail: " + e.message);
      }
    }
    setFileToDelete(null);
    setFirebaseReportToDelete(null);
  };

  // Form Handlers
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    const days = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    const d = new Date(dateVal);
    const dayName = days[d.getDay()];
    setFormData(prev => ({ ...prev, tarikh: dateVal, hari: dayName || '' }));
  };

  const handleTeacherToggle = (teacherName: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherName)
        ? prev.filter(t => t !== teacherName)
        : [...prev, teacherName]
    );
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Update File State
      const newFiles = [...reportImages];
      newFiles[index] = file;
      setReportImages(newFiles);

      // Update Preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newPreviews = [...imagePreviews];
        newPreviews[index] = ev.target?.result as string;
        setImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const createPDFBlob = async (): Promise<Blob> => {
     // Helper untuk convert images ke base64
     const getBase64 = (file: File | null): Promise<string> => {
        return new Promise((resolve) => {
           if(!file) resolve('');
           else {
               const reader = new FileReader();
               reader.onload = () => resolve(reader.result as string);
               reader.readAsDataURL(file);
           }
        });
     };

     const imgData = await Promise.all(reportImages.map(getBase64));

     // Use existing image URLs if no new files uploaded (for edit mode)
     const finalImgData = imgData.map((data, idx) => {
       if (data) return data;
       if (editingReport?.imageUrls && editingReport.imageUrls[idx]) {
         return editingReport.imageUrls[idx];
       }
       return '';
     });

     // HTML Template String for PDF
     const content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto;">

        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid #b91c1c; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px; color: #b91c1c; text-transform: uppercase;">Laporan Mingguan Kokurikulum</h1>
          <h2 style="margin: 5px 0 0 0; font-size: 18px; color: #555;">${unit.category.replace('_', ' ')} • ${unit.name.toUpperCase()}</h2>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #888;">Tahun ${year}</p>
        </div>

        <!-- Maklumat Perjumpaan -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #f3f4f6; padding: 10px; font-size: 16px; border-left: 5px solid #b91c1c; margin-bottom: 15px;">MAKLUMAT PERJUMPAAN</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px; width: 140px; font-weight: bold; color: #555;">Perjumpaan:</td>
              <td style="padding: 8px; font-weight: bold;">${formData.perjumpaanKali}</td>
              <td style="padding: 8px; width: 100px; font-weight: bold; color: #555;">Tarikh:</td>
              <td style="padding: 8px; font-weight: bold;">${formData.tarikh} (${formData.hari})</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #555;">Masa:</td>
              <td style="padding: 8px;">${formData.masa}</td>
              <td style="padding: 8px; font-weight: bold; color: #555;">Tempat:</td>
              <td style="padding: 8px;">${formData.tempat}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #555;">Kehadiran Murid:</td>
              <td colspan="3" style="padding: 8px;">
                 <span style="font-size: 16px; font-weight: bold;">${formData.muridHadir}</span> / ${formData.jumlahMurid}
              </td>
            </tr>
          </table>
        </div>

        <!-- Guru Bertugas -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #f3f4f6; padding: 10px; font-size: 16px; border-left: 5px solid #b91c1c; margin-bottom: 15px;">KEHADIRAN GURU</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${selectedTeachers.map(t => `
                <div style="font-size: 12px; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; background: #fff;">
                    ✅ ${t}
                </div>
            `).join('')}
          </div>
        </div>

        <!-- Aktiviti -->
        <div style="margin-bottom: 30px;">
          <h3 style="background: #f3f4f6; padding: 10px; font-size: 16px; border-left: 5px solid #b91c1c; margin-bottom: 15px;">LAPORAN AKTIVITI</h3>
          <ol style="margin-top: 5px; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            ${formData.aktiviti1 ? `<li style="margin-bottom: 5px;">${formData.aktiviti1}</li>` : ''}
            ${formData.aktiviti2 ? `<li style="margin-bottom: 5px;">${formData.aktiviti2}</li>` : ''}
            ${formData.aktiviti3 ? `<li style="margin-bottom: 5px;">${formData.aktiviti3}</li>` : ''}
          </ol>
        </div>

        <!-- PiKeBM & Refleksi -->
        <div style="margin-bottom: 30px;">
           <h3 style="background: #f3f4f6; padding: 10px; font-size: 16px; border-left: 5px solid #b91c1c; margin-bottom: 15px;">IMPAK & REFLEKSI</h3>
           <div style="margin-bottom: 15px;">
              <strong style="display: block; font-size: 12px; color: #555; margin-bottom: 3px;">PIKEBM / IMPAK MURID:</strong>
              <div style="border: 1px solid #eee; padding: 10px; border-radius: 5px; font-size: 14px;">${formData.pikebm || '-'}</div>
           </div>
           <div>
              <strong style="display: block; font-size: 12px; color: #555; margin-bottom: 3px;">REFLEKSI GURU:</strong>
              <div style="border: 1px solid #eee; padding: 10px; border-radius: 5px; font-size: 14px;">${formData.refleksi || '-'}</div>
           </div>
        </div>

        <!-- Gambar -->
        <div style="page-break-inside: avoid;">
          <h3 style="background: #f3f4f6; padding: 10px; font-size: 16px; border-left: 5px solid #b91c1c; margin-bottom: 15px;">GAMBAR AKTIVITI</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            ${finalImgData.map(src => src ? `
                <div style="border: 1px solid #ddd; padding: 5px; background: #fff; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
            ` : '').join('')}
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px;">
           Dijana secara automatik oleh e-Kokurikulum SK Sri Aman pada ${new Date().toLocaleDateString('ms-MY')}
        </div>
      </div>
     `;

     // Create a temporary container
     const element = document.createElement('div');
     element.innerHTML = content;
     document.body.appendChild(element);

     // PDF Options
     const opt = {
       margin:       0, // No margin because we added padding in CSS
       filename:     'report.pdf',
       image:        { type: 'jpeg', quality: 0.98 },
       html2canvas:  { scale: 2, useCORS: true },
       jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
     };

     // Generate PDF
     try {
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        document.body.removeChild(element);
        return pdfBlob;
     } catch (e) {
        document.body.removeChild(element);
        throw e;
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let firebaseReportId: string | undefined = editingReport?.id;

    try {
      // STEP 1: Save to Firebase (data protection)
      setLoadingText(isEditMode ? 'Mengemaskini pangkalan data...' : 'Menyimpan ke pangkalan data...');
      const reportData: WeeklyReportData = {
        unitId: unit.id,
        unitName: unit.name,
        unitCategory: unit.category,
        year: year,
        perjumpaanKali: formData.perjumpaanKali,
        tarikh: formData.tarikh,
        hari: formData.hari,
        masa: formData.masa,
        tempat: formData.tempat,
        muridHadir: formData.muridHadir,
        jumlahMurid: formData.jumlahMurid,
        selectedTeachers: selectedTeachers,
        aktiviti1: formData.aktiviti1,
        aktiviti2: formData.aktiviti2,
        aktiviti3: formData.aktiviti3,
        pikebm: formData.pikebm,
        refleksi: formData.refleksi
      };

      if (isEditMode && editingReport?.id) {
        // Update existing report
        await firebaseService.updateWeeklyReport(editingReport.id, reportData);
        firebaseReportId = editingReport.id;
        console.log("✅ Data dikemaskini di Firebase:", firebaseReportId);
      } else {
        // Create new report
        const firebaseResult = await firebaseService.submitWeeklyReport(reportData);
        firebaseReportId = firebaseResult.id;
        console.log("✅ Data selamat disimpan ke Firebase:", firebaseReportId);
      }

      // STEP 2: Generate PDF
      setLoadingText('Menjana PDF...');
      const pdfBlob = await createPDFBlob();
      const fileName = `Laporan_${formData.perjumpaanKali.replace(/\s/g, '')}_${unit.name}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      // STEP 3: Upload PDF to Google Drive
      setLoadingText('Memuat naik PDF ke Drive...');
      const uploadResult = await gasService.uploadFile(
        file,
        `Laporan ${formData.perjumpaanKali} - ${formData.tarikh}`,
        unit.name,
        year,
        'LAPORAN MINGGUAN'
      );

      // STEP 4: Update Firebase with PDF URL (if available)
      if (firebaseReportId && uploadResult?.fileUrl) {
        setLoadingText('Mengemaskini pautan PDF...');
        await firebaseService.updateWeeklyReportPdfUrl(firebaseReportId, uploadResult.fileUrl);
        console.log("✅ PDF URL dikemaskini di Firebase");
      }

      // SUCCESS: Clear draft and reset form
      if (!isEditMode) {
        clearDraft();
      }
      const successMsg = isEditMode ? "✅ Laporan Berjaya Dikemaskini!" : "✅ Laporan Berjaya Dihantar & Disimpan!";
      alert(successMsg);
      setShowFormModal(false);

      // Reset Form
      resetForm();
      fetchReports(true); // Refresh List

    } catch (err: any) {
      console.error("❌ Ralat semasa penghantaran:", err);

      // Enhanced error message
      let errorMessage = "Ralat: " + err.message;
      if (firebaseReportId) {
        errorMessage += "\n\n⚠️ Data anda SELAMAT di Firebase (ID: " + firebaseReportId + ")";
        errorMessage += "\nAnda boleh cuba upload PDF semula.";
      } else {
        errorMessage += "\n\n💡 Data anda masih ada dalam borang. Jangan tutup modal ini.";
      }

      alert("❌ " + errorMessage);

      // Don't close modal or reset form - keep data for retry
    } finally {
      setIsSubmitting(false);
      setLoadingText('');
    }
  };

  // Find matching Firebase report for a Drive report
  const findFirebaseReport = (driveReport: WeeklyReportItem): WeeklyReportData | undefined => {
    return firebaseReports.find(fbr =>
      fbr.perjumpaanKali === driveReport.activity.split(' - ')[0]?.replace('Laporan ', '') ||
      fbr.tarikh === driveReport.date ||
      driveReport.activity.includes(fbr.perjumpaanKali)
    );
  };

  return (
    <div className="animate-fadeIn pb-24 relative min-h-[500px]">
      {/* HEADER NAVIGASI */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2">← Kembali</Button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Laporan Mingguan</h2>
          <p className="text-xs font-bold text-red-600 uppercase">
             {unit.name} • <span className="bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm">{year}</span>
          </p>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
           <span className={`w-2 h-2 rounded-full ${year === 2026 ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></span>
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              Folder Digital
           </span>
        </div>
        <button
          onClick={() => fetchReports(true)}
          disabled={isRefreshing}
          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
            isRefreshing
            ? 'bg-gray-100 text-gray-400 border-gray-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600 shadow-sm active:scale-95'
          }`}
        >
          {isRefreshing ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* SENARAI LAPORAN */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-100 border-t-red-600"></div>
          <p className="text-gray-400 text-xs font-bold mt-4 uppercase tracking-widest animate-pulse">Menapis Data {year}...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show Firebase reports (editable) */}
          {firebaseReports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-blue-600 border-gray-100 hover:shadow-md transition-all group relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                   <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-black text-[10px] border border-blue-100 uppercase">
                     Firebase
                   </div>
                   <span className="text-[10px] text-gray-400 font-bold">{new Date(report.tarikh).toLocaleDateString('ms-MY')}</span>
                </div>

                <div className="flex gap-2">
                    {report.pdfUrl && (
                    <button
                        onClick={() => {
                          setSelectedPdfUrl(report.pdfUrl || '');
                          setSelectedPdfTitle(`Laporan ${report.perjumpaanKali}`);
                        }}
                        className="text-[10px] font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                    >
                        Lihat PDF 📄
                    </button>
                    )}
                    {/* Edit Button - Only for current year */}
                    {year === 2026 && (
                      <button
                         onClick={() => handleRequestEdit(report)}
                         className="text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 hover:bg-green-600 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                      >
                          ✏️ Edit
                      </button>
                    )}
                    <button
                       onClick={(e) => {
                           e.stopPropagation();
                           setFileToDelete(report.id || '');
                           setFirebaseReportToDelete(report.id || null);
                       }}
                       className="text-[10px] font-bold bg-gray-50 text-gray-500 w-8 h-8 rounded-full border border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center shadow-sm"
                       title="Padam Laporan"
                    >
                       🗑️
                    </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-blue-700 transition-colors line-clamp-2">
                {report.perjumpaanKali} - {report.aktiviti1 || 'Aktiviti'}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide truncate">
                 Hadir: {report.muridHadir}/{report.jumlahMurid} • {report.tempat}
              </p>
            </div>
          ))}

          {/* Show Drive reports that don't have Firebase data (legacy) */}
          {reports.filter(r => !firebaseReports.some(fb => fb.tarikh === r.date)).map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-red-600 border-gray-100 hover:shadow-md transition-all active:scale-[0.99] group relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                   <div className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-black text-[10px] border border-red-100 uppercase">
                     PDF
                   </div>
                   <span className="text-[10px] text-gray-400 font-bold">{new Date(report.date).toLocaleDateString('ms-MY')}</span>
                </div>

                <div className="flex gap-2">
                    {report.fileUrl && (
                    <button
                        onClick={() => {
                        setSelectedPdfUrl(report.fileUrl || '');
                        setSelectedPdfTitle(report.activity);
                        }}
                        className="text-[10px] font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                    >
                        Lihat PDF 📄
                    </button>
                    )}
                    <button
                       onClick={(e) => {
                           e.stopPropagation();
                           setFileToDelete(report.id);
                       }}
                       className="text-[10px] font-bold bg-gray-50 text-gray-500 w-8 h-8 rounded-full border border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center shadow-sm"
                       title="Padam Laporan"
                    >
                       🗑️
                    </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-red-700 transition-colors line-clamp-2">
                {report.activity}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide truncate">
                 {report.teacherName || report.id}
              </p>
            </div>
          ))}

          {firebaseReports.length === 0 && reports.length === 0 && !isLoading && (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 px-8">
               <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-3xl">📂</span>
               </div>
               <p className="text-gray-500 font-black text-lg uppercase tracking-tight">Tiada Laporan Dijumpai</p>
               <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Sila tekan butang + di bawah untuk membuat laporan baru.
               </p>
            </div>
          )}
        </div>
      )}

      {/* FAB ADD BUTTON */}
      {year === 2026 && (
        <button
           onClick={() => {
             resetForm();
             setShowFormModal(true);
           }}
           className="fixed bottom-6 right-6 z-40 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl shadow-red-300 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group border-4 border-white"
        >
           <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap text-sm pl-1">Laporan Baru</span>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {/* PDF MODAL */}
      {selectedPdfUrl && (
         <PDFViewerModal
            url={selectedPdfUrl}
            title={selectedPdfTitle}
            onClose={() => setSelectedPdfUrl(null)}
         />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
         isOpen={!!fileToDelete}
         onClose={() => {
           setFileToDelete(null);
           setFirebaseReportToDelete(null);
         }}
         onConfirm={handleDeleteConfirm}
         unitPassword={unit.password}
      />

      {/* EDIT PASSWORD CONFIRMATION MODAL */}
      {showEditPasswordModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {
            setShowEditPasswordModal(false);
            setEditPassword('');
            setEditPasswordError('');
            setPendingEditReport(null);
          }}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-scaleUp shadow-2xl z-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✏️
              </div>
              <h3 className="text-xl font-bold text-gray-900">Edit Laporan Mingguan?</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-bold text-blue-600">{pendingEditReport?.perjumpaanKali}</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Sila masukkan kata laluan unit untuk membolehkan pengeditan.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleEditPasswordConfirm(); }} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider text-center">Kata Laluan Unit</p>
                <Input
                  type="password"
                  placeholder="Masukkan Kata Laluan"
                  value={editPassword}
                  onChange={e => {
                    setEditPassword(e.target.value);
                    setEditPasswordError('');
                  }}
                  className="text-center font-bold tracking-widest text-lg"
                  autoFocus
                />
                {editPasswordError && <p className="text-xs text-red-600 font-bold text-center mt-2 animate-pulse">{editPasswordError}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowEditPasswordModal(false);
                    setEditPassword('');
                    setEditPasswordError('');
                    setPendingEditReport(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                >
                  Teruskan Edit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BORANG LAPORAN */}
      {showFormModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmitting && setShowFormModal(false)}></div>

           <div className="bg-slate-50 rounded-2xl w-full max-w-2xl relative animate-scaleUp max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

              {/* Modal Header */}
              <div className={`p-5 text-white shrink-0 ${isEditMode ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gradient-to-r from-blue-600 to-sky-500'}`}>
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold">{isEditMode ? 'Edit Laporan Mingguan' : 'Laporan Mingguan Baru'}</h3>
                        <p className="text-xs opacity-90">{unit.name} • {unit.category.replace('_', ' ')}</p>
                        {isEditMode && (
                          <p className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded inline-block">
                            ✏️ Mod Edit - {editingReport?.perjumpaanKali}
                          </p>
                        )}
                        {!isEditMode && (formData.perjumpaanKali || formData.tarikh || formData.aktiviti1) && (
                          <p className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded inline-block">
                            💾 Draf Auto-Simpan Aktif
                          </p>
                        )}
                    </div>
                    <button
                      onClick={() => {
                        const hasData = formData.perjumpaanKali || formData.tarikh || formData.aktiviti1;
                        if (hasData && !isSubmitting) {
                          if (confirm("⚠️ Anda mempunyai data yang belum dihantar.\n\nDraf akan disimpan automatik.\nTutup borang?")) {
                            setShowFormModal(false);
                            if (isEditMode) resetForm();
                          }
                        } else {
                          setShowFormModal(false);
                          if (isEditMode) resetForm();
                        }
                      }}
                      className="text-white/80 hover:text-white"
                      disabled={isSubmitting}
                    >
                      ✕
                    </button>
                 </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                 <form id="reportForm" onSubmit={handleSubmit} className="space-y-6">

                    {/* Unit & Kategori (Read Only) */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">1. Maklumat Unit</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Kategori" value={unit.category.replace('_', ' ')} readOnly className="bg-gray-100 text-gray-500 font-semibold" />
                            <Input label="Nama Unit" value={unit.name} readOnly className="bg-gray-100 text-gray-500 font-semibold" />
                        </div>
                    </div>

                    {/* Guru Penasihat */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">2. Kehadiran Guru</h4>
                        <p className="text-[10px] text-gray-400 mb-2">Sila 'untick' guru yang tidak hadir.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {(unit.teachers || []).map((t, idx) => (
                                <label key={idx} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={selectedTeachers.includes(t)}
                                        onChange={() => handleTeacherToggle(t)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-medium text-gray-700">{t}</span>
                                </label>
                            ))}
                            {(unit.teachers || []).length === 0 && <p className="text-xs text-red-500 italic">Tiada guru didaftarkan.</p>}
                        </div>
                    </div>

                    {/* Perjumpaan Details */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">3. Perjumpaan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Perjumpaan Kali Ke-</label>
                                <select
                                    required
                                    value={formData.perjumpaanKali}
                                    onChange={e => setFormData({...formData, perjumpaanKali: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">— Pilih Minggu —</option>
                                    {[...Array(20)].map((_, i) => (
                                        <option key={i} value={`Minggu ${i+1}`}>Minggu {i+1}</option>
                                    ))}
                                </select>
                            </div>
                            <Input type="date" label="Tarikh" required value={formData.tarikh} onChange={handleDateChange} />
                            <Input label="Hari (Auto)" value={formData.hari} readOnly className="bg-gray-50" />
                            <Input label="Masa" value={formData.masa} onChange={e => setFormData({...formData, masa: e.target.value})} />
                        </div>
                        <Input label="Tempat" placeholder="Cth: Dewan Sekolah" required value={formData.tempat} onChange={e => setFormData({...formData, tempat: e.target.value})} />

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Input type="number" label="Murid Hadir" required value={formData.muridHadir} onChange={e => setFormData({...formData, muridHadir: e.target.value})} />
                            <Input type="number" label="Jumlah Murid" required value={formData.jumlahMurid} onChange={e => setFormData({...formData, jumlahMurid: e.target.value})} />
                        </div>
                    </div>

                    {/* Aktiviti */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">4. Laporan Aktiviti</h4>
                        <div className="space-y-3">
                            <Input placeholder="1. Aktiviti utama..." required value={formData.aktiviti1} onChange={e => setFormData({...formData, aktiviti1: e.target.value})} />
                            <Input placeholder="2. Aktiviti seterusnya..." value={formData.aktiviti2} onChange={e => setFormData({...formData, aktiviti2: e.target.value})} />
                            <Input placeholder="3. Aktiviti tambahan..." value={formData.aktiviti3} onChange={e => setFormData({...formData, aktiviti3: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <Textarea label="PiKeBM" rows={2} placeholder="Impak kepada murid..." value={formData.pikebm} onChange={e => setFormData({...formData, pikebm: e.target.value})} />
                            <Textarea label="Refleksi" rows={2} placeholder="Ulasan guru bertugas..." value={formData.refleksi} onChange={e => setFormData({...formData, refleksi: e.target.value})} />
                        </div>
                    </div>

                    {/* Upload Gambar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-2">5. Gambar Laporan (Maks 4)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map((idx) => (
                                <div key={idx} className="relative aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-colors">
                                    {imagePreviews[idx] ? (
                                        <img src={imagePreviews[idx]} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <span className="text-gray-400 text-xs">Foto {idx+1}</span>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageChange(idx, e)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                 </form>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
                 <Button variant="ghost" type="button" onClick={() => {
                   setShowFormModal(false);
                   if (isEditMode) resetForm();
                 }} disabled={isSubmitting}>Batal</Button>
                 <Button
                   variant="primary"
                   form="reportForm"
                   type="submit"
                   isLoading={isSubmitting}
                   className={isEditMode ? "bg-green-600 hover:bg-green-700 text-white shadow-green-200" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"}
                 >
                    {isSubmitting ? (loadingText || 'Menghantar...') : (isEditMode ? 'Kemaskini Laporan' : 'Hantar Laporan')}
                 </Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
