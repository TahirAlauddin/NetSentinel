import React from "react";

const AddLocationForm = ({ handleAddLocation, submitting }: { handleAddLocation: (e: React.FormEvent<HTMLFormElement>) => void; submitting: boolean }) => {
  return (
    <form onSubmit={handleAddLocation} className="grid gap-2 sm:gap-3">
      <div className="grid gap-1">
        <label htmlFor="city" className="text-xs sm:text-sm">
          City
        </label>
        <input
          id="city"
          name="city"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="New York"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="address" className="text-xs sm:text-sm">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          required
          rows={3}
          className="rounded-md border border-input bg-background px-2 sm:px-3 py-2 text-sm resize-none"
          placeholder="123 Main Street, Suite 100"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 h-9 sm:h-10 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? "Adding Location..." : "Add Location"}
      </button>
      <p className="text-xs text-muted-foreground">
        Note: Each location must have a unique combination of city and address.
      </p>
    </form>
  );
};

export default AddLocationForm;

