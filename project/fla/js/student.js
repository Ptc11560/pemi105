/**
 * student.js — Flutter & Learn Academy
 * All Student App logic: Home, Subjects, Quiz, Profile
 * Depends on: db.js, auth.js (for UI helpers)
 */

// ============================================================
//  GUARD — redirect if not logged in as student
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const user = DB.Session.getUser();
  if (!user || user.role !== 'student') {
    window.location.href = 'index.html';
    return;
  }
  Student.init(user);
});

// ============================================================
//  STUDENT MODULE
// ============================================================
const Student = (() => {

  let _user           = null;
  let _activeSection  = 'home';
  let _activeFilter   = 'all';
  let _currentLessonId = null;

  // Quiz state
  const quiz = {
    questions: [],
    index: 0,
    score: 0,
    answered: false,
  };

  // ── Init ──────────────────────────────────────────────────
  function init(user) {
    _user = user;
    showSection('home');
  }

  // ── Logout ────────────────────────────────────────────────
  function logout() {
    DB.Session.clear();
    window.location.href = 'index.html';
  }

  // ── Section Navigation ────────────────────────────────────
  function showSection(section) {
    _activeSection = section;

    document.querySelectorAll('.student-section').forEach(el => el.classList.remove('active'));
    document.getElementById('stu-' + section)?.classList.add('active');

    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('snav-' + section)?.classList.add('active');

    // Scroll content to top
    document.getElementById('student-content')?.scrollTo(0, 0);

    // Load section content
    const loaders = {
      home:     loadHome,
      subjects: () => loadSubjects(_activeFilter),
      quiz:     loadQuiz,
      profile:  loadProfile,
    };
    loaders[section]?.();
  }

  // ── Refresh user from DB ──────────────────────────────────
  function refreshUser() {
    _user = DB.Users.findById(_user.id);
    return _user;
  }

  // ── HOME ─────────────────────────────────────────────────
  function loadHome() {
    refreshUser();
    _renderHeroStats();
    _renderDailyBanner();
    _renderRecentLessons();
  }

  function _renderHeroStats() {
    setText('student-greeting', _user.name + '!');
    setText('stu-stars-display', '⭐ ' + _user.stars);
    setText('stu-coins-display', '🏅 ' + _user.coins);
    setText('stu-level-display', 'Lv.' + _user.level);
  }

  function _renderDailyBanner() {
    const claimed = DB.Rewards.hasClaimed(_user.id);
    const banner  = document.getElementById('daily-reward-banner');
    const claimBtn = document.getElementById('daily-claim-btn');
    if (!banner || !claimBtn) return;
    if (claimed) {
      banner.style.opacity = '0.5';
      claimBtn.textContent = 'รับแล้ว!';
      claimBtn.disabled    = true;
    } else {
      banner.style.opacity = '1';
      claimBtn.textContent = 'รับ!';
      claimBtn.disabled    = false;
    }
  }

  function _renderRecentLessons() {
    const lessons = DB.Lessons.getAll().slice(0, 4);
    const el = document.getElementById('recent-lessons');
    if (!el) return;
    el.innerHTML = lessons.length
      ? lessons.map(lessonCardHTML).join('')
      : '<p class="text-sm text-center py-4" style="color:var(--on-surface-variant)">ยังไม่มีบทเรียน</p>';
  }

  // ── DAILY REWARD ─────────────────────────────────────────
  function claimDailyReward() {
    const ok = DB.Rewards.claimDaily(_user.id);
    if (!ok) { UI.toast('รับรางวัลไปแล้ววันนี้ มาใหม่พรุ่งนี้!', 'error'); return; }
    const r = DB.Rewards.get();
    DB.Users.addCoins(_user.id, r.daily_reward);
    refreshUser();
    _renderHeroStats();
    _renderDailyBanner();
    loadProfile();
    UI.toast(`🎁 ได้รับ ${r.daily_reward} เหรียญ! กลับมาพรุ่งนี้อีกนะ!`);
  }

  // ── SUBJECTS ──────────────────────────────────────────────
  function loadSubjects(subject = 'all') {
    _activeFilter = subject;
    refreshUser();

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subject === subject);
    });

    const lessons = subject === 'all'
      ? DB.Lessons.getAll()
      : DB.Lessons.bySubject(subject);

    const el = document.getElementById('subjects-lesson-list');
    if (!el) return;
    el.innerHTML = lessons.length
      ? lessons.map(lessonCardHTML).join('')
      : `<div class="text-center py-12" style="color:var(--on-surface-variant)">
           <span class="material-symbols-outlined text-5xl mb-3 block" style="color:var(--outline-variant)">search_off</span>
           ไม่พบบทเรียนในวิชานี้
         </div>`;
  }

  // ── LESSON CARD HTML ──────────────────────────────────────
  function lessonCardHTML(l) {
    refreshUser();
    const meta = DB.subjectMeta(l.subject);
    const done = _user.completedLessons.includes(l.id);
    return `
      <div class="card card-hover p-4 cursor-pointer" onclick="Student.openLesson('${l.id}')">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
               style="background:var(--surface-container)">${meta.emoji}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="badge ${meta.badge}">${meta.name}</span>
              <span class="text-xs" style="color:var(--on-surface-variant)">Lv.${l.level}</span>
            </div>
            <p class="font-bold text-sm leading-snug">${escHtml(l.title)}</p>
            <p class="text-xs mt-0.5 truncate" style="color:var(--on-surface-variant)">${escHtml(l.desc || 'คลิกเพื่อเรียน')}</p>
          </div>
          <div class="flex-shrink-0 ml-1">
            ${done
              ? '<span class="material-symbols-outlined" style="color:#059669;font-size:1.5rem">check_circle</span>'
              : '<span class="btn btn-primary" style="padding:0.4rem 0.9rem;font-size:0.75rem">▶ เรียน</span>'}
          </div>
        </div>
      </div>`;
  }

  // ── LESSON MODAL ─────────────────────────────────────────
  function openLesson(id) {
    const l = DB.Lessons.findById(id);
    if (!l) return;
    _currentLessonId = id;
    refreshUser();
    const done = _user.completedLessons.includes(id);
    const meta = DB.subjectMeta(l.subject);
    const r    = DB.Rewards.get();

    // Fill modal content
    const subjectEl = document.getElementById('lesson-modal-subject');
    if (subjectEl) {
      subjectEl.textContent  = meta.emoji + ' ' + meta.name;
      subjectEl.className    = 'badge ' + meta.badge;
    }
    setText('lesson-modal-title', l.title);
    setText('lesson-modal-desc',  l.desc || '');

    // Video area
    const videoArea = document.getElementById('lesson-video-area');
    if (videoArea) {
      if (l.videoUrl) {
        const ytId = extractYouTubeId(l.videoUrl);
        videoArea.innerHTML = ytId
          ? `<iframe class="w-full aspect-video rounded-xl"
               src="https://www.youtube.com/embed/${ytId}"
               frameborder="0" allowfullscreen></iframe>`
          : `<div class="w-full aspect-video rounded-xl flex flex-col items-center justify-center"
                style="background:var(--surface-container)">
               <span class="material-symbols-outlined text-5xl mb-2" style="color:var(--on-surface-variant)">link</span>
               <p class="text-sm font-medium" style="color:var(--on-surface-variant)">${escHtml(l.videoUrl)}</p>
             </div>`;
      } else {
        videoArea.innerHTML = `
          <div class="w-full aspect-video rounded-xl flex flex-col items-center justify-center"
               style="background:var(--surface-container)">
            <span class="material-symbols-outlined text-6xl mb-2" style="color:var(--outline-variant)">play_circle</span>
            <p class="text-sm font-medium" style="color:var(--on-surface-variant)">ไม่มีวิดีโอ</p>
          </div>`;
      }
    }

    // Complete button
    const completeBtn = document.getElementById('lesson-complete-btn');
    if (completeBtn) {
      if (done) {
        completeBtn.textContent = '✅ เรียนสำเร็จแล้ว!';
        completeBtn.className   = 'btn flex-1';
        completeBtn.style.cssText = 'background:#d1fae5;color:#065f46;pointer-events:none;';
      } else {
        completeBtn.textContent = `✅ เรียนเสร็จแล้ว! (+⭐${r.lesson_stars} ดาว)`;
        completeBtn.className   = 'btn btn-primary flex-1';
        completeBtn.style.cssText = '';
        completeBtn.onclick     = () => completeLesson();
      }
    }

    UI.openModal('lesson-modal');
  }

  function completeLesson() {
    if (!_currentLessonId) return;
    refreshUser();
    if (_user.completedLessons.includes(_currentLessonId)) {
      UI.toast('คุณเรียนบทเรียนนี้แล้ว!', 'error');
      UI.closeModal('lesson-modal');
      return;
    }
    const r   = DB.Rewards.get();
    const ok  = DB.Users.completeLesson(_user.id, _currentLessonId);
    if (!ok) { UI.toast('บทเรียนนี้เรียนแล้ว!', 'error'); return; }
    DB.Users.addStars(_user.id, r.lesson_stars);
    const { leveledUp, level } = DB.Users.addXP(_user.id, 20);
    refreshUser();
    UI.closeModal('lesson-modal');
    UI.toast(`⭐ ได้รับ ${r.lesson_stars} ดาว! ยอดเยี่ยม!`);
    if (leveledUp) setTimeout(() => UI.toast(`🎉 Level Up! คุณขึ้นระดับ ${level} แล้ว!`), 1200);
    // Refresh current section
    const loaders = { home: loadHome, subjects: () => loadSubjects(_activeFilter), profile: loadProfile };
    loaders[_activeSection]?.();
  }

  // ── QUIZ ─────────────────────────────────────────────────
  function loadQuiz() {
    const questions = DB.Quizzes.getRandom(5);
    const el = document.getElementById('quiz-area');
    if (!el) return;

    if (questions.length === 0) {
      el.innerHTML = `
        <div class="text-center py-16">
          <span class="material-symbols-outlined text-6xl mb-4 block" style="color:var(--outline-variant)">quiz</span>
          <p class="font-bold" style="color:var(--on-surface-variant)">ยังไม่มีแบบทดสอบ</p>
          <p class="text-sm mt-1" style="color:var(--outline)">Admin กำลังเพิ่มคำถาม...</p>
        </div>`;
      return;
    }

    quiz.questions = questions;
    quiz.index     = 0;
    quiz.score     = 0;
    quiz.answered  = false;
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const el    = document.getElementById('quiz-area');
    const total = quiz.questions.length;

    if (quiz.index >= total) {
      renderQuizResult();
      return;
    }

    const q    = quiz.questions[quiz.index];
    const meta = DB.subjectMeta(q.subject);
    const pct  = ((quiz.index / total) * 100).toFixed(0);

    el.innerHTML = `
      <div class="bounce-in">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-bold" style="color:var(--on-surface-variant)">ข้อ ${quiz.index + 1} / ${total}</span>
          <span class="text-xs font-bold" style="color:var(--primary)">คะแนน: ${quiz.score}/${quiz.index}</span>
        </div>
        <div class="progress-bar mb-5">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="card p-5 mb-5">
          <div class="flex items-center gap-2 mb-3">
            <span class="badge ${meta.badge}">${meta.emoji} ${meta.name}</span>
          </div>
          <h3 class="text-lg font-bold leading-snug">${escHtml(q.question)}</h3>
        </div>
        <div class="space-y-3" id="quiz-options-area">
          ${q.options.map((opt, i) => `
            <div class="quiz-option" data-index="${i}" onclick="Student.answerQuiz(${i})">
              <span class="font-bold mr-2" style="color:var(--on-surface-variant)">${String.fromCharCode(65 + i)}.</span>
              ${escHtml(opt)}
            </div>`).join('')}
        </div>
      </div>`;
  }

  function answerQuiz(selected) {
    if (quiz.answered) return;
    quiz.answered = true;

    const q       = quiz.questions[quiz.index];
    const options = document.querySelectorAll('#quiz-options-area .quiz-option');
    const correct = selected === q.correct;

    options.forEach((el, i) => {
      el.setAttribute('disabled', 'true');
      el.style.pointerEvents = 'none';
      if (i === q.correct) el.classList.add('correct');
      else if (i === selected) el.classList.add('wrong');
    });

    if (correct) { quiz.score++; UI.toast('✅ ถูกต้อง! เก่งมาก!'); }
    else UI.toast(`❌ ผิด! คำตอบที่ถูกต้อง: ${q.options[q.correct]}`, 'error');

    setTimeout(() => {
      quiz.index++;
      quiz.answered = false;
      renderQuizQuestion();
    }, 1600);
  }

  function renderQuizResult() {
    const el    = document.getElementById('quiz-area');
    const total = quiz.questions.length;
    const score = quiz.score;
    const pct   = Math.round((score / total) * 100);
    const r     = DB.Rewards.get();
    const earned = score > 0 ? Math.round(r.quiz_coins * (score / total)) : 0;

    if (earned > 0) {
      DB.Users.addCoins(_user.id, earned);
      refreshUser();
    }

    const grade = pct >= 80 ? { emoji: '🏆', msg: 'ยอดเยี่ยมมาก! คุณเก่งมาก 🎉' }
                : pct >= 60 ? { emoji: '🌟', msg: 'ดีมาก! ลองฝึกต่อนะ 💪' }
                :             { emoji: '💪', msg: 'ไม่เป็นไร ลองใหม่อีกครั้งได้เลย!' };

    el.innerHTML = `
      <div class="bounce-in text-center">
        <div style="font-size:4.5rem;line-height:1;margin-bottom:1rem">${grade.emoji}</div>
        <h3 class="text-2xl font-black mb-1">ผลลัพธ์</h3>
        <div class="card p-6 mb-5 text-center">
          <p class="text-5xl font-black mb-1" style="color:var(--primary)">${score} / ${total}</p>
          <p style="color:var(--on-surface-variant)">${pct}% คะแนน</p>
          ${earned > 0 ? `<p class="mt-3 font-bold" style="color:var(--secondary)">🏅 ได้รับ ${earned} เหรียญ!</p>` : ''}
        </div>
        <p class="mb-6" style="color:var(--on-surface-variant)">${grade.msg}</p>
        <button class="btn btn-primary w-full py-4" onclick="Student.loadQuiz()">
          เล่นอีกครั้ง 🔄
        </button>
      </div>`;

    // Refresh profile stats
    loadProfile();
  }

  // ── PROFILE ───────────────────────────────────────────────
  function loadProfile() {
    refreshUser();

    setText('profile-name',    _user.name);
    setText('profile-email',   _user.email);
    setText('profile-stars',   _user.stars);
    setText('profile-coins',   _user.coins);
    setText('profile-level',   _user.level);
    setText('profile-xp-text', `${_user.xp} / 100 XP`);

    const xpBar = document.getElementById('profile-xp-bar');
    if (xpBar) xpBar.style.width = _user.xp + '%';

    _renderBadges();
    _renderCompletedLessons();
  }

  function _renderBadges() {
    const el = document.getElementById('profile-badges');
    if (!el) return;

    const ALL_BADGES = [
      { emoji: '🚀', name: 'Speed Runner',   earned: _user.badges.includes('🚀') },
      { emoji: '🌟', name: 'Star Collector', earned: _user.stars >= 50 },
      { emoji: '🔥', name: '7-Day Streak',   earned: _user.badges.includes('🔥') },
      { emoji: '🏆', name: 'Top Student',    earned: _user.badges.includes('🏆') },
      { emoji: '📚', name: 'Bookworm',       earned: _user.completedLessons.length >= 5 },
      { emoji: '🎯', name: 'Quiz Master',    earned: _user.coins >= 100 },
      { emoji: '🌈', name: 'Explorer',       earned: _user.completedLessons.length >= 1 },
      { emoji: '💎', name: 'Diamond',        earned: _user.stars >= 100 },
    ];

    el.innerHTML = ALL_BADGES.map(b => `
      <div class="text-center transition-opacity" style="opacity:${b.earned ? '1' : '0.25'}">
        <div style="font-size:1.875rem;line-height:1;margin-bottom:0.25rem">${b.emoji}</div>
        <p style="font-size:0.625rem;font-weight:700;line-height:1.2">${b.name}</p>
        ${b.earned ? '<p style="font-size:0.5rem;color:var(--primary);font-weight:700;margin-top:2px">✓ ได้รับ</p>' : ''}
      </div>`).join('');
  }

  function _renderCompletedLessons() {
    const el = document.getElementById('profile-completed');
    if (!el) return;

    const done = DB.Lessons.getAll().filter(l => _user.completedLessons.includes(l.id));
    el.innerHTML = done.length
      ? done.map(l => {
          const meta = DB.subjectMeta(l.subject);
          return `
            <div class="flex items-center gap-3 py-2"
                 style="border-bottom:1px solid rgba(173,173,172,0.1)">
              <span style="font-size:1.25rem">${meta.emoji}</span>
              <p class="flex-1 text-sm font-medium">${escHtml(l.title)}</p>
              <span class="material-symbols-outlined" style="color:#059669;font-size:1.1rem">check_circle</span>
            </div>`;
        }).join('')
      : '<p class="text-sm text-center py-4" style="color:var(--on-surface-variant)">ยังไม่ได้เรียนบทเรียนใด<br>กดแท็บ "วิชา" เพื่อเริ่มเรียน!</p>';
  }

  // ── Utilities ─────────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function extractYouTubeId(url) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init,
    logout,
    showSection,
    loadSubjects,
    loadQuiz,
    openLesson,
    completeLesson,
    answerQuiz,
    claimDailyReward,
    loadProfile,
  };

})();
