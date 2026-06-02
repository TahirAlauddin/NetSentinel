import { redirect } from "next/navigation";

/** Host groups are managed on the Hosts page. */
export default function HostGroupsPage() {
  redirect("/monitoring/hosts");
}
