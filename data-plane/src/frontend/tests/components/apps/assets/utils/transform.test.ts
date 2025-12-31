/**
 * Tests for components/apps/assets/utils/transform.ts
 * 
 * Tests cover:
 * - transformToCreateDto function
 * - transformToUpdateDto function
 * - transformToCalendarAlertCreateUpdateDto function
 * - ID extraction and transformation
 * - Empty string to null conversion
 * - Read-only field removal
 */

import {
  transformToCreateDto,
  transformToUpdateDto,
  transformToCalendarAlertCreateUpdateDto,
} from '@/components/apps/assets/utils/transform'
import { Asset, CalendarAlert } from '@/types/assets'

describe('transform', () => {
  describe('transformToCreateDto', () => {
    it('should transform asset with required fields', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
      }

      const result = transformToCreateDto(asset)

      expect(result.name).toBe('Test Asset')
      expect(result.category).toBe(1)
      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('created_at')
      expect(result).not.toHaveProperty('updated_at')
    })

    it('should throw error when name is missing', () => {
      const asset = {
        category: 1,
      }

      expect(() => transformToCreateDto(asset)).toThrow('Asset name is required')
    })

    it('should throw error when name is empty string', () => {
      const asset = {
        name: '',
        category: 1,
      }

      expect(() => transformToCreateDto(asset)).toThrow('Asset name is required')
    })

    it('should throw error when name is whitespace only', () => {
      const asset = {
        name: '   ',
        category: 1,
      }

      expect(() => transformToCreateDto(asset)).toThrow('Asset name is required')
    })

    it('should throw error when category is missing', () => {
      const asset = {
        name: 'Test Asset',
      }

      expect(() => transformToCreateDto(asset)).toThrow('Asset category is required')
    })

    it('should transform category from object with id', () => {
      const asset = {
        name: 'Test Asset',
        category: { id: 5 },
      }

      const result = transformToCreateDto(asset)
      expect(result.category).toBe(5)
    })

    it('should transform category from string id', () => {
      const asset = {
        name: 'Test Asset',
        category: '10',
      }

      const result = transformToCreateDto(asset)
      expect(result.category).toBe(10)
    })

    it('should remove read-only fields', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        id: 999,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        images: [],
        attachments: [],
        related_items: [],
        calendar_alerts: [],
      }

      const result = transformToCreateDto(asset)

      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('created_at')
      expect(result).not.toHaveProperty('updated_at')
      expect(result).not.toHaveProperty('images')
      expect(result).not.toHaveProperty('attachments')
      expect(result).not.toHaveProperty('related_items')
      expect(result).not.toHaveProperty('calendar_alerts')
    })

    it('should convert empty strings to null for optional fields', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        asset_tag: '',
        notes: '',
        mac_address: '',
      }

      const result = transformToCreateDto(asset)

      expect(result.asset_tag).toBeNull()
      expect(result.notes).toBeNull()
      expect(result.mac_address).toBeNull()
    })

    it('should transform vendor from object to id', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        vendor: { id: 2 },
      }

      const result = transformToCreateDto(asset)
      expect(result.vendor).toBe(2)
    })

    it('should transform vendor from string to id', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        vendor: '3',
      }

      const result = transformToCreateDto(asset)
      expect(result.vendor).toBe(3)
    })

    it('should preserve undefined vendor for partial updates', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        vendor: undefined,
      }

      const result = transformToCreateDto(asset)
      expect(result.vendor).toBeUndefined()
    })

    it('should transform tags array', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        tags: [{ id: 1 }, { id: 2 }, '3'],
      }

      const result = transformToCreateDto(asset)
      expect(result.tags).toEqual([1, 2, 3])
    })

    it('should handle empty tags array', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        tags: [],
      }

      const result = transformToCreateDto(asset)
      expect(result.tags).toEqual([])
    })

    it('should handle undefined tags', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        tags: undefined,
      }

      const result = transformToCreateDto(asset)
      expect(result.tags).toEqual([])
    })

    it('should transform departments array', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        departments: [{ id: 1 }, { id: 2 }],
      }

      const result = transformToCreateDto(asset)
      expect(result.departments).toEqual([1, 2])
    })

    it('should remove undefined values', () => {
      const asset = {
        name: 'Test Asset',
        category: 1,
        vendor: undefined,
        location: undefined,
      }

      const result = transformToCreateDto(asset)
      expect(result.vendor).toBeUndefined()
      expect('location' in result).toBe(false)
    })
  })

  describe('transformToUpdateDto', () => {
    it('should transform partial asset update', () => {
      const asset = {
        name: 'Updated Asset',
      }

      const result = transformToUpdateDto(asset)

      expect(result.name).toBe('Updated Asset')
      expect(result).not.toHaveProperty('id')
    })

    it('should allow optional category for updates', () => {
      const asset = {
        name: 'Updated Asset',
        category: 2,
      }

      const result = transformToUpdateDto(asset)
      expect(result.category).toBe(2)
    })

    it('should not require category for updates', () => {
      const asset = {
        name: 'Updated Asset',
      }

      expect(() => transformToUpdateDto(asset)).not.toThrow()
    })

    it('should transform category from object', () => {
      const asset = {
        category: { id: 5 },
      }

      const result = transformToUpdateDto(asset)
      expect(result.category).toBe(5)
    })

    it('should remove read-only fields', () => {
      const asset = {
        name: 'Updated Asset',
        id: 999,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      const result = transformToUpdateDto(asset)

      expect(result).not.toHaveProperty('id')
      expect(result).not.toHaveProperty('created_at')
      expect(result).not.toHaveProperty('updated_at')
    })

    it('should convert empty strings to null', () => {
      const asset = {
        asset_tag: '',
        notes: '',
      }

      const result = transformToUpdateDto(asset)

      expect(result.asset_tag).toBeNull()
      expect(result.notes).toBeNull()
    })

    it('should remove undefined values', () => {
      const asset = {
        name: 'Updated Asset',
        vendor: undefined,
      }

      const result = transformToUpdateDto(asset)
      expect('vendor' in result).toBe(false)
    })
  })

  describe('transformToCalendarAlertCreateUpdateDto', () => {
    it('should transform calendar alert with all fields', () => {
      const alert: CalendarAlert = {
        id: 1,
        date: '2024-12-31',
        message: 'Test message',
        assigned_to: { id: 2, first_name: 'Test', last_name: 'User', email: 'test@example.com', username: 'testuser', is_staff: false, is_active: true, is_superuser: false, date_joined: '2024-01-01', last_login: '2024-01-01' },
      }

      const result = transformToCalendarAlertCreateUpdateDto(alert)

      expect(result.id).toBe(1)
      expect(result.date).toBe('2024-12-31')
      expect(result.message).toBe('Test message')
      expect(result.assigned_to).toBe(2)
    })

    it('should transform calendar alert with number assigned_to', () => {
      const alert: Partial<CalendarAlert> = {
        date: '2024-12-31',
        message: 'Test message',
        assigned_to: 5,
      }

      const result = transformToCalendarAlertCreateUpdateDto(alert)

      expect(result.assigned_to).toBe(5)
    })

    it('should handle undefined assigned_to', () => {
      const alert: Partial<CalendarAlert> = {
        date: '2024-12-31',
        message: 'Test message',
      }

      const result = transformToCalendarAlertCreateUpdateDto(alert)

      expect(result.assigned_to).toBeUndefined()
    })

    it('should transform assigned_to from string id', () => {
      const alert: Partial<CalendarAlert> = {
        date: '2024-12-31',
        message: 'Test message',
        assigned_to: '10',
      }

      const result = transformToCalendarAlertCreateUpdateDto(alert)

      expect(result.assigned_to).toBe(10)
    })
  })
})

