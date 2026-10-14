export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}

const tolerance = (len) => (len >= 7 ? 2 : len >= 4 ? 1 : 0)

// Padanan longgar: sama tepat, mengandungi frasa yang diterima,
// atau salah ejaan kecil (cth. "kucng", "durain").
export function isMatch(input, accepted) {
  const n = normalize(input)
  if (!n) return false
  const words = n.split(' ')
  return accepted.some((raw) => {
    const a = normalize(raw)
    if (!a) return false
    if (n === a || ` ${n} `.includes(` ${a} `)) return true
    const tol = tolerance(a.length)
    if (levenshtein(n, a) <= tol) return true
    // Bandingkan setiap kumpulan perkataan yang sama panjang dengan frasa diterima.
    const size = a.split(' ').length
    for (let i = 0; i + size <= words.length; i++) {
      if (levenshtein(words.slice(i, i + size).join(' '), a) <= tol) return true
    }
    return false
  })
}
