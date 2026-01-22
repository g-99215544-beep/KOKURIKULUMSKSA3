import React, { useState, useEffect } from 'react';
import { UnitCategory, CATEGORY_LABELS, UnitFlare, FlareType, FLARE_LABELS, Unit } from '../types';
import { Button } from '../components/ui/Button';
import { firebaseService } from '../services/firebaseService';
import { gasService } from '../services/gasService';

interface CoordinatorManagerProps {
  category: UnitCategory;
  year: number;
  onBack: () => void;
}

export const CoordinatorManager: React.FC<CoordinatorManagerProps> = ({ category, year, onBack }) => {
  const [flares, setFlares] = useState<UnitFlare[]>([]);
  const [categoryUnits, setCategoryUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flare form state
  const [selectedFlareTypes, setSelectedFlareTypes] = useState<FlareType[]>([]);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [category, year]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load units for this category
      const units = await gasService.getUnitsByCategory(category);
      setCategoryUnits(units);

      // Load flares
      const flaresData = await firebaseService.getFlaresByCategory(category, year);
      setFlares(flaresData);
    } catch (e) {
      console.error("Gagal load data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFlares = async () => {
    try {
      const data = await firebaseService.getFlaresByCategory(category, year);
      setFlares(data);
    } catch (e) {
      console.error("Gagal load flares:", e);
    }
  };

  const handleAssignFlare = (unit: Unit) => {
    setSelectedUnit(unit);
    setSelectedFlareTypes([]);
    setWeekNumber(1);
    setCustomMessage('');
    setShowAssignModal(true);
  };

  const handleFlareTypeToggle = (type: FlareType) => {
    setSelectedFlareTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmitFlares = async () => {
    if (!selectedUnit || selectedFlareTypes.length === 0) {
      alert("Sila pilih sekurang-kurangnya satu tugasan.");
      return;
    }

    setIsSubmitting(true);
    try {
      for (const flareType of selectedFlareTypes) {
        const flare: UnitFlare = {
          unitId: selectedUnit.id,
          unitName: selectedUnit.name,
          category: category,
          flareType: flareType,
          weekNumber: (flareType === 'KEHADIRAN' || flareType === 'LAPORAN_MINGGUAN') ? weekNumber : undefined,
          message: customMessage || undefined,
          assignedBy: category,
          year: year
        };

        await firebaseService.saveFlare(flare);
      }

      alert(`✅ ${selectedFlareTypes.length} peringatan berjaya ditambah untuk ${selectedUnit.name}!`);
      setShowAssignModal(false);
      loadFlares();
    } catch (e: any) {
      alert("❌ Gagal: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFlare = async (flareId: string) => {
    if (!confirm("Padam peringatan ini?")) return;

    try {
      await firebaseService.deleteFlare(flareId);
      loadFlares();
    } catch (e: any) {
      alert("❌ Gagal padam: " + e.message);
    }
  };

  const getUnitFlares = (unitName: string) => {
    return flares.filter(f => f.unitName.toLowerCase() === unitName.toLowerCase());
  };

  const getCategoryColor = () => {
    switch (category) {
      case UnitCategory.UNIT_BERUNIFORM: return 'from-green-600 to-emerald-600';
      case UnitCategory.KELAB_PERSATUAN: return 'from-purple-600 to-violet-600';
      case UnitCategory.SATU_M_SATU_S: return 'from-blue-600 to-sky-600';
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case UnitCategory.UNIT_BERUNIFORM: return '🎖️';
      case UnitCategory.KELAB_PERSATUAN: return '🏆';
      case UnitCategory.SATU_M_SATU_S: return '⚽';
    }
  };

  return (
    <div className="animate-fadeIn pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getCategoryColor()} rounded-2xl p-6 mb-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-white/80 hover:text-white hover:bg-white/20">
            ← Kembali
          </Button>
          <div className="text-right">
            <p className="text-xs opacity-80 font-bold uppercase">Penyelaras</p>
            <h2 className="text-xl font-bold">{CATEGORY_LABELS[category]}</h2>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-4xl">{getCategoryIcon()}</span>
          <div>
            <p className="text-sm opacity-90">Urus peringatan tugasan untuk unit-unit di bawah kategori anda.</p>
            <p className="text-xs opacity-70 mt-1">{categoryUnits.length} unit • Tahun {year}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Jumlah Unit</p>
          <p className="text-2xl font-black text-gray-800">{categoryUnits.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Peringatan Aktif</p>
          <p className="text-2xl font-black text-red-600">{flares.length}</p>
        </div>
      </div>

      {/* Unit List */}
      <h3 className="text-sm font-bold text-gray-600 uppercase mb-3">Senarai Unit</h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {categoryUnits.map(unit => {
            const unitFlares = getUnitFlares(unit.name);
            return (
              <div
                key={unit.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {unit.logoUrl ? (
                        <img src={unit.logoUrl} alt={unit.name} className="w-8 h-8 object-contain rounded-full" />
                      ) : (
                        getCategoryIcon()
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{unit.name}</h4>
                      <p className="text-[10px] text-gray-400">{unit.teachers?.length || 0} guru</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssignFlare(unit)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors"
                  >
                    + Peringatan
                  </button>
                </div>

                {/* Active Flares for this unit */}
                {unitFlares.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Peringatan Aktif:</p>
                    <div className="flex flex-wrap gap-2">
                      {unitFlares.map(flare => (
                        <div
                          key={flare.id}
                          className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold border border-red-200"
                        >
                          <span className="animate-pulse">🔴</span>
                          <span>
                            {FLARE_LABELS[flare.flareType]}
                            {flare.weekNumber && ` (M${flare.weekNumber})`}
                          </span>
                          <button
                            onClick={() => flare.id && handleDeleteFlare(flare.id)}
                            className="ml-1 text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Flare Modal */}
      {showAssignModal && selectedUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowAssignModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md relative animate-scaleUp overflow-hidden">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${getCategoryColor()} p-5 text-white`}>
              <h3 className="text-lg font-bold">Tambah Peringatan</h3>
              <p className="text-sm opacity-90">{selectedUnit.name}</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Flare Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-3 uppercase">
                  Pilih Tugasan <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {(Object.keys(FLARE_LABELS) as FlareType[]).map(type => (
                    <label
                      key={type}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedFlareTypes.includes(type)
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFlareTypes.includes(type)}
                        onChange={() => handleFlareTypeToggle(type)}
                        className="w-5 h-5 text-red-600 rounded"
                      />
                      <span className="font-bold text-gray-700">{FLARE_LABELS[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Week Number (for attendance/report) */}
              {(selectedFlareTypes.includes('KEHADIRAN') || selectedFlareTypes.includes('LAPORAN_MINGGUAN')) && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">
                    Minggu Ke-
                  </label>
                  <select
                    value={weekNumber}
                    onChange={e => setWeekNumber(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>Minggu {num}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Message (optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">
                  Mesej Tambahan (Pilihan)
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  placeholder="Cth: Sila hantar sebelum Jumaat"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-200 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowAssignModal(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmitFlares}
                isLoading={isSubmitting}
                disabled={selectedFlareTypes.length === 0}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Tambah Peringatan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
