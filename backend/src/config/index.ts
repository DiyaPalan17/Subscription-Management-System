import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://brightloop:brightloop_password@localhost:5432/brightloop_db?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'brightloop-super-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  billingCronSchedule: process.env.BILLING_CRON_SCHEDULE || '0 0 * * *',
  overdueCronSchedule: process.env.OVERDUE_CRON_SCHEDULE || '0 1 * * *',
  emailFrom: process.env.EMAIL_FROM || 'billing@brightloop.io',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
