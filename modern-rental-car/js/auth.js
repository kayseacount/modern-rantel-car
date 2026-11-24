(function(){
  const cu=Auth.current();if(cu){location.replace(Auth.home(cu.role));return}
  const err=t=>$('#msg').innerHTML=`<div class="alert alert-danger py-2" role="alert">${esc(t)}</div>`;
  const lf=$('#loginForm');
  if(lf)lf.addEventListener('submit',e=>{
    e.preventDefault();if(!validate(lf))return;
    const u=Auth.login($('#email').value,$('#password').value);
    if(!u)return err('Email or password is incorrect. Check both and try again.');
    location.href=Auth.home(u.role);
  });
  const rf=$('#regForm');
  if(rf){
    const em=$('#email'),pw=$('#password'),cf=$('#confirm');
    const chk=()=>cf.setCustomValidity(cf.value!==pw.value?'Passwords do not match':'');
    pw.addEventListener('input',chk);cf.addEventListener('input',chk);em.addEventListener('input',()=>em.setCustomValidity(''));
    rf.addEventListener('submit',e=>{
      e.preventDefault();chk();
      const users=DB.get('users',[]),mail=em.value.trim().toLowerCase();
      em.setCustomValidity(users.some(u=>u.email===mail)?'Email already registered':'');
      if(!validate(rf))return;
      const u={id:uid(),name:$('#name').value.trim(),email:mail,phone:$('#phone').value.trim(),password:pw.value,role:'customer'};
      users.push(u);DB.set('users',users);Auth.login(mail,pw.value);location.href='dashboard.html';
    });
  }
})();
