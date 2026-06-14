import { api } from './client';

export type ReportType = 'maintenance' | 'revenue';
export type ReportFormat = 'pdf' | 'csv';

export const reportsApi = {
  download: async (vehicleId: string, type: ReportType, format: ReportFormat) => {
    const res = await api.get(`/vehicles/${vehicleId}/reports/${type}`, {
      params: { format },
      responseType: 'blob',
    });
    const cd = (res.headers['content-disposition'] as string) || '';
    const match = /filename="?([^"]+)"?/.exec(cd);
    const filename = match?.[1] || `autotrackr-${type}.${format}`;

    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
