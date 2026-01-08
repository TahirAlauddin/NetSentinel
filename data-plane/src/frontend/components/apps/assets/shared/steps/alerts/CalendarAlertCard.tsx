"use client";

import { X, Bell, Calendar, User, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CalendarAlert } from "@/types/assets/fields";
import { UserRecord } from "@/types/users";

interface CalendarAlertCardProps {
  alert: CalendarAlert;
  index: number;
  people: UserRecord[];
  loadingPeople: boolean;
  peopleError: string | null;
  onDateChange: (index: number, date: string) => void;
  onUserChange: (index: number, userId: string) => void;
  onMessageChange: (index: number, message: string) => void;
  onRemove: (index: number) => void;
  onConfirm: (index: number) => void;
}

/**
 * Individual calendar alert card component
 */
export function CalendarAlertCard({
  alert,
  index,
  people,
  loadingPeople,
  peopleError,
  onDateChange,
  onUserChange,
  onMessageChange,
  onRemove,
  onConfirm,
}: CalendarAlertCardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-start gap-4 sm:flex-row flex-col">
        {/* Bell Icon and Mobile Actions */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>
          {/* Mobile Action Buttons */}
          <div className="sm:hidden flex items-start gap-2 flex-shrink-0 pt-1">
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Remove alert"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onConfirm(index)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Confirm alert"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-3">
          {/* Date and User Assignment Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Input */}
            <div className="relative flex-shrink-0">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="date"
                value={alert.date || ""}
                onChange={(e) => onDateChange(index, e.target.value)}
                className="w-48 pl-10 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* User Assignment Dropdown */}
            <div className="relative flex-shrink-0">
              <div className="relative">
                <select
                  value={alert.assigned_to?.id?.toString() || ""}
                  onChange={(e) => onUserChange(index, e.target.value)}
                  className="h-10 pl-10 pr-8 min-w-[180px] rounded-lg border border-gray-300 bg-white hover:bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none cursor-pointer text-sm text-gray-900 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <option value="">Assign to user</option>
                  {loadingPeople ? (
                    <option value="" disabled>
                      Loading users...
                    </option>
                  ) : peopleError ? (
                    <option value="" disabled>
                      Error loading users
                    </option>
                  ) : people.length === 0 ? (
                    <option value="" disabled>
                      No users available
                    </option>
                  ) : (
                    people.map((person) => (
                      <option key={person.id} value={person.id.toString()}>
                        {person.username}
                      </option>
                    ))
                  )}
                </select>
                {/* User Icon */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User
                    className={`w-4 h-4 ${
                      alert.assigned_to ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                </div>
                {/* Dropdown Arrow */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Message Textarea */}
          <textarea
            value={alert.message || ""}
            onChange={(e) => onMessageChange(index, e.target.value)}
            placeholder="Enter alert message"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y min-h-[3rem]"
          />
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-start gap-2 flex-shrink-0 pt-1">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Remove alert"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onConfirm(index)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Confirm alert"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

