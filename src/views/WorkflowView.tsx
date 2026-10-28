import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  ShieldCheck,
  ArrowRightLeft,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTitik } from '../context/TitikContext';
import './WorkflowView.css';

export const WorkflowView: React.FC = () => {
  const navigate = useNavigate();
  const { openReportModal } = useTitik();

  const stages = [
    {
      step: '01',
      title: 'Lapor Mandiri & Dokumentasi Bukti',
      tagline: 'Partisipasi tanpa sekat birokrasi',
      icon: Camera,
      summary:
        'Warga mengunggah bukti visual (foto/video) masalah fasilitas publik dan menandai titik koordinat geospasial secara presisi. Tidak ada kewajiban registrasi akun atau pengumpulan data pribadi sensitif.',
      features: [
        'Dukungan multi-rasio media (1:1, 4:3, 16:9, video 9:16)',
        'Pin lokasi interaktif berbasis peta wilayah Kota Bogor',
        'Opsi anonimitas penuh dengan token pelacakan 16-karakter',
      ],
    },
    {
      step: '02',
      title: 'Validasi & Resonansi Komunitas',
      tagline: 'Kekuatan suara kolektif warga',
      icon: ShieldCheck,
      summary:
        'Laporan masuk ke feed publik agar warga di lingkungan sekitar dapat memverifikasi fakta di lapangan dengan tombol "Saya Terdampak Juga", memberikan komentar saksi mata, dan memperkuat urgensi penanganan.',
      features: [
        'Pembedaan tegas antara opini diskusi dan laporan terverifikasi',
        'Metrik dukungan warga (upvote berdampak)',
        'Moderasi komunitas anti-spam & anti-hoaks',
      ],
    },
    {
      step: '03',
      title: 'Korelasi APBD SIKD Kemendagri',
      tagline: 'Menghubungkan masalah dengan anggaran daerah',
      icon: ArrowRightLeft,
      summary:
        'Setiap laporan dipetakan secara otomatis dengan pagu anggaran sektor APBD 2026 yang relevan (drainase, jalan, penerangan jalan umum, sekolah) dan dinas penanggung jawabnya.',
      features: [
        'Transparansi pagu vs realisasi belanja APBD Kota Bogor',
        'Indikator skor ketanggapan dinas berwenang',
        'Sumber data terbuka SIKD Kemendagri & Portal Satu Data',
      ],
    },
    {
      step: '04',
      title: 'Audit Terbuka & Tindak Lanjut Nyata',
      tagline: 'Jejak audit permanen hingga tuntas',
      icon: CheckCircle2,
      summary:
        'Setiap perubahan status (peninjauan admin, koordinasi ke dinas, hingga penyelesaian fisik) dicatat dalam riwayat audit permanen yang dapat dipantau oleh siapa saja melalui ID Referensi Publik.',
      features: [
        'Pelacakan mandiri tanpa login melalui /track',
        'State-machine transisi status transparan & log waktu resmi',
        'Dokumentasi komparasi bukti kondisi sebelum & sesudah',
      ],
    },
  ];

  const comparisons = [
    {
      aspect: 'Akses Pelaporan',
      traditional: 'Formulir rumit, wajib KTP/registrasi akun birokratis.',
      titik: 'Bebas hambatan, bisa anonim dengan token audit mandiri.',
    },
    {
      aspect: 'Konsep Visibilitas',
      traditional: 'Tertutup di inbox admin dinas, progres tidak diketahui.',
      titik: 'Terbuka di feed komunitas, warga lain bisa ikut menguatkan.',
    },
    {
      aspect: 'Konteks Anggaran',
      traditional: 'Terpisah dari dokumen APBD, anggaran tidak transparan.',
      titik: 'Langsung terhubung dengan alokasi belanja sektor APBD 2026.',
    },
    {
      aspect: 'Akuntabilitas',
      traditional: 'Klaim sepihak tanpa bukti visual penyelesaian.',
      titik: 'Log audit permanen dengan verifikasi bukti foto lapangan.',
    },
  ];

  return (
    <>
      {/* 1. Mobile-Only Header */}
      <header className="lg:hidden h-14 bg-[#F7F6F1] dark:bg-[#131916] border-b border-[#E4E2DA] dark:border-[#26352E] px-4 flex items-center justify-between shrink-0 z-20">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 text-xl font-black tracking-tight text-[#20221D] dark:text-[#F3F6F4]"
        >
          <span>TITIK</span>
          <span className="w-2 h-2 rounded-full bg-[#263F35] dark:bg-[#10B981]"></span>
        </a>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#263F35] dark:text-[#34D399]">
          <Sparkles className="w-4 h-4" />
          <span>Alur Akuntabilitas</span>
        </div>
      </header>


      {/* 3. Main Full-Height Scrollable Workflow Guide */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar p-4 lg:p-10 w-full max-w-5xl space-y-8 pb-24 lg:pb-16 min-w-0">
        {/* Hero Banner with Geometric Ribbons & Angled Slashes (-35deg) */}
        <div className="workflow-hero-banner relative overflow-hidden rounded-3xl p-6 lg:p-8 flex flex-col justify-between border border-[#263F35]/20 shadow-xs">
          {/* Geometric Angled Slashes Container */}
          <div className="workflow-slashes-container" aria-hidden="true">
            <div className="workflow-ambient-glow" />
            <div className="workflow-ribbon workflow-ribbon-1" />
            <div className="workflow-ribbon workflow-ribbon-2" />
            <div className="workflow-slash-line workflow-slash-1" />
            <div className="workflow-slash-line workflow-slash-2" />
          </div>

          <div className="relative z-10 space-y-2.5 max-w-3xl">
            <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Alur Akuntabilitas 4 Tahap TITIK.
            </h1>

            <p className="text-xs lg:text-sm text-[#E7EBDD]/90 leading-relaxed">
              Menjembatani aspirasi warga dengan tindak nyata pemerintah daerah. Dari rekaman
              masalah fasilitas publik hingga pencocokan alokasi APBD dan riwayat penyelesaian yang
              dapat diaudit oleh seluruh masyarakat.
            </p>
          </div>
        </div>

        {/* 4 Stages Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#686B65] dark:text-[#9EACA3]">
            Siklus Hidup Laporan Sipil Terverifikasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stages.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="workflow-stage-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-[#263F35]/40 dark:hover:border-[#10B981]/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`workflow-step-badge workflow-step-badge--${st.step}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tabular-nums font-bold tracking-wider text-[#263F35] dark:text-[#34D399]">
                        TAHAP {st.step} • {st.tagline.toUpperCase()}
                      </span>
                      <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4] leading-snug mt-0.5">
                        {st.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-[#686B65] dark:text-[#9EACA3] leading-relaxed">{st.summary}</p>

                  <div className="pt-3 border-t border-[#E4E2DA]/60 dark:border-[#26352E]">
                    <ul className="space-y-1.5">
                      {st.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#20221D]/90 dark:text-[#F3F6F4]/90">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#263F35] dark:bg-[#10B981] mt-1.5 shrink-0"></span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison Table: Traditional vs TITIK */}
        <div className="workflow-comparison-card bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] rounded-3xl p-6 lg:p-7 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#20221D] dark:text-[#F3F6F4]">
              Mengapa TITIK Berbeda dengan Kanal Tradisional?
            </h2>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-1">
              Prinsip desain utama kami adalah memisahkan diskusi publik, laporan klaim warga, dan
              tindak lanjut resmi lembaga negara secara transparan.
            </p>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E2DA] dark:border-[#26352E] text-[#686B65] dark:text-[#9EACA3]">
                  <th className="py-3 pr-4 font-bold uppercase tracking-wider text-[11px]">Aspek</th>
                  <th className="py-3 pr-4 font-bold uppercase tracking-wider text-[11px]">
                    Kanal Pengaduan Konvensional
                  </th>
                  <th className="py-3 font-bold uppercase tracking-wider text-[11px] text-[#263F35] dark:text-[#34D399]">
                    TITIK. (Civic Social & Audit)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E2DA]/60 dark:divide-[#26352E]">
                {comparisons.map((c, i) => (
                  <tr key={i} className="hover:bg-[#F7F6F1]/50 dark:hover:bg-[#131916]/50 transition-colors">
                    <td className="py-3.5 pr-4 font-semibold text-[#20221D] dark:text-[#F3F6F4] whitespace-nowrap">{c.aspect}</td>
                    <td className="py-3.5 pr-4 text-[#686B65] dark:text-[#9EACA3] leading-relaxed">{c.traditional}</td>
                    <td className="py-3.5 font-medium text-[#263F35] dark:text-[#34D399] leading-relaxed">{c.titik}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Banners */}
        <div className="workflow-action-banner p-6 bg-[#E7EBDD] dark:bg-[#1A2E24] border border-[#263F35]/20 dark:border-[#10B981]/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#20221D] dark:text-[#F3F6F4]">Siap Mengawal Fasilitas Kota?</h3>
            <p className="text-xs text-[#686B65] dark:text-[#9EACA3] mt-0.5">
              Laporkan masalah jalan rusak, drainase tersumbat, atau fasilitas umum lainnya hari ini.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={openReportModal}
              className="workflow-pill-btn px-5 py-2.5 bg-[#263F35] dark:bg-[#10B981] text-white dark:text-[#0A1610] rounded-full text-xs font-semibold hover:bg-[#1d3129] dark:hover:bg-[#34D399] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Buat Laporan Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="/track"
              className="workflow-pill-btn px-5 py-2.5 bg-white dark:bg-[#1A221E] border border-[#E4E2DA] dark:border-[#26352E] text-[#20221D] dark:text-[#F3F6F4] rounded-full text-xs font-semibold hover:bg-[#F7F6F1] dark:hover:bg-[#131916] transition-all"
            >
              Lacak Status Laporan
            </a>
          </div>
        </div>
      </main>

      {/* 4. Mobile Bottom Navigation */}
    </>
  );
};
