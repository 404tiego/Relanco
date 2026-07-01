(function () {
  'use strict';

  const API_BASE = 'https://03fa9b82-b406-4358-a781-aca27a246b51-00-2l3tqh8rqx12t.worf.replit.dev';
  const BTN_ID = 'relanco-ia-btn';

  let hasToken = null; // null = pas encore vérifié
  let btnEl = null;

  // ── 1. Vérifier le token au démarrage ──────────────────────────────
  chrome.storage.local.get('relanco_token').then(({ relanco_token }) => {
    hasToken = !!relanco_token;
  });

  // ── 2. Surveiller le DOM avec MutationObserver ─────────────────────
  const observer = new MutationObserver(() => {
    const isLBC = location.hostname.includes('leboncoin.fr');
    const isLC  = location.hostname.includes('lacentrale.fr');
    if (!isLBC && !isLC) return;

    // LeBonCoin — messagerie
    if (isLBC) {
      const composer = document.querySelector('[data-testid="message-composer"], .message-composer, [class*="message-composer"]');
      if (composer && !composer.querySelector('#' + BTN_ID)) {
        injectButton(composer);
      }
      return;
    }

    // La Centrale — messages
    if (isLC) {
      const composer = document.querySelector('[class*="message-composer"], [class*="reply-area"], form textarea');
      if (composer) {
        const parent = composer.closest('form, [class*="message"], [class*="reply"]') || composer.parentElement;
        if (parent && !parent.querySelector('#' + BTN_ID)) {
          injectButton(parent);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // ── 3. Injecter le bouton ──────────────────────────────────────────
  function injectButton(container) {
    if (btnEl) btnEl.remove();

    btnEl = document.createElement('button');
    btnEl.id = BTN_ID;
    btnEl.className = 'relanco-btn';
    btnEl.innerHTML = hasToken === false
      ? '🔑 Connectez-vous à Relanco'
      : '⚡ Répondre avec l\'IA';

    btnEl.addEventListener('click', (event) => {
      // Reject synthetic clicks — page scripts cannot set isTrusted=true
      if (!event.isTrusted) return;
      handleClick();
    });

    // Insérer juste au-dessus du champ de réponse
    const textarea = container.querySelector('textarea, [contenteditable="true"]');
    if (textarea) {
      textarea.parentElement.insertBefore(btnEl, textarea);
    } else {
      container.insertBefore(btnEl, container.firstChild);
    }
  }

  // ── 4. Clic sur le bouton ──────────────────────────────────────────
  async function handleClick() {
    if (!btnEl) return;

    // Vérifier token
    const { relanco_token: token } = await chrome.storage.local.get('relanco_token');
    if (!token) {
      btnEl.textContent = '🔑 Connectez-vous à Relanco';
      hasToken = false;
      return;
    }
    hasToken = true;

    // Extraire le dernier message reçu
    const dernierMessage = extractLastIncomingMessage();
    if (!dernierMessage) {
      btnEl.textContent = '❌ Aucun message détecté';
      setTimeout(() => { btnEl.textContent = '⚡ Répondre avec l\'IA'; }, 2000);
      return;
    }

    // Extraire le titre de l'annonce
    const titreAnnonce = extractAdTitle();

    // État chargement
    btnEl.classList.add('loading');
    btnEl.textContent = '⏳ Génération...';

    try {
      const res = await fetch(API_BASE + '/api/agent/qualify-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          message_lead: dernierMessage,
          vehicule: titreAnnonce,
          source: location.hostname.includes('leboncoin') ? 'LeBonCoin' : 'LaCentrale',
          canal: 'MESSAGE',
          historique: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur ' + res.status);
      }

      const data = await res.json();
      const reply = data.reply || data.response || '';

      // Coller dans le champ texte
      const input = findTextInput();
      if (input) {
        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
          input.value = reply;
        } else if (input.isContentEditable) {
          input.innerText = reply;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }

      // État succès
      btnEl.classList.remove('loading');
      btnEl.classList.add('success');
      btnEl.textContent = '✅ Réponse prête — modifiez si besoin';

      // Reset après 4s
      setTimeout(() => {
        btnEl.classList.remove('success');
        btnEl.textContent = '⚡ Répondre avec l\'IA';
      }, 4000);

    } catch (err) {
      btnEl.classList.remove('loading');
      btnEl.textContent = '❌ ' + (err.message || 'Erreur');
      setTimeout(() => { btnEl.textContent = '⚡ Répondre avec l\'IA'; }, 3000);
    }
  }

  // ── 5. Extraire le dernier message reçu ───────────────────────────
  function extractLastIncomingMessage() {
    const isLBC = location.hostname.includes('leboncoin.fr');
    let messages = [];

    if (isLBC) {
      // LeBonCoin — messages entrants (pas envoyés par nous)
      const bubbles = document.querySelectorAll(
        '[data-testid="message-received"], [class*="message-received"], [class*="message--received"], [class*="message-incoming"]'
      );
      bubbles.forEach(b => {
        const text = b.innerText?.trim();
        if (text) messages.push(text);
      });
    } else {
      // La Centrale
      const bubbles = document.querySelectorAll(
        '[class*="message-received"], [class*="message-incoming"], [class*="message--other"]'
      );
      bubbles.forEach(b => {
        const text = b.innerText?.trim();
        if (text) messages.push(text);
      });
    }

    return messages.length > 0 ? messages[messages.length - 1] : null;
  }

  // ── 6. Extraire le titre de l'annonce ───────────────────────────────
  function extractAdTitle() {
    const isLBC = location.hostname.includes('leboncoin.fr');

    if (isLBC) {
      // Titre dans la sidebar ou l'en-tête de conversation
      const titleEl = document.querySelector(
        '[data-testid="ad-title"], [class*="ad-title"], [class*="conversation-title"], h1, h2'
      );
      if (titleEl) return titleEl.innerText?.trim();
    } else {
      const titleEl = document.querySelector(
        '[class*="ad-title"], [class*="vehicle-title"], h1, h2'
      );
      if (titleEl) return titleEl.innerText?.trim();
    }
    return null;
  }

  // ── 7. Trouver le champ texte ───────────────────────────────────────
  function findTextInput() {
    return document.querySelector(
      'textarea, [contenteditable="true"], [data-testid="message-input"], [class*="message-input"]'
    );
  }

  // ── 8. Init si déjà chargé ─────────────────────────────────────────
  if (document.readyState !== 'loading') {
    observer.takeRecords();
    // Trigger manual check
    const evt = document.createEvent('Event');
    evt.initEvent('DOMContentLoaded', true, true);
  }
})();
