/**
 * PhotobombRenderer — wraps CanvasRenderer for Photobomb's use cases
 *
 * Two modes:
 *   - Grid tile: small canvas, single effect, shared camera video element
 *   - Full-size: large canvas, single effect, dedicated view
 */

import { CanvasRenderer } from './bundle.js'

const SHADER_CDN = 'https://shaders.noisedeck.app/0.8.5'

export class PhotobombRenderer {
    constructor(canvas, options = {}) {
        this._canvas = canvas
        this.width = options.width || canvas?.width || 640
        this.height = options.height || canvas?.height || 480

        this._renderer = new CanvasRenderer({
            canvas,
            canvasContainer: canvas?.parentElement || null,
            width: this.width,
            height: this.height,
            basePath: SHADER_CDN,
            preferWebGPU: false,
            useBundles: true,
            bundlePath: `${SHADER_CDN}/effects`,
            alpha: false,
            onError: options.onError
        })

        this._initialized = false
        this._videoSource = null
        this._animRAF = null
        this._currentDsl = ''
    }

    async init() {
        if (this._initialized) return
        await this._renderer.loadManifest()
        this._initialized = true
    }

    /**
     * Set the camera video element as external texture source.
     * Must be called before compile().
     */
    setVideoSource(videoElement) {
        this._videoSource = videoElement
    }

    /**
     * Compile a DSL program and start rendering.
     * @param {string} dsl - Noisemaker DSL code
     */
    async compile(dsl) {
        if (!this._initialized) throw new Error('Not initialized')
        this._currentDsl = dsl
        await this._renderer.compile(dsl)
        this._uploadVideoTexture()
        this._startLoop()
    }

    /**
     * Upload video frame to the GPU texture.
     * Called once before render loop starts and then every frame.
     */
    _uploadVideoTexture() {
        if (!this._videoSource) return
        if (this._videoSource.readyState < 2) return // HAVE_CURRENT_DATA
        this._renderer.updateTextureFromSource?.('imageTex', this._videoSource, { flipY: false })
        // Update imageSize uniform for aspect ratio correction
        const w = this._videoSource.videoWidth || this._videoSource.width
        const h = this._videoSource.videoHeight || this._videoSource.height
        if (w && h) {
            this._renderer.state?.setValue?.('media', 'imageSize', [w, h])
        }
    }

    _startLoop() {
        if (this._animRAF) return
        const tick = () => {
            this._uploadVideoTexture()
            this._animRAF = requestAnimationFrame(tick)
        }
        this._animRAF = requestAnimationFrame(tick)
    }

    stop() {
        if (this._animRAF) {
            cancelAnimationFrame(this._animRAF)
            this._animRAF = null
        }
    }

    resize(width, height) {
        this.width = width
        this.height = height
        this._renderer.resize?.(width, height)
    }

    destroy() {
        this.stop()
        this._renderer.destroy?.()
        this._videoSource = null
    }
}
