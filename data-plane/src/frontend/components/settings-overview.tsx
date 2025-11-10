"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditCompany } from "@/components/edit-company";

export function SettingsOverview() {
  const [isEditing, setIsEditing] = useState(false);

  // Mock data - in real app, this would come from props or API
  const companyData = {
    companyName: "NetSentinel Corp",
    subdomain: "netsentinel.app",
    mainContact: "admin@netsentinel.com",
    phoneNumber: "No phone number set",
    timeZone: "Eastern Time (US & Canada)",
  };

  if (isEditing) {
    return (
      <EditCompany
        onCancel={() => setIsEditing(false)}
        initialData={{
          companyName: companyData.companyName,
          subdomain: companyData.subdomain.split(".")[0],
          mainContact: companyData.mainContact,
          timeZone: companyData.timeZone,
        }}
      />
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Company Information</h2>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Company Name</span>
          <span className="text-sm font-medium">{companyData.companyName}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Subdomain</span>
          <span className="text-sm font-medium">{companyData.subdomain}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Main Contact</span>
          <span className="text-sm font-medium">{companyData.mainContact}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Main Phone Number</span>
          <span className="text-sm font-medium">{companyData.phoneNumber}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground">Time Zone</span>
          <span className="text-sm font-medium">{companyData.timeZone}</span>
        </div>
      </div>
    </div>
  );
}

