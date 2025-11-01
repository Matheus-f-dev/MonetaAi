import { useState, useEffect } from 'react';
import { useToast } from './useToast';

export const useAlertNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const { addToast } = useToast();

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:3000/api/notifications/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        const newNotifications = data.notifications.filter(n => !n.lido);
        
        // Mostrar toast para notificações não lidas
        newNotifications.forEach(notification => {
          addToast(
            `🚨 ${notification.nomeAlerta}: ${notification.categoria} ultrapassou R$ ${notification.limite}. Total: R$ ${notification.totalGasto.toFixed(2)}`,
            'warning'
          );
        });
        
        setNotifications(data.notifications);
      }
    } catch (error) {
      // Erro silencioso
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  return {
    notifications,
    fetchNotifications
  };
};