/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — NOTEBOOK CONTROLLER (notebook.js)
 * 5-Layer Vault: Personal Notes, Mistakes with Retry, Starred Favourites,
 * AI Sunday Brief, and Spaced Repetition Due Engine.
 * ═══════════════════════════════════════════════════════════════════════
 */

var notebookData = null;

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  // Initialize Telegram native back button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = 'index.html';
      });
    } catch (e) {}
  }

  // Save quick note listener
  document.getElementById('btnSaveQuickNote').addEventListener('click', async function() {
    var title = document.getElementById('quickNoteTitle').value.trim();
    var content = document.getElementById('quickNoteContent').value.trim();
    if (!content) return;

    TG_APP.hapticLight();
    try {
      await API_CLIENT.call('saveStudentNotebookItem', {
        title: title || 'Quick Note',
        conceptTitle: title || 'Quick Note',
        note: content,
        noteText: content,
        itemType: 'NOTE',
        topic: 'General'
      });
      document.getElementById('quickNoteTitle').value = '';
      document.getElementById('quickNoteContent').value = '';
      loadNotebook();
    } catch (e) {
      alert('Note saved.');
    }
  });

  loadNotebook();
});

async function loadNotebook() {
  // 1. Instant 0ms render from cache
  var cached = API_CLIENT.getCached('getNotebook');
  if (cached) {
    notebookData = cached;
    renderNotebook(cached);
  }

  try {
    // 2. Fetch fresh live notes in background and update
    var fresh = await API_CLIENT.call('getNotebook');
    if (fresh) {
      notebookData = fresh;
      renderNotebook(fresh);
    } else if (!cached) {
      renderNotebook({ notes: [], mistakes: [], favourites: [], notesCount: 0, mistakesCount: 0, favouritesCount: 0, revisionDueCount: 0 });
    }
  } catch (err) {
    console.warn('Notebook load notice:', err);
    if (!cached) {
      renderNotebook({ notes: [], mistakes: [], favourites: [], notesCount: 0, mistakesCount: 0, favouritesCount: 0, revisionDueCount: 0 });
    }
  }
}

function renderNotebook(data) {
  if (!data) return;

  // Counts
  var notesBadge = document.getElementById('countNotes');
  if (notesBadge) notesBadge.innerText = data.notesCount || 0;

  var mistakesBadge = document.getElementById('countMistakes');
  if (mistakesBadge) mistakesBadge.innerText = data.mistakesCount || 0;

  var favsBadge = document.getElementById('countFavs');
  if (favsBadge) favsBadge.innerText = data.favouritesCount || 0;

  // Revision Due Today Banner
  if (data.revisionDueCount > 0) {
    document.getElementById('revisionDueCard').style.display = 'block';
    document.getElementById('revisionDueBadge').innerText = data.revisionDueCount + ' Due';
    document.getElementById('revisionDueCountText').innerText = data.revisionDueCount + ' Questions Due for Revision';
  } else {
    document.getElementById('revisionDueCard').style.display = 'none';
    document.getElementById('revisionDueBadge').innerText = '0 Due';
  }

  // 1. Render Notes
  var notesContainer = document.getElementById('notesList');
  if (data.notes && data.notes.length > 0) {
    notesContainer.innerHTML = '';
    data.notes.forEach(function(n) {
      var meta = parseNoteMetadata(n.title, n.topic);
      var card = document.createElement('div');
      card.className = 'saved-note-card';

      var badgesHtml = '';
      if (meta.subject) {
        badgesHtml += '<span class="saved-note-pill ' + meta.subjectClass + '">' + meta.subject + '</span>';
      }
      if (meta.lens) {
        badgesHtml += '<span class="saved-note-pill pill-lens-tag">💡 ' + meta.lens + '</span>';
      }

      var noteDate = n.timestamp || n.date || 'Saved';
      if (noteDate.length > 16) noteDate = noteDate.substring(0, 16);

      card.innerHTML =
        '<div class="saved-note-header">' +
        '  <div class="saved-note-badges">' + badgesHtml + '</div>' +
        '  <button class="saved-note-copy-btn" onclick="copyNoteContent(this)">📋 Copy</button>' +
        '</div>' +
        '<div class="saved-note-title">' + meta.cleanTitle + '</div>' +
        '<div class="saved-note-body">' + escapeHtml(n.note) + '</div>' +
        '<div class="saved-note-footer">' +
        '  <span>🔒 Personal Learning Vault</span>' +
        '  <span>' + noteDate + '</span>' +
        '</div>';

      notesContainer.appendChild(card);
    });
  } else {
    notesContainer.innerHTML = '<div class="text-sm text-secondary" style="text-align:center; padding:30px 10px;">📓 No notes saved yet. Tap "Save Note" on any doubt explanation or daily MCQ!</div>';
  }

  // 2. Render Mistakes
  var mistakesContainer = document.getElementById('mistakesList');
  if (data.mistakes && data.mistakes.length > 0) {
    mistakesContainer.innerHTML = '';
    data.mistakes.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'mistake-card';
      card.innerHTML =
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
        '  <span class="pill pill-gold" style="font-size: 10px;">' + (m.chapter || 'Partnership Fundamentals') + '</span>' +
        '  <span style="font-size: 11px; color: #FCA5A5; font-weight: 700;">Mistake Analysis</span>' +
        '</div>' +
        '<div class="mistake-question">' + m.question + '</div>' +
        '<div class="mistake-compare-grid">' +
        '  <div class="mistake-badge-wrong">❌ Your Pick: Option ' + (m.studentSelected || '-') + '</div>' +
        '  <div class="mistake-badge-correct">✅ Correct: Option ' + (m.correctIdx || '-') + '</div>' +
        '</div>' +
        '<div class="mistake-explanation-box">' +
        '  <div style="font-size: 11px; font-weight: 700; color: #D4AF37; margin-bottom: 4px;">💡 CBSE Examiner Key:</div>' +
        '  <div>' + m.explanation + '</div>' +
        '</div>';
      mistakesContainer.appendChild(card);
    });
  } else {
    mistakesContainer.innerHTML = '<div class="text-sm text-secondary" style="text-align:center; padding:30px 10px;">🎉 Zero mistakes logged! You have solved every practice question accurately.</div>';
  }

  // 3. Render Starred Favourites
  var favsContainer = document.getElementById('favsList');
  if (data.favourites && data.favourites.length > 0) {
    favsContainer.innerHTML = '';
    data.favourites.forEach(function(f) {
      var card = document.createElement('div');
      card.className = 'saved-note-card';
      card.style.borderColor = 'rgba(212, 175, 55, 0.4)';
      card.innerHTML =
        '<div class="saved-note-header">' +
        '  <span class="pill pill-gold" style="font-size: 10px;">⭐ STARRED QUESTION</span>' +
        '  <span style="font-size: 11px; color: #94A3B8;">Saved to Vault</span>' +
        '</div>' +
        '<div class="saved-note-title">' + (f.title || f.question || 'Tricky Question') + '</div>' +
        (f.question && f.title !== f.question ? '<div style="font-size: 12.5px; color: #E2E8F0; margin-bottom: 8px;">' + f.question + '</div>' : '') +
        '<div class="saved-note-body" style="background: rgba(0,0,0,0.25); padding: 10px 12px; border-radius: 8px;">' +
        '  <div style="font-size: 11px; font-weight: 700; color: #D4AF37; margin-bottom: 3px;">💡 Revision Anchor:</div>' +
        '  <div>' + f.explanation + '</div>' +
        '</div>';
      favsContainer.appendChild(card);
    });
  } else {
    favsContainer.innerHTML = '<div class="text-sm text-secondary" style="text-align:center; padding:30px 10px;">⭐ No starred questions yet. Star tricky questions for 3-minute exam revision!</div>';
  }

  // 4. Render AI Weekly Brief
  if (data.aiSummary && data.aiSummary.summary) {
    var briefEl = document.getElementById('aiSummaryBody');
    if (briefEl) {
      briefEl.className = 'text-sm';
      briefEl.style.lineHeight = '1.6';
      briefEl.style.color = '#F1F5F9';
      briefEl.innerText = data.aiSummary.summary;
    }
  }
}

function parseNoteMetadata(title, topic) {
  var subject = topic || '';
  var lens = '';
  var cleanTitle = title || 'Revision Note';

  // Check pattern: "Subject (Lens): Title..."
  var match = cleanTitle.match(/^(Accountancy|Business Studies|Economics)\s*\(([^)]+)\):\s*(.*)/i);
  if (match) {
    subject = match[1];
    lens = match[2];
    cleanTitle = match[3];
  } else {
    // Check pattern: "(Lens): Title..."
    var lensMatch = cleanTitle.match(/^\(([^)]+)\):\s*(.*)/i);
    if (lensMatch) {
      lens = lensMatch[1];
      cleanTitle = lensMatch[2];
    }
  }

  // Clean trailing dots
  cleanTitle = cleanTitle.replace(/\.{3,}$/, '').trim();

  var subjectClass = 'pill-subject-acc';
  if (/business/i.test(subject)) subjectClass = 'pill-subject-bst';
  else if (/economic/i.test(subject)) subjectClass = 'pill-subject-eco';

  return {
    subject: subject,
    subjectClass: subjectClass,
    lens: lens,
    cleanTitle: cleanTitle
  };
}

function copyNoteContent(btn) {
  TG_APP.hapticSuccess();
  var card = btn.closest('.saved-note-card');
  if (!card) return;
  var body = card.querySelector('.saved-note-body');
  if (!body) return;
  var text = body.innerText;
  navigator.clipboard.writeText(text).then(function() {
    var original = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    setTimeout(function() { btn.innerHTML = original; }, 1500);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function switchNotebookTab(tab) {
  TG_APP.hapticLight();
  var tabs = ['notes', 'mistakes', 'favs', 'summary'];
  tabs.forEach(function(t) {
    var section = document.getElementById('section' + capitalize(t));
    if (section) section.style.display = (t === tab) ? 'block' : 'none';
    var tabBtn = document.getElementById('tab' + capitalize(t));
    if (tabBtn) {
      if (t === tab) {
        tabBtn.classList.add('active');
      } else {
        tabBtn.classList.remove('active');
      }
    }
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
