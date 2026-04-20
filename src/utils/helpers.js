export const EXT_LANG = {
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  ts: 'TypeScript', tsx: 'TypeScript',
  py: 'Python', pyw: 'Python',
  java: 'Java',
  go: 'Go',
  rs: 'Rust',
  rb: 'Ruby',
  php: 'PHP',
  cs: 'C#',
  cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++',
  c: 'C', h: 'C',
  swift: 'Swift',
  kt: 'Kotlin', kts: 'Kotlin',
  scala: 'Scala',
  sh: 'Bash',
  sql: 'SQL',
  html: 'HTML', css: 'CSS',
  vue: 'Vue', svelte: 'Svelte',
};

export const SKIP_DIRS = [
  'node_modules', '.git', 'dist', 'build', '__pycache__',
  '.next', '.nuxt', 'vendor', 'target', '.venv', 'venv',
  'env', 'coverage', '.cache'
];

export const MAX_FILES = 50;
export const MAX_FILE_SIZE = 200_000;
export const MAX_PAYLOAD_SIZE = 400_000;

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

export function highlightCode(text) {
  if (!text) return '';
  let h = escapeHtml(text);
  // Comments
  h = h.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="cmt">$1</span>');
  // Strings
  h = h.replace(/(&#39;[^&#]*?&#39;|&quot;[^&]*?&quot;|`[^`]*?`)/g, '<span class="str">$1</span>');
  // Keywords
  const kw = /\b(function|const|let|var|return|if|else|for|while|class|new|import|export|from|async|await|def|None|True|False|public|private|static|void|int|string|bool|this|self|null|undefined|true|false|typeof|instanceof|throw|try|catch|finally)\b/g;
  h = h.replace(kw, '<span class="kw">$1</span>');
  // Numbers
  h = h.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
  return h;
}
