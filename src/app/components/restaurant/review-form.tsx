'use client'

import { supabase } from '@/app/lib/supabase'
import { Star, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { convertGooglePlaceToRestaurant, type GooglePlaceRestaurant } from '@/app/lib/google-maps'

interface ReviewFormProps {
  restaurantId: string
  restaurantData?: GooglePlaceRestaurant
  onReviewSubmitted?: () => void
}

export function ReviewForm({ restaurantId, restaurantData, onReviewSubmitted }: ReviewFormProps) {
  const [user, setUser] = useState<User | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('ログインが必要です')
      return
    }

    if (rating === 0) {
      alert('評価を選択してください')
      return
    }

    setLoading(true)

    try {
      // First, ensure the restaurant exists in our database
      // restaurantId is actually a Google Place ID, so we need to get the actual restaurant record
      let restaurant
      const { data: existingRestaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('google_place_id', restaurantId)
        .single()

      if (restaurantError) {
        // Restaurant doesn't exist, we need to create it first
        if (!restaurantData) {
          throw new Error('レストラン情報が不足しています。')
        }

        console.log('Restaurant not found, creating it first')
        const newRestaurantData = convertGooglePlaceToRestaurant(restaurantData)
        
        const { data: insertedRestaurant, error: insertError } = await supabase
          .from('restaurants')
          .insert(newRestaurantData)
          .select('id')
          .single()

        if (insertError) {
          console.error('Error inserting restaurant:', insertError)
          throw new Error('レストラン情報の登録に失敗しました。')
        }

        restaurant = insertedRestaurant
      } else {
        restaurant = existingRestaurant
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setRating(0)
      setComment('')
      onReviewSubmitted?.()
      alert('レビューを投稿しました')
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center border border-gray-200">
        <p className="text-gray-700 font-medium">🔑 レビューを投稿するにはログインが必要です</p>
      </div>
    )
  }

  return (
    <form onSubmit={submitReview} className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900">✍️ レビューを投稿</h3>
      
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          評価
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                size={24}
                className={`${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-3">
          コメント（任意）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="このお店についてのコメントを書いてください..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 bg-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        <Send size={16} />
        {loading ? '投稿中...' : '投稿する'}
      </button>
    </form>
  )
}