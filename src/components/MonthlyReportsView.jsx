import React from 'react';
import MonthlyReportForm from './MonthlyReportForm';
import MonthlyReportsTable from './MonthlyReportsTable';
import { useMonthlyReports } from '../hooks/useMonthlyReports';

const MonthlyReportsView = () => {
  const { refetch } = useMonthlyReports();

  return (
    <div className="p-6 space-y-6">
      <MonthlyReportForm onSaved={refetch} />
      <MonthlyReportsTable />
    </div>
  );
};

export default MonthlyReportsView;
