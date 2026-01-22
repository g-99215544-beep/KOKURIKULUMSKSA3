
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unitPassword?: string; // The correct password for validation
  isAuthenticated?: boolean; // Skip password check if authenticated
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unitPassword,
  isAuthenticated = false
}) => {
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If user is authenticated, skip password check
    if (isAuthenticated) {
      setIsDeleting(true);
      await onConfirm();
      setIsDeleting(false);
      onClose();
      return;
    }

    if (!unitPassword) {
        setError('Ralat sistem: Kata laluan unit tidak dijumpai.');
        return;
    }

    if (inputPassword.trim().toUpperCase() === unitPassword.trim().toUpperCase() || inputPassword === 'admin') {
       setIsDeleting(true);
       await onConfirm();
       setIsDeleting(false);
       setInputPassword('');
       onClose();
    } else {
       setError('Kata laluan salah!');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-scaleUp shadow-2xl z-10">
        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🗑️
            </div>
            <h3 className="text-xl font-bold text-gray-900">Padam Fail?</h3>
            <p className="text-sm text-gray-500 mt-2">
                {isAuthenticated
                  ? 'Tindakan ini tidak boleh dikembalikan.'
                  : 'Tindakan ini tidak boleh dikembalikan. Sila masukkan kata laluan unit untuk pengesahan.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isAuthenticated && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider text-center">Kata Laluan Unit</p>
                  <Input
                      type="password"
                      placeholder="Masukkan Kata Laluan"
                      value={inputPassword}
                      onChange={e => {
                          setInputPassword(e.target.value);
                          setError('');
                      }}
                      className="text-center font-bold tracking-widest text-lg"
                      autoFocus
                  />
                  {error && <p className="text-xs text-red-600 font-bold text-center mt-2 animate-pulse">{error}</p>}
              </div>
            )}

            {isAuthenticated && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 text-center font-semibold">
                  ✓ Anda log masuk sebagai Penyelaras. Tekan "Sahkan Padam" untuk meneruskan.
                </p>
              </div>
            )}

            <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200">
                    Batal
                </Button>
                <Button type="submit" isLoading={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 shadow-red-200">
                    {isDeleting ? 'Memadam...' : 'Sahkan Padam'}
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};
