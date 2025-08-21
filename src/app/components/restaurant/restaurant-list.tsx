'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapPin, Navigation, Loader2, Star, Heart, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { getCurrentLocation, type Location } from '../../lib/geolocation'
import { searchNearbyRestaurants, convertGooglePlaceToRestaurant, type GooglePlaceRestaurant } from '../../lib/google-maps'
import { ReviewForm } from './review-form'
import { ReviewList } from './review-list'

// 2点間の距離を計算する関数（km）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 距離を徒歩時間に変換する関数（分）
function distanceToWalkingTime(distanceKm: number): number {
  const walkingSpeedKmh = 4.8 // 平均歩行速度 4.8km/h
  const timeHours = distanceKm / walkingSpeedKmh
  return Math.round(timeHours * 60)
}

export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<GooglePlaceRestaurant[]>([])
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<User | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<GooglePlaceRestaurant | null>(null)
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0)
  const [filterOpenNow, setFilterOpenNow] = useState(false)
  const [filterHighRating, setFilterHighRating] = useState(false)

  const loadFavorites = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          restaurants!inner(google_place_id)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      
      const placeIds = data
        .map((fav: { restaurants: { google_place_id: string }[] | { google_place_id: string } }) => {
          if (Array.isArray(fav.restaurants)) {
            return fav.restaurants[0]?.google_place_id
          }
          return fav.restaurants?.google_place_id
        })
        .filter(Boolean) as string[]
      
      setFavorites(new Set(placeIds))
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }, [user])

  const loadRestaurants = useCallback(async (location: Location) => {
    setLoading(true)
    try {
      const places = await searchNearbyRestaurants(location)
      setRestaurants(places)
    } catch (error) {
      console.error('Error loading restaurants:', error)
      setLocationError('レストランの検索中にエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }, [])

  const getUserLocation = useCallback(async () => {
    setGettingLocation(true)
    setLocationError(null)
    
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      await loadRestaurants(location)
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationError('位置情報を取得できませんでした。ブラウザの設定を確認してください。')
    } finally {
      setGettingLocation(false)
    }
  }, [loadRestaurants])

  const toggleFavorite = async (placeId: string) => {
    if (!user) {
      alert('お気に入りに追加するにはログインが必要です。')
      return
    }

    try {
      const restaurant = restaurants.find(r => r.place_id === placeId)
      if (!restaurant) return

      if (favorites.has(placeId)) {
        // Get restaurant id first
        const { data: restaurantRecord, error: findRestaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('google_place_id', placeId)
          .single()

        if (findRestaurantError) {
          console.error('Error finding restaurant for deletion:', findRestaurantError)
          throw findRestaurantError
        }

        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantRecord.id)

        if (error) throw error
        setFavorites(prev => {
          const newSet = new Set(prev)
          newSet.delete(placeId)
          return newSet
        })
      } else {
        const restaurantData = convertGooglePlaceToRestaurant(restaurant)
        
        const { error: insertRestaurantError } = await supabase
          .from('restaurants')
          .upsert(restaurantData, {
            onConflict: 'google_place_id'
          })

        if (insertRestaurantError) throw insertRestaurantError

        // Get the inserted restaurant id
        const { data: insertedRestaurant, error: checkRestaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('google_place_id', placeId)
          .single()

        if (checkRestaurantError) {
          console.error('Error finding restaurant after upsert:', checkRestaurantError)
          throw checkRestaurantError
        }

        const { error: insertFavoriteError } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            restaurant_id: insertedRestaurant.id,
            created_at: new Date().toISOString()
          })

        if (insertFavoriteError) throw insertFavoriteError
        setFavorites(prev => new Set(prev).add(placeId))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      console.error('Error details:', {
        placeId,
        userId: user?.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error
      })
      alert(`お気に入りの更新中にエラーが発生しました。\n詳細: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadFavorites()
    }
  }, [user, loadFavorites])

  // Auto-fetch location and restaurants on component mount
  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  const sortedRestaurants = restaurants.filter(restaurant => {
    // 営業中フィルター
    if (filterOpenNow && restaurant.opening_hours?.open_now !== true) {
      return false
    }
    
    // 高評価フィルター（4.0以上）
    if (filterHighRating && (!restaurant.rating || restaurant.rating < 4.0)) {
      return false
    }
    
    return true
  })

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🍽️ レストラン一覧</h2>
      </div>

      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{locationError}</p>
        </div>
      )}

      {userLocation && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <p className="text-green-700 text-sm flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            現在地を取得しました。おすすめ順に表示されています。
          </p>
        </div>
      )}

      {restaurants.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">🔍 絞り込み</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filterOpenNow}
                onChange={(e) => setFilterOpenNow(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded accent-blue-600"
              />
              <span className="ml-3 text-sm font-medium text-gray-800">🕑 営業中のみ表示</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filterHighRating}
                onChange={(e) => setFilterHighRating(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded accent-blue-600"
              />
              <span className="ml-3 text-sm font-medium text-gray-800">⭐ 評価4.0以上のみ表示</span>
            </label>
          </div>
        </div>
      )}

      {sortedRestaurants.length === 0 ? (
        <div className="text-center py-8">
          {restaurants.length === 0 ? (
            <p className="text-gray-500">「現在地から探す」ボタンを押してレストランを検索してください。</p>
          ) : (
            <p className="text-gray-500">絞り込み条件に該当するレストランがありません。</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRestaurants.map((restaurant) => (
            <div key={restaurant.place_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setSelectedRestaurant(restaurant)}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{restaurant.name}</h3>
                  {restaurant.vicinity && (
                    <p className="text-gray-600 text-sm mt-1">{restaurant.vicinity}</p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                    {restaurant.rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span>{restaurant.rating.toFixed(1)}</span>
                        <span className="ml-1 text-xs text-gray-400">(Google)</span>
                      </div>
                    )}
                    {userLocation && (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold inline-block w-fit">
                        🚶 徒歩{distanceToWalkingTime(
                          calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            restaurant.geometry.location.lat,
                            restaurant.geometry.location.lng
                          )
                        )}分
                      </span>
                    )}
                    {restaurant.opening_hours?.open_now !== undefined && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold inline-block w-fit ${
                        restaurant.opening_hours.open_now
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {restaurant.opening_hours.open_now ? '🔑 営業中' : '🔒 営業時間外'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('Toggling favorite for:', restaurant.place_id)
                      console.log('Current favorites set:', Array.from(favorites))
                      console.log('Is favorited:', favorites.has(restaurant.place_id))
                      toggleFavorite(restaurant.place_id)
                    }}
                    className={`p-3 rounded-full transition-colors ${
                      favorites.has(restaurant.place_id)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(restaurant.place_id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRestaurant.name}</h2>
                  <p className="text-gray-600">{selectedRestaurant.vicinity}</p>
                  {selectedRestaurant.rating && (
                    <div className="flex items-center mt-2 text-gray-900">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{selectedRestaurant.rating.toFixed(1)}</span>
                      <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded-full font-medium">(Google評価)</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRestaurant(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <ReviewForm
                  restaurantId={selectedRestaurant.place_id}
                  restaurantData={selectedRestaurant}
                  onReviewSubmitted={() => {
                    setReviewRefreshTrigger(prev => prev + 1)
                  }}
                />
                
                <ReviewList
                  restaurantId={selectedRestaurant.place_id}
                  refreshTrigger={reviewRefreshTrigger}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}