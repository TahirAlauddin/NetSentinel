import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { Card } from "@/components/ui/card";

/**
 * IPAM Dashboard Page
 * This page displays the IPAM dashboard with statistics, favorite subnets, and recent logs.
 */
export default function IpamDashboardPage() {
  return (
    <div className="space-y-6">
      <IpamHeader currentPage="IPAM Dashboard" />
      <IpamNavTabs />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Favorite Subnets */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Favourite Subnets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Object</th>
                    <th className="text-left py-2 px-4">Description</th>
                    <th className="text-left py-2 px-4">Section</th>
                    <th className="text-left py-2 px-4">VLAN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">-</td>
                    <td className="py-2 px-4 text-muted-foreground">No favourite subnets yet</td>
                    <td className="py-2 px-4">-</td>
                    <td className="py-2 px-4">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Most Recent Change Log Entries */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Most Recent Change Log Entries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">User</th>
                    <th className="text-left py-2 px-4">Type</th>
                    <th className="text-left py-2 px-4">Object</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Most Recent Informational Logs */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Most Recent Informational Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Severity</th>
                    <th className="text-left py-2 px-4">Command</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Username</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Sections</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Subnets</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of VLANs</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of VRFs</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of IPv4 addresses</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of IPv6 addresses</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Devices</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Locations</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of Racks</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Number of users</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </Card>

          {/* Most Recent Warning / Error Logs */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Most Recent Warning / Error Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Severity</th>
                    <th className="text-left py-2 px-4">Command</th>
                    <th className="text-left py-2 px-4">Date</th>
                    <th className="text-left py-2 px-4">Username</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                    <td className="py-2 px-4 text-muted-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

