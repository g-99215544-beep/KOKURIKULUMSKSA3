
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { gasService } from '../services/gasService';
import { Unit } from '../types';
import { PDFViewerModal } from '../components/PDFViewerModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

interface FileManagerProps {
  title: string;
  folderType: 'CARTA ORGANISASI' | 'KEHADIRAN' | 'RANCANGAN TAHUNAN';
  unit: Unit;
  year: number;
  onBack: () => void;
  icon: string;
}

const GenericFileManager: React.FC<FileManagerProps> = ({ title, folderType, unit, year, onBack, icon }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  
  // PDF View State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string>('');

  // Delete State
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState('');

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const data = await gasService.getModuleFiles(unit.name, year, folderType);
      setFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [unit, year, folderType]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    try {
      await gasService.uploadFile(file, desc || file.name, unit.name, year, folderType);
      alert("✅ Berjaya dimuat naik!");
      setFile(null);
      setDesc('');
      setShowUpload(false);
      loadFiles();
    } catch (e: any) {
      alert("❌ Gagal: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
        try {
            await gasService.deleteFile(fileToDelete, unit.name, year, folderType);
            alert("✅ Fail berjaya dipadam.");
            loadFiles();
        } catch (e: any) {
            alert("❌ Gagal memadam fail: " + e.message);
        }
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header with Title and + Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-3 hover:bg-gray-100 rounded-full p-2 h-10 w-10 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 leading-none">{title}</h2>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">{unit.name}</p>
            </div>
        </div>
        
        {/* Small + Icon Button */}
        <button 
           onClick={() => setShowUpload(true)} 
           className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition-all group"
           title="Muat Naik Fail"
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
         ) : files.length > 0 ? (
             <div className="space-y-3">
                 {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-red-50 transition-all group duration-300">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                              {f.type?.includes('image') ? '🖼️' : '📄'}
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-red-700 transition-colors">{f.description || f.name}</h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                 {new Date(f.date).toLocaleDateString()} • {(f.name as string).split('.').pop()?.toUpperCase()}
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setSelectedPdfUrl(f.url);
                                    setSelectedPdfTitle(f.description || f.name);
                                }}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-4 grayscale opacity-50">{icon}</div>
                 <h4 className="font-bold text-gray-700">Folder Kosong</h4>
                 <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Tiada fail dalam folder {folderType} di Google Drive.</p>
                 <button onClick={() => setShowUpload(true)} className="mt-4 text-xs font-bold text-red-600 hover:underline">Muat Naik Pertama</button>
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

      {/* Upload Modal */}
      {showUpload && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => !isUploading && setShowUpload(false)}></div>
             <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative animate-scaleUp shadow-2xl">
                 <h3 className="font-black text-xl mb-1 text-gray-900">Muat Naik Fail</h3>
                 <p className="text-xs text-gray-400 font-medium mb-6 uppercase tracking-wider">Ke Folder {folderType}</p>
                 
                 <form onSubmit={handleUpload} className="space-y-5">
                     <div className="relative">
                         <input type="file" required onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload-input" disabled={isUploading} />
                         <label htmlFor="file-upload-input" className={`flex flex-col items-center justify-center w-full border-3 border-dashed rounded-3xl py-10 transition-all cursor-pointer ${file ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                            <span className="text-3xl mb-2">{file ? '✅' : '📂'}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{file ? file.name : 'Pilih Fail'}</span>
                         </label>
                     </div>
                     
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nama Fail / Keterangan</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Minit Mesyuarat 1" 
                          value={desc} 
                          onChange={e => setDesc(e.target.value)} 
                          className="w-full px-5 py-4 bg-gray-100 rounded-2xl border-none text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-red-500 transition-all"
                          required
                          disabled={isUploading}
                        />
                     </div>

                     <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setShowUpload(false)} disabled={isUploading} className="flex-1 rounded-xl bg-gray-100 text-gray-500">Batal</Button>
                        <Button type="submit" isLoading={isUploading} className="flex-1 rounded-xl shadow-lg shadow-red-200">Muat Naik</Button>
                     </div>
                 </form>
             </div>
         </div>
      )}
    </div>
  );
};

export const AttendanceViewReal = GenericFileManager;
export const AnnualPlanView: React.FC<any> = () => null; // Deprecated shim removed
export const AttendanceView: React.FC<any> = () => null; // Deprecated shim
