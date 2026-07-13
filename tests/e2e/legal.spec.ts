import { test, expect } from '@playwright/test'

// Legal pages (sprint12072026license §3): the privacy policy and terms of
// service must render server-side in both locales and be reachable from the
// home footer, the register form and the booking confirm step.

test('privacy policy renders in English', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'What we collect' })).toBeVisible()
})

test('privacy policy renders in Portuguese', async ({ page }) => {
  await page.goto('/pt-BR/privacy')
  await expect(page.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'O que coletamos' })).toBeVisible()
})

test('terms of service render in English', async ({ page }) => {
  await page.goto('/terms')
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Demo / portfolio environments' })).toBeVisible()
})

test('terms of service render in Portuguese', async ({ page }) => {
  await page.goto('/pt-BR/terms')
  await expect(page.getByRole('heading', { level: 1, name: 'Termos de Serviço' })).toBeVisible()
})

test('home footer links to both legal pages', async ({ page }) => {
  await page.goto('/')

  await page.locator('footer').getByRole('link', { name: 'Privacy Policy' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
  await expect(page).toHaveURL(/\/privacy$/)

  await page.goBack()

  await page.locator('footer').getByRole('link', { name: 'Terms of Service' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible()
  await expect(page).toHaveURL(/\/terms$/)
})

test('register page shows the consent notice with working links', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByText('By creating an account, you agree to the')).toBeVisible()
  await page.getByRole('link', { name: 'Terms of Service' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeVisible()
})
