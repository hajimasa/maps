'use client'

import { LoginButton } from './components/auth/login-button'
import { RestaurantList } from './components/restaurant/restaurant-list'

export default function App() {

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
            🍴 オフィス周辺レストランマップ
          </h1>
          <div className="flex items-center space-x-4">
            <LoginButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-8">
          <RestaurantList />
        </div>
      </main>
    </div>
  )
}
