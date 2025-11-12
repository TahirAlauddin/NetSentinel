import React from "react";

import { CircuitRecord } from "@/types/circuits"

const CircuitsList = ({ circuits }: { circuits: CircuitRecord[] }) => {
  return (
    <table className="min-w-full text-xs sm:text-sm">
      <thead className="border-b border-border text-muted-foreground">
        <tr>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Location</th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Carrier</th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6">Speed</th>
          <th className="text-left font-normal py-2 pr-2 sm:pr-6 hidden sm:table-cell">Circuit ID</th>
          <th className="text-left font-normal py-2 pr-0 hidden md:table-cell">
            ID
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.isArray(circuits) && circuits.length > 0 ? (
          circuits.map((circuit) => (
            <tr key={circuit.id} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-2 sm:pr-6">{circuit.location_name || `Location ${circuit.location}`}</td>
              <td className="py-2 pr-2 sm:pr-6">
                {circuit.carrier}
              </td>
              <td className="py-2 pr-2 sm:pr-6">
                {circuit.speed} Mbps
              </td>
              <td className="py-2 pr-2 sm:pr-6 hidden sm:table-cell">
                {circuit.circuit_id || "-"}
              </td>
              <td className="py-2 pr-0 text-xs text-muted-foreground hidden md:table-cell">
                {circuit.id}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="py-4 text-center text-muted-foreground">
              {Array.isArray(circuits) ? "No circuits found" : "Failed to load circuits"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default CircuitsList;

