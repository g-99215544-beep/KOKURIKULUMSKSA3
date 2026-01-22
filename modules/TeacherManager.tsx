
import React, { useState } from 'react';
import { Unit, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { gasService } from '../services/gasService';

interface TeacherManagerProps {
  unit: Unit;
  userRole: UserRole;
  onBack: () => void;
  isAuthenticated: boolean;
}

export const TeacherManager: React.FC<TeacherManagerProps> = ({ unit, userRole, onBack, isAuthenticated }) => {
  const [teachers, setTeachers] = useState<string[]>(unit.teachers || []);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = userRole === UserRole.UNIT_ADMIN || userRole === UserRole.SUPER_ADMIN || isAuthenticated;

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacherName.trim()) {
      setTeachers([...teachers, newTeacherName.trim()]);
      setNewTeacherName('');
    }
  };

  const handleRemoveTeacher = (index: number) => {
    if (confirm("Adakah anda pasti ingin membuang nama guru ini?")) {
      const updated = [...teachers];
      updated.splice(index, 1);
      setTeachers(updated);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await gasService.updateUnitTeachers(unit.id, teachers);
      unit.teachers = teachers; // Update local reference
      setIsEditing(false);
      alert("Senarai guru berjaya dikemaskini.");
    } catch (error) {
      alert("Gagal mengemaskini. Sila cuba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTeachers(unit.teachers || []);
    setIsEditing(false);
  };

  return (
    <div className="animate-fadeIn pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Button>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Senarai Guru Penasihat</h2>
                <p className="text-sm text-red-600 font-semibold">{unit.name}</p>
            </div>
        </div>
        
        {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)} className="shadow-red-200">
                ✏️ Kemaskini
            </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-50 overflow-hidden">
        {/* List Header */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
            <span className="font-bold text-red-800">Nama Guru</span>
            <span className="text-xs font-semibold bg-white text-red-600 px-2 py-1 rounded border border-red-100">
                {teachers.length} Orang
            </span>
        </div>

        {/* Teacher List */}
        <div className="divide-y divide-gray-100">
            {teachers.map((teacher, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                            {index + 1}
                        </div>
                        <span className="font-medium text-gray-700">{teacher}</span>
                    </div>
                    
                    {isEditing && (
                        <button 
                            onClick={() => handleRemoveTeacher(index)}
                            className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all"
                            title="Padam"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            ))}

            {teachers.length === 0 && (
                <div className="p-8 text-center text-gray-400 italic">
                    Tiada guru disenaraikan.
                </div>
            )}
        </div>

        {/* Edit Controls */}
        {isEditing && (
            <div className="bg-gray-50 p-6 border-t border-gray-200 space-y-4 animate-fadeIn">
                <h3 className="font-bold text-gray-700 text-sm">Tambah Guru Baru</h3>
                <form onSubmit={handleAddTeacher} className="flex gap-2">
                    <Input 
                        placeholder="Nama Penuh Guru" 
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        className="bg-white"
                    />
                    <Button type="submit" disabled={!newTeacherName.trim()} variant="secondary">
                        Tambah
                    </Button>
                </form>

                <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                    <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
                        Simpan Perubahan
                    </Button>
                    <Button onClick={handleCancel} variant="danger" disabled={isSaving} className="flex-1">
                        Batal
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
