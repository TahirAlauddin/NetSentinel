/**
 * Component tests for components/ui/badge.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  it('should render badge with text', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('should apply default variant styles', () => {
    const { container } = render(<Badge>Default Badge</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.className).toContain('bg-primary')
  })

  it('should apply secondary variant', () => {
    const { container } = render(<Badge variant="secondary">Secondary Badge</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.className).toContain('bg-secondary')
  })

  it('should apply destructive variant', () => {
    const { container } = render(<Badge variant="destructive">Destructive Badge</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.className).toContain('bg-destructive')
  })

  it('should apply outline variant', () => {
    const { container } = render(<Badge variant="outline">Outline Badge</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.className).toContain('text-foreground')
  })

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom Badge</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge?.className).toContain('custom-class')
  })

  it('should render as child component when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    )
    const link = screen.getByRole('link', { name: /link badge/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })
})


