import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Survey } from '../types';

export const exportToExcel = (
  surveys: Survey[],
  selectedSurveyId: string,
  responses: any[],
  rawResponses: any[][],
  questions: any[]
) => {
  if (responses.length === 0) return;

  try {
    const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
    let exportData: any[] = [];
    
    if (rawResponses && rawResponses.length > 0) {
      exportData = rawResponses;
    } else {
      const headers = [
        'ResponseID',
        'Timestamp',
        'Name',
        'Email',
        'Phone',
        'Org',
        'TotalScore',
        'Interpretation',
        'GroupScores',
        ...questions.map(q => q.Code || q.NoiDung)
      ];

      const rows = responses.map(resp => [
        resp.ID,
        new Date(resp.NgayTao).toLocaleString('vi-VN'),
        resp.HoTen,
        resp.Email,
        resp.SoDienThoai,
        resp.ToChuc || '',
        resp.TongDiem,
        resp.PhanLoai,
        typeof resp.DiemThanhPhan === 'object' ? JSON.stringify(resp.DiemThanhPhan) : (resp.DiemThanhPhan || ''),
        ...questions.map(q => resp.answers[q.ID] || '')
      ]);
      exportData = [headers, ...rows];
    }

    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    const sheetName = selectedSurvey?.name ? selectedSurvey.name.substring(0, 31).replace(/[\[\]*?:\/\\]/g, '') : 'KetQua_TongHop';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'KetQua_TongHop');
    
    XLSX.writeFile(workbook, `Ket_qua_${selectedSurvey?.name || 'Khao_sat'}_${new Date().getTime()}.xlsx`);
  } catch (err) {
    console.error(err);
    alert('Lỗi khi xuất file Excel');
  }
};

export const exportToPDF = (
  surveys: Survey[],
  selectedSurveyId: string,
  responses: any[]
) => {
  if (responses.length === 0) return;

  try {
    const doc = new jsPDF('l', 'mm', 'a4') as any;
    const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

    doc.text(`BÁO CÁO KẾT QUẢ KHẢO SÁT: ${selectedSurvey?.name || ''}`, 15, 15);
    doc.setFontSize(10);
    doc.text(`Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`, 15, 22);

    const headers = [['ID', 'Ngày nộp', 'Họ tên', 'Điểm', 'Phân loại']];
    const data = responses.map(r => [
      r.ID,
      new Date(r.NgayTao).toLocaleDateString('vi-VN'),
      r.HoTen,
      r.TongDiem,
      r.PhanLoai
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: '#3b82f6', textColor: 255 },
      styles: { fontSize: 8, font: 'helvetica' }
    });

    doc.save(`Bao_cao_${selectedSurvey?.name || 'Khao_sat'}_${new Date().getTime()}.pdf`);
  } catch (err: any) {
    console.error(err);
    alert('Lỗi khi xuất file PDF: ' + (err?.message || err));
  }
};
