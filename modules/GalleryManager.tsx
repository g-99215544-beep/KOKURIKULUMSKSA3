
import React, { useState, useEffect } from 'react';
import { Unit, GalleryItem, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { gasService } from '../services/gasService';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

interface GalleryManagerProps {
  unit: Unit;
  year: number;
  userRole: UserRole;
  onBack: () => void;
  isAuthenticated: boolean;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ unit, year, userRole, onBack, isAuthenticated }) => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // State untuk paparan gambar penuh (Lightbox)
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Delete State
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const isCurrentYear = year === 2026;

  useEffect(() => { 
    loadImages(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [unit.name, year]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const data = await gasService.getUnitGallery(unit.name, year);
      console.log('Gallery data received:', data);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal memuatkan imej:", err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper untuk extract file ID dari URL Google Drive
  const getFileIdFromUrl = (url: string): string | null => {
    try {
      let id = '';
      // Corak 1: /file/d/ID/view atau /file/d/ID
      if (url.includes('/file/d/')) {
        const parts = url.split('/file/d/');
        if (parts.length > 1) {
          id = parts[1].split('/')[0].split('?')[0];
        }
      }
      // Corak 2: id=ID
      else if (url.includes('id=')) {
        const parts = url.split('id=');
        if (parts.length > 1) {
          id = parts[1].split('&')[0];
        }
      }
      // Corak 3: /d/ID/ (format lain)
      else if (url.includes('/d/')) {
        const parts = url.split('/d/');
        if (parts.length > 1) {
          id = parts[1].split('/')[0].split('?')[0];
        }
      }
      return id || null;
    } catch (e) {
      return null;
    }
  };

  // Helper untuk menukar URL Google Drive kepada URL Imej Terus
  const getDirectImageUrl = (url: string) => {
    try {
        // Jika sudah format thumbnail atau uc, return sahaja
        if (url.includes('drive.google.com/thumbnail') || url.includes('drive.google.com/uc')) {
            return url;
        }

        const id = getFileIdFromUrl(url);

        if (id) {
            console.log('Converting Drive URL:', url, '-> ID:', id);
            // Gunakan endpoint uc yang lebih reliable untuk paparan
            return `https://drive.google.com/uc?export=view&id=${id}`;
        }

        console.warn('Could not extract ID from URL:', url);
        return url;
    } catch (e) {
        console.error('Error converting URL:', e, url);
        return url;
    }
  };

  const getHighResUrl = (url: string) => {
     // Untuk paparan penuh, gunakan URL yang sama (sudah high-res)
     return getDirectImageUrl(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray: File[] = Array.from(e.target.files);
      const validImages = filesArray.filter(f => f.type.startsWith('image/'));
      
      if (validImages.length !== filesArray.length) {
         alert("Hanya fail gambar (JPG/PNG) dibenarkan.");
      }

      if (validImages.length > 5) {
        alert("⚠️ HAD MAKSIMUM: Sila pilih 5 keping gambar maksimum pada satu masa.");
        setSelectedFiles(validImages.slice(0, 5));
      } else {
        setSelectedFiles(validImages);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert("Sila pilih sekurang-kurangnya satu gambar.");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));
        await gasService.uploadFile(selectedFiles[i], selectedFiles[i].name, unit.name, year, 'GALERI');
      }
      
      alert("✅ BERJAYA! Gambar telah dimuat naik.");
      setShowModal(false);
      setSelectedFiles([]);
      loadImages(); 
    } catch (error: any) {
      console.error("Ralat muat naik:", error);
      alert(`❌ GAGAL: ${error.message || "Masalah sambungan internet."}`);
    } finally { 
      setIsUploading(false); 
    }
  };

  // Handle Deletion
  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
        try {
            await gasService.deleteFile(fileToDelete, unit.name, year, 'GALERI');
            alert("✅ Gambar berjaya dipadam.");
            loadImages();
        } catch (e: any) {
            alert("❌ Gagal memadam gambar: " + e.message);
        }
    }
  };

  return (
    <div className="animate-fadeIn pb-32 min-h-screen relative">
      {/* Header Galeri */}
      <div className="flex items-center justify-between mb-8 bg-white/70 p-4 rounded-2xl backdrop-blur-md border border-white/40 shadow-sm sticky top-24 z-30">
        <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="hover:text-red-600 font-bold transition-colors !text-gray-700">
               <span className="text-xl mr-2">←</span> Kembali
            </Button>
        </div>
        <div className="text-right hidden sm:block">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Galeri {year}</h2>
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{unit.name}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-50 border-t-red-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-xl">📸</span>
            </div>
          </div>
          <p className="text-gray-400 text-[10px] font-black mt-6 uppercase tracking-[0.3em] animate-pulse">Memuatkan Kenangan...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(images) && images.map(img => (
            <div key={img.id} className="group relative cursor-pointer" onClick={() => setViewImage(img.url)}>
                <div className="bg-white p-3 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 border border-gray-100 h-full relative">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 relative">
                        <img
                            src={getDirectImageUrl(img.url)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            alt={img.name || "Aktiviti"}
                            loading="lazy"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error('Image load failed for:', img.url, 'Converted to:', getDirectImageUrl(img.url));
                                // Try alternative: if first load fails, try direct view link
                                if (!target.src.includes('placehold.co')) {
                                    const fileId = getFileIdFromUrl(img.url);
                                    if (fileId && !target.src.includes('export=download')) {
                                        target.src = `https://drive.google.com/uc?export=download&id=${fileId}`;
                                    } else {
                                        target.src = 'https://placehold.co/600x400/fee2e2/dc2626?text=Gagal+Memuatkan+Gambar';
                                    }
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-white/90 text-gray-800 rounded-full p-2 shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                            </span>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(img.dateUploaded).toLocaleDateString()}
                        </div>
                    </div>
                    {/* Delete Button for Gallery */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(img.id);
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-600 text-white shadow-lg flex items-center justify-center scale-0 group-hover:scale-100 transition-transform z-10 hover:bg-red-700"
                        title="Padam Gambar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
          ))}
          
          {(!Array.isArray(images) || images.length === 0) && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-red-200 rounded-[3.5rem] bg-white/50 px-10">
              <div className="bg-white w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border border-red-50 relative">
                 <span className="text-6xl animate-bounce">📸</span>
              </div>
              <h4 className="text-gray-900 font-black text-2xl uppercase tracking-tight">Galeri Kosong</h4>
              <p className="text-sm text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed font-semibold">
                Belum ada gambar aktiviti untuk unit <strong>{unit.name}</strong> bagi tahun <strong>{year}</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FLOATING ADD BUTTON (Bottom Right) */}
      {isCurrentYear && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-10 right-10 z-[40] bg-red-600 hover:bg-red-700 text-white rounded-full p-6 shadow-[0_25px_50px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-90 transition-all duration-300 border-4 border-white flex items-center justify-center group"
          title="Muat Naik Gambar"
        >
          <svg className="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* MODAL LIHAT GAMBAR PENUH (LIGHTBOX) */}
      {viewImage && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-fadeIn" onClick={() => setViewImage(null)}></div>
            <div className="relative w-full max-w-5xl h-full max-h-[90vh] flex items-center justify-center animate-scaleUp pointer-events-none">
                <img 
                    src={getHighResUrl(viewImage)} 
                    alt="Paparan Penuh" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto border-4 border-white"
                />
                <button 
                    onClick={() => setViewImage(null)}
                    className="absolute top-4 right-4 text-white bg-black/50 hover:bg-red-600 rounded-full p-2 pointer-events-auto transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmationModal
         isOpen={!!fileToDelete}
         onClose={() => setFileToDelete(null)}
         onConfirm={handleDeleteConfirm}
         unitPassword={unit.password}
         isAuthenticated={isAuthenticated}
      />

      {/* MODAL MUAT NAIK */}
      {showModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-fadeIn" onClick={() => !isUploading && setShowModal(false)}></div>
          <div className="bg-white rounded-[3.5rem] p-8 md:p-14 w-full max-w-lg relative animate-scaleUp shadow-2xl">
            <div className="mb-10 text-center">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Muat Naik Gambar</h3>
              <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.25em] mt-3">Folder: {unit.name} ({year})</p>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-8">
              <div className="relative">
                <input type="file" accept="image/png, image/jpeg, image/jpg" multiple onChange={handleFileChange} className="hidden" id="modal-upload-input" disabled={isUploading} />
                <label htmlFor="modal-upload-input" className={`flex flex-col items-center justify-center w-full border-4 border-dashed rounded-[3rem] py-16 transition-all cursor-pointer ${selectedFiles.length > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-red-50 hover:border-red-200'}`}>
                  <span className="text-5xl mb-4">{selectedFiles.length > 0 ? '✅' : '📷'}</span>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-500">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} Fail Dipilih` : 'Pilih Gambar (Maks 5)'}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold">Format: JPG / PNG</p>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 font-black uppercase text-[11px] py-5 rounded-2xl bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" disabled={isUploading} className="flex-1 font-black uppercase text-[11px] py-5 rounded-2xl bg-red-600 text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all">
                  {isUploading ? `UPLOADING... (${uploadProgress.current}/${uploadProgress.total})` : 'SIMPAN GAMBAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
