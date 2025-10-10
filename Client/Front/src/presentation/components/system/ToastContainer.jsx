import React from 'react';
import { Toast } from './Toast';
import { useToastList } from '../../hooks/useToast';

export const ToastContainer = () => {
  const toasts = useToastList();

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
        />
      ))}
    </div>
  );
};