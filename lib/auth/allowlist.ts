/**
 * WHO MAY BE MADE AN OPERATOR — never who IS one. The role lives on the
 * account and is granted only by claiming a provisioning link (ROUND_6 Task 3);
 * this list only bounds whom the script will provision.
 */
export function isAllowlistedAdmin(email: string): boolean {
  const allow = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
