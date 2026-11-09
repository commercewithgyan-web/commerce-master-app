/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — PROGRESS & HEATMAP CONTROLLER (progress.js)
 * CBSE 80/80 Predicted Score Calculator, Marks-Leak Detector,
 * and Chapter Weightage Radar.
 * ═══════════════════════════════════════════════════════════════════════
 */

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

  // 1. Instant 0ms render from cache
  var cached = API_CLIENT.getCached('getProgress');
  if (cached) {
    renderProgress(cached);
  }

  try {
    // 2. Fetch fresh live progress in background and update
    var data = await API_CLIENT.call('getProgress');
    if (data && data.chapters && data.chapters.length > 0) {
      renderProgress(data);
    } else if (!cached) {
      renderProgress(getDefaultProgressData());
    }
  } catch (err) {
    console.error('Progress load notice:', err);
    if (!cached) {
      renderProgress(getDefaultProgressData());
    }
  }
});

function getDefaultProgressData() {
  return {
    overallAccuracy: 85,
    predictedBoardScore: 68,
    predictedPercentage: 85,
    weakTopics: ['Accounting for Share Capital'],
    chapters: [
      { chapterNo: '1', chapterName: 'Accounting for Partnership Firms - Fundamentals', totalMarks: 36, accuracy: 82 },
      { chapterNo: '2', chapterName: 'Reconstitution of a Partnership Firm', totalMarks: 24, accuracy: 78 },
      { chapterNo: '3', chapterName: 'Admission of a Partner', totalMarks: 24, accuracy: 80 },
      { chapterNo: '4', chapterName: 'Retirement and Death of a Partner', totalMarks: 24, accuracy: 74 },
      { chapterNo: '5', chapterName: 'Dissolution of Partnership Firm', totalMarks: 16, accuracy: 85 },
      { chapterNo: '6', chapterName: 'Accounting for Share Capital', totalMarks: 20, accuracy: 52 },
      { chapterNo: '7', chapterName: 'Issue and Redemption of Debentures', totalMarks: 12, accuracy: 76 },
      { chapterNo: '8', chapterName: 'Financial Statements of a Company', totalMarks: 12, accuracy: 88 },
      { chapterNo: '9', chapterName: 'Analysis of Financial Statements', totalMarks: 12, accuracy: 80 },
      { chapterNo: '10', chapterName: 'Cash Flow Statement', totalMarks: 8, accuracy: 75 }
    ]
  };
}

function renderProgress(data) {
  if (!data) return;

  document.getElementById('overallAccuracyBadge').innerText = (data.overallAccuracy || 75) + '% Accuracy';
  document.getElementById('predScoreLarge').innerText = data.predictedBoardScore || 68;
  document.getElementById('predPercentage').innerText = (data.predictedPercentage || 85) + '%';

  // Marks Leak Alert (Pillar 7)
  if (data.weakTopics && data.weakTopics.length > 0) {
    var leakCard = document.getElementById('marksLeakCard');
    leakCard.style.display = 'block';
    document.getElementById('leakTitle').innerText = data.weakTopics[0] + ' (High Marks Chapter)';
    document.getElementById('leakDesc').innerText =
      'Your historical accuracy on this topic is under 60%. Review Gyan Sir\'s notes and practice 3 targeted questions to lock full marks!';
  }

  // Chapter-wise List
  var container = document.getElementById('chaptersList');
  if (data.chapters && data.chapters.length > 0) {
    container.innerHTML = '';
    data.chapters.forEach(function(ch) {
      var item = document.createElement('div');
      item.style.padding = '10px 0';
      item.style.borderBottom = '1px solid #272B36';

      var barColor = '#10B981';
      if (ch.accuracy < 60) barColor = '#EF4444';
      else if (ch.accuracy < 80) barColor = '#F59E0B';

      item.innerHTML =
        '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
        '  <strong style="font-size:0.88rem;">Ch ' + ch.chapterNo + ': ' + ch.chapterName + '</strong>' +
        '  <span class="mono text-xs" style="color:' + barColor + ';">' + ch.accuracy + '% (' + ch.totalMarks + 'M)</span>' +
        '</div>' +
        '<div style="background:rgba(255,255,255,0.08); height:6px; border-radius:9999px; overflow:hidden;">' +
        '  <div style="width:' + ch.accuracy + '%; height:100%; background:' + barColor + '; border-radius:9999px;"></div>' +
        '</div>';

      container.appendChild(item);
    });
  }
}
