import { useState } from 'react';
import { useTransactionData } from './useTransactionData';

export const useFilters = (userId) => {
  const [activeFilters, setActiveFilters] = useState({});
  const { fetchTransactions, fetchChartData } = useTransactionData(userId);

  const applyFilters = async (filters) => {
    setActiveFilters(filters);
    await fetchTransactions(filters);
  };

  const applyDateFilter = async (filter) => {
    const newFilters = { ...activeFilters, filter };
    await applyFilters(newFilters);
  };

  const applyDateRangeFilter = async (startDate, endDate) => {
    const newFilters = { ...activeFilters, startDate, endDate };
    await applyFilters(newFilters);
  };

  const applyCategoryFilter = async (category) => {
    const newFilters = { ...activeFilters, category };
    await applyFilters(newFilters);
  };

  const applyTypeFilter = async (type) => {
    const newFilters = { ...activeFilters, type };
    await applyFilters(newFilters);
  };

  const clearFilters = async () => {
    setActiveFilters({});
    await fetchTransactions({});
  };

  const getChartData = async (filter) => {
    return await fetchChartData(filter);
  };

  return {
    activeFilters,
    applyFilters,
    applyDateFilter,
    applyDateRangeFilter,
    applyCategoryFilter,
    applyTypeFilter,
    clearFilters,
    getChartData
  };
};