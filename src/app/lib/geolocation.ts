export interface Location {
  latitude: number;
  longitude: number;
}

export interface Restaurant {
  id?: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  price_range: number | null;
  phone: string | null;
  website: string | null;
  google_place_id: string | null;
  distance?: number;
}

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分間キャッシュ
      }
    );
  });
};

// Haversine formula で2点間の距離を計算（km単位）
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // 地球の半径（km）
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 小数点第2位まで
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// レストランリストに距離を追加してソート
export const sortRestaurantsByDistance = (
  restaurants: Restaurant[],
  userLocation: Location
): Restaurant[] => {
  return restaurants
    .map(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        return { ...restaurant, distance };
      }
      return restaurant;
    })
    .sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
};

// 距離を人間が読みやすい形式で表示
export const formatDistance = (distance: number | undefined): string => {
  if (distance === undefined) return '';
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  
  return `${distance}km`;
};