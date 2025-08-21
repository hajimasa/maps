'use client'

import { LoginButton } from './components/auth/login-button'
import { RestaurantList } from './components/restaurant/restaurant-list'

export default function App() {

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            オフィス周辺レストランマップ
          </h1>
          <div className="flex items-center space-x-4">
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <RestaurantList />
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">機能説明</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 「現在地から探す」ボタンで位置情報を取得し、Google Maps APIから周辺のレストランを検索表示します</li>
            <li>• Googleアカウントでログインして店舗をお気に入りに追加できます</li>
            <li>• レビューボタン（💬）をクリックしてレビューを投稿できます</li>
            <li>• 他のユーザーのレビューを確認できます</li>
            <li>• お気に入りとレビューはSupabaseに保存されます</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
