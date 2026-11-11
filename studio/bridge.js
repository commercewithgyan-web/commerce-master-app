/**
 * COMMERCE GYAN STUDIO — TELEGRAM + APPS SCRIPT BRIDGE (bridge.js)
 *
 * Loaded after the Studio's own script. It does three things:
 *   1. Asks the backend who this is (signed Telegram initData, HMAC-checked
 *      server-side) and routes to Teacher Studio or Student View.
 *   2. Replaces the mock handlers for Curriculum status, Save Lesson and
 *      Dispatch DPP with real calls to the Apps Script web app.
 *   3. Runs tonight's DPP for a student from the live question vault.
 *
 * The role is NEVER decided from initDataUnsafe: that object is plain
 * client-side JSON and anyone can edit it. It is used for the greeting only.
 */
(function () {
  'use strict';

  var DEFAULT_BACKEND = 'https://script.google.com/macros/s/AKfycbywJKoynUbc2fY7caEx9hZ-FARG71J9v1F6uXaL5z7XxBS_NKhwFiKCZIVeaYVJ0QS4jQ/exec';
  var tg = (window.Telegram && window.Telegram.WebApp) || null;
  var initData = (tg && tg.initData) || '';
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var live = false;      // true once a verified teacher session is active
  var session = null;

  // ───────────────────────── helpers ─────────────────────────
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(esc(msg), type || 'indigo');
  }

  function haptic(kind) {
    try {
      if (!tg || !tg.HapticFeedback) return;
      if (kind === 'success' || kind === 'error' || kind === 'warning') tg.HapticFeedback.notificationOccurred(kind);
      else tg.HapticFeedback.impactOccurred(kind || 'light');
    } catch (e) { /* older Telegram clients */ }
  }

  function backendUrl() {
    var stored = '';
    try { stored = localStorage.getItem('cg_backend_url') || ''; } catch (e) { /* storage blocked */ }
    return window.COMMERCE_BACKEND_URL || stored || DEFAULT_BACKEND;
  }

  /**
   * One door to the backend. text/plain keeps this a "simple" request, so the
   * browser sends no CORS preflight (Apps Script cannot answer OPTIONS).
   */
  function api(action, payload) {
    return fetch(backendUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ initData: initData, action: action, payload: payload || {} }),
      redirect: 'follow'
    }).then(function (res) {
      if (!res.ok) throw new Error('Server replied ' + res.status);
      return res.json();
    }).then(function (json) {
      if (!json || json.ok !== true) throw new Error((json && json.error) || 'Request failed');
      return json.data;
    });
  }

  function confirmBox(text) {
    return new Promise(function (resolve) {
      if (tg && typeof tg.showConfirm === 'function' && initData) {
        try { tg.showConfirm(text, function (ok) { resolve(!!ok); }); return; } catch (e) { /* fall through */ }
      }
      resolve(window.confirm(text));
    });
  }

  function unlock() { document.documentElement.classList.remove('cg-lock'); }

  // ───────────────────────── gate ─────────────────────────
  function showGate(title, message, busy) {
    var gate = $('cgGate');
    if (!gate) {
      gate = document.createElement('div');
      gate.id = 'cgGate';
      gate.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:#0B0C10;color:#F8FAFC;text-align:center;font-family:Inter,system-ui,sans-serif';
      var box = document.createElement('div');
      box.style.maxWidth = '340px';
      var logo = document.createElement('div');
      logo.textContent = 'CG';
      logo.style.cssText = 'width:56px;height:56px;margin:0 auto 16px;border-radius:16px;background:#2D124D;border:1px solid #D4AF37;color:#D4AF37;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:18px';
      var h = document.createElement('h1');
      h.id = 'cgGateTitle';
      h.style.cssText = 'font-size:18px;font-weight:800;margin:0 0 8px';
      var p = document.createElement('p');
      p.id = 'cgGateMsg';
      p.style.cssText = 'font-size:13px;line-height:1.5;color:#cbd5e1;margin:0';
      box.appendChild(logo); box.appendChild(h); box.appendChild(p);
      gate.appendChild(box);
      document.body.appendChild(gate);
    }
    $('cgGateTitle').textContent = title;
    $('cgGateMsg').textContent = message;
    gate.style.opacity = busy ? '0.96' : '1';
  }

  function hideGate() {
    var gate = $('cgGate');
    if (gate) gate.remove();
  }

  function removeEl(id) {
    var el = $(id);
    if (el) el.remove();
  }

  // ───────────────────────── teacher ─────────────────────────
  function banner(text) {
    var host = $('teacherWorkspace');
    if (!host || $('cgLiveBanner')) return;
    var bar = document.createElement('div');
    bar.id = 'cgLiveBanner';
    bar.className = 'w-full px-4 py-2 text-[11px] font-semibold bg-amber-50 border-b border-amber-200 text-amber-900';
    bar.textContent = text;
    host.parentNode.insertBefore(bar, host);
  }

  function loadCurriculum() {
    return api('getCurriculum').then(function (rows) {
      appState.curriculumTopics = rows.map(function (r) {
        return {
          id: esc(r.id),
          subject: esc(r.subject),
          chapter: esc(r.chapter),
          topic: esc(r.topic),
          subtopicsCount: 1,
          status: r.status === 'Completed' ? 'Completed' : 'Planned',
          date: esc(r.date)
        };
      });
      renderCurriculum();
      toast('Syllabus Planner loaded: ' + rows.length + ' topics', 'emerald');
    }).catch(function (e) {
      toast('Could not load Syllabus Planner: ' + e.message, 'amber');
    });
  }

  function dppLine(m) {
    var s = 'Class ' + m.classLevel + ' ' + (m.subject || '') + ': ' + m.total + ' Q (' + m.fresh + ' fresh + ' + m.retention + ' retention)';
    if (m.shortfall > 0) s += ' — SHORT by ' + m.shortfall + ', add approved MCQs for this topic';
    return s;
  }

  function onCycleStatus(btn) {
    var id = btn.dataset.currid;
    var item = appState.curriculumTopics.filter(function (c) { return c.id === id; })[0];
    if (!item || btn.disabled) return;
    var next = item.status === 'Completed' ? 'Upcoming' : 'Completed';
    var question = next === 'Completed'
      ? 'Mark ' + id + ' as COMPLETED today? It becomes tonight\'s DPP topic.'
      : 'Move ' + id + ' back to Upcoming?';
    confirmBox(question).then(function (ok) {
      if (!ok) return;
      btn.disabled = true;
      btn.textContent = 'Saving…';
      return api('setTopicStatus', { topicId: id, status: next }).then(function (res) {
        item.status = res.status === 'Completed' ? 'Completed' : 'Planned';
        item.date = res.date;
        renderCurriculum();
        haptic('success');
        toast(id + ' → ' + res.status + (res.dpp ? ' · ' + dppLine(res.dpp) : ''), 'emerald');
      }).catch(function (e) {
        renderCurriculum();
        haptic('error');
        toast('Not saved: ' + e.message, 'amber');
      });
    });
  }

  function onSaveLesson() {
    var current = appState.lessons.filter(function (l) { return l.id === appState.selectedLessonId; })[0];
    if (!current) return;
    current.title = $('editorTitleInput').value;
    current.unit = $('editorUnitInput').value;
    current.body = $('editorBodyInput').value;
    renderLessons();
    api('saveLessonPlan', {
      lessonId: current.id,
      subject: current.subject,
      topicId: current.code,
      title: current.title,
      unit: current.unit,
      body: current.body
    }).then(function (res) {
      haptic('success');
      toast('Lesson saved to Sheet (row ' + res.row + ')', 'emerald');
    }).catch(function (e) {
      haptic('error');
      toast('Lesson NOT saved: ' + e.message, 'amber');
    });
  }

  function onDispatch(btn) {
    btn.disabled = true;
    api('dispatchDpp', {}).then(function (list) {
      haptic('success');
      list.forEach(function (m) { toast(dppLine(m), m.shortfall > 0 ? 'amber' : 'emerald'); });
    }).catch(function (e) {
      haptic('error');
      toast('DPP rebuild failed: ' + e.message, 'amber');
    }).then(function () { btn.disabled = false; });
  }

  // Capture phase: runs before the Studio's mock handlers and replaces them
  // while a verified teacher session is live. In local demo mode it stays out.
  document.addEventListener('click', function (e) {
    if (!live || !e.target.closest) return;
    var cyc = e.target.closest('.cycle-curr-btn');
    var save = e.target.closest('#saveLessonBtn');
    var disp = e.target.closest('#dispatchDppNowBtn');
    if (!cyc && !save && !disp) return;
    e.preventDefault();
    e.stopPropagation();
    haptic('light');
    if (cyc) onCycleStatus(cyc);
    else if (save) onSaveLesson();
    else onDispatch(disp);
  }, true);

  function startTeacher() {
    live = true;
    hideGate();
    unlock();
    banner('LIVE: Curriculum status, Save Lesson and DPP rebuild write to Google Sheets. Students, Attendance, Gradebook, Fees and Timetable tabs still show sample data.');
    var urlInput = $('gasWebhookUrlInput');
    var urlBtn = $('saveGasUrlBtn');
    if (urlInput && urlBtn) {
      urlInput.value = backendUrl();
      urlBtn.addEventListener('click', function () {
        var v = urlInput.value.trim();
        if (/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(v)) {
          try { localStorage.setItem('cg_backend_url', v); } catch (err) { /* storage blocked */ }
        }
      });
    }
    loadCurriculum();
  }

  // ───────────────────────── student ─────────────────────────
  function startStudent(s) {
    hideGate();
    ['teacherWorkspace', 'modeTeacherBtn', 'modeStudentBtn', 'openSyncQuickBtn', 'mobileMenuBtn',
      'tgStudentSelect', 'tgRec01Card', 'swotModalOverlay'].forEach(removeEl);
    var receipt = $('tgOpenReceiptBtn');
    if (receipt) (receipt.closest('.bg-white') || receipt).remove();

    $('studentWorkspace').classList.remove('hidden');
    $('tgStudentNameHeader').textContent = s.student.name + ' (' + s.student.studentId + ')';
    $('tgStudentCoins').textContent = '🪙 ' + s.student.coins;
    $('tgStudentAtt').textContent = '—';
    $('tgStudentGrade').textContent = '—';
    unlock();
    loadDpp(s);
  }

  function loadDpp(s) {
    var box = $('tgQuizInteractiveBox');
    box.textContent = '';
    var sk = document.createElement('div');
    sk.className = 'animate-pulse space-y-2';
    sk.innerHTML = '<div class="h-3 bg-slate-200 rounded w-3/4"></div><div class="h-8 bg-slate-200 rounded"></div><div class="h-8 bg-slate-200 rounded"></div>';
    box.appendChild(sk);

    api('getDailyQuestion', { classLevel: s.student.classLevel }).then(function (qs) {
      if (!qs || !qs.length) {
        box.textContent = 'Aaj ka DPP abhi taiyaar nahi hai. Class ke baad dobara kholo.';
        return;
      }
      runQuiz(box, qs, s);
    }).catch(function (e) {
      box.textContent = 'DPP load nahi hua: ' + e.message;
    });
  }

  function runQuiz(box, qs, s) {
    var idx = 0, score = 0, coins = 0, startedAt = 0;

    function show() {
      var q = qs[idx];
      startedAt = Date.now();
      box.textContent = '';
      var head = document.createElement('p');
      head.className = 'text-[11px] font-bold text-indigo-600';
      head.textContent = 'Q' + (idx + 1) + ' of ' + qs.length + (s.active && s.active.subtopicName ? ' · ' + s.active.subtopicName : '');
      var text = document.createElement('p');
      text.className = 'text-xs font-bold text-slate-900 whitespace-pre-line';
      text.textContent = q.question;
      var list = document.createElement('div');
      list.className = 'space-y-1.5';
      var fb = document.createElement('div');
      fb.className = 'text-[11px] leading-relaxed text-slate-700';

      (q.options || []).forEach(function (opt, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'w-full text-left px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-medium';
        b.style.minHeight = '44px';
        b.textContent = 'ABCD'.charAt(i) + ') ' + opt;
        b.addEventListener('click', function () { answer(q, i, list, fb); });
        list.appendChild(b);
      });
      box.appendChild(head); box.appendChild(text); box.appendChild(list); box.appendChild(fb);
    }

    function answer(q, i, list, fb) {
      haptic('light');
      var buttons = list.querySelectorAll('button');
      buttons.forEach(function (b) { b.disabled = true; });
      fb.textContent = 'Checking…';
      api('submitAnswer', {
        qid: q.qid,
        selectedIndex: i,
        optionMap: q.optionMap,
        timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000)
      }).then(function (r) {
        if (r.isCorrect) { score++; haptic('success'); } else { haptic('error'); }
        coins += Number(r.coinsEarned || 0);
        buttons[i].style.borderColor = r.isCorrect ? '#10b981' : '#ef4444';
        if (!r.isCorrect && buttons[r.correctOptionIndex]) buttons[r.correctOptionIndex].style.borderColor = '#10b981';
        fb.textContent = (r.isCorrect ? '✅ Sahi! ' : '❌ Galat. ') + (r.explanation || '') + (r.trapAlert ? '  ⚠️ ' + r.trapAlert : '');
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'mt-2 w-full py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-bold';
        next.textContent = idx + 1 < qs.length ? 'Next question' : 'Finish';
        next.addEventListener('click', function () {
          haptic('light');
          idx++;
          if (idx < qs.length) show(); else finish();
        });
        fb.appendChild(next);
      }).catch(function (e) {
        buttons.forEach(function (b) { b.disabled = false; });
        fb.textContent = 'Answer save nahi hua: ' + e.message + '. Dobara tap karo.';
      });
    }

    function finish() {
      box.textContent = '';
      var done = document.createElement('p');
      done.className = 'text-sm font-extrabold text-slate-900';
      done.textContent = 'Score: ' + score + ' / ' + qs.length + (coins ? '  ·  🪙 +' + coins : '');
      box.appendChild(done);
      if (coins) $('tgStudentCoins').textContent = '🪙 ' + (s.student.coins + coins);
    }

    show();
  }

  // ───────────────────────── boot ─────────────────────────
  function boot() {
    if (tg) { try { tg.ready(); tg.expand(); } catch (e) { /* not inside Telegram */ } }

    if (!initData) {
      if (isLocal) { unlock(); toast('Local demo: sample data only, nothing is saved', 'amber'); return; }
      showGate('Open inside Telegram', 'This app only works from the Commerce Gyan bot. Open the bot in Telegram and tap the app button.');
      return;
    }

    showGate('Commerce Gyan', 'Verifying your Telegram account…', true);
    api('getSession').then(function (s) {
      session = s;
      if (s.role === 'teacher') return startTeacher();
      if (s.role === 'student' && s.access === 'full') return startStudent(s);
      showGate(s.access === 'paused' ? 'Access paused' : 'Not enrolled yet', s.message || 'Please contact Gyan Sir.');
    }).catch(function (e) {
      showGate('Connection problem', 'Could not reach the server (' + e.message + '). Close and reopen the app.');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
