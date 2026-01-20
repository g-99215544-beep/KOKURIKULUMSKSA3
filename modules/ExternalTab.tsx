
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Achievement, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { firebaseService } from '../services/firebaseService';

interface ExternalTabProps {
  userRole?: UserRole;
}

// Initial Mock Data
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { 
      id: 1, 
      year: 2024, 
      level: 'Daerah', 
      event: 'Kejohanan Bola Sepak MSSD Bawah 12', 
      result: 'JOHAN', 
      unit: 'Bola Sepak',
      description: 'Pasukan Bola Sepak SK Sri Aman telah berjaya menewaskan SK Methodist dengan jaringan 3-1 di perlawanan akhir. Kemenangan ini melayakkan pasukan ke peringkat negeri.',
      imageUrl: 'https://picsum.photos/800/600?random=1'
  },
  { 
      id: 2, 
      year: 2024, 
      level: 'Negeri', 
      event: 'Pertandingan Bercerita Bahasa Melayu', 
      result: 'NAIB JOHAN', 
      unit: 'Persatuan Bahasa',
      description: 'Adik Nurul Izzah berjaya memukau juri dengan cerita bertajuk "Si Tanggang Moden" dan membawa pulang piala naib johan.',
      imageUrl: 'https://picsum.photos/800/600?random=2'
  },
  { 
      id: 3, 
      year: 2023, 
      level: 'Kebangsaan', 
      event: 'Karnival Kesenian & Kebudayaan', 
      result: 'ANUGERAH EMAS', 
      unit: 'Kelab Muzik',
      description: 'Persembahan Gamelan Melayu oleh Kelab Muzik mendapat pujian tinggi di peringkat kebangsaan yang diadakan di Putrajaya.',
      imageUrl: 'https://picsum.photos/800/600?random=3'
  },
  { 
      id: 4, 
      year: 2023, 
      level: 'Daerah', 
      event: 'Perkhemahan Perdana Unit Beruniform', 
      result: 'JOHAN KAWAD', 
      unit: 'TKRS',
      description: 'Platun TKRS lelaki berjaya mengekalkan kejuaraan kawad kaki formasi selama 3 tahun berturut-turut.',
      imageUrl: 'https://picsum.photos/800/600?random=4'
  },
];

export const ExternalTab: React.FC<ExternalTabProps> = ({ userRole }) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Achievement>>({});

  const isAdmin = userRole === UserRole.SUPER_ADMIN;

  // Load achievements from Firebase
  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      const data = await firebaseService.getAchievements();
      // If no data in Firebase, use initial mock data
      if (data.length === 0) {
        setAchievements(INITIAL_ACHIEVEMENTS);
        // Optionally migrate initial data to Firebase
        if (isAdmin) {
          console.log("No achievements found, consider migrating initial data");
        }
      } else {
        setAchievements(data);
      }
    } catch (e) {
      console.error("Failed to load achievements:", e);
      setAchievements(INITIAL_ACHIEVEMENTS); // Fallback to mock data
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEdit = (achievement?: Achievement) => {
    if (achievement) {
      setFormData(achievement);
    } else {
      setFormData({
        year: new Date().getFullYear(),
        level: 'Daerah',
        result: '',
        event: '',
        unit: '',
        description: '',
        imageUrl: 'https://picsum.photos/800/600'
      });
    }
    setIsEditing(true);
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Adakah anda pasti ingin memadam pencapaian ini?")) {
      try {
        await firebaseService.deleteAchievement(id);
        setAchievements(prev => prev.filter(a => a.id !== id));
        setSelectedAchievement(null);
        alert("✅ Pencapaian berjaya dipadam!");
      } catch (e: any) {
        alert("❌ Gagal padam: " + e.message);
        console.error("Delete failed:", e);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await firebaseService.saveAchievement(formData as Achievement);
      await loadAchievements(); // Reload from Firebase
      setIsEditing(false);
      alert("✅ Pencapaian berjaya disimpan!");
    } catch (e: any) {
      alert("❌ Gagal simpan: " + e.message);
      console.error("Save failed:", e);
    }
  };

  return (
    <div className="animate-fadeIn h-full flex flex-col relative">
       {/* Header & Controls */}
       {/* Reduced mb-3 to mb-1 for mobile to make it 'rapat' */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-1 md:mb-6 px-1">
         <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">Hall of Fame</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pencapaian Terkini SK Sri Aman</p>
         </div>
         
         {/* Only show this container if Admin, prevents empty gap on mobile */}
         {isAdmin && (
           <div className="flex flex-wrap gap-3 w-full md:w-auto mt-2 md:mt-0">
              <Button onClick={() => handleOpenEdit()} variant="secondary" className="flex-1 md:flex-none justify-center">
                + Rekod Manual
              </Button>
           </div>
         )}
       </div>

       {/* List Content */}
       <div className="animate-fadeIn pb-24">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600 mb-4"></div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Memuatkan Pencapaian...</p>
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-gray-500 font-bold">Tiada pencapaian dijumpai.</p>
              {isAdmin && (
                <p className="text-xs text-gray-400 mt-2">Klik butang "+ Rekod Manual" untuk tambah</p>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {achievements.map(item => (
              <Card 
                key={item.id} 
                className="!p-0 overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-400 cursor-pointer relative"
                onClick={() => setSelectedAchievement(item)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
                        {item.year}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md text-white shadow-sm ${
                        item.level === 'Antarabangsa' ? 'bg-purple-600' :
                        item.level === 'Kebangsaan' ? 'bg-red-600' :
                        item.level === 'Negeri' ? 'bg-yellow-500 text-white' : 'bg-green-600'
                      }`}>
                        {item.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      {item.unit}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg leading-tight mb-4 group-hover:text-red-700 transition-colors">
                    {item.event}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-yellow-700 font-bold bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100 w-fit">
                      <span className="mr-2 text-lg">🥇</span> {item.result}
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="bg-white rounded-full p-1 shadow-sm text-xs border border-gray-100">🔍</span>
                </div>
              </Card>
            ))}
          </div>
          )}
       </div>

       {/* FLOATING ACTION BUTTON (FAB) FOR REPORT */}
       <button
         onClick={() => setShowReportModal(true)}
         className="fixed bottom-6 right-6 z-40 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-xl shadow-red-300 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group"
         title="Isi Laporan Pencapaian"
       >
         <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap text-sm">
           Isi Laporan
         </span>
         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
       </button>

       {/* FULL SCREEN REPORT MODAL */}
       {showReportModal && (
         <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-red-700 p-4 text-white flex justify-between items-center shadow-md shrink-0 z-10">
               <div>
                 <h3 className="font-bold text-lg flex items-center gap-2">
                   <span>📝</span> Sistem Laporan Pencapaian
                 </h3>
                 <p className="text-xs text-red-100 opacity-80">Sila isi maklumat dengan lengkap</p>
               </div>
               <button
                 onClick={() => setShowReportModal(false)}
                 className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center"
               >
                 <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 Tutup
               </button>
            </div>
            {/* Iframe */}
            <div className="flex-1 relative bg-gray-100 overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center justify-center -z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-red-600 mb-3"></div>
                  <p className="text-gray-400 font-medium text-sm">Memuatkan Sistem...</p>
                </div>
                <iframe 
                  src="https://g-99215544-beep.github.io/penyertaan-dan-pencapaian-koko/"
                  title="Laporan Pencapaian & Penyertaan"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; camera"
                />
            </div>
         </div>
       )}

       {/* Detail Modal */}
       {selectedAchievement && !isEditing && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAchievement(null)}></div>
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden animate-scaleUp max-h-[90vh] overflow-y-auto">
             <div className="relative h-64 bg-gray-200">
                <img src={selectedAchievement.imageUrl} alt={selectedAchievement.event} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <div className="p-8">
               <div className="flex items-center gap-3 mb-4">
                 <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">{selectedAchievement.year}</span>
                 <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">🥇 {selectedAchievement.result}</span>
                 <span className="text-gray-400 text-sm font-medium">{selectedAchievement.level}</span>
               </div>
               
               <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedAchievement.event}</h2>
               <p className="text-red-600 font-medium mb-6">{selectedAchievement.unit}</p>
               
               <p className="text-gray-600 leading-relaxed text-lg mb-8">
                 {selectedAchievement.description || "Tiada deskripsi tambahan."}
               </p>

               {isAdmin && (
                 <div className="flex gap-3 pt-6 border-t border-gray-100">
                   <Button onClick={() => { setIsEditing(true); setFormData(selectedAchievement); }} className="flex-1">Edit</Button>
                   <Button onClick={() => handleDelete(selectedAchievement.id)} variant="danger" className="flex-1">Padam</Button>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}

       {/* Edit Modal (Admin Only) */}
       {isEditing && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative p-6 animate-scaleUp max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{formData.id ? 'Edit Pencapaian' : 'Tambah Pencapaian'}</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Tahun" type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                   <Input label="Peringkat" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} />
                </div>
                <Input label="Nama Acara/Pertandingan" value={formData.event} onChange={e => setFormData({...formData, event: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Keputusan" value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} />
                   <Input label="Unit" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
                <Textarea label="Deskripsi / Cerita Ringkas" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <Input label="URL Gambar" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">Batal</Button>
                  <Button type="submit" className="flex-1">Simpan</Button>
                </div>
              </form>
            </div>
         </div>
       )}
    </div>
  );
};
