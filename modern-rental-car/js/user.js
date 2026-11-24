(function(){
  const me=Auth.require('customer');if(!me)return;
  $('#who').textContent=me.name;$('#out').onclick=()=>Auth.logout();
  const cars=()=>DB.get('cars',[]);

  const rows=(l,cancel)=>l.length?l.map(b=>`<tr><td>${esc(b.carName)}</td><td class="text-nowrap">${b.start} to ${b.end}</td><td>${money(b.total)}</td><td>${badge(b.status)}</td><td class="text-end">${cancel&&['Pending','Confirmed'].includes(b.status)?`<button class="btn btn-sm btn-outline-danger" data-cancel="${b.id}">Cancel</button>`:''}</td></tr>`).join(''):'<tr><td colspan="5" class="text-secondary text-center py-4">No bookings here yet.</td></tr>';
  function bookings(){
    const all=DB.get('bookings',[]).filter(b=>b.userId===me.id).sort((a,b)=>b.start.localeCompare(a.start));
    const cur=all.filter(b=>ACTIVE.includes(b.status));
    $('#cur').innerHTML=rows(cur,true);$('#past').innerHTML=rows(all.filter(b=>!cur.includes(b)),false);
  }
  $('#cur').addEventListener('click',e=>{
    const b=e.target.closest('[data-cancel]');if(!b||!confirm('Cancel this booking?'))return;
    const l=DB.get('bookings',[]);l.find(x=>x.id===b.dataset.cancel).status='Cancelled';DB.set('bookings',l);
    toast('Booking cancelled.');bookings();
  });

  const rf=$('#resForm'),sel=$('#rcar'),s=$('#rstart'),e=$('#rend');
  s.min=today();e.min=addDays(1);
  const pre=sessionStorage.getItem('mrc_car');
  sel.innerHTML='<option value="">Choose a car</option>'+cars().filter(c=>c.status==='Available').map(c=>`<option value="${c.id}">${esc(c.name)} - ${money(c.price)}/day</option>`).join('');
  if(pre){sel.value=pre;sessionStorage.removeItem('mrc_car');if(sel.value)location.hash='reserve'}
  function sum(){
    const c=cars().find(x=>x.id===sel.value),n=nights(s.value,e.value);
    if(s.value)e.min=ymd(new Date(new Date(s.value).getTime()+864e5));
    e.setCustomValidity(s.value&&e.value&&n<1?'Return date must be after pickup':'');
    $('#sum').innerHTML=c&&n>=1?`${n} day${n>1?'s':''} x ${money(c.price)} = <strong>${money(n*c.price)}</strong>`:'Pick a car and dates to see the total.';
  }
  [sel,s,e].forEach(x=>x.addEventListener('input',sum));sum();
  rf.addEventListener('submit',ev=>{
    ev.preventDefault();sum();if(!validate(rf))return;
    const c=cars().find(x=>x.id===sel.value),n=nights(s.value,e.value);
    if(!isFree(c.id,s.value,e.value)){$('#rmsg').innerHTML=`<div class="alert alert-danger py-2" role="alert">${esc(c.name)} is already booked for those dates. Try other dates or another car.</div>`;return}
    const l=DB.get('bookings',[]);
    l.push({id:uid(),userId:me.id,userName:me.name,carId:c.id,carName:c.name,start:s.value,end:e.value,total:n*c.price,status:'Pending',created:today()});
    DB.set('bookings',l);rf.reset();rf.classList.remove('was-validated');$('#rmsg').innerHTML='';sum();
    toast('Reservation sent. We will confirm it shortly.');location.hash='bookings';bookings();
  });

  const pf=$('#profForm'),pw=$('#npw'),pc=$('#npc');
  $('#pname').value=me.name;$('#pemail').value=me.email;$('#pphone').value=me.phone;
  const chk=()=>pc.setCustomValidity(pc.value!==pw.value?'Passwords do not match':'');
  pw.addEventListener('input',chk);pc.addEventListener('input',chk);
  pf.addEventListener('submit',ev=>{
    ev.preventDefault();chk();if(!validate(pf))return;
    const users=DB.get('users',[]),u=users.find(x=>x.id===me.id);
    u.name=$('#pname').value.trim();u.phone=$('#pphone').value.trim();if(pw.value)u.password=pw.value;
    DB.set('users',users);$('#who').textContent=u.name;pw.value=pc.value='';pf.classList.remove('was-validated');
    toast('Profile saved.');
  });

  bookings();router('bookings');
})();
