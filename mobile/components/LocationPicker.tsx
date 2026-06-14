import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, {
  Marker,
  MapPressEvent,
  PoiClickEvent,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Check, Fuel, MapPin, Navigation, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';

/** Tipos suportados de POI próximo. */
export type NearbyType = 'gas_station' | 'car_repair';

interface NearbyPlace {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Busca POIs próximos e os marca no mapa (requer Places API habilitada). */
  nearbyType?: NearbyType;
}

const INITIAL_REGION = {
  latitude: -15.78,
  longitude: -47.93,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  type: NearbyType,
): Promise<NearbyPlace[]> {
  if (!MAPS_KEY) return [];
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=3000&type=${type}&key=${MAPS_KEY}`;
    const resp = await fetch(url);
    const data = (await resp.json()) as {
      results?: Array<{
        name: string;
        vicinity: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
    };
    return (data.results ?? []).slice(0, 20).map((p) => ({
      name: p.name,
      address: p.vicinity,
      latitude: p.geometry.location.lat,
      longitude: p.geometry.location.lng,
    }));
  } catch {
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!results.length) return '';
    const r = results[0];
    const parts: string[] = [];
    if (r.name && r.name !== r.street) parts.push(r.name);
    else if (r.street) parts.push(r.street + (r.streetNumber ? `, ${r.streetNumber}` : ''));
    const area = r.district || r.subregion || r.city;
    if (area) parts.push(area);
    return parts.filter(Boolean).join(' — ');
  } catch {
    return '';
  }
}

// Marcador personalizado para postos / oficinas
function PoiMarker({ type }: { type: NearbyType }) {
  const bg = type === 'gas_station' ? '#f59e0b' : '#3b82f6';
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      {type === 'gas_station' ? (
        <Fuel size={16} color="#fff" />
      ) : (
        <Text style={{ fontSize: 14 }}>🔧</Text>
      )}
    </View>
  );
}

export default function LocationPicker({ label, value, onChange, nearbyType }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();

  const [modalOpen, setModalOpen] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const mapRef = useRef<MapView>(null);

  // Auto-localiza e carrega POIs próximos ao abrir o modal
  const initLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      // Voa para a posição atual
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        600,
      );

      // Busca POIs próximos (postos ou oficinas)
      if (nearbyType) {
        const places = await fetchNearbyPlaces(latitude, longitude, nearbyType);
        setNearby(places);
      }
    } finally {
      setLocating(false);
    }
  }, [nearbyType]);

  const open = () => {
    setAddress(value);
    setCoords(null);
    setNearby([]);
    setModalOpen(true);
  };

  // Dispara auto-localização assim que o modal abrir
  useEffect(() => {
    if (modalOpen) {
      // Pequeno delay para o MapView terminar de montar
      const t = setTimeout(() => initLocation(), 400);
      return () => clearTimeout(t);
    }
  }, [modalOpen, initLocation]);

  const close = () => setModalOpen(false);

  const confirm = () => {
    onChange(address.trim());
    close();
  };

  // Usuário tocou no mapa (posição livre)
  const onMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ latitude, longitude });
    setGeocoding(true);
    const addr = await reverseGeocode(latitude, longitude);
    if (addr) setAddress(addr);
    setGeocoding(false);
  };

  // Usuário tocou em um POI nativo do Google Maps (posto, loja, etc.)
  const onPoiClick = async (e: PoiClickEvent) => {
    const { name, coordinate } = e.nativeEvent;
    setCoords(coordinate);
    mapRef.current?.animateToRegion(
      { ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      300,
    );
    setAddress(name);
    // Complementa com o endereço via reverse geocode
    const addr = await reverseGeocode(coordinate.latitude, coordinate.longitude);
    if (addr && addr !== name) setAddress(`${name} — ${addr}`);
  };

  // Usuário tocou em um dos nossos marcadores personalizados
  const onNearbyPress = (place: NearbyPlace) => {
    setCoords({ latitude: place.latitude, longitude: place.longitude });
    mapRef.current?.animateToRegion(
      { latitude: place.latitude, longitude: place.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      300,
    );
    setAddress(place.address ? `${place.name} — ${place.address}` : place.name);
  };

  // Botão "Usar minha localização" (clique manual, redispara)
  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('maintenance.locationPermissionDenied'));
      return;
    }
    setLocating(true);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const newCoords = { latitude, longitude };
      setCoords(newCoords);
      mapRef.current?.animateToRegion(
        { ...newCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        400,
      );
      setGeocoding(true);
      const addr = await reverseGeocode(latitude, longitude);
      if (addr) setAddress(addr);
      setGeocoding(false);

      if (nearbyType && nearby.length === 0) {
        const places = await fetchNearbyPlaces(latitude, longitude, nearbyType);
        setNearby(places);
      }
    } finally {
      setLocating(false);
    }
  };

  const HEADER_H = Platform.OS === 'ios' ? 108 : 92;
  const BOTTOM_H = Platform.OS === 'ios' ? 172 : 150;
  const mapHeight = height - HEADER_H - BOTTOM_H;

  return (
    <View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4, fontWeight: '500' }}>
        {label}
      </Text>

      {/* Trigger */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: value ? colors.primary : colors.border,
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
          }}
        >
          <MapPin size={14} color={value ? colors.primary : colors.textMuted} />
          <Text
            style={{ flex: 1, color: value ? colors.text : colors.textMuted, fontSize: 14 }}
            numberOfLines={1}
          >
            {value || t('maintenance.locationPlaceholder')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={open}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            minHeight: 44,
          }}
        >
          <MapPin size={15} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Modal do mapa */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
        hardwareAccelerated
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              paddingTop: Platform.OS === 'ios' ? 56 : 40,
              paddingHorizontal: 16,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' }}>
              {t('maintenance.pickLocationTitle')}
            </Text>
            {(locating || geocoding) && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            )}
            <TouchableOpacity
              onPress={confirm}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {t('common.done')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mapa */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ width, height: mapHeight }}
            initialRegion={INITIAL_REGION}
            onPress={onMapPress}
            onPoiClick={onPoiClick}
            showsUserLocation
            showsMyLocationButton={false}
            showsPointsOfInterest
            toolbarEnabled={false}
          >
            {/* Marcador da posição selecionada pelo toque */}
            {coords && <Marker coordinate={coords} pinColor={colors.primary} />}

            {/* Marcadores personalizados de postos/oficinas próximos */}
            {nearby.map((place, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                title={place.name}
                description={place.address}
                onPress={() => onNearbyPress(place)}
              >
                <PoiMarker type={nearbyType!} />
              </Marker>
            ))}
          </MapView>

          {/* Painel inferior */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              padding: 14,
              gap: 10,
              paddingBottom: Platform.OS === 'ios' ? 32 : 14,
            }}
          >
            <TouchableOpacity
              onPress={useMyLocation}
              disabled={locating}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 11,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Navigation size={16} color={colors.primary} />
              )}
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                {t('maintenance.useMyLocation')}
              </Text>
            </TouchableOpacity>

            {address ? (
              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: 8,
                  padding: 11,
                  color: colors.text,
                  fontSize: 14,
                }}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                {t('maintenance.pickLocationHint')}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
