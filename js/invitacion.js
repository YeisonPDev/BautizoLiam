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

    // Invitación general: la que se envía sin el nombre de nadie.
    general: {
      nombreEnLista: "Invitación general",
      explicacion: "Sin nombre: sirve para grupos o para cualquier persona.",
      textoPortada: "Con mucho cariño te invitamos al",
      mensajeWhatsApp: "¡Hola! Te invitamos al bautizo de Liam 🤍 Mira la invitación aquí: {enlace}"
    },

    // Lugares del mapa.
    //   titulo y detalle: lo que se lee debajo del mapa.
    //   buscar: el lugar tal como aparece en Google Maps. Es lo que muestra
    //           el mapa de la página, así que escríbelo completo
    //           (nombre, barrio o vereda, municipio, departamento).
    //   coordenadas: (opcional) latitud y longitud, para que Waze llegue al punto exacto.
    //   enlace: (opcional) enlace de Google Maps para el botón; si no está, se usa "buscar".
    lugares: {
      misa: {
        titulo: "Parroquia Santa Bernardita",
        detalle: "Acapulco · Misa a las 10:00 a.m.",
        buscar: "Iglesia Santa Bernardita, Acapulco, Girón, Santander",
        coordenadas: "7.0120318,-73.1346552"
      },
      rec: {
        titulo: "La Parada de Pablo",
        detalle: "Recepción · Vereda La Esperanza, Girón",
        buscar: "La Parada De Pablo, Girón, Santander",
        coordenadas: "7.0138,-73.1145183",
        enlace: "https://maps.app.goo.gl/2enFKkNUVdR1bG3FA"
      }
    },

    // Qué tan cerca se ve el mapa al abrirlo (más alto = más cerca; 15 a 17 va bien).
    zoomMapa: 17,

    // Cómo se ve el mapa al abrirlo:
    //   "h" = satélite con nombres de calles y lugares
    //   "k" = satélite sin nombres
    //   "m" = mapa normal (dibujado)
    tipoMapa: "h"
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

     La invitación general no lleva nombre: su enlace termina en
     "#invitacion_general". Ningún nombre puede dar ese mismo
     enlace, porque el "_" de un nombre viaja escrito de otra forma.
     ========================================================== */
  var GENERAL = "\u0000general";            // marca interna de "sin nombre"
  var HASH_GENERAL = "invitacion_general";  // lo que va después del "#"
  function isGeneral(n){ return n === GENERAL; }
  // Cómo se nombra al invitado en los avisos y en la lista
  function label(n){ return isGeneral(n) ? DATOS.general.nombreEnLista : n; }

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
  function linkFor(n){ return BASE + "#" + (isGeneral(n) ? HASH_GENERAL : encodeName(n)); }

  // Si el enlace trae algo después del "#", es un invitado. Si no, es quien organiza.
  var hashGuest = "";
  try{
    var h = decodeURIComponent((location.hash||"").slice(1));
    if (h === HASH_GENERAL) hashGuest = GENERAL;
    else if (h) hashGuest = decodeName(h).slice(0,40);
  }catch(e){}
  var isHost = !hashGuest;

  var guests;
  try{ guests = JSON.parse(store(KEY_LIST)||"null"); }catch(e){ guests = null; }
  if (!Array.isArray(guests)) guests = DATOS.invitadosIniciales.slice();
  var current = hashGuest || store(KEY_SEL) || guests[0] || GENERAL;

  // Escribe el nombre en la portada y en la etiqueta «Para: ...».
  // En la invitación general se ocultan ambos y cambia la frase de la portada.
  var leadConNombre = $("coverLead").textContent;
  function applyName(n){
    current = n;
    var general = isGeneral(n);
    $("coverLead").textContent = general ? DATOS.general.textoPortada : leadConNombre;
    $("coverWho").hidden = general;
    $("forTag").hidden = general;
    if (!general){
      $("coverName").textContent = n;
      $("forTag").textContent = "Para: " + n;
    }
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
    // La primera tarjeta entra en cascada justo al abrir
    var first = $("inicio");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches){
      first.classList.add("pre");
      setTimeout(function(){ first.classList.remove("pre"); }, 60);
    }
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
     Es un mapa real de Google dentro de la página. Al tocar una
     pestaña cambia de lugar y se actualizan los botones de
     Google Maps y Waze.
     ========================================================== */
  function showPlace(k){
    var p = DATOS.lugares[k], q = encodeURIComponent(p.buscar);
    $("mapTitle").textContent = p.titulo;
    $("mapSub").textContent = p.detalle;
    $("mapFrame").src = "https://www.google.com/maps?q=" + q + "&z=" + DATOS.zoomMapa + "&t=" + DATOS.tipoMapa + "&hl=es&output=embed";
    $("mapFrame").title = "Mapa de Google: " + p.titulo;
    $("gmaps").href = p.enlace || ("https://www.google.com/maps/search/?api=1&query=" + q);
    $("waze").href = "https://waze.com/ul?" + (p.coordenadas ? "ll=" + encodeURIComponent(p.coordenadas) : "q=" + q) + "&navigate=yes";
    document.querySelectorAll(".map-tab").forEach(function(t){ t.setAttribute("aria-selected", t.dataset.place===k ? "true":"false"); });
  }
  document.querySelectorAll(".map-tab").forEach(function(el){
    el.addEventListener("click", function(){ showPlace(el.dataset.place); });
  });
  showPlace("misa");


  /* ==========================================================
     7. LISTA DE INVITADOS (solo la ve quien organiza)
     La lista se guarda en este navegador, no en internet.
     ========================================================== */
  function save(){ store(KEY_LIST, JSON.stringify(guests)); }

  function waText(n){
    var msg = isGeneral(n) ? DATOS.general.mensajeWhatsApp : DATOS.mensajeWhatsApp;
    return msg.split("{nombre}").join(n).split("{enlace}").join(linkFor(n));
  }

  // Copia el enlace; si el navegador no deja, lo muestra para copiarlo a mano
  function copy(n){
    var url = linkFor(n), box = $("linkBox"), out = $("linkOut");
    function fallback(){ box.hidden=false; out.value=url; out.focus(); out.select(); toast("Selecciona el enlace y cópialo"); }
    try{
      navigator.clipboard.writeText(url).then(function(){ box.hidden=true; toast(isGeneral(n) ? "Enlace de la invitación general copiado" : "Enlace de " + n + " copiado"); }, fallback);
    }catch(e){ fallback(); }
  }

  // Crea un botón pequeño de la lista
  function chip(text, cls, onClick){
    var b = document.createElement("button"); b.type="button"; b.className="chip" + (cls ? " " + cls : ""); b.textContent=text;
    b.addEventListener("click", onClick);
    return b;
  }

  // Crea la fila de un invitado (o de la invitación general) con sus botones
  function guestRow(n, i){
    var general = isGeneral(n);
    var li = document.createElement("li"); li.className = "guest" + (general ? " general" : "") + (n===current ? " on" : "");
    var name = document.createElement("span"); name.className="guest-name"; name.textContent = label(n);
    var tag = document.createElement("span"); tag.className="eyebrow"; tag.textContent = n===current ? "Viendo" : "";
    var tools = document.createElement("div"); tools.className="guest-tools";

    var see = chip("Ver invitación", "", function(){
      applyName(n); store(KEY_SEL, n); window.scrollTo({top:0,behavior:"smooth"});
      toast(general ? "Mostrando la invitación general" : "Mostrando la invitación de " + n);
    });
    var cp = chip("Copiar enlace", "", function(){ copy(n); });

    var wa = document.createElement("a"); wa.className="chip wa"; wa.target="_blank"; wa.rel="noopener"; wa.textContent="Enviar por WhatsApp";
    wa.href = "https://wa.me/?text=" + encodeURIComponent(waText(n));

    tools.append(see, cp, wa);
    li.append(name, tag);

    if (general){
      var note = document.createElement("span"); note.className="guest-note"; note.textContent = DATOS.general.explicacion;
      li.append(note);
    } else {
      var del = chip("Quitar", "del", function(){
        guests.splice(i,1); save();
        if (current===n) applyName(guests[0] || GENERAL); else renderGuests();
        toast(n + " se quitó de la lista");
      });
      del.setAttribute("aria-label", "Quitar a " + n);
      tools.append(del);
    }

    li.append(tools);
    return li;
  }

  // Dibuja la lista: primero la invitación general y luego cada invitado
  function renderGuests(){
    if (!isHost) return;
    var ul = $("guestList"); ul.textContent = "";
    $("guestEmpty").hidden = guests.length > 0;
    ul.append(guestRow(GENERAL));
    guests.forEach(function(n, i){ ul.append(guestRow(n, i)); });
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
