/**
 * db.js — Flutter & Learn Academy
 * Data Layer: LocalStorage CRUD operations and seed data
 */

// ============================================================
//  NAMESPACE
// ============================================================
const DB = (() => {

  const PREFIX = 'fla_';

  // ---------- Core Storage ----------
  function get(key) {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + key));
    } catch {
      return null;
    }
  }

  function set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  // ---------- Seed Default Data ----------
  function init() {
    if (!get('users')) {
      set('users', [
        {
          id: 'u0',
          name: 'ผู้ดูแลระบบ',
          email: 'admin@test.com',
          password: 'admin',
          role: 'admin',
          stars: 0, coins: 0, level: 1, xp: 0,
          completedLessons: [],
          badges: []
        },
        {
          id: 'u1',
          name: 'น้องมะลิ',
          email: 'student@test.com',
          password: '1234',
          role: 'student',
          stars: 15, coins: 30, level: 2, xp: 60,
          completedLessons: [],
          badges: ['🚀']
        }
      ]);
    }

    if (!get('lessons')) {
      set('lessons', [
        { id: 'l1',  title: 'การบวกเลข 1-10',    subject: 'math',    level: 1, videoUrl: '', desc: 'เรียนรู้การบวกเลขเบื้องต้น 1 ถึง 10 ด้วยรูปภาพที่น่ารัก' },
        { id: 'l2',  title: 'การลบเลข 1-20',      subject: 'math',    level: 1, videoUrl: '', desc: 'ฝึกการลบเลขจาก 1 ถึง 20' },
        { id: 'l3',  title: 'ตารางสูตรคูณ',        subject: 'math',    level: 2, videoUrl: '', desc: 'จำสูตรคูณแม่ 2-5 อย่างสนุกสนาน' },
        { id: 'l4',  title: 'ABC Alphabet',         subject: 'english', level: 1, videoUrl: '', desc: 'เรียนรู้ตัวอักษรภาษาอังกฤษทั้ง 26 ตัว' },
        { id: 'l5',  title: 'Colors & Shapes',      subject: 'english', level: 1, videoUrl: '', desc: 'สีและรูปทรงในภาษาอังกฤษ' },
        { id: 'l6',  title: 'Animals in English',   subject: 'english', level: 2, videoUrl: '', desc: 'ชื่อสัตว์ต่างๆ ในภาษาอังกฤษ' },
        { id: 'l7',  title: 'พืชและสัตว์',          subject: 'science', level: 1, videoUrl: '', desc: 'ความแตกต่างระหว่างพืชและสัตว์' },
        { id: 'l8',  title: 'น้ำและอากาศ',          subject: 'science', level: 1, videoUrl: '', desc: 'ความสำคัญของน้ำและอากาศต่อชีวิต' },
        { id: 'l9',  title: 'การดูแลสุขภาพ',        subject: 'life',    level: 1, videoUrl: '', desc: 'วิธีดูแลสุขภาพและความสะอาดของร่างกาย' },
        { id: 'l10', title: 'มารยาทที่ดี',           subject: 'life',    level: 1, videoUrl: '', desc: 'กิริยามารยาทที่ควรปฏิบัติในสังคม' },
      ]);
    }

    if (!get('quizzes')) {
      set('quizzes', [
        { id: 'q1', question: '2 + 3 = ?',            subject: 'math',    options: ['4','5','6','7'],                             correct: 1 },
        { id: 'q2', question: '10 - 4 = ?',           subject: 'math',    options: ['5','6','7','4'],                             correct: 1 },
        { id: 'q3', question: '3 × 4 = ?',            subject: 'math',    options: ['10','11','12','13'],                         correct: 2 },
        { id: 'q4', question: 'ตัวอักษรอะไรอยู่หลัง A?', subject: 'english', options: ['B','C','D','Z'],                       correct: 0 },
        { id: 'q5', question: '"Cat" แปลว่าอะไร?',    subject: 'english', options: ['สุนัข','แมว','กระต่าย','นก'],               correct: 1 },
        { id: 'q6', question: '"Red" คือสีอะไร?',     subject: 'english', options: ['สีน้ำเงิน','สีเขียว','สีแดง','สีเหลือง'],  correct: 2 },
        { id: 'q7', question: 'สิ่งใดเป็นพืช?',       subject: 'science', options: ['สุนัข','แมว','ต้นมะม่วง','ปลา'],          correct: 2 },
        { id: 'q8', question: 'คนเราต้องดื่มน้ำวันละเท่าไหร่?', subject: 'science', options: ['1 แก้ว','2 แก้ว','6-8 แก้ว','10 ลิตร'], correct: 2 },
        { id: 'q9', question: 'เราควรล้างมือเมื่อไหร่?', subject: 'life', options: ['ก่อนกินข้าว','หลังเข้าห้องน้ำ','หลังเล่น','ทั้งหมดที่กล่าวมา'], correct: 3 },
      ]);
    }

    if (!get('rewards')) {
      set('rewards', { lesson_stars: 3, quiz_coins: 10, daily_reward: 20 });
    }
  }

  // ---------- Users CRUD ----------
  const Users = {
    getAll()         { return get('users') || []; },
    getStudents()    { return Users.getAll().filter(u => u.role === 'student'); },
    findById(id)     { return Users.getAll().find(u => u.id === id) || null; },
    findByEmail(e)   { return Users.getAll().find(u => u.email === e) || null; },

    create(data) {
      const users = Users.getAll();
      const newUser = { id: 'u' + Date.now(), ...data };
      users.push(newUser);
      set('users', users);
      return newUser;
    },

    update(id, data) {
      const users = Users.getAll().map(u => u.id === id ? { ...u, ...data } : u);
      set('users', users);
      return users.find(u => u.id === id);
    },

    delete(id) {
      set('users', Users.getAll().filter(u => u.id !== id));
    },

    addStars(id, amount) {
      const u = Users.findById(id);
      return Users.update(id, { stars: (u.stars || 0) + amount });
    },

    addCoins(id, amount) {
      const u = Users.findById(id);
      return Users.update(id, { coins: (u.coins || 0) + amount });
    },

    addXP(id, amount) {
      const u = Users.findById(id);
      let xp = (u.xp || 0) + amount;
      let level = u.level || 1;
      let leveledUp = false;
      if (xp >= 100) { xp -= 100; level++; leveledUp = true; }
      Users.update(id, { xp, level });
      return { leveledUp, level };
    },

    completeLesson(id, lessonId) {
      const u = Users.findById(id);
      if (u.completedLessons.includes(lessonId)) return false;
      const updated = [...u.completedLessons, lessonId];
      Users.update(id, { completedLessons: updated });
      return true;
    }
  };

  // ---------- Lessons CRUD ----------
  const Lessons = {
    getAll()       { return get('lessons') || []; },
    findById(id)   { return Lessons.getAll().find(l => l.id === id) || null; },
    bySubject(sub) { return Lessons.getAll().filter(l => l.subject === sub); },

    create(data) {
      const lessons = Lessons.getAll();
      const newLesson = { id: 'l' + Date.now(), ...data };
      lessons.push(newLesson);
      set('lessons', lessons);
      return newLesson;
    },

    update(id, data) {
      const lessons = Lessons.getAll().map(l => l.id === id ? { ...l, ...data } : l);
      set('lessons', lessons);
      return lessons.find(l => l.id === id);
    },

    delete(id) {
      set('lessons', Lessons.getAll().filter(l => l.id !== id));
    }
  };

  // ---------- Quizzes CRUD ----------
  const Quizzes = {
    getAll()       { return get('quizzes') || []; },
    findById(id)   { return Quizzes.getAll().find(q => q.id === id) || null; },
    bySubject(sub) { return Quizzes.getAll().filter(q => q.subject === sub); },

    getRandom(n = 5) {
      return Quizzes.getAll()
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(n, Quizzes.getAll().length));
    },

    create(data) {
      const quizzes = Quizzes.getAll();
      const newQ = { id: 'q' + Date.now(), ...data };
      quizzes.push(newQ);
      set('quizzes', quizzes);
      return newQ;
    },

    update(id, data) {
      const quizzes = Quizzes.getAll().map(q => q.id === id ? { ...q, ...data } : q);
      set('quizzes', quizzes);
      return quizzes.find(q => q.id === id);
    },

    delete(id) {
      set('quizzes', Quizzes.getAll().filter(q => q.id !== id));
    }
  };

  // ---------- Rewards Config ----------
  const Rewards = {
    get()       { return get('rewards') || { lesson_stars: 3, quiz_coins: 10, daily_reward: 20 }; },
    update(data) { set('rewards', { ...Rewards.get(), ...data }); },

    claimDaily(userId) {
      const key = 'daily_' + userId;
      const today = new Date().toDateString();
      if (get(key) === today) return false;   // already claimed
      set(key, today);
      return true;
    },

    hasClaimed(userId) {
      return get('daily_' + userId) === new Date().toDateString();
    }
  };

  // ---------- Session ----------
  const Session = {
    save(user) { sessionStorage.setItem('fla_session', JSON.stringify({ id: user.id, role: user.role })); },
    load()     {
      try { return JSON.parse(sessionStorage.getItem('fla_session')); }
      catch { return null; }
    },
    clear()    { sessionStorage.removeItem('fla_session'); },
    getUser()  {
      const s = Session.load();
      return s ? Users.findById(s.id) : null;
    }
  };

  // ---------- Helpers ----------
  const SUBJECT_META = {
    math:    { emoji: '🔢', name: 'คณิตศาสตร์', badge: 'badge-math'    },
    english: { emoji: '🔤', name: 'ภาษาอังกฤษ', badge: 'badge-english' },
    science: { emoji: '🔬', name: 'วิทยาศาสตร์', badge: 'badge-science' },
    life:    { emoji: '🌟', name: 'ทักษะชีวิต',  badge: 'badge-life'    },
  };

  function subjectMeta(s) { return SUBJECT_META[s] || { emoji: '📚', name: s, badge: 'badge-math' }; }

  // ---------- Public API ----------
  return { init, get, set, remove, Users, Lessons, Quizzes, Rewards, Session, subjectMeta };

})();

// Auto-initialise when script loads
DB.init();
