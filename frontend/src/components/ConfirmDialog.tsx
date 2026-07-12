import { type ReactNode } from 'react';
import Modal from './Modal';
import { Button } from './ui';

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant} disabled={loading} onClick={onConfirm}>
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div>
    </Modal>
  );
}
