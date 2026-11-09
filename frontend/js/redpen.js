/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v3.0 — RED-PEN 5-STEP EVALUATOR (redpen.js)
 * Client-Side Canvas Compression + 5-Step Pedagogical CBSE Evaluation
 * Edge-to-Edge UI, Zero Wasted Margins, Full-Width Cards.
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

  function triggerCamera() {
    TG_APP.hapticLight();
    if (cameraInput) { cameraInput.value = ''; cameraInput.click(); }
  }

  function triggerGallery() {
    TG_APP.hapticLight();
    if (galleryInput) { galleryInput.value = ''; galleryInput.click(); }
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

  // Analysis Button
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async function() {
      if (!compressedBase64) {
        alert('⚠️ Please select or take a photo of your register first.');
        return;
      }
      TG_APP.hapticMedium();

      // Show analysis loading state
      var analysisLoader = document.getElementById('analysisLoadingCard');
      var previewCard = document.getElementById('previewCard');
      var resultCard = document.getElementById('resultCard');
      var rejectionCard = document.getElementById('rejectionCard');
      if (previewCard) previewCard.style.display = 'none';
      if (resultCard) resultCard.style.display = 'none';
      if (rejectionCard) rejectionCard.style.display = 'none';
      if (analysisLoader) analysisLoader.style.display = 'block';

      btnAnalyze.innerText = '⏳ ज्ञान सर कॉपी चेक कर रहे हैं...';
      btnAnalyze.disabled = true;

      var studentName = "Champion";
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

        if (res.isValid === false || res.isValidHandwriting === false) {
          TG_APP.hapticError();
          if (analysisLoader) analysisLoader.style.display = 'none';
          if (previewCard) previewCard.style.display = 'block';
          showRejectionNotice(res.rejectionReason || res.rejectionMessage || '⚠️ This is not a handwritten register solution!');
        } else {
          TG_APP.hapticSuccess();
          render5StepReport(res, studentName);
        }
      } catch (err) {
        console.error('RedPen OCR error:', err);
        TG_APP.hapticError();
        if (analysisLoader) analysisLoader.style.display = 'none';
        if (previewCard) previewCard.style.display = 'block';
        alert('⚠️ Evaluation Notice: ' + (err.message || 'Could not evaluate image. Please try again.'));
      } finally {
        btnAnalyze.innerText = '🔍 Run Gyan Sir\'s 5-Step Copy Analysis';
        btnAnalyze.disabled = false;
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// CLIENT-SIDE IMAGE COMPRESSION (1280px / 72% JPEG)
// ═══════════════════════════════════════════════════════════════

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

  var blobUrl = null;
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    try { blobUrl = URL.createObjectURL(file); } catch (e) { blobUrl = null; }
  }

  var img = new Image();

  function onImageLoaded() {
    try {
      var canvas = document.getElementById('compressionCanvas') || document.createElement('canvas');
      var maxDim = 1280;
      var width = img.naturalWidth || img.width;
      var height = img.naturalHeight || img.height;
      if (!width || !height) throw new Error('Invalid image dimensions');

      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      canvas.width = width; canvas.height = height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
      var sizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
      showPreview(sizeKB);
      TG_APP.hapticSuccess();
    } catch (err) {
      console.warn('Canvas compression failed:', err);
      fallbackDirectRead(file);
    } finally {
      if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }
    }
  }

  img.onload = onImageLoaded;
  img.onerror = function() {
    if (blobUrl) { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }
    fallbackDirectRead(file);
  };

  if (blobUrl) { img.src = blobUrl; } else { fallbackDirectRead(file); }
}

function fallbackDirectRead(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    var fallbackImg = new Image();
    fallbackImg.onload = function() {
      try {
        var canvas = document.getElementById('compressionCanvas') || document.createElement('canvas');
        var maxDim = 1280;
        var w = fallbackImg.naturalWidth || fallbackImg.width;
        var h = fallbackImg.naturalHeight || fallbackImg.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(fallbackImg, 0, 0, w, h);
        compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
      } catch (e) { compressedBase64 = event.target.result; }
      var sizeKB = Math.round((compressedBase64.length * 3) / 4 / 1024);
      showPreview(sizeKB);
      TG_APP.hapticSuccess();
    };
    fallbackImg.onerror = function() {
      var loadingCard = document.getElementById('imageLoadingCard');
      if (loadingCard) loadingCard.style.display = 'none';
      alert('⚠️ Could not open the selected photo.');
    };
    fallbackImg.src = event.target.result;
  };
  reader.onerror = function() {
    var loadingCard = document.getElementById('imageLoadingCard');
    if (loadingCard) loadingCard.style.display = 'none';
    alert('⚠️ Error reading photo file.');
  };
  reader.readAsDataURL(file);
}

function showPreview(sizeKB) {
  var loadingCard = document.getElementById('imageLoadingCard');
  var previewCard = document.getElementById('previewCard');
  if (loadingCard) loadingCard.style.display = 'none';
  if (previewCard) { previewCard.style.display = 'block'; previewCard.scrollIntoView({ behavior: 'smooth' }); }
  var imgPreview = document.getElementById('imagePreview');
  if (imgPreview) imgPreview.src = compressedBase64;
  var sizeBadge = document.getElementById('fileSizeBadge');
  if (sizeBadge) sizeBadge.innerText = '✅ Photo Ready (' + sizeKB + ' KB)';
}

// ═══════════════════════════════════════════════════════════════
// REJECTION NOTICE
// ═══════════════════════════════════════════════════════════════

function showRejectionNotice(message) {
  var resultCard = document.getElementById('resultCard');
  if (resultCard) resultCard.style.display = 'none';
  var rejectionCard = document.getElementById('rejectionCard');
  if (rejectionCard) {
    var msgEl = document.getElementById('rejectionMessage');
    if (msgEl) msgEl.innerText = message;
    rejectionCard.style.display = 'block';
    rejectionCard.scrollIntoView({ behavior: 'smooth' });
  } else { alert(message); }
}

// ═══════════════════════════════════════════════════════════════
// 5-STEP PEDAGOGICAL REPORT RENDERER (STRICT FORENSIC CBSE AUDIT)
// ═══════════════════════════════════════════════════════════════

function render5StepReport(data, studentName) {
  var uploadSection = document.getElementById('uploadSection');
  var resultCard = document.getElementById('resultCard');
  if (!resultCard) return;

  var evalData = data.evaluation || data;
  var cls = data.classification || {};

  var classLvl = cls.classLevel || '12';
  var subj = cls.subject || 'Commerce';
  var chName = cls.chapterName || '';
  var subjectLabel = 'Class ' + classLvl + ' ' + subj + (chName ? ' • ' + chName : '');

  // Score Resolution
  var totalMarks = parseFloat(evalData.totalMarks) || 3.0;
  var awardedScore = parseFloat(evalData.awardedScore) || 0;
  var scoreDisplay = evalData.scoreDisplay || evalData.score || '';
  if (!evalData.awardedScore && scoreDisplay) {
    var match = String(scoreDisplay).match(/([\d\.]+)\s*\/\s*([\d\.]+)/);
    if (match) {
      awardedScore = parseFloat(match[1]);
      totalMarks = parseFloat(match[2]);
    }
  }
  if (!scoreDisplay) {
    scoreDisplay = awardedScore.toFixed(1) + ' / ' + totalMarks.toFixed(1) + ' Marks';
  }
  var isFullMarks = (awardedScore >= totalMarks && totalMarks > 0);

  // ── Step 1: Question Analysis & Demand ──────────────────────────────
  var step1 = evalData.step1_questionAnalysis || {};
  var qSummary = step1.questionSummary || cls.transcribedQuestion || 'CBSE Board Question';
  var qLimit = step1.cbseRecommendedLimit || step1.boardMarksAndLimit || (totalMarks.toFixed(1) + ' Marks | 50-75 words');
  var qDemand = step1.expectedDemand || step1.whatExaminerWanted || 'State key features and principles with legal definitions';

  var step1Html =
    '<div class="eval-step-card">' +
    '  <div class="step-header step-1-header">🔍 Step 1: सवाल का एनालिसिस & बोर्ड डिमांड</div>' +
    '  <p class="step1-detail"><strong>सवाल:</strong> ' + esc(qSummary) + '</p>' +
    '  <p class="step1-detail"><strong>CBSE मानक सीमा:</strong> ' + esc(qLimit) + '</p>' +
    '  <p class="step1-detail"><strong>एग्जामिनर क्या देखना चाहता था:</strong> ' + esc(qDemand) + '</p>' +
    '</div>';

  // ── Step 2: Specific Mistakes & Omissions ───────────────────────────
  var mistakes = evalData.step2_mistakesAndOmissions || [];
  var step2Items = '';
  for (var i = 0; i < mistakes.length; i++) {
    var m = mistakes[i];
    var studentLine = m.studentLine || m.flawLine || '';
    var factualMistake = m.factualMistake || m.flaw || 'त्रुटि दर्ज की गई';
    var omittedKeyword = m.omittedNcertKeyword || '';
    var deduction = m.marksDeducted || m.deduction || '-0.5 Marks';

    step2Items +=
      '<div class="mistake-box">' +
        (studentLine ? '<div style="font-size: 12.5px; color: #FCA5A5; margin-bottom: 5px; line-height: 1.4;"><strong>❌ तुम्हारी लाइन:</strong> "' + esc(studentLine) + '"</div>' : '') +
        '<div class="flaw-text">⚠️ ' + esc(factualMistake) + '</div>' +
        (omittedKeyword ? '<div style="font-size: 12px; color: #FBBF24; margin-top: 5px;"><strong>📌 छूटा हुआ NCERT कीवर्ड:</strong> <span style="text-decoration: underline;">' + esc(omittedKeyword) + '</span></div>' : '') +
        '<div class="deduction-tag">Deduction: ' + esc(deduction) + '</div>' +
      '</div>';
  }

  // Strictly eliminate false praise when marks are deducted
  if (mistakes.length === 0) {
    if (isFullMarks) {
      step2Items = '<div style="color: #34D399; font-size: 13.5px; text-align: center; padding: 12px; font-weight: 700;">💯 पूर्ण अंक (Full Marks)! सभी तकनीकी शब्द और बिंदु शत-प्रतिशत सटीक हैं।</div>';
    } else {
      var diffMarks = (totalMarks - awardedScore).toFixed(1);
      step2Items = '<div class="mistake-box" style="border-left-color: #EF4444;"><div class="flaw-text">⚠️ CBSE मार्किंग स्कीम के अनुसार भाषा और कीवर्ड्स में सुधार की ज़रूरत है (विस्तृत मॉडल उत्तर नीचे देखें)।</div><div class="deduction-tag">Deduction: -' + diffMarks + ' Marks</div></div>';
    }
  }

  var step2Html =
    '<div class="eval-step-card">' +
    '  <div class="step-header step-2-header">❌ Step 2: तुमने क्या गलतियाँ कीं और क्या छोड़ दिया</div>' +
    step2Items +
    '</div>';

  // ── Step 3: How to Rephrase (Aise Nahi, Aise Likho) ────────────────
  var rephrases = evalData.step3_howToRephrase || [];
  var step3Items = '';
  for (var j = 0; j < rephrases.length; j++) {
    var r = rephrases[j];
    var flawed = r.originalFlawed || r.whatYouWrote || '';
    var corrected = r.correctedVersion || r.howToRephrase || '';

    step3Items +=
      '<div class="correction-row">' +
        (flawed ? '<div><span class="was-text">❌ "' + esc(flawed) + '"</span></div>' : '') +
        '<div style="margin-top: 5px;"><span class="should-be-text">✅ बेहतर तरीका: "' + esc(corrected) + '"</span></div>' +
      '</div>';
  }

  // Strictly eliminate false praise when marks are deducted
  if (rephrases.length === 0) {
    if (isFullMarks) {
      step3Items = '<div style="color: #34D399; font-size: 13.5px; text-align: center; padding: 12px; font-weight: 700;">💯 वाक्य संरचना और NCERT टर्मिनोलॉजी बिल्कुल सही है।</div>';
    } else {
      step3Items = '<div class="correction-row"><span class="should-be-text">⚠️ महत्वपूर्ण तकनीकी शब्दों और प्रेजेंटेशन को बेहतर बनाने के लिए नीचे दिया गया मॉडल उत्तर देखें।</span></div>';
    }
  }

  var step3Html =
    '<div class="eval-step-card">' +
    '  <div class="step-header step-3-header">✍️ Step 3: ऐसे नहीं, ऐसे लिखा जाना चाहिए था</div>' +
    step3Items +
    '</div>';

  // ── Step 4: Complete Model Solution with Highlighted Keywords ───────
  var modelPts = evalData.step4_completeModelSolution || [];
  var step4Items = '';
  for (var k = 0; k < modelPts.length; k++) {
    var pt = modelPts[k];
    var pNum = pt.pointNumber ? (pt.pointNumber + ' ') : '';
    var heading = pt.heading ? (pNum + pt.heading) : ('Point ' + (k + 1));
    var ideal = pt.idealText || pt.bodyWithHighlightedKeywords || '';

    step4Items +=
      '<div class="model-point">' +
        '<div class="point-heading">' + esc(heading) + '</div>' +
        '<div>' + sanitizeModelHtml(ideal) + '</div>' +
      '</div>';
  }
  var step4Html =
    '<div class="eval-step-card">' +
    '  <div class="step-header step-4-header">🏆 Step 4: CBSE 100/100 परफेक्ट मॉडल उत्तर (रजिस्टर में नोट करो)</div>' +
    '  <div class="model-solution-box">' + step4Items + '</div>' +
    '</div>';

  // ── Step 5: Motivational Closer ─────────────────────────────────────
  var closer = evalData.step5_motivationalCloser || ('परेशान बिल्कुल मत होना ' + (studentName || 'Champion') + '! गलतियाँ अभी पकड़ में आ रही हैं तो बोर्ड एग्जाम में 100/100 पक्के होंगे। मुझे तुम पर पूरा भरोसा है, शाबाश! 🔥');
  var step5Html = '<div class="step-5-card">💪 <strong>ज्ञान सर का संदेश:</strong> ' + esc(closer) + '</div>';

  // "Check Another Copy" Button
  var checkAnotherBtn = '<button type="button" class="btn-check-another" id="btnCheckAnother">📸 एक और कॉपी चेक करें</button>';

  // Assemble Full Report
  resultCard.innerHTML =
    '<div class="redpen-score-header">' +
    '  <span class="subject-tag">' + esc(subjectLabel) + '</span>' +
    '  <span class="score-badge">' + esc(scoreDisplay) + '</span>' +
    '</div>' +
    step1Html + step2Html + step3Html + step4Html + step5Html + checkAnotherBtn;

  // Hide upload, show result
  if (uploadSection) uploadSection.style.display = 'none';
  var analysisLoader = document.getElementById('analysisLoadingCard');
  if (analysisLoader) analysisLoader.style.display = 'none';
  resultCard.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Wire "Check Another" button
  var btnAnother = document.getElementById('btnCheckAnother');
  if (btnAnother) {
    btnAnother.addEventListener('click', function() {
      TG_APP.hapticLight();
      compressedBase64 = null;
      resultCard.style.display = 'none';
      resultCard.innerHTML = '';
      if (uploadSection) uploadSection.style.display = 'block';
      var previewCard = document.getElementById('previewCard');
      if (previewCard) previewCard.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Allows ONLY <mark class="highlight-keyword"> tags through for NCERT keyword highlighting.
 * All other HTML is escaped for safety.
 */
function sanitizeModelHtml(str) {
  // First escape everything
  var escaped = esc(str);
  // Then restore only <mark class="highlight-keyword">...</mark>
  escaped = escaped.replace(/&lt;mark\s+class=(&quot;|&#39;)highlight-keyword(&quot;|&#39;)&gt;/gi, '<mark class="highlight-keyword">');
  escaped = escaped.replace(/&lt;\/mark&gt;/gi, '</mark>');
  return escaped;
}
