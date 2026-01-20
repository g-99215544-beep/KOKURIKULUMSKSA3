import React, { useState, useEffect } from 'react';
import { MeetingSchedule, UnitCategory, CATEGORY_LABELS } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { firebaseService } from '../services/firebaseService';

interface MeetingScheduleManagerProps {
  year: number;
  onBack: () => void;
}

export const MeetingScheduleManager: React.FC<MeetingScheduleManagerProps> = ({ year, onBack }) => {
  const [schedules, setSchedules] = useState<MeetingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [category, setCategory] = useState<UnitCategory>(UnitCategory.SATU_M_SATU_S);
  const [weekNumber, setWeekNumber] = useState(1);
  const [meetingDate, setMeetingDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      await firebaseService.saveMeetingSchedule(schedule);
      alert("✅ Jadual perjumpaan berjaya disimpan!");
      setShowModal(false);
      resetForm();
      loadSchedules();
    } catch (e: any) {
      alert("❌ Gagal simpan: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
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
  };

  const getCategoryColor = (cat: UnitCategory) => {
    switch (cat) {
      case UnitCategory.SATU_M_SATU_S: return 'bg-blue-50 text-blue-700 border-blue-200';
      case UnitCategory.KELAB_PERSATUAN: return 'bg-purple-50 text-purple-700 border-purple-200';
      case UnitCategory.UNIT_BERUNIFORM: return 'bg-green-50 text-green-700 border-green-200';
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
                <h3 className="text-lg font-bold text-gray-800">{CATEGORY_LABELS[cat]}</h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getCategoryColor(cat)} border`}>
                  {groupedSchedules[cat]?.length || 0} Jadual
                </span>
              </div>

              {groupedSchedules[cat] && groupedSchedules[cat].length > 0 ? (
                <div className="space-y-3">
                  {groupedSchedules[cat]
                    .sort((a, b) => a.weekNumber - b.weekNumber)
                    .map(schedule => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div>
                          <span className="text-sm font-bold text-gray-800">
                            Minggu {schedule.weekNumber}
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            Tarikh: <span className="font-bold">{new Date(schedule.meetingDate).toLocaleDateString('ms-MY')}</span>
                          </div>
                          <div className="text-xs text-red-600 mt-0.5">
                            Akhir: <span className="font-bold">{new Date(schedule.deadline).toLocaleDateString('ms-MY')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => schedule.id && handleDelete(schedule.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
        onClick={() => setShowModal(true)}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tambah Jadual</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as UnitCategory)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl font-bold outline-none focus:border-red-500 transition-colors"
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
                  className="font-bold"
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
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                >
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
