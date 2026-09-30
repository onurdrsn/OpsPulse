import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull(),
  serviceType: varchar('service_type', { length: 50 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
