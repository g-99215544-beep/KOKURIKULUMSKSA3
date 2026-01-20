
import React, { useState, useEffect } from 'react';
import { Unit, UnitCategory, CATEGORY_LABELS } from '../types';
import { gasService } from '../services/gasService';
import { Card } from '../components/ui/Card';

interface UnitSelectorProps {
  selectedYear: number;
  onSelectUnit: (unit: Unit) => void;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({ selectedYear, onSelectUnit }) => {
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      const fetchUnits = async () => {
        setIsLoading(true);
        try {
          const data = await gasService.getUnitsByCategory(selectedCategory);
          setUnits(data);
        } catch (error) {
          console.error("Failed to load units", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUnits();
    }
  }, [selectedCategory]);

  const getCategoryIconSvg = (cat: UnitCategory) => {
    switch (cat) {
      case UnitCategory.UNIT_BERUNIFORM: 
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V17C3 19.7614 5.23858 22 8 22H16C18.7614 22 21 19.7614 21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6L7 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case UnitCategory.KELAB_PERSATUAN: 
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.66398 17.6534L9.04353 20.3705C8.89234 21.0326 9.48924 21.6231 10.1502 21.4654L12.8631 20.8175" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.0769 16.4883C15.9329 15.6558 17.3879 14.1373 18.2325 12.2547C19.7396 8.89467 18.228 4.95856 14.868 3.45145C11.508 1.94433 7.57187 3.45598 6.06476 6.81604C5.2163 8.70763 5.30561 10.7431 6.13621 12.4414" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 13L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 13L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case UnitCategory.SATU_M_SATU_S: 
        return (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default: return <span>📂</span>;
    }
  };

  const getCategoryStyle = (cat: UnitCategory) => {
    switch (cat) {
      case UnitCategory.UNIT_BERUNIFORM: 
        return { 
            border: 'border-red-600', 
            bg: 'bg-red-50', 
            text: 'text-red-700'
        };
      case UnitCategory.KELAB_PERSATUAN: 
        return { 
            border: 'border-yellow-400', 
            bg: 'bg-yellow-50', 
            text: 'text-yellow-700'
        };
      case UnitCategory.SATU_M_SATU_S: 
        return { 
            border: 'border-gray-800', 
            bg: 'bg-gray-100', 
            text: 'text-gray-800'
        };
      default: 
        return { 
            border: 'border-gray-500', 
            bg: 'bg-gray-100', 
            text: 'text-gray-600'
        };
    }
  };

  // CATEGORY SELECTION VIEW
  if (!selectedCategory) {
    return (
      <div className="animate-fadeIn pb-10">
        <h3 className="text-lg font-bold text-gray-800 mb-5">Pilih Kategori Unit</h3>
        <div className="grid grid-cols-1 gap-4">
          {Object.values(UnitCategory).map((cat) => {
            const style = getCategoryStyle(cat);
            return (
              <div 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                   bg-white rounded-2xl p-5 cursor-pointer
                   border-l-[6px] ${style.border}
                   shadow-sm hover:shadow-lg hover:-translate-y-1 hover:shadow-red-100
                   transition-all duration-300 flex items-center justify-between group
                `}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${style.bg} ${style.text}`}>
                    {getCategoryIconSvg(cat)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-red-700 transition-colors">
                      {CATEGORY_LABELS[cat]}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 font-medium">
                      Klik untuk lihat senarai unit
                    </p>
                  </div>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // UNIT LIST VIEW
  const style = getCategoryStyle(selectedCategory);

  return (
    <div className="animate-fadeIn pb-10">
      <button 
        onClick={() => setSelectedCategory(null)}
        className="mb-6 flex items-center px-4 py-2 rounded-lg bg-white shadow-sm border border-gray-100 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Kembali ke Kategori
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${style.bg} ${style.text}`}>
          {getCategoryIconSvg(selectedCategory)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 leading-none">{CATEGORY_LABELS[selectedCategory]}</h3>
          <p className="text-sm text-gray-500 mt-1">Senarai Unit Berdaftar</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600 mb-4"></div>
          <p className="text-gray-400 text-sm font-medium animate-pulse">Memuatkan data unit...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((unit) => (
            <Card 
              key={unit.id} 
              hoverable 
              onClick={() => onSelectUnit(unit)}
              className="group !p-5 border-l-4 !border-l-transparent hover:!border-l-red-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md border border-gray-100 group-hover:scale-110 transition-transform duration-300 bg-white overflow-hidden p-1`}>
                    {unit.logoUrl ? (
                        <img src={unit.logoUrl} alt={unit.name} className="w-full h-full object-contain" />
                    ) : (
                        <span className="font-extrabold text-xl text-gray-600">{unit.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-base group-hover:text-red-700 transition-colors line-clamp-1">
                      {unit.name}
                    </h4>
                    <div className="flex items-center mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      <p className="text-xs text-gray-500 font-medium">Aktif 2026</p>
                    </div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
          {units.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl">
              <span className="text-4xl block mb-2">📭</span>
              Tiada unit dijumpai dalam kategori ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
