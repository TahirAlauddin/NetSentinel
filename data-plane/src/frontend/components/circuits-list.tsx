import React from "react";
import { Trash2 } from "lucide-react";

import { CircuitRecord } from "@/types/circuits"

interface CircuitsListProps {
  circuits: CircuitRecord[];
  onDelete?: (id: number) => void;
  deletingId?: number | null;
}

const CircuitsList: React.FC<CircuitsListProps> = ({ circuits, onDelete, deletingId }) => {
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
          {onDelete && (
            <th className="text-right font-normal py-2 pr-0">Actions</th>
          )}
        </tr>
      </thead>
      <tbody>
        {Array.isArray(circuits) && circuits.length > 0 ? (
          circuits.map((circuit) => (
            <tr key={circuit.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
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
              <td className="py-2 pr-2 sm:pr-6 text-xs text-muted-foreground hidden md:table-cell">
                {circuit.id}
              </td>
              {onDelete && (
                <td className="py-2 pr-0 text-right">
                  <button
                    onClick={() => onDelete(circuit.id)}
                    disabled={deletingId === circuit.id}
                    className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Delete circuit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={onDelete ? 6 : 5} className="py-4 text-center text-muted-foreground">
              {Array.isArray(circuits) ? "No circuits found" : "Failed to load circuits"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default CircuitsList;

