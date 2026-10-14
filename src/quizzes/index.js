import tekaImej from './teka-imej.js'
import enores from './enores.js'

// Tambah kuiz baharu: cipta fail dalam folder ini dan masukkan ke senarai di bawah.
//
// Bentuk soalan:
//   prompt   — teks soalan (wajib)
//   choices  — 4 pilihan jawapan (wajib)
//   correct  — indeks jawapan betul dalam `choices` (lalai 0)
//   answer   — teks jawapan untuk dipaparkan (lalai: choices[correct])
//   image    — gambar dalam /public (pilihan)
//   accept   — senarai jawapan diterima untuk mod taip (wajib jika kuiz menyokong mod 'text')
//   why      — penerangan selepas jawapan didedahkan (pilihan)
//
// Medan kuiz: id, title, category (cth. '📘 Latihan'), subtitle, modes, shuffle, defaultDuration, questions
export const QUIZZES = [tekaImej, enores]

export const getQuiz = (id) => QUIZZES.find((q) => q.id === id) ?? QUIZZES[0]

export const correctIndex = (q) => q.correct ?? 0
export const answerText = (q) => q.answer ?? q.choices[correctIndex(q)]
