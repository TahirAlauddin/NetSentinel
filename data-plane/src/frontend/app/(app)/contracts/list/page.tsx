import { redirect } from "next/navigation";

/**
 * /contracts/list is deprecated. The contracts list lives at /contracts
 * (same page as overview). Redirect so old links and bookmarks still work.
 */
export default function ContractsListRedirect() {
  redirect("/contracts");
}
