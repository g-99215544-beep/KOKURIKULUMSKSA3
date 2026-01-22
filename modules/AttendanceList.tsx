
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { firebaseService, AttendanceRecord } from '../services/firebaseService';

interface AttendanceListProps {
  unit: Unit;
  year: number;
  onBack: () => void;
  onCreateNew: () => void;
  onEditRecord?: (record: AttendanceRecord) => void;
  isAuthenticated: boolean;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({ unit, year, onBack, onCreateNew, onEditRecord, isAuthenticated }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Delete Modal State
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State (for password confirmation before edit)
  const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await firebaseService.getAttendanceByUnit(unit.name);
      const filteredByYear = data.filter(r => r.date.startsWith(year.toString()));
      setRecords(filteredByYear);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [unit, year]);

  // Helper to get list of absent students
  const getAbsentList = (record: AttendanceRecord) => {
    const absentStudents: { name: string; className: string }[] = [];
    record.classes.forEach(c => {
      c.students.forEach(s => {
        if (s.status === 'TIDAK HADIR') {
          absentStudents.push({ name: s.name, className: c.className });
        }
      });
    });
    return absentStudents;
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !recordToDelete.id) return;

    // Skip password validation if authenticated
    if (!isAuthenticated) {
      // Validate password
      const isValidPassword =
        deletePassword.trim().toUpperCase() === (unit.password || '').toUpperCase() ||
        deletePassword === 'admin';

      if (!isValidPassword) {
        setDeleteError('Kata laluan salah!');
        return;
      }
    }

    setIsDeleting(true);
    try {
      await firebaseService.deleteAttendance(recordToDelete.id);
      alert('✅ Rekod kehadiran berjaya dipadam.');
      setRecordToDelete(null);
      setDeletePassword('');
      setDeleteError('');
      fetchRecords();
    } catch (e: any) {
      alert('❌ Gagal memadam: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Edit Password Confirmation
  const handleEditConfirm = () => {
    if (!recordToEdit) return;

    // Skip password validation if authenticated
    if (!isAuthenticated) {
      // Validate password
      const isValidPassword =
        editPassword.trim().toUpperCase() === (unit.password || '').toUpperCase() ||
        editPassword === 'admin';

      if (!isValidPassword) {
        setEditError('Kata laluan salah!');
        return;
      }
    }

    // Password valid or authenticated, proceed to edit
    if (onEditRecord) {
      onEditRecord(recordToEdit);
    }
    setRecordToEdit(null);
    setEditPassword('');
    setEditError('');
  };

  return (
    <div className="animate-fadeIn pb-24 relative min-h-screen">
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2">← Kembali</Button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Rekod Kehadiran</h2>
          <p className="text-xs font-bold text-red-600 uppercase">
             {unit.name} • {year}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-100 border-t-red-600"></div>
             <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-widest animate-pulse">Memuatkan Data...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
           <div className="text-5xl mb-4">📅</div>
           <p className="text-gray-500 font-bold">Tiada rekod kehadiran dijumpai.</p>
           <p className="text-xs text-gray-400 mt-2">Tekan butang + di bawah untuk isi kehadiran baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           {records.map((record) => (
             <div
               key={record.id || Math.random()}
               className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                </div>

                <div className="flex justify-between items-start relative z-10">
                   <div className="cursor-pointer flex-1" onClick={() => setSelectedRecord(record)}>
                      <span className="inline-block px-2 py-1 rounded-md bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-wider mb-2">
                         {record.week}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800">
                         {new Date(record.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Disimpan pada: {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '-'}</p>
                   </div>
                   <div className="text-right">
                      <div className="text-3xl font-black text-gray-800">
                         {record.presentCount}<span className="text-sm text-gray-400 font-medium">/{record.totalStudents}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">Kehadiran</div>
                   </div>
                </div>

                {record.absentCount > 0 && (
                   <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 relative z-10 cursor-pointer" onClick={() => setSelectedRecord(record)}>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <p className="text-xs text-red-600 font-bold">
                         {record.absentCount} Orang Tidak Hadir
                      </p>
                      <span className="text-xs text-gray-400 ml-auto underline group-hover:text-red-600">Lihat Senarai</span>
                   </div>
                )}
                {record.absentCount === 0 && (
                   <div className="mt-4 pt-3 border-t border-gray-100 relative z-10">
                      <p className="text-xs text-green-600 font-bold flex items-center gap-2">
                         ✅ Kehadiran Penuh
                      </p>
                   </div>
                )}

                {/* Action Buttons - Only show for current year */}
                {year === 2026 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2 relative z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecordToEdit(record);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecordToDelete(record);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Padam
                    </button>
                  </div>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Floating Action Button for New Attendance */}
      {year === 2026 && (
        <button
           onClick={onCreateNew}
           className="fixed bottom-8 right-8 z-40 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-xl shadow-red-300 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group border-4 border-white"
        >
           <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap text-sm pl-1">Isi Kehadiran</span>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {/* Modal Details */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}></div>
            <div className="bg-white rounded-3xl w-full max-w-md relative animate-scaleUp overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-red-600 p-6 text-white shrink-0">
                    <h3 className="text-xl font-bold">{selectedRecord.week}</h3>
                    <p className="opacity-90 text-sm">{new Date(selectedRecord.date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

                    <div className="flex gap-4 mt-4">
                        <div className="bg-white/20 rounded-lg p-2 px-4 backdrop-blur-sm text-center flex-1">
                            <div className="text-2xl font-black">{selectedRecord.presentCount}</div>
                            <div className="text-[9px] uppercase font-bold opacity-80">Hadir</div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2 px-4 backdrop-blur-sm text-center flex-1">
                            <div className="text-2xl font-black">{selectedRecord.absentCount}</div>
                            <div className="text-[9px] uppercase font-bold opacity-80">Tidak Hadir</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Senarai Tidak Hadir</h4>

                    {getAbsentList(selectedRecord).length > 0 ? (
                        <div className="space-y-3">
                            {getAbsentList(selectedRecord).map((student, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-3 shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                                        <p className="text-xs text-gray-400">{student.className}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-2">🎉</div>
                            <p className="text-gray-500 font-bold text-sm">Semua Murid Hadir!</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-gray-200 text-right">
                    <Button onClick={() => setSelectedRecord(null)}>Tutup</Button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {
            setRecordToDelete(null);
            setDeletePassword('');
            setDeleteError('');
          }}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-scaleUp shadow-2xl z-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🗑️
              </div>
              <h3 className="text-xl font-bold text-gray-900">Padam Rekod Kehadiran?</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-bold text-red-600">{recordToDelete.week}</span> - {new Date(recordToDelete.date).toLocaleDateString('ms-MY')}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Tindakan ini tidak boleh dikembalikan. Sila masukkan kata laluan unit untuk pengesahan.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleDeleteConfirm(); }} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider text-center">Kata Laluan Unit</p>
                <Input
                  type="password"
                  placeholder="Masukkan Kata Laluan"
                  value={deletePassword}
                  onChange={e => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="text-center font-bold tracking-widest text-lg"
                  autoFocus
                />
                {deleteError && <p className="text-xs text-red-600 font-bold text-center mt-2 animate-pulse">{deleteError}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setRecordToDelete(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  isLoading={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 shadow-red-200"
                >
                  {isDeleting ? 'Memadam...' : 'Sahkan Padam'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Confirmation Modal */}
      {recordToEdit && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {
            setRecordToEdit(null);
            setEditPassword('');
            setEditError('');
          }}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-scaleUp shadow-2xl z-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✏️
              </div>
              <h3 className="text-xl font-bold text-gray-900">Edit Rekod Kehadiran?</h3>
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-bold text-blue-600">{recordToEdit.week}</span> - {new Date(recordToEdit.date).toLocaleDateString('ms-MY')}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Sila masukkan kata laluan unit untuk membolehkan pengeditan.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleEditConfirm(); }} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider text-center">Kata Laluan Unit</p>
                <Input
                  type="password"
                  placeholder="Masukkan Kata Laluan"
                  value={editPassword}
                  onChange={e => {
                    setEditPassword(e.target.value);
                    setEditError('');
                  }}
                  className="text-center font-bold tracking-widest text-lg"
                  autoFocus
                />
                {editError && <p className="text-xs text-red-600 font-bold text-center mt-2 animate-pulse">{editError}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setRecordToEdit(null);
                    setEditPassword('');
                    setEditError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                >
                  Teruskan Edit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
