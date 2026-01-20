
import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { STUDENT_DATABASE } from '../data/studentData';
import { firebaseService, AttendanceRecord } from '../services/firebaseService';
import { gasService } from '../services/gasService';

interface AttendanceFormProps {
  unit: Unit;
  year: number;
  onBack: () => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ unit, year, onBack }) => {
  const [week, setWeek] = useState('Minggu 1');
  const [date, setDate] = useState('');
  const [day, setDay] = useState('');
  
  // checkedStudents = Pelajar yang TIDAK HADIR
  const [checkedStudents, setCheckedStudents] = useState<Record<string, Set<string>>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('SIMPAN');
  const [unitStudents, setUnitStudents] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Cari data pelajar berdasarkan nama unit atau alias
    const dbName = Object.keys(STUDENT_DATABASE).find(key => 
      key.toLowerCase() === unit.name.toLowerCase() || 
      unit.aliases?.some(alias => key.toLowerCase().includes(alias.toLowerCase()))
    );

    if (dbName) {
      setUnitStudents(STUDENT_DATABASE[dbName]);
      const initialChecked: Record<string, Set<string>> = {};
      Object.keys(STUDENT_DATABASE[dbName]).forEach(className => {
        initialChecked[className] = new Set();
      });
      setCheckedStudents(initialChecked);
    }

    // Set tarikh hari ini secara automatik
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const days = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    setDate(dateStr);
    setDay(days[today.getDay()]);
  }, [unit]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    const d = new Date(dateVal);
    const days = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    setDate(dateVal);
    setDay(days[d.getDay()] || '');
  };

  const toggleStudent = (className: string, studentName: string) => {
    setCheckedStudents(prev => {
      const classSet = new Set(prev[className]);
      if (classSet.has(studentName)) {
        classSet.delete(studentName); 
      } else {
        classSet.add(studentName); 
      }
      return { ...prev, [className]: classSet };
    });
  };

  const toggleClass = (className: string, allAbsent: boolean) => {
     setCheckedStudents(prev => {
         const classSet = new Set(prev[className]);
         const students = unitStudents[className];
         if (allAbsent) {
             classSet.clear(); 
         } else {
             students.forEach(s => classSet.add(s)); 
         }
         return { ...prev, [className]: classSet };
     });
  };

  const getTotalStudents = () => {
    let count = 0;
    Object.keys(unitStudents).forEach(key => count += unitStudents[key].length);
    return count;
  };

  const getAbsentCount = () => {
    let count = 0;
    Object.keys(checkedStudents).forEach(key => count += checkedStudents[key].size);
    return count;
  };

  const getPresentCount = () => getTotalStudents() - getAbsentCount();

  // FUNGSI PENTING: Susun CSV ikut Kelas (Header Kelas)
  const generateFormattedCSV = (classesData: any[]) => {
    // Info Utama
    let csvContent = `REKOD KEHADIRAN: ${unit.name.toUpperCase()}\n`;
    csvContent += `MINGGU: ${week}, TARIKH: ${date} (${day})\n`;
    csvContent += `KEHADIRAN: ${getPresentCount()} / ${getTotalStudents()}\n\n`;
    
    // Header Column
    csvContent += "BIL,NAMA MURID,STATUS,CATATAN\n";

    classesData.forEach((cls) => {
      // Jarak sebelum kelas baru
      csvContent += "\n";
      
      // HEADER KELAS (Dalam column B supaya jelas kelihatan sebagai tajuk)
      csvContent += `,${cls.className.toUpperCase()},,\n`; 

      cls.students.forEach((std: any, index: number) => {
        // Handle koma dalam nama
        const safeName = std.name.includes(',') ? `"${std.name}"` : std.name;
        // Status H/TH
        const statusSymbol = std.status === 'HADIR' ? 'H' : 'TH';
        
        csvContent += `${index + 1},${safeName},${statusSymbol},\n`;
      });
    });

    return csvContent;
  };

  const handleSubmit = async () => {
    if (!date) { alert("Sila pilih tarikh."); return; }

    const presentCount = getPresentCount();
    const totalStudents = getTotalStudents();

    if (confirm(`Sahkan kehadiran?\nHadir: ${presentCount} / ${totalStudents}`)) {
        setIsSubmitting(true);
        setStatusText('Menyimpan DB...');
        
        const classesData = Object.keys(unitStudents).map(className => ({
            className,
            students: unitStudents[className].map(student => ({
                name: student,
                status: checkedStudents[className].has(student) ? 'TIDAK HADIR' : 'HADIR' as 'HADIR' | 'TIDAK HADIR'
            }))
        }));

        const record: AttendanceRecord = {
            unitId: unit.id,
            unitName: unit.name,
            week,
            date,
            totalStudents,
            presentCount,
            absentCount: getAbsentCount(),
            percentage: totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) + '%' : '0%',
            classes: classesData
        };

        try {
            // 1. Simpan ke Firebase (Region Asia)
            await firebaseService.submitAttendance(record);
            
            // 2. Jana Excel/CSV ke Google Drive
            setStatusText('Menjana Excel...');
            const csvContent = generateFormattedCSV(classesData);
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const fileName = `Kehadiran_${unit.name}_${week}_${date}.csv`;
            const file = new File([csvBlob], fileName, { type: 'text/csv' });

            await gasService.uploadFile(file, `Kehadiran ${week} (${date})`, unit.name, year, 'KEHADIRAN');

            alert("✅ Data berjaya disimpan & dimuat naik ke Drive!");
            onBack();
        } catch (e) {
            alert("❌ Gagal menyimpan. Sila semak sambungan internet.");
            console.error(e);
        } finally {
            setIsSubmitting(false);
            setStatusText('SIMPAN');
        }
    }
  };

  return (
    <div className="animate-fadeIn pb-24">
       <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-2">← Kembali</Button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Borang Kehadiran</h2>
          <p className="text-xs font-bold text-red-600 uppercase">{unit.name} • {year}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 sticky top-20 z-30">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Minggu</label>
                <select value={week} onChange={e => setWeek(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold outline-none focus:border-red-500 transition-colors">
                    {[...Array(20)].map((_, i) => <option key={i} value={`Minggu ${i+1}`}>Minggu {i+1}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tarikh</label>
                <Input type="date" value={date} onChange={handleDateChange} className="font-bold" />
                {day && <p className="text-xs text-red-600 font-bold mt-1 text-right">{day}</p>}
            </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Hadir</p>
                <h3 className="text-2xl font-black text-gray-800">{getPresentCount()} <span className="text-sm text-gray-400">/ {getTotalStudents()}</span></h3>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase">Tidak Hadir</p>
                <h3 className={`text-2xl font-black ${getAbsentCount() > 0 ? 'text-red-600' : 'text-green-500'}`}>{getAbsentCount()}</h3>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(unitStudents).length === 0 ? (
             <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Tiada data murid untuk unit ini.</p>
             </div>
        ) : (
            Object.keys(unitStudents).map((className) => {
                const students = unitStudents[className];
                const absentCount = checkedStudents[className]?.size || 0;
                const isAllAbsent = absentCount === students.length && students.length > 0;

                return (
                    <div key={className} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* CLASS HEADER - Design seperti dalam Screenshot */}
                        <div 
                            className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                                className.includes('BESTARI') ? 'bg-cyan-50 border-l-4 border-cyan-400' : 
                                className.includes('CEMERLANG') ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                                'bg-gray-50 border-l-4 border-gray-400'
                            }`} 
                            onClick={() => toggleClass(className, isAllAbsent)}
                        >
                            <h4 className="font-black text-gray-800 text-sm uppercase tracking-wide">{className}</h4>
                            <div className="text-[10px] font-bold text-gray-500 uppercase">
                                {isAllAbsent ? 'NYAH-TANDA SEMUA' : 'TANDA SEMUA TIDAK HADIR'}
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {students.map((student, idx) => {
                                const isAbsent = checkedStudents[className]?.has(student);
                                return (
                                    <label key={idx} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isAbsent ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                        <div className={`w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-all ${isAbsent ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 bg-white'}`}>
                                            {isAbsent && <span className="text-xs font-bold">✕</span>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isAbsent} onChange={() => toggleStudent(className, student)} />
                                        <div className="flex-1">
                                             <span className={`text-xs font-bold uppercase ${isAbsent ? 'text-red-700' : 'text-gray-700'}`}>{student}</span>
                                        </div>
                                        <div className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${isAbsent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {isAbsent ? 'TIDAK HADIR' : 'HADIR'}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-center z-40">
        <div className="w-full max-w-5xl flex gap-3">
             <Button variant="secondary" className="flex-1" onClick={onBack} disabled={isSubmitting}>Batal</Button>
             <Button className="flex-[2] bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" onClick={handleSubmit} isLoading={isSubmitting}>
                {isSubmitting ? statusText : `SIMPAN REKOD`}
             </Button>
        </div>
      </div>
    </div>
  );
};
