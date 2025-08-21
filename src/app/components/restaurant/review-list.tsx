'use client'

import { supabase } from '@/app/lib/supabase'
import { Star } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_profiles: {
    display_name: string | null
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
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_profiles!inner (
            display_name,
            avatar_url
          )
        `)
        .eq('restaurant_id', restaurantId)
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
      <h3 className="text-lg font-semibold">レビュー ({reviews.length})</h3>
      {reviews.map((review) => (
        <div key={review.id} className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-3 mb-3">
            {review.user_profiles?.avatar_url && (
              <img
                src={review.user_profiles.avatar_url}
                alt="User avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">
                {review.user_profiles?.display_name || 'Anonymous'}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(review.created_at)}
              </p>
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
      ))}
    </div>
  )
}