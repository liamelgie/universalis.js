import fetch from 'cross-fetch'
import dayjs from 'dayjs'

class Universalis {
    constructor(options = {}) {
        this.BASE_API_URL = 'https://universalis.app/api'
    }

    #arrayToParam = (array) => {
        const param = array.map((item) => {
            return JSON.stringify(item)
        })
        return param.join(',')
    }

    #validateServerName = async (name) => {
        if (!name) return false

        const servers = await fetch('https://xivapi.com/servers/dc').then(res => res.json())
        const dataCenter = await Object.keys(servers)
        if (dataCenter.includes(name)) return { dataCenter: true, world: false } // Maybe rethink on what to return
         
        const worlds = await Object.values(servers)
        for (let dc of worlds) {
            if (dc.includes(name)) {
                return { dataCenter: false, world: true } // Maybe rethink on what to return 
            }
        }

        return false // Not found
    }

    validateMarketableItem = async (id) => {
        const validIDs = await this.getMarketableItems()
        return validIDs.includes(id)
    }

    getListings = async (world, id) => {
        if (!world || !id) return false
        if (!this.#validateServerName(world)) return false
        const itemID = typeof id === 'Array' ? itemID = this.#arrayToParam(id) : id // Check whether if id is singular or a list
        const res = await fetch(`${this.BASE_API_URL}/${world}/${itemID}`)
        const data = await res.json()
        return data
    }

    getSales = async (world, id) => {
        if (!world || !id) return false
        if (!this.#validateServerName(world)) return false
        const itemID = typeof id === 'Array' ? itemID = this.#arrayToParam(id) : id // Check whether if id is singular or a list
        const res = await fetch(`${this.BASE_API_URL}/history/${world}/${itemID}`)
        const data = await res.json()
        return data
    }

    sortListingsByWorld = (listings) => {
        if (!listings[0].worldName) throw 'Missing .worldName property in listing data. Ensure the provided data contains results from an entire data center and not a single world'
        const sortedListings = listings.reduce((worldGroups, { lastReviewTime, pricePerUnit, quantity, stainID, worldName, worldID, creatorName, creatorID, hq, isCrafted, listingID, materia, onMannequin, retainerCity, retainerID, retainerName, sellerID, total}) => {
            if (!worldGroups[worldName]) worldGroups[worldName] = []
            worldGroups[worldName].push({ lastReviewTime, pricePerUnit, quantity, stainID, worldName, worldID, creatorName, creatorID, hq, isCrafted, listingID, materia, onMannequin, retainerCity, retainerID, retainerName, sellerID, total})
            return worldGroups
        }, {})

        return sortedListings
    }

    sortSalesByDay = (sales, limit) => {
        const data = sales.entries.map((sale) => {
            const dateObject = dayjs(sale.timestamp * 1000)
            return {
                itemID: sales.itemID,
                hq: sale.hq, 
                pricePerUnit: sale.pricePerUnit,
                quantity: sale.quantity,
                worldName: sales.worldName || sale.worldName,
                worldID: sales.worldID || sale.worldID,
                date: dateObject.format('YYYY-MM-DD'),
                time: { 
                    raw: `${dateObject.hour()}${dateObject.minute()}${dateObject.second()}`, 
                    pretty: `${dateObject.hour()}:${dateObject.minute()}:${dateObject.second()}` 
                } 
            }
        })
    
        const sortedSales = data.reduce((datedGroups, { date, itemID, hq, pricePerUnit, quantity, worldName, worldID, time }) => {
            if (!datedGroups[date]) datedGroups[date] = []
            datedGroups[date].push({ itemID, hq, pricePerUnit, quantity, worldName, worldID, time })
            return datedGroups
        }, {})
    
        return Object.fromEntries(Object.entries(sortedSales).slice(0, limit))
    }

    getTaxRates = async (world) => {
        if (!this.#validateServerName(world)) return false
        const res = await fetch(`${this.BASE_API_URL}/tax-rates?world=${world}`)
        const rates = await res.json()
        return rates
    }

    getMarketableItems = async () => {
        const res = await fetch(`${this.BASE_API_URL}/marketable`)
        const ids = await res.json()
        return ids
    }

    getRecentlyUpdatedItems = async (world, entries = '50') => {
        const worldType = await this.#validateServerName(world)
        let worldParam = ''
        if (worldType.world) worldParam = `world=`
        if (worldType.dataCenter) worldParam = `dcname=`
        const res = await fetch(`${this.BASE_API_URL}/extra/stats/most-recently-updated?${worldParam}${world}&entries=${entries}`)
        const data = await res.json()
        return data
    }

    // Retrieves a generic list of recently updated items. This provides no context regarding what world or when exactly the item was updated.
    getRecentlyUpdatedItemsGeneric = async () => {
        const res = await fetch(`${this.BASE_API_URL}/extra/stats/recently-updated`)
        const data = await res.json()
        return data
    }

    getUploadCounts = async () => {
        return Promise.all([
            fetch(`${this.BASE_API_URL}/extra/stats/world-upload-counts`).then(res => res.json()),
            fetch(`${this.BASE_API_URL}/extra/stats/uploader-upload-counts`).then(res => res.json()),
            fetch(`${this.BASE_API_URL}/extra/stats/upload-history`).then(res => res.json())
        ]).then(counts => {
            return { world: counts[0], application: counts[1], history: counts[2] }
        })
    }

    getUploadCountsByWorld = async () => {
        const res = await fetch(`${this.BASE_API_URL}/extra/stats/world-upload-counts`)
        const counts = await res.json()
        return counts
    }

    getUploadCountsByApplication = async () => {
        const res = await fetch(`${this.BASE_API_URL}/extra/stats/uploader-upload-counts`)
        const counts = await res.json()
        return counts
    }

    getUploadCountsHistory = async () => {
        const res = await fetch(`${this.BASE_API_URL}/extra/stats/upload-history`)
        const counts = await res.json()
        return counts
    }
}

export default Universalis