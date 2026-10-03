/** Creation history, not traffic analytics. UTC boundaries keep counts stable. */
export function creationHistory(businesses: {createdAt: Date}[], leads: {createdAt: Date}[], now = new Date()) {
  return Array.from({length:12}, (_, index) => {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const count = (rows: {createdAt: Date}[]) => rows.filter(row => row.createdAt >= start && row.createdAt < end && row.createdAt <= now).length;
    return {label:start.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'}), businesses:count(businesses), leads:count(leads)};
  });
}
export function leadAge(date: Date, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}
