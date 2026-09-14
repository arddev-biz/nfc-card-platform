export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function organizationStatusTone(status: string): "green" | "amber" | "gray" {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "SUSPENDED":
      return "amber";
    default:
      return "gray";
  }
}

export function subscriptionStatusTone(status: string): "green" | "amber" | "red" | "gray" {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "EXPIRING_SOON":
      return "amber";
    case "EXPIRED":
      return "red";
    default:
      return "gray";
  }
}
