(function(){
'use strict';
var D=JSON.parse(document.getElementById('datos').textContent);
var q=new URLSearchParams(location.search);
var letra=(q.get('s')||'').toUpperCase();
var parte=q.get('p');
var raiz=document.getElementById('ova');
var S=D.situaciones[letra];
if(!S){
  var h='<div class="indice"><h1>Situaciones de la unidad '+D.unidad+'</h1>';
  Object.keys(D.situaciones).forEach(function(k){var s=D.situaciones[k];h+='<a href="?s='+k+'">Situación '+k+': '+s.titulo+' · Lección '+s.leccion+'</a>';});
  raiz.innerHTML=h+'</div>';return;
}
document.title='Situación '+letra+': '+S.titulo;
var CLAVE='dfz-situacion-'+letra;
var est={puntos:0,hechos:{},primera:null};
try{var g=JSON.parse(localStorage.getItem(CLAVE)||'null');if(g&&typeof g==='object')est=g;}catch(e){}
function guardar(){try{localStorage.setItem(CLAVE,JSON.stringify(est));}catch(e){}}
var $=function(s,c){return (c||document).querySelector(s);};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}

/* Pasos de la escena */
var pasos=[{id:'contexto',tit:'Contexto',ico:'fa-file-lines'},{id:'consigna',tit:'Consigna para el participante',ico:'fa-list-check'}];
if(S.opciones.length)pasos.push({id:'opciones',tit:'Elija una opción',ico:'fa-hand-pointer'});
if(S.plantilla)pasos.push({id:'plantilla',tit:S.plantillaTitulo,ico:'fa-table'});
if(S.pregunta)pasos.push({id:'pregunta',tit:'Pregunta final',ico:'fa-circle-question'});
if(parte==='1')pasos=pasos.slice(0,2);
else if(parte==='2')pasos=pasos.slice(2);
var total=0;pasos.forEach(function(p){total+=metas(p.id).length;});
function metas(id){
  if(id==='opciones')return S.opciones.map(function(o){return 'op'+o.letra;});
  if(id==='plantilla')return ['plantilla'];
  if(id==='pregunta')return ['pregunta'];
  return [id];
}

/* Cabecera, cuerpo y pie */
raiz.innerHTML='';
var cab=el('header','sit-cab');
/* Dentro de Genially, el título de la página ya dice «Actividad práctica: …» (revisión del 23/11/2026: «el HTML no repite el
   título que pone Genially»); el rótulo se ve solo si la situación se abre sola (pestaña aparte, pantalla completa). */
var suelta=(function(){try{return window.self===window.top;}catch(e){return false;}})();
cab.innerHTML=(suelta?'<p class="sit-rotulo"><i class="fas '+(S.reflexion?'fa-brain':'fa-puzzle-piece')+'" aria-hidden="true"></i>'+S.rotulo+'</p>':'')+
  '<h1 class="sit-titulo">Situación '+letra+': '+S.titulo+'</h1>'+
  '<p class="sit-puntos" aria-live="polite"><i class="fas fa-star" aria-hidden="true"></i><span class="pn">0</span>&nbsp;puntos</p>'+
  '<div class="sit-avance" aria-hidden="true"><span></span></div>';
raiz.appendChild(cab);
var cuerpo=el('div','sit-cuerpo');raiz.appendChild(cuerpo);
var medio=el('figure','sit-medio');cuerpo.appendChild(medio);
var panel=el('section','sit-panel');panel.setAttribute('aria-live','polite');cuerpo.appendChild(panel);
var pie=el('footer','sit-pie');
pie.innerHTML='<button type="button" class="fs"><i class="fas fa-expand" aria-hidden="true"></i><span>Pantalla completa</span></button>'+
  '<nav class="sit-nav" aria-label="Pasos de la situación"><button type="button" class="nav-b ant"><i class="fas fa-arrow-left" aria-hidden="true"></i><span>Anterior</span></button>'+
  '<ol class="puntos-pos"></ol><button type="button" class="nav-b sig"><span>Siguiente</span><i class="fas fa-arrow-right" aria-hidden="true"></i></button></nav>';
raiz.appendChild(pie);

/* Medio: video sin lengua de señas o imagen con «Ampliar imagen» */
if(S.video){
  if(S.videoDisponible){
    var v=el('video');v.controls=true;v.preload='metadata';v.setAttribute('playsinline','');v.setAttribute('controlslist','nodownload');
    v.setAttribute('disablepictureinpicture','');if(S.imagen)v.poster=S.imagen;
    v.setAttribute('aria-label','Video de la situación '+letra+': '+S.titulo);
    v.addEventListener('loadedmetadata',function(){setTimeout(pintar,20);});var so=el('source');so.src=S.video;so.type='video/mp4';v.appendChild(so);medio.appendChild(v);
  }else if(S.imagen){
    imagen();
  }else{
    medio.innerHTML='<div class="pendiente" role="status"><i class="fas fa-clapperboard" aria-hidden="true"></i><p>Video en producción</p></div>';
  }
}else if(S.imagen){imagen();}
function imagen(){
  var im=el('img');im.addEventListener('load',function(){if(typeof pintar==='function')setTimeout(pintar,20);});im.src=S.imagen;im.alt='Ilustración de la situación '+letra+': '+S.titulo;medio.appendChild(im);
  var b=el('button','ampliar','<i class="fas fa-magnifying-glass-plus" aria-hidden="true"></i> Ampliar imagen');b.type='button';
  b.addEventListener('click',function(){abrir('Situación '+letra+': '+S.titulo,'<img src="'+S.imagen+'" alt="'+im.alt+'">',null,'img');});
  medio.appendChild(b);
}

/* Puntos y avance */
function sumar(meta,n){
  if(est.hechos[meta])return;est.hechos[meta]=1;est.puntos+=n;guardar();pintarPuntos(true);pintarPos();
}
function pintarPuntos(anim){
  var p=$('.sit-puntos',cab);$('.pn',p).textContent=est.puntos;
  if(anim){p.classList.remove('sube');void p.offsetWidth;p.classList.add('sube');}
  var h=0;pasos.forEach(function(x){metas(x.id).forEach(function(m){if(est.hechos[m])h++;});});
  $('.sit-avance span',cab).style.width=(total?Math.round(100*h/total):0)+'%';
}
function pasoVisto(id){return metas(id).every(function(m){return est.hechos[m];});}

/* Ventana amplia (con desplazamiento), «Cerrar» y Escape */
var vent=el('div','ventana');vent.hidden=true;vent.setAttribute('role','dialog');vent.setAttribute('aria-modal','true');
vent.innerHTML='<div class="vent-caja"><div class="vent-cab"><h2 id="vent-tit"></h2><button type="button" class="vent-cerrar"><i class="fas fa-xmark" aria-hidden="true"></i> Cerrar</button></div><div class="vent-cuerpo" tabindex="0"></div></div>';
vent.setAttribute('aria-labelledby','vent-tit');
document.body.appendChild(vent);
var volver=null,alFinal=null;
function abrir(tit,cont,fin,clase){
  volver=document.activeElement;alFinal=fin;
  $('#vent-tit',vent).textContent=tit;var c=$('.vent-cuerpo',vent);c.className='vent-cuerpo'+(clase?' '+clase:'');c.innerHTML=cont;c.scrollTop=0;
  vent.hidden=false;$('.vent-cerrar',vent).focus();setTimeout(revisarFin,60);
}
function cerrar(){vent.hidden=true;if(volver&&volver.focus)volver.focus();}
function revisarFin(){var c=$('.vent-cuerpo',vent);if(alFinal&&c.scrollTop+c.clientHeight>=c.scrollHeight-8){var f=alFinal;alFinal=null;f();}}
$('.vent-cuerpo',vent).addEventListener('scroll',revisarFin);
$('.vent-cerrar',vent).addEventListener('click',cerrar);
vent.addEventListener('click',function(e){if(e.target===vent)cerrar();});
document.addEventListener('keydown',function(e){
  if(vent.hidden)return;
  if(e.key==='Escape'){e.preventDefault();cerrar();}
  if(e.key==='Tab'){var f=vent.querySelectorAll('button,a[href],[tabindex="0"]');var a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}
});

/* Texto que cabe: la letra baja hasta caber (16 → 13 px); si ni así, una vista previa por palabras con «…» y el texto completo en su ventana */
function encajar(caja,htmlCompleto,tit,meta,boton){
  var t=16;caja.style.fontSize=t+'px';
  while(caja.scrollHeight>caja.clientHeight+1&&t>13){t-=0.5;caja.style.fontSize=t+'px';}
  if(caja.scrollHeight<=caja.clientHeight+1){
    /* texto breve: la letra crece hasta llenar la caja (máximo 21 px), para no dejar huecos */
    while(t<21){caja.style.fontSize=(t+0.5)+'px';if(caja.scrollHeight>caja.clientHeight+1){caja.style.fontSize=t+'px';break;}t+=0.5;}
    if(!boton)sumarAlMostrar(meta);return false;}
  var plano=(caja.innerText||caja.textContent).replace(/\s+/g,' ').trim();caja.style.fontSize='15px';
  var lineas=Math.max(2,Math.floor(caja.clientHeight/(15*1.6)));
  caja.innerHTML='';var p=el('p','previa');p.style.webkitLineClamp=lineas;p.textContent=plano;caja.appendChild(p);
  return true;
}
function sumarAlMostrar(meta){if(meta)setTimeout(function(){sumar(meta,10);},900);}

/* Pasos */
var i=0;
function pintarPos(){
  var ol=$('.puntos-pos',pie);ol.innerHTML='';
  pasos.forEach(function(p,k){var li=el('li');var b=el('button');b.type='button';b.textContent=k+1;
    b.setAttribute('aria-label','Paso '+(k+1)+': '+p.tit.replace(/<[^>]+>/g,'')+(pasoVisto(p.id)?' (visto)':''));
    if(k===i)b.setAttribute('aria-current','step');if(pasoVisto(p.id))b.classList.add('visto');
    b.addEventListener('click',function(){ir(k);});li.appendChild(b);ol.appendChild(li);});
  $('.ant',pie).disabled=i===0;$('.sig',pie).disabled=i===pasos.length-1;
}
function ir(k){i=Math.max(0,Math.min(pasos.length-1,k));pintar();}
$('.ant',pie).addEventListener('click',function(){ir(i-1);});
$('.sig',pie).addEventListener('click',function(){ir(i+1);});
function titulo(p){return '<h2 class="paso-tit"><i class="fas '+p.ico+'" aria-hidden="true"></i>'+p.tit+'</h2>';}

function pintar(){
  var p=pasos[i];raiz.classList.remove('sin-medio');raiz.setAttribute('data-paso',p.id);panel.innerHTML=titulo(p);pintarPos();
  if(p.id==='contexto'||p.id==='consigna'){
    var cont=p.id==='contexto'?S.contexto:S.consigna;
    var caja=el('div','texto',cont);panel.appendChild(caja);
    var siempre=p.id==='contexto'&&S.video;            /* con video, el contexto se lee completo en su ventana */
    var acc=el('div','acciones');var b=el('button','boton'+(est.hechos[p.id]?'':' late'));b.type='button';
    b.innerHTML='<i class="fas fa-book-open" aria-hidden="true"></i> '+(p.id==='contexto'?'Leer el contexto':'Clic para leer completo')+
      (est.hechos[p.id]?' <i class="fas fa-circle-check visto" aria-hidden="true"></i>':'');
    b.addEventListener('click',function(){abrir(p.tit+' · Situación '+letra,cont+'<p class="vent-fin"><i class="fas fa-circle-check" aria-hidden="true"></i> Leído</p>',function(){sumar(p.id,10);pintarBoton(b,p);});});
    acc.appendChild(b);
    if(siempre){panel.appendChild(acc);encajar(caja,cont,p.tit,null,true);return;}
    /* sin video: primero sin botón; si ni con la letra mínima cabe, va la vista previa con «Clic para leer completo» */
    if(encajar(caja,cont,p.tit,null,true)){panel.appendChild(acc);caja.innerHTML=cont;encajar(caja,cont,p.tit,null,true);}
    else sumarAlMostrar(p.id);
    return;
  }
  if(p.id==='opciones'){
    var lista=el('div','opciones');lista.setAttribute('role','group');lista.setAttribute('aria-label','Opciones de la situación '+letra);
    S.opciones.forEach(function(o){
      var b=el('button','opcion');b.type='button';var visto=est.hechos['op'+o.letra];
      if(visto)b.classList.add(o.correcta?'bien':'mal');
      b.innerHTML='<span class="op-letra">Opción '+o.letra+'</span><span class="op-texto">'+o.texto+'</span>'+
        '<span class="op-estado">'+(visto?(o.correcta?'<i class="fas fa-circle-check" aria-hidden="true"></i><span>Correcta</span>':'<i class="fas fa-circle-xmark" aria-hidden="true"></i><span>Incorrecta</span>')+'':'<i class="fas fa-hand-pointer" aria-hidden="true"></i><span>Elegir</span>')+'</span>';
      b.addEventListener('click',function(){
        if(est.primera==null){est.primera=o.letra;if(o.correcta){est.puntos+=25;}guardar();}
        abrir('Retroalimentación · Opción '+o.letra,'<p class="vent-op">Opción '+o.letra+': '+o.texto+'</p>'+o.retro+
          '<p class="vent-fin"><i class="fas fa-circle-check" aria-hidden="true"></i> Retroalimentación leída</p>',function(){sumar('op'+o.letra,10);pintar();});
        pintarPuntos(true);
      });
      lista.appendChild(b);
    });
    panel.appendChild(lista);
    encajarOpciones(lista);
    if(est.primera){var n=el('p','texto','');n.style.flex='0 0 auto';n.style.fontSize='13.5px';
      n.innerHTML='<i class="fas fa-circle-info" aria-hidden="true"></i> Puede abrir también la otra opción para leer su retroalimentación.';panel.appendChild(n);}
    return;
  }
  if(p.id==='plantilla'){
    var d=el('div','descarga');
    d.innerHTML='<i class="fas fa-file-excel" aria-hidden="true"></i><div><p class="d-nombre">'+S.plantillaNombre+'</p><p class="d-archivo">Plantilla en Excel para diligenciar ('+S.xlsxPeso+')</p><div class="acciones"></div></div>';
    var acc2=$('.acciones',d);
    var ver=el('button','boton'+(est.hechos.plantilla?'':' late'));ver.type='button';
    ver.innerHTML='<i class="fas fa-table" aria-hidden="true"></i> Ver la plantilla'+(est.hechos.plantilla?' <i class="fas fa-circle-check visto" aria-hidden="true"></i>':'');
    ver.addEventListener('click',function(){abrir(S.plantillaNombre,S.plantilla+'<p class="vent-fin"><i class="fas fa-circle-check" aria-hidden="true"></i> Plantilla revisada</p>',function(){sumar('plantilla',10);pintar();});});
    var des=el('a','boton lleno','<i class="fas fa-download" aria-hidden="true"></i> Clic para descargar la plantilla en Excel');
    des.href=S.xlsx;des.setAttribute('download',S.xlsx.split('/').pop());
    des.addEventListener('click',function(){sumar('descarga',10);});
    acc2.appendChild(ver);acc2.appendChild(des);panel.appendChild(d);
    return;
  }
  if(p.id==='pregunta'){
    var c=el('div','texto clave',S.pregunta);panel.appendChild(c);
    var a3=el('div','acciones');var r=el('button','boton'+(est.hechos.pregunta?'':' late'));r.type='button';
    r.innerHTML='<i class="fas fa-comment-dots" aria-hidden="true"></i> Ver la retroalimentación'+(est.hechos.pregunta?' <i class="fas fa-circle-check visto" aria-hidden="true"></i>':'');
    r.addEventListener('click',function(){abrir('Retroalimentación · Situación '+letra,S.pregunta+S.retroPregunta+'<p class="vent-fin"><i class="fas fa-circle-check" aria-hidden="true"></i> Retroalimentación leída</p>',function(){sumar('pregunta',10);pintar();});});
    a3.appendChild(r);panel.appendChild(a3);
    encajar(c,S.pregunta,'Pregunta final',null,true);
  }
}
/* Opciones: la letra baja hasta que cada opción cabe (15,5 → 12 px); en una escena muy pequeña, el medio se oculta en este paso */
function encajarOpciones(lista){
  var ops=lista.querySelectorAll('.opcion'),t=15.5;
  function sobra(){for(var k=0;k<ops.length;k++){if(ops[k].scrollHeight>ops[k].clientHeight+1)return true;}return false;}
  function probar(){t=15.5;lista.style.setProperty('--op',t+'px');while(sobra()&&t>12){t-=0.5;lista.style.setProperty('--op',t+'px');}}
  probar();
  if(sobra()){raiz.classList.add('sin-medio');probar();}
  /* opciones breves: la letra crece hasta 18 px mientras quepan, para no dejar huecos */
  while(!sobra()&&t<18){t+=0.5;lista.style.setProperty('--op',t+'px');if(sobra()){t-=0.5;lista.style.setProperty('--op',t+'px');break;}}
}
function pintarBoton(b,p){b.classList.remove('late');if(!b.querySelector('.visto'))b.insertAdjacentHTML('beforeend',' <i class="fas fa-circle-check visto" aria-hidden="true"></i>');pintarPos();}

/* Pantalla completa: la escena conserva su composición (1113 × 448) y crece; si no se puede, se abre en otra pestaña */
var fsb=$('.fs',pie);
function ajustarFs(){
  if(!document.fullscreenElement){document.documentElement.classList.remove('fs-on');raiz.style.zoom='';raiz.style.left='';raiz.style.top='';fsb.innerHTML='<i class="fas fa-expand" aria-hidden="true"></i><span>Pantalla completa</span>';setTimeout(pintar,30);return;}
  document.documentElement.classList.add('fs-on');
  var k=Math.min(innerWidth/1113,innerHeight/448);
  /* zoom (no transform), para que la letra se vea nítida; left y top van en unidades de la escena ampliada */
  raiz.style.zoom=k;raiz.style.left=((innerWidth-1113*k)/2/k)+'px';raiz.style.top=((innerHeight-448*k)/2/k)+'px';
  fsb.innerHTML='<i class="fas fa-compress" aria-hidden="true"></i><span>Salir</span>';setTimeout(pintar,30);
}
fsb.addEventListener('click',function(){
  if(document.fullscreenElement){document.exitFullscreen();return;}
  var r=document.documentElement;
  if(r.requestFullscreen&&document.fullscreenEnabled){r.requestFullscreen().catch(function(){window.open(location.href,'_blank');});}
  else window.open(location.href,'_blank');
});
document.addEventListener('fullscreenchange',ajustarFs);
addEventListener('resize',function(){if(document.fullscreenElement)ajustarFs();else{clearTimeout(window.__rz);window.__rz=setTimeout(pintar,120);}});

pintarPuntos(false);pintar();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){pintar();});
})();
