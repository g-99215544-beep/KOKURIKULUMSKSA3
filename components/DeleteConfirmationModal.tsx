
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onClose();
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
                Tindakan ini tidak boleh dikembalikan.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
