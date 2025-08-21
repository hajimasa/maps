'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Star, Heart, MapPin } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface FavoriteRestaurant {
  id: string
  restaurants: {
    id: string
    name: string
    address: string | null
    latitude: number
    longitude: number
    category: string
    price_range: number | null
    google_place_id: string
  }[]
}

interface ReviewedRestaurant {
  id: string
  rating: number
  comment: string | null
  created_at: string
  restaurants: {
    id: string
    name: string
    address: string | null
    latitude: number
    longitude: number
    category: string
    price_range: number | null
    google_place_id: string
  }
}

export function MyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([])
  const [reviews, setReviews] = useState<ReviewedRestaurant[]>([])
  const [activeTab, setActiveTab] = useState<'favorites' | 'reviews'>('favorites')
  const [loading, setLoading] = useState(true)

  const loadFavorites = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          restaurants (
            id,
            name,
            address,
            latitude,
            longitude,
            category,
            price_range,
            google_place_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFavorites(data || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }, [user])

  const loadReviews = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          restaurants (
            id,
            name,
            address,
            latitude,
            longitude,
            category,
            price_range,
            google_place_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }, [user])

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
      setLoading(true)
      Promise.all([loadFavorites(), loadReviews()]).finally(() => {
        setLoading(false)
      })
    }
  }, [user, loadFavorites, loadReviews])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">マイページを表示するにはログインが必要です</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">マイページ</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'favorites'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Heart className="h-4 w-4 inline mr-2" />
          お気に入り ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Star className="h-4 w-4 inline mr-2" />
          レビュー ({reviews.length})
        </button>
      </div>

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">お気に入りレストラン</h2>
          {favorites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">お気に入りに追加したレストランはありません</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {favorites.map((favorite) => {
                const restaurant = favorite.restaurants?.[0]
                if (!restaurant) return null
                return (
                  <div key={favorite.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{restaurant.name}</h3>
                        {restaurant.address && (
                          <p className="text-gray-600 text-sm mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {restaurant.address}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>カテゴリ: {restaurant.category}</span>
                          {restaurant.price_range && (
                            <span>価格帯: {'¥'.repeat(restaurant.price_range)}</span>
                          )}
                        </div>
                      </div>
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">レビューしたレストラン</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">レビューしたレストランはありません</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => {
                const restaurant = review.restaurants
                if (!restaurant) return null
                return (
                  <div key={review.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{restaurant.name}</h3>
                        {restaurant.address && (
                          <p className="text-gray-600 text-sm mt-1 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {restaurant.address}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}