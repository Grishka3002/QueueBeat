export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/queuebeat?schema=public",
  adminPassword:
    process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "queuebeat-admin"),
  hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD) || process.env.NODE_ENV !== "production",
  adminCookieName: "queuebeat-admin-session",
  demoMode: process.env.DEMO_MODE === "true"
};
