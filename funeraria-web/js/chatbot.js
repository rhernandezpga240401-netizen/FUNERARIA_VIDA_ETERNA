// ============================================
// CORPORATIVO VIDA ETERNA — Chatbot V3 (Gemini AI)
// ============================================
(function() {
    'use strict';
    const toggle = document.getElementById('chatbot-toggle');
    const win = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const msgs = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input-field');
    const sendBtn = document.getElementById('chatbot-send');
    const sugBox = document.getElementById('chatbot-suggestions');

    let isOpen = false;
    let chatHistory = [];

    const SYS_PROMPT = `Eres el asistente virtual empático y profesional de "Corporativo Vida Eterna", una funeraria premium en Celaya, Villagrán y Valle de Santiago.
Tus servicios incluyen: Servicios funerarios tradicionales, Planes de Previsión a futuro, Panteón Jardín (preventa de lotes y capillas privados), Acompañamiento Tanatológico y Paquetes Empresariales.
REGLA DE ORO: Eres muy amable. Respondes brevemente y al grano.
REGLA DE CONVERSIÓN A VENTAS: Si el usuario te pide un PRECIO, una COTIZACIÓN ESPECÍFICA, o dice que tiene una URGENCIA (alguien falleció), DEBES detenerte y ofrecer que un asesor humano lo atienda de inmediato. 
Para hacer esto, SIEMPRE DEBES generar EXACTAMENTE este formato de enlace en tu respuesta para enviarlos a WhatsApp:
[Contactar Asesor por WhatsApp](https://wa.me/5214611171093?text=Hola,%20me%20interesa%20saber%20sobre%20[EL_TEMA_QUE_PREGUNTO_EL_USUARIO])
Reemplaza [EL_TEMA_QUE_PREGUNTO_EL_USUARIO] con un resumen corto de su duda (ej: planes_de_prevision). No uses asteriscos u otros formatos raros para el enlace, usa Markdown puro.`;

    function addMsg(text, isBot) {
        const div = document.createElement('div');
        div.className = `message ${isBot ? 'msg-bot' : 'msg-user'}`;
        
        // Parse markdown links to nice HTML buttons
        let parsedText = text.replace(/\[([^\]]+)\]\((https:\/\/wa\.me\/[^\)]+)\)/g, '<a href="$2" target="_blank" class="action-btn" style="margin-top:0.5rem;text-decoration:none;"><i class="ph ph-whatsapp-logo"></i> $1</a>');
        // Parse bold
        parsedText = parsedText.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
        // Parse newlines
        parsedText = parsedText.replace(/\n/g,'<br>');

        div.innerHTML = parsedText;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    async function sendToGemini(userText) {
        // En un entorno de producción seguro sin DB, esta llave debería venir de un servidor (Vercel Serverless).
        // Para esta maqueta 100% estática local, leemos la llave configurada directamente en localStorage por el administrador.
        const apiKey = localStorage.getItem('ve_gemini_key');
        
        if (!apiKey) {
            return `Lo siento, el asistente de inteligencia artificial no está configurado. El administrador del sitio debe ingresar su API Key desde el panel de control. Si tienes urgencia por favor haz clic aquí: 
[Hablar por WhatsApp](https://wa.me/5214611171093?text=Hola,%20tengo%20una%20duda:%20${encodeURIComponent(userText)})`;
        }

        chatHistory.push({ role: "user", parts: [{ text: userText }] });

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SYS_PROMPT }] },
                    contents: chatHistory,
                    generationConfig: { maxOutputTokens: 250, temperature: 0.4 }
                })
            });

            if(!response.ok) throw new Error('API Error');

            const data = await response.json();
            const botReply = data.candidates[0].content.parts[0].text;
            
            chatHistory.push({ role: "model", parts: [{ text: botReply }] });
            return botReply;

        } catch (error) {
            console.error(error);
            chatHistory.pop(); // Remove user message if failed
            return `Ocurrió un error de conexión. Por favor contáctanos directamente: [Enviar WhatsApp](https://wa.me/5214611171093?text=Hola,%20${encodeURIComponent(userText)})`;
        }
    }

    async function send(text) {
        if (!text.trim()) return;
        addMsg(text, false);
        input.value = '';
        sugBox.style.display = 'none';

        // Taping indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message msg-bot';
        typingDiv.innerHTML = '<i class="ph ph-dots-three" style="font-size:1.5rem;animation:pulse 1s infinite alternate;"></i>';
        msgs.appendChild(typingDiv);
        msgs.scrollTop = msgs.scrollHeight;

        const reply = await sendToGemini(text);
        
        msgs.removeChild(typingDiv);
        addMsg(reply, true);
    }

    // Init
    toggle.addEventListener('click', () => {
        isOpen = !isOpen;
        win.classList.toggle('open', isOpen);
        if (isOpen && msgs.children.length === 0) {
            const firstMsg = '¡Hola! 👋 Bienvenido a **Corporativo Vida Eterna**. Soy el asistente de Inteligencia Artificial de la funeraria.\n\nEstoy aquí para resolver tus dudas sobre planes de previsión, nuestros panteones o asistencia inmediata. ¿En qué puedo ayudarte?';
            setTimeout(() => addMsg(firstMsg, true), 300);
        }
    });

    closeBtn.addEventListener('click', () => { isOpen = false; win.classList.remove('open'); });
    sendBtn.addEventListener('click', () => send(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(input.value); });
    
    sugBox.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => send(btn.dataset.msg));
    });
})();
