import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test('有効な職員IDでログインできる', async ({ page }) => {
    // Arrange
    await page.goto('/?staffId=admin001')

    // Assert - ダッシュボードが表示される
    await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()
    await expect(page.locator('text=管理者')).toBeVisible()
  })

  test('無効な職員IDでログインできない', async ({ page }) => {
    // Arrange
    await page.goto('/?staffId=invalid_id_xyz')

    // Assert - エラーメッセージまたはNot Foundページが表示される
    await expect(
      page.locator('text=職員が見つかりません').or(page.locator('text=Not Found'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('職員IDなしでアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    // Arrange
    await page.goto('/')

    // Assert
    const url = page.url()
    expect(url).toContain('staffId')
  })

  test('ログアウトボタンが機能する', async ({ page }) => {
    // Arrange
    await page.goto('/?staffId=admin001')
    await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()

    // Act
    await page.click('button:has-text("ログアウト")')

    // Assert
    await expect(page).toHaveURL(/staffId/)
  })
})

test.describe('ダッシュボード表示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?staffId=admin001')
    await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()
  })

  test('外来患者数グラフが表示される', async ({ page }) => {
    // Assert
    await expect(page.locator('text=外来患者数')).toBeVisible()
    
    // グラフが描画されているか確認（Rechartsのsvg要素）
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
  })

  test('入院患者数グラフが表示される', async ({ page }) => {
    // Assert
    await expect(page.locator('text=入院患者数')).toBeVisible()
    
    // グラフが描画されているか確認
    const charts = page.locator('svg')
    await expect(charts).toHaveCount(2, { timeout: 5000 }) // 外来と入院の2つ
  })

  test('詳細ページへ遷移できる', async ({ page }) => {
    // Act - 外来詳細をクリック
    await page.click('a:has-text("外来患者")')

    // Assert
    await expect(page).toHaveURL(/\/outpatient/)
    await expect(page.locator('text=外来患者ダッシュボード')).toBeVisible()
  })
})

test.describe('外来患者ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/outpatient?staffId=admin001')
  })

  test('診療科別データが表示される', async ({ page }) => {
    // Assert
    await expect(page.locator('text=診療科別')).toBeVisible()
    
    // 診療科名が表示されているか確認
    await expect(page.locator('text=内科')).toBeVisible({ timeout: 5000 })
  })

  test('期間フィルターが機能する', async ({ page }) => {
    // Arrange
    const startDate = page.locator('input[type="date"]').first()
    const endDate = page.locator('input[type="date"]').last()

    // Act
    await startDate.fill('2024-01-01')
    await endDate.fill('2024-01-31')
    await page.click('button:has-text("適用")')

    // Assert - データが再読み込みされる
    await page.waitForTimeout(1000)
    const charts = page.locator('svg')
    await expect(charts.first()).toBeVisible()
  })

  test('クイック期間選択が機能する', async ({ page }) => {
    // Act
    await page.click('button:has-text("過去7日")')

    // Assert - グラフが更新される
    await page.waitForTimeout(500)
    const charts = page.locator('svg')
    await expect(charts.first()).toBeVisible()
  })
})

test.describe('入院患者ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inpatient?staffId=admin001')
  })

  test('病棟別データが表示される', async ({ page }) => {
    // Assert
    await expect(page.locator('text=病棟別')).toBeVisible()
    
    // 病棟名が表示されているか確認
    await expect(page.locator('text=階病棟')).toBeVisible({ timeout: 5000 })
  })

  test('稼働率が表示される', async ({ page }) => {
    // Assert
    await expect(page.locator('text=稼働率')).toBeVisible({ timeout: 5000 })
    
    // パーセンテージが表示されているか確認
    await expect(page.locator('text=%')).toBeVisible()
  })
})

test.describe('売上ページ', () => {
  test('権限レベル90以上でアクセスできる', async ({ page }) => {
    // Arrange - 事務部長（権限90）でログイン
    await page.goto('/?staffId=director001')
    await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()

    // Act - 売上ページに遷移
    await page.click('a:has-text("売上")')

    // Assert
    await expect(page).toHaveURL(/\/sales/)
    await expect(page.locator('text=売上ダッシュボード')).toBeVisible()
  })

  test('権限レベル90未満でアクセスできない', async ({ page }) => {
    // Arrange - 医師（権限10）でログイン
    await page.goto('/?staffId=doctor001')
    
    // Assert - 売上リンクが表示されない
    const salesLink = page.locator('a:has-text("売上")')
    await expect(salesLink).not.toBeVisible({ timeout: 2000 })
  })

  test('3つの売上グラフが表示される', async ({ page }) => {
    // Arrange
    await page.goto('/sales?staffId=admin001')
    await expect(page.locator('text=売上ダッシュボード')).toBeVisible()

    // Assert
    await expect(page.locator('text=全体')).toBeVisible()
    await expect(page.locator('text=外来')).toBeVisible()
    await expect(page.locator('text=入院')).toBeVisible()
    
    // グラフが3つ表示されているか確認
    const charts = page.locator('svg')
    await expect(charts).toHaveCount(3, { timeout: 5000 })
  })

  test('診療科フィルターが機能する', async ({ page }) => {
    // Arrange
    await page.goto('/sales?staffId=admin001')
    
    // Act
    await page.selectOption('select', { label: '内科' })

    // Assert - 医師別積み上げグラフが表示される
    await page.waitForTimeout(1000)
    await expect(page.locator('text=医師別')).toBeVisible({ timeout: 5000 })
  })

  test('前年比較データが表示される', async ({ page }) => {
    // Arrange
    await page.goto('/sales?staffId=admin001')

    // Assert
    await expect(page.locator('text=前年')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('レスポンシブデザイン', () => {
  test('モバイル画面で正しくレイアウトされる', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/?staffId=admin001')

    // Assert
    await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()
    
    // グラフが縦並びになっているか確認（高さ方向に並んでいる）
    const charts = page.locator('svg')
    const firstChart = charts.first()
    const lastChart = charts.last()
    
    const firstBox = await firstChart.boundingBox()
    const lastBox = await lastChart.boundingBox()
    
    if (firstBox && lastBox) {
      expect(lastBox.y).toBeGreaterThan(firstBox.y)
    }
  })

  test('タブレット画面で正しくレイアウトされる', async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/?staffId=admin001')

    // Assert
    await expect(page.locator('text=病院管理ダッシュボード')).toBeVisible()
  })
})
