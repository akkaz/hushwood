import { sqliteTable, text, integer, primaryKey, uniqueIndex, index, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(), name: text('name').notNull(), ownerId: text('owner_id').notNull(),
  domain: text('domain').notNull().default(''), inviteCode: text('invite_code').notNull(),
  cup: text('cup').notNull(), rewards: text('rewards').notNull().default('[]'), createdAt: integer('created_at').notNull(),
}, t => [uniqueIndex('school_invite').on(t.inviteCode)]);
export const members = sqliteTable('members', {
  schoolId: text('school_id').notNull().references(() => schools.id), userId: text('user_id').notNull(), joinedAt: integer('joined_at').notNull(),
}, t => [primaryKey({ columns: [t.schoolId,t.userId] }), index('member_user').on(t.userId)]);
export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull().references(() => schools.id),
  name: text('name').notNull(), mascot: text('mascot').notNull(), createdAt: integer('created_at').notNull(),
}, t => [index('class_school').on(t.schoolId)]);
export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull().references(() => schools.id),
  classId: text('class_id').notNull().references(() => classes.id), userId: text('user_id').notNull(),
  status: text('status').notNull().default('active'), startedAt: integer('started_at').notNull(), finishedAt: integer('finished_at'),
  quietSeconds: integer('quiet_seconds').notNull().default(0), measuredSeconds: integer('measured_seconds').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0), xp: integer('xp').notNull().default(0),
}, t => [uniqueIndex('active_class').on(t.classId).where(sql`${t.status} = 'active'`), uniqueIndex('active_teacher').on(t.userId).where(sql`${t.status} = 'active'`), index('lesson_school').on(t.schoolId,t.startedAt), check('lesson_status',sql`${t.status} IN ('active', 'finished', 'expired')`), check('lesson_counters',sql`${t.quietSeconds} >= 0 AND ${t.measuredSeconds} >= ${t.quietSeconds} AND ${t.bestStreak} >= 0 AND ${t.bestStreak} <= ${t.quietSeconds} AND ${t.xp} >= 0`)]);
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(), windowStart: integer('window_start').notNull(), count: integer('count').notNull(),
});
