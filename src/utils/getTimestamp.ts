/**
 * 
 * @returns current Timestamp in 'DATE TIME UTC' format
 */
export default function getTimestamp(): string {
  const utcTime = new Date().toISOString().split('T');
  const date = utcTime[0];
  const time = utcTime[1].split('.')[0];
  return `${date} ${time} UTC`;
}
