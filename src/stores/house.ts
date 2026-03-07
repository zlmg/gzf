import { defineStore } from 'pinia'
import houseData from '../../script/bsgz.json'

export interface House {
  openQueue: string
  thumbnail: string
  minRent: number
  mediaUrl: string
  latitude: string
  kezuCount: number
  layout: string
  maxRent: number
  projectNo: string
  location: string
  projectName: string
  roomType: string
  longitude: string
}

export const useHouseStore = defineStore('house', {
  state: () => ({
    houses: [] as House[],
    compareList: [] as House[],
    filters: {
      district: '',
      roomType: '',
      priceRange: [0, 6000] as [number, number]
    }
  }),
  getters: {
    getHouseById: (state) => (id: string) => {
      return state.houses.find(house => house.projectNo === id)
    }
  },
  actions: {
    loadHouses() {
      // 从 JSON 文件加载数据
      this.houses = houseData.pageContent
      
      // 从本地存储加载对比列表
      const savedCompareList = localStorage.getItem('compareList')
      if (savedCompareList) {
        this.compareList = JSON.parse(savedCompareList)
      }
    },
    addToCompare(house: House) {
      if (this.compareList.length < 4 && !this.isInCompare(house.projectNo)) {
        this.compareList.push(house)
        this.saveCompareList()
      }
    },
    removeFromCompare(id: string) {
      this.compareList = this.compareList.filter(house => house.projectNo !== id)
      this.saveCompareList()
    },
    isInCompare(id: string) {
      return this.compareList.some(house => house.projectNo === id)
    },
    clearCompareList() {
      this.compareList = []
      this.saveCompareList()
    },
    saveCompareList() {
      localStorage.setItem('compareList', JSON.stringify(this.compareList))
    },
    saveFilters() {
      localStorage.setItem('filters', JSON.stringify(this.filters))
    },
    loadFilters() {
      const savedFilters = localStorage.getItem('filters')
      if (savedFilters) {
        this.filters = JSON.parse(savedFilters)
      }
    }
  }
})
