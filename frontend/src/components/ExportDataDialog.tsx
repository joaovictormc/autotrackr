import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import { FileJson, FileSpreadsheet } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { maintenanceApi, MaintenanceRecord } from '../api/maintenance.api';

interface ExportDataDialogProps {
  open: boolean;
  onClose: () => void;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ExportDataDialog({ open, onClose }: ExportDataDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<'json' | 'csv' | null>(null);

  const gather = async () => {
    const vehicles: Vehicle[] = await vehiclesApi.getMyVehicles();
    const records = await Promise.all(
      vehicles.map((v) => maintenanceApi.getRecords(v.id).catch(() => [] as MaintenanceRecord[]))
    );
    return { vehicles, records };
  };

  const stamp = () => new Date().toISOString().split('T')[0];

  const handleJson = async () => {
    setLoading('json');
    try {
      const { vehicles, records } = await gather();
      const payload = {
        exportedAt: new Date().toISOString(),
        vehicles: vehicles.map((v, i) => ({
          ...v,
          maintenance: records[i],
        })),
      };
      download(`autotrackr-dados-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json');
      enqueueSnackbar('Dados exportados em JSON.', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Erro ao exportar dados.', { variant: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const handleCsv = async () => {
    setLoading('csv');
    try {
      const { vehicles, records } = await gather();
      const header = ['Veículo', 'Placa', 'Tipo', 'Data', 'Km', 'Custo', 'Local', 'Status'];
      const rows: string[] = [header.join(';')];

      vehicles.forEach((v, i) => {
        const label = `${v.brand?.name ?? ''} ${v.model?.name ?? ''}`.trim();
        records[i].forEach((r) => {
          rows.push([
            csvEscape(label),
            csvEscape(v.plate),
            csvEscape(r.maintenanceType?.name),
            csvEscape(r.date?.slice(0, 10)),
            csvEscape(r.mileage),
            csvEscape(r.cost ?? ''),
            csvEscape(r.location ?? ''),
            csvEscape(r.isCompleted ? 'Concluído' : 'Pendente'),
          ].join(';'));
        });
      });

      // BOM para o Excel reconhecer UTF-8
      download(`autotrackr-manutencoes-${stamp()}.csv`, '﻿' + rows.join('\n'), 'text/csv;charset=utf-8');
      enqueueSnackbar('Manutenções exportadas em CSV.', { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Erro ao exportar dados.', { variant: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('export.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {t('export.description')}
        </DialogContentText>
        <Stack spacing={1.5}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={loading === 'json' ? <CircularProgress size={16} /> : <FileJson size={18} />}
            onClick={handleJson}
            disabled={loading !== null}
          >
            {t('export.json')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={loading === 'csv' ? <CircularProgress size={16} /> : <FileSpreadsheet size={18} />}
            onClick={handleCsv}
            disabled={loading !== null}
          >
            {t('export.csv')}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading !== null}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
