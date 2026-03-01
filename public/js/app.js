/**
 * Photobomb — Photo Booth clone powered by Noisemaker
 */

class PhotobombApp {
    constructor() {
        this._initialized = false
    }

    async init() {
        if (this._initialized) return
        console.log('[Photobomb] Initializing...')
        this._initialized = true
        console.log('[Photobomb] Ready')
    }
}

const app = new PhotobombApp()
app.init().catch(err => console.error('[Photobomb] Init failed:', err))
