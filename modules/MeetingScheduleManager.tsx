import React, { useState, useEffect } from 'react';
import { MeetingSchedule, UnitCategory, CATEGORY_LABELS } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { firebaseService } from '../services/firebaseService';

interface MeetingScheduleManagerProps {
  year: number;
  onBack: () => void;
}

// Default Takwim Kokurikulum 2026
// Mengikut Takwim Aktiviti Kokurikulum SK Sri Aman 2026
// UB & KP berselang-seli setiap minggu (petang)
// 1M1S dijalankan setiap minggu (pagi) - mengikut tarikh UB dan KP
const DEFAULT_TAKWIM_2026: Omit<MeetingSchedule, 'id' | 'createdAt'>[] = [
  // ============ UNIT BERUNIFORM (UB) ============
  // Berselang-seli dengan KP, dijalankan waktu petang
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 1, meetingDate: '2026-01-21', deadline: '2026-01-24', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 2, meetingDate: '2026-02-04', deadline: '2026-02-07', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 3, meetingDate: '2026-02-25', deadline: '2026-02-28', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 4, meetingDate: '2026-03-11', deadline: '2026-03-14', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 5, meetingDate: '2026-05-13', deadline: '2026-05-16', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 6, meetingDate: '2026-06-24', deadline: '2026-06-27', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 7, meetingDate: '2026-07-08', deadline: '2026-07-11', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 8, meetingDate: '2026-07-22', deadline: '2026-07-25', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 9, meetingDate: '2026-08-05', deadline: '2026-08-08', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 10, meetingDate: '2026-08-19', deadline: '2026-08-22', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 11, meetingDate: '2026-09-09', deadline: '2026-09-12', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 12, meetingDate: '2026-09-23', deadline: '2026-09-26', year: 2026 },
  { category: UnitCategory.UNIT_BERUNIFORM, weekNumber: 13, meetingDate: '2026-10-07', deadline: '2026-10-10', year: 2026 },

  // ============ KELAB & PERSATUAN (KP) ============
  // Berselang-seli dengan UB, dijalankan waktu petang
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 1, meetingDate: '2026-01-28', deadline: '2026-01-31', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 2, meetingDate: '2026-02-11', deadline: '2026-02-14', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 3, meetingDate: '2026-03-04', deadline: '2026-03-07', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 4, meetingDate: '2026-03-18', deadline: '2026-03-21', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 5, meetingDate: '2026-06-10', deadline: '2026-06-13', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 6, meetingDate: '2026-07-01', deadline: '2026-07-04', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 7, meetingDate: '2026-07-15', deadline: '2026-07-18', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 8, meetingDate: '2026-07-29', deadline: '2026-08-01', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 9, meetingDate: '2026-08-12', deadline: '2026-08-15', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 10, meetingDate: '2026-08-26', deadline: '2026-08-29', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 11, meetingDate: '2026-09-09', deadline: '2026-09-12', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 12, meetingDate: '2026-09-30', deadline: '2026-10-03', year: 2026 },
  { category: UnitCategory.KELAB_PERSATUAN, weekNumber: 13, meetingDate: '2026-10-07', deadline: '2026-10-10', year: 2026 },

  // ============ 1 MURID 1 SUKAN (1M1S) ============
  // Dijalankan SETIAP minggu pada waktu PAGI (mengikut semua tarikh UB & KP)
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 1, meetingDate: '2026-01-21', deadline: '2026-01-24', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 2, meetingDate: '2026-01-28', deadline: '2026-01-31', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 3, meetingDate: '2026-02-04', deadline: '2026-02-07', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 4, meetingDate: '2026-02-11', deadline: '2026-02-14', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 5, meetingDate: '2026-02-25', deadline: '2026-02-28', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 6, meetingDate: '2026-03-04', deadline: '2026-03-07', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 7, meetingDate: '2026-03-11', deadline: '2026-03-14', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 8, meetingDate: '2026-03-18', deadline: '2026-03-21', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 9, meetingDate: '2026-05-13', deadline: '2026-05-16', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 10, meetingDate: '2026-06-10', deadline: '2026-06-13', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 11, meetingDate: '2026-06-24', deadline: '2026-06-27', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 12, meetingDate: '2026-07-01', deadline: '2026-07-04', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 13, meetingDate: '2026-07-08', deadline: '2026-07-11', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 14, meetingDate: '2026-07-15', deadline: '2026-07-18', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 15, meetingDate: '2026-07-22', deadline: '2026-07-25', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 16, meetingDate: '2026-07-29', deadline: '2026-08-01', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 17, meetingDate: '2026-08-05', deadline: '2026-08-08', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 18, meetingDate: '2026-08-12', deadline: '2026-08-15', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 19, meetingDate: '2026-08-19', deadline: '2026-08-22', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 20, meetingDate: '2026-08-26', deadline: '2026-08-29', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 21, meetingDate: '2026-09-09', deadline: '2026-09-12', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 22, meetingDate: '2026-09-23', deadline: '2026-09-26', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 23, meetingDate: '2026-09-30', deadline: '2026-10-03', year: 2026 },
  { category: UnitCategory.SATU_M_SATU_S, weekNumber: 24, meetingDate: '2026-10-07', deadline: '2026-10-10', year: 2026 },
];

export const MeetingScheduleManager: React.FC<MeetingScheduleManagerProps> = ({ year, onBack }) => {
  const [schedules, setSchedules] = useState<MeetingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Form state
  const [category, setCategory] = useState<UnitCategory>(UnitCategory.SATU_M_SATU_S);
  const [weekNumber, setWeekNumber] = useState(1);
  const [meetingDate, setMeetingDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit mode state
  const [editingSchedule, setEditingSchedule] = useState<MeetingSchedule | null>(null);
  const isEditMode = !!editingSchedule;

  useEffect(() => {
    loadSchedules();
  }, [year]);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await firebaseService.getMeetingSchedules(year);
      setSchedules(data);
    } catch (e) {
      console.error("Gagal load jadual:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize schedules from default takwim
  const initializeFromTakwim = async () => {
    if (schedules.length > 0) {
      const confirm = window.confirm(
        `⚠️ Sudah ada ${schedules.length} jadual untuk tahun ${year}.\n\nAdakah anda mahu menggantikan semua jadual dengan takwim default?\n\nTindakan ini akan MEMADAM semua jadual sedia ada.`
      );
      if (!confirm) return;

      // Delete existing schedules
      setIsInitializing(true);
      try {
        for (const schedule of schedules) {
          if (schedule.id) {
            await firebaseService.deleteMeetingSchedule(schedule.id);
          }
        }
      } catch (e) {
        console.error("Gagal padam jadual lama:", e);
        alert("❌ Gagal memadam jadual lama.");
        setIsInitializing(false);
        return;
      }
    } else {
      const confirm = window.confirm(
        `📅 Muat takwim kokurikulum ${year} dari template default?\n\nIni akan menambah ${DEFAULT_TAKWIM_2026.length} jadual perjumpaan untuk semua kategori.`
      );
      if (!confirm) return;
    }

    setIsInitializing(true);
    try {
      // Filter takwim by year (in case we add support for other years)
      const takwimForYear = DEFAULT_TAKWIM_2026.filter(t => t.year === year);

      for (const schedule of takwimForYear) {
        await firebaseService.saveMeetingSchedule(schedule as MeetingSchedule);
      }

      alert(`✅ ${takwimForYear.length} jadual berjaya dimuatkan dari takwim!`);
      loadSchedules();
    } catch (e: any) {
      console.error("Gagal initialize takwim:", e);
      alert("❌ Gagal muat takwim: " + e.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingDate || !deadline) {
      alert("Sila isi semua maklumat.");
      return;
    }

    // Validate deadline is after meeting date
    if (new Date(deadline) <= new Date(meetingDate)) {
      alert("Tarikh akhir mesti selepas tarikh perjumpaan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const schedule: MeetingSchedule = {
        category,
        weekNumber,
        meetingDate,
        deadline,
        year
      };

      if (isEditMode && editingSchedule?.id) {
        // Update existing
        await firebaseService.updateMeetingSchedule(editingSchedule.id, schedule);
        alert("✅ Jadual perjumpaan berjaya dikemaskini!");
      } else {
        // Create new
        await firebaseService.saveMeetingSchedule(schedule);
        alert("✅ Jadual perjumpaan berjaya disimpan!");
      }

      setShowModal(false);
      resetForm();
      loadSchedules();
    } catch (e: any) {
      alert("❌ Gagal simpan: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (schedule: MeetingSchedule) => {
    setEditingSchedule(schedule);
    setCategory(schedule.category);
    setWeekNumber(schedule.weekNumber);
    setMeetingDate(schedule.meetingDate);
    setDeadline(schedule.deadline);
    setShowModal(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Padam jadual perjumpaan ini?")) return;

    try {
      await firebaseService.deleteMeetingSchedule(scheduleId);
      alert("✅ Jadual dipadam.");
      loadSchedules();
    } catch (e: any) {
      alert("❌ Gagal padam: " + e.message);
    }
  };

  const resetForm = () => {
    setCategory(UnitCategory.SATU_M_SATU_S);
    setWeekNumber(1);
    setMeetingDate('');
    setDeadline('');
    setEditingSchedule(null);
  };

  const getCategoryColor = (cat: UnitCategory) => {
    switch (cat) {
      case UnitCategory.SATU_M_SATU_S: return 'bg-blue-50 text-blue-700 border-blue-200';
      case UnitCategory.KELAB_PERSATUAN: return 'bg-purple-50 text-purple-700 border-purple-200';
      case UnitCategory.UNIT_BERUNIFORM: return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  const getCategoryTimeLabel = (cat: UnitCategory) => {
    switch (cat) {
      case UnitCategory.SATU_M_SATU_S: return 'Pagi (setiap minggu)';
      case UnitCategory.KELAB_PERSATUAN: return 'Petang (berselang-seli dgn UB)';
      case UnitCategory.UNIT_BERUNIFORM: return 'Petang (berselang-seli dgn KP)';
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.category]) {
      acc[schedule.category] = [];
    }
    acc[schedule.category].push(schedule);
    return acc;
  }, {} as Record<UnitCategory, MeetingSchedule[]>);

  return (
    <div className="animate-fadeIn pb-24">
      <div className="flex items-center justify-between mb-6 bg-white/70 p-4 rounded-2xl backdrop-blur-md border border-white/40 shadow-sm sticky top-20 z-30">
        <Button variant="ghost" onClick={onBack} className="mr-2">
          ← Kembali
        </Button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Jadual Perjumpaan</h2>
          <p className="text-xs font-bold text-red-600 uppercase">Tahun {year}</p>
        </div>
      </div>

      {/* Initialize from Takwim Button */}
      <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-amber-800 text-sm">Takwim Kokurikulum {year}</h3>
            <p className="text-xs text-amber-600 mt-1">
              {schedules.length > 0
                ? `${schedules.length} jadual telah ditetapkan`
                : 'Tiada jadual. Klik butang untuk muat takwim default.'}
            </p>
          </div>
          <button
            onClick={initializeFromTakwim}
            disabled={isInitializing || isLoading}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              isInitializing
                ? 'bg-amber-200 text-amber-500 cursor-wait'
                : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
            }`}
          >
            {isInitializing ? 'Memuat...' : schedules.length > 0 ? 'Reset Takwim' : 'Muat Takwim'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600"></div>
          <p className="text-xs text-gray-400 mt-4 font-bold uppercase">Memuatkan...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categories */}
          {Object.values(UnitCategory).map(cat => (
            <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{CATEGORY_LABELS[cat]}</h3>
                  <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                    {getCategoryTimeLabel(cat)}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getCategoryColor(cat)} border`}>
                  {groupedSchedules[cat]?.length || 0} Jadual
                </span>
              </div>

              {groupedSchedules[cat] && groupedSchedules[cat].length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {groupedSchedules[cat]
                    .sort((a, b) => a.weekNumber - b.weekNumber)
                    .map(schedule => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">
                              Minggu {schedule.weekNumber}
                            </span>
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              {new Date(schedule.meetingDate).toLocaleDateString('ms-MY', { weekday: 'short' })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Tarikh: <span className="font-bold">{new Date(schedule.meetingDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="text-xs text-red-600 mt-0.5">
                            Deadline: <span className="font-bold">{new Date(schedule.deadline).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Edit jadual"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => schedule.id && handleDelete(schedule.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Padam jadual"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Tiada jadual untuk kategori ini.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        className="fixed bottom-10 right-10 z-40 bg-red-600 hover:bg-red-700 text-white rounded-full p-6 shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowModal(false)}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md relative animate-scaleUp">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditMode ? 'Edit Jadual' : 'Tambah Jadual'}
            </h3>
            {isEditMode && (
              <p className="text-xs text-blue-600 mb-6 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                Mengedit: {CATEGORY_LABELS[category]} - Minggu {weekNumber}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as UnitCategory)}
                  disabled={isEditMode}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl font-bold outline-none focus:border-red-500 transition-colors ${isEditMode ? 'bg-gray-100 text-gray-500' : ''}`}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Minggu</label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={weekNumber}
                  onChange={e => setWeekNumber(parseInt(e.target.value))}
                  required
                  disabled={isEditMode}
                  className={`font-bold ${isEditMode ? 'bg-gray-100 text-gray-500' : ''}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Tarikh Perjumpaan</label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  required
                  className="font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Tarikh Akhir (Deadline)</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                  className="font-bold"
                />
                <p className="text-xs text-gray-500 mt-1">Rekod mesti lengkap sebelum tarikh ini</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 ${isEditMode ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  isLoading={isSubmitting}
                >
                  {isEditMode ? 'Kemaskini' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
