// Entitlement (authorization) check for the bootstrap resource server.
//
// Authentication proves WHO the caller is; authorization decides whether they are
// ENTITLED to a configuration. The gate is configured with Entra group object IDs
// and/or app-role values; a caller's token must carry at least one match in EVERY
// configured dimension (AND across groups/roles, OR within each). With no
// requirements configured, every authenticated caller is entitled — suitable only
// when tenant membership is itself the entitlement boundary.

/** Parse a comma-separated requirement list from an env var value. */
export function parseList(v) {
  return (v || '').split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Decide whether an authenticated caller is entitled to a configuration.
 * @param claims validated token claims (may carry `groups` / `roles`)
 * @param requiredGroups Entra group object IDs (empty = no group requirement)
 * @param requiredRoles app-role values (empty = no role requirement)
 * @returns true when entitled
 */
export function isEntitled(claims, requiredGroups, requiredRoles) {
  if (requiredGroups.length === 0 && requiredRoles.length === 0) return true;
  const values = k => (Array.isArray(claims[k]) ? claims[k] : claims[k] ? [claims[k]] : []);
  const groups = values('groups');
  const roles = values('roles');
  const groupOk = requiredGroups.length === 0 || groups.some(g => requiredGroups.includes(g));
  const roleOk = requiredRoles.length === 0 || roles.some(r => requiredRoles.includes(r));
  return groupOk && roleOk;
}
