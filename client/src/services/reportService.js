import { apiHelper } from './api';

const reportService = {
  createReport: async (reportData) => apiHelper.post('/reports', reportData),
  getReports: async (params = {}) => apiHelper.get('/reports', params),
  getStats: async () => apiHelper.get('/reports/stats'),
  getReportById: async (id) => apiHelper.get(`/reports/${id}`),
  updateReport: async (id, updates) => apiHelper.put(`/reports/${id}`, updates),
  fixQuestion: async (id, data) => apiHelper.post(`/reports/${id}/fix`, data),
  deleteReport: async (id) => apiHelper.delete(`/reports/${id}`),
  getReportsForQuestion: async (questionId) => apiHelper.get(`/reports/question/${questionId}`),
  bulkUpdateReports: async (ids, updates) => apiHelper.put('/reports/bulk-update', { ids, ...updates }),

  getReportTypeLabel: (type, lang = 'hi') => {
    const labels = {
      wrong_answer: { hi: 'गलत उत्तर', en: 'Wrong Answer' },
      wrong_question: { hi: 'गलत प्रश्न', en: 'Wrong Question Text' },
      wrong_options: { hi: 'गलत विकल्प', en: 'Wrong Options' },
      missing_translation: { hi: 'अनुवाद गायब', en: 'Missing Translation' },
      explanation_error: { hi: 'व्याख्या में त्रुटि', en: 'Explanation Error' },
      typo: { hi: 'टाइपो/वर्तनी', en: 'Typo/Spelling' },
      image_issue: { hi: 'चित्र समस्या', en: 'Image Issue' },
      duplicate_question: { hi: 'डुप्लीकेट प्रश्न', en: 'Duplicate Question' },
      formatting: { hi: 'फॉर्मेटिंग', en: 'Formatting Issue' },
      other: { hi: 'अन्य', en: 'Other' }
    };
    return labels[type]?.[lang] || type;
  },

  getStatusLabel: (status, lang = 'hi') => {
    const labels = {
      pending: { hi: 'लंबित', en: 'Pending' },
      reviewing: { hi: 'समीक्षा', en: 'Reviewing' },
      in_progress: { hi: 'प्रगति में', en: 'In Progress' },
      fixed: { hi: 'ठीक किया', en: 'Fixed' },
      rejected: { hi: 'अस्वीकृत', en: 'Rejected' },
      duplicate: { hi: 'डुप्लीकेट', en: 'Duplicate' }
    };
    return labels[status]?.[lang] || status;
  },

  getPriorityColor: (priority) => {
    const map = {
      low: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
      medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
      critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' }
    };
    return map[priority] || map.medium;
  },

  getStatusColor: (status) => {
    const map = {
      pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
      reviewing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
      in_progress: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
      fixed: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
      duplicate: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' }
    };
    return map[status] || map.pending;
  },

  compressImage: (file, maxWidth = 2048, quality = 0.95) => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) { reject(new Error('File too large (max 10MB)')); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const isPNG = file.type === 'image/png';
          const mimeType = isPNG ? 'image/png' : 'image/jpeg';
          const base64 = canvas.toDataURL(mimeType, isPNG ? undefined : quality);
          resolve({ data: base64, mimeType, fileName: file.name, size: Math.round(base64.length * 0.75), width, height });
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }
};

export default reportService;