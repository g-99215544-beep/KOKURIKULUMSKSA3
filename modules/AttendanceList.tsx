
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { Button } from '../components/ui/Button';
import { firebaseService, AttendanceRecord } from '../services/firebaseService';

interface AttendanceListProps {
  unit: Unit;
  year: number;
  onBack: () => void;
  onCreateNew: () => void;
}

export const AttendanceList: React.FC<AttendanceListProps> = ({ unit, year, onBack, onCreateNew }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const data = await firebaseService.getAttendanceByUnit(unit.name);
        // Optional: Filter by year if necessary, but records usually have dates
        // assuming we want all records for this unit.
        const filteredByYear = data.filter(r => r.date.startsWith(year.toString())); 
        setRecords(filteredByYear);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

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
               onClick={() => setSelectedRecord(record)}
               className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all cursor-pointer active:scale-95 group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                </div>

                <div className="flex justify-between items-start relative z-10">
                   <div>
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
                   <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 relative z-10">
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
    </div>
  );
};
