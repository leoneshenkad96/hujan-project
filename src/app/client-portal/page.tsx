import {redirect} from 'next/navigation';
import {and,eq} from 'drizzle-orm';
import {getDatabase} from '@/db/client';
import {clientEventAccess,events} from '@/db/schema';
import {currentUser} from '@/lib/auth';
import ClientLogoutButton from './logout-button';

export const dynamic='force-dynamic';

export default async function ClientPortalPage(){
 const user=await currentUser();
 if(!user)redirect('/login');
 if(user.role!=='client_viewer')redirect('/');
 const [event]=await getDatabase().select({title:events.title,type:events.type,eventDate:events.eventDate,venue:events.venue,status:events.status,progress:events.progress})
  .from(clientEventAccess).innerJoin(events,and(eq(clientEventAccess.eventId,events.id),eq(clientEventAccess.organizationId,events.organizationId)))
  .where(and(eq(clientEventAccess.userId,user.id),eq(clientEventAccess.organizationId,user.organizationId),eq(events.organizationId,user.organizationId))).limit(1);
 return <main style={{minHeight:'100vh',background:'#f7f5f8',padding:'clamp(20px,5vw,56px)',fontFamily:'Arial, sans-serif',color:'#28263b'}}>
  <div style={{maxWidth:860,margin:'0 auto'}}>
   <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:32}}><div><h1 style={{margin:'0 0 6px'}}>Vinca ERP</h1><p style={{margin:0,color:'#777181'}}>Portal pemantauan event klien</p></div><ClientLogoutButton/></header>
   {event?<section style={{background:'white',border:'1px solid #ebe7ee',borderRadius:16,padding:'clamp(20px,4vw,36px)',boxShadow:'0 8px 28px #3022380b'}}>
    <p style={{margin:'0 0 8px',color:'#b5417b',fontWeight:700}}>EVENT YANG DIBAGIKAN KEPADA ANDA</p><h2 style={{fontSize:28,margin:'0 0 22px'}}>{event.title}</h2>
    <dl style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:18,margin:0}}>
     <div><dt style={{color:'#777181',fontSize:13}}>Tanggal</dt><dd style={{margin:'6px 0 0',fontWeight:600}}>{event.eventDate}</dd></div>
     <div><dt style={{color:'#777181',fontSize:13}}>Jenis acara</dt><dd style={{margin:'6px 0 0',fontWeight:600}}>{event.type}</dd></div>
     <div><dt style={{color:'#777181',fontSize:13}}>Lokasi</dt><dd style={{margin:'6px 0 0',fontWeight:600}}>{event.venue||'Belum ditentukan'}</dd></div>
     <div><dt style={{color:'#777181',fontSize:13}}>Status</dt><dd style={{margin:'6px 0 0',fontWeight:600}}>{event.status.replaceAll('_',' ')}</dd></div>
    </dl>
    <div style={{marginTop:28}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><strong>Progres persiapan</strong><span>{event.progress}%</span></div><div role="progressbar" aria-label="Progres persiapan event" aria-valuemin={0} aria-valuemax={100} aria-valuenow={event.progress} style={{height:12,background:'#eeeaf1',borderRadius:99,overflow:'hidden'}}><span style={{display:'block',height:'100%',width:`${event.progress}%`,background:'#d64d89',borderRadius:99}}/></div></div>
    <p style={{margin:'24px 0 0',fontSize:13,color:'#777181'}}>Informasi internal seperti biaya vendor, anggaran, dan catatan tim tidak ditampilkan di portal ini.</p>
   </section>:<section style={{background:'white',border:'1px solid #ebe7ee',borderRadius:16,padding:28}}><h2 style={{marginTop:0}}>Belum ada event yang dibagikan</h2><p style={{color:'#777181'}}>Hubungi tim Vinca untuk mendapatkan akses ke event Anda.</p></section>}
  </div>
 </main>;
}
