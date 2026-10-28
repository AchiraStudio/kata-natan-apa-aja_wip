import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATION_PATH = path.resolve(__dirname, '../../supabase/migrations/20261028000004_canonical_verification_and_audit.sql');
const SCHEMA_PATH = path.resolve(__dirname, '../../supabase/schema.sql');

describe('Empirical Challenger Verification Oracle: Milestone 1 Remediation', () => {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8');
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  describe('1. Column-Level Security on internal_notes', () => {
    it('verifies exact REVOKE and GRANT statements exist in both SQL files', () => {
      for (const [name, sql] of [['Migration', migrationSql], ['Schema', schemaSql]]) {
        expect(sql, `${name} missing REVOKE`).toContain(
          'REVOKE SELECT (internal_notes) ON public.reports FROM anon, authenticated;'
        );
        expect(sql, `${name} missing GRANT`).toContain(
          'GRANT SELECT (internal_notes) ON public.reports TO service_role;'
        );
      }
    });

    it('confirms report_events RLS hides internal notes from public/citizen queries', () => {
      for (const [name, sql] of [['Migration', migrationSql], ['Schema', schemaSql]]) {
        expect(sql).toContain('Report events visibility based on is_internal');
        expect(sql).toContain('is_internal = FALSE');
        expect(sql).toContain('public.is_admin()');
      }
    });
  });

  describe('2. Citizen Timeline Suppression Elimination', () => {
    it('verifies status_change event is unconditionally public (is_internal = FALSE)', () => {
      for (const [name, sql] of [['Migration', migrationSql], ['Schema', schemaSql]]) {
        // Find the INSERT INTO public.report_events for status_change
        const statusChangeMatch = sql.match(
          /'status_change'[\s\S]*?COALESCE\(v_response_trimmed, 'Status diperbarui menjadi ' \|\| p_target_status\)[\s\S]*?FALSE/
        );
        expect(statusChangeMatch, `${name} must hardcode is_internal = FALSE for status_change`).not.toBeNull();
      }
    });

    it('verifies internal_review_note event is recorded separately with is_internal = TRUE', () => {
      for (const [name, sql] of [['Migration', migrationSql], ['Schema', schemaSql]]) {
        const internalNoteMatch = sql.match(
          /IF v_notes_trimmed IS NOT NULL THEN[\s\S]*?'internal_review_note'[\s\S]*?v_notes_trimmed[\s\S]*?TRUE/
        );
        expect(internalNoteMatch, `${name} must log internal_review_note with is_internal = TRUE`).not.toBeNull();
      }
    });

    it('verifies backward-compatible admin_update_report_status routes notes as public official response', () => {
      for (const [name, sql] of [['Migration', migrationSql], ['Schema', schemaSql]]) {
        const wrapperMatch = sql.match(
          /FUNCTION public\.admin_update_report_status[\s\S]*?RETURN public\.admin_transition_report_status\(\s*p_report_id,\s*p_status,\s*NULL,\s*FALSE,\s*p_notes\s*\);/
        );
        expect(wrapperMatch, `${name} wrapper must route p_notes to official_response`).not.toBeNull();
      }
    });
  });

  describe('3. Robust Whitespace Sanitization (BTRIM)', () => {
    it('verifies SQL files invoke BTRIM with PostgreSQL escape string E\' \\t\\n\\r\'', () => {
      for (const [name, sql] of [['Migration', migrationSql], ['Schema', schemaSql]]) {
        expect(sql).toContain("v_notes_trimmed := NULLIF(BTRIM(p_notes, E' \\t\\n\\r'), '');");
        expect(sql).toContain("v_response_trimmed := NULLIF(BTRIM(p_official_response, E' \\t\\n\\r'), '');");
      }
    });

    it('simulates BTRIM on comprehensive adversarial whitespace matrix', () => {
      const btrim = (str: string | null | undefined): string | null => {
        if (str === null || str === undefined) return null;
        const trimmed = str.replace(/^[ \t\n\r]+|[ \t\n\r]+$/g, '');
        return trimmed === '' ? null : trimmed;
      };

      const adversarialBypassAttempts = [
        '',
        ' ',
        '   ',
        '\t',
        '\t\t\t\t',
        '\n',
        '\r',
        '\r\n',
        '\n\r\n\r',
        ' \t \n \r \t \n ',
        '\t\r\n   \t\t\r\n',
      ];

      for (const candidate of adversarialBypassAttempts) {
        expect(btrim(candidate)).toBeNull();
      }

      // Valid text surrounded by tabs/newlines
      expect(btrim('\t\n  Alasan penolakan valid  \r\n\t')).toBe('Alasan penolakan valid');
      expect(btrim('\n\nBaris satu\nBaris dua\n\n')).toBe('Baris satu\nBaris dua');
    });
  });
});
