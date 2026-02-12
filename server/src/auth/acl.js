import { Permission, Role, User } from "../models/domain.js";

function normalizeUser(userLike) {
  if (!userLike) return null;
  if (userLike instanceof User) return userLike;
  if (userLike.id) return User.find(userLike.id);
  return null;
}

export function hasRole(userLike, roleName) {
  const user = normalizeUser(userLike);
  if (!user) return false;
  return user.role()?.toJSON().name === roleName;
}

export function getAllPermissions(userLike) {
  const user = normalizeUser(userLike);
  if (!user) return [];

  const rolePermissions = (user.role()?.permissions() || []).map(x => x.key);
  const directPermissions = (user.directPermissions() || []).map(x => x.key);
  return [...new Set([...rolePermissions, ...directPermissions])];
}

export function can(userLike, permissionKey) {
  const exists = Permission.find(permissionKey);
  if (!exists) return false;
  return getAllPermissions(userLike).includes(permissionKey);
}

export function canAny(userLike, permissionKeys = []) {
  return permissionKeys.some(key => can(userLike, key));
}

export function syncRolePermissions(roleId, permissionKeys = []) {
  const role = Role.find(roleId);
  if (!role) return null;
  const valid = permissionKeys.filter(key => Permission.find(key));
  role.syncPermissions(valid);
  return role;
}
