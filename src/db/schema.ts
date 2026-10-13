import { pgTable, pgEnum, uuid, varchar, text, integer, numeric, timestamp, date, uniqueIndex, index, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const eventStatus = pgEnum('event_status', ['planning','confirmed','pre_production','live','completed','cancelled']);
export const taskStatus = pgEnum('task_status', ['todo','in_progress','done','blocked']);
export const costStatus = pgEnum('cost_status', ['planned','committed','actual','voided']);
export const invoiceStatus = pgEnum('invoice_status', ['draft','issued','partially_paid','paid','voided']);
export const leadStatus = pgEnum('lead_status', ['new','qualified','proposal','negotiation','won','lost']);

export const organizations = pgTable('organizations',{
 id:uuid('id').primaryKey().defaultRandom(),
 name:varchar('name',{length:160}).notNull(),
 slug:varchar('slug',{length:80}).notNull().unique(),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
});
export const users = pgTable('users',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 email:varchar('email',{length:254}).notNull(),
 name:varchar('name',{length:150}).notNull(),
 passwordHash:text('password_hash'),
 role:varchar('role',{length:40}).notNull().default('crew'),
 active:boolean('active').notNull().default(true),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('users_org_email_idx').on(t.organizationId,t.email)]);
export const clients = pgTable('clients',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 name:varchar('name',{length:180}).notNull(),
 email:varchar('email',{length:254}),
 phone:varchar('phone',{length:40}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('clients_org_idx').on(t.organizationId)]);
export const leads = pgTable('leads',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 clientId:uuid('client_id').references(()=>clients.id),
 title:varchar('title',{length:180}).notNull(),
 status:leadStatus('status').notNull().default('new'),
 estimatedValue:numeric('estimated_value',{precision:18,scale:2}).notNull().default('0'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('leads_org_idx').on(t.organizationId)]);
export const events = pgTable('events',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 clientId:uuid('client_id').notNull().references(()=>clients.id),
 code:varchar('code',{length:40}).notNull(),
 title:varchar('title',{length:200}).notNull(),
 type:varchar('type',{length:80}).notNull(),
 venue:varchar('venue',{length:220}),
 eventDate:date('event_date').notNull(),
 status:eventStatus('status').notNull().default('planning'),
 progress:integer('progress').notNull().default(0),
 contractValue:numeric('contract_value',{precision:18,scale:2}).notNull().default('0'),
 approvedBudget:numeric('approved_budget',{precision:18,scale:2}).notNull().default('0'),
 projectManagerId:uuid('project_manager_id').references(()=>users.id),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('events_org_code_idx').on(t.organizationId,t.code),index('events_org_date_idx').on(t.organizationId,t.eventDate)]);
export const tasks = pgTable('event_tasks',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 title:varchar('title',{length:240}).notNull(),
 ownerId:uuid('owner_id').references(()=>users.id),
 dueDate:date('due_date'),
 status:taskStatus('status').notNull().default('todo'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('tasks_event_idx').on(t.eventId)]);
export const vendors = pgTable('vendors',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 name:varchar('name',{length:180}).notNull(),
 category:varchar('category',{length:80}),
 contact:varchar('contact',{length:160}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('vendors_org_idx').on(t.organizationId)]);
export const eventCosts = pgTable('event_costs',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 vendorId:uuid('vendor_id').references(()=>vendors.id),
 description:varchar('description',{length:240}).notNull(),
 amount:numeric('amount',{precision:18,scale:2}).notNull(),
 status:costStatus('status').notNull().default('planned'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('event_costs_event_idx').on(t.eventId)]);
export const invoices = pgTable('invoices',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 number:varchar('number',{length:60}).notNull(),
 amount:numeric('amount',{precision:18,scale:2}).notNull(),
 paidAmount:numeric('paid_amount',{precision:18,scale:2}).notNull().default('0'),
 status:invoiceStatus('status').notNull().default('draft'),
 dueDate:date('due_date'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('invoices_org_number_idx').on(t.organizationId,t.number),index('invoices_event_idx').on(t.eventId)]);
export const payments = pgTable('invoice_payments',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 invoiceId:uuid('invoice_id').notNull().references(()=>invoices.id),
 amount:numeric('amount',{precision:18,scale:2}).notNull(),
 paidAt:timestamp('paid_at',{withTimezone:true}).notNull().defaultNow(),
 reference:varchar('reference',{length:160}),
 idempotencyKey:varchar('idempotency_key',{length:80}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('invoice_payments_invoice_idx').on(t.invoiceId),uniqueIndex('invoice_payments_idempotency_idx').on(t.organizationId,t.invoiceId,t.idempotencyKey)]);
export const auditLogs = pgTable('audit_logs',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 actorId:uuid('actor_id').references(()=>users.id),
 action:varchar('action',{length:120}).notNull(),
 resourceType:varchar('resource_type',{length:80}).notNull(),
 resourceId:uuid('resource_id'),
 details:text('details'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('audit_org_date_idx').on(t.organizationId,t.createdAt)]);
export const eventRelations=relations(events,({one,many})=>({
 client:one(clients,{fields:[events.clientId],references:[clients.id]}),
 tasks:many(tasks),
 costs:many(eventCosts),
 invoices:many(invoices),
}));
export const taskRelations=relations(tasks,({one})=>({event:one(events,{fields:[tasks.eventId],references:[events.id]})}));
export const costRelations=relations(eventCosts,({one})=>({event:one(events,{fields:[eventCosts.eventId],references:[events.id]})}));
export const invoiceRelations=relations(invoices,({one,many})=>({event:one(events,{fields:[invoices.eventId],references:[events.id]}),payments:many(payments)}));
export const paymentRelations=relations(payments,({one})=>({invoice:one(invoices,{fields:[payments.invoiceId],references:[invoices.id]})}));

// Opaque, server-side revocable sessions. Never store the plaintext cookie token.
export const authSessions = pgTable('auth_sessions',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 userId:uuid('user_id').notNull().references(()=>users.id),
 tokenHash:varchar('token_hash',{length:64}).notNull().unique(),
 expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),
 revokedAt:timestamp('revoked_at',{withTimezone:true}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('auth_sessions_user_idx').on(t.userId),index('auth_sessions_expiry_idx').on(t.expiresAt)]);

/** Server-side login throttle; stores SHA-256 identifiers, never raw IPs/emails. */
export const authLoginLimits = pgTable('auth_login_limits',{
 key:varchar('key',{length:64}).primaryKey(),
 windowStartedAt:timestamp('window_started_at',{withTimezone:true}).notNull(),
 attempts:integer('attempts').notNull().default(0),
 updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
});

export const purchaseOrderStatus=pgEnum('purchase_order_status',['draft','issued','partially_received','received','cancelled']);
export const purchaseOrders=pgTable('purchase_orders',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 vendorId:uuid('vendor_id').notNull().references(()=>vendors.id),
 number:varchar('number',{length:72}).notNull(),
 description:varchar('description',{length:240}).notNull(),
 amount:numeric('amount',{precision:18,scale:2}).notNull(),
 status:purchaseOrderStatus('status').notNull().default('draft'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('purchase_orders_org_number_idx').on(t.organizationId,t.number),index('purchase_orders_event_idx').on(t.eventId),index('purchase_orders_vendor_idx').on(t.vendorId)]);

export const rundownStatus=pgEnum('rundown_status',['planned','standby','on_air','done','skipped']);
export const rundownItems=pgTable('rundown_items',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 position:integer('position').notNull(),
 title:varchar('title',{length:200}).notNull(),
 startTime:varchar('start_time',{length:5}).notNull(),
 endTime:varchar('end_time',{length:5}).notNull(),
 cue:varchar('cue',{length:240}),
 picId:uuid('pic_id').references(()=>users.id),
 status:rundownStatus('status').notNull().default('planned'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('rundown_event_position_idx').on(t.eventId,t.position),index('rundown_org_idx').on(t.organizationId)]);

export const quotationStatus=pgEnum('quotation_status',['draft','sent','accepted','rejected','expired']);
export const contractStatus=pgEnum('contract_status',['draft','signed','terminated']);
export const quotations=pgTable('quotations',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 clientId:uuid('client_id').notNull().references(()=>clients.id),
 number:varchar('number',{length:72}).notNull(),
 title:varchar('title',{length:200}).notNull(),
 amount:numeric('amount',{precision:18,scale:2}).notNull(),
 notes:text('notes'),
 status:quotationStatus('status').notNull().default('draft'),
 validUntil:date('valid_until'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp('updated_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('quotation_org_number_idx').on(t.organizationId,t.number),index('quotation_event_idx').on(t.eventId)]);
export const contracts=pgTable('contracts',{
 id:uuid('id').primaryKey().defaultRandom(),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 eventId:uuid('event_id').notNull().references(()=>events.id),
 quotationId:uuid('quotation_id').notNull().references(()=>quotations.id),
 number:varchar('number',{length:72}).notNull(),
 amount:numeric('amount',{precision:18,scale:2}).notNull(),
 status:contractStatus('status').notNull().default('draft'),
 signedAt:timestamp('signed_at',{withTimezone:true}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[uniqueIndex('contract_org_number_idx').on(t.organizationId,t.number),uniqueIndex('contract_quotation_idx').on(t.quotationId),index('contract_event_idx').on(t.eventId)]);

/** Single-use email activation challenge. Store only a SHA-256 token digest. */
export const activationTokens=pgTable('auth_activation_tokens',{
 id:uuid('id').primaryKey().defaultRandom(),
 userId:uuid('user_id').notNull().references(()=>users.id),
 organizationId:uuid('organization_id').notNull().references(()=>organizations.id),
 tokenHash:varchar('token_hash',{length:64}).notNull().unique(),
 expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),
 consumedAt:timestamp('consumed_at',{withTimezone:true}),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()
},t=>[index('activation_tokens_user_idx').on(t.userId),index('activation_tokens_expiry_idx').on(t.expiresAt)]);
