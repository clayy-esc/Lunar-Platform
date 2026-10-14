import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requiredTypedConfirmation?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  requiredTypedConfirmation,
  isLoading = false,
}) => {
  const [typed, setTyped] = useState('');
  const canConfirm = requiredTypedConfirmation ? typed === requiredTypedConfirmation : true;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-4">
          {isDestructive && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div className="space-y-3 flex-1">
            <p className="text-sm text-muted-foreground">{description}</p>
            
            {requiredTypedConfirmation && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  To confirm, type <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground font-bold">{requiredTypedConfirmation}</span> below:
                </p>
                <Input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={requiredTypedConfirmation}
                  className="font-mono"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? 'danger' : 'primary'} 
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
