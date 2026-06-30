/** Cache keys for the dashboard read model (shared by writers that invalidate). */
export const dashboardKey = (userId: string) => `cache:dashboard:${userId}`;
export const analyticsKey = (userId: string, range: string) =>
  `cache:analytics:${userId}:${range}`;
