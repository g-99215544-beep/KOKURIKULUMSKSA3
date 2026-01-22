
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { gasService } from '../services/gasService';
import { firebaseService, AnnualPlanData } from '../services/firebaseService';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

// Declare external library type
declare var html2pdf: any;

interface AnnualPlanManagerProps {
  unit: Unit;
  year: number;
  onBack: () => void;
}

interface PlanItem {
  month: string;
  date: string;
  activity: string;
  remarks: string;
}

const MONTHS = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];

export const AnnualPlanManager: React.FC<AnnualPlanManagerProps> = ({ unit, year, onBack }) => {
  const [firebasePlans, setFirebasePlans] = useState<AnnualPlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // PDF View State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Delete State
  const [planToDelete, setPlanToDelete] = useState<AnnualPlanData | null>(null);

  // View Detail State
  const [selectedPlanToView, setSelectedPlanToView] = useState<AnnualPlanData | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Edit Mode State
  const [editingPlan, setEditingPlan] = useState<AnnualPlanData | null>(null);

  // Dynamic Table State
  const [planItems, setPlanItems] = useState<PlanItem[]>([
    { month: 'Januari', date: '', activity: 'Mesyuarat Agung Tahunan', remarks: 'Semua Guru & Murid' },
    { month: 'Februari', date: '', activity: '', remarks: '' }
  ]);

  const folderType = 'RANCANGAN TAHUNAN';
  const isEditMode = !!editingPlan;

  // Load existing plans from Firebase
  const loadPlans = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    setIsLoading(true);
    try {
      const data = await firebaseService.getAnnualPlanByUnit(unit.name, year);
      setFirebasePlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [unit, year]);

  // Reset form to initial state
  const resetForm = () => {
    setPlanItems([
      { month: 'Januari', date: '', activity: 'Mesyuarat Agung Tahunan', remarks: 'Semua Guru & Murid' },
      { month: 'Februari', date: '', activity: '', remarks: '' }
    ]);
    setEditingPlan(null);
  };

  // Handle requesting edit
  const handleRequestEdit = (plan: AnnualPlanData) => {
    setEditingPlan(plan);
    setPlanItems(plan.planItems);
    setShowModal(true);
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (planToDelete?.id) {
      try {
        await firebaseService.deleteAnnualPlan(planToDelete.id);
        alert("✅ Rancangan berjaya dipadam.");
        loadPlans(true);
      } catch (e: any) {
        alert("❌ Gagal memadam rancangan: " + e.message);
      }
    }
    setPlanToDelete(null);
  };

  // Table Logic
  const handleItemChange = (index: number, field: keyof PlanItem, value: string) => {
    const newItems = [...planItems];
    newItems[index][field] = value;
    setPlanItems(newItems);
  };

  const addItem = () => {
    setPlanItems([...planItems, { month: '', date: '', activity: '', remarks: '' }]);
  };

  const removeItem = (index: number) => {
    if (planItems.length > 1) {
      const newItems = planItems.filter((_, i) => i !== index);
      setPlanItems(newItems);
    }
  };

  // PDF Generation Logic
  const createPDFBlob = async (): Promise<Blob> => {
     const content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 14px; font-weight: bold;">RANCANGAN TAHUNAN AKTIVITI KOKURIKULUM TAHUN ${year}</h2>
          <h1 style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">${unit.category.replace('_', ' ')}: ${unit.name.toUpperCase()}</h1>
          <h3 style="margin: 5px 0 0 0; font-size: 14px; font-weight: normal;">SK SRI AMAN</h3>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
            <thead>
                <tr style="background-color: #f3f4f6;">
                    <th style="border: 1px solid #000; padding: 8px; width: 40px; text-align: center;">BIL</th>
                    <th style="border: 1px solid #000; padding: 8px; width: 100px; text-align: center;">BULAN</th>
                    <th style="border: 1px solid #000; padding: 8px; width: 100px; text-align: center;">TARIKH / MINGGU</th>
                    <th style="border: 1px solid #000; padding: 8px; text-align: left;">AKTIVITI / PROGRAM</th>
                    <th style="border: 1px solid #000; padding: 8px; width: 120px; text-align: left;">CATATAN</th>
                </tr>
            </thead>
            <tbody>
                ${planItems.map((item, index) => `
                    <tr>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.month}</td>
                        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item.date}</td>
                        <td style="border: 1px solid #000; padding: 8px;">${item.activity}</td>
                        <td style="border: 1px solid #000; padding: 8px;">${item.remarks}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <!-- Signatures -->
        <div style="margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid;">
            <div style="text-align: center; width: 200px;">
                <p style="font-size: 12px; margin-bottom: 50px;">Disediakan oleh:</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                <p style="font-size: 12px; font-weight: bold;">(KETUA GURU PENASIHAT)</p>
            </div>
            <div style="text-align: center; width: 200px;">
                <p style="font-size: 12px; margin-bottom: 50px;">Disahkan oleh:</p>
                <div style="border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                <p style="font-size: 12px; font-weight: bold;">(GPK KOKURIKULUM)</p>
            </div>
        </div>

        <div style="margin-top: 20px; font-size: 10px; color: #555; text-align: center;">
            Dijana secara automatik pada: ${new Date().toLocaleDateString('ms-MY')}
        </div>
      </div>
     `;

     const element = document.createElement('div');
     element.innerHTML = content;
     document.body.appendChild(element);

     const opt = {
       margin: 0.5,
       filename: 'rancangan_tahunan.pdf',
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

    let firebasePlanId: string | undefined = editingPlan?.id;

    try {
      // STEP 1: Save to Firebase (source of truth)
      setLoadingText(isEditMode ? 'Mengemaskini pangkalan data...' : 'Menyimpan ke pangkalan data...');

      const planData: AnnualPlanData = {
        unitId: unit.id,
        unitName: unit.name,
        year: year,
        planItems: planItems
      };

      if (isEditMode && editingPlan?.id) {
        // Update existing plan
        await firebaseService.updateAnnualPlan(editingPlan.id, planData);
        firebasePlanId = editingPlan.id;
        console.log("✅ Rancangan dikemaskini di Firebase:", firebasePlanId);
      } else {
        // Create new plan
        const firebaseResult = await firebaseService.saveAnnualPlan(planData);
        firebasePlanId = firebaseResult.id || undefined;
        console.log("✅ Rancangan disimpan ke Firebase:", firebasePlanId);
      }

      // STEP 2: Generate PDF
      setLoadingText('Menjana PDF...');
      const pdfBlob = await createPDFBlob();
      const fileName = `RancanganTahunan_${year}_${unit.name.replace(/\s/g, '')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      // STEP 3: Upload PDF to Google Drive (as backup)
      setLoadingText('Memuat naik PDF ke Drive...');
      const uploadResult = await gasService.uploadFile(file, `Rancangan Tahunan ${year}`, unit.name, year, folderType);

      // STEP 4: Update Firebase with PDF URL
      if (firebasePlanId && uploadResult?.fileUrl) {
        setLoadingText('Mengemaskini pautan PDF...');
        await firebaseService.updateAnnualPlan(firebasePlanId, { ...planData, pdfUrl: uploadResult.fileUrl });
        console.log("✅ PDF URL dikemaskini di Firebase");
      }

      // Auto-remove flare for rancangan tahunan
      try {
        await firebaseService.deleteFlareByTypeAndUnit(unit.name, 'RANCANGAN_TAHUNAN', year);
        console.log("Flare rancangan tahunan auto-removed for", unit.name);
      } catch (flareError) {
        console.log("No flare to remove or error:", flareError);
      }

      const successMsg = isEditMode ? "✅ Rancangan Tahunan Berjaya Dikemaskini!" : "✅ Rancangan Tahunan Berjaya Disimpan!";
      alert(successMsg);
      setShowModal(false);
      resetForm();
      loadPlans(true);
    } catch (error: any) {
      console.error("❌ Ralat:", error);
      let errorMessage = "Ralat: " + error.message;
      if (firebasePlanId) {
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
              <h2 className="text-xl font-bold text-gray-800 leading-none">Rancangan Tahunan</h2>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-1">{unit.name} • {year}</p>
            </div>
        </div>


        {/* REFRESH BUTTON */}
        <button
          onClick={() => loadPlans(true)}
          disabled={isRefreshing}
          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
            isRefreshing
            ? 'bg-gray-100 text-gray-400 border-gray-200'
            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 shadow-sm active:scale-95'
          }`}
        >
          {isRefreshing ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* File List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px] p-5 relative">
         {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-100 border-t-orange-600"></div>
                 <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest animate-pulse">Memuatkan Data...</p>
             </div>
         ) : firebasePlans.length > 0 ? (
             <div className="space-y-3">
                 {firebasePlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanToView(plan)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-orange-50 transition-all group duration-300 cursor-pointer active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shrink-0">
                              📊
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-orange-700 transition-colors">Rancangan Tahunan {year}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                 {plan.planItems?.length || 0} aktiviti dirancang
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Edit Button - Only for current year */}
                            {year === 2026 && (
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRequestEdit(plan);
                                  }}
                                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-green-500 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm"
                                  title="Edit Rancangan"
                              >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                            )}
                            {/* Delete Button - Only for current year */}
                            {year === 2026 && (
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanToDelete(plan);
                                  }}
                                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                                  title="Padam Rancangan"
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
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-4 grayscale opacity-50">📊</div>
                 <h4 className="font-bold text-gray-700">Tiada Rancangan Tahunan</h4>
                 <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Tekan butang + untuk mengisi jadual aktiviti.</p>
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
         isOpen={!!planToDelete}
         onClose={() => setPlanToDelete(null)}
         onConfirm={handleDeleteConfirm}
      />

      {/* VIEW PLAN DETAIL MODAL */}
      {selectedPlanToView && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPlanToView(null)}></div>
          <div className="bg-white rounded-3xl w-full max-w-2xl relative animate-scaleUp overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-5 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-2 py-1 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider mb-2">
                    📊 Rancangan
                  </span>
                  <h3 className="text-lg font-bold">Rancangan Tahunan {year}</h3>
                  <p className="text-xs opacity-90 mt-1">{unit.name}</p>
                </div>
                <button onClick={() => setSelectedPlanToView(null)} className="text-white/80 hover:text-white text-xl">✕</button>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mt-4">
                <div className="bg-white/20 rounded-lg p-2 px-4 backdrop-blur-sm text-center flex-1">
                  <div className="text-2xl font-black">{selectedPlanToView.planItems?.length || 0}</div>
                  <div className="text-[9px] uppercase font-bold opacity-80">Aktiviti</div>
                </div>
              </div>
            </div>

            {/* Body - Table of activities */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-xs">
                      <th className="p-3 text-left w-10">#</th>
                      <th className="p-3 text-left">Bulan</th>
                      <th className="p-3 text-left">Tarikh</th>
                      <th className="p-3 text-left">Aktiviti</th>
                      <th className="p-3 text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPlanToView.planItems?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-orange-50">
                        <td className="p-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                        <td className="p-3 font-medium text-gray-700">{item.month || '-'}</td>
                        <td className="p-3 text-gray-600">{item.date || '-'}</td>
                        <td className="p-3 font-medium text-gray-800">{item.activity || '-'}</td>
                        <td className="p-3 text-gray-500 text-xs">{item.remarks || '-'}</td>
                      </tr>
                    ))}
                    {(!selectedPlanToView.planItems || selectedPlanToView.planItems.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">Tiada aktiviti dirancang</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
              {selectedPlanToView.pdfUrl && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPdfUrl(selectedPlanToView.pdfUrl || '');
                    setSelectedPdfTitle(`Rancangan Tahunan ${year}`);
                    setSelectedPlanToView(null);
                  }}
                  className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  📄 Lihat PDF
                </Button>
              )}
              <Button onClick={() => setSelectedPlanToView(null)} className="flex-1">Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-4xl relative animate-scaleUp max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">

              <div className={`p-5 text-white shrink-0 flex justify-between items-center ${isEditMode ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-orange-600'}`}>
                 <div>
                    <h3 className="text-lg font-bold">{isEditMode ? 'Edit Rancangan Tahunan' : 'Rancangan Tahunan'} {year}</h3>
                    <p className="text-xs opacity-90">{unit.name}</p>
                    {isEditMode && (
                      <p className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded inline-block">
                        ✏️ Mod Edit
                      </p>
                    )}
                 </div>
                 <button onClick={() => {
                   setShowModal(false);
                   if (isEditMode) resetForm();
                 }} className="text-white/70 hover:text-white">✕</button>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
                 <form id="planForm" onSubmit={handleSubmit} className="space-y-4">

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600">
                                    <th className="p-3 text-left w-10">#</th>
                                    <th className="p-3 text-left w-32">Bulan</th>
                                    <th className="p-3 text-left w-32">Tarikh/Minggu</th>
                                    <th className="p-3 text-left">Aktiviti</th>
                                    <th className="p-3 text-left w-40">Catatan</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {planItems.map((item, index) => (
                                    <tr key={index} className="group hover:bg-orange-50 transition-colors">
                                        <td className="p-2 text-center text-gray-400 font-bold">{index + 1}</td>
                                        <td className="p-2">
                                            <select
                                                value={item.month}
                                                onChange={(e) => handleItemChange(index, 'month', e.target.value)}
                                                className="w-full p-2 border rounded text-xs focus:border-orange-500 outline-none"
                                            >
                                                <option value="">- Pilih -</option>
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Cth: Minggu 1"
                                                value={item.date}
                                                onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                                                className="w-full p-2 border rounded text-xs focus:border-orange-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Nama Aktiviti"
                                                value={item.activity}
                                                onChange={(e) => handleItemChange(index, 'activity', e.target.value)}
                                                className="w-full p-2 border rounded text-xs focus:border-orange-500 outline-none font-medium"
                                                required
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Catatan"
                                                value={item.remarks}
                                                onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                                className="w-full p-2 border rounded text-xs focus:border-orange-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-xs font-bold transition-all active:scale-95"
                            >
                                <span className="text-lg">+</span> Tambah Baris
                            </button>
                        </div>
                    </div>

                 </form>
              </div>

              <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                 <Button variant="ghost" type="button" onClick={() => {
                   setShowModal(false);
                   if (isEditMode) resetForm();
                 }} disabled={isSubmitting}>Batal</Button>
                 <Button
                   variant="primary"
                   form="planForm"
                   type="submit"
                   isLoading={isSubmitting}
                   className={isEditMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200"}
                 >
                    {isSubmitting ? (loadingText || 'Menjana PDF...') : (isEditMode ? 'Kemaskini Rancangan' : 'Simpan & Jana PDF')}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* FLOATING ADD BUTTON (Bottom Right) - Only show if no plan exists for this year */}
      {year === 2026 && firebasePlans.length === 0 && (
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="fixed bottom-10 right-10 z-[40] bg-orange-500 hover:bg-orange-600 text-white rounded-full p-6 shadow-[0_25px_50px_rgba(249,115,22,0.5)] hover:scale-110 active:scale-90 transition-all duration-300 border-4 border-white flex items-center justify-center group"
          title="Buat Rancangan Tahunan"
        >
          <svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

    </div>
  );
};
