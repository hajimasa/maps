'use client'

import { supabase } from '@/app/lib/supabase'
import { Star } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  user_profiles: {
    display_name: string
    avatar_url: string | null
  }
}

interface ReviewListProps {
  restaurantId: string
  refreshTrigger?: number
}

export function ReviewList({ restaurantId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      // First, get the restaurant's actual ID from Google Place ID
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('google_place_id', restaurantId)
        .single()

      if (restaurantError) {
        console.error('Restaurant not found for reviews:', restaurantError)
        setReviews([])
        return
      }

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          user_profiles!inner(
            display_name,
            avatar_url
          )
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews((data as unknown as Review[]) || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    fetchReviews()
  }, [restaurantId, refreshTrigger, fetchReviews])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg border animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="w-5 h-5 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>まだレビューがありません</p>
        <p className="text-sm">最初のレビューを投稿してみませんか？</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📝 レビュー ({reviews.length})</h3>
      {reviews.map((review) => (
        <div key={review.id} className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {review.user_profiles.avatar_url ? (
                <img 
                  src={review.user_profiles.avatar_url} 
                  alt={review.user_profiles.display_name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {review.user_profiles.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-bold text-gray-900 text-lg">
                {review.user_profiles.display_name}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {formatDate(review.created_at)}
            </p>
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
      ))}
    </div>
  )
}