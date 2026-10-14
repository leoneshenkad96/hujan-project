export const ROLES=['owner','admin','project_manager','sales','finance','production','crew','client_viewer'] as const;
export type Role=typeof ROLES[number];
export const PERMISSIONS={
 'dashboard:read':['owner','admin','project_manager','sales','finance','production'],
 'clients:read':['owner','admin','project_manager','sales','finance'],
 'clients:write':['owner','admin','sales'],
 'events:read':['owner','admin','project_manager','sales','finance','production','crew'],
 'events:write':['owner','admin','project_manager'],
 'tasks:write':['owner','admin','project_manager','production'],
 'vendors:read':['owner','admin','project_manager','finance','production'],
 'vendors:write':['owner','admin','project_manager'],
 'finance:read':['owner','admin','finance'],
 'finance:write':['owner','admin','finance'],
 'users:manage':['owner','admin'],
 'rundown:write':['owner','admin','project_manager','production'],
 'client_portal:read':['client_viewer'],
} as const satisfies Record<string,readonly Role[]>;
export type Permission=keyof typeof PERMISSIONS;
export function can(role:string,permission:Permission):boolean {
 return (PERMISSIONS[permission] as readonly string[]).includes(role);
}
