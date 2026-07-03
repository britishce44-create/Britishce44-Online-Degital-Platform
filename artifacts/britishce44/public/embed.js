/* ─── Britishce44 Platform Embed Script ──────────────
 *  Add this to ANY website to show a platform access button.
 *
 *  Usage:
 *    <script src="https://YOUR_DOMAIN/embed.js" data-mode="redirect"></script>
 *    Options: data-mode="redirect" | data-mode="popup" | data-mode="iframe"
 *             data-position="bottom-right" (default) | "bottom-left"
 * ───────────────────────────────────────────────────── */

(function () {
  'use strict'

  const SCRIPT_SRC = document.currentScript?.getAttribute('src') || ''
  const BASE = SCRIPT_SRC.replace('/embed.js', '').replace('/embed.js?', '') || 'https://platform.lcsyemen.com'
  const MODE = document.currentScript?.getAttribute('data-mode') || 'redirect'
  const POSITION = document.currentScript?.getAttribute('data-position') || 'bottom-right'

  const STYLES = `
    .b44-fab {
      position: fixed;
      ${POSITION === 'bottom-right' ? 'right: 24px;' : 'left: 24px;'}
      bottom: 24px;
      z-index: 999999;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #D4A017, #F5C518);
      box-shadow: 0 4px 20px rgba(212,160,23,0.4);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Inter, -apple-system, sans-serif;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .b44-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(212,160,23,0.55);
    }
    .b44-fab span {
      font-size: 22px;
      font-weight: 900;
      color: #0a1a4a;
    }
    .b44-fab-label {
      position: fixed;
      ${POSITION === 'bottom-right' ? 'right: 92px;' : 'left: 92px;'}
      bottom: 36px;
      z-index: 999999;
      background: rgba(10,26,74,0.85);
      backdrop-filter: blur(8px);
      color: #D4A017;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      font-family: Inter, -apple-system, sans-serif;
      border: 1px solid rgba(212,160,23,0.2);
      pointer-events: none;
      white-space: nowrap;
    }
    .b44-menu {
      position: fixed;
      ${POSITION === 'bottom-right' ? 'right: 24px;' : 'left: 24px;'}
      bottom: 96px;
      z-index: 999998;
      background: linear-gradient(135deg, #0a1a4a, #1e3a8a);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 8px;
      min-width: 220px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
      font-family: Inter, -apple-system, sans-serif;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }
    .b44-menu.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .b44-menu-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: white;
      font-size: 13px;
      font-weight: 700;
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
    }
    .b44-menu-btn:hover { background: rgba(255,255,255,0.05); }
    .b44-menu-btn .sub {
      font-size: 10px;
      color: rgba(255,255,255,0.4);
      font-weight: 500;
    }
    .b44-menu-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 4px 8px;
    }
    .b44-menu-footer {
      padding: 8px 16px;
      font-size: 9px;
      color: rgba(255,255,255,0.25);
      text-align: center;
    }
  `

  /* Inject styles */
  const styleEl = document.createElement('style')
  styleEl.textContent = STYLES
  document.head.appendChild(styleEl)

  /* Create button */
  const btn = document.createElement('button')
  btn.className = 'b44-fab'
  btn.innerHTML = '<span>B44</span>'
  btn.setAttribute('aria-label', 'Britishce44 Platform')
  document.body.appendChild(btn)

  /* Create label */
  const label = document.createElement('div')
  label.className = 'b44-fab-label'
  label.textContent = 'Platform Access'
  document.body.appendChild(label)

  /* Create menu */
  const menu = document.createElement('div')
  menu.className = 'b44-menu'
  menu.innerHTML = `
    <button class="b44-menu-btn" data-action="student">
      <span style="font-size:20px">🎓</span>
      <div><div>Student Login</div><div class="sub">Study, quizzes, classes</div></div>
    </button>
    <button class="b44-menu-btn" data-action="teacher">
      <span style="font-size:20px">👨‍🏫</span>
      <div><div>Teacher Login</div><div class="sub">Manage classes, evaluations</div></div>
    </button>
    <button class="b44-menu-btn" data-action="newcomer">
      <span style="font-size:20px">👤</span>
      <div><div>New Student Application</div><div class="sub">Apply & meet the supervisor</div></div>
    </button>
    <div class="b44-menu-divider"></div>
    <div class="b44-menu-footer">Britishce44 Online Digital Platform</div>
  `
  document.body.appendChild(menu)

  let isOpen = false

  btn.addEventListener('click', () => {
    isOpen = !isOpen
    menu.classList.toggle('open', isOpen)
    label.style.display = isOpen ? 'none' : 'block'
  })

  /* Handle menu clicks */
  menu.querySelectorAll('.b44-menu-btn').forEach(el => {
    el.addEventListener('click', () => {
      const action = el.getAttribute('data-action')
      isOpen = false
      menu.classList.remove('open')
      label.style.display = 'block'

      const targetUrl = MODE === 'redirect' ? BASE : `${BASE}?entry=${action}`
      if (MODE === 'redirect') {
        window.location.href = targetUrl
      } else if (MODE === 'popup') {
        window.open(targetUrl, 'britishce44', 'width=1280,height=800,menubar=no,toolbar=no,location=no')
      } else if (MODE === 'iframe') {
        let iframe = document.getElementById('b44-iframe')
        if (!iframe) {
          iframe = document.createElement('iframe')
          iframe.id = 'b44-iframe'
          iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:999999;background:#080f22'
          document.body.appendChild(iframe)
        }
        iframe.src = targetUrl
      }
    })
  })

  /* Close menu on click outside */
  document.addEventListener('click', (e) => {
    if (isOpen && !menu.contains(e.target) && e.target !== btn) {
      isOpen = false
      menu.classList.remove('open')
      label.style.display = 'block'
    }
  })
})()
