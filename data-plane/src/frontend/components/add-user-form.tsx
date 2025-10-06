import React from "react";

const AddUserForm = ({ handleAddUser, submitting }: { handleAddUser: (e: React.FormEvent<HTMLFormElement>) => void; submitting: boolean }) => {
  return (
    <form onSubmit={handleAddUser} className="grid gap-2 sm:gap-3">
      <div className="grid gap-1">
        <label htmlFor="username" className="text-xs sm:text-sm">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="janedoe"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="email" className="text-xs sm:text-sm">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="jane@example.com"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="password" className="text-xs sm:text-sm">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Enter password"
        />
      </div>

      <div className="grid gap-1">
        <label htmlFor="re_password" className="text-xs sm:text-sm">
          Confirm Password
        </label>
        <input
          id="re_password"
          type="password"
          name="re_password"
          required
          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
          placeholder="Confirm password"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 h-9 sm:h-10 rounded-md bg-[oklch(0.62_0.25_27.3)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? "Adding User..." : "Add User"}
      </button>
      <p className="text-xs text-muted-foreground">
        Note: Users will be created in the database with regular user
        permissions.
      </p>
    </form>
  );
};

export default AddUserForm;
