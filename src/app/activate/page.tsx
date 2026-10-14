import { redirect } from 'next/navigation';
// Self-service email activation has been retired for the internal ERP.
// Owner accounts are securely provisioned by the authorized administrator.
export default function Activate(){redirect('/login')}
