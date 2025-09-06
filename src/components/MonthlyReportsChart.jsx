import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const MonthlyReportsChart = ({ data }) => {
  const chartData = data.map((rep) => ({
    mes: rep.mes,
    Ventas: rep.ventas,
    Costos: rep.costos,
    Ganancia: rep.ganancia,
    Gastos: rep.gastos,
    Balance: rep.balance,
  }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Ventas" fill="#4ade80" />
          <Bar dataKey="Costos" fill="#f87171" />
          <Bar dataKey="Ganancia" fill="#60a5fa" />
          <Bar dataKey="Gastos" fill="#facc15" />
          <Bar dataKey="Balance" fill="#a78bfa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyReportsChart;
