import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface AutoSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (count: number) => void;
  isLoading: boolean;
  maxCount: number;
  error?: string;
}

export function AutoSelectModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  maxCount,
  error,
}: AutoSelectModalProps) {
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0 || num > maxCount) {
      setValidationError(`Enter a number between 1 and ${maxCount}`);
      return;
    }
    setValidationError('');
    onSubmit(num);
  };

  const handleClose = () => {
    setValue('');
    setValidationError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Auto-Select Routes">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select the number of routes to optimize for balanced checkpoint
          distribution.
        </p>
        <Input
          id="auto-select-count"
          label="Number of routes"
          type="number"
          min={1}
          max={maxCount}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setValidationError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          error={validationError || error}
          placeholder={`1 – ${maxCount}`}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            id="btn-auto-select-submit"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Select
          </Button>
        </div>
      </div>
    </Modal>
  );
}
