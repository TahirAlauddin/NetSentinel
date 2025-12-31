/**
 * Component tests for components/apps/assets/shared/form/AssetFormTip.tsx
 * 
 * Tests cover:
 * - Tip rendering
 * - Message display
 */

import { render, screen } from '@/tests/__utils__/test-utils'
import AssetFormTip from '@/components/apps/assets/shared/form/AssetFormTip'

describe('AssetFormTip', () => {
  it('should render tip message', () => {
    render(<AssetFormTip />)

    expect(screen.getByText(/tips and tricks/i)).toBeInTheDocument()
  })
})

