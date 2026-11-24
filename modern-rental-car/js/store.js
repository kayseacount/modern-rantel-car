/* Shared data layer, helpers and auth. Data lives in localStorage (prefix mrc_). */
const DB={
  get(k,d){try{const v=localStorage.getItem('mrc_'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){localStorage.setItem('mrc_'+k,JSON.stringify(v))}
};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const money=n=>'$'+Number(n).toFixed(2);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)};
const today=()=>addDays(0);
const nights=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const ACTIVE=['Pending','Confirmed','Active'], BOOKING_STATUS=['Pending','Confirmed','Active','Completed','Cancelled'];
const badge=s=>`<span class="badge text-bg-${{Pending:'warning',Confirmed:'info',Active:'primary',Completed:'success',Cancelled:'secondary',Available:'success',Rented:'primary',Maintenance:'danger'}[s]||'secondary'}">${s}</span>`;
const icon={Economy:'🚗',SUV:'🚙',Luxury:'🏎️',Van:'🚐'};
const carImg=c=>c.image?`<img class="car-img" src="${esc(c.image)}" alt="${esc(c.name)}">`:`<div class="car-img" aria-hidden="true">${icon[c.category]||'🚗'}</div>`;
const carCard=c=>`<div class="col-sm-6 col-lg-4 col-xl-3"><div class="card h-100">${carImg(c)}<div class="card-body d-flex flex-column"><div class="d-flex justify-content-between align-items-start mb-1"><h3 class="h6 mb-0">${esc(c.name)}</h3>${badge(c.status)}</div><p class="small text-secondary mb-3">${esc(c.category)}, ${c.seats} seats, ${esc(c.transmission)}</p><div class="mt-auto d-flex justify-content-between align-items-center"><span><strong class="fs-5">${money(c.price)}</strong><span class="text-secondary small"> / day</span></span><button class="btn btn-outline-primary btn-sm" data-car="${c.id}">Details</button></div></div></div></div>`;

(function seed(){
  if(DB.get('seeded'))return;
  DB.set('cars',[
    {id:'c1',name:'Toyota Corolla',brand:'Toyota',category:'Economy',price:35,seats:5,transmission:'Automatic',fuel:'Petrol',status:'Available',image:''},
    {id:'c2',name:'Hyundai Elantra',brand:'Hyundai',category:'Economy',price:32,seats:5,transmission:'Automatic',fuel:'Petrol',status:'Available',image:''},
    {id:'c3',name:'Toyota RAV4',brand:'Toyota',category:'SUV',price:65,seats:5,transmission:'Automatic',fuel:'Hybrid',status:'Rented',image:''},
    {id:'c4',name:'Toyota Land Cruiser',brand:'Toyota',category:'SUV',price:120,seats:7,transmission:'Automatic',fuel:'Diesel',status:'Available',image:''},
    {id:'c5',name:'Mercedes C-Class',brand:'Mercedes',category:'Luxury',price:150,seats:5,transmission:'Automatic',fuel:'Petrol',status:'Available',image:''},
    {id:'c6',name:'Ford Transit',brand:'Ford',category:'Van',price:90,seats:12,transmission:'Manual',fuel:'Diesel',status:'Available',image:''},
    {id:'c7',name:'Suzuki Swift',brand:'Suzuki',category:'Economy',price:28,seats:4,transmission:'Manual',fuel:'Petrol',status:'Maintenance',image:''},
    {id:'c8',name:'Tesla Model 3',brand:'Tesla',category:'Luxury',price:110,seats:5,transmission:'Automatic',fuel:'Electric',status:'Available',image:''}
  ]);
  DB.set('users',[
    {id:'u1',name:'Site Admin',email:'admin@mrc.test',phone:'',password:'admin123',role:'admin'},
    {id:'u2',name:'Amina Yusuf',email:'user@mrc.test',phone:'+252634000000',password:'user123',role:'customer'},
    {id:'u3',name:'Omar Hassan',email:'omar@mrc.test',phone:'+252634111111',password:'user123',role:'customer'}
  ]);
  DB.set('bookings',[
    {id:'b1',userId:'u2',userName:'Amina Yusuf',carId:'c1',carName:'Toyota Corolla',start:addDays(-10),end:addDays(-7),total:105,status:'Completed',created:addDays(-12)},
    {id:'b2',userId:'u2',userName:'Amina Yusuf',carId:'c3',carName:'Toyota RAV4',start:addDays(-1),end:addDays(3),total:260,status:'Active',created:addDays(-3)},
    {id:'b3',userId:'u2',userName:'Amina Yusuf',carId:'c5',carName:'Mercedes C-Class',start:addDays(10),end:addDays(12),total:300,status:'Pending',created:addDays(0)},
    {id:'b4',userId:'u3',userName:'Omar Hassan',carId:'c2',carName:'Hyundai Elantra',start:addDays(2),end:addDays(5),total:96,status:'Confirmed',created:addDays(-1)},
    {id:'b5',userId:'u3',userName:'Omar Hassan',carId:'c4',carName:'Toyota Land Cruiser',start:addDays(-20),end:addDays(-18),total:240,status:'Cancelled',created:addDays(-22)}
  ]);
  DB.set('seeded',1);
})();

const Auth={
  current(){const s=DB.get('session',null);return s&&DB.get('users',[]).find(u=>u.id===s.id)||null},
  login(email,pw){const u=DB.get('users',[]).find(x=>x.email===email.trim().toLowerCase()&&x.password===pw);if(!u)return null;DB.set('session',{id:u.id});return u},
  logout(){localStorage.removeItem('mrc_session');location.href='index.html'},
  home(role){return role==='admin'?'admin.html':'dashboard.html'},
  require(role){const u=this.current();if(!u){location.replace('login.html');return null}if(u.role!==role){location.replace(this.home(u.role));return null}return u}
};

function isFree(carId,start,end,ignoreId){
  return !DB.get('bookings',[]).some(b=>b.carId===carId&&b.id!==ignoreId&&ACTIVE.includes(b.status)&&start<b.end&&end>b.start);
}
function syncCar(carId){
  const cars=DB.get('cars',[]),c=cars.find(x=>x.id===carId);
  if(!c||c.status==='Maintenance')return;
  c.status=DB.get('bookings',[]).some(b=>b.carId===carId&&b.status==='Active')?'Rented':'Available';
  DB.set('cars',cars);
}
function validate(f){f.classList.add('was-validated');return f.checkValidity()}
function toast(msg,type='success'){
  let c=$('#toasts');
  if(!c){c=document.createElement('div');c.id='toasts';c.className='toast-container position-fixed bottom-0 end-0 p-3';document.body.append(c)}
  const t=document.createElement('div');
  t.className=`toast align-items-center text-bg-${type} border-0`;
  t.innerHTML=`<div class="d-flex"><div class="toast-body">${esc(msg)}</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  c.append(t);t.addEventListener('hidden.bs.toast',()=>t.remove());new bootstrap.Toast(t,{delay:3000}).show();
}
function router(def){
  const go=()=>{
    const want=location.hash.slice(1),cur=$$('[data-view]').some(s=>s.dataset.view===want)?want:def;
    $$('[data-view]').forEach(s=>s.classList.toggle('d-none',s.dataset.view!==cur));
    $$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===cur));
    const oc=bootstrap.Offcanvas.getInstance($('#side'));if(oc)oc.hide();
  };
  addEventListener('hashchange',go);go();
}
