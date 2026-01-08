/**
 * Component tests for components/ui/card.tsx
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card'

describe('Card', () => {
  it('should render card element', () => {
    render(<Card data-testid="test-card">Card content</Card>)
    expect(screen.getByTestId('test-card')).toBeInTheDocument()
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class" data-testid="test-card" />)
    const card = container.querySelector('[data-slot="card"]')
    expect(card?.className).toContain('custom-class')
  })
})

describe('CardHeader', () => {
  it('should render card header', () => {
    render(
      <Card>
        <CardHeader data-testid="test-header">Header content</CardHeader>
      </Card>
    )
    expect(screen.getByTestId('test-header')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('should render card title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('should render card description', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Card description text</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Card description text')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('should render card content', () => {
    render(
      <Card>
        <CardContent data-testid="test-content">Main content</CardContent>
      </Card>
    )
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('should render card footer', () => {
    render(
      <Card>
        <CardFooter data-testid="test-footer">Footer content</CardFooter>
      </Card>
    )
    expect(screen.getByTestId('test-footer')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})

describe('CardAction', () => {
  it('should render card action', () => {
    render(
      <Card>
        <CardHeader>
          <CardAction data-testid="test-action">Action button</CardAction>
        </CardHeader>
      </Card>
    )
    expect(screen.getByTestId('test-action')).toBeInTheDocument()
  })
})

describe('Card Composition', () => {
  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card</CardDescription>
        </CardHeader>
        <CardContent>Main content area</CardContent>
        <CardFooter>Footer area</CardFooter>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('This is a test card')).toBeInTheDocument()
    expect(screen.getByText('Main content area')).toBeInTheDocument()
    expect(screen.getByText('Footer area')).toBeInTheDocument()
  })
})


