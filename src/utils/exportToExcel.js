import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'ReporteMensual') => {
  const worksheetData = data.map((rep) => ({
    Mes: rep.mes,
    Ventas: rep.ventas,
    Costos: rep.costos,
    Ganancia: rep.ganancia,
    Gastos: rep.gastos,
    Balance: rep.balance,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
