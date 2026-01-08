import React from "react";
import { LocationRecord } from "@/types/locations";

const AddCircuitForm = ({ 
  handleAddCircuit, 
  submitting, 
  locations 
}: { 
  handleAddCircuit: (e: React.FormEvent<HTMLFormElement>) => void; 
  submitting: boolean;
  locations: LocationRecord[];
}) => {
  return (
    <form onSubmit={handleAddCircuit} className="grid gap-2 sm:gap-3">
      <div className="grid gap-1">
        <label htmlFor="location" className="text-xs sm:text-sm">
          Location *
        </label>
        <select
          id="location"
          name="location"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
        >
          <option value="">Select a location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.city} - {location.address1}
            </option>
          ))}
        </select>
        {locations.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No locations available. Please create a location first.
          </p>
        )}
      </div>

      <div className="grid gap-1">
        <label htmlFor="carrier" className="text-xs sm:text-sm">
          Carrier *
        </label>
        <input
          id="carrier"
          name="carrier"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Verizon, AT&T, etc."
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="speed" className="text-xs sm:text-sm">
          Speed (Mbps) *
        </label>
        <input
          id="speed"
          name="speed"
          type="number"
          min="1"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="1000"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="circuit_id" className="text-xs sm:text-sm">
          Circuit ID (Optional)
        </label>
        <input
          id="circuit_id"
          name="circuit_id"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="VZ-12345"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || locations.length === 0}
        className="mt-2 h-9 sm:h-10 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? "Adding Circuit..." : "Add Circuit"}
      </button>
      <p className="text-xs text-muted-foreground">
        Note: Each circuit must be associated with a location.
      </p>
    </form>
  );
};

export default AddCircuitForm;

