
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { gasService } from '../services/gasService';
import { firebaseService, OrgChartData } from '../services/firebaseService';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

// Declare external library type
declare var html2pdf: any;

interface OrgChartManagerProps {
  unit: Unit;
  year: number;
  onBack: () => void;
}

export const OrgChartManager: React.FC<OrgChartManagerProps> = ({ unit, year, onBack }) => {
  const [firebaseCharts, setFirebaseCharts] = useState<OrgChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PDF View State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Delete State
  const [chartToDelete, setChartToDelete] = useState<OrgChartData | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Edit Mode State
  const [editingChart, setEditingChart] = useState<OrgChartData | null>(null);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordError, setEditPasswordError] = useState('');
  const [pendingEditChart, setPendingEditChart] = useState<OrgChartData | null>(null);

  const [formData, setFormData] = useState({
    pengerusi: '',
    naibPengerusi: '',
    setiausaha: '',
    penSetiausaha: '',
    bendahari: '',
    penBendahari: '',
    ajk: '' // Text area for multiple lines
  });

  const folderType = 'CARTA ORGANISASI';
  const isEditMode = !!editingChart;

  // Load existing charts from Firebase
  const loadCharts = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    setIsLoading(true);
    try {
      const data = await firebaseService.getOrgChartByUnit(unit.name, year);
      setFirebaseCharts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCharts();
  }, [unit, year]);

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      pengerusi: '',
      naibPengerusi: '',
      setiausaha: '',
      penSetiausaha: '',
      bendahari: '',
      penBendahari: '',
      ajk: ''
    });
    setEditingChart(null);
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
    if (pendingEditChart) {
      setEditingChart(pendingEditChart);
      // Pre-fill form data
      setFormData({
        pengerusi: pendingEditChart.pengerusi || '',
        naibPengerusi: pendingEditChart.naibPengerusi || '',
        setiausaha: pendingEditChart.setiausaha || '',
        penSetiausaha: pendingEditChart.penSetiausaha || '',
        bendahari: pendingEditChart.bendahari || '',
        penBendahari: pendingEditChart.penBendahari || '',
        ajk: pendingEditChart.ajk || ''
      });
      setShowModal(true);
    }

    setShowEditPasswordModal(false);
    setEditPassword('');
    setEditPasswordError('');
    setPendingEditChart(null);
  };

  // Handle requesting edit (show password modal first)
  const handleRequestEdit = (chart: OrgChartData) => {
    setPendingEditChart(chart);
    setShowEditPasswordModal(true);
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (chartToDelete?.id) {
      try {
        await firebaseService.deleteOrgChart(chartToDelete.id);
        alert("✅ Carta berjaya dipadam.");
        loadCharts(true);
      } catch (e: any) {
        alert("❌ Gagal memadam carta: " + e.message);
      }
    }
    setChartToDelete(null);
  };

  // PDF Generation Logic
  const createPDFBlob = async (): Promise<Blob> => {
     const ajkList = formData.ajk.split('\n').filter(line => line.trim() !== '');

     const content = `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; text-align: center;">

        <!-- Header -->
        <div style="margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">CARTA ORGANISASI ${year}</h1>
          <h2 style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">${unit.category.replace('_', ' ')}: ${unit.name}</h2>
          <h3 style="margin: 5px 0 0 0; font-size: 14px; font-weight: normal;">SK SRI AMAN</h3>
        </div>

        <!-- Guru Penasihat -->
        <div style="margin-bottom: 40px;">
           <div style="background: #f3f4f6; border: 1px solid #000; padding: 10px; display: inline-block; width: 80%; margin-bottom: 15px;">
              <strong style="display: block; font-size: 14px; text-decoration: underline; margin-bottom: 5px;">GURU PENASIHAT</strong>
              <div style="font-size: 12px; line-height: 1.5;">
                  ${unit.teachers.map(t => `<div>${t}</div>`).join('')}
              </div>
           </div>
           <div style="width: 2px; height: 20px; background: #000; margin: 0 auto;"></div>
        </div>

        <!-- Tertinggi -->
        <div style="margin-bottom: 20px;">
            <!-- Pengerusi -->
            <div style="border: 1px solid #000; padding: 8px; width: 200px; margin: 0 auto; background: #fff;">
                <div style="font-size: 10px; font-weight: bold;">PENGERUSI</div>
                <div style="font-size: 12px;">${formData.pengerusi || '-'}</div>
            </div>
            <div style="width: 2px; height: 20px; background: #000; margin: 0 auto;"></div>

            <!-- Naib Pengerusi -->
            <div style="border: 1px solid #000; padding: 8px; width: 200px; margin: 0 auto; background: #fff;">
                <div style="font-size: 10px; font-weight: bold;">NAIB PENGERUSI</div>
                <div style="font-size: 12px;">${formData.naibPengerusi || '-'}</div>
            </div>
            <div style="width: 2px; height: 20px; background: #000; margin: 0 auto;"></div>
        </div>

        <!-- Setiausaha & Bendahari Row -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; position: relative;">
            <!-- Connector Line -->
            <div style="position: absolute; top: -20px; left: 25%; right: 25%; height: 20px; border-top: 2px solid #000; border-left: 2px solid #000; border-right: 2px solid #000; z-index: -1;"></div>

            <!-- Setiausaha Group -->
            <div style="width: 45%;">
                <div style="border: 1px solid #000; padding: 8px; margin-bottom: 10px; background: #fff;">
                    <div style="font-size: 10px; font-weight: bold;">SETIAUSAHA</div>
                    <div style="font-size: 12px;">${formData.setiausaha || '-'}</div>
                </div>
                <div style="border: 1px solid #000; padding: 8px; background: #fff;">
                    <div style="font-size: 10px; font-weight: bold;">PENOLONG SETIAUSAHA</div>
                    <div style="font-size: 12px;">${formData.penSetiausaha || '-'}</div>
                </div>
            </div>

            <!-- Bendahari Group -->
            <div style="width: 45%;">
                <div style="border: 1px solid #000; padding: 8px; margin-bottom: 10px; background: #fff;">
                    <div style="font-size: 10px; font-weight: bold;">BENDAHARI</div>
                    <div style="font-size: 12px;">${formData.bendahari || '-'}</div>
                </div>
                <div style="border: 1px solid #000; padding: 8px; background: #fff;">
                    <div style="font-size: 10px; font-weight: bold;">PENOLONG BENDAHARI</div>
                    <div style="font-size: 12px;">${formData.penBendahari || '-'}</div>
                </div>
            </div>
        </div>

        <div style="width: 2px; height: 20px; background: #000; margin: 0 auto;"></div>

        <!-- AJK -->
        <div style="border: 1px solid #000; padding: 15px; margin-top: 0;">
            <div style="font-size: 12px; font-weight: bold; text-decoration: underline; margin-bottom: 10px;">AHLI JAWATANKUASA (AJK)</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; font-size: 12px;">
                ${ajkList.map((ajk, i) => `<div style="padding: 2px;">${i + 1}. ${ajk}</div>`).join('')}
            </div>
            ${ajkList.length === 0 ? '<div style="font-size:12px; color:#aaa;">- Tiada Rekod -</div>' : ''}
        </div>

        <div style="margin-top: 30px; font-size: 10px; color: #555;">
            Dijana pada: ${new Date().toLocaleDateString('ms-MY')}
        </div>
      </div>
     `;

     const element = document.createElement('div');
     element.innerHTML = content;
     document.body.appendChild(element);

     const opt = {
       margin: 0.5,
       filename: 'carta_organisasi.pdf',
       image: { type: 'jpeg', quality: 0.98 },
       html2canvas: { scale: 2 },
       jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
     };

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

    let firebaseChartId: string | undefined = editingChart?.id;

    try {
      // STEP 1: Save to Firebase (source of truth)
      setLoadingText(isEditMode ? 'Mengemaskini pangkalan data...' : 'Menyimpan ke pangkalan data...');

      const chartData: OrgChartData = {
        unitId: unit.id,
        unitName: unit.name,
        year: year,
        pengerusi: formData.pengerusi,
        naibPengerusi: formData.naibPengerusi,
        setiausaha: formData.setiausaha,
        penSetiausaha: formData.penSetiausaha,
        bendahari: formData.bendahari,
        penBendahari: formData.penBendahari,
        ajk: formData.ajk
      };

      if (isEditMode && editingChart?.id) {
        // Update existing chart
        await firebaseService.updateOrgChart(editingChart.id, chartData);
        firebaseChartId = editingChart.id;
        console.log("✅ Carta dikemaskini di Firebase:", firebaseChartId);
      } else {
        // Create new chart
        const firebaseResult = await firebaseService.saveOrgChart(chartData);
        firebaseChartId = firebaseResult.id || undefined;
        console.log("✅ Carta disimpan ke Firebase:", firebaseChartId);
      }

      // STEP 2: Generate PDF
      setLoadingText('Menjana PDF Carta...');
      const pdfBlob = await createPDFBlob();
      const fileName = `CartaOrganisasi_${year}_${unit.name.replace(/\s/g, '')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      // STEP 3: Upload PDF to Google Drive (as backup)
      setLoadingText('Memuat naik PDF ke Drive...');
      const uploadResult = await gasService.uploadFile(file, `Carta Organisasi ${year}`, unit.name, year, folderType);

      // STEP 4: Update Firebase with PDF URL
      if (firebaseChartId && uploadResult?.fileUrl) {
        setLoadingText('Mengemaskini pautan PDF...');
        await firebaseService.updateOrgChart(firebaseChartId, { ...chartData, pdfUrl: uploadResult.fileUrl });
        console.log("✅ PDF URL dikemaskini di Firebase");
      }

      const successMsg = isEditMode ? "✅ Carta Organisasi Berjaya Dikemaskini!" : "✅ Carta Organisasi Berjaya Disimpan!";
      alert(successMsg);
      setShowModal(false);
      resetForm();
      loadCharts(true);
    } catch (error: any) {
      console.error("❌ Ralat:", error);
      let errorMessage = "Ralat: " + error.message;
      if (firebaseChartId) {
        errorMessage += "\n\n⚠️ Data anda SELAMAT di Firebase.";
      }
      alert("❌ " + errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoadingText('');
    }
  };

  return (
    <div className="animate-fadeIn">
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-3 hover:bg-gray-100 rounded-full p-2 h-10 w-10 flex items-center justify-center">
              <span className="text-xl">←</span>
            </Button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 leading-none">Carta Organisasi</h2>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">{unit.name} • {year}</p>
            </div>
        </div>

        {/* ADD BUTTON - Only show if no chart exists for this year */}
        {year === 2026 && firebaseCharts.length === 0 && (
          <button
             onClick={() => {
               resetForm();
               setShowModal(true);
             }}
             className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition-all group"
             title="Buat Carta Organisasi"
          >
             <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
        )}

        {/* REFRESH BUTTON */}
        <button
          onClick={() => loadCharts(true)}
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

      {/* File List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px] p-5 relative">
         {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600"></div>
                 <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest animate-pulse">Memuatkan Data...</p>
             </div>
         ) : firebaseCharts.length > 0 ? (
             <div className="space-y-3">
                 {firebaseCharts.map((chart) => (
                    <div key={chart.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-red-50 transition-all group duration-300">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-2xl shrink-0">
                              👥
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-red-700 transition-colors">Carta Organisasi {year}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                 Pengerusi: {chart.pengerusi || '-'}
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                            {/* View PDF Button */}
                            {chart.pdfUrl && (
                              <button
                                  onClick={() => {
                                      setSelectedPdfUrl(chart.pdfUrl || '');
                                      setSelectedPdfTitle(`Carta Organisasi ${year}`);
                                  }}
                                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                                  title="Lihat PDF"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                            )}
                            {/* Edit Button - Only for current year */}
                            {year === 2026 && (
                              <button
                                  onClick={() => handleRequestEdit(chart)}
                                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-green-500 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm"
                                  title="Edit Carta"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {/* Delete Button - Only for current year */}
                            {year === 2026 && (
                              <button
                                  onClick={() => setChartToDelete(chart)}
                                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                                  title="Padam Carta"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                        </div>
                    </div>
                 ))}
             </div>
         ) : (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-60">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-4 grayscale opacity-50">👥</div>
                 <h4 className="font-bold text-gray-700">Tiada Carta Organisasi</h4>
                 <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Tekan butang + untuk mencipta carta organisasi baru.</p>
             </div>
         )}
      </div>

      {/* PDF MODAL */}
      {selectedPdfUrl && (
         <PDFViewerModal
            url={selectedPdfUrl}
            title={selectedPdfTitle}
            onClose={() => setSelectedPdfUrl(null)}
         />
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmationModal
         isOpen={!!chartToDelete}
         onClose={() => setChartToDelete(null)}
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
            setPendingEditChart(null);
          }}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-scaleUp shadow-2xl z-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✏️
              </div>
              <h3 className="text-xl font-bold text-gray-900">Edit Carta Organisasi?</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-bold text-green-600">Carta Organisasi {year}</span>
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
                    setPendingEditChart(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 shadow-green-200"
                >
                  Teruskan Edit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-2xl relative animate-scaleUp max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

              <div className={`p-5 text-white shrink-0 flex justify-between items-center ${isEditMode ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gray-900'}`}>
                 <div>
                   <h3 className="text-lg font-bold">{isEditMode ? 'Edit Carta Organisasi' : 'Isi Carta Organisasi'}</h3>
                   {isEditMode && (
                     <p className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded inline-block">
                       ✏️ Mod Edit - {year}
                     </p>
                   )}
                 </div>
                 <button onClick={() => {
                   setShowModal(false);
                   if (isEditMode) resetForm();
                 }} className="text-white/70 hover:text-white">✕</button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                 <form id="orgForm" onSubmit={handleSubmit} className="space-y-6">

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <h4 className="text-xs font-black text-red-600 uppercase mb-2">Guru Penasihat (Auto)</h4>
                        <div className="flex flex-wrap gap-2">
                           {unit.teachers.map((t, i) => (
                               <span key={i} className="text-[10px] bg-white border border-red-100 px-2 py-1 rounded text-gray-700">{t}</span>
                           ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Pengerusi (Murid)" placeholder="Nama Penuh" value={formData.pengerusi} onChange={e => setFormData({...formData,pengerusi: e.target.value})} required />
                        <Input label="Naib Pengerusi (Murid)" placeholder="Nama Penuh" value={formData.naibPengerusi} onChange={e => setFormData({...formData, naibPengerusi: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Setiausaha" placeholder="Nama Penuh" value={formData.setiausaha} onChange={e => setFormData({...formData, setiausaha: e.target.value})} required />
                        <Input label="Penolong Setiausaha" placeholder="Nama Penuh" value={formData.penSetiausaha} onChange={e => setFormData({...formData, penSetiausaha: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Bendahari" placeholder="Nama Penuh" value={formData.bendahari} onChange={e => setFormData({...formData, bendahari: e.target.value})} required />
                        <Input label="Penolong Bendahari" placeholder="Nama Penuh" value={formData.penBendahari} onChange={e => setFormData({...formData, penBendahari: e.target.value})} />
                    </div>

                    <div>
                        <Textarea
                            label="Ahli Jawatankuasa (AJK)"
                            placeholder="Senaraikan nama AJK (Satu nama satu baris)..."
                            rows={6}
                            value={formData.ajk}
                            onChange={e => setFormData({...formData, ajk: e.target.value})}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">* Tekan Enter untuk baris baru bagi setiap nama AJK.</p>
                    </div>

                 </form>
              </div>

              <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
                 <Button variant="ghost" type="button" onClick={() => {
                   setShowModal(false);
                   if (isEditMode) resetForm();
                 }} disabled={isSubmitting}>Batal</Button>
                 <Button
                   variant="primary"
                   form="orgForm"
                   type="submit"
                   isLoading={isSubmitting}
                   className={isEditMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-900 hover:bg-black text-white"}
                 >
                    {isSubmitting ? (loadingText || 'Memproses...') : (isEditMode ? 'Kemaskini Carta' : 'Simpan & Jana PDF')}
                 </Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
