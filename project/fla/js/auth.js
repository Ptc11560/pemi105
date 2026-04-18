/**
 * auth.js — Flutter & Learn Academy
 * Handles Login & Register logic for index.html
 * Depends on: db.js
 */

// ============================================================
//  UI STATE
// ============================================================
let _currentRole = 'student'; // 'student' | 'admin'
let _currentTab  = 'login';   // 'login'   | 'register'

// ============================================================
//  INIT — runs when DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // If user already has a valid session, redirect immediately
  const user = DB.Session.getUser();
  if (user) {
    redirectUser(user);
    return;
  }

  // Wire up Enter key on inputs
  ['login-email', 'login-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') Auth.login();
    });
  });
  ['reg-name', 'reg-email', 'reg-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') Auth.register();
    });
  });
});

// ============================================================
//  REDIRECT HELPER
// ============================================================
function redirectUser(user) {
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'student.html';
  }
}

// ============================================================
//  MAIN AUTH OBJECT
// ============================================================
const Auth = {

  // ---------- Switch role pill ----------
  setRole(role) {
    _currentRole = role;
    const pills = {
      student: document.getElementById('role-student'),
      admin:   document.getElementById('role-admin'),
    };
    Object.entries(pills).forEach(([r, el]) => {
      if (!el) return;
      if (r === role) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  },

  // ---------- Switch Login / Register tab ----------
  showTab(tab) {
    _currentTab = tab;
    const loginForm  = document.getElementById('login-form');
    const regForm    = document.getElementById('register-form');
    const tabLogin   = document.getElementById('tab-login');
    const tabReg     = document.getElementById('tab-register');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleBtn  = document.getElementById('auth-toggle-btn');

    if (tab === 'login') {
      loginForm?.classList.remove('hidden');
      regForm?.classList.add('hidden');
      tabLogin?.classList.add('active');
      tabReg?.classList.remove('active');
      if (toggleText) toggleText.textContent = 'นักเรียนใหม่?';
      if (toggleBtn)  toggleBtn.textContent  = 'สร้างบัญชีใหม่';
    } else {
      loginForm?.classList.add('hidden');
      regForm?.classList.remove('hidden');
      tabLogin?.classList.remove('active');
      tabReg?.classList.add('active');
      if (toggleText) toggleText.textContent = 'มีบัญชีแล้ว?';
      if (toggleBtn)  toggleBtn.textContent  = 'เข้าสู่ระบบ';
    }
  },

  toggleTab() {
    Auth.showTab(_currentTab === 'login' ? 'register' : 'login');
  },

  // ---------- Toggle password visibility ----------
  togglePassword(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
    // Swap icon
    const btn = el.parentElement.querySelector('.pwd-toggle-icon');
    if (btn) btn.textContent = el.type === 'password' ? 'visibility' : 'visibility_off';
  },

  // ---------- LOGIN ----------
  login() {
    const email    = document.getElementById('login-email')?.value.trim()   || '';
    const password = document.getElementById('login-password')?.value        || '';

    if (!email || !password) {
      UI.toast('กรุณากรอกอีเมลและรหัสผ่าน', 'error');
      return;
    }

    const user = DB.Users.findByEmail(email);

    if (!user || user.password !== password) {
      UI.toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
      Auth._shake('login-password');
      return;
    }

    // Role mismatch check
    if (_currentRole !== user.role) {
      const expected = user.role === 'admin' ? 'Admin 🛡️' : 'นักเรียน 🎒';
      UI.toast(`บัญชีนี้เป็น ${expected} ไม่ใช่ที่คุณเลือก`, 'error');
      return;
    }

    DB.Session.save(user);
    UI.toast(`ยินดีต้อนรับ, ${user.name}! 🎉`);
    setTimeout(() => redirectUser(user), 700);
  },

  // ---------- REGISTER ----------
  register() {
    const name     = document.getElementById('reg-name')?.value.trim()     || '';
    const email    = document.getElementById('reg-email')?.value.trim()    || '';
    const password = document.getElementById('reg-password')?.value         || '';

    if (!name || !email || !password) {
      UI.toast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
      return;
    }

    if (password.length < 4) {
      UI.toast('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      UI.toast('รูปแบบอีเมลไม่ถูกต้อง', 'error');
      return;
    }

    if (DB.Users.findByEmail(email)) {
      UI.toast('อีเมลนี้ถูกใช้งานแล้ว', 'error');
      return;
    }

    const newUser = DB.Users.create({
      name, email, password,
      role: 'student',
      stars: 0, coins: 0, level: 1, xp: 0,
      completedLessons: [],
      badges: []
    });

    DB.Session.save(newUser);
    UI.toast(`ยินดีต้อนรับ, ${name}! เริ่มเรียนรู้เลย 🚀`);
    setTimeout(() => window.location.href = 'student.html', 700);
  },

  // ---------- Shake animation helper ----------
  _shake(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = 'shake 0.4s ease';
    });
  }
};

// ============================================================
//  UI HELPERS (shared across all pages)
// ============================================================
const UI = {
  // Toast notification
  toast(msg, type = 'success') {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = `toast ${type}`;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3200);
  },

  // Open / close modals
  openModal(id)  { document.getElementById(id)?.classList.add('active'); },
  closeModal(id) { document.getElementById(id)?.classList.remove('active'); },

  // Confirm dialog
  confirm(message, onConfirm) {
    const msgEl  = document.getElementById('confirm-msg');
    const yesBtn = document.getElementById('confirm-yes-btn');
    if (msgEl)  msgEl.textContent = message;
    if (yesBtn) {
      yesBtn.onclick = () => {
        UI.closeModal('confirm-modal');
        onConfirm();
      };
    }
    UI.openModal('confirm-modal');
  }
};

// ============================================================
//  SHAKE KEYFRAME (injected dynamically)
// ============================================================
const _shakeStyle = document.createElement('style');
_shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-8px); }
    40%       { transform: translateX(8px); }
    60%       { transform: translateX(-5px); }
    80%       { transform: translateX(5px); }
  }
`;
document.head.appendChild(_shakeStyle);

// ============================================================
//  CLOSE MODALS ON OVERLAY CLICK
// ============================================================
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});
