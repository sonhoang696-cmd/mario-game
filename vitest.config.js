import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';

export default defineConfig({
  test: {
    projects: [
      // 1) Test logic game (vật lý, bản đồ...) chạy trong Node
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/game/**/*.test.js']
        }
      },
      // 2) Test Worker + D1 chạy trong runtime Workers thật (Miniflare/workerd)
      {
        plugins: [
          cloudflareTest(async () => {
            const migrations = await readD1Migrations('migrations');
            return {
              wrangler: { configPath: './wrangler.jsonc' },
              miniflare: { bindings: { TEST_MIGRATIONS: migrations } }
            };
          })
        ],
        test: {
          name: 'worker',
          include: ['test/worker/**/*.test.js'],
          setupFiles: ['./test/worker/apply-migrations.js']
        }
      }
    ]
  }
});
