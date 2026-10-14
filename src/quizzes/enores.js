// Kuiz daripada Bengkel e-NORES Kota Kinabalu (Jabatan Tenaga Kerja Sabah).
// `correct` ialah indeks jawapan betul; susunan pilihan dikekalkan (ada pilihan "Semua di atas").
export default {
  id: 'enores',
  title: 'Kuiz e-NORES',
  subtitle: 'Lesen Untuk Menggaji Pekerja Bukan Pemastautin — Ordinan Buruh (Sabah Bab 67).',
  modes: ['choice'],
  shuffle: false,
  defaultDuration: 20,
  reflection:
    'Selepas ini, apabila saya menguruskan Lesen Penggajian Pekerja Bukan Pemastautin, saya akan …',
  questions: [
    {
      prompt: 'Apakah maksud eNORES?',
      choices: [
        'Sistem Elektronik Notis Rekod Syarikat',
        'Sistem Bersepadu Pengurusan Pekerja Bukan Pemastautin',
        'Sistem Pendaftaran Pekerja Asing Nasional',
        'Sistem Rekod Elektronik Majikan Sabah',
      ],
      correct: 1,
      why: 'eNORES ialah Sistem Bersepadu Pengurusan Pekerja Bukan Pemastautin di bawah Jabatan Tenaga Kerja Sabah.',
    },
    {
      prompt: 'Siapakah yang perlu memohon Lesen Untuk Menggaji Pekerja Bukan Pemastautin?',
      choices: [
        'Pekerja asing itu sendiri',
        'Jabatan Imigresen',
        'Majikan yang menggaji pekerja bukan pemastautin',
        'Kedutaan negara asal pekerja',
      ],
      correct: 2,
      why: 'Majikan wajib memohon lesen di bawah Seksyen 118 Ordinan Buruh (Sabah Bab 67).',
    },
    {
      prompt: 'Seorang majikan di Kota Kinabalu menggaji pekerja dari Selangor. Adakah majikan tersebut perlu memohon lesen?',
      choices: [
        'Tidak, kerana pekerja ialah warganegara Malaysia',
        'Ya, kerana pekerja dari Semenanjung ialah pekerja bukan pemastautin di Sabah',
        'Tidak, hanya pekerja asing memerlukan lesen',
        'Ya, tetapi hanya jika pekerja bekerja lebih setahun',
      ],
      correct: 1,
      why: 'Pekerja dari Semenanjung Malaysia dan Sarawak termasuk dalam takrif pekerja bukan pemastautin di Sabah.',
    },
    {
      prompt: 'Encik Ali ialah pengarah syarikat dan memegang saham. Dia TIDAK mempunyai kontrak perkhidmatan dan tidak dibayar gaji. Adakah lesen diperlukan untuknya?',
      choices: [
        'Ya, semua pengarah wajib dilesenkan',
        'Tidak, dia termasuk dalam kategori yang dikecualikan',
        'Ya, jika syarikat mempunyai cawangan',
        'Bergantung kepada umurnya',
      ],
      correct: 1,
      why: 'Pemegang saham dan pengarah dikecualikan, kecuali jika mempunyai kontrak perkhidmatan dan dibayar gaji.',
    },
    {
      prompt: 'Antara berikut, yang manakah termasuk dalam pekerja bukan pemastautin?',
      choices: [
        'Ekspatriat',
        'Pasangan warga asing yang mendapat kebenaran khas bekerja',
        'Pekerja dari Sarawak',
        'Semua di atas',
      ],
      correct: 3,
      why: 'Pekerja bukan pemastautin meliputi pekerja Semenanjung dan Sarawak, ekspatriat, pekerja asing serta pasangan warga asing yang mendapat kebenaran khas bekerja.',
    },
  ],
}
