/**
 * Hook tests for useFormActions.
 * Tests hook return shape and step boundaries; full flow requires mocked router/actions.
 */

import { renderHook, act } from '@testing-library/react'
import { useFormActions } from '@/components/apps/assets/hooks/useFormActions'
import type { Asset } from '@/types/assets'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/app/(app)/assets/actions', () => ({
  createAsset: jest.fn(),
  updateAsset: jest.fn(),
  uploadAssetImages: jest.fn(),
  uploadAssetAttachments: jest.fn(),
  setAssetRelations: jest.fn(),
}))

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock('@/components/apps/assets/utils/transform', () => ({
  transformToCreateDto: (d: unknown) => d,
  transformToUpdateDto: (d: unknown) => d,
  transformToCalendarAlertCreateUpdateDto: (d: unknown) => d,
}))

const defaultFormData: Partial<Asset> = {
  name: 'Test Asset',
  category: { id: 1, name: 'Laptop' } as Asset['category'],
  asset_tag: null,
  status: 'in_use' as Asset['status'],
}

describe('useFormActions', () => {
  it('should return expected shape', () => {
    const { result } = renderHook(() =>
      useFormActions(null, defaultFormData, 'create')
    )
    expect(result.current).toHaveProperty('currentStep')
    expect(result.current).toHaveProperty('handleNext')
    expect(result.current).toHaveProperty('handlePrevious')
    expect(result.current).toHaveProperty('handleSave')
    expect(result.current).toHaveProperty('handleStepClick')
    expect(result.current).toHaveProperty('isSubmitting')
    expect(typeof result.current.handleNext).toBe('function')
    expect(typeof result.current.handlePrevious).toBe('function')
    expect(typeof result.current.handleSave).toBe('function')
  })

  it('should initialize with currentStep 0 for create mode', () => {
    const { result } = renderHook(() =>
      useFormActions(null, defaultFormData, 'create')
    )
    expect(result.current.currentStep).toBe(0)
  })

  it('should not go above max step on handleNext when validation fails', () => {
    const { result } = renderHook(() =>
      useFormActions(null, { ...defaultFormData, name: '' }, 'create')
    )
    expect(result.current.currentStep).toBe(0)
    act(() => {
      result.current.handleNext()
    })
    expect(result.current.currentStep).toBe(0)
  })

  it('should not go below step 0 on handlePrevious', () => {
    const { result } = renderHook(() =>
      useFormActions(null, defaultFormData, 'create')
    )
    act(() => {
      result.current.handlePrevious()
    })
    expect(result.current.currentStep).toBe(0)
  })
})

