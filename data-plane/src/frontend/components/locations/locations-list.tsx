import React from "react";

import { LocationRecord } from "@/types/locations"

const LocationsList = ({ locations }: { locations: LocationRecord[] }) => {
  return (
    <table className="min-w-full text-xs sm:text-sm">
      <thead className="border-b border-border text-muted-foreground">
        <tr>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">City</th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Address</th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Circuits</th>
          <th className="text-left font-normal py-2 pr-0 hidden md:table-cell">
            ID
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.isArray(locations) && locations.length > 0 ? (
          locations.map((location) => (
            <tr key={location.id} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-2 sm:pr-6">{location.city}</td>
              <td className="py-2 pr-2 sm:pr-6">
                {location.address1}
              </td>
              <td className="py-2 pr-2 sm:pr-6">
                {/* //TODO: Hardcoding Circuits for now */}
                {0}
              </td>
              <td className="py-2 pr-0 text-xs text-muted-foreground hidden md:table-cell">
                {location.id}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="py-4 text-center text-muted-foreground">
              {Array.isArray(locations) ? "No locations found" : "Failed to load locations"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default LocationsList;

