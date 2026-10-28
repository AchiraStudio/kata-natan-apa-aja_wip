import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SupabaseDataAdapter } from '../services/adapters/supabaseAdapter';
import { SupabaseDataAdapter as ReexportedSupabaseAdapter } from '../services/SupabaseDataAdapter';
import { MockDataAdapter } from '../services/adapters/mockAdapter';
import {
  dataService,
  getConnectionStatus,
  transitionReportStatus,
  verifyReportEvidence,
  setCitizenVerification,
  getPrivateEvidenceSignedUrl,
} from '../services/dataService';
import { storageService, getPrivateEvidenceUrl } from '../services/storageService';
import { ConnectionStatusBanner } from '../components/common/ConnectionStatusBanner';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { DataError } from '../services/errors/DataError';
import { ReportStatus, EvidenceStatus } from '../types/domain';

const ROOT_SRC = path.resolve(__dirname, '..');

describe('Milestone 2: Data Parity & Service Layer Hardening Suite', () => {
  // ===========================================================================
  // 1. ELIMINATE SILENT MOCK FALLBACKS IN SupabaseDataAdapter
  // ===========================================================================
  describe('1. Elimination of Silent Mock Fallbacks in SupabaseDataAdapter', () => {
    it('M2-1.1: confirms zero imports of MOCK_COMMENTS, MOCK_POSTS, and sessionCommentsFallback in source code', () => {
      const adapterFilePath = path.resolve(ROOT_SRC, 'services/adapters/supabaseAdapter.ts');
      const content = fs.readFileSync(adapterFilePath, 'utf-8');

      expect(content).not.toContain('MOCK_COMMENTS');
      expect(content).not.toContain('MOCK_POSTS');
      expect(content).not.toContain('sessionCommentsFallback');
      expect(content).not.toMatch(/from\s+['"].*mockCivicData['"]/);
    });

    it('M2-1.2: returns an empty array [] when a post has 0 comments instead of fake mock comments', async () => {
      const adapter = new SupabaseDataAdapter();
      const mockPostId = 'kn-001'; // Mock post ID that previously had 18 fake comments

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [], // Supabase returns 0 comments
              error: null,
            }),
          }),
        }),
      } as any);

      try {
        const comments = await adapter.getComments(mockPostId);
        expect(comments).toBeDefined();
        expect(Array.isArray(comments)).toBe(true);
        expect(comments.length).toBe(0); // Strictly empty! Zero mock fallback!
      } finally {
        fromSpy.mockRestore();
      }
    });

    it('M2-1.3: propagates typed DataError on database/network error without silent mock fallback', async () => {
      const adapter = new SupabaseDataAdapter();
      const mockPostId = 'kn-001';

      const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42501', message: 'permission denied for table comments' },
            }),
          }),
        }),
      } as any);

      try {
        await expect(adapter.getComments(mockPostId)).rejects.toThrow(DataError);
      } finally {
        fromSpy.mockRestore();
      }
    });

    it('M2-1.4: SupabaseDataAdapter is cleanly re-exported at src/services/SupabaseDataAdapter.ts', () => {
      expect(ReexportedSupabaseAdapter).toBe(SupabaseDataAdapter);
      const instance = new ReexportedSupabaseAdapter();
      expect(typeof instance.getFeedPosts).toBe('function');
      expect(typeof instance.getComments).toBe('function');
      expect(typeof instance.addComment).toBe('function');
      expect(typeof instance.transitionReportStatus).toBe('function');
    });
  });

  // ===========================================================================
  // 2. STORAGE SERVICE EXTRACTION (src/services/storageService.ts)
  // ===========================================================================
  describe('2. Storage Service Extraction & Private Signed URLs', () => {
    it('M2-2.1: storageService provides avatar and banner upload helpers', () => {
      expect(typeof storageService.uploadAvatar).toBe('function');
      expect(typeof storageService.uploadBanner).toBe('function');
      expect(typeof storageService.uploadPostMedia).toBe('function');
      expect(typeof storageService.uploadPrivateEvidence).toBe('function');
      expect(typeof storageService.getPrivateEvidenceUrl).toBe('function');
    });

    it('M2-2.2: getPrivateEvidenceUrl generates signed URL targeting report-evidence-private bucket', async () => {
      const filePath = 'usr-admin-1/damage_evidence_102.jpg';
      const signedUrl = await storageService.getPrivateEvidenceUrl(filePath);

      expect(signedUrl).toBeDefined();
      expect(signedUrl).toContain('report-evidence-private');
      expect(signedUrl).toContain(filePath);
      expect(signedUrl).toContain('token=');
    });

    it('M2-2.3: rejects empty or whitespace-only storage path with DataError validation', async () => {
      await expect(storageService.getPrivateEvidenceUrl('')).rejects.toThrow(DataError);
      await expect(storageService.getPrivateEvidenceUrl('   ')).rejects.toThrow(DataError);
    });

    it('M2-2.4: top-level getPrivateEvidenceUrl export operates identically to instance method', async () => {
      const url1 = await getPrivateEvidenceUrl('test_proof.png');
      expect(url1).toContain('report-evidence-private');
      expect(url1).toContain('test_proof.png');
    });
  });

  // ===========================================================================
  // 3. ADMINISTRATIVE & VERIFICATION SERVICE LAYER METHODS
  // ===========================================================================
  describe('3. Administrative & Verification Service Layer Methods', () => {
    let mockAdapter: MockDataAdapter;

    beforeEach(() => {
      mockAdapter = new MockDataAdapter();
    });

    it('M2-3.1: transitionReportStatus enforces mandatory note on rejected status', async () => {
      // Rejection with empty note must fail
      await expect(
        mockAdapter.transitionReportStatus('rep-test', 'rejected', '   ', false, '')
      ).rejects.toThrow(DataError);

      // Rejection with valid note succeeds
      const submitRes = await mockAdapter.submitReport({
        title: 'Laporan Uji Transisi',
        description: 'Deskripsi laporan uji',
        category: 'Infrastruktur',
        severity: 'low',
        address: 'Jl. Pemuda',
        latitude: -6.58,
        longitude: 106.79,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const rejected = await mockAdapter.transitionReportStatus(
        submitRes.report.id,
        'rejected',
        'Tidak memenuhi kriteria kerusakan aset publik Kota Bogor.',
        true,
        'Ditolak oleh verifikator.'
      );

      expect(rejected.status).toBe('rejected');
      expect(rejected.officialResponse).toContain('Ditolak oleh verifikator');
      expect(rejected.internalNotes).toContain('Tidak memenuhi kriteria');
    });

    it('M2-3.2: transitionReportStatus enforces mandatory clarification note on needs_info status', async () => {
      await expect(
        mockAdapter.transitionReportStatus('rep-test', 'needs_info', '', false, '')
      ).rejects.toThrow(DataError);

      const submitRes = await mockAdapter.submitReport({
        title: 'Laporan Butuh Info',
        description: 'Jalan rusak',
        category: 'Infrastruktur',
        severity: 'medium',
        address: 'Jl. Sudirman',
        latitude: -6.58,
        longitude: 106.79,
        mediaUrls: [],
        reporterType: 'verified_citizen',
      });

      const needsInfo = await mockAdapter.transitionReportStatus(
        submitRes.report.id,
        'needs_info',
        'Foto kurang jelas',
        false,
        'Mohon sertakan patok kilometer atau nomor ruko terdekat.'
      );

      expect(needsInfo.status).toBe('needs_info');
      expect(needsInfo.officialResponse).toContain('nomor ruko');
    });

    it('M2-3.3: verifyReportEvidence validates physical evidence status', async () => {
      const submitRes = await mockAdapter.submitReport({
        title: 'Verifikasi Bukti Foto',
        description: 'Gorong-gorong bocor',
        category: 'Infrastruktur',
        severity: 'high',
        address: 'Jl. Pajajaran',
        latitude: -6.58,
        longitude: 106.79,
        mediaUrls: ['https://example.com/p1.jpg'],
        reporterType: 'verified_citizen',
      });

      const verified = await mockAdapter.verifyReportEvidence(
        submitRes.report.id,
        'verified',
        'Bukti foto dan koordinat GPS telah divalidasi di lapangan.'
      );

      expect(verified.evidenceVerificationStatus).toBe('verified');
      expect(verified.evidence_verification_status).toBe('verified');
    });

    it('M2-3.4: setCitizenVerification updates verified citizen identity', async () => {
      const result = await mockAdapter.setCitizenVerification('usr-citizen-42', true, 'Identitas KTP tervalidasi.');
      expect(result).toBe(true);
    });

    it('M2-3.5: getPrivateEvidenceSignedUrl produces signed URL from dataService', async () => {
      const signedUrl = await getPrivateEvidenceSignedUrl('evidence/doc_001.pdf');
      expect(signedUrl).toContain('report-evidence-private');
      expect(signedUrl).toContain('evidence/doc_001.pdf');
    });

    it('M2-3.6: SupabaseDataAdapter delegates administrative RPC calls with contract validation', async () => {
      const supabaseAdapter = new SupabaseDataAdapter();

      // Enforces rejection contract before even calling RPC
      await expect(
        supabaseAdapter.transitionReportStatus('rep-999', 'rejected', '  ', false, '')
      ).rejects.toThrow(DataError);

      await expect(
        supabaseAdapter.transitionReportStatus('rep-999', 'needs_info', '', false, '')
      ).rejects.toThrow(DataError);

      // RPC call verification
      const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: {
          id: 'rep-999',
          status: 'accepted_for_routing',
          public_reference: 'TIK-2026-000999',
          title: 'Uji RPC',
          description: 'Uji Deskripsi',
          category: 'Infrastruktur',
          severity: 'medium',
          location: { address: 'Kota Bogor', latitude: -6.59, longitude: 106.8 },
          responsible_agency: 'PUPR',
          media_urls: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      } as any);

      try {
        const res = await supabaseAdapter.transitionReportStatus(
          'rep-999',
          'accepted_for_routing',
          'Diteruskan ke dinas'
        );
        expect(res.status).toBe('accepted_for_routing');
        expect(rpcSpy).toHaveBeenCalledWith('admin_transition_report_status', {
          p_report_id: 'rep-999',
          p_target_status: 'accepted_for_routing',
          p_notes: 'Diteruskan ke dinas',
          p_is_internal: false,
          p_official_response: null,
        });
      } finally {
        rpcSpy.mockRestore();
      }
    });
  });

  // ===========================================================================
  // 4. CONNECTION TRANSPARENCY & ConnectionStatusBanner
  // ===========================================================================
  describe('4. Connection Transparency & Error Banners', () => {
    it('M2-4.1: getConnectionStatus returns transparent status indicator', () => {
      const status = getConnectionStatus();
      expect(status).toBeDefined();
      expect(['connected', 'unconfigured', 'demo']).toContain(status.status);
      expect(typeof status.isConfigured).toBe('boolean');
      expect(typeof status.isLiveMode).toBe('boolean');
    });

    it('M2-4.2: dataService does not silently fall back to MockDataAdapter in live mode', () => {
      // In live mode (VITE_DATA_MODE !== 'demo'), dataService is strictly SupabaseDataAdapter
      if (import.meta.env.VITE_DATA_MODE !== 'demo') {
        expect(dataService instanceof SupabaseDataAdapter).toBe(true);
      } else {
        expect(dataService instanceof MockDataAdapter).toBe(true);
      }
    });

    it('M2-4.3: ConnectionStatusBanner renders informative alert when unconfigured or on error', () => {
      const html = renderToStaticMarkup(
        React.createElement(ConnectionStatusBanner, {
          runtimeError: 'Koneksi ke server terputus',
        })
      );

      expect(html).toContain('Gagal Terhubung ke Database');
      expect(html).toContain('Koneksi ke server terputus');
      expect(html).toContain('aria-label="Status Koneksi Basis Data"');
    });

    it('M2-4.4: ConnectionStatusBanner renders actionable retry button when onRetry is provided', () => {
      const html = renderToStaticMarkup(
        React.createElement(ConnectionStatusBanner, {
          runtimeError: 'Timeout',
          onRetry: () => {},
        })
      );

      expect(html).toContain('Coba Lagi');
    });
  });
});
