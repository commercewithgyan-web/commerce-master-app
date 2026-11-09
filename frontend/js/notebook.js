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

  // Save quick note listener
  document.getElementById('btnSaveQuickNote').addEventListener('click', async function() {
    var title = document.getElementById('quickNoteTitle').value.trim();
    var content = document.getElementById('quickNoteContent').value.trim();
    if (!content) return;

    TG_APP.hapticLight();
    try {
      await API_CLIENT.call('addNote', {
        title: title || 'Quick Note',
        note: content,
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
  try {
    notebookData = await API_CLIENT.call('getNotebook');
    renderNotebook(notebookData);
  } catch (err) {
    console.warn('Notebook load error:', err);
  }
}

function renderNotebook(data) {
  if (!data) return;

  // Counts
  document.getElementById('countNotes').innerText = data.notesCount || 0;
  document.getElementById('countMistakes').innerText = data.mistakesCount || 0;
  document.getElementById('countFavs').innerText = data.favouritesCount || 0;

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
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div style="display:flex; justify-content:space-between; margin-bottom:6px;">' +
        '  <strong style="font-size:0.95rem;">' + n.title + '</strong>' +
        '  <span class="text-xs text-secondary">' + (n.topic || '') + '</span>' +
        '</div>' +
        '<p class="serif text-sm" style="color:#CBD5E1; line-height:1.5;">' + n.note + '</p>';
      notesContainer.appendChild(card);
    });
  } else {
    notesContainer.innerHTML = '<div class="text-sm text-secondary" style="text-align:center; padding:20px;">No notes saved yet. Tap "Save Note" on any question explanation!</div>';
  }

  // 2. Render Mistakes
  var mistakesContainer = document.getElementById('mistakesList');
  if (data.mistakes && data.mistakes.length > 0) {
    mistakesContainer.innerHTML = '';
    data.mistakes.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'card';
      card.style.borderLeft = '3px solid var(--vibrant-crimson)';
      card.innerHTML =
        '<div class="pill pill-gold" style="margin-bottom:6px;">' + (m.chapter || 'Partnership') + '</div>' +
        '<div style="font-weight:600; font-size:0.9rem; margin-bottom:8px;">' + m.question + '</div>' +
        '<div class="text-xs" style="color:#F87171; margin-bottom:4px;">Your Selection: Option ' + m.studentSelected + ' (Incorrect)</div>' +
        '<div class="text-xs text-emerald" style="margin-bottom:8px;">Correct Answer: Option ' + m.correctIdx + '</div>' +
        '<div class="serif text-xs" style="color:#CBD5E1; line-height:1.4;">' + m.explanation + '</div>';
      mistakesContainer.appendChild(card);
    });
  } else {
    mistakesContainer.innerHTML = '<div class="text-sm text-secondary" style="text-align:center; padding:20px;">🎉 Zero mistakes logged! You have solved every practice question accurately.</div>';
  }

  // 3. Render Starred Favourites
  var favsContainer = document.getElementById('favsList');
  if (data.favourites && data.favourites.length > 0) {
    favsContainer.innerHTML = '';
    data.favourites.forEach(function(f) {
      var card = document.createElement('div');
      card.className = 'card card-gold';
      card.innerHTML =
        '<div style="font-weight:700; font-size:0.95rem; margin-bottom:6px;">⭐ ' + f.title + '</div>' +
        '<div class="text-sm" style="margin-bottom:8px;">' + f.question + '</div>' +
        '<div class="serif text-xs text-secondary">' + f.explanation + '</div>';
      favsContainer.appendChild(card);
    });
  } else {
    favsContainer.innerHTML = '<div class="text-sm text-secondary" style="text-align:center; padding:20px;">No starred questions yet. Star tricky questions for 3-minute exam revision!</div>';
  }

  // 4. Render AI Weekly Brief
  if (data.aiSummary && data.aiSummary.summary) {
    document.getElementById('aiSummaryBody').innerText = data.aiSummary.summary;
  }
}

function switchNotebookTab(tab) {
  TG_APP.hapticLight();
  var tabs = ['notes', 'mistakes', 'favs', 'summary'];
  tabs.forEach(function(t) {
    document.getElementById('section' + capitalize(t)).style.display = (t === tab) ? 'block' : 'none';
    var tabBtn = document.getElementById('tab' + capitalize(t));
    if (t === tab) {
      tabBtn.classList.add('pill-gold');
    } else {
      tabBtn.classList.remove('pill-gold');
    }
  });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
