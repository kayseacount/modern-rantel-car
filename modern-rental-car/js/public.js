(function(){
  const u=Auth.current();
  $('#navAuth').innerHTML=u?`<a class="btn btn-primary btn-sm" href="${Auth.home(u.role)}">Dashboard</a><button class="btn btn-outline-secondary btn-sm" id="out">Log out</button>`
    :`<a class="btn btn-outline-primary btn-sm" href="login.html">Log in</a><a class="btn btn-primary btn-sm" href="register.html">Register</a>`;
  if($('#out'))$('#out').onclick=()=>Auth.logout();

  const cars=()=>DB.get('cars',[]);
  $('#cat').innerHTML='<option value="">All categories</option>'+[...new Set(cars().map(c=>c.category))].map(c=>`<option>${esc(c)}</option>`).join('');
  function render(){
    const q=$('#q').value.toLowerCase().trim(),cat=$('#cat').value,max=+$('#max').value||Infinity;
    const list=cars().filter(c=>(c.name+' '+c.brand).toLowerCase().includes(q)&&(!cat||c.category===cat)&&c.price<=max);
    $('#count').textContent=list.length+(list.length===1?' car':' cars');
    $('#grid').innerHTML=list.length?list.map(carCard).join(''):'<div class="col-12"><div class="alert alert-secondary">No cars match these filters. Clear a filter to see more of the fleet.</div></div>';
  }
  ['q','cat','max'].forEach(id=>$('#'+id).addEventListener('input',render));
  render();

  const dm=new bootstrap.Modal('#dm');let sel=null;
  $('#grid').addEventListener('click',e=>{
    const b=e.target.closest('[data-car]');if(!b)return;
    sel=cars().find(c=>c.id===b.dataset.car);
    $('#dmTitle').textContent=sel.name;
    $('#dmBody').innerHTML=`${carImg(sel)}<dl class="row mt-3 mb-0"><dt class="col-5">Price</dt><dd class="col-7">${money(sel.price)} per day</dd><dt class="col-5">Category</dt><dd class="col-7">${esc(sel.category)}</dd><dt class="col-5">Brand</dt><dd class="col-7">${esc(sel.brand)}</dd><dt class="col-5">Seats</dt><dd class="col-7">${sel.seats}</dd><dt class="col-5">Transmission</dt><dd class="col-7">${esc(sel.transmission)}</dd><dt class="col-5">Fuel</dt><dd class="col-7">${esc(sel.fuel)}</dd><dt class="col-5">Status</dt><dd class="col-7">${badge(sel.status)}</dd></dl>`;
    $('#dmGo').disabled=sel.status!=='Available';
    $('#dmGo').textContent=sel.status==='Available'?'Reserve this car':'Not available now';
    dm.show();
  });
  $('#dmGo').addEventListener('click',()=>{
    const cu=Auth.current();
    if(!cu||cu.role==='customer')sessionStorage.setItem('mrc_car',sel.id);
    location.href=cu?Auth.home(cu.role):'login.html';
  });
})();
