// ============================================
// CORPORATIVO VIDA ETERNA — Main Logic v4 (Firebase Realtime + Dynamic Images)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('active'); });
        navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('active'); }));
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const id = link.getAttribute('href'); if (id === '#') return;
            const target = document.querySelector(id);
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    const pForm = document.getElementById('preventa-form');
    if (pForm) pForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('preventa-email').value;
        const leads = JSON.parse(localStorage.getItem('ve_leads') || '[]');
        leads.push({ email, date: new Date().toISOString() });
        localStorage.setItem('ve_leads', JSON.stringify(leads));
        
        // Try pushing to Firebase
        try {
            const fbCfg = localStorage.getItem('ve_firebase_config');
            if(fbCfg && window.firebase) firebase.database().ref('ve_leads').set(leads);
        } catch(e){}

        const btn = pForm.querySelector('button');
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-check-circle"></i> ¡Registrado!';
        btn.style.background = '#10B981';
        document.getElementById('preventa-email').value = '';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 3000);
    });

    loadAdminImages();
    loadDynamicText();
    renderDynamicGrids();
    initScrollReveal();
    initFirebaseListener();
});

function initFirebaseListener() {
    const configStr = localStorage.getItem('ve_firebase_config');
    if(configStr && window.firebase) {
        try {
            const config = JSON.parse(configStr);
            if(!firebase.apps.length) firebase.initializeApp(config);
            const db = firebase.database();
            
            db.ref('ve_content').on('value', snap => {
                if(snap.exists()) { localStorage.setItem('ve_content', JSON.stringify(snap.val())); loadDynamicText(); }
            });
            db.ref('ve_images').on('value', snap => {
                if(snap.exists()) { localStorage.setItem('ve_images', JSON.stringify(snap.val())); loadAdminImages(); }
            });
            db.ref('ve_arrays').on('value', snap => {
                if(snap.exists()) {
                    const data = snap.val();
                    for(const k in data) localStorage.setItem(k, JSON.stringify(data[k]));
                    renderDynamicGrids();
                }
            });
        } catch(e) { console.error('Error escuchando Firebase', e); }
    }
}

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); revealObs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(el => revealObs.observe(el));

    const counters = document.querySelectorAll('.stat-number[data-count]');
    const cObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const el = e.target, target = parseInt(el.dataset.count);
                let curr = 0; const inc = target / 30;
                const t = setInterval(() => { curr += inc; if (curr >= target) { el.textContent = target.toLocaleString(); clearInterval(t); } else { el.textContent = Math.floor(curr).toLocaleString(); } }, 30);
                cObs.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(el => cObs.observe(el));
}

function loadDynamicText() {
    const c = JSON.parse(localStorage.getItem('ve_content') || '{}');
    if (!Object.keys(c).length) return;
    Object.entries(c).forEach(([k, v]) => {
        const el = document.querySelector(`[data-editable="${k}"]`);
        if (el) { if (k.includes('title') || k.includes('name')) el.innerHTML = v; else el.textContent = v; }
    });
    
    // Social Links mapping
    const fb = document.getElementById('social_fb'); if(fb && c.social_facebook) fb.href = c.social_facebook;
    const ig = document.getElementById('social_ig'); if(ig && c.social_instagram) ig.href = c.social_instagram;
    const tk = document.getElementById('social_tk'); if(tk && c.social_tiktok) tk.href = c.social_tiktok;
}

function loadAdminImages() {
    const images = JSON.parse(localStorage.getItem('ve_images') || '{}');
    if (images.hero) document.querySelector('.hero').style.backgroundImage = `url(${images.hero})`;
    
    // Updated Panteon target ID for new layout
    const panteonTarget = document.getElementById('panteon-img-target');
    if (images.panteon && panteonTarget) panteonTarget.style.backgroundImage = `url(${images.panteon})`;
    else if (images.panteon) document.querySelector('.panteon').style.backgroundImage = `url(${images.panteon})`;

    if (images.about) {
        const fill = document.getElementById('about-image');
        if (fill) fill.style.backgroundImage = `url(${images.about})`;
    }
    
    // Logo processing
    if (images.logo) {
        const navLogo = document.getElementById('nav-dynamic-logo');
        if (navLogo) navLogo.innerHTML = `<img src="${images.logo}" style="height:40px; width:auto; border-radius:4px;">`;
        const footerLogo = document.getElementById('footer-dynamic-logo');
        if (footerLogo) footerLogo.innerHTML = `<img src="${images.logo}" style="height:40px; width:auto; border-radius:4px; filter:brightness(0) invert(1);">`;
    }
}

// V4 DYNAMIC DATA RENDERING with Base64 Support
function renderDynamicGrids() {
    // defaults
    const defServicios = [
        { name: "Servicios Funerarios", desc: "Velación, cremación, inhumación y traslados.", icon: "ph-flower-tulip" },
        { name: "Planes de Previsión", desc: "Congela precios y evita gastos inesperados.", icon: "ph-shield-check" },
        { name: "Tanatóloga", desc: "Acompañamiento profesional en el duelo.", icon: "ph-heart" },
        { name: "Empresariales", desc: "Beneficios para tus colaboradores.", icon: "ph-buildings" }
    ];
    const defUbicaciones = [
        { name: "Sucursal Celaya", address: "Centro, Celaya, Gto.", mapUrl: "#" },
        { name: "Sucursal Villagrán", address: "Centro, Villagrán, Gto.", mapUrl: "#" }
    ];
    const defEventos = [];
    const defObituarios = [];
    const defTestimonios = [
        { text: "Atención impecable en momentos difíciles.", author: "Familia Martínez", date: "2025" }
    ];
    const defAlianzas = [
        { name: "Hospital Central", icon: "ph-hospital" },
        { name: "Clínica San Juan", icon: "ph-first-aid-kit" }
    ];

    const loadArray = (key, defaultArr) => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultArr;
    }

    const servicios = loadArray('ve_servicios', defServicios);
    const ubicaciones = loadArray('ve_sucursales', defUbicaciones);
    const eventos = loadArray('ve_events', defEventos);
    const obituarios = loadArray('ve_obituarios', defObituarios);
    const testimonios = loadArray('ve_testimonios', defTestimonios);
    const alianzas = loadArray('ve_alianzas', defAlianzas);
    
    // Update stat counters
    const cSucursales = document.getElementById('sucursales-count');
    if(cSucursales) cSucursales.setAttribute('data-count', ubicaciones.length);

    // Render Servicios
    const gridS = document.getElementById('servicios-grid');
    if (gridS) {
        gridS.innerHTML = servicios.map((s,i) => {
            const iconHtml = (s.icon && s.icon.startsWith('data:image')) ? `<img src="${s.icon}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : `<i class="ph ${s.icon || 'ph-check-circle'}"></i>`;
            return `
            <div class="service-card reveal">
                <div class="service-icon" style="overflow:hidden; display:flex; justify-content:center; align-items:center; padding:${s.icon && s.icon.startsWith('data:image')?'0':'auto'};">${iconHtml}</div>
                <h3>${s.name}</h3>
                <p>${s.desc}</p>
            </div>`;
        }).join('');
    }

    // Render Ubicaciones
    const gridU = document.getElementById('ubicaciones-grid');
    if (gridU) {
        const c = JSON.parse(localStorage.getItem('ve_content') || '{}');
        const phone = c.footer_phone || '5214611171093';
        gridU.innerHTML = ubicaciones.map((u,i) => {
            const locImg = u.icon || '';
            const imgHTML = (locImg && locImg.startsWith('data:image')) ? `<img src="${locImg}" style="width:100%;height:100%;object-fit:cover;">` : `<i class="ph ph-map-pin" style="font-size:3rem;color:var(--color-primary);opacity:0.4;"></i>`;
            return `
            <div class="location-card reveal">
                <div class="location-img" style="background:var(--green-100);display:flex;align-items:center;justify-content:center;">${imgHTML}</div>
                <div class="location-body">
                    <h3>${u.name}</h3>
                    <p>${u.address}</p>
                    <div class="location-phone"><i class="ph ph-phone"></i> ${phone}</div>
                    <a href="${u.mapUrl || '#'}" target="_blank" class="link-arrow">Ver en Mapa <i class="ph ph-arrow-right"></i></a>
                </div>
            </div>`;
        }).join('');
    }

    // Render Alianzas
    const gridA = document.getElementById('alianzas-grid');
    if (gridA && alianzas.length > 0) {
        gridA.innerHTML = alianzas.map(a => {
            const iconHtml = (a.icon && a.icon.startsWith('data:image')) ? `<img src="${a.icon}" style="max-height:50px;">` : `<i class="ph ${a.icon||'ph-handshake'}"></i>`;
            return `<div class="alliance-box">${iconHtml}<span>${a.name}</span></div>`;
        }).join('');
    } else if (gridA) { gridA.innerHTML = '<p style="color:var(--color-text-light);">No hay alianzas registradas.</p>'; }

    // Render Testimonios
    const gridT = document.getElementById('testimonios-grid');
    if (gridT && testimonios.length > 0) {
        gridT.innerHTML = testimonios.map(t => `
            <div class="testimonial-card reveal">
                <div class="stars"><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i><i class="ph-fill ph-star"></i></div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-footer"><div class="avatar-circle"><i class="ph-fill ph-user"></i></div><div><h4 class="testimonial-author">${t.author}</h4><span class="testimonial-date">${t.date}</span></div></div>
            </div>`).join('');
    }

    // Render Eventos
    const gridE = document.getElementById('eventos-grid');
    if (gridE) {
        if(eventos.length === 0) gridE.parentElement.style.display = 'none';
        else {
            gridE.parentElement.style.display = 'block';
            gridE.innerHTML = eventos.map(ev => {
                const badge = ev.type === 'zoom' ? '<span class="event-type-badge badge-zoom"><i class="ph ph-video-camera"></i> Zoom</span>' : '<span class="event-type-badge badge-presencial"><i class="ph ph-map-pin"></i> Presencial</span>';
                return `
                <div class="event-card reveal">
                    <div class="event-img" style="position:relative;">
                        ${badge}
                        ${(ev.image && ev.image.startsWith('data:image')) ? `<img src="${ev.image}" alt="">` : '<i class="ph ph-calendar-blank placeholder-icon"></i>'}
                    </div>
                    <div class="event-body" style="padding-bottom:0;">
                        <span class="event-date"><i class="ph ph-calendar"></i> ${ev.date} — ${ev.time}</span>
                        <h3>${ev.title}</h3>
                        <p style="margin-bottom:1rem;">${ev.description}</p>
                    </div>
                    <a href="${ev.locationUrl || '#'}" target="_blank" class="action-btn">${ev.type === 'zoom' ? 'Unirse a la llamada' : 'Ver Ubicación'}</a>
                </div>`;
            }).join('');
        }
    }

    // Render Obituarios
    const gridO = document.getElementById('obituarios-grid');
    if (gridO) {
        if(obituarios.length === 0) gridO.parentElement.style.display = 'none';
        else {
            gridO.parentElement.style.display = 'block';
            gridO.innerHTML = obituarios.map(ob => {
                const img = (ob.image && ob.image.startsWith('data:image')) ? `<img src="${ob.image}" class="obituary-img" style="border:none;">` : `<div class="obituary-img"><i class="ph-fill ph-user"></i></div>`;
                return `
                <div class="obituary-card reveal">
                    ${img}
                    <h3 class="obituary-name">${ob.name}</h3>
                    <div class="obituary-meta"><i class="ph ph-church"></i> ${ob.sala}</div>
                    <div class="obituary-meta" style="margin-bottom:1rem;"><i class="ph ph-clock"></i> ${ob.horario}</div>
                    <button class="action-btn" onclick="window.open('https://wa.me/5214611171093?text=Hola,%20quisiera%20enviar%20flores%20a%20la%20sala%20de%20${encodeURIComponent(ob.name)}')"><i class="ph ph-flower-lotus"></i> Enviar Flores</button>
                </div>`;
            }).join('');
        }
    }
}
