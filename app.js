// ============================
// 📄 app.js — Sistema de Bienestar Canino (versión final unificada)
// ============================

document.addEventListener('DOMContentLoaded', () => {
  // ==== Referencias DOM ====
  const form = document.getElementById('diagnosticoForm');
  const btnCalcular = document.getElementById('btnCalcular');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const btnExportPdf = document.getElementById('btnExportPdf');
  const btnExportJson = document.getElementById('btnExportJson');

  const resultadosCard = document.getElementById('resultados');
  const resBlock = document.getElementById('resResumen');
  const emptyMsg = document.getElementById('emptyMsg');

  const puntajeEl = document.getElementById('puntajeGlobal');
  const clasEl = document.getElementById('clasificacion');
  const domEl = document.getElementById('dominioDebil');

  const focosEl = document.getElementById('focosRojos');
  const recoFisEl = document.getElementById('recoFisico');
  const recoEmoEl = document.getElementById('recoEmocional');
  const recoSocEl = document.getElementById('recoSocial');

  const seguimientoEl = document.getElementById('seguimiento');
  const mensajeTutorEl = document.getElementById('mensajeTutor');
  const bloqueExplicacion = document.getElementById('bloqueExplicacion');

  // ==== Fecha por defecto ====
  const fechaInput = document.getElementById('fecha');
  if (fechaInput && !fechaInput.value) {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth()+1).padStart(2,'0');
    const dd = String(t.getDate()).padStart(2,'0');
    fechaInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // ==== Dominios (conjuntos de P) ====
  const FISICO_KEYS = ['P2','P3','P4','P5','P6','P7','P10'];
  const EMOCIONAL_KEYS = ['P8','P9','P11','P12','P13','P14'];
  const SOCIAL_KEYS = ['P1','P15','P16','P17','P18','P19','P20'];
  const sum = (keys, Q) => keys.reduce((acc,k)=>acc+(Q[k]??0),0);

  // ==== Etiquetas cortas ====
  const P_LABELS = {
    P1:'Acepta arnés/collar', P2:'Energía inicial', P3:'Frecuencia de comida', P4:'Apetito',
    P5:'Pelaje/piel', P6:'Horas de sueño', P7:'Se cansa rápido al jugar', P8:'Tolera estar solo',
    P9:'Temblores/chillidos ante estímulos', P10:'Búsqueda de afecto', P11:'Manejo de emoción',
    P12:'Ansiedad por separación', P13:'Ladridos excesivos', P14:'Aburrimiento/destrucción',
    P15:'Relación con perros', P16:'Relación con personas', P17:'Normas de paseo',
    P18:'Evita contacto social', P19:'Agresividad', P20:'Adaptación a lugares públicos'
  };

  // ==== Interpretación 0–90 ====
  function interpretar90(score, nombre){
    const N = nombre || 'tu perro';
    if (score >= 80) return {color:'verde',nivel:'🟢 Verde alto (80–90)',
      texto:['Excelente condición física y mental; equilibrio óptimo.','Alta adaptación social a entornos diversos.'],
      tips:['Nuevas rutas y juegos de olfato.','Actividades grupales con pausas.'],
      motiv:`¡Excelente trabajo con ${N}! Mantén su curiosidad viva con nuevos retos.`};
    if (score >= 70) return {color:'verde',nivel:'🟢 Verde medio (70–79)',
      texto:['Muy buen estado general; suma desafíos graduales.','Paseos largos con pausas adecuadas.'],
      tips:['Nuevos comandos/juguetes mentales por semana.','Ajusta ritmo si hay jadeo/desinterés.'],
      motiv:`${N} está estable y equilibrado. Con retos suaves seguirá creciendo feliz.`};
    if (score >= 60) return {color:'verde',nivel:'🟢 Verde bajo (60–69)',
      texto:['Apto con áreas a reforzar.','Enfocar una sola área (social o física).'],
      tips:['Sesiones cortas de entrenamiento positivo.','Progresión gradual en social o físico.'],
      motiv:`${N} va por buen camino. Con consistencia verán avances claros.`};
    if (score >= 50) return {color:'amarillo',nivel:'🟡 Amarillo alto (50–59)',
      texto:['Estrés leve; paseos tranquilos y seguimiento.','Condiciones predecibles para no saturarse.'],
      tips:['Evitar zonas ruidosas; arnés cómodo.','Horarios fijos y evitar cambios bruscos.'],
      motiv:`${N} muestra leve estrés; con tu calma y rutinas predecibles mejorará.`};
    if (score >= 40) return {color:'amarillo',nivel:'🟡 Amarillo medio (40–49)',
      texto:['Energía inestable con altibajos.','Señales de inseguridad; exposición gradual.'],
      tips:['Alternar actividad y descanso.','Refuerzo positivo ante cada logro.'],
      motiv:`${N} necesita estabilidad y paciencia. Tu guía constante lo ayudará.`};
    if (score >= 30) return {color:'amarillo',nivel:'🟡 Amarillo bajo (30–39)',
      texto:['Varias áreas por mejorar; prioriza la más comprometida.','Paseos moderados en entornos tranquilos.'],
      tips:['Consulta veterinaria si hay señales físicas.','Registrar observaciones tras paseos.'],
      motiv:`${N} atraviesa una etapa sensible. Tu constancia será su mejor apoyo.`};
    if (score >= 20) return {color:'rojo',nivel:'🔴 Rojo alto (20–29)',
      texto:['Molestias físicas o estrés notable.','Consulta profesional sugerida.'],
      tips:['Evitar exigencias físicas.','Documentar comportamientos para el diagnóstico.'],
      motiv:`${N} necesita un respiro y atención cercana. Con apoyo profesional, mejorará.`};
    return {color:'rojo',nivel:'🔴 Rojo crítico (0–19)',
      texto:['No apto para paseo; suspender salidas.','Entorno seguro y silencioso.'],
      tips:['Reducir ruidos/visitas; compañía tranquila.','Seguir orientación médica.'],
      motiv:`${N} atraviesa un momento difícil. Tu serenidad será su refugio.`};
  }

  // ==== Biblioteca de recomendaciones por dominio ====
  const Biblioteca = {
    FISICO:[
      {t:'Practicar colocación de arnés con refuerzo positivo.', when:q=> (q.P1??5) <= 2},
      {t:'Aumentar 10–15 min el paseo diario, evaluando tolerancia.', when:q=> q.FISICO_SCORE <= 18},
      {t:'Hidratación frecuente si hay jadeo temprano/calor.', when:q=> q.observaciones.includes('Jadeo excesivo') || (q.P7??0) >= 3},
      {t:'Pausas cada 10–15 minutos si se cansa rápido.', when:q=> (q.P7??0) >= 3},
      {t:'Superficies blandas si hay molestias; revisar postura.', when:q=> (q.P7??0) >= 3},
      {t:'Rutina regular de comida y sueño.', when:q=> (q.P3??3) <= 2 || (q.P6??3) <= 2},
      {t:'Chequeo de piel/pelo semanal; consultar si hay lesiones.', when:q=> true}
    ],
    EMOCIONAL:[
      {t:'Rutinas predecibles (horarios y transiciones claras).', when:q=> true},
      {t:'Entrenamiento en calma: “pausa/quieto” con refuerzo positivo.', when:q=> (q.P11??3) <= 2 || (q.P13??1) === 0},
      {t:'Exposición gradual con distancia segura; evitar saturación.', when:q=> (q.P9??0) >= 3 || (q.P11??3) <= 2},
      {t:'Juegos de estimulación mental diarios.', when:q=> (q.P14??1) === 0 || q.EMOCIONAL_SCORE <= 16},
      {t:'Refuerzo afectivo y tiempo de calidad diario (10–15 min).', when:q=> true},
      {t:'Asesoría conductual si hay ansiedad por separación intensa.', when:q=> (q.P12??1) >= 4}
    ],
    SOCIAL:[
      {t:'Socialización guiada 1 a 1 con perro tranquilo.', when:q=> (q.P15??3) <= 2 || (q.P18??3) <= 2},
      {t:'Paseo con control de correa y obediencia básica.', when:q=> (q.P17??1) === 0},
      {t:'Elegir áreas menos saturadas; saludar sin presión.', when:q=> q.SOCIAL_SCORE <= 18 || (q.P16??3) <= 2},
      {t:'Asesoría profesional si hay embestidas/mordidas.', when:q=> (q.P19??3) <= 2},
      {t:'Premiar interacciones amistosas; progresión gradual.', when:q=> true}
    ]
  };

  // ==== Recos específicas por foco ====
  const FOCOS_RECO = {
    P1:['Refuerzo positivo al colocar arnés; revisar ajuste.'],
    P2:['Micro-calentamiento previo (2–3 min) y horarios estables.'],
    P3:['Ajustar pauta alimentaria según edad/actividad.'],
    P4:['Vigilar apetito; descartar causas médicas si persiste.'],
    P5:['Revisar piel/pelo; consultar si hay prurito o lesiones.'],
    P6:['Higiene del sueño; ambiente oscuro y silencioso.'],
    P7:['Pausas y superficies blandas; evaluar condición física.'],
    P8:['Entrenar independencia con salidas cortas y refuerzo al retorno.'],
    P9:['Reducir detonantes; contracondicionamiento progresivo.'],
    P10:['Sesiones de vínculo guiado (caricias bajo señal de calma).'],
    P11:['Practicar “pausa/quieto” en escenarios controlados.'],
    P12:['Plan contra ansiedad por separación; progresivo y guiado.'],
    P13:['Identificar detonantes de ladrido; reforzar calma.'],
    P14:['Aumentar actividad antes de quedarse solo; enriquecer ambiente.'],
    P15:['Encuentros breves con perro estable; reforzar conductas calmadas.'],
    P16:['Saludos cortos con humanos; reforzar enfoque en el tutor.'],
    P17:['Repasar reglas básicas de paseo: no tirar, atender señas.'],
    P18:['No forzar contacto; distancia de confort y progresión lenta.'],
    P19:['Protocolo de seguridad; apoyo profesional si persiste.'],
    P20:['Exposición gradual a lugares públicos en horarios tranquilos.']
  };

  // ==== Utilidades ====
  function getQuestionMax(name){
    const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`));
    let max = -Infinity;
    inputs.forEach(i => { const v = Number(i.value); if (!Number.isNaN(v) && v > max) max = v; });
    return (max===-Infinity)? null : max;
  }
  function dedupe(arr){ return Array.from(new Set(arr)); }
  function safe(fn){ try{ return !!fn(); }catch(_){ return false; } }

  // Focos: regla general + excepciones (P7, P9)
  function detectarFocos(Q){
    const focos = [];
    for (let i=1;i<=20;i++){
      const k = `P${i}`; const v = Q[k]; if (v===null) continue;
      const m = getQuestionMax(k);
      let foco = false;

      if (k==='P7' || k==='P9') {
        // Excepción: estos ítems reportan problema cuando el valor es alto
        foco = (v >= 3);
      } else if (m===5) {
        foco = (v <= 2);
      } else if (m===1) {
        foco = (v === 0);
      } else {
        foco = (v === 0);
      }

      if (foco) focos.push({pregunta:k, valor:v, max:m});
    }
    return focos;
  }

  function escalarA90(totalRaw, maxRaw){
    if (!maxRaw || maxRaw<=0) return 0;
    return Math.round((totalRaw / maxRaw) * 90);
  }

  function retroDominio(dominio){
    switch (dominio){
      case 'Físico': return [
        'Incrementar actividad gradualmente (5–10 min extra por paseo).',
        'Pausas programadas y superficies blandas si hay molestias.',
        'Combinar ejercicio físico con juegos de olfato (evita sobrecarga).'
      ];
      case 'Emocional': return [
        'Rutinas predecibles (horarios fijos y señales de transición).',
        'Entrenamiento en calma: “pausa/quieto” con refuerzo positivo.',
        'Exposición gradual a estímulos con distancia segura, sin forzar.'
      ];
      case 'Social': return [
        'Socialización guiada 1 a 1 con perro tranquilo (sesiones breves).',
        'Practicar contacto visual y obediencia básica antes de acercamientos.',
        'Elegir entornos menos saturados y aumentar complejidad progresiva.'
      ];
      default: return [];
    }
  }

  // ============================
  // 🧮 Núcleo de cálculo
  // ============================
  function calcularDiagnostico(exportOnly=false){
    const Q = {};
    let totalRaw = 0, maxRaw = 0;
    for (let i=1;i<=20;i++){
      const name = `P${i}`;
      const el = document.querySelector(`input[name="${name}"]:checked`);
      const v = el ? Number(el.value) : null;
      Q[name] = v;
      const m = getQuestionMax(name) || 5;
      if (v!==null) totalRaw += v;
      maxRaw += m;
    }

    const observaciones = Array.from(document.querySelectorAll('input[name="observacion"]:checked')).map(i=>i.value);
    const meta = {
      nombrePerro: document.getElementById('nombrePerro').value || '',
      nombreTutor: document.getElementById('nombreTutor').value || '',
      nombreEvaluador: document.getElementById('nombreEvaluador').value || '',
      fecha: document.getElementById('fecha').value || '',
      emailTutor: document.getElementById('emailTutor').value || '',
      emailCentro: document.getElementById('emailCentro').value || ''
    };
    const notas = (document.getElementById('notasRapidas')?.value || '');

    const unanswered = [];
    for (let i=1;i<=20;i++){ if (Q[`P${i}`]===null) unanswered.push(`P${i}`); }

    const fisico = sum(FISICO_KEYS, Q);
    const emocional = sum(EMOCIONAL_KEYS, Q);
    const social = sum(SOCIAL_KEYS, Q);

    const total = escalarA90(totalRaw, maxRaw);

    const dominios = [
      {k:'Físico', score:fisico},
      {k:'Emocional', score:emocional},
      {k:'Social', score:social}
    ].sort((a,b)=>a.score-b.score);
    const dominioDebil = dominios[0].k;

    const inter = interpretar90(total, meta.nombrePerro);

    const focos = detectarFocos(Q);

    const ctx = { ...Q, observaciones, FISICO_SCORE:fisico, EMOCIONAL_SCORE:emocional, SOCIAL_SCORE:social };
    const recF = Biblioteca.FISICO.filter(r=> safe(()=>r.when(ctx))).map(r=>r.t);
    const recE = Biblioteca.EMOCIONAL.filter(r=> safe(()=>r.when(ctx))).map(r=>r.t);
    const recS = Biblioteca.SOCIAL.filter(r=> safe(()=>r.when(ctx))).map(r=>r.t);

    // Recos activadas por foco
    const recFocos = {FISICO:[], EMOCIONAL:[], SOCIAL:[]};
    focos.forEach(f => {
      const k = f.pregunta;
      const dom = FISICO_KEYS.includes(k) ? 'FISICO' : EMOCIONAL_KEYS.includes(k) ? 'EMOCIONAL' : 'SOCIAL';
      const lbl = P_LABELS[k] || k;
      const tips = FOCOS_RECO[k] || [`Atender foco en ${lbl}: progresión gradual y refuerzo positivo.`];
      tips.forEach(t => recFocos[dom].push(`⚑ ${lbl}: ${t}`));
    });

    const recGlobal = (()=>{
      if (inter.color==='verde') return [
        'Mantener rutina y enriquecer con estímulos físicos y mentales.',
        'Variar rutas de paseo y reforzar obediencia básica de forma lúdica.'
      ];
      if (inter.color==='amarillo') return [
        'Reducir estímulos y priorizar paseos cortos/controlados. Repetir evaluación en 7 días.',
        'Correa corta/arnés antitirones y pausas cada 10–15 minutos.'
      ];
      return [
        'Atención prioritaria: limitar exposición a estímulos intensos; consultar profesional si persiste.',
        'Repetir evaluación en 3–4 días con plan de intervención.'
      ];
    })();

    const recomendaciones = {
      globales: recGlobal,
      fisicas: [...dedupe(recFocos.FISICO), ...dedupe(recF)],
      emocionales: [...dedupe(recFocos.EMOCIONAL), ...dedupe(recE)],
      sociales: [...dedupe(recFocos.SOCIAL), ...dedupe(recS)]
    };

    const data = {
      meta, notas, observaciones,
      respuestas: Q,
      puntajeGlobal: total,
      puntajeRaw: totalRaw,
      maxRaw,
      clasificacion: { label: inter.nivel, color: inter.color },
      dominioDebil,
      focos,
      bloqueScores: { fisico, emocional, social },
      interpretacion: {
        nivel: inter.nivel,
        texto: inter.texto,
        tips: inter.tips,
        motivacional: inter.motiv
      },
      retroDominio: retroDominio(dominioDebil),
      recomendaciones,
      generadoEn: new Date().toISOString(),
      unanswered
    };

    if (!exportOnly && unanswered.length){
      alert('Faltan respuestas en: ' + unanswered.join(', ') + '. Puedes generar el diagnóstico, pero la precisión bajará.');
    }
    return data;
  }

  // ============================
  // 🖼️ Render de resultados
  // ============================
  function renderResultado(d){
    emptyMsg.hidden = true;
    resBlock.hidden = false;

    resultadosCard.classList.remove('result--verde','result--amarillo','result--rojo');
    resultadosCard.classList.add(
      d.clasificacion.color==='verde' ? 'result--verde' :
      d.clasificacion.color==='amarillo' ? 'result--amarillo' : 'result--rojo'
    );

    // Asegurar "/ 90"
    const pNode = puntajeEl.parentElement;
    if (pNode && pNode.innerHTML.includes('/ 60')){
      pNode.innerHTML = pNode.innerHTML.replace('/ 60', '/ 90');
    }
    puntajeEl.textContent = d.puntajeGlobal;
    clasEl.textContent = d.clasificacion.label;
    domEl.textContent = d.dominioDebil;

    const textoHTML = d.interpretacion.texto.map(p=>`<p class="interp-p">${p}</p>`).join('');
    const tipsHTML = d.interpretacion.tips.map(t=>`<li>🔹 ${t}</li>`).join('');
    const retro = d.retroDominio.map(r=>`<li>• ${r}</li>`).join('');

    bloqueExplicacion.innerHTML = `
      <div class="interp-nivel"><strong>${d.interpretacion.nivel}</strong></div>
      ${textoHTML}
      <ul class="interp-tips">${tipsHTML}</ul>
      <div class="retro-bloque">
        <strong>Cómo mejorar el dominio más débil (${d.dominioDebil}) sin perjudicar los demás:</strong>
        <ul class="interp-tips">${retro}</ul>
      </div>
      <div class="motivo destacado"><strong>Mensaje motivacional:</strong> ${d.interpretacion.motivacional}</div>
    `;

    // Focos
    focosEl.innerHTML = '';
    if (!d.focos.length) addLi(focosEl,'No se identificaron focos rojos.');
    else d.focos.forEach(f=>{
      const etiqueta = P_LABELS[f.pregunta] || f.pregunta;
      addLi(focosEl, `${f.pregunta} (${etiqueta}) — valor: ${f.valor} / máx: ${f.max}`);
    });

    // Recomendaciones
    fillList(recoFisEl, d.recomendaciones.fisicas);
    fillList(recoEmoEl, d.recomendaciones.emocionales);
    fillList(recoSocEl, d.recomendaciones.sociales);

    // Seguimiento
    if (d.clasificacion.color!=='verde'){
      seguimientoEl.hidden = false;
      seguimientoEl.textContent = (d.clasificacion.color==='amarillo')
        ? 'Seguimiento: repetir evaluación en 7 días y ajustar plan semanal.'
        : 'Seguimiento: repetir evaluación cada 3–4 días y coordinar intervención profesional si persisten señales.';
    } else seguimientoEl.hidden = true;

    // Mensaje breve
    mensajeTutorEl.textContent =
      (d.clasificacion.color==='verde')
        ? 'Bienestar estable. Conserva la rutina y añade retos mentales (revisión opcional cada 2–3 meses).'
        : (d.clasificacion.color==='amarillo')
          ? 'Bienestar moderado. Implementaremos acciones inmediatas y revisaremos progreso en 7 días.'
          : 'Bienestar comprometido. Priorizaremos seguridad y medidas de intervención con seguimiento cercano.';
  }

  // Helpers de render
  function addLi(ul, text){ const li = document.createElement('li'); li.textContent = text; ul.appendChild(li); }
  function fillList(ul, arr){ ul.innerHTML=''; if (!arr || !arr.length){ addLi(ul,'Sin recomendaciones específicas.'); return; } dedupe(arr).forEach(t=> addLi(ul,t)); }

  // ============================
  // 🧾 Exportar JSON
  // ============================
  btnExportJson.addEventListener('click', () => {
    const data = calcularDiagnostico(true);
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nombre = (document.getElementById('nombrePerro').value || 'diagnostico').replace(/\s+/g,'_');
    a.href = url; a.download = `diagnostico_${nombre}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  // ============================
  // 🖨️ Exportar PDF (conservando estilos)
  // ============================
  btnExportPdf.addEventListener('click', async () => {
    if (typeof html2canvas !== 'function' || !window.jspdf){ alert('Falta html2canvas o jsPDF.'); return; }
    const area = document.getElementById('resultados');
    btnExportPdf.disabled = true; const prev = btnExportPdf.textContent; btnExportPdf.textContent = 'Generando PDF...';
    const canvas = await html2canvas(area, { scale: 2, backgroundColor: null, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    const nombre = (document.getElementById('nombrePerro').value || 'diagnostico').replace(/\s+/g,'_');
    pdf.save(`Diagnostico_${nombre}.pdf`);
    btnExportPdf.disabled = false; btnExportPdf.textContent = prev;
  });

  // ============================
  // 🧼 Limpiar
  // ============================
  btnLimpiar.addEventListener('click', () => {
    resBlock.hidden = true;
    emptyMsg.hidden = false;
    resultadosCard.classList.remove('result--verde','result--amarillo','result--rojo');
    [focosEl,recoFisEl,recoEmoEl,recoSocEl].forEach(ul=> ul.innerHTML = '');
    seguimientoEl.hidden = true;
    mensajeTutorEl.textContent = '';
    bloqueExplicacion.innerHTML = '';
    form?.reset();
  });

  // ============================
  // ▶️ Calcular + Render + Enviar correo premium
  // ============================
  btnCalcular.addEventListener('click', async (e) => {
    e.preventDefault();
    const d = calcularDiagnostico();
    renderResultado(d);

    // ====== Construir HTML "email-safe" (premium) ======
    function escapeHtml(s = "") {
      return s.replace(/[&<>"']/g, (m) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
      );
    }
    function list(items) {
      if (!items || !items.length)
        return '<p style="margin:0;color:#666;">Sin elementos.</p>';
      return (
        '<ul style="margin:6px 0 0 18px;padding:0;">' +
        items.map((x) => `<li style="margin:4px 0;">${escapeHtml(x)}</li>`).join("") +
        "</ul>"
      );
    }

    const emailBody = (() => {
      const colorBox =
        d.clasificacion.color === "verde"
          ? "#eaf8ec"
          : d.clasificacion.color === "amarillo"
          ? "#fff7d6"
          : "#ffe2e2";

      const focoItems =
        d.focos && d.focos.length
          ? d.focos.map((f) => {
              const etiqueta = f.pregunta + " — " + (f.valor != null ? `valor ${f.valor}/${f.max}` : "");
              return `⚑ ${etiqueta}`;
            })
          : ["No se identificaron focos rojos."];

      return `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#fffaf5;padding:20px;border-radius:12px;color:#3c2f27;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="text-align:center;padding:15px;border-radius:10px;background:linear-gradient(90deg,#f7c67c,#f5b85c);margin-bottom:15px;">
          <img src="https://i.ibb.co/chfVQBX2/Sin-t-tulo-12.png" alt="LadraVentura Logo" width="120" style="display:block;margin:0 auto 10px;">
          <h1 style="margin:0;color:#4e342e;">Sistema de Bienestar Canino</h1>
          <p style="margin:0;color:#4e342e;font-size:14px;">Reporte conductual y emocional</p>
        </div>

        <div style="background:${colorBox};padding:12px 15px;border-radius:10px;margin-bottom:12px;">
          <h2 style="margin:0 0 6px 0;color:#4e342e;">📊 Resultado General</h2>
          <p style="margin:4px 0;"><strong>Puntaje:</strong> ${d.puntajeGlobal}/90</p>
          <p style="margin:4px 0;"><strong>Clasificación:</strong> ${escapeHtml(d.clasificacion.label)}</p>
          <p style="margin:4px 0;"><strong>Dominio más débil:</strong> ${escapeHtml(d.dominioDebil)}</p>
        </div>

        ${d.interpretacion?.texto?.length ? d.interpretacion.texto.map((p)=>`<p style="margin:8px 0;line-height:1.4;">${escapeHtml(p)}</p>`).join("") : ""}

        ${d.interpretacion?.tips?.length ? `
          <div style="margin-top:10px;padding:12px;background:#fdf1e1;border-radius:8px;">
            <h3 style="margin:0 0 6px 0;color:#d4782f;">💡 Tips clave</h3>
            ${list(d.interpretacion.tips)}
          </div>` : ""}

        ${d.retroDominio?.length ? `
          <div style="margin-top:15px;padding:12px;background:#f7eee2;border-radius:8px;">
            <h3 style="margin:0 0 6px 0;color:#d4782f;">⚖️ Cómo mejorar ${escapeHtml(d.dominioDebil)}</h3>
            ${list(d.retroDominio)}
          </div>` : ""}

        <div style="margin-top:15px;padding:12px;background:#fff3e0;border-radius:8px;">
          <h3 style="margin:0 0 6px 0;color:#d4782f;">🔎 Focos rojos</h3>
          ${list(focoItems)}
        </div>

        <div style="margin-top:15px;">
          <h3 style="margin:0 0 6px 0;color:#d4782f;">💪 Recomendaciones — Físico</h3>
          ${list(d.recomendaciones?.fisicas || [])}
        </div>
        <div style="margin-top:15px;">
          <h3 style="margin:0 0 6px 0;color:#d4782f;">🧠 Recomendaciones — Emocional</h3>
          ${list(d.recomendaciones?.emocionales || [])}
        </div>
        <div style="margin-top:15px;">
          <h3 style="margin:0 0 6px 0;color:#d4782f;">🤝 Recomendaciones — Social</h3>
          ${list(d.recomendaciones?.sociales || [])}
        </div>

        ${d.interpretacion?.motivacional ? `
          <div style="background:#fff3e0;padding:16px;border-radius:10px;margin:20px 0 10px 0;text-align:center;font-style:italic;font-size:16px;color:#5b3a1c;box-shadow:inset 0 0 6px rgba(0,0,0,0.1);">
            ${escapeHtml(d.interpretacion.motivacional)}
          </div>` : ""}

        <hr style="border:none;border-top:2px solid #f4c491;margin:20px 0;">
        <p style="text-align:center;font-size:14px;color:#6d4c41;">
          Gracias por confiar en <strong>LadraVentura</strong>.<br>
          Seguimos comprometidos con el bienestar y felicidad de tu lomito 🐕💛
        </p>
      </div>`;
    })();

    // ====== Envío EmailJS (usar BCC en la plantilla) ======
    try{
      emailjs.init("trHGypA_IGCxSQKXi"); // Public Key real

      const params = {
        to_name: d.meta.nombreTutor,
        to_email: d.meta.emailTutor, // tutor (BCC al centro se configura en la plantilla)
        perro_name: d.meta.nombrePerro,
        resultado: d.clasificacion.label,
        puntaje: `${d.puntajeGlobal}/90`,
        dominio: d.dominioDebil,
        motivacional: d.interpretacion.motivacional,
        fecha: d.meta.fecha,
        email_body: emailBody
      };

      await emailjs.send("service_ghwmle9", "template_i1xsccq", params);
      alert("📩 Se envió el diagnóstico completo al tutor (y copia a LadraVentura).");
    }catch(err){
      console.error('EmailJS error:', err);
      alert('⚠️ No se pudo enviar el correo automáticamente. Revisa EmailJS.');
    }

    resultadosCard.scrollIntoView({behavior:'smooth', block:'start'});
  });

});
