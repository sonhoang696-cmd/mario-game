// Chạy trước mỗi file test Worker: áp dụng migrations/*.sql lên D1 giả lập.
import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
