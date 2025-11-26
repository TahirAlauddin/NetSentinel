"use client";

import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface NotesSectionProps {
  notes: string[];
  onAdd: () => void;
}

export function NotesSection({ notes, onAdd }: NotesSectionProps) {
  return (
    <section id="notes">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
      <Card className="p-4 md:p-6">
        {notes.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-900 font-medium mb-2">
              Not tracking anything here, yet.
            </p>
            <button
              className="text-blue-600 flex items-center gap-1 mx-auto"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              Add some notes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-900 text-sm">{note}</p>
                <p className="text-xs text-gray-400 mt-1">Added just now</p>
              </div>
            ))}
            <button
              className="text-blue-600 text-sm flex items-center gap-1"
              onClick={onAdd}
            >
              <Plus className="w-4 h-4" />
              Add another note
            </button>
          </div>
        )}
      </Card>
    </section>
  );
}

