export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Jarak edit (Damerau–Levenshtein ringkas): huruf bertukar tempat ("durain") dikira satu kesilapan.
function levenshtein(a, b) {
  if (a === b) return 0
  let prev2 = null
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        cur[j] = Math.min(cur[j], prev2[j - 2] + 1)
      }
    }
    prev2 = prev
    prev = cur
  }
  return prev[b.length]
}

const tolerance = (len) => (len >= 7 ? 2 : len >= 4 ? 1 : 0)

// Padanan longgar: keseluruhan jawapan mesti sama dengan salah satu jawapan diterima,
// dengan toleransi salah ejaan kecil (cth. "kucng", "durain"). Tidak terima jawapan yang
// sekadar mengandungi perkataan betul — supaya peserta tidak boleh taip beberapa tekaan sekali gus.
export function isMatch(input, accepted) {
  const n = normalize(input)
  if (!n) return false
  return accepted.some((raw) => {
    const a = normalize(raw)
    return !!a && levenshtein(n, a) <= tolerance(a.length)
  })
}
