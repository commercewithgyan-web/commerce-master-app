/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — RED-PEN CONTROLLER (redpen.js)
 * Client-Side HTML5 Canvas Compression Engine (1280px / 70% JPEG),
 * Double-Vault Gatekeeper OCR & Forensic CBSE Examiner Evaluation.
 * ═══════════════════════════════════════════════════════════════════════
 */

var compressedBase64 = null;

document.addEventListener('DOMContentLoaded', function() {
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

  var fileInput = document.getElementById('cameraInput');
  var rejFileInput = document.getElementById('rejectionCameraInput');
  var btnAnalyze = document.getElementById('btnAnalyzeCopy');

  function handleFileSelected(e) {
    if (e.target.files && e.target.files[0]) {
      compressImageClientSide(e.target.files[0]);
    }
  }

  if (fileInput) fileInput.addEventListener('change', handleFileSelected);
  if (rejFileInput) rejFileInput.addEventListener('change', handleFileSelected);

  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async function() {
      if (!compressedBase64) return;
      TG_APP.hapticMedium();

      btnAnalyze.innerText = '⏳ Analyzing Handwriting & Formatting...';
      btnAnalyze.disabled = true;

      // Hide previous cards during analysis
      var resultCard = document.getElementById('resultCard');
      var rejectionCard = document.getElementById('rejectionCard');
      if (resultCard) resultCard.style.display = 'none';
      if (rejectionCard) rejectionCard.style.display = 'none';

      var studentName = "Gyan Sir";
      var telegramId = "552858970";
      try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
          studentName = window.Telegram.WebApp.initDataUnsafe.user.first_name || "Champion";
          telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id || "552858970");
        }
      } catch (tgErr) {}

      try {
        var res = await API_CLIENT.call('runRedPenAnalysis', {
          imageBase64: compressedBase64,
          studentName: studentName,
          telegramId: telegramId
        });

        if (!res) {
          throw new Error('No evaluation received from server.');
        }

        // Gatekeeper Check: Validate if image is genuine handwritten solution
        if (res.isValid === false || res.isValidHandwriting === false) {
          TG_APP.hapticError();
          showRejectionNotice(res.rejectionReason || res.rejectionMessage || '⚠️ This is not a handwritten register solution! Please upload a clear photo of your handwritten notebook answer.');
        } else {
          TG_APP.hapticSuccess();
          renderDoubleVaultReport(res, studentName);
        }
      } catch (err) {
        console.error('RedPen OCR error:', err);
        TG_APP.hapticError();
        alert('⚠️ Evaluation Notice: ' + (err.message || 'Could not evaluate image. Please try again with a clearer photo.'));
      } finally {
        btnAnalyze.innerText = '🔍 Run Red-Pen Copy Analysis';
        btnAnalyze.disabled = false;
      }
    });
  }
});

/**
 * Compresses raw photo using HTML5 canvas to max 1280px / 70% JPEG (~200 KB)
 */
function compressImageClientSide(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.getElementById('compressionCanvas');
      var maxDim = 1280;
      var width = img.width;
      var height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Export as 70% quality JPEG
      compressedBase64 = canvas.toDataURL('image/jpeg', 0.70);

      // Calculate approximate size in KB
      var sizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);

      // Show preview
      var previewCard = document.getElementById('previewCard');
      if (previewCard) previewCard.style.display = 'block';

      var imgPreview = document.getElementById('imagePreview');
      if (imgPreview) imgPreview.src = compressedBase64;

      var sizeBadge = document.getElementById('fileSizeBadge');
      if (sizeBadge) sizeBadge.innerText = '✅ Photo Ready (' + sizeKB + ' KB)';

      // Hide older outputs on new upload
      var resultCard = document.getElementById('resultCard');
      if (resultCard) resultCard.style.display = 'none';

      var rejectionCard = document.getElementById('rejectionCard');
      if (rejectionCard) rejectionCard.style.display = 'none';

      TG_APP.hapticLight();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Displays rejection card when uploaded image is a screenshot or not handwritten
 */
function showRejectionNotice(message) {
  var resultCard = document.getElementById('resultCard');
  if (resultCard) resultCard.style.display = 'none';

  var rejectionCard = document.getElementById('rejectionCard');
  if (rejectionCard) {
    var msgEl = document.getElementById('rejectionMessage');
    if (msgEl) msgEl.innerText = message;
    rejectionCard.style.display = 'block';
    rejectionCard.scrollIntoView({ behavior: 'smooth' });
  } else {
    alert(message);
  }
}

/**
 * Renders One-on-One Mentor Desk Evaluation Report
 */
function renderDoubleVaultReport(data, studentName) {
  var rejectionCard = document.getElementById('rejectionCard');
  if (rejectionCard) rejectionCard.style.display = 'none';

  var resultCard = document.getElementById('resultCard');
  if (!resultCard) return;

  var evalData = data.evaluation || data;
  var cls = data.classification || {};

  // 1. Board Match Banner
  var boardMatchEl = document.getElementById('resBoardMatch');
  if (boardMatchEl) {
    boardMatchEl.innerText = evalData.boardContext || evalData.boardExamMatch || "CBSE Board Exam Standard Match";
  }

  // 2. Header: Subject Badge & Score Pill
  var subEl = document.getElementById('resSubject');
  if (subEl) {
    var classPrefix = cls.classLevel ? ('Class ' + cls.classLevel + ' ') : 'Class 12 ';
    var subj = cls.subject || data.detectedSubject || 'Commerce';
    var ch = cls.chapterName ? (' • ' + cls.chapterName) : '';
    subEl.innerText = classPrefix + subj + ch;
  }

  var scoreEl = document.getElementById('resScore');
  if (scoreEl) {
    scoreEl.innerText = evalData.score || "Evaluated";
  }

  // 3. Render Desk Greeting
  var greetingEl = document.getElementById('resGreeting');
  if (greetingEl) {
    var greetingText = evalData.deskGreeting || ("इधर आओ " + (studentName || "Champion") + ", अपनी कॉपी सामने रखो! तुमने कोशिश बहुत अच्छी की है, लेकिन ध्यान से देखो कि जो नंबर कटे हैं वो कहाँ और क्यों कटे:");
    greetingEl.innerHTML = '<p class="desk-greeting">🗣️ ' + escapeHtml(greetingText) + '</p>';
  }

  // 4. Render Presentation Advice
  var presBox = document.getElementById('presentationAuditBox');
  var presEl = document.getElementById('resPresentationAdvice');
  if (presEl && evalData.presentationAdvice) {
    presEl.innerText = evalData.presentationAdvice;
    if (presBox) presBox.style.display = 'block';
  } else if (presBox) {
    presBox.style.display = 'none';
  }

  // 5. Render "Aise Nahi, Aise Likhte" Surgical Comparisons
  var list = document.getElementById('resSurgeryList');
  if (list) {
    var comparisons = evalData.surgicalComparisons || [];
    if (comparisons.length === 0) {
      list.innerHTML = '<div style="font-size:13.5px; color:#34D399; padding:12px; text-align:center; background:#151922; border-radius:12px;">🌟 शाबाश! कोई बड़ी गलती नहीं मिली। तुम्हारी भाषा और कीवर्ड्स एनसीईआरटी के बिल्कुल अनुरूप हैं!</div>';
    } else {
      list.innerHTML = comparisons.map(function(c) {
        return (
          '<div class="mentor-desk-card">' +
          '  <div class="you-wrote">' +
          '    <span class="label-wrong">❌ तुमने लिखा:</span>' +
          '    <p class="quote-text">"' + escapeHtml(c.whatYouWrote || '') + '"</p>' +
          '  </div>' +
          '  <div class="missed-point">' +
          '    <span class="label-warn">⚠️ गलती & छूटा हुआ पॉइंट:</span>' +
          '    <p>' + escapeHtml(c.mistakeAndMissedPoint || '') + '</p>' +
          '  </div>' +
          '  <div class="better-way">' +
          '    <span class="label-better">✅ अगर ऐसे नहीं, ऐसे लिखते तो ज्यादा बेटर होता:</span>' +
          '    <p class="model-rewrite">"' + escapeHtml(c.betterWayToWrite || '') + '"</p>' +
          '  </div>' +
          '  <div class="penalty-tag">' + escapeHtml(c.marksImpact || '-0.5 Marks') + '</div>' +
          '</div>'
        );
      }).join('');
    }
  }

  // 6. Render Motivational Closer
  var motiBox = document.getElementById('motivationalBox');
  if (motiBox) {
    var closerText = evalData.motivationalCloser || ("परेशान बिल्कुल मत होना " + (studentName || "Champion") + "! गलतियाँ अभी पकड़ में आ रही हैं तो बोर्ड एग्जाम में 100/100 पक्के होंगे। मुझे तुम पर पूरा भरोसा है, शाबाश! 🔥");
    motiBox.innerHTML = '<p class="mentor-boost">💪 ' + escapeHtml(closerText) + '</p>';
  }

  resultCard.style.display = 'block';
  resultCard.classList.add('pop-success');
  resultCard.scrollIntoView({ behavior: 'smooth' });
}
  resultCard.scrollIntoView({ behavior: 'smooth' });
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\s*-\s*/g, '<br>• ')
    .replace(/\n\s*\d+\.\s*/g, '<br>1. ')
    .replace(/\n/g, '<br>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
