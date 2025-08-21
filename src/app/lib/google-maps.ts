import { Location } from './geolocation'

export interface GooglePlaceRestaurant {
  place_id: string
  name: string
  vicinity: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  rating?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  formatted_phone_number?: string
  website?: string
}

export interface GooglePlacesResponse {
  results: GooglePlaceRestaurant[]
  status: string
  next_page_token?: string
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function searchNearbyRestaurants(
  location: Location,
  radius: number = 1000
): Promise<GooglePlaceRestaurant[]> {
  try {
    const url = new URL('/api/restaurants/search', window.location.origin)
    url.searchParams.set('lat', location.latitude.toString())
    url.searchParams.set('lng', location.longitude.toString())
    url.searchParams.set('radius', radius.toString())

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: GooglePlacesResponse = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    return data.results
  } catch (error) {
    console.error('Error searching nearby restaurants:', error)
    throw error
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceRestaurant> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is not configured')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', GOOGLE_MAPS_API_KEY)
  url.searchParams.set('language', 'ja')
  url.searchParams.set('fields', 'place_id,name,vicinity,geometry,types,rating,price_level,photos,formatted_phone_number,website')

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    return data.result
  } catch (error) {
    console.error('Error getting place details:', error)
    throw error
  }
}

export function convertGooglePlaceToRestaurant(place: GooglePlaceRestaurant) {
  return {
    name: place.name,
    address: place.vicinity,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    category: place.types.find(type => 
      ['restaurant', 'food', 'meal_takeaway', 'meal_delivery'].includes(type)
    ) || '飲食店',
    price_range: place.price_level || null,
    phone: place.formatted_phone_number || null,
    website: place.website || null,
    google_place_id: place.place_id,
    created_at: new Date().toISOString()
  }
}