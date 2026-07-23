import type { Role } from "@/lib/types";

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SELLER":
      return "/seller";
    case "BUYER":
    default:
      return "/buyer";
  }
}
