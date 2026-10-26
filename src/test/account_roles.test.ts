import { describe, expect, it } from 'vitest';
import { PRESET_PERSONAS, generateFakeAccounts } from '../services/accountGenerator';

describe('TITIK account roles', () => {
  it('offers only citizen and admin account personas', () => {
    expect(Object.values(PRESET_PERSONAS).map((persona) => persona.role))
      .not.toContain('moderator');
  });

  it('generates only citizens and admins', () => {
    const generated = generateFakeAccounts(100);
    expect(generated.map((account) => account.role))
      .toEqual(expect.arrayContaining(['citizen', 'admin']));
    expect(generated.every((account) => account.role === 'citizen' || account.role === 'admin'))
      .toBe(true);
  });
});
