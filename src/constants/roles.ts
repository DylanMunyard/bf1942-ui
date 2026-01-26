/** Role constants; must match backend api.Authorization.AppRoles */
export const ROLE_USER = 'User';
export const ROLE_SUPPORT = 'Support';
export const ROLE_ADMIN = 'Admin';

/** Escape hatch: this email is always treated as admin even without the Admin role in the JWT. */
export const ADMIN_EMAIL = 'dmunyard@gmail.com';
