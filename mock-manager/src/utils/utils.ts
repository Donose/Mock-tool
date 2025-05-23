export function generateTransactionId() {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[-:.]/g, "");
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `${timestamp}${random}`;
}
export function generateTransactionTime() {
  const date = new Date();
  return date.toISOString();
}
