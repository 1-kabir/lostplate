import axios from 'axios';

// Default to local server, switch to Railway deployment url in production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface SmartMatchResult {
  id: string;
  name: string;
  address: string;
  distance: string;
}

export interface ImpactStats {
  totalKg: number;
  mealsEnabled: number;
  co2SavedKg: number;
  waterSavedL: number;
  partnerCount: number;
  memberSince: string | null;
}

// API endpoint calls
export const apiService = {
  // Geocode address
  async geocode(address: string): Promise<GeocodeResult> {
    const response = await api.get<GeocodeResult>(`/api/geocode?q=${encodeURIComponent(address)}`);
    return response.data;
  },

  // Calculate Smart Matches for listing
  async getSmartMatches(listingId: string): Promise<SmartMatchResult[]> {
    const response = await api.post<{ matches: SmartMatchResult[] }>('/api/match', { listingId });
    return response.data.matches;
  },

  // Verify pickup QR token
  async verifyClaimQr(qrToken: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/api/claims/verify', { qrToken });
    return response.data;
  },

  // FoodPrint impact aggregate for a donor or NGO
  async getImpact(userId: string): Promise<ImpactStats> {
    const response = await api.get<ImpactStats>(`/api/impact/${userId}`);
    return response.data;
  },

  // Register (or clear) this device's push token against the user's profile
  async registerPushToken(userId: string, token: string | null): Promise<void> {
    await api.post('/api/notify/register', { userId, token });
  },
};
