with open("js/admin.js", "w") as f:
    f.write("""// ============================================
// CORPORATIVO VIDA ETERNA — Admin Panel v4
// Firebase + IA Image Generation + File CRUD
// ============================================
(function() {
    'use strict';
    const _u = atob('cmhlcm5hbmRlenBnYTAx');
    const _p = atob('Q2xhdWRlMjAyMA==');
    const SK = 've_admin_session', CK = 've_content', IK = 've_images';
    const SD = 4*3600000;
    
    let fbDB = null;

    function auth() { const s=JSON.parse(localStorage.getItem(SK)||'{}'); if(s.t&&s.e&&Date.now()<s.e) return true; localStorage.removeItem(SK); return false; }
    function login() { localStorage.setItem(SK, JSON.stringify({t:Math.random().toString(36).substr(2), e:Date.now()+SD})); }
    function logout() { localStorage.removeItem(SK); location.reload(); }
    
    function initFirebase() {
        const configStr = localStorage.getItem('ve_firebase_config');
        if(configStr && window.firebase) {
            try {
                const config = JSON.parse(configStr);
                if(!firebase.apps.length) firebase.initializeApp(config);
                fbDB = firebase.database();
                toast('Firebase Conectado');
            } catch(e) { console.error('Firebase error', e); toast('Error al conectar Firebase'); }
        }
    }

    // Data fetchers
    function getC() { return JSON.parse(localStorage.getItem(CK)||'{}'); }
    function saveC(d) { const c=getC(); Object.assign(c,d); localStorage.setItem(CK,JSON.stringify(c)); if(fbDB) fbDB.ref('ve_content').set(c); }
    function getI() { return JSON.parse(localStorage.getItem(IK)||'{}'); }
    function saveI(k,v) { const i=getI(); i[k]=v; localStorage.setItem(IK,JSON.stringify(i)); if(fbDB) fbDB.ref('ve_images').update({[k]: v}); }
    function getArray(key, def) { return JSON.parse(localStorage.getItem(key)||JSON.stringify(def)); }
    function saveArray(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); if(fbDB) fbDB.ref('ve_arrays/'+key).set(arr); }

    function esc(s) { if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
    function toast(msg) {
        let t=document.querySelector('.toast');
        if(!t) { t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
        t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000);
    }

    function fileToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const ls=document.getElementById('login-screen'), db=document.getElementById('admin-dashboard'),
              lf=document.getElementById('login-form'), le=document.getElementById('login-error');

        if(auth()) { ls.style.display='none'; db.style.display='flex'; initDash(); }

        lf.addEventListener('submit', e => {
            e.preventDefault();
            const u=document.getElementById('login-user').value.trim(), p=document.getElementById('login-pass').value;
            if(u===_u && p===_p) { login(); ls.style.display='none'; db.style.display='flex'; initDash(); le.textContent=''; }
            else { le.textContent='Credenciales inválidas.'; document.getElementById('login-pass').value=''; }
        });
        document.getElementById('btn-logout').addEventListener('click', logout);
    });

    function initDash() {
        initFirebase();
        const navs=document.querySelectorAll('.nav-item'), pt=document.getElementById('page-title');
        render('dashboard');
        navs.forEach(n => n.addEventListener('click', e => {
            e.preventDefault(); navs.forEach(x=>x.classList.remove('active')); n.classList.add('active');
            pt.textContent=n.textContent.trim(); render(n.dataset.section);
        }));
    }

    function render(sec) {
        const box=document.getElementById('admin-content'), c=getC(), imgs=getI();
        let html='';
        let bindFunc = null;

        switch(sec) {
            case 'dashboard': html=dashboardHTML(c); break;
            case 'hero': html=heroHTML(c,imgs); break;
            case 'historia': html=historiaHTML(c,imgs); break;
            case 'panteon': html=panteonHTML(c,imgs); break;
            case 'contacto': html=contactoHTML(c); break;
            case 'chatbot': html=chatbotHTML(c); break;
            case 'leads': html=leadsHTML(); break;
            case 'config': html=configHTML(); bindFunc = bindConfig; break;
            case 'ia_images': html=iaImagesHTML(); bindFunc = bindIaImages; break;
            case 'servicios': 
                html=crudHTML('Servicios','ve_servicios', [{id:'name', label:'Servicio', type:'text'}, {id:'desc', label:'Descripción corta', type:'textarea'}, {id:'icon', label:'Foto', type:'image'}]); 
                bindFunc = ()=>bindCrud('ve_servicios', [{id:'name', type:'text'}, {id:'desc', type:'textarea'}, {id:'icon', type:'image'}]); break;
            case 'ubicaciones': 
                html=crudHTML('Sucursales','ve_sucursales', [{id:'name', label:'Nombre', type:'text'}, {id:'address', label:'Dirección', type:'text'}, {id:'mapUrl', label:'Enlace Maps', type:'text'}, {id:'icon', label:'Foto de la Sucursal', type:'image'}]); 
                bindFunc = ()=>bindCrud('ve_sucursales', [{id:'name', type:'text'}, {id:'address', type:'text'}, {id:'mapUrl', type:'text'}, {id:'icon', type:'image'}]); break;
            case 'alianzas': 
                html=crudHTML('Alianzas','ve_alianzas', [{id:'name', label:'Empresa', type:'text'}, {id:'icon', label:'Logo Alianza', type:'image'}]); 
                bindFunc = ()=>bindCrud('ve_alianzas', [{id:'name', type:'text'}, {id:'icon', type:'image'}]); break;
            case 'testimonios': 
                html=crudHTML('Testimonios','ve_testimonios', [{id:'author', label:'Autor', type:'text'}, {id:'text', label:'Mensaje', type:'textarea'}, {id:'date', label:'Fecha', type:'text'}]); 
                bindFunc = ()=>bindCrud('ve_testimonios', [{id:'author', type:'text'}, {id:'text', type:'textarea'}, {id:'date', type:'text'}]); break;
            case 'eventos': html=eventosHTML(); bindFunc = bindEventos; break;
            case 'obituarios': html=obituariosHTML(); bindFunc = bindObituarios; break;
            default: html=dashboardHTML(c); break;
        }
        
        box.innerHTML=html;
        if(document.getElementById('section-form')) bindForm(sec);
        bindImageUploads();
        if(bindFunc) bindFunc();
        if(document.getElementById('ia-consultant-btn')) bindIA();
    }

    // ===== UI HELPERS =====
    function imgUploadZone(key, label, currentImg) {
        const preview = currentImg ? `<img src="${currentImg}" style="max-width:100%;max-height:180px;border-radius:8px;">` : `<i class="ph ph-cloud-arrow-up" style="font-size:2.5rem;color:#94A3B8;"></i><p style="color:#94A3B8;font-size:0.85rem;margin-top:0.5rem;">Arrastra una imagen</p>`;
        return `
            <div class="form-group">
                <label>${label}</label>
                <div class="img-upload-zone" data-img-key="${key}">
                    <div class="img-preview">${preview}</div>
                    <input type="file" accept="image/*" style="display:none;">
                </div>
            </div>`;
    }

    function bindImageUploads() {
        document.querySelectorAll('.img-upload-zone').forEach(zone => {
            const input = zone.querySelector('input[type="file"]');
            const key = zone.dataset.imgKey;
            const preview = zone.querySelector('.img-preview');

            zone.addEventListener('click', () => input.click());
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
            zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0], key, preview); });
            input.addEventListener('change', () => { if(input.files[0]) handleFile(input.files[0], key, preview); });
        });
    }

    async function handleFile(file, key, preview) {
        if(!file || !file.type.startsWith('image/')) return;
        const base64 = await fileToBase64(file);
        saveI(key, base64);
        if(preview) preview.innerHTML = `<img src="${base64}" style="max-width:100%;max-height:200px;border-radius:8px;">`;
        toast('✓ Imagen guardada');
    }

    // ===== CRUD GENERATOR V4 =====
    function crudHTML(title, key, fields) {
        const arr = getArray(key, []);
        let list = arr.length ? arr.map((item,i) => {
            const displayField = item[fields[0].id] || 'Elemento '+(i+1);
            return `
            <div class="editor-card" style="margin-bottom:1rem;">
                <div class="editor-card-header"><h3>${esc(displayField)}</h3>
                    <div style="display:flex;gap:0.5rem;"><button class="btn-secondary btn-edit-crud" data-idx="${i}"><i class="ph ph-pencil"></i></button><button class="btn-danger btn-delete-crud" data-idx="${i}"><i class="ph ph-trash"></i></button></div>
                </div>
            </div>`;
        }).join('') : '<div class="empty-state"><i class="ph ph-squares-four"></i><p>Lista vacía.</p></div>';

        let formFields = fields.map(f => {
            if(f.type === 'image') return `<div class="form-group"><label>${f.label}</label><input type="file" id="crudf-${f.id}" accept="image/*"><div class="img-preview" id="crudf-preview-${f.id}" style="margin-top:0.5rem; background:rgba(0,0,0,0.1); padding:0.5rem; border-radius:8px; text-align:center;">Sin Imagen</div></div>`;
            if(f.type === 'textarea') return `<div class="form-group"><label>${f.label}</label><textarea id="crudf-${f.id}" required></textarea></div>`;
            return `<div class="form-group"><label>${f.label}</label><input type="text" id="crudf-${f.id}" required></div>`;
        }).join('');
        
        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h3>Gestión de ${title}</h3><button class="btn-save" id="btn-add-crud"><i class="ph ph-plus"></i> Nuevo</button>
        </div>${list}
        <div class="editor-card" id="crud-form-card" style="display:none;"><div class="editor-card-header"><h3 id="crud-form-title">Añadir</h3></div>
        <div class="editor-card-body"><form id="crud-form"><input type="hidden" id="crud-edit-idx" value="-1">${formFields}
        <div class="btn-group"><button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Guardar</button><button type="button" class="btn-secondary" id="btn-cancel-crud">Cancelar</button></div>
        </form></div></div>`;
    }

    function bindCrud(key, fields) {
        const arr = getArray(key, []);
        const addBtn = document.getElementById('btn-add-crud');
        const formCard = document.getElementById('crud-form-card');
        const form = document.getElementById('crud-form');
        
        if(addBtn) addBtn.addEventListener('click', () => {
            document.getElementById('crud-edit-idx').value = '-1'; 
            fields.forEach(f => {
                if(f.type === 'image') { document.getElementById(`crudf-${f.id}`).value=''; document.getElementById(`crudf-${f.id}`).dataset.b64=''; document.getElementById(`crudf-preview-${f.id}`).innerHTML='Sin imagen'; }
                else document.getElementById(`crudf-${f.id}`).value = '';
            });
            formCard.style.display = 'block'; formCard.scrollIntoView({behavior:'smooth'});
        });
        document.getElementById('btn-cancel-crud').addEventListener('click', () => formCard.style.display = 'none');

        document.querySelectorAll('.btn-edit-crud').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx); const item = arr[idx];
                document.getElementById('crud-edit-idx').value = idx;
                fields.forEach(f => {
                    if(f.type === 'image') {
                        document.getElementById(`crudf-${f.id}`).value=''; 
                        document.getElementById(`crudf-${f.id}`).dataset.b64='';
                        document.getElementById(`crudf-preview-${f.id}`).innerHTML = item[f.id] ? `<img src="${item[f.id]}" style="max-height:80px; border-radius:4px;">` : 'Sin imagen';
                    } else document.getElementById(`crudf-${f.id}`).value = item[f.id]||'';
                });
                formCard.style.display = 'block'; formCard.scrollIntoView({behavior:'smooth'});
            });
        });

        document.querySelectorAll('.btn-delete-crud').forEach(btn => {
            btn.addEventListener('click', () => {
                if(!confirm('¿Eliminar?')) return;
                arr.splice(parseInt(btn.dataset.idx), 1); saveArray(key, arr); toast('Eliminado');
                document.querySelector(`.nav-item.active`).click();
            });
        });

        fields.filter(f=>f.type==='image').forEach(f => {
            document.getElementById(`crudf-${f.id}`).addEventListener('change', async (e) => {
                if(e.target.files[0]) {
                    const b64 = await fileToBase64(e.target.files[0]);
                    document.getElementById(`crudf-${f.id}`).dataset.b64 = b64;
                    document.getElementById(`crudf-preview-${f.id}`).innerHTML = `<img src="${b64}" style="max-height:80px; border-radius:4px;">`;
                }
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const idx = parseInt(document.getElementById('crud-edit-idx').value);
            const item = {}; 
            fields.forEach(f => {
                if(f.type === 'image') {
                    const newB64 = document.getElementById(`crudf-${f.id}`).dataset.b64;
                    if(newB64) item[f.id] = newB64;
                    else if(idx >= 0) item[f.id] = arr[idx][f.id]; // keep old
                } else item[f.id] = document.getElementById(`crudf-${f.id}`).value;
            });
            if(idx >= 0) arr[idx] = item; else arr.push(item);
            saveArray(key, arr); toast('Guardado'); document.querySelector(`.nav-item.active`).click();
        });
    }

    // ===== OBITUARIOS Y EVENTOS =====
    function obituariosHTML() {
        const arr = getArray('ve_obituarios', []);
        let list = arr.map((item,i) => `
            <div class="editor-card" style="margin-bottom:1rem;"><div class="editor-card-header"><h3>${esc(item.name)}</h3>
            <div style="display:flex;gap:0.5rem;"><button class="btn-danger btn-delete-ob" data-idx="${i}"><i class="ph ph-trash"></i></button></div></div></div>`).join('');
        if(!list) list = '<div class="empty-state"><i class="ph ph-user"></i><p>No hay velaciones activas.</p></div>';

        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h3>Obituarios Activos</h3><button class="btn-save" id="btn-add-ob"><i class="ph ph-plus"></i> Añadir</button>
        </div>${list}
        <div class="editor-card" id="ob-form-card" style="display:none;"><div class="editor-card-header"><h3>Añadir Obituario</h3></div>
        <div class="editor-card-body"><form id="ob-form">
        <div class="form-group"><label>Nombre del Difunto</label><input type="text" id="ob-name" required></div>
        <div class="form-group"><label>Sala / Sucursal</label><input type="text" id="ob-sala" placeholder="Ej: Sala Imperial, Sucursal Celaya" required></div>
        <div class="form-group"><label>Horario</label><input type="text" id="ob-horario" placeholder="Ej: Hoy 18:00 hrs a Mañana 12:00 hrs"></div>
        <div class="form-group"><label>Foto (Opcional)</label><input type="file" id="ob-img" accept="image/*"></div>
        <div class="btn-group"><button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Publicar</button><button type="button" class="btn-secondary" id="btn-cancel-ob">Cancelar</button></div>
        </form></div></div>`;
    }

    function bindObituarios() {
        const arr = getArray('ve_obituarios', []);
        document.getElementById('btn-add-ob').addEventListener('click', () => document.getElementById('ob-form-card').style.display = 'block');
        document.getElementById('btn-cancel-ob').addEventListener('click', () => document.getElementById('ob-form-card').style.display = 'none');
        document.querySelectorAll('.btn-delete-ob').forEach(btn => btn.addEventListener('click', () => {
            arr.splice(btn.dataset.idx, 1); saveArray('ve_obituarios', arr); document.querySelector(`.nav-item.active`).click();
        }));
        document.getElementById('ob-form').addEventListener('submit', async(e) => {
            e.preventDefault();
            const file = document.getElementById('ob-img').files[0];
            const imgBase64 = file ? await fileToBase64(file) : null;
            arr.push({ name: document.getElementById('ob-name').value, sala: document.getElementById('ob-sala').value, horario: document.getElementById('ob-horario').value, image: imgBase64 });
            saveArray('ve_obituarios', arr); toast('Obituario publicado'); document.querySelector(`.nav-item.active`).click();
        });
    }

    function eventosHTML() {
        const arr = getArray('ve_events', []);
        let list = arr.map((item,i) => `
            <div class="editor-card" style="margin-bottom:1rem;"><div class="editor-card-header">
            <h3>${item.type==='zoom'? '🖥️ ' : '📍 '} ${esc(item.title)}</h3>
            <div style="display:flex;gap:0.5rem;"><button class="btn-danger btn-delete-ev" data-idx="${i}"><i class="ph ph-trash"></i></button></div></div></div>`).join('');
        if(!list) list = '<div class="empty-state"><p>No hay eventos.</p></div>';

        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h3>Eventos</h3><button class="btn-save" id="btn-add-ev"><i class="ph ph-plus"></i> Añadir</button>
        </div>${list}
        <div class="editor-card" id="ev-form-card" style="display:none;"><div class="editor-card-header"><h3>Nuevo Evento</h3></div>
        <div class="editor-card-body"><form id="ev-form">
        <div class="form-group"><label>Tipo</label><select id="ev-type"><option value="presencial">Presencial</option><option value="zoom">Virtual (Zoom/Meet)</option></select></div>
        <div class="form-group"><label>Título</label><input type="text" id="ev-title" required></div>
        <div class="form-group"><label>Fecha</label><input type="text" id="ev-date" required></div>
        <div class="form-group"><label>Hora</label><input type="text" id="ev-time"></div>
        <div class="form-group"><label>Descripción</label><textarea id="ev-desc"></textarea></div>
        <div class="form-group"><label>Link / Ubicación de Maps</label><input type="text" id="ev-locUrl"></div>
        <div class="form-group"><label>Imagen</label><input type="file" id="ev-img" accept="image/*"></div>
        <div class="btn-group"><button type="submit" class="btn-save">Publicar</button><button type="button" class="btn-secondary" id="btn-cancel-ev">Cancelar</button></div>
        </form></div></div>`;
    }

    function bindEventos() {
        const arr = getArray('ve_events', []);
        document.getElementById('btn-add-ev').addEventListener('click', () => document.getElementById('ev-form-card').style.display = 'block');
        document.getElementById('btn-cancel-ev').addEventListener('click', () => document.getElementById('ev-form-card').style.display = 'none');
        document.querySelectorAll('.btn-delete-ev').forEach(btn => btn.addEventListener('click', () => { arr.splice(btn.dataset.idx, 1); saveArray('ve_events', arr); document.querySelector(`.nav-item.active`).click(); }));
        document.getElementById('ev-form').addEventListener('submit', async(e) => {
            e.preventDefault();
            const file = document.getElementById('ev-img').files[0];
            const imgBase64 = file ? await fileToBase64(file) : null;
            arr.push({ type: document.getElementById('ev-type').value, title: document.getElementById('ev-title').value, date: document.getElementById('ev-date').value, time: document.getElementById('ev-time').value, description: document.getElementById('ev-desc').value, locationUrl: document.getElementById('ev-locUrl').value, image: imgBase64 });
            saveArray('ve_events', arr); toast('Guardado'); document.querySelector(`.nav-item.active`).click();
        });
    }

    // ===== STATIC PAGES (Hero, Historia, Panteon, Contacto) =====
    function dashboardHTML() {
        return `<div class="editor-card"><div class="editor-card-header"><h3>Panel de Control - Vida Eterna V4</h3></div><div class="editor-card-body">
        <p>Bienvenido. Disfruta de un panel dinámico y seguro.</p><br>
        <div style="background:rgba(26,122,92,0.1);padding:1rem;border-radius:8px;border:1px solid var(--color-primary);display:flex;align-items:center;gap:1rem;">
            <i class="ph-fill ph-robot" style="font-size:2rem;color:var(--color-primary);"></i>
            <div><h4 style="margin-bottom:0.25rem;">Consultor IA Interno Avanzado</h4><p style="font-size:0.85rem;color:var(--color-text-light);">Necesitas crear una cotización, resolver dudas de la página o diseñar paquetes? <a href="#" id="ia-consultant-btn" style="color:var(--color-primary);text-decoration:underline;">Abre el chat experto</a></p></div>
        </div>
        </div></div>`;
    }

    function bindIA() {
        document.getElementById('ia-consultant-btn').addEventListener('click', (e) => {
            e.preventDefault(); document.querySelector('[data-section="config"]').click();
        });
    }

    function configHTML() {
        const key = localStorage.getItem('ve_gemini_key') || '';
        const fbCfg = localStorage.getItem('ve_firebase_config') || '';
        const imgs = getI();
        return `<div class="editor-card"><div class="editor-card-header"><h3>Configuración General y Logo</h3></div><div class="editor-card-body">
        ${imgUploadZone('logo','Tu Logotipo (Recomendado sin fondo/PNG)',imgs.logo)}
        </div></div>

        <div class="editor-card mt-1"><div class="editor-card-header"><h3>Base de Datos en la Nube (Firebase)</h3></div><div class="editor-card-body">
        <p style="color:#94A3B8;margin-bottom:1.5rem;">Pega el JSON de configuración de Firebase para guardar en tiempo real.</p>
        <div class="form-group"><label>Firebase Config</label><textarea id="cfg-firebase" rows="4">${fbCfg}</textarea></div>
        <button class="btn-save" id="cfg-fb-save">Conectar Firebase</button>
        </div></div>

        <div class="editor-card mt-1"><div class="editor-card-header"><h3>Configuración Gemini (IA)</h3></div><div class="editor-card-body">
        <div class="form-group"><label>API KEY</label><input type="password" id="cfg-apikey" value="${key}"></div>
        <button class="btn-save" id="cfg-save-btn">Guardar Llave</button>
        </div></div>
        
        <div class="editor-card mt-1"><div class="editor-card-header"><h3>Asistente Experto IA para Administración</h3></div><div class="editor-card-body">
        <p style="color:#94A3B8;margin-bottom:1rem;">Dime tus dudas ("¿Cómo armo un plan de previsión?" o "Dame opciones de promoción para el día de muertos"):</p>
        <textarea id="ia-prompt" rows="3" placeholder="Pregúntame algo..."></textarea>
        <button class="btn-primary mt-1" id="ia-ask-btn" style="margin-bottom:1rem;">Asesorarme</button>
        <div id="ia-response" style="padding:1rem;background:rgba(0,0,0,0.2);border-radius:8px;white-space:pre-wrap;display:none;border:1px solid #1A7A5C;"></div>
        </div></div>`;
    }

    function bindConfig() {
        document.getElementById('cfg-save-btn').addEventListener('click', () => {
            localStorage.setItem('ve_gemini_key', document.getElementById('cfg-apikey').value);
            toast('Llave guardada');
        });
        document.getElementById('cfg-fb-save').addEventListener('click', () => {
            localStorage.setItem('ve_firebase_config', document.getElementById('cfg-firebase').value);
            toast('Firebase Config Guardado'); location.reload();
        });
        document.getElementById('ia-ask-btn').addEventListener('click', async () => {
            const key = localStorage.getItem('ve_gemini_key');
            if(!key) return alert('Guarda tu API Key primero');
            const prompt = document.getElementById('ia-prompt').value;
            const resBox = document.getElementById('ia-response');
            document.getElementById('ia-ask-btn').textContent = "Procesando...";
            try {
                const req = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({contents: [{parts: [{text: "Eres el experto principal en la administración de Corporativo Vida Eterna. Responde como experto en funerarias a la siguiente duda del administrador y ayúdale a formatear textos o idear promociones: " + prompt}]}]})
                });
                const data = await req.json();
                resBox.style.display = 'block';
                resBox.innerHTML = data.candidates[0].content.parts[0].text;
            } catch(e) { resBox.style.display='block'; resBox.textContent = 'Error conectando a Inteligencia Artificial.'; }
            document.getElementById('ia-ask-btn').textContent = "Asesorarme";
        });
    }

    function iaImagesHTML() {
        return `<div class="editor-card"><div class="editor-card-header"><h3>Nano Banana (Generador de Imágenes IA)</h3></div><div class="editor-card-body">
        <p style="color:#94A3B8;margin-bottom:1rem;">Describe detalladamente la imagen que deseas generar (Ej. "Un arreglo floral fúnebre elegante con rosas blancas y fondo oscuro, hiperrealista, fotográfico").</p>
        <div class="form-group"><input type="text" id="ia-img-prompt" placeholder="Describe aquí la imagen..." style="width:100%; padding:0.75rem;"></div>
        <button class="btn-save mt-1" id="ia-img-generate-btn"><i class="ph ph-magic-wand"></i> Generar Imagen (Nano Banana)</button>
        <div id="ia-img-result" style="margin-top:2rem; text-align:center;"></div>
        </div></div>`;
    }

    function bindIaImages() {
        document.getElementById('ia-img-generate-btn').addEventListener('click', () => {
            const prompt = document.getElementById('ia-img-prompt').value;
            if(!prompt) return alert('Por favor, ingresa una descripción.');
            const resBox = document.getElementById('ia-img-result');
            resBox.innerHTML = '<p>🔮 Generando magia...</p>';
            const seed = Math.floor(Math.random() * 100000);
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}`;
            
            const img = new Image();
            img.onload = () => {
                resBox.innerHTML = `
                    <div style="position:relative; display:inline-block;">
                        <img src="${url}" style="max-width:100%; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.2);">
                        <div style="margin-top:1rem;">
                            <a href="${url}" target="_blank" class="btn-primary" download><i class="ph ph-download"></i> Descargar Original</a>
                        </div>
                    </div>`;
            };
            img.onerror = () => { resBox.innerHTML = '<p>Ooops, error al generar la imagen. Intenta de nuevo.</p>'; };
            img.src = url;
        });
    }

    function heroHTML(c,imgs) { return formWrapper('hero', `${imgUploadZone('hero','Imagen de Fondo',imgs.hero)}<div class="form-group"><label>Subtítulo</label><input type="text" name="hero_subtitle" value="${esc(c.hero_subtitle)}"></div><div class="form-group"><label>Título</label><input type="text" name="hero_title" value="${esc(c.hero_title)}"></div>`); }
    function historiaHTML(c,imgs) { return formWrapper('historia', `${imgUploadZone('about','Imagen Nosotros',imgs.about)}<div class="form-group"><label>Título</label><input type="text" name="historia_title" value="${esc(c.historia_title)}"></div><div class="form-group"><label>Párrafo 1</label><textarea name="historia_p1">${esc(c.historia_p1)}</textarea></div>`); }
    function panteonHTML(c,imgs) { return formWrapper('panteon', `${imgUploadZone('panteon','Fondo',imgs.panteon)}<div class="form-group"><label>Título</label><input type="text" name="panteon_title" value="${esc(c.panteon_title)}"></div><div class="form-group"><label>Preventa Mensaje</label><input type="text" name="panteon_preventa" value="${esc(c.panteon_preventa)}"></div>`); }
    function contactoHTML(c) { return formWrapper('contacto', `<div class="form-row"><div class="form-group"><label>Teléfono</label><input type="text" name="footer_phone" value="${esc(c.footer_phone)}"></div></div><div class="form-row"><div class="form-group"><label>Facebook URL</label><input type="text" name="social_facebook" value="${esc(c.social_facebook)}"></div></div>`); }
    function chatbotHTML(c) { return formWrapper('chatbot', `<p style="color:#94A3B8;margin-bottom:1rem;">El chatbot público usa tu API Key configurada para inteligencia total natural y redirección a WhatsApp.</p>`); }
    
    function leadsHTML() {
        const leads = JSON.parse(localStorage.getItem('ve_leads')||'[]');
        const rows = leads.map((l,i) => `<tr><td>${i+1}</td><td>${esc(l.email)}</td><td>${new Date(l.date).toLocaleString('es-MX')}</td></tr>`).join('');
        return `<div class="editor-card"><div class="editor-card-header"><h3>Leads Panteón</h3></div><div class="editor-card-body"><table class="leads-table"><thead><tr><th>#</th><th>Email</th><th>Fecha</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    }

    function formWrapper(title, inner) {
        return `<div class="editor-card"><div class="editor-card-header"><h3 style="text-transform:capitalize">${title}</h3></div><div class="editor-card-body"><form id="section-form">${inner}<div class="btn-group"><button type="submit" class="btn-save">Guardar</button></div></form></div></div>`;
    }

    function bindForm(sec) {
        const f = document.getElementById('section-form');
        f.addEventListener('submit', e => { e.preventDefault(); const d = {}; new FormData(f).forEach((v,k) => d[k]=v); saveC(d); toast('Guardado'); });
    }
})();
"""
