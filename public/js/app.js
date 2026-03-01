/**
 * Photobomb — Photo Booth clone powered by Noisemaker
 */

import { PhotobombRenderer } from './noisemaker/index.js'

class PhotobombApp {
    constructor() {
        this._initialized = false
    }

    async init() {
        if (this._initialized) return
        console.log('[Photobomb] Initializing...')

        // Test: create a renderer with a temp canvas
        const testCanvas = document.createElement('canvas')
        testCanvas.width = 320
        testCanvas.height = 240
        const renderer = new PhotobombRenderer(testCanvas, { width: 320, height: 240 })
        await renderer.init()
        console.log('[Photobomb] Renderer initialized successfully')
        renderer.destroy()

        this._initialized = true
        console.log('[Photobomb] Ready')
    }
}

const app = new PhotobombApp()
app.init().catch(err => console.error('[Photobomb] Init failed:', err))
