'use client'

import { supabase } from '@/app/lib/supabase'
import { Star, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface ReviewFormProps {
  restaurantId: string
  onReviewSubmitted?: () => void
}

export function ReviewForm({ restaurantId, onReviewSubmitted }: ReviewFormProps) {
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
      const { error } = await supabase
        .from('reviews')
        .insert({
          restaurant_id: restaurantId,
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
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">レビューを投稿するにはログインが必要です</p>
      </div>
    )
  }

  return (
    <form onSubmit={submitReview} className="space-y-4 p-4 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold">レビューを投稿</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          コメント（任意）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="このお店についてのコメントを書いてください..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={16} />
        {loading ? '投稿中...' : '投稿する'}
      </button>
    </form>
  )
}