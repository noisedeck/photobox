/**
 * Photobomb — Photo Booth clone powered by Noisemaker
 */

import { PhotobombRenderer } from './noisemaker/index.js'
import { Camera } from './camera.js'

class PhotobombApp {
    constructor() {
        this._initialized = false
        this._camera = new Camera()
    }

    async init() {
        if (this._initialized) return
        console.log('[Photobomb] Initializing...')

        // Start camera
        await this._camera.start()
        console.log(`[Photobomb] Camera: ${this._camera.width}x${this._camera.height}`)

        // Test: render camera through a single renderer
        const stage = document.getElementById('stage')
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        stage.appendChild(canvas)

        const renderer = new PhotobombRenderer(canvas, { width: 640, height: 480 })
        await renderer.init()
        renderer.setVideoSource(this._camera.video)
        await renderer.compile('search synth\n\nmedia().write(o0)\n\nrender(o0)')

        this._initialized = true
        console.log('[Photobomb] Ready')
    }
}

const app = new PhotobombApp()
app.init().catch(err => console.error('[Photobomb] Init failed:', err))
