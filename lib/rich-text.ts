// The article body and the Key-step diagram are edited with contentEditable,
// which happily emits <div>, <span style>, and whatever markup was pasted in.
// Only the formatting the editor actually offers is kept: bold, italic,
// underline, and super/subscripts for ions and formulae (H⁺, CO₂).
//
// A regex rather than DOM parsing, so this also runs during static prerendering.
const ALLOWED = 'i|em|b|strong|u|sup|sub|br'

export function sanitizeRich(html: string) {
  return html
    .replace(new RegExp(`<(?!/?(?:${ALLOWED})\\b)[^>]*>`, 'gi'), '')
    .replace(new RegExp(`<(/?)(${ALLOWED})\\b[^>]*>`, 'gi'), '<$1$2>')
    .replace(/&nbsp;/g, ' ')
}
