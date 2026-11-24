(function(){
  const me=Auth.require('admin');if(!me)return;
  $('#who').textContent=me.name;$('#out').onclick=()=>Auth.logout();
  const cars=()=>DB.get('cars',[]),books=()=>DB.get('bookings',[]);

  function stats(){
    const b=books(),c=cars(),cust=DB.get('users',[]).filter(u=>u.role==='customer');
    const rev=b.filter(x=>['Confirmed','Active','Completed'].includes(x.status)).reduce((a,x)=>a+x.total,0);
    $('#cards').innerHTML=[['Total bookings',b.length],['Revenue',money(rev)],['Active rentals',b.filter(x=>x.status==='Active').length],['Cars available',c.filter(x=>x.status==='Available').length+' / '+c.length],['Customers',cust.length]]
      .map(([l,v])=>`<div class="col-6 col-xl"><div class="card"><div class="card-body"><div class="text-secondary small">${l}</div><div class="stat">${v}</div></div></div></div>`).join('');
    $('#bystatus').innerHTML=BOOKING_STATUS.map(s=>{const n=b.filter(x=>x.status===s).length,p=b.length?Math.round(n/b.length*100):0;
      return `<div class="mb-3"><div class="d-flex justify-content-between small"><span>${s}</span><span>${n}</span></div><div class="progress" role="progressbar" aria-label="${s}" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${p}%"></div></div></div>`}).join('');
    const top={};b.filter(x=>x.status!=='Cancelled').forEach(x=>top[x.carName]=(top[x.carName]||0)+1);
    const t=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,5);
    $('#top').innerHTML=t.length?t.map(([n,v])=>`<li class="list-group-item d-flex justify-content-between bg-transparent"><span>${esc(n)}</span><span class="badge text-bg-primary">${v}</span></li>`).join(''):'<li class="list-group-item bg-transparent text-secondary">No bookings yet.</li>';
  }

  function vehicles(){
    $('#ctab').innerHTML=cars().map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.category)}</td><td>${money(c.price)}</td><td>${c.seats}</td><td>${badge(c.status)}</td><td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-primary" data-edit="${c.id}">Edit</button> <button class="btn btn-sm btn-outline-danger" data-rm="${c.id}">Remove</button></td></tr>`).join('')||'<tr><td colspan="6" class="text-center text-secondary py-4">No vehicles yet. Add the first one.</td></tr>';
  }
  const cm=new bootstrap.Modal('#carModal'),cf=$('#carForm'),f=id=>$('#'+id);
  function openCar(c){
    cf.reset();cf.classList.remove('was-validated');$('#cmTitle').textContent=c?'Edit vehicle':'Add vehicle';
    f('cid').value=c?c.id:'';
    if(c){f('cname').value=c.name;f('cbrand').value=c.brand;f('ccat').value=c.category;f('cprice').value=c.price;f('cseats').value=c.seats;f('ctrans').value=c.transmission;f('cfuel').value=c.fuel;f('cstatus').value=c.status;f('cimg').value=c.image||''}
    cm.show();
  }
  $('#addCar').onclick=()=>openCar(null);
  $('#ctab').addEventListener('click',e=>{
    const ed=e.target.closest('[data-edit]'),rm=e.target.closest('[data-rm]');
    if(ed)openCar(cars().find(c=>c.id===ed.dataset.edit));
    if(rm&&confirm('Remove this vehicle? Existing bookings keep its name.')){DB.set('cars',cars().filter(c=>c.id!==rm.dataset.rm));toast('Vehicle removed.');all()}
  });
  cf.addEventListener('submit',e=>{
    e.preventDefault();if(!validate(cf))return;
    const l=cars(),id=f('cid').value;
    const c={id:id||uid(),name:f('cname').value.trim(),brand:f('cbrand').value.trim(),category:f('ccat').value,price:+f('cprice').value,seats:+f('cseats').value,transmission:f('ctrans').value,fuel:f('cfuel').value,status:f('cstatus').value,image:f('cimg').value.trim()};
    if(id)l[l.findIndex(x=>x.id===id)]=c;else l.push(c);
    DB.set('cars',l);cm.hide();toast(id?'Vehicle updated.':'Vehicle added.');all();
  });

  function bookingsTable(){
    const fl=$('#bfilter').value,l=books().filter(b=>!fl||b.status===fl).sort((a,b)=>b.created.localeCompare(a.created));
    $('#btab').innerHTML=l.length?l.map(b=>`<tr><td>${esc(b.userName)}</td><td>${esc(b.carName)}</td><td class="text-nowrap">${b.start} to ${b.end}</td><td>${money(b.total)}</td><td><select class="form-select form-select-sm" data-st="${b.id}" aria-label="Booking status">${BOOKING_STATUS.map(s=>`<option ${s===b.status?'selected':''}>${s}</option>`).join('')}</select></td><td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del="${b.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="6" class="text-center text-secondary py-4">No bookings match this filter.</td></tr>';
  }
  $('#bfilter').innerHTML='<option value="">All statuses</option>'+BOOKING_STATUS.map(s=>`<option>${s}</option>`).join('');
  $('#bfilter').addEventListener('input',bookingsTable);
  $('#btab').addEventListener('change',e=>{
    const s=e.target.closest('[data-st]');if(!s)return;
    const l=books(),b=l.find(x=>x.id===s.dataset.st);b.status=s.value;DB.set('bookings',l);syncCar(b.carId);toast('Booking set to '+s.value+'.');all();
  });
  $('#btab').addEventListener('click',e=>{
    const d=e.target.closest('[data-del]');if(!d||!confirm('Delete this booking permanently?'))return;
    const b=books().find(x=>x.id===d.dataset.del);DB.set('bookings',books().filter(x=>x.id!==d.dataset.del));syncCar(b.carId);toast('Booking deleted.');all();
  });

  function all(){stats();vehicles();bookingsTable()}
  all();router('overview');
})();
