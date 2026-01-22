
import React, { useState, useEffect } from 'react';
import { Unit, UserRole, UnitFlare, FlareType, FLARE_LABELS } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { gasService } from '../services/gasService';
import { firebaseService } from '../services/firebaseService';

interface UnitDashboardProps {
  unit: Unit;
  userRole: UserRole;
  year: number;
  onNavigate: (view: any) => void;
  onBack: () => void;
}

export const UnitDashboard: React.FC<UnitDashboardProps> = ({ unit, userRole, year, onNavigate, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [flares, setFlares] = useState<UnitFlare[]>([]);

  const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.UNIT_ADMIN;

  // Fetch flares for this unit
  useEffect(() => {
    const loadFlares = async () => {
      try {
        const data = await firebaseService.getFlaresByUnit(unit.name, year);
        setFlares(data);
      } catch (e) {
        console.error("Gagal load flares:", e);
      }
    };
    loadFlares();
  }, [unit.name, year]);

  // Map flare types to module IDs
  const getFlareForModule = (moduleId: string): UnitFlare | undefined => {
    const flareMap: Record<string, FlareType> = {
      'ATTENDANCE': 'KEHADIRAN',
      'REPORT': 'LAPORAN_MINGGUAN',
      'ORG': 'CARTA_ORGANISASI',
      'PLAN': 'RANCANGAN_TAHUNAN'
    };
    const flareType = flareMap[moduleId];
    if (!flareType) return undefined;
    return flares.find(f => f.flareType === flareType);
  };

  const handleGenerateFolders = async () => {
    if (!isAdmin) return;
    setIsGenerating(true);
    try {
      const success = await gasService.createFolderStructure(unit.name, 2026);
      if (success) {
        alert(`✅ Folder untuk ${unit.name} berjaya dijana di Google Drive!`);
      } else {
        alert("❌ Gagal menjana folder.");
      }
    } catch (e) {
      alert("❌ Ralat sambungan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const modules = [
    { 
      id: 'REPORT', 
      title: 'Laporan Mingguan', 
      icon: '📝', 
      color: 'bg-red-100 text-red-600',
      desc: 'Isi Borang & Semak',
      action: () => onNavigate('FORM_REPORT')
    },
    { 
      id: 'TEACHERS', 
      title: 'Guru Penasihat', 
      icon: '👨‍🏫', 
      color: 'bg-yellow-100 text-yellow-700',
      desc: 'Senarai & Kemaskini',
      action: () => onNavigate('MANAGE_TEACHERS')
    },
    { 
      id: 'ATTENDANCE', 
      title: 'Isi Kehadiran', 
      icon: '✅', 
      color: 'bg-green-100 text-green-600',
      desc: 'Rekod & Analisis',
      action: () => onNavigate('VIEW_ATTENDANCE') // CHANGED: Go to List View first
    },
    { 
      id: 'ORG', 
      title: 'Carta Organisasi', 
      icon: '👥', 
      color: 'bg-gray-100 text-gray-700',
      desc: 'AJK Murid',
      action: () => onNavigate('VIEW_ORG')
    },
    { 
      id: 'PLAN', 
      title: 'Rancangan Tahunan', 
      icon: '📊', 
      color: 'bg-orange-100 text-orange-600',
      desc: 'Takwim Aktiviti',
      action: () => onNavigate('VIEW_PLAN')
    },
    { 
      id: 'GALLERY', 
      title: 'Galeri Gambar', 
      icon: '🖼️', 
      color: 'bg-blue-100 text-blue-600',
      desc: 'Koleksi Foto',
      action: () => onNavigate('VIEW_GALLERY')
    }
  ];

  return (
    <div className="animate-fadeIn pb-10">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack} 
          className="bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Kembali
        </button>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button 
               onClick={handleGenerateFolders} 
               isLoading={isGenerating}
               variant="secondary"
               className="text-[10px] px-3 py-1.5 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 font-bold uppercase tracking-wider"
            >
              ⚡ Jana Folder
            </Button>
            {userRole === UserRole.SUPER_ADMIN && (
                <div className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest shadow-sm flex items-center gap-2 bg-red-50 text-red-700 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    ADMIN
                </div>
            )}
          </div>
        )}
      </div>

      {/* Unit Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-red-50 p-6 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-800"></div>
        <div className="w-20 h-20 bg-red-50 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner text-red-600 font-bold border-4 border-white overflow-hidden p-2">
            {unit.logoUrl ? (
                <img src={unit.logoUrl} alt={unit.name} className="w-full h-full object-contain" />
            ) : (
                unit.name.charAt(0)
            )}
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{unit.name}</h2>
        <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase tracking-wider">
          {unit.category.replace('_', ' ')}
        </span>
      </div>

      {/* Grid Menu */}
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Menu Utama</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const flare = getFlareForModule(mod.id);
          return (
            <Card key={mod.id} hoverable onClick={mod.action} className="group !p-4 flex flex-col items-center text-center justify-center min-h-[160px] relative">
              {/* Flare Badge */}
              {flare && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="relative">
                    <span className="flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-white text-[10px] font-bold">!</span>
                    </span>
                  </div>
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl ${mod.color} flex items-center justify-center text-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {mod.icon}
              </div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight group-hover:text-red-700">{mod.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{mod.desc}</p>

              {/* Flare Message */}
              {flare && (
                <div className="mt-2 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-[9px] text-red-600 font-bold">
                    {flare.weekNumber ? `Minggu ${flare.weekNumber}` : 'Sila lengkapkan'}
                    {flare.message && ` - ${flare.message}`}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
