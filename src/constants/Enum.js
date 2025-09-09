// src/constants/Enum.js
export const UserRole = Object.freeze({
  OFFICER: 0,
  AIRMEN: 1,
  CIVILIAN: 2,
});

// map numeric code -> display label
export const UserRoleLabel = Object.freeze({
  [UserRole.OFFICER]: "OFFICER",
  [UserRole.AIRMEN]: "AIRMEN",
  [UserRole.CIVILIAN]: "CIVILIAN",
});

// helper: get label from code
export function getUserRoleLabel(code) {
  return UserRoleLabel[code] ?? "Unknown";
}

// helper: create options for selects (value = number)
export const userRoleOptions = Object.keys(UserRoleLabel).map((k) => ({
  value: Number(k),
  label: UserRoleLabel[k],
}));
