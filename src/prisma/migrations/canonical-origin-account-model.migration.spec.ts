import * as fs from 'node:fs';
import * as path from 'node:path';

describe('canonical-origin-account-model migration', () => {
  it('contains backfill and legacy column removal statements', () => {
    const migrationPath = path.join(
      __dirname,
      '20260325213000_canonical_origin_account_model',
      'migration.sql',
    );

    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "originAccountData" JSONB');
    expect(sql).toContain('jsonb_build_object');
    expect(sql).toContain('originZelleEmail');
    expect(sql).toContain('originIban');
    expect(sql).toContain('originStripePaymentMethodId');
    expect(sql).toContain('DROP COLUMN IF EXISTS "originZelleEmail"');
    expect(sql).toContain('DROP COLUMN IF EXISTS "originIban"');
    expect(sql).toContain('DROP COLUMN IF EXISTS "originStripePaymentMethodId"');
  });
});
