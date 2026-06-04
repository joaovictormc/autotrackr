import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { maintenanceApi, MaintenanceRecord } from '../api/maintenance.api';

interface Alert {
  id: string;
  vehicleLabel: string;
  typeName: string;
  reason: 'date' | 'km';
}

function notificationsEnabled(): boolean {
  return (localStorage.getItem('notificationsEnabled') ?? 'true') === 'true';
}

export default function NotificationsBell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [enabled, setEnabled] = useState(notificationsEnabled());

  const computeAlerts = useCallback(async () => {
    try {
      const vehicles: Vehicle[] = await vehiclesApi.getMyVehicles();
      if (vehicles.length === 0) {
        setAlerts([]);
        return;
      }
      const recordsByVehicle = await Promise.all(
        vehicles.map((v) => maintenanceApi.getRecords(v.id).catch(() => [] as MaintenanceRecord[]))
      );

      const today = new Date().toISOString().split('T')[0];
      const result: Alert[] = [];

      vehicles.forEach((vehicle, i) => {
        const label = `${vehicle.brand?.name ?? ''} ${vehicle.model?.name ?? ''} · ${vehicle.plate}`.trim();
        recordsByVehicle[i].forEach((r) => {
          if (r.isCompleted) return;
          const dateAlert = r.reminderDate && r.reminderDate.slice(0, 10) <= today;
          const kmAlert = r.reminderMileage != null && vehicle.mileage >= r.reminderMileage;
          if (dateAlert || kmAlert) {
            result.push({
              id: r.id,
              vehicleLabel: label,
              typeName: r.maintenanceType?.name ?? 'Manutenção',
              reason: dateAlert ? 'Vencida por data' : 'Vencida por quilometragem',
            });
          }
        });
      });

      setAlerts(result);
    } catch {
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    computeAlerts();
    const onPrefChange = () => setEnabled(notificationsEnabled());
    window.addEventListener('preferences:changed', onPrefChange);
    return () => window.removeEventListener('preferences:changed', onPrefChange);
  }, [computeAlerts]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    computeAlerts();
  };

  const goToMaintenance = () => {
    setAnchorEl(null);
    navigate('/maintenance');
  };

  if (!enabled) {
    return (
      <IconButton size="large" disabled>
        <Bell size={22} />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton size="large" onClick={handleOpen}>
        <Badge badgeContent={alerts.length} color="error" max={99}>
          <Bell size={22} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 340, maxWidth: '90vw', maxHeight: 420, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notificações
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {alerts.length === 0
              ? 'Nenhuma manutenção vencida'
              : `${alerts.length} manutenção${alerts.length !== 1 ? 'ões' : ''} vencida${alerts.length !== 1 ? 's' : ''}`}
          </Typography>
        </Box>
        <Divider />

        {alerts.length === 0 ? (
          <MenuItem disabled sx={{ py: 2, justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Tudo em dia! 🎉
            </Typography>
          </MenuItem>
        ) : (
          alerts.slice(0, 20).map((a) => (
            <MenuItem key={a.id} onClick={goToMaintenance} sx={{ py: 1.2, whiteSpace: 'normal' }}>
              <ListItemText
                primary={`${a.typeName} — ${a.reason}`}
                secondary={a.vehicleLabel}
                primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: 12 }}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
