export const canOperate = (role) => role === 'admin' || role === 'manager';

export const canManageCatalog = (role) => role === 'admin';
