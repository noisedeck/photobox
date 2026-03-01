/**
 * Grid module — manages the 3x3 effect preview grid
 *
 * Creates 9 tile elements, each with its own canvas and PhotobombRenderer.
 * All renderers share the same camera video element as texture source.
 */

import { PhotobombRenderer } from './noisemaker/index.js'

const TILE_BASE = 320

export class EffectGrid {
    /**
     * @param {HTMLElement} container - the grid container element
     * @param {HTMLVideoElement} videoSource - camera video element
     */
    constructor(container, videoSource) {
        this._container = container
        this._videoSource = videoSource
        // Derive tile dimensions from camera aspect ratio
        const camW = videoSource.videoWidth || 1280
        const camH = videoSource.videoHeight || 720
        this._tileWidth = TILE_BASE
        this._tileHeight = Math.round(TILE_BASE * camH / camW)
        this._tiles = []       // { canvas, renderer, name }
        this._initialized = false
        this._onTileClick = null
    }

    /** Set callback for tile clicks: (tileIndex, effectName) => {} */
    set onTileClick(fn) { this._onTileClick = fn }

    /**
     * Initialize the grid with 9 tiles.
     * Each tile gets a canvas and renderer.
     */
    async init() {
        if (this._initialized) return

        this._container.innerHTML = ''

        for (let i = 0; i < 9; i++) {
            const tile = document.createElement('div')
            tile.className = 'grid-tile'
            tile.dataset.index = i

            const canvas = document.createElement('canvas')
            canvas.width = this._tileWidth
            canvas.height = this._tileHeight
            tile.appendChild(canvas)

            const label = document.createElement('div')
            label.className = 'tile-label'
            tile.appendChild(label)

            tile.addEventListener('click', () => {
                this._onTileClick?.(i, this._tiles[i]?.name)
            })

            this._container.appendChild(tile)

            const renderer = new PhotobombRenderer(canvas, {
                width: this._tileWidth,
                height: this._tileHeight
            })
            await renderer.init()
            renderer.setVideoSource(this._videoSource)

            this._tiles.push({ canvas, renderer, name: '', label })
        }

        this._initialized = true
    }

    /**
     * Load a set of 9 effects into the grid.
     * @param {Array<{name: string, dsl: string}>} effects - 9 effect definitions
     */
    async loadEffects(effects) {
        const promises = effects.map(async (effect, i) => {
            const tile = this._tiles[i]
            if (!tile) return
            tile.name = effect.name
            tile.label.textContent = effect.name
            try {
                await tile.renderer.compile(effect.dsl)
            } catch (err) {
                console.error(`[Grid] Failed to compile effect "${effect.name}":`, err)
            }
        })
        await Promise.all(promises)
    }

    /** Stop all renderers (e.g. when switching to full-size view) */
    stopAll() {
        for (const tile of this._tiles) {
            tile.renderer.stop()
        }
    }

    /** Resume all renderers (e.g. when returning from full-size view) */
    resumeAll() {
        for (const tile of this._tiles) {
            tile.renderer.resume()
        }
    }

    /** Clean up all renderers */
    destroy() {
        for (const tile of this._tiles) {
            tile.renderer.destroy()
        }
        this._tiles = []
        this._container.innerHTML = ''
    }
}
