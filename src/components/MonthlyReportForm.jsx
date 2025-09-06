import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const MonthlyReportForm = ({ onSaved }) => {
  const [mes, setMes] = useState('');
  const [ventas, setVentas] = useState('');
  const [costos, setCostos] = useState('');
  const [ganancia, setGanancia] = useState('');
  const [gastos, setGastos] = useState('');
  const [balance, setBalance] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (!mes || !ventas || !costos || !ganancia || !gastos || !balance) {
      setMensaje('⚠️ Todos los campos son obligatorios.');
      return;
    }

    const { error } = await supabase
      .from('monthly_reports')
      .insert([{
        mes,
        ventas: parseInt(ventas),
        costos: parseInt(costos),
        ganancia: parseInt(ganancia),
        gastos: parseInt(gastos),
        balance: parseInt(balance)
      }]);

    if (error) {
      console.error('❌ Error al guardar reporte:', error);
      setMensaje('❌ Error al guardar. Revisa la consola.');
    } else {
      setMensaje('✅ Reporte mensual guardado correctamente.');
      setMes('');
      setVentas('');
      setCostos('');
      setGanancia('');
      setGastos('');
      setBalance('');
      if (onSaved) onSaved(); // 🔁 Recarga la tabla
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-lg font-bold mb-2">📅 Registrar Reporte Mensual</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mes</label>
          <input
            type="text"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            placeholder="Ej: 2025-09"
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ventas</label>
          <input
            type="number"
            value={ventas}
            onChange={(e) => setVentas(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Costos</label>
          <input
            type="number"
            value={costos}
            onChange={(e) => setCostos(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ganancia</label>
          <input
            type="number"
            value={ganancia}
            onChange={(e) => setGanancia(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gastos</label>
          <input
            type="number"
            value={gastos}
            onChange={(e) => setGastos(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Balance</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-gray-50 dark:bg-gray-900"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Guardar
      </button>

      {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
    </form>
  );
};

export default MonthlyReportForm;
