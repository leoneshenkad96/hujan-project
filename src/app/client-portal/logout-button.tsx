'use client';
export default function ClientLogoutButton(){
 async function logout(){
  const response=await fetch('/api/auth/logout',{method:'POST'});
  if(response.ok)window.location.assign('/login');
 }
 return <button type="button" onClick={()=>void logout()} style={{border:'1px solid #ddd5e3',background:'white',borderRadius:8,padding:'9px 13px',fontWeight:600}}>Keluar</button>;
}
