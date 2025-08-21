'use client'

import { useState } from 'react'
import { LoginButton } from './components/auth/login-button'
import { RestaurantList } from './components/restaurant/restaurant-list'
import { MyPage } from './components/mypage/my-page'
import { Home, User } from 'lucide-react'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'mypage'>('home')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            オフィス周辺レストランマップ
          </h1>
          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage('home')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                ホーム
              </button>
              <button
                onClick={() => setCurrentPage('mypage')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'mypage'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                マイページ
              </button>
            </nav>
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {currentPage === 'home' ? (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <RestaurantList />
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">機能説明</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 「現在地から探す」ボタンで位置情報を取得し、Google Maps APIから周辺のレストランを検索表示します</li>
                <li>• Googleアカウントでログインして店舗をお気に入りに追加できます</li>
                <li>• レビューボタン（💬）をクリックしてレビューを投稿できます</li>
                <li>• 他のユーザーのレビューを確認できます</li>
                <li>• お気に入りとレビューはSupabaseに保存されます</li>
              </ul>
            </div>
          </>
        ) : (
          <MyPage />
        )}
      </main>
    </div>
  )
}
