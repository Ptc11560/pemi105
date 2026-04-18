/**
 * admin.js — Flutter & Learn Academy
 * All Admin Panel logic: Dashboard, Lessons, Quizzes, Users, Rewards
 * Depends on: db.js, auth.js (for UI helpers)
 */

// ============================================================
//  GUARD — redirect if not logged in as admin
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const user = DB.Session.getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
    return;
  }
  Admin.init(user);
});

// ============================================================
//  ADMIN MODULE
// ============================================================
const Admin = (() => {

  let _currentUser = null;
  let _activeSection = 'dashboard';
  let _lessonEditId = null;
  let _quizEditId   = null;

  // ── Init ──────────────────────────────────────────────────
  function init(user) {
    _currentUser = user;

    // Fill name placeholders
    document.getElementById('admin-greeting')?.innerText && (document.getElementById('admin-greeting').textContent = user.name);
    document.getElementById('admin-name-display') && (document.getElementById('admin-name-display').textContent = user.name);
    document.getElementById('admin-role-label')   && (document.getElementById('admin-role-label').textContent = 'ผู้ดูแลระบบ');

    showSection('dashboard');
  }

  // ── Logout ────────────────────────────────────────────────
  function logout() {
    DB.Session.clear();
    window.location.href = 'index.html';
  }

  // ── Section Switching ─────────────────────────────────────
  function showSection(section) {
    _activeSection = section;

    // Sections
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.getElementById('section-' + section)?.classList.add('active');

    // Sidebar links
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + section)?.classList.add('active');

    // Mobile tab buttons
    document.querySelectorAll('.mobile-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.mobile-tab[data-section="${section}"]`)?.classList.add('active');

    // Load section data
    const loaders = {
      dashboard: loadDashboard,
      lessons:   loadLessons,
      quizzes:   loadQuizzes,
      users:     loadUsers,
      rewards:   loadRewards,
    };
    loaders[section]?.();
  }

  // ── DASHBOARD ─────────────────────────────────────────────
  function loadDashboard() {
    const students = DB.Users.getStudents();
    const lessons  = DB.Lessons.getAll();
    const quizzes  = DB.Quizzes.getAll();

    setText('stat-students', students.length);
    setText('stat-lessons',  lessons.length);
    setText('stat-quizzes',  quizzes.length);

    // Activity feed — last 3 students
    const feed = document.getElementById('admin-activity-feed');
    if (!feed) return;
    if (students.length === 0) {
      feed.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-4">ยังไม่มีนักเรียนสมัคร</p>';
      return;
    }
    feed.innerHTML = students.slice(-3).reverse().map(u => `
      <div class="flex gap-3 items-start">
        <div class="w-9 h-9 rounded-full bg-white flex items-center justify-center card-shadow flex-shrink-0 text-base">🐻</div>
        <div>
          <p class="text-sm font-bold">${u.name}</p>
          <p class="text-xs" style="color:var(--on-surface-variant)">${u.email}</p>
          <p class="text-[10px] mt-0.5" style="color:var(--outline)">⭐ ${u.stars} ดาว &nbsp;|&nbsp; Lv.${u.level}</p>
        </div>
      </div>`).join('');
  }

  // ── LESSONS ───────────────────────────────────────────────
  function loadLessons() {
    const lessons = DB.Lessons.getAll();
    const list    = document.getElementById('lessons-list');
    if (!list) return;

    if (lessons.length === 0) {
      list.innerHTML = emptyState('ยังไม่มีบทเรียน', 'กดปุ่ม "เพิ่มบทเรียน" ด้านบน', 'menu_book');
      return;
    }

    list.innerHTML = lessons.map(l => {
      const meta = DB.subjectMeta(l.subject);
      return `
        <div class="table-row" style="grid-template-columns: 1fr auto auto auto auto;">
          <div>
            <p class="font-semibold text-sm">${escHtml(l.title)}</p>
            <p class="text-xs mt-0.5" style="color:var(--on-surface-variant)">${escHtml(l.desc || '—')}</p>
          </div>
          <span class="badge ${meta.badge} mx-3">${meta.emoji} ${meta.name}</span>
          <span class="text-sm mx-3" style="color:var(--on-surface-variant)">Lv.${l.level}</span>
          <span class="text-xs mx-3">${l.videoUrl
            ? '<span style="color:#059669;font-weight:700;">✓ มีวิดีโอ</span>'
            : '<span style="color:var(--outline-variant);">—</span>'}</span>
          <div class="flex gap-1">
            <button class="icon-btn primary" onclick="Admin.openEditLesson('${l.id}')" title="แก้ไข">
              <span class="material-symbols-outlined" style="font-size:1.1rem">edit</span>
            </button>
            <button class="icon-btn danger" onclick="Admin.deleteLesson('${l.id}')" title="ลบ">
              <span class="material-symbols-outlined" style="font-size:1.1rem">delete</span>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function openAddLesson() {
    _lessonEditId = null;
    setText('lesson-modal-heading', 'เพิ่มบทเรียนใหม่');
    resetForm(['lesson-title-input', 'lesson-video-input', 'lesson-desc-input']);
    setValue('lesson-subject-input', 'math');
    setValue('lesson-level-input', '1');
    UI.openModal('add-lesson-modal');
    document.getElementById('lesson-title-input')?.focus();
  }

  function openEditLesson(id) {
    const l = DB.Lessons.findById(id);
    if (!l) return;
    _lessonEditId = id;
    setText('lesson-modal-heading', 'แก้ไขบทเรียน');
    setValue('lesson-title-input',   l.title);
    setValue('lesson-subject-input', l.subject);
    setValue('lesson-level-input',   String(l.level));
    setValue('lesson-video-input',   l.videoUrl || '');
    setValue('lesson-desc-input',    l.desc || '');
    UI.openModal('add-lesson-modal');
  }

  function saveLesson() {
    const title = getValue('lesson-title-input').trim();
    if (!title) { UI.toast('กรุณาใส่ชื่อบทเรียน', 'error'); return; }
    const data = {
      title,
      subject:  getValue('lesson-subject-input'),
      level:    parseInt(getValue('lesson-level-input')),
      videoUrl: getValue('lesson-video-input').trim(),
      desc:     getValue('lesson-desc-input').trim(),
    };
    if (_lessonEditId) {
      DB.Lessons.update(_lessonEditId, data);
      UI.toast('แก้ไขบทเรียนแล้ว ✓');
    } else {
      DB.Lessons.create(data);
      UI.toast('เพิ่มบทเรียนใหม่แล้ว ✓');
    }
    UI.closeModal('add-lesson-modal');
    loadLessons();
    loadDashboard();
  }

  function deleteLesson(id) {
    const l = DB.Lessons.findById(id);
    UI.confirm(`ลบบทเรียน "${l?.title || id}" ใช่ไหม?`, () => {
      DB.Lessons.delete(id);
      loadLessons();
      loadDashboard();
      UI.toast('ลบบทเรียนแล้ว ✓');
    });
  }

  // ── QUIZZES ───────────────────────────────────────────────
  function loadQuizzes() {
    const quizzes = DB.Quizzes.getAll();
    const list    = document.getElementById('quizzes-list');
    if (!list) return;

    if (quizzes.length === 0) {
      list.innerHTML = emptyState('ยังไม่มีคำถาม', 'กดปุ่ม "เพิ่มคำถาม" ด้านบน', 'quiz');
      return;
    }

    list.innerHTML = quizzes.map(q => {
      const meta = DB.subjectMeta(q.subject);
      return `
        <div class="table-row" style="grid-template-columns: 1fr auto auto;">
          <div>
            <p class="font-semibold text-sm">${escHtml(q.question)}</p>
            <p class="text-xs mt-0.5" style="color:var(--on-surface-variant)">
              เฉลย: ${escHtml(q.options[q.correct] || '—')}
            </p>
          </div>
          <span class="badge ${meta.badge} mx-3">${meta.emoji} ${meta.name}</span>
          <div class="flex gap-1">
            <button class="icon-btn primary" onclick="Admin.openEditQuiz('${q.id}')" title="แก้ไข">
              <span class="material-symbols-outlined" style="font-size:1.1rem">edit</span>
            </button>
            <button class="icon-btn danger" onclick="Admin.deleteQuiz('${q.id}')" title="ลบ">
              <span class="material-symbols-outlined" style="font-size:1.1rem">delete</span>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  function openAddQuiz() {
    _quizEditId = null;
    setText('quiz-modal-heading', 'เพิ่มคำถามใหม่');
    setValue('quiz-question-input', '');
    setValue('quiz-subject-input', 'math');
    document.querySelectorAll('.quiz-option-input').forEach(el => el.value = '');
    const radios = document.querySelectorAll('input[name="correct-answer"]');
    if (radios[0]) radios[0].checked = true;
    UI.openModal('add-quiz-modal');
    document.getElementById('quiz-question-input')?.focus();
  }

  function openEditQuiz(id) {
    const q = DB.Quizzes.findById(id);
    if (!q) return;
    _quizEditId = id;
    setText('quiz-modal-heading', 'แก้ไขคำถาม');
    setValue('quiz-question-input', q.question);
    setValue('quiz-subject-input',  q.subject);
    const inputs = document.querySelectorAll('.quiz-option-input');
    q.options.forEach((opt, i) => { if (inputs[i]) inputs[i].value = opt; });
    const radio = document.querySelector(`input[name="correct-answer"][value="${q.correct}"]`);
    if (radio) radio.checked = true;
    UI.openModal('add-quiz-modal');
  }

  function saveQuiz() {
    const question = getValue('quiz-question-input').trim();
    if (!question) { UI.toast('กรุณาใส่คำถาม', 'error'); return; }
    const options = Array.from(document.querySelectorAll('.quiz-option-input')).map(el => el.value.trim());
    if (options.some(o => !o)) { UI.toast('กรุณาใส่ตัวเลือกให้ครบทุกช่อง', 'error'); return; }
    const correctEl = document.querySelector('input[name="correct-answer"]:checked');
    const correct   = correctEl ? parseInt(correctEl.value) : 0;
    const data = { question, subject: getValue('quiz-subject-input'), options, correct };
    if (_quizEditId) {
      DB.Quizzes.update(_quizEditId, data);
      UI.toast('แก้ไขคำถามแล้ว ✓');
    } else {
      DB.Quizzes.create(data);
      UI.toast('เพิ่มคำถามใหม่แล้ว ✓');
    }
    UI.closeModal('add-quiz-modal');
    loadQuizzes();
    loadDashboard();
  }

  function deleteQuiz(id) {
    const q = DB.Quizzes.findById(id);
    UI.confirm(`ลบคำถาม "${q?.question || id}" ใช่ไหม?`, () => {
      DB.Quizzes.delete(id);
      loadQuizzes();
      loadDashboard();
      UI.toast('ลบคำถามแล้ว ✓');
    });
  }

  // ── USERS ─────────────────────────────────────────────────
  function loadUsers() {
    const students = DB.Users.getStudents();
    const list     = document.getElementById('users-list');
    if (!list) return;

    if (students.length === 0) {
      list.innerHTML = emptyState('ยังไม่มีนักเรียน', 'นักเรียนจะปรากฏที่นี่เมื่อสมัครสมาชิก', 'school');
      return;
    }

    list.innerHTML = students.map(u => `
      <div class="table-row" style="grid-template-columns: 1fr 1fr auto auto auto;">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
               style="background:var(--primary-container)">🐻</div>
          <div>
            <p class="font-semibold text-sm">${escHtml(u.name)}</p>
            <p class="text-xs" style="color:var(--on-surface-variant)">Lv.${u.level}</p>
          </div>
        </div>
        <p class="text-xs truncate" style="color:var(--on-surface-variant)">${escHtml(u.email)}</p>
        <span class="text-sm font-bold mx-2" style="color:var(--primary)">⭐ ${u.stars}</span>
        <span class="text-sm font-bold mx-2" style="color:var(--secondary)">🏅 ${u.coins}</span>
        <button class="icon-btn danger" onclick="Admin.deleteUser('${u.id}')" title="ลบผู้ใช้">
          <span class="material-symbols-outlined" style="font-size:1.1rem">delete</span>
        </button>
      </div>`).join('');
  }

  function deleteUser(id) {
    const u = DB.Users.findById(id);
    UI.confirm(`ลบผู้ใช้ "${u?.name || id}" ออกจากระบบ?`, () => {
      DB.Users.delete(id);
      loadUsers();
      loadDashboard();
      UI.toast('ลบผู้ใช้แล้ว ✓');
    });
  }

  // ── REWARDS ───────────────────────────────────────────────
  function loadRewards() {
    const r = DB.Rewards.get();
    setText('reward-lesson_stars',  r.lesson_stars);
    setText('reward-quiz_coins',    r.quiz_coins);
    setText('reward-daily_reward',  r.daily_reward);
  }

  function adjustReward(key, delta) {
    const r = DB.Rewards.get();
    r[key] = Math.max(0, (r[key] || 0) + delta);
    DB.Rewards.update(r);
    loadRewards();
    UI.toast('บันทึกการตั้งค่าแล้ว ✓');
  }

  // ── DOM Helpers ───────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function getValue(id) {
    return document.getElementById(id)?.value || '';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function resetForm(ids) {
    ids.forEach(id => setValue(id, ''));
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function emptyState(title, subtitle, icon) {
    return `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-5xl mb-3 block" style="color:var(--outline-variant)">${icon}</span>
        <p class="font-bold" style="color:var(--on-surface-variant)">${title}</p>
        <p class="text-sm mt-1" style="color:var(--outline)">${subtitle}</p>
      </div>`;
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init,
    logout,
    showSection,

    // Lessons
    openAddLesson,
    openEditLesson,
    saveLesson,
    deleteLesson,

    // Quizzes
    openAddQuiz,
    openEditQuiz,
    saveQuiz,
    deleteQuiz,

    // Users
    deleteUser,

    // Rewards
    loadRewards,
    adjustReward,
  };

})();
