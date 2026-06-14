// Usa a API legada de expo-file-system (SDK 54) — downloadAsync com headers de auth.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_URL, getAccessToken } from './api';

export type ReportType = 'maintenance' | 'revenue';
export type ReportFormat = 'pdf' | 'csv';

/**
 * Baixa um relatório (Pro) do backend com o token de auth e abre o menu de
 * compartilhamento do sistema para o usuário salvar/enviar o arquivo.
 */
export async function downloadReport(vehicleId: string, type: ReportType, format: ReportFormat) {
  const token = await getAccessToken();
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `autotrackr-${type}-${stamp}.${format}`;
  const fileUri = (FileSystem.cacheDirectory ?? '') + filename;

  const result = await FileSystem.downloadAsync(
    `${API_URL}/vehicles/${vehicleId}/reports/${type}?format=${format}`,
    fileUri,
    { headers: { Authorization: `Bearer ${token}`, 'X-Client': 'mobile' } },
  );

  if (result.status !== 200) {
    throw new Error(`download failed: ${result.status}`);
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
      dialogTitle: filename,
      UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
    });
  }
}
