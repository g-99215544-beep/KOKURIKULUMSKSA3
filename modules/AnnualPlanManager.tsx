
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { gasService } from '../services/gasService';
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
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // PDF View State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Delete State
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Dynamic Table State
  const [planItems, setPlanItems] = useState<PlanItem[]>([
    { month: 'Januari', date: '', activity: 'Mesyuarat Agung Tahunan', remarks: 'Semua Guru & Murid' },
    { month: 'Februari', date: '', activity: '', remarks: '' }
  ]);

  const folderType = 'RANCANGAN TAHUNAN';

  // Load existing files
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const data = await gasService.getModuleFiles(unit.name, year, folderType);
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [unit, year]);

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
        try {
            await gasService.deleteFile(fileToDelete, unit.name, year, folderType);
            alert("✅ Rancangan berjaya dipadam.");
            loadFiles();
        } catch (e: any) {
            alert("❌ Gagal memadam fail: " + e.message);
        }
    }
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
    setLoadingText('Menjana PDF...');

    try {
      const pdfBlob = await createPDFBlob();
      const fileName = `RancanganTahunan_${year}_${unit.name.replace(/\s/g, '')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      setLoadingText('Memuat naik...');
      await gasService.uploadFile(file, `Rancangan Tahunan ${year}`, unit.name, year, folderType);

      alert("✅ Rancangan Tahunan Berjaya Disimpan!");
      setShowModal(false);
      // Reset to default
      setPlanItems([{ month: 'Januari', date: '', activity: 'Mesyuarat Agung Tahunan', remarks: 'Semua Guru & Murid' }]);
      loadFiles();
    } catch (error: any) {
      alert("Ralat: " + error.message);
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
        
        {/* ADD BUTTON */}
        <button 
           onClick={() => setShowModal(true)} 
           className="w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-200 active:scale-95 transition-all group"
           title="Buat Rancangan Tahunan"
        >
           <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* File List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px] p-5 relative">
         {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-100 border-t-orange-600"></div>
                 <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest animate-pulse">Memuatkan Fail...</p>
             </div>
         ) : files.length > 0 ? (
             <div className="space-y-3">
                 {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-orange-50 transition-all group duration-300">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shrink-0">
                              📊
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-orange-700 transition-colors">{f.description || f.name}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                 {new Date(f.date).toLocaleDateString()} • PDF
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setSelectedPdfUrl(f.url);
                                    setSelectedPdfTitle(f.description || f.name);
                                }}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-orange-500 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button 
                                onClick={() => setFileToDelete(f.id)}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
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
         isOpen={!!fileToDelete}
         onClose={() => setFileToDelete(null)}
         onConfirm={handleDeleteConfirm}
         unitPassword={unit.password}
      />

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-4xl relative animate-scaleUp max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
              
              <div className="bg-orange-600 p-5 text-white shrink-0 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-bold">Rancangan Tahunan {year}</h3>
                    <p className="text-xs opacity-90">{unit.name}</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">✕</button>
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
                 <Button variant="ghost" type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}>Batal</Button>
                 <Button variant="primary" form="planForm" type="submit" isLoading={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200">
                    {isSubmitting ? (loadingText || 'Menjana PDF...') : 'Simpan & Jana PDF'}
                 </Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
