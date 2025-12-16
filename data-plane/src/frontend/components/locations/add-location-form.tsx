import React from "react";

const AddLocationForm = ({
  handleAddLocation,
  submitting,
}: {
  handleAddLocation: (e: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
}) => {
  return (
    <form onSubmit={handleAddLocation} className="grid gap-4 sm:gap-6">
      <div className="grid gap-1">
        <label htmlFor="name" className="text-xs sm:text-sm">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Example Location"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="alias" className="text-xs sm:text-sm">
          Alias
        </label>
        <input
          id="alias"
          name="alias"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="John Doe's Office"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="address1" className="text-xs sm:text-sm">
          Address 1
        </label>
        <input
          id="address1"
          name="address1"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="address2" className="text-xs sm:text-sm">
          Address 2
        </label>
        <input
          id="address2"
          name="address2"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Suite 100"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="city" className="text-xs sm:text-sm">
          City
        </label>
        <input
          id="city"
          name="city"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="New York"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="state" className="text-xs sm:text-sm">
          State
        </label>
        <input
          id="state"
          name="state"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="NY"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="zip_code" className="text-xs sm:text-sm">
          Zip Code
        </label>
        <input
          id="zip_code"
          name="zip_code"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="10001"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="phone" className="text-xs sm:text-sm">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="(123) 456-7890"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="longitude" className="text-xs sm:text-sm">
          Longitude
        </label>
        <input
          id="longitude"
          name="longitude"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="-122.4194"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="latitude" className="text-xs sm:text-sm">
          Latitude
        </label>
        <input
          id="latitude"
          name="latitude"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="37.7749"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="type_building" className="text-xs sm:text-sm">
          Type of Building
        </label>
        <input
          id="type_building"
          name="type_building"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Office Building"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="mpoe" className="text-xs sm:text-sm">
          Main Point of Entry
        </label>
        <input
          id="mpoe"
          name="mpoe"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Main Entrance"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="dmarc" className="text-xs sm:text-sm">
          Demarcation Point
        </label>
        <input
          id="dmarc"
          name="dmarc"
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Main Exit"
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
