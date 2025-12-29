"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  useFormDepartmentsFetch,
  useFormLocationsFetch,
  useFormPeopleFetch,
  useLocationAndUsageStep,
} from "../hooks/useFormDataFetch";
import { DepartmentRecord } from "@/types/departments";

const LocationAndUsageStep = () => {
  const router = useRouter();
  const { formData, onInputChange } = useLocationAndUsageStep();
  const { people, loading, error } = useFormPeopleFetch();
  const { locations, loading: loadingLocations, error: errorLocations } = useFormLocationsFetch();
  const {
    departments,
    loading: loadingDepartments,
    error: errorDepartments,
  } = useFormDepartmentsFetch();


  return (
    <div className="space-y-6 overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold text-gray-900">Location & Usage</h2>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          In current state since
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            value={formData.in_current_state_since || ""}
            onChange={(e) => onInputChange("in_current_state_since", e.target.value)}
            className="w-full pl-10 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Expected check-in date <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            type="date"
            value={formData.expected_checkin_date || ""}
            onChange={(e) => onInputChange("expected_checkin_date", e.target.value)}
            className="w-full pl-10 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Used by <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={formData.used_by?.id.toString() || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId === "") {
                onInputChange("used_by", null);
              } else {
                const selectedPerson = people.find((p) => p.id.toString() === selectedId);
                if (selectedPerson) {
                  onInputChange("used_by", selectedPerson);
                }
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none pr-10"
          >
            <option value="">Select People</option>
            {loading ? (
              <option value="">Loading...</option>
            ) : error ? (
              <option value="">Error loading people</option>
            ) : (
              people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.first_name} {person.last_name} ({person.email})
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Managed by <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={formData.managed_by?.id.toString() || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId === "") {
                onInputChange("managed_by", null);
              } else {
                const selectedPerson = people.find((p) => p.id.toString() === selectedId);
                if (selectedPerson) {
                  onInputChange("managed_by", selectedPerson);
                }
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none pr-10"
          >
            <option value="">Select People</option>
            {loading ? (
              <option value="">Loading...</option>
            ) : error ? (
              <option value="">Error loading people</option>
            ) : (
              people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.first_name} {person.last_name} ({person.email})
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Location <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={formData.location?.id.toString() || ""}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId === "") {
                onInputChange("location", null);
              } else {
                const selectedLocation = locations.find((l) => l.id.toString() === selectedId);
                if (selectedLocation) {
                  onInputChange("location", selectedLocation);
                }
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm appearance-none pr-10"
          >
            <option value="">Select location</option>
            {loadingLocations ? (
              <option value="">Loading...</option>
            ) : errorLocations ? (
              <option value="">Error loading locations</option>
            ) : (
              locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.city} - {location.address1}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Missing a location?{" "}
          <button
            type="button"
            onClick={() => router.push("/settings/locations")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            + Create One
          </button>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Departments <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <div className="relative">
          <select
            multiple
            value={
              Array.isArray(formData.departments)
                ? formData.departments.map((d: DepartmentRecord) => d.id.toString())
                : []
            }
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              const selectedDepartments = selected.map((id: string) => departments.find((d) => d.id.toString() === id));
              onInputChange("departments", selectedDepartments);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 min-h-[100px]"
          >
            {loadingDepartments ? (
              <option value="">Loading...</option>
            ) : errorDepartments ? (
              <option value="">Error loading departments</option>
            ) : departments.length === 0 ? (
              <option value="" disabled>
                No departments available
              </option>
            ) : (
              departments.map((dept) => (
                <option key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </option>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          You can also add a new department from{" "}
          <button
            type="button"
            onClick={() => router.push("/settings/departments")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            here
          </button>
          .
        </p>
        {Array.isArray(formData.departments) && formData.departments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.departments?.map((d: DepartmentRecord) => {
              const dept = departments.find((dept) => String(dept.id) === String(d.id));
              return dept ? (
                <span
                  key={dept.id}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs"
                >
                  {dept.name}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.departments?.filter(
                        (d: DepartmentRecord) => d.id !== dept.id
                      );
                      onInputChange("departments", updated);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationAndUsageStep;
