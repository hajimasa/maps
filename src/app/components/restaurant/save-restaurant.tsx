'use client'

import { supabase } from '@/app/lib/supabase'
import { Heart, HeartIcon } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'

interface SaveRestaurantProps {
  restaurant: {
    id?: string
    name: string
    address?: string
    latitude?: number
    longitude?: number
    category?: string
    price_range?: number
    phone?: string
    website?: string
    google_place_id?: string
  }
}

export function SaveRestaurant({ restaurant }: SaveRestaurantProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(restaurant.id || null)

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

  const checkIfSaved = useCallback(async () => {
    if (!user || !restaurantId) return

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!error && data) {
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error checking if saved:', error)
    }
  }, [user, restaurantId])

  useEffect(() => {
    if (user && restaurantId) {
      checkIfSaved()
    }
  }, [user, restaurantId, checkIfSaved])

  const saveRestaurant = async () => {
    if (!user) {
      alert('ログインが必要です')
      return
    }

    setLoading(true)

    try {
      let currentRestaurantId = restaurantId

      if (!currentRestaurantId) {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            name: restaurant.name,
            address: restaurant.address,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            category: restaurant.category,
            price_range: restaurant.price_range,
            phone: restaurant.phone,
            website: restaurant.website,
            google_place_id: restaurant.google_place_id,
          })
          .select()
          .single()

        if (restaurantError) {
          if (restaurantError.code === '23505') {
            const { data: existingRestaurant, error: findError } = await supabase
              .from('restaurants')
              .select('id')
              .eq('google_place_id', restaurant.google_place_id)
              .single()

            if (findError) throw findError
            currentRestaurantId = existingRestaurant.id
          } else {
            throw restaurantError
          }
        } else {
          currentRestaurantId = restaurantData.id
        }
        setRestaurantId(currentRestaurantId)
      }

      if (isSaved) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', currentRestaurantId)

        if (error) throw error
        setIsSaved(false)
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            restaurant_id: currentRestaurantId,
          })

        if (error) throw error
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error saving restaurant:', error)
      alert('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <button
      onClick={saveRestaurant}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isSaved
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isSaved ? (
        <HeartIcon size={16} className="fill-current" />
      ) : (
        <Heart size={16} />
      )}
      {loading ? '...' : isSaved ? '保存済み' : '保存'}
    </button>
  )
}