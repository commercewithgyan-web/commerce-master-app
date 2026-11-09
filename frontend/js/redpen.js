/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.5 — RED-PEN CONTROLLER (redpen.js)
 * Client-Side HTML5 Canvas Compression Engine (1280px / 72% JPEG),
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

  // File Inputs & Triggers
  var cameraInput = document.getElementById('cameraInput');
  var galleryInput = document.getElementById('galleryInput');
  var btnTriggerCamera = document.getElementById('btnTriggerCamera');
  var btnTriggerGallery = document.getElementById('btnTriggerGallery');
  var btnChangePhoto = document.getElementById('btnChangePhoto');
  var btnRejCamera = document.getElementById('btnRejCamera');
  var btnRejGallery = document.getElementById('btnRejGallery');
  var btnAnalyze = document.getElementById('btnAnalyzeCopy');

  // Trigger camera file picker
  function triggerCamera() {
    TG_APP.hapticLight();
    if (cameraInput) {
      cameraInput.value = '';
      cameraInput.click();
    }
  }

  // Trigger gallery file picker
  function triggerGallery() {
    TG_APP.hapticLight();
    if (galleryInput) {
      galleryInput.value = '';
      galleryInput.click();
    }
  }

  if (btnTriggerCamera) btnTriggerCamera.addEventListener('click', triggerCamera);
  if (btnTriggerGallery) btnTriggerGallery.addEventListener('click', triggerGallery);
  if (btnChangePhoto) btnChangePhoto.addEventListener('click', triggerGallery);
  if (btnRejCamera) btnRejCamera.addEventListener('click', triggerCamera);
  if (btnRejGallery) btnRejGallery.addEventListener('click', triggerGallery);

  function handleFileSelected(e) {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  }

  if (cameraInput) cameraInput.addEventListener('change', handleFileSelected);
  if (galleryInput) galleryInput.addEventListener('change', handleFileSelected);

  // Analysis Button Event
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async function() {
      if (!compressedBase64) {
        alert('⚠️ Please select or take a photo of your register first.');
        return;
      }
      TG_APP.hapticMedium();

      btnAnalyze.innerText = '⏳ Gyan Sir Reviewing Copy Line-by-Line...';
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
 * Robust Client-Side Image Loader & Canvas Compressor (1280px / 72% JPEG)
 */
function processSelectedFile(file) {
  if (!file) return;

  var loadingCard = document.getElementById('imageLoadingCard');
  var previewCard = document.getElementById('previewCard');
  var rejectionCard = document.getElementById('rejectionCard');
  var resultCard = document.getElementById('resultCard');

  if (loadingCard) loadingCard.style.display = 'block';
  if (previewCard) previewCard.style.display = 'none';
  if (rejectionCard) rejectionCard.style.display = 'none';
  if (resultCard) resultCard.style.display = 'none';

  // Fast path: Try URL.createObjectURL for 0ms lag and minimal memory consumption
  var blobUrl = null;
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      blobUrl = URL.createObjectURL(file);
    } catch (e) {
      blobUrl = null;
    }
  }

  var img = new Image();

  function onImageLoaded() {
    try {
      var canvas = document.getElementById('compressionCanvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
      }

      var maxDim = 1280;
      var width = img.naturalWidth || img.width;
      var height = img.naturalHeight || img.height;

      if (!width || !height) {
        throw new Error('Invalid image dimensions');
      }

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

      // Export as 72% quality JPEG
      compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);

      // Calculate approximate size in KB
      var sizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);

      // Show preview
      if (loadingCard) loadingCard.style.display = 'none';
      if (previewCard) {
        previewCard.style.display = 'block';
        previewCard.scrollIntoView({ behavior: 'smooth' });
      }

      var imgPreview = document.getElementById('imagePreview');
      if (imgPreview) imgPreview.src = compressedBase64;

      var sizeBadge = document.getElementById('fileSizeBadge');
      if (sizeBadge) sizeBadge.innerText = '✅ Photo Ready (' + sizeKB + ' KB)';

      TG_APP.hapticSuccess();
    } catch (err) {
      console.warn('Canvas compression failed, falling back to direct FileReader:', err);
      fallbackDirectRead(file);
    } finally {
      if (blobUrl) {
        try { URL.revokeObjectURL(blobUrl); } catch (revErr) {}
      }
    }
  }

  img.onload = onImageLoaded;

  img.onerror = function() {
    console.warn('Image load error with createObjectURL, attempting FileReader fallback...');
    if (blobUrl) {
      try { URL.revokeObjectURL(blobUrl); } catch (revErr) {}
    }
    fallbackDirectRead(file);
  };

  if (blobUrl) {
    img.src = blobUrl;
  } else {
    fallbackDirectRead(file);
  }
}

/**
 * Fallback direct FileReader for devices where createObjectURL fails
 */
function fallbackDirectRead(file) {
  var loadingCard = document.getElementById('imageLoadingCard');
  var previewCard = document.getElementById('previewCard');

  var reader = new FileReader();
  reader.onload = function(event) {
    var fallbackImg = new Image();
    fallbackImg.onload = function() {
      try {
        var canvas = document.getElementById('compressionCanvas') || document.createElement('canvas');
        var maxDim = 1280;
        var width = fallbackImg.naturalWidth || fallbackImg.width;
        var height = fallbackImg.naturalHeight || fallbackImg.height;

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
        ctx.drawImage(fallbackImg, 0, 0, width, height);
        compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
      } catch (e) {
        // Ultimate fallback: direct raw DataURL
        compressedBase64 = event.target.result;
      }

      var sizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);

      if (loadingCard) loadingCard.style.display = 'none';
      if (previewCard) {
        previewCard.style.display = 'block';
        previewCard.scrollIntoView({ behavior: 'smooth' });
      }

      var imgPreview = document.getElementById('imagePreview');
      if (imgPreview) imgPreview.src = compressedBase64;

      var sizeBadge = document.getElementById('fileSizeBadge');
      if (sizeBadge) sizeBadge.innerText = '✅ Photo Ready (' + sizeKB + ' KB)';

      TG_APP.hapticSuccess();
    };

    fallbackImg.onerror = function() {
      if (loadingCard) loadingCard.style.display = 'none';
      alert('⚠️ Could not open the selected photo. Please choose another image or take a clear photo.');
    };

    fallbackImg.src = event.target.result;
  };

  reader.onerror = function() {
    if (loadingCard) loadingCard.style.display = 'none';
    alert('⚠️ Error reading photo file. Please try again.');
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}