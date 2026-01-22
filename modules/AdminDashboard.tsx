import React, { useState, useEffect } from 'react';
import { Unit, UnitCategory, CATEGORY_LABELS } from '../types';
import { Button } from '../components/ui/Button';
import { firebaseService, OrgChartData, AnnualPlanData, AttendanceRecord } from '../services/firebaseService';
import { gasService } from '../services/gasService';

interface AdminDashboardProps {
  year: number;
  onBack: () => void;
  onFlareUnit: (unit: Unit, category: UnitCategory) => void;
}

interface UnitCompletionStatus {
  unit: Unit;
  orgChart: {
    complete: boolean;
    data?: OrgChartData;
  };
  annualPlan: {
    complete: boolean;
    data?: AnnualPlanData;
  };
  attendance: {
    weeks: { [key: number]: boolean };
    lastWeek: number;
    expectedWeek: number;
  };
}

const CURRENT_WEEK = 12; // Minggu semasa yang dijangka

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ year, onBack, onFlareUnit }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [unitStatuses, setUnitStatuses] = useState<UnitCompletionStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | 'ALL'>('ALL');

  useEffect(() => {
    loadAllUnitStatuses();
  }, [year]);

  const loadAllUnitStatuses = async () => {
    setIsLoading(true);
    try {
      // Get all units
      const allUnits = await gasService.getAllUnits();

      const statuses: UnitCompletionStatus[] = [];

      for (const unit of allUnits) {
        // Check org chart
        const orgCharts = await firebaseService.getOrgChartByUnit(unit.name, year);
        const hasOrgChart = orgCharts.length > 0;

        // Check annual plan
        const annualPlans = await firebaseService.getAnnualPlanByUnit(unit.name, year);
        const hasAnnualPlan = annualPlans.length > 0;

        // Check attendance records
        const attendanceRecords = await firebaseService.getAttendanceByUnit(unit.name);
        const yearAttendance = attendanceRecords.filter(r => r.date.startsWith(year.toString()));

        const attendanceWeeks: { [key: number]: boolean } = {};
        let lastWeek = 0;

        yearAttendance.forEach(record => {
          const weekNum = parseInt(record.week.replace(/\D/g, ''));
          if (weekNum) {
            attendanceWeeks[weekNum] = true;
            if (weekNum > lastWeek) lastWeek = weekNum;
          }
        });

        statuses.push({
          unit,
          orgChart: {
            complete: hasOrgChart,
            data: orgCharts[0]
          },
          annualPlan: {
            complete: hasAnnualPlan,
            data: annualPlans[0]
          },
          attendance: {
            weeks: attendanceWeeks,
            lastWeek,
            expectedWeek: CURRENT_WEEK
          }
        });
      }

      setUnitStatuses(statuses);
    } catch (e) {
      console.error('Error loading unit statuses:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: UnitCategory) => {
    switch (category) {
      case UnitCategory.UNIT_BERUNIFORM: return 'border-green-500 bg-green-50';
      case UnitCategory.KELAB_PERSATUAN: return 'border-purple-500 bg-purple-50';
      case UnitCategory.SATU_M_SATU_S: return 'border-blue-500 bg-blue-50';
    }
  };

  const getCategoryBadgeColor = (category: UnitCategory) => {
    switch (category) {
      case UnitCategory.UNIT_BERUNIFORM: return 'bg-green-600 text-white';
      case UnitCategory.KELAB_PERSATUAN: return 'bg-purple-600 text-white';
      case UnitCategory.SATU_M_SATU_S: return 'bg-blue-600 text-white';
    }
  };

  const getCategoryIcon = (category: UnitCategory) => {
    switch (category) {
      case UnitCategory.UNIT_BERUNIFORM: return '🎖️';
      case UnitCategory.KELAB_PERSATUAN: return '🏆';
      case UnitCategory.SATU_M_SATU_S: return '⚽';
    }
  };

  const filteredUnits = selectedCategory === 'ALL'
    ? unitStatuses
    : unitStatuses.filter(s => s.unit.category === selectedCategory);

  const getOverallStats = () => {
    const total = unitStatuses.length;
    const orgChartComplete = unitStatuses.filter(s => s.orgChart.complete).length;
    const annualPlanComplete = unitStatuses.filter(s => s.annualPlan.complete).length;
    const attendanceUpToDate = unitStatuses.filter(s => s.attendance.lastWeek >= CURRENT_WEEK).length;

    return { total, orgChartComplete, annualPlanComplete, attendanceUpToDate };
  };

  const stats = getOverallStats();

  return (
    <div className="animate-fadeIn pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-white/80 hover:text-white hover:bg-white/20">
            ← Kembali
          </Button>
          <div className="text-right">
            <p className="text-xs opacity-80 font-bold uppercase">Admin Dashboard</p>
            <h2 className="text-xl font-bold">Paparan Status Semua Unit</h2>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm opacity-90">Semak kelengkapan dokumen dan kehadiran untuk semua unit kokurikulum.</p>
          <p className="text-xs opacity-70 mt-1">Tahun {year} • Minggu Semasa: {CURRENT_WEEK}</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Jumlah Unit</p>
          <p className="text-2xl font-black text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Carta Organisasi</p>
          <p className="text-2xl font-black text-green-600">{stats.orgChartComplete}/{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Rancangan Tahunan</p>
          <p className="text-2xl font-black text-blue-600">{stats.annualPlanComplete}/{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Kehadiran Terkini</p>
          <p className="text-2xl font-black text-purple-600">{stats.attendanceUpToDate}/{stats.total}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white p-2 rounded-xl shadow-sm border mb-6 flex gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            selectedCategory === 'ALL' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          SEMUA
        </button>
        <button
          onClick={() => setSelectedCategory(UnitCategory.UNIT_BERUNIFORM)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            selectedCategory === UnitCategory.UNIT_BERUNIFORM ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          🎖️ UB
        </button>
        <button
          onClick={() => setSelectedCategory(UnitCategory.KELAB_PERSATUAN)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            selectedCategory === UnitCategory.KELAB_PERSATUAN ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          🏆 KP
        </button>
        <button
          onClick={() => setSelectedCategory(UnitCategory.SATU_M_SATU_S)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            selectedCategory === UnitCategory.SATU_M_SATU_S ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          ⚽ 1M1S
        </button>
      </div>

      {/* Unit Status List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-gray-900"></div>
          <p className="text-gray-400 text-xs mt-4">Memuatkan data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUnits.map(status => {
            const incompleteItems = [];

            if (!status.orgChart.complete) incompleteItems.push('Carta Organisasi');
            if (!status.annualPlan.complete) incompleteItems.push('Rancangan Tahunan');

            // Check missing attendance weeks
            const missingWeeks = [];
            for (let i = 1; i <= CURRENT_WEEK; i++) {
              if (!status.attendance.weeks[i]) {
                missingWeeks.push(i);
              }
            }

            const isFullyComplete = incompleteItems.length === 0 && missingWeeks.length === 0;

            return (
              <div
                key={status.unit.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md ${
                  isFullyComplete ? 'border-green-300' : 'border-red-300'
                }`}
              >
                {/* Unit Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getCategoryColor(status.unit.category)}`}>
                      {status.unit.logoUrl ? (
                        <img src={status.unit.logoUrl} alt={status.unit.name} className="w-10 h-10 object-contain" />
                      ) : (
                        getCategoryIcon(status.unit.category)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{status.unit.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getCategoryBadgeColor(status.unit.category)}`}>
                          {CATEGORY_LABELS[status.unit.category]}
                        </span>
                        {isFullyComplete ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">
                            ✓ LENGKAP
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                            ⚠ TIDAK LENGKAP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isFullyComplete && (
                    <button
                      onClick={() => onFlareUnit(status.unit, status.unit.category)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm"
                    >
                      🔔 Flare
                    </button>
                  )}
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Carta Organisasi */}
                  <div className={`p-3 rounded-lg border-2 ${status.orgChart.complete ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-gray-700">Carta Organisasi</p>
                      {status.orgChart.complete ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold">✕</span>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold ${status.orgChart.complete ? 'text-green-700' : 'text-red-700'}`}>
                      {status.orgChart.complete ? 'Lengkap' : 'Tidak Lengkap'}
                    </p>
                  </div>

                  {/* Rancangan Tahunan */}
                  <div className={`p-3 rounded-lg border-2 ${status.annualPlan.complete ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-gray-700">Rancangan Tahunan</p>
                      {status.annualPlan.complete ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold">✕</span>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold ${status.annualPlan.complete ? 'text-green-700' : 'text-red-700'}`}>
                      {status.annualPlan.complete ? 'Lengkap' : 'Tidak Lengkap'}
                    </p>
                  </div>

                  {/* Kehadiran */}
                  <div className={`p-3 rounded-lg border-2 ${missingWeeks.length === 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-gray-700">Kehadiran</p>
                      {missingWeeks.length === 0 ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-600 font-bold">✕</span>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold ${missingWeeks.length === 0 ? 'text-green-700' : 'text-red-700'}`}>
                      M{status.attendance.lastWeek || 0} / M{CURRENT_WEEK}
                    </p>
                    {missingWeeks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {missingWeeks.slice(0, 6).map(week => (
                          <span key={week} className="text-[9px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-bold">
                            M{week}
                          </span>
                        ))}
                        {missingWeeks.length > 6 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-bold">
                            +{missingWeeks.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Incomplete Items Summary */}
                {!isFullyComplete && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Item Tidak Lengkap:</p>
                    <div className="flex flex-wrap gap-2">
                      {incompleteItems.map(item => (
                        <span key={item} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">
                          {item}
                        </span>
                      ))}
                      {missingWeeks.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">
                          Kehadiran ({missingWeeks.length} minggu)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredUnits.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">Tiada unit ditemui untuk kategori ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
