import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import UsersSettings from '../users-settings';
import '../workspace.css';
export default async function UsersPage(){
 const user=await currentUser();
 if(!user)redirect('/login');
 if(!can(user.role,'users:manage'))redirect('/');
 return <main className="eo-shell" style={{minHeight:'100vh',background:'#f8f8fb',padding:'clamp(12px,3vw,32px)',fontFamily:'Inter,Arial,sans-serif'}}>
 <div style={{maxWidth:1200,margin:'auto'}}>
 <Link href="/" style={{display:'inline-block',marginBottom:20,color:'#b5417b'}}>← Kembali ke Vinca Workspace</Link>
 <UsersSettings currentRole={user.role}/>
 </div></main>;
}
