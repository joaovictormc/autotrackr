import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

// Marcador de seleção (pin padrão do Leaflet via CDN — evita problema de assets no Vite)
const SelectedIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Marcador de posto OSM
const StationIcon = L.divIcon({
  html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">⛽</div>',
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface OverpassNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface StationMapPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, name: string) => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

const DEFAULT_CENTER: L.LatLngExpression = [-15.8, -47.9];
const DEFAULT_ZOOM = 4;
const DETAIL_ZOOM = 16;

export default function StationMapPicker({
  open,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
}: StationMapPickerProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const mapDivRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);          // pin de seleção manual
  const stationsLayerRef = useRef<L.LayerGroup | null>(null); // camada de postos OSM
  const moveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reverse geocode ──────────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': i18n.language } }
      );
      const data = await res.json();
      const name: string =
        data.namedetails?.name ??
        data.address?.amenity ??
        data.address?.road ??
        data.display_name ??
        `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setResolvedName(name);
    } catch {
      setResolvedName(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setResolving(false);
    }
  }, [i18n.language]);

  // ── Consulta Overpass: postos próximos ───────────────────────────────────────
  const queryNearbyStationsRef = useRef<((map: L.Map) => void) | null>(null);
  queryNearbyStationsRef.current = (map: L.Map) => {
    const { lat, lng } = map.getCenter();

    // Só busca quando o zoom for suficiente para mostrar postos com sentido
    if (map.getZoom() < 12) return;

    setLoadingStations(true);
    const query = `[out:json][timeout:10];node[amenity=fuel](around:2000,${lat},${lng});out body;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data: { elements: OverpassNode[] }) => {
        if (!leafletRef.current) return;

        if (!stationsLayerRef.current) {
          stationsLayerRef.current = L.layerGroup().addTo(leafletRef.current);
        } else {
          stationsLayerRef.current.clearLayers();
        }

        for (const node of data.elements) {
          const name =
            node.tags?.name ??
            node.tags?.brand ??
            node.tags?.operator ??
            t('fuel.station');

          const stationMarker = L.marker([node.lat, node.lon], { icon: StationIcon })
            .bindTooltip(name, { direction: 'top', offset: [0, -5] });

          stationMarker.on('click', () => {
            // Clique em posto OSM: usa nome da base sem fazer reverse geocode
            const pos: [number, number] = [node.lat, node.lon];
            setMarkerPos(pos);
            setResolvedName(name);
            if (markerRef.current) {
              markerRef.current.setLatLng(pos);
            } else if (leafletRef.current) {
              markerRef.current = L.marker(pos, { icon: SelectedIcon }).addTo(leafletRef.current);
            }
          });

          stationsLayerRef.current.addLayer(stationMarker);
        }
      })
      .catch(() => { /* falha silenciosa — usuário ainda pode clicar manualmente */ })
      .finally(() => setLoadingStations(false));
  };

  // ── Handler de clique no mapa (área sem posto) ───────────────────────────────
  const clickHandlerRef = useRef<(lat: number, lng: number) => void>(() => {});
  clickHandlerRef.current = (lat: number, lng: number) => {
    const pos: [number, number] = [lat, lng];
    setMarkerPos(pos);
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    } else if (leafletRef.current) {
      markerRef.current = L.marker(pos, { icon: SelectedIcon }).addTo(leafletRef.current);
    }
    reverseGeocode(lat, lng);
  };

  // ── Inicializa mapa ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (!mapDivRef.current || leafletRef.current) return;

      const hasInitial = initialLat != null && initialLng != null;
      const center: L.LatLngExpression = hasInitial
        ? [initialLat as number, initialLng as number]
        : DEFAULT_CENTER;
      const zoom = hasInitial ? DETAIL_ZOOM : DEFAULT_ZOOM;

      const map = L.map(mapDivRef.current, { center, zoom });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (hasInitial) {
        const pos: [number, number] = [initialLat as number, initialLng as number];
        markerRef.current = L.marker(pos, { icon: SelectedIcon }).addTo(map);
        setMarkerPos(pos);
        reverseGeocode(initialLat as number, initialLng as number);
        queryNearbyStationsRef.current?.(map);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!leafletRef.current) return;
            leafletRef.current.flyTo(
              [pos.coords.latitude, pos.coords.longitude],
              DETAIL_ZOOM,
              { duration: 1 }
            );
            // Após o voo terminar, busca postos na nova área
            leafletRef.current.once('moveend', () => {
              queryNearbyStationsRef.current?.(leafletRef.current!);
            });
          },
          () => { /* permissão negada — mantém Brasil */ },
          { timeout: 5000, maximumAge: 60000 }
        );
      }

      // Re-consulta postos quando o usuário para de mover o mapa
      map.on('moveend', () => {
        if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
        moveDebounceRef.current = setTimeout(() => {
          queryNearbyStationsRef.current?.(map);
        }, 800);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        clickHandlerRef.current(e.latlng.lat, e.latlng.lng);
      });

      leafletRef.current = map;
    }, 150);

    return () => {
      clearTimeout(timer);
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
      markerRef.current = null;
      stationsLayerRef.current = null;
    };
  }, [open]);

  // ── Reseta ao fechar ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setMarkerPos(null);
      setResolvedName('');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open]);

  // ── Busca por nome (Nominatim) ────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`,
          { headers: { 'Accept-Language': i18n.language } }
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 600);
  };

  const handleSearchSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const pos: [number, number] = [lat, lng];

    setMarkerPos(pos);
    setResolvedName(result.display_name);
    setSearchQuery('');
    setSearchResults([]);

    if (leafletRef.current) {
      leafletRef.current.flyTo(pos, DETAIL_ZOOM, { duration: 0.8 });
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        markerRef.current = L.marker(pos, { icon: SelectedIcon }).addTo(leafletRef.current);
      }
    }
  };

  const handleConfirm = () => {
    if (!markerPos) return;
    onConfirm(markerPos[0], markerPos[1], resolvedName);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen={fullScreen}>
      <DialogTitle>{t('fuel.mapTitle')}</DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Barra de busca */}
        <Box sx={{ px: 2, pt: 2, pb: 1, position: 'relative', zIndex: 1001 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('fuel.mapSearch')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searching ? <CircularProgress size={16} /> : <Search size={16} />}
                </InputAdornment>
              ),
            }}
          />
          {searchResults.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                left: 16,
                right: 16,
                top: 'calc(100% - 8px)',
                zIndex: 1002,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <List dense disablePadding>
                {searchResults.map((r) => (
                  <ListItem key={r.place_id} disablePadding>
                    <ListItemButton onClick={() => handleSearchSelect(r)}>
                      <ListItemText
                        primary={r.display_name}
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        <Box sx={{ px: 2, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('fuel.mapHint')}
          </Typography>
          {loadingStations && (
            <Tooltip title={t('fuel.mapLoadingStations')}>
              <CircularProgress size={12} />
            </Tooltip>
          )}
        </Box>

        {/* Container do mapa Leaflet */}
        <Box
          ref={mapDivRef}
          sx={{
            flex: 1,
            height: fullScreen ? 'calc(100vh - 280px)' : 420,
            minHeight: 300,
            cursor: 'crosshair',
          }}
        />

        {/* Localização selecionada */}
        <Box sx={{ px: 2, py: 1, minHeight: 38 }}>
          {resolving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="body2" color="text.secondary">{t('fuel.locating')}</Typography>
            </Box>
          ) : resolvedName ? (
            <Typography variant="body2">
              <strong>{t('fuel.mapSelected')}:</strong> {resolvedName}
            </Typography>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!markerPos || resolving}>
          {t('fuel.mapConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
