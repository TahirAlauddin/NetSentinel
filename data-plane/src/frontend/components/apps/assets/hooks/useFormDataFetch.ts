/**
 * Custom hook for fetching form-related data
 */

import { useState, useEffect } from "react"
import { api } from "@/lib/utils"
import { UserRecord } from "@/types/users"
import { LocationRecord } from "@/types/locations"
import { DepartmentRecord } from "@/types/departments"
import { CustomLifecycle } from "@/types/assets"

interface UseFormDataFetchResult {
  users: UserRecord[]
  locations: LocationRecord[]
  departments: DepartmentRecord[]
  customLifecycles: CustomLifecycle[]
  loading: boolean
  error: string | null
}

interface UseFormPeopleFetchResult {
  people: UserRecord[]
  loading: boolean
  error: string | null
}

interface UseFormLocationsFetchResult {
  locations: LocationRecord[]
  loading: boolean
  error: string | null
}

interface UseFormDepartmentsFetchResult {
  departments: DepartmentRecord[]
  loading: boolean
  error: string | null
}

interface UseFormLifecyclesFetchResult {
  customLifecycles: CustomLifecycle[]
  loading: boolean
  error: string | null
}

/**
 * Helper function to extract data from API response
 */
function extractData<T>(responseData: T[] | { results: T[] } | undefined): T[] {
  if (!responseData) return []
  return Array.isArray(responseData) ? responseData : (responseData as any).results || []
}

/**
 * Hook for fetching users/people
 */
export function useFormPeopleFetch(): UseFormPeopleFetchResult {
  const [people, setPeople] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get<UserRecord[] | { results: UserRecord[] }>("/auth/users/")
        if (response.data) {
          const peopleData = extractData(response.data)
          setPeople(peopleData)
        }
      } catch (err) {
        console.error("Failed to fetch people:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch people")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    people,
    loading,
    error,
  }
}

/**
 * Hook for fetching locations
 */
export function useFormLocationsFetch(): UseFormLocationsFetchResult {
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get<LocationRecord[] | { results: LocationRecord[] }>(
          "/infrastructure/locations/"
        )
        if (response.data) {
          const locationsData = extractData(response.data)
          setLocations(locationsData)
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch locations")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    locations,
    loading,
    error,
  }
}

/**
 * Hook for fetching departments
 */
export function useFormDepartmentsFetch(): UseFormDepartmentsFetchResult {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get<DepartmentRecord[] | { results: DepartmentRecord[] }>(
          "/infrastructure/departments/"
        )
        if (response.data) {
          const departmentsData = extractData(response.data)
          setDepartments(departmentsData)
        }
      } catch (err) {
        console.error("Failed to fetch departments:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch departments")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    departments,
    loading,
    error,
  }
}

/**
 * Hook for fetching custom lifecycles
 */
export function useFormLifecyclesFetch(): UseFormLifecyclesFetchResult {
  const [customLifecycles, setCustomLifecycles] = useState<CustomLifecycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const response = await api.get<CustomLifecycle[] | { results: CustomLifecycle[] }>(
          "/assets/lifecycles/"
        )
        if (response.data) {
          const lifecyclesData = extractData(response.data)
          setCustomLifecycles(lifecyclesData)
        }
      } catch (err) {
        console.error("Failed to fetch lifecycles:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch lifecycles")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return {
    customLifecycles,
    loading,
    error,
  }
}

/**
 * Hook for fetching all form data (users, locations, departments, and lifecycles)
 * This hook combines all individual hooks for convenience
 */
export function useFormDataFetch(): UseFormDataFetchResult {
  const { people: users, loading: loadingUsers, error: usersError } = useFormPeopleFetch()
  const { locations, loading: loadingLocations, error: locationsError } = useFormLocationsFetch()
  const { departments, loading: loadingDepartments, error: departmentsError } = useFormDepartmentsFetch()
  const { customLifecycles, loading: loadingLifecycles, error: lifecyclesError } = useFormLifecyclesFetch()

  const loading = loadingUsers || loadingLocations || loadingDepartments || loadingLifecycles
  const error = usersError || locationsError || departmentsError || lifecyclesError

  return {
    users,
    locations,
    departments,
    customLifecycles,
    loading,
    error,
  }
}

//////////////////////////////////////////////////////////////////////////
/*
Hooks for getting props in each step of the form.
*/
//////////////////////////////////////////////////////////////////////////

import { useAssetForm } from "../shared/form/AssetFormContext"
import {
  BasicDetailsStepFormData,
  TechSpecsStepFormData,
  LocationAndUsageStepFormData,
  CostDepreciationStepFormData,
  WarrantyAcquisitionStepFormData,
  AlertsStepFormData,
  AdditionalDetailsStepFormData,
} from "@/types/assets"

export function useBasicDetailsStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      name: formData.name,
      category: formData.category,
      asset_tag: formData.asset_tag,
      impact: formData.impact,
      vendor: formData.vendor,
      notes: formData.notes,
    } as BasicDetailsStepFormData,
    onInputChange: updateField,
  }
}

export function useTechSpecsStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      mac_address: formData.mac_address,
      ip_address: formData.ip_address,
      manufacturer: formData.manufacturer,
      model: formData.model,
      tags: formData.tags,
    } as TechSpecsStepFormData,
    onInputChange: updateField,
  }
}

export function useLocationAndUsageStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      in_current_state_since: formData.in_current_state_since,
      expected_checkin_date: formData.expected_checkin_date,
      used_by: formData.used_by,
      managed_by: formData.managed_by,
      location: formData.location,
      departments: formData.departments,
    } as LocationAndUsageStepFormData,
    onInputChange: updateField,
  }
}

export function useCostDepreciationStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      custom_lifecycle: formData.custom_lifecycle,
      purchase_price: formData.purchase_price,
      replacement_cost: formData.replacement_cost,
      salvage_value: formData.salvage_value,
      useful_life_years: formData.useful_life_years,
      approaching_eol_months: formData.approaching_eol_months,
      po_number: formData.po_number,
    } as CostDepreciationStepFormData,
    onInputChange: updateField,
  }
}

export function useWarrantyAcquisitionStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      machine_serial_number: formData.machine_serial_number,
      product_number: formData.product_number,
      acquisition_date: formData.acquisition_date,
      warranty_expiration: formData.warranty_expiration,
      installation_date: formData.installation_date,
    } as WarrantyAcquisitionStepFormData,
    onInputChange: updateField,
  }
}

export function useAlertsStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      asset_id: formData.id,
      calendar_alerts: formData.calendar_alerts,
    } as AlertsStepFormData,
    onInputChange: updateField,
  }
}

export function useAdditionalDetailsStep() {
  const { formData, updateField } = useAssetForm()
  return {
    formData: {
      asset_id: formData.id,
      images: formData.images,
      attachments: formData.attachments,
      related_items: formData.related_items,
    } as AdditionalDetailsStepFormData,
    onInputChange: updateField,
  }
}