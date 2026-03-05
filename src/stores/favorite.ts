import { defineStore } from 'pinia'

interface FavoriteItem {
  id: string
  title: string
  content: string
  timestamp: number
  image: string
}

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    favorites: [] as FavoriteItem[]
  }),
  getters: {
    isFavorite: (state) => (id: string) => {
      return state.favorites.some(item => item.id === id)
    }
  },
  actions: {
    loadFavorites() {
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        this.favorites = JSON.parse(savedFavorites)
      }
    },
    addFavorite(id: string, title: string, content: string, image: string) {
      if (!this.isFavorite(id)) {
        const newFavorite: FavoriteItem = {
          id,
          title,
          content,
          timestamp: Date.now(),
          image
        }
        this.favorites.push(newFavorite)
        this.saveFavorites()
        return true
      }
      return false
    },
    removeFavorite(id: string) {
      this.favorites = this.favorites.filter(item => item.id !== id)
      this.saveFavorites()
    },
    saveFavorites() {
      localStorage.setItem('favorites', JSON.stringify(this.favorites))
    }
  }
})
