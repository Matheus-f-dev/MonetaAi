import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../shared/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useSystemSimple = (userId) => {
  const [userSalary, setUserSalary] = useState(0);
  const [chartFilter, setChartFilter] = useState('month');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/user/${userId}`, { headers: getAuthHeaders() });
        
        if (!response.ok) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setUserSalary(user.salario || 0);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUserSalary(data.user.salario || 0);
        } else {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setUserSalary(user.salario || 0);
        }
      } catch (error) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserSalary(user.salario || 0);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return {
    userSalary,
    chartFilter,
    setChartFilter
  };
};