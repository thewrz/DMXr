import { describe, it, expect } from 'vitest'
import {
  readStylesheet,
  cssContains,
  extractPropertyValue,
} from './css-parser.js'

describe('CSS Theme — SignalRGB Aesthetic', () => {
  const css = readStylesheet()

  describe('Decorative elements removed', () => {
    it('has no togglePulse animation', () => {
      expect(cssContains(css, 'togglePulse')).toBe(false)
    })

    it('has no inset shadow on fixture cards', () => {
      const shadow = extractPropertyValue(css, '.fixture-card', 'box-shadow')
      expect(shadow).toBeNull()
    })

    it('has no brightness(1.4) on fixture highlight', () => {
      expect(cssContains(css, 'brightness(1.4)')).toBe(false)
    })

    it('uses subtle outline for fixture highlight', () => {
      const filter = extractPropertyValue(
        css,
        '.channel-cell.fixture-highlight',
        'filter'
      )
      expect(filter).toBe('brightness(1.15)')
    })
  })

  describe('Fixture cards — flat style', () => {
    it('uses top border instead of left border', () => {
      const borderTop = extractPropertyValue(
        css,
        '.fixture-card',
        'border-top'
      )
      expect(borderTop).toBe('2px solid var(--card-color)')
      const borderLeft = extractPropertyValue(
        css,
        '.fixture-card',
        'border-left'
      )
      expect(borderLeft).toBeNull()
    })
  })

  describe('Structural selectors preserved', () => {
    const requiredSelectors = [
      '.fixture-card',
      '.channel-grid',
      '.modal-overlay',
      '.sidebar',
      '.app-layout',
      '.btn:hover',
      '.btn:disabled',
      '.drop-target-valid',
      '.drop-target-invalid',
      '.fixture-highlight',
    ]

    for (const sel of requiredSelectors) {
      it(`contains ${sel}`, () => {
        expect(cssContains(css, sel)).toBe(true)
      })
    }
  })
})
