import { useState, useEffect } from 'react';

let toasts = [];
let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]));
};

export const useToast = () => {
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type };
    
    toasts = [...toasts, newToast];
    notifyListeners();
    
    setTimeout(() => {
      toasts = toasts.filter(toast => toast.id !== id);
      notifyListeners();
    }, 5000);
  };

  return { addToast };
};

export const useToastList = () => {
  const [toastList, setToastList] = useState(toasts);
  
  useEffect(() => {
    listeners.push(setToastList);
    
    return () => {
      listeners = listeners.filter(listener => listener !== setToastList);
    };
  }, []);
  
  return toastList;
};