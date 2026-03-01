/**
 * Photobomb — Photo Booth clone powered by Noisemaker
 */

import { PhotobombRenderer } from './noisemaker/index.js'
import { Camera } from './camera.js'
import { EffectGrid } from './grid.js'
import { TABS, getEffect } from './effects.js'

class PhotobombApp {
    constructor() {
        this._initialized = false
        this._camera = new Camera()
        this._grid = null
        this._fullsizeRenderer = null
        this._currentTab = 0
        this._currentEffect = null
        this._mode = 'photo' // 'photo' | 'video'
        this._view = 'grid'  // 'grid' | 'fullsize'
    }

    async init() {
        if (this._initialized) return
        console.log('[Photobomb] Initializing...')

        // Start camera
        await this._camera.start()
        console.log(`[Photobomb] Camera: ${this._camera.width}x${this._camera.height}`)

        // Initialize grid
        const gridContainer = document.getElementById('effect-grid')
        this._grid = new EffectGrid(gridContainer, this._camera.video)
        await this._grid.init()

        // Set up tile click handler
        this._grid.onTileClick = (index, name) => this._enterFullsize(index)

        // Build tab buttons
        this._buildTabs()

        // Load default tab effects
        await this._switchTab(0)

        // Initialize full-size renderer
        const fullsizeCanvas = document.getElementById('fullsize-canvas')
        this._fullsizeRenderer = new PhotobombRenderer(fullsizeCanvas, {
            width: this._camera.width,
            height: this._camera.height
        })
        await this._fullsizeRenderer.init()
        this._fullsizeRenderer.setVideoSource(this._camera.video)

        // Wire up controls
        this._setupControls()

        this._initialized = true
        console.log('[Photobomb] Ready')
    }

    _buildTabs() {
        const tabBar = document.getElementById('tab-bar')
        tabBar.innerHTML = ''
        TABS.forEach((tab, i) => {
            const btn = document.createElement('button')
            btn.className = 'tab-btn' + (i === 0 ? ' active' : '')
            btn.textContent = tab.name
            btn.addEventListener('click', () => this._switchTab(i))
            tabBar.appendChild(btn)
        })
    }

    async _switchTab(tabIndex) {
        this._currentTab = tabIndex
        const effects = TABS[tabIndex].effects

        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === tabIndex)
        })

        await this._grid.loadEffects(effects)
    }

    async _enterFullsize(tileIndex) {
        const effect = getEffect(this._currentTab, tileIndex)
        this._currentEffect = { ...effect, tileIndex }

        // Stop grid renderers
        this._grid.stopAll()

        // Compile full-size renderer with selected effect
        const fullsizeCanvas = document.getElementById('fullsize-canvas')
        fullsizeCanvas.width = this._camera.width
        fullsizeCanvas.height = this._camera.height
        this._fullsizeRenderer.resize(this._camera.width, this._camera.height)
        await this._fullsizeRenderer.compile(effect.dsl)

        // Update UI
        document.getElementById('effect-name').textContent = effect.name
        document.getElementById('grid-view').classList.add('hidden')
        document.getElementById('fullsize-view').classList.remove('hidden')
        this._view = 'fullsize'
    }

    async _exitFullsize() {
        // Stop full-size renderer
        this._fullsizeRenderer.stop()

        // Show grid, resume renderers
        document.getElementById('fullsize-view').classList.add('hidden')
        document.getElementById('grid-view').classList.remove('hidden')
        this._view = 'grid'

        await this._grid.resumeAll()
    }

    _setupControls() {
        // Grid back button
        document.getElementById('grid-back-btn').addEventListener('click', () => {
            this._exitFullsize()
        })

        // Mode toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._mode = btn.dataset.mode
                document.querySelectorAll('.mode-btn').forEach(b =>
                    b.classList.toggle('active', b === btn))
                const shutter = document.getElementById('shutter-btn')
                shutter.classList.toggle('video-mode', this._mode === 'video')
            })
        })

        // Shutter button (capture wired in Task 7/8)
        document.getElementById('shutter-btn').addEventListener('click', () => {
            console.log(`[Photobomb] Capture: ${this._mode}`)
        })
    }
}

const app = new PhotobombApp()
app.init().catch(err => console.error('[Photobomb] Init failed:', err))
