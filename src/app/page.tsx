import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Workspace from './workspace';
export const dynamic='force-dynamic';
export default async function Home(){
 const user=await currentUser();
 if(!user) redirect('/login');
 return <Workspace role={user.role} />;
}
