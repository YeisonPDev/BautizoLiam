/* ==========================================================
   INVITACIÓN · BAUTIZO DE LIAM ANDRÉS
   Aquí está todo lo que "se mueve": el nombre del invitado,
   la cuenta regresiva, el mapa y la lista de invitados.

   Contenido de este archivo (en este orden):
     1. DATOS QUE PUEDES CAMBIAR  <-- casi siempre solo necesitas esto
     2. Herramientas
     3. Nombre del invitado y su enlace
     4. Portada
     5. Cuenta regresiva
     6. Mapa
     7. Lista de invitados
     8. Menú de abajo
     9. Entrada suave de las tarjetas
   ========================================================== */

(function(){

  /* ==========================================================
     1. DATOS QUE PUEDES CAMBIAR
     ========================================================== */
  var DATOS = {

    // Día y hora del bautizo: año-mes-día T hora:minutos:segundos.
    // El "-05:00" del final es la hora de Colombia; no lo cambies.
    fecha: "2026-11-01T10:00:00-05:00",

    // Invitados que aparecen en la lista la primera vez que se abre la página.
    invitadosIniciales: ["Madrina Valentina", "Padrino Jhonatan"],

    // Mensaje de WhatsApp. {nombre} y {enlace} se reemplazan solos.
    mensajeWhatsApp: "¡Hola, {nombre}! Te invitamos al bautizo de Liam 🤍 Mira tu invitación aquí: {enlace}",

    // Lugares del mapa.
    //   titulo y detalle: lo que se lee debajo del mapa.
    //   buscar: lo que se busca en Google Maps y Waze.
    //   enlace: (opcional) enlace exacto de Google Maps; si está, se usa en vez de buscar.
    lugares: {
      misa: {
        titulo: "Parroquia Santa Bernardita",
        detalle: "Acapulco · Misa a las 10:00 a.m.",
        buscar: "Parroquia Santa Bernardita Acapulco"
      },
      rec: {
        titulo: "La Parada de Pablo",
        detalle: "Recepción · Vereda La Esperanza, Girón",
        buscar: "La Parada De Pablo, Girón, Santander",
        enlace: "https://maps.app.goo.gl/2enFKkNUVdR1bG3FA"
      }
    }
  };


  /* ==========================================================
     2. HERRAMIENTAS
     ========================================================== */
  var BASE = location.origin + location.pathname;
  var KEY_LIST = "bautizo-invitados", KEY_SEL = "bautizo-seleccionado";

  // Busca un elemento de la página por su id
  function $(id){ return document.getElementById(id); }

  // Guarda (o lee, si no se pasa valor) un dato en este navegador
  function store(k, v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }

  // Aviso flotante que se quita solo
  var toastT;
  function toast(msg){ var t=$("toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(function(){ t.hidden=true; }, 2600); }


  /* ==========================================================
     3. NOMBRE DEL INVITADO Y SU ENLACE
     El nombre viaja al final del enlace, después del "#".
     Ej.: .../index.html#Tia-Marta  ->  "Tia Marta"
     (solo letras, números y - . ~ viajan en el enlace)
     ========================================================== */
  function encodeName(n){
    var out = "";
    for (var ch of n.trim()){
      if (/[A-Za-z0-9]/.test(ch)) out += ch;
      else if (ch === " ") out += "-";
      else out += "~" + ch.codePointAt(0).toString(16) + ".";
    }
    return out;
  }
  function decodeName(s){
    return s.replace(/-/g," ").replace(/~([0-9a-f]+)\./gi, function(_, h){ return String.fromCodePoint(parseInt(h,16)); }).replace(/\s+/g," ").trim();
  }
  function linkFor(n){ return BASE + "#" + encodeName(n); }

  // Si el enlace trae nombre, es un invitado. Si no, es quien organiza.
  var hashGuest = "";
  try{ var h = (location.hash||"").slice(1); if (h) hashGuest = decodeName(decodeURIComponent(h)).slice(0,40); }catch(e){}
  var isHost = !hashGuest;

  var guests;
  try{ guests = JSON.parse(store(KEY_LIST)||"null"); }catch(e){ guests = null; }
  if (!Array.isArray(guests)) guests = DATOS.invitadosIniciales.slice();
  var current = hashGuest || store(KEY_SEL) || guests[0] || "ti";

  // Escribe el nombre en la portada y en la etiqueta «Para: ...»
  function applyName(n){
    current = n;
    $("coverName").textContent = n;
    $("forTag").textContent = "Para: " + n;
    renderGuests();
  }


  /* ==========================================================
     4. PORTADA
     Se muestra una vez; al tocar «Abrir invitación» desaparece.
     ========================================================== */
  var cover = $("cover"), opened = false;
  try{ opened = sessionStorage.getItem("bautizo-open")==="1"; }catch(e){}
  if (opened){ cover.classList.add("gone"); } else { document.body.style.overflow = "hidden"; }
  $("openBtn").addEventListener("click", function(){
    cover.classList.add("gone"); document.body.style.overflow = "";
    try{ sessionStorage.setItem("bautizo-open","1"); }catch(e){}
  });


  /* ==========================================================
     5. CUENTA REGRESIVA
     ========================================================== */
  var target = new Date(DATOS.fecha).getTime();
  function pad(n){ return n<10 ? "0"+n : ""+n; }
  function tick(){
    var s = Math.floor(Math.max(0, target - Date.now())/1000);
    $("cd-d").textContent = Math.floor(s/86400);
    $("cd-h").textContent = pad(Math.floor(s%86400/3600));
    $("cd-m").textContent = pad(Math.floor(s%3600/60));
    $("cd-s").textContent = pad(s%60);
  }
  tick(); setInterval(tick, 1000);


  /* ==========================================================
     6. MAPA
     Al tocar una pestaña o un pin se muestra ese lugar
     y se actualizan los botones de Google Maps y Waze.
     ========================================================== */
  function showPlace(k){
    var p = DATOS.lugares[k];
    $("mapTitle").textContent = p.titulo;
    $("mapSub").textContent = p.detalle;
    $("gmaps").href = p.enlace || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.buscar));
    $("waze").href = "https://waze.com/ul?q=" + encodeURIComponent(p.buscar) + "&navigate=yes";
    document.querySelectorAll(".map-tab").forEach(function(t){ t.setAttribute("aria-selected", t.dataset.place===k ? "true":"false"); });
    document.querySelectorAll(".pin").forEach(function(g){ g.classList.toggle("active", g.dataset.place===k); });
  }
  document.querySelectorAll(".map-tab,.pin").forEach(function(el){
    el.addEventListener("click", function(){ showPlace(el.dataset.place); });
    el.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); showPlace(el.dataset.place); } });
  });
  showPlace("misa");


  /* ==========================================================
     7. LISTA DE INVITADOS (solo la ve quien organiza)
     La lista se guarda en este navegador, no en internet.
     ========================================================== */
  function save(){ store(KEY_LIST, JSON.stringify(guests)); }

  function waText(n){
    return DATOS.mensajeWhatsApp.split("{nombre}").join(n).split("{enlace}").join(linkFor(n));
  }

  // Copia el enlace; si el navegador no deja, lo muestra para copiarlo a mano
  function copy(n){
    var url = linkFor(n), box = $("linkBox"), out = $("linkOut");
    function fallback(){ box.hidden=false; out.value=url; out.focus(); out.select(); toast("Selecciona el enlace y cópialo"); }
    try{
      navigator.clipboard.writeText(url).then(function(){ box.hidden=true; toast("Enlace de " + n + " copiado"); }, fallback);
    }catch(e){ fallback(); }
  }

  // Dibuja la lista: cada invitado con sus cuatro botones
  function renderGuests(){
    if (!isHost) return;
    var ul = $("guestList"); ul.textContent = "";
    $("guestEmpty").hidden = guests.length > 0;
    guests.forEach(function(n, i){
      var li = document.createElement("li"); li.className = "guest" + (n===current ? " on" : "");
      var name = document.createElement("span"); name.className="guest-name"; name.textContent = n;
      var tag = document.createElement("span"); tag.className="eyebrow"; tag.textContent = n===current ? "Viendo" : "";
      var tools = document.createElement("div"); tools.className="guest-tools";

      var see = document.createElement("button"); see.type="button"; see.className="chip"; see.textContent="Ver invitación";
      see.addEventListener("click", function(){ applyName(n); store(KEY_SEL, n); window.scrollTo({top:0,behavior:"smooth"}); toast("Mostrando la invitación de " + n); });

      var cp = document.createElement("button"); cp.type="button"; cp.className="chip"; cp.textContent="Copiar enlace";
      cp.addEventListener("click", function(){ copy(n); });

      var wa = document.createElement("a"); wa.className="chip wa"; wa.target="_blank"; wa.rel="noopener"; wa.textContent="Enviar por WhatsApp";
      wa.href = "https://wa.me/?text=" + encodeURIComponent(waText(n));

      var del = document.createElement("button"); del.type="button"; del.className="chip del"; del.textContent="Quitar";
      del.setAttribute("aria-label", "Quitar a " + n);
      del.addEventListener("click", function(){
        guests.splice(i,1); save();
        if (current===n) applyName(guests[0] || "ti"); else renderGuests();
        toast(n + " se quitó de la lista");
      });

      tools.append(see, cp, wa, del);
      li.append(name, tag, tools); ul.append(li);
    });
  }

  if (isHost){
    // Quien organiza: se muestra la lista y funciona el formulario «Agregar»
    $("host").hidden = false;
    $("addForm").addEventListener("submit", function(e){
      e.preventDefault();
      var inp = $("guestInput"), n = inp.value.replace(/\s+/g," ").trim().slice(0,40);
      if (!n){ inp.focus(); return; }
      if (guests.some(function(g){ return g.toLowerCase()===n.toLowerCase(); })){ toast(n + " ya está en la lista"); return; }
      guests.push(n); save(); inp.value = "";
      applyName(n); store(KEY_SEL, n);
      toast(n + " agregado");
    });
  } else {
    // Invitado: se quita el botón «Invitados» del menú de abajo
    var hostDot = document.querySelector('.dot[data-target="host"]'); if (hostDot) hostDot.remove();
  }
  applyName(current);


  /* ==========================================================
     8. MENÚ DE ABAJO
     Cada botón baja a su sección y se resalta el de la sección visible.
     ========================================================== */
  var dots = [].slice.call(document.querySelectorAll(".dot"));
  dots.forEach(function(b){ b.addEventListener("click", function(){ $(b.dataset.target).scrollIntoView({behavior:"smooth",block:"start"}); }); });
  var secs = dots.map(function(b){ return $(b.dataset.target); });
  function spy(){
    var mid = window.innerHeight*0.45, cur = 0;
    secs.forEach(function(s,i){ if (s.getBoundingClientRect().top < mid) cur = i; });
    dots.forEach(function(b,i){ b.setAttribute("aria-current", i===cur ? "true":"false"); });
  }
  window.addEventListener("scroll", spy, {passive:true}); spy();


  /* ==========================================================
     9. ENTRADA SUAVE DE LAS TARJETAS
     ========================================================== */
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove("pre"); io.unobserve(e.target); } }); }, {threshold:.08});
    document.querySelectorAll(".reveal").forEach(function(r){ if (r.getBoundingClientRect().top > window.innerHeight){ r.classList.add("pre"); io.observe(r); } });
  }
})();
