import { test, expect } from '@playwright/test'

test.describe('Photobomb', () => {
    test('loads and shows grid view', async ({ page, context }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await context.grantPermissions(['camera'])

        await page.goto('/')
        await expect(page.locator('.grid-container')).toBeVisible()
        await expect(page.locator('.grid-tile')).toHaveCount(9)
        await expect(page.locator('.tab-btn')).toHaveCount(2)
    })

    test('switches tabs', async ({ page, context }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await context.grantPermissions(['camera'])
        await page.goto('/')

        const distortionsTab = page.locator('.tab-btn', { hasText: 'Distortions' })
        await distortionsTab.click()
        await expect(distortionsTab).toHaveClass(/active/)
    })

    test('shows 8 tiles on mobile viewport', async ({ page, context }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await context.grantPermissions(['camera'])
        await page.goto('/')
        await expect(page.locator('.grid-tile')).toHaveCount(8)
    })
})
