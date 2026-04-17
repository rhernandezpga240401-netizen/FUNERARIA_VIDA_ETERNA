// ============================================
// CORPORATIVO VIDA ETERNA — Admin Panel v5
// Global Media Gallery, IA Chat Assistant, Firebase
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

    function seedDefaults() {
        if(!localStorage.getItem('ve_servicios')) {
            saveArray('ve_servicios', [
                { name: "Servicios Funerarios", desc: "Velación, cremación, inhumación y traslados.", icon: "ph-flower-tulip" },
                { name: "Planes de Previsión", desc: "Congela precios y evita gastos inesperados.", icon: "ph-shield-check" },
                { name: "Tanatóloga", desc: "Acompañamiento profesional en el duelo.", icon: "ph-heart" },
                { name: "Empresariales", desc: "Beneficios para tus colaboradores.", icon: "ph-buildings" }
            ]);
            saveArray('ve_sucursales', [
                { name: "Sucursal Celaya", address: "Centro, Celaya, Gto.", mapUrl: "#", icon: "" },
                { name: "Sucursal Villagrán", address: "Centro, Villagrán, Gto.", mapUrl: "#", icon: "" }
            ]);
            saveArray('ve_alianzas', [
                { name: "Hospital Central", icon: "ph-hospital" },
                { name: "Clínica San Juan", icon: "ph-first-aid-kit" }
            ]);
            saveArray('ve_testimonios', [
                { text: "Atención impecable en momentos difíciles.", author: "Familia Martínez", date: "2025" }
            ]);
        }
    }

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

        seedDefaults();

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
        
        // Modal Injetion
        document.body.insertAdjacentHTML('beforeend', renderGalleryModal());

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
            case 'ia_chat': html=iaChatHTML(); bindFunc = bindIaChat; break;
            case 'imagenes': html=imagenesHTML(); bindFunc = bindImagenes; break;
            case 'servicios': 
                html=crudHTML('Servicios','ve_servicios', [{id:'name', label:'Servicio', type:'text'}, {id:'desc', label:'Descripción corta', type:'textarea'}, {id:'icon', label:'Foto (En base64)', type:'image'}]); 
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

    // ===== GALERIA MULTIMEDIA =====
    function imagenesHTML() {
        const gallery = getArray('ve_gallery', []);
        const items = gallery.map((img,i) => `
            <div style="position:relative; width:150px; height:150px; border-radius:8px; overflow:hidden; border:1px solid #334155;">
                <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                <button class="btn-danger btn-del-gal" data-idx="${i}" style="position:absolute; top:5px; right:5px; padding:0.25rem;"><i class="ph ph-trash"></i></button>
            </div>
        `).join('');
    
        return `<div class="editor-card">
            <div class="editor-card-header"><h3>Banco de Imágenes (Media Gallery)</h3></div>
            <div class="editor-card-body">
                <p style="color:#94A3B8;margin-bottom:1rem;">Esta es tu biblioteca maestra. Sube fotografías de tu Panteón, Servicios o Velaciones para usarlas rápidamente en cualquier configuración sin tener que subirlas cada vez.</p>
                <input type="file" id="gal-upload" accept="image/*" style="display:none;">
                <button class="btn-save" onclick="document.getElementById('gal-upload').click()"><i class="ph ph-upload-simple"></i> Subir a Galería</button>
                <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-top:2rem;">
                    ${items || '<p style="color:#64748B;">No hay imágenes cargadas en la galería.</p>'}
                </div>
            </div>
        </div>`;
    }
    
    function bindImagenes() {
        const arr = getArray('ve_gallery', []);
        document.getElementById('gal-upload').addEventListener('change', async (e) => {
            if(e.target.files[0]) {
                const b64 = await fileToBase64(e.target.files[0]);
                arr.unshift(b64);
                saveArray('ve_gallery', arr);
                document.querySelector('.nav-item.active').click(); // refresh
                toast('✓ Imagen agregada a la galería');
                updateGalleryModal();
            }
        });
        document.querySelectorAll('.btn-del-gal').forEach(btn => {
            btn.addEventListener('click', () => {
                if(!confirm('¿Seguro que deseas eliminar esta imagen de la Galería Multimedia? Se borrará de donde sea usada actualmente.')) return;
                arr.splice(btn.dataset.idx, 1);
                saveArray('ve_gallery', arr);
                document.querySelector('.nav-item.active').click(); // refresh
                updateGalleryModal();
            });
        });
    }

    function renderGalleryModal() {
        return `<div id="gal-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;">
            <div style="background:var(--color-bg); padding:2rem; border-radius:12px; max-width:600px; width:90%; max-height:80vh; overflow-y:auto; border:1px solid #334155;">
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <h3>Selecciona una Imagen</h3>
                    <button onclick="document.getElementById('gal-modal').style.display='none'" class="btn-secondary">Cerrar</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:0.5rem;" id="gal-items-container">
                    <!-- populated dynamic -->
                </div>
            </div>
        </div>`;
    }

    function updateGalleryModal() {
        const gallery = getArray('ve_gallery', []);
        const box = document.getElementById('gal-items-container');
        if(!box) return;
        const items = gallery.map((img) => `
            <div class="gal-select-item" data-b64="${img}" style="width:100px; height:100px; cursor:pointer; border-radius:4px; overflow:hidden; border:2px solid transparent;">
                <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
            </div>
        `).join('');
        box.innerHTML = items || '<p>Galería vacía. Dirígete a la pestaña "Galería Media" para pre-cargar fotos.</p>';
    }

    // ===== CRUD GENERATOR V5 (With Gallery Link) =====
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
            if(f.type === 'image') return `<div class="form-group"><label>${f.label}</label>
                <div style="display:flex; gap:1rem; margin-bottom:0.5rem;">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('crudf-${f.id}').click()"><i class="ph ph-upload-simple"></i> Subir Archivo Local</button>
                    <button type="button" class="btn-primary btn-open-gal-modal" data-target="crudf-${f.id}"><i class="ph ph-images"></i> Elegir de la Galería</button>
                </div>
                <input type="file" id="crudf-${f.id}" accept="image/*" style="display:none;">
                <div class="img-preview" id="crudf-preview-${f.id}" style="margin-top:0.5rem; background:rgba(0,0,0,0.1); padding:0.5rem; border-radius:8px; text-align:center;">Sin Imagen Seleccionada</div>
            </div>`;
            if(f.type === 'textarea') return `<div class="form-group"><label>${f.label}</label><textarea id="crudf-${f.id}" required></textarea></div>`;
            return `<div class="form-group"><label>${f.label}</label><input type="text" id="crudf-${f.id}" required></div>`;
        }).join('');
        
        return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
            <h3>Gestión de ${title}</h3><button class="btn-save" id="btn-add-crud"><i class="ph ph-plus"></i> Añadir Nuevo</button>
        </div>${list}
        <div class="editor-card" id="crud-form-card" style="display:none;"><div class="editor-card-header"><h3 id="crud-form-title">Añadir</h3></div>
        <div class="editor-card-body"><form id="crud-form"><input type="hidden" id="crud-edit-idx" value="-1">${formFields}
        <div class="btn-group"><button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Guardar y Aplicar Cambios</button><button type="button" class="btn-secondary" id="btn-cancel-crud">Cancelar</button></div>
        </form></div></div>`;
    }

    function bindCrud(key, fields) {
        const arr = getArray(key, []);
        const addBtn = document.getElementById('btn-add-crud');
        const formCard = document.getElementById('crud-form-card');
        const form = document.getElementById('crud-form');
        
        updateGalleryModal(); // ensure modal is populated

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
                        document.getElementById(`crudf-preview-${f.id}`).innerHTML = (item[f.id] && item[f.id].startsWith('data:')) ? `<img src="${item[f.id]}" style="max-height:80px; border-radius:4px;">` : `<i class="ph ${item[f.id]||'ph-image'}"></i> ${item[f.id]||'Sin imagen'}`;
                    } else document.getElementById(`crudf-${f.id}`).value = item[f.id]||'';
                });
                formCard.style.display = 'block'; formCard.scrollIntoView({behavior:'smooth'});
            });
        });

        document.querySelectorAll('.btn-delete-crud').forEach(btn => {
            btn.addEventListener('click', () => {
                if(!confirm('¿Eliminar registro?')) return;
                arr.splice(parseInt(btn.dataset.idx), 1); saveArray(key, arr); toast('Eliminado');
                document.querySelector(`.nav-item.active`).click();
            });
        });

        let activeImageTarget = null;
        document.querySelectorAll('.btn-open-gal-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                activeImageTarget = btn.dataset.target;
                document.getElementById('gal-modal').style.display = 'flex';
            });
        });

        document.getElementById('gal-items-container').addEventListener('click', (e) => {
            const item = e.target.closest('.gal-select-item');
            if(item && activeImageTarget) {
                const b64 = item.dataset.b64;
                document.getElementById(activeImageTarget).dataset.b64 = b64;
                document.getElementById(`crudf-preview-${activeImageTarget.replace('crudf-', '')}`).innerHTML = `<img src="${b64}" style="max-height:80px; border-radius:4px;">`;
                document.getElementById('gal-modal').style.display = 'none';
            }
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
            saveArray(key, arr); toast('Publicado Correctamente'); document.querySelector(`.nav-item.active`).click();
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
        <div class="form-group"><label>Foto (Opcional)</label>
            <div style="margin-bottom:0.5rem;"><input type="file" id="ob-img" accept="image/*"></div>
        </div>
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
        <div class="form-group"><label>Imagen Local</label><input type="file" id="ev-img" accept="image/*"></div>
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

    // ===== STATIC PAGES & CONFIG =====
    function dashboardHTML() {
        return `<div class="editor-card"><div class="editor-card-header"><h3>Dashboard - Vida Eterna</h3></div><div class="editor-card-body">
        <p>Bienvenido. El menú lateral ha sido restablecido y expandido con tus nuevas herramientas.</p><br>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div style="background:rgba(26,122,92,0.1);padding:1.5rem;border-radius:8px;border:1px solid var(--color-primary);text-align:center;cursor:pointer;" onclick="document.querySelector('[data-section=imagenes]').click()">
                <i class="ph-fill ph-images" style="font-size:2.5rem;color:var(--color-primary);"></i>
                <h4>Galería Media</h4>
                <p style="font-size:0.85rem;color:var(--color-text-light);">Sube tus fotos para reusarlas</p>
            </div>
            <div style="background:rgba(0,0,0,0.2);padding:1.5rem;border-radius:8px;border:1px solid #334155;text-align:center;cursor:pointer;" onclick="document.querySelector('[data-section=config]').click()">
                <i class="ph-fill ph-gear-six" style="font-size:2.5rem;color:#cbd5e1;"></i>
                <h4 style="color:white;">Configuración</h4>
                <p style="font-size:0.85rem;color:#94a3b8;">Sube el Logo Principal y la Base de Datos</p>
            </div>
        </div>
        </div></div>`;
    }

    function configHTML() {
        const key = localStorage.getItem('ve_gemini_key') || '';
        const fbCfg = localStorage.getItem('ve_firebase_config') || '';
        const imgs = getI();
        return `<div class="editor-card"><div class="editor-card-header"><h3>Configuración General y Logotipo</h3></div><div class="editor-card-body">
        ${imgUploadZone('logo','Sube aquí tu Logotipo (Recomendado sin fondo/PNG)',imgs.logo)}
        </div></div>

        <div class="editor-card mt-1"><div class="editor-card-header"><h3>Base de Datos en la Nube (Firebase)</h3></div><div class="editor-card-body">
        <p style="color:#94A3B8;margin-bottom:1.5rem;">Pega el JSON de configuración de Firebase acá, o déjalo vacío para usar el guardado local del navegador.</p>
        <div class="form-group"><label>Firebase Config</label><textarea id="cfg-firebase" rows="4">${fbCfg}</textarea></div>
        <button class="btn-save" id="cfg-fb-save">Conectar y Sincronizar Base de Datos</button>
        </div></div>

        <div class="editor-card mt-1"><div class="editor-card-header"><h3>Configuración de Inteligencia Artificial</h3></div><div class="editor-card-body">
        <p style="color:#94A3B8;margin-bottom:1.5rem;">La llave de la IA es requerida para el Asesor Experto en la nueva pestaña y el chatbot público.</p>
        <div class="form-group"><label>API KEY de Google Gemini</label><input type="password" id="cfg-apikey" value="${key}"></div>
        <button class="btn-save" id="cfg-save-btn">Guardar Llave</button>
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
    }

    // ===== IA CHAT EXPERT =====
    function iaChatHTML() {
        return `<div class="editor-card" style="height: calc(100vh - 120px); display:flex; flex-direction:column;">
            <div class="editor-card-header"><h3>Asistente Experto IA (Vida Eterna)</h3></div>
            <div class="editor-card-body" style="flex:1; display:flex; flex-direction:column; padding-bottom:5px;">
                <p style="color:#94A3B8;margin-bottom:1rem; font-size:0.9rem;">Consulta con la IA integradamente cómo usar tu página web o redactar contenido profesional (cotizaciones, correos, etc).</p>
                <div id="full-chat-history" style="flex:1; overflow-y:auto; background:rgba(0,0,0,0.2); border-radius:8px; padding:1.5rem; margin-bottom:1rem; border:1px solid #1A7A5C;">
                    <p style="background:var(--green-900); padding:1rem; border-radius:8px; display:inline-block; max-width:80%; margin-bottom:1rem;"><strong>🤖 Inteligencia Artificial:</strong><br>¡Hola equipo! Soy tu asistente experto. Conozco todos los servicios y visión de Vida Eterna. ¿En qué los puedo asesorar hoy para administrar su sistema web?</p>
                </div>
                <div style="display:flex; gap:0.5rem; background:rgba(255,255,255,0.05); padding:0.5rem; border-radius:8px;">
                    <input type="text" id="full-chat-input" placeholder="Pregunta algo al asesor..." style="flex:1; background:transparent; border:none; color:white; outline:none; padding:0.5rem;" autocomplete="off">
                    <button class="btn-primary" id="full-chat-btn"><i class="ph-fill ph-paper-plane-right"></i> Enviar Consulta</button>
                </div>
            </div>
        </div>`;
    }

    function bindIaChat() {
        const inp = document.getElementById('full-chat-input');
        const btn = document.getElementById('full-chat-btn');
        
        const sendAction = async () => {
            const key = localStorage.getItem('ve_gemini_key');
            if(!key) {
                alert('No has configurado la API Key de Google Gemini. Ve a Configuración e ingresa la llave primero.');
                document.querySelector('[data-section="config"]').click();
                return;
            }
            const prompt = inp.value; if(!prompt) return;
            const box = document.getElementById('full-chat-history');
            
            box.innerHTML += `<div style="text-align:right;"><p style="background:var(--color-primary); color:white; padding:1rem; border-radius:8px; display:inline-block; max-width:80%; margin-bottom:1rem; margin-top:0.5rem;"><strong>Tú:</strong><br>${esc(prompt)}</p></div>`;
            inp.value = '';
            box.scrollTop = box.scrollHeight;
            
            const loaderId = 'loader-'+Date.now();
            box.innerHTML += `<div id="${loaderId}"><p style="background:var(--green-900); color:white; padding:1rem; border-radius:8px; display:inline-block; max-width:80%; margin-bottom:1rem;"><strong>🤖 IA:</strong><br>⏳ Buscando respuesta magistral...</p></div>`;
            box.scrollTop = box.scrollHeight;
    
            try {
                const req = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({contents: [{parts: [{text: "Eres el experto principal en la administración de Corporativo Vida Eterna (Servicios funerarios de lujo en Celaya). Responde de forma muy profesional a esta consulta del operador web: " + prompt}]}]})
                });
                const data = await req.json();
                document.getElementById(loaderId).innerHTML = `<p style="background:var(--green-900); padding:1rem; border-radius:8px; display:inline-block; max-width:80%; margin-bottom:1rem;"><strong>🤖 Inteligencia Artificial:</strong><br>${data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>')}</p>`;
            } catch(e) { document.getElementById(loaderId).innerHTML = `<p style="background:#dc2626; padding:1rem; border-radius:8px; display:inline-block; max-width:80%; margin-bottom:1rem;">❌ Falló la consulta. Verifica tu conexión a internet o tu llave de API.</p>`; }
            box.scrollTop = box.scrollHeight;
        };

        btn.addEventListener('click', sendAction);
        inp.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAction(); });
    }

    function iaImagesHTML() {
        return `<div class="editor-card"><div class="editor-card-header"><h3>Nano Banana (Generador de Imágenes IA)</h3></div><div class="editor-card-body">
        <p style="color:#94A3B8;margin-bottom:1rem;">Describe lo que quieres ver y la IA fabricará una fotografía libre de derechos para que uses en tus banners de sucursales o fondo general (escribe la petición preferentemente en inglés para mejores resultados fotográficos o di "fotorealista").</p>
        <div class="form-group"><input type="text" id="ia-img-prompt" placeholder="Ej: Elegant funeral floral arrangement with white roses, dark cinematic background, hyperrealistic" style="width:100%; padding:0.75rem;"></div>
        <button class="btn-save mt-1" id="ia-img-generate-btn" style="width:100%;"><i class="ph ph-magic-wand"></i> Generar Magia con Nano Banana</button>
        <div id="ia-img-result" style="margin-top:2rem; text-align:center;"></div>
        </div></div>`;
    }

    function bindIaImages() {
        document.getElementById('ia-img-generate-btn').addEventListener('click', () => {
            const prompt = document.getElementById('ia-img-prompt').value;
            if(!prompt) return alert('Por favor, ingresa una descripción para dibujar.');
            const resBox = document.getElementById('ia-img-result');
            resBox.innerHTML = '<p>🔮 Generando visión del futuro, un momento...</p>';
            
            // Pollinations allows straight GET mapping!
            const seed = Math.floor(Math.random() * 100000);
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}`;
            
            const img = new Image();
            img.onload = () => {
                resBox.innerHTML = `
                    <div style="position:relative; display:inline-block; border:1px solid #334155; padding:1rem; border-radius:12px; background:rgba(0,0,0,0.2);">
                        <img src="${url}" id="nano-latest-img" crossorigin="anonymous" style="max-width:100%; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.5);">
                        <div style="margin-top:1.5rem; display:flex; gap:1rem; justify-content:center;">
                            <a href="${url}" target="_blank" class="btn-primary" download><i class="ph ph-download"></i> Cargar Original Completa</a>
                            <button class="btn-save" id="btn-save-nano-gal"><i class="ph ph-images"></i> Enviar a Galería Media</button>
                        </div>
                    </div>`;
                
                document.getElementById('btn-save-nano-gal').addEventListener('click', async () => {
                    toast('Convirtiendo fotografía... no cierres la pantalla.');
                    try {
                        const response = await fetch(url);
                        const blob = await response.blob();
                        const b64 = await fileToBase64(blob);
                        const gal = getArray('ve_gallery', []);
                        gal.unshift(b64);
                        saveArray('ve_gallery', gal);
                        updateGalleryModal();
                        toast('¡Arte guardado en la Galería Multimedia!');
                    } catch(e) { toast('Error de seguridad del navegador al codificar local, guarda la imagen a tu computadora e impórtala.'); }
                });
            };
            img.onerror = () => { resBox.innerHTML = '<p>Ooops, error al conectar el motor Nano Banana. Verifica conexión a red.</p>'; };
            img.src = url;
        });
    }

    function heroHTML(c,imgs) { return formWrapper('hero', `${imgUploadZone('hero','Imagen de Fondo (O arrastra desde Galería/Descargas)',imgs.hero)}<div class="form-group"><label>Subtítulo</label><input type="text" name="hero_subtitle" value="${esc(c.hero_subtitle)}"></div><div class="form-group"><label>Título</label><input type="text" name="hero_title" value="${esc(c.hero_title)}"></div>`); }
    function historiaHTML(c,imgs) { return formWrapper('historia', `${imgUploadZone('about','Imagen Nosotros',imgs.about)}<div class="form-group"><label>Título</label><input type="text" name="historia_title" value="${esc(c.historia_title)}"></div><div class="form-group"><label>Párrafo 1</label><textarea name="historia_p1">${esc(c.historia_p1)}</textarea></div>`); }
    function panteonHTML(c,imgs) { return formWrapper('panteon', `${imgUploadZone('panteon','Fondo',imgs.panteon)}<div class="form-group"><label>Título</label><input type="text" name="panteon_title" value="${esc(c.panteon_title)}"></div><div class="form-group"><label>Mensaje Preventa</label><input type="text" name="panteon_preventa" value="${esc(c.panteon_preventa)}"></div>`); }
    function contactoHTML(c) { return formWrapper('contacto', `<div class="form-row"><div class="form-group"><label>Teléfono Base</label><input type="text" name="footer_phone" value="${esc(c.footer_phone)}"></div></div><div class="form-row"><div class="form-group"><label>Link Facebook</label><input type="text" name="social_facebook" value="${esc(c.social_facebook)}"></div></div>`); }
    function chatbotHTML(c) { return formWrapper('chatbot', `<p style="color:#94A3B8;margin-bottom:1rem;">El chatbot público incrustado en la web se alimenta ahora automáticamente de tu API Key guardada en la pestaña Configuración.</p>`); }
    
    function leadsHTML() {
        const leads = JSON.parse(localStorage.getItem('ve_leads')||'[]');
        const rows = leads.map((l,i) => `<tr><td>${i+1}</td><td>${esc(l.email)}</td><td>${new Date(l.date).toLocaleString('es-MX')}</td></tr>`).join('');
        return `<div class="editor-card"><div class="editor-card-header"><h3>Leads Panteón Preventa</h3></div><div class="editor-card-body"><table class="leads-table"><thead><tr><th>#</th><th>Correo</th><th>Fecha de Envío</th></tr></thead><tbody>${rows||'<tr><td colspan="3" style="text-align:center;">No hay correos todavía</td></tr>'}</tbody></table></div></div>`;
    }

    function formWrapper(title, inner) {
        return `<div class="editor-card"><div class="editor-card-header"><h3 style="text-transform:capitalize">${title}</h3></div><div class="editor-card-body"><form id="section-form">${inner}<div class="btn-group"><button type="submit" class="btn-save">Publicar Ajuste</button></div></form></div></div>`;
    }

    function bindForm(sec) {
        const f = document.getElementById('section-form');
        f.addEventListener('submit', e => { e.preventDefault(); const d = {}; new FormData(f).forEach((v,k) => d[k]=v); saveC(d); toast('Ajuste Público Guardado'); });
    }
})();
