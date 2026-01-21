
import React, { useState, useEffect } from 'react';
import { Unit, UnitCategory, OrgChartData } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { gasService } from '../services/gasService';
import { firebaseService } from '../services/firebaseService';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

// Declare external library type
declare var html2pdf: any;

interface OrgChartManagerProps {
  unit: Unit;
  year: number;
  onBack: () => void;
}

interface OrgChartRecord extends OrgChartData {
  driveUrl?: string;
  driveName?: string;
  driveDate?: string;
}

export const OrgChartManager: React.FC<OrgChartManagerProps> = ({ unit, year, onBack }) => {
  const [orgCharts, setOrgCharts] = useState<OrgChartRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PDF View State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Delete State
  const [chartToDelete, setChartToDelete] = useState<OrgChartRecord | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');

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
  const DRAFT_KEY = `org_chart_draft_${unit.id}_${year}`;

  // Auto-save draft to localStorage
  useEffect(() => {
    if (showModal) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, showModal, DRAFT_KEY]);

  // Load draft when modal opens
  useEffect(() => {
    if (showModal) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
        } catch (e) {
          console.error("Gagal load draft:", e);
        }
      }
    }
  }, [showModal, DRAFT_KEY]);

  // Load existing org charts from Firebase
  const loadOrgCharts = async () => {
    setIsLoading(true);
    try {
      // Load from Firebase
      const firebaseData = await firebaseService.getOrgChartsByUnit(unit.name, year);

      // Load from Google Drive for backward compatibility
      const driveFiles = await gasService.getModuleFiles(unit.name, year, folderType);

      // Merge data: prioritize Firebase data
      const merged: OrgChartRecord[] = firebaseData.map(fb => {
        const driveMatch = driveFiles.find((df: any) =>
          df.description && df.description.includes('Carta Organisasi')
        );

        return {
          ...fb,
          driveUrl: fb.pdfUrl || driveMatch?.url,
          driveName: driveMatch?.name,
          driveDate: driveMatch?.date
        };
      });

      // Add any Drive-only files (legacy data)
      driveFiles.forEach((df: any) => {
        const existsInFirebase = merged.some(m => m.pdfUrl === df.url);
        if (!existsInFirebase) {
          merged.push({
            id: df.id,
            unitId: unit.id,
            unitName: unit.name,
            unitCategory: unit.category,
            year: year,
            pengerusi: '',
            naibPengerusi: '',
            setiausaha: '',
            penSetiausaha: '',
            bendahari: '',
            penBendahari: '',
            ajk: '',
            teachers: unit.teachers,
            pdfUrl: df.url,
            driveUrl: df.url,
            driveName: df.name,
            driveDate: df.date
          });
        }
      });

      setOrgCharts(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrgCharts();
  }, [unit, year]);

  // Handle Deletion with Firebase
  const handleDeleteConfirm = async () => {
    if (chartToDelete) {
      try {
        // Delete from Firebase if ID exists
        if (chartToDelete.id && chartToDelete.id.startsWith('-')) {
          await firebaseService.deleteOrgChart(chartToDelete.id);
        }

        // Delete from Google Drive if exists
        if (chartToDelete.driveUrl) {
          const driveId = chartToDelete.driveUrl.split('/')[5]; // Extract file ID from URL
          if (driveId) {
            await gasService.deleteFile(driveId, unit.name, year, folderType);
          }
        }

        alert("✅ Carta berjaya dipadam.");
        loadOrgCharts();
      } catch (e: any) {
        alert("❌ Gagal memadam fail: " + e.message);
      } finally {
        setChartToDelete(null);
      }
    }
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

    try {
      // STEP 1: Save to Firebase FIRST (Data Protection)
      setLoadingText('💾 Menyimpan data ke Firebase...');

      const orgChartData: OrgChartData = {
        unitId: unit.id,
        unitName: unit.name,
        unitCategory: unit.category,
        year: year,
        pengerusi: formData.pengerusi,
        naibPengerusi: formData.naibPengerusi,
        setiausaha: formData.setiausaha,
        penSetiausaha: formData.penSetiausaha,
        bendahari: formData.bendahari,
        penBendahari: formData.penBendahari,
        ajk: formData.ajk,
        teachers: unit.teachers
      };

      const firebaseResult = await firebaseService.submitOrgChart(orgChartData);
      const firebaseId = firebaseResult.id!;
      console.log("✅ Data selamat di Firebase:", firebaseId);

      // STEP 2: Generate PDF
      setLoadingText('📄 Menjana PDF Carta...');
      const pdfBlob = await createPDFBlob();
      const fileName = `CartaOrganisasi_${year}_${unit.name.replace(/\s/g, '')}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      // STEP 3: Upload to Google Drive
      setLoadingText('☁️ Memuat naik ke Google Drive...');
      const uploadResult = await gasService.uploadFile(file, `Carta Organisasi ${year}`, unit.name, year, folderType);

      // STEP 4: Update Firebase with PDF URL
      if (uploadResult && uploadResult.url) {
        setLoadingText('🔗 Mengemas kini pautan PDF...');
        await firebaseService.updateOrgChartPdfUrl(firebaseId, uploadResult.url);
        console.log("✅ PDF URL dikemas kini");
      }

      // STEP 5: Clear draft and reset form
      localStorage.removeItem(DRAFT_KEY);
      alert("✅ Carta Organisasi Berjaya Disimpan ke Firebase & Google Drive!");
      setShowModal(false);
      setFormData({ pengerusi: '', naibPengerusi: '', setiausaha: '', penSetiausaha: '', bendahari: '', penBendahari: '', ajk: '' });
      loadOrgCharts();
    } catch (error: any) {
      console.error("❌ Ralat:", error);
      alert("❌ Ralat: " + error.message + "\n\nData anda masih selamat dalam borang. Sila cuba lagi.");
    } finally {
      setIsSubmitting(false);
      setLoadingText('');
    }
  };

  // Warning before closing modal with unsaved data
  const handleCloseModal = () => {
    const hasData = Object.values(formData).some(v => v.trim() !== '');
    if (hasData && !isSubmitting) {
      const confirm = window.confirm("⚠️ Anda mempunyai data yang belum disimpan. Tutup borang?");
      if (!confirm) return;
    }
    setShowModal(false);
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

        {/* ADD BUTTON */}
        <button
           onClick={() => setShowModal(true)}
           className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition-all group"
           title="Buat Carta Organisasi"
        >
           <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* File List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px] p-5 relative">
         {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
                 <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600"></div>
                 <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest animate-pulse">Memuatkan Fail...</p>
             </div>
         ) : orgCharts.length > 0 ? (
             <div className="space-y-3">
                 {orgCharts.map((chart, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-red-50 transition-all group duration-300">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-2xl shrink-0">
                              👥
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-red-700 transition-colors">
                                {chart.driveName || `Carta Organisasi ${year}`}
                                {chart.id && chart.id.startsWith('-') && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🔒 Firebase</span>}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                 {chart.driveDate ? new Date(chart.driveDate).toLocaleDateString() : 'N/A'} • PDF
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedPdfUrl(chart.driveUrl || chart.pdfUrl || '');
                                    setSelectedPdfTitle(chart.driveName || `Carta Organisasi ${year}`);
                                }}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                                disabled={!chart.driveUrl && !chart.pdfUrl}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button
                                onClick={() => setChartToDelete(chart)}
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

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseModal}></div>
           <div className="bg-white rounded-2xl w-full max-w-2xl relative animate-scaleUp max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

              <div className="bg-gray-900 p-5 text-white shrink-0 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">Isi Carta Organisasi</h3>
                    <span className="text-[10px] bg-green-600 px-2 py-1 rounded-full font-bold">💾 Draf Auto-Simpan Aktif</span>
                 </div>
                 <button onClick={handleCloseModal} className="text-white/70 hover:text-white">✕</button>
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
                 <Button variant="ghost" type="button" onClick={handleCloseModal} disabled={isSubmitting}>Batal</Button>
                 <Button variant="primary" form="orgForm" type="submit" isLoading={isSubmitting} className="bg-gray-900 hover:bg-black text-white">
                    {isSubmitting ? (loadingText || 'Memproses...') : 'Simpan & Jana PDF'}
                 </Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
