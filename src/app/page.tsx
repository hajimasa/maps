'use client'

import { LoginButton } from './components/auth/login-button'
import { SaveRestaurant } from './components/restaurant/save-restaurant'
import { ReviewForm } from './components/restaurant/review-form'
import { ReviewList } from './components/restaurant/review-list'
import { RestaurantList } from './components/restaurant/restaurant-list'
import { useState } from 'react'

export default function Home() {
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0)

  const demoRestaurant = {
    name: "サンプルレストラン",
    address: "東京都渋谷区1-1-1",
    latitude: 35.6762,
    longitude: 139.6503,
    category: "和食",
    price_range: 3,
    phone: "03-1234-5678",
    website: "https://example.com",
    google_place_id: "demo_place_123"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            オフィス周辺レストランマップ
          </h1>
          <LoginButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <RestaurantList />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">店舗情報（デモ）</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{demoRestaurant.name}</h3>
                    <p className="text-gray-600">{demoRestaurant.address}</p>
                    <p className="text-sm text-gray-500">カテゴリ: {demoRestaurant.category}</p>
                    <p className="text-sm text-gray-500">
                      価格帯: {'¥'.repeat(demoRestaurant.price_range)}
                    </p>
                  </div>
                  <SaveRestaurant restaurant={demoRestaurant} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <ReviewForm
                  restaurantId="demo_restaurant_id"
                  onReviewSubmitted={() => setReviewRefreshTrigger(prev => prev + 1)}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <ReviewList
                  restaurantId="demo_restaurant_id"
                  refreshTrigger={reviewRefreshTrigger}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">機能説明</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 「現在地から探す」ボタンで位置情報を取得し、近い順にレストランを表示できます</li>
            <li>• Googleアカウントでログインして店舗を保存できます</li>
            <li>• お気に入りの店舗にレビューを投稿できます</li>
            <li>• 他のユーザーのレビューを確認できます</li>
            <li>• 実際の運用時には Google Maps API と連携して店舗検索が可能になります</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
