/** Formata "YYYY-MM-DD[Txx]" como "DD/MM/YYYY" sem conversão UTC. */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

/** Converte "YYYY-MM-DD[Txx]" em Date local (sem deslocamento de fuso). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}
