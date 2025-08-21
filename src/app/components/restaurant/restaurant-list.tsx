'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getCurrentLocation, sortRestaurantsByDistance, formatDistance, type Location, type Restaurant } from '../../lib/geolocation'

export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRestaurants(data || [])
    } catch (error) {
      console.error('Error loading restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = async () => {
    setGettingLocation(true)
    setLocationError(null)
    
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationError('位置情報を取得できませんでした。ブラウザの設定を確認してください。')
    } finally {
      setGettingLocation(false)
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  const sortedRestaurants = userLocation 
    ? sortRestaurantsByDistance(restaurants, userLocation)
    : restaurants

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">レストランを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">レストラン一覧</h2>
        <button
          onClick={getUserLocation}
          disabled={gettingLocation}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {gettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          {userLocation ? '位置情報を更新' : '現在地から探す'}
        </button>
      </div>

      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{locationError}</p>
        </div>
      )}

      {userLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            現在地を取得しました。距離順に表示されています。
          </p>
        </div>
      )}

      {sortedRestaurants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">登録されたレストランがありません。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{restaurant.name}</h3>
                  {restaurant.address && (
                    <p className="text-gray-600 text-sm mt-1">{restaurant.address}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {restaurant.category && (
                      <span>カテゴリ: {restaurant.category}</span>
                    )}
                    {restaurant.price_range && (
                      <span>価格帯: {'¥'.repeat(restaurant.price_range)}</span>
                    )}
                  </div>
                </div>
                {restaurant.distance !== undefined && (
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <MapPin className="h-4 w-4 mr-1" />
                    {formatDistance(restaurant.distance)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}