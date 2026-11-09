/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v3.2 — UNIVERSAL CBSE RED-PEN ENGINE (redpen.js)
 * Gatekeeper & Value-Point Step-Check, Zero-Mark Alerts,
 * Sentence Upgrades with Examiner "क्यों?", Collapsible Model Answer with
 * Clean Keyword Highlighting, and Edge-to-Edge CRED-Grade Mobile UI.
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
          showRejectionNotice(res.rejectionReason || res.rejectionMessage || '⚠️ कृपया अपनी कॉपी के हाथ से लिखे उत्तर की फोटो अपलोड करें।');
        } else {
          TG_APP.hapticSuccess();
          renderUniversalRedPenReport(res, studentName);
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
// CLAUDE'S SAFE KEYWORD HIGHLIGHTER & ESCAPE HELPERS
// ═══════════════════════════════════════════════════════════════

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderKeywords(text, keywords) {
  var html = escapeHtml(String(text || '').replace(/\*\*/g, ''));
  (keywords || []).forEach(function(k) {
    var safe = escapeHtml(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!safe) return;
    html = html.replace(new RegExp('(' + safe + ')', 'gi'), '<mark class="highlight-keyword">$1</mark>');
  });
  return html;
}

// ═══════════════════════════════════════════════════════════════
// 5-STEP PEDAGOGICAL REPORT RENDERER (CLAUDE'S UI CONTRACT)
// ═══════════════════════════════════════════════════════════════

function renderUniversalRedPenReport(data, studentName) {
  var uploadSection = document.getElementById('uploadSection');
  var resultCard = document.getElementById('resultCard');
  if (!resultCard) return;

  var r = data.data || data.result || data;

  // Resolve Metadata & Scores
  var meta = r.meta || {};
  var computed = r.computed || {};
  var marksEarned = (computed.marks_earned !== undefined) ? computed.marks_earned : 0;
  var maxMarks = (meta.max_marks !== undefined) ? meta.max_marks : 3;
  var subjectName = meta.subject_name || 'Class 12 Business Studies';
  var qType = meta.question_type ? (' • ' + meta.question_type) : '';

  // Word Check
  var wordCheck = computed.word_check || { count: 0, limit: null, status: 'not_checked' };
  var wordChipText = 'Word Count: ' + wordCheck.count + ' words';
  if (wordCheck.limit && wordCheck.limit.length >= 2) {
    wordChipText += ' (CBSE सीमा: ' + wordCheck.limit[0] + '–' + wordCheck.limit[1] + ')';
  }

  // ── 1. Top Card: Score + Verdict + What You Did Right First ───────
  var step1 = r.step1_earned || {};
  var verdictText = step1.verdict_hi || 'तुमने उत्तर लिखने का बहुत अच्छा प्रयास किया है।';

  var didRightHtml = '';
  var didRightList = step1.did_right_hi || [];
  for (var i = 0; i < didRightList.length; i++) {
    didRightHtml += '<div class="did-right-item"><span>✓</span><span>' + escapeHtml(didRightList[i]) + '</span></div>';
  }

  // Value Point Results
  var vpResultsHtml = '';
  var vpResults = step1.value_point_results || [];
  for (var v = 0; v < vpResults.length; v++) {
    var vp = vpResults[v];
    var badgeClass = vp.status === 'earned' ? 'vp-badge-earned' : (vp.status === 'partial' ? 'vp-badge-partial' : 'vp-badge-missed');
    var badgeLabel = vp.status === 'earned' ? ('+' + vp.marks_awarded + ' Mark') : (vp.status === 'partial' ? ('+' + vp.marks_awarded + ' / ' + vp.marks_max) : '0 Marks');

    vpResultsHtml +=
      '<div class="vp-result-item">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">' +
          '<strong style="color: #F8FAFC;">' + escapeHtml(vp.vp_id) + ': ' + escapeHtml(vp.label || '') + '</strong>' +
          '<span class="' + badgeClass + '">' + escapeHtml(badgeLabel) + '</span>' +
        '</div>' +
        (vp.evidence_quote ? '<div style="font-size: 11.5px; color: #94A3B8; margin-bottom: 2px;"><em>"' + escapeHtml(vp.evidence_quote) + '"</em></div>' : '') +
        '<div style="font-size: 12px; color: #CBD5E1;">' + escapeHtml(vp.reason_hi || '') + '</div>' +
      '</div>';
  }

  var card1Html =
    '<div class="eval-step-card">' +
      '<div class="step-header step-1-header">' +
        '<span>🔍 Step 1: सवाल का एनालिसिस & तुमने क्या सही किया</span>' +
      '</div>' +
      '<div class="verdict-box">🗣️ <strong>ज्ञान सर:</strong> ' + escapeHtml(verdictText) + '</div>' +
      '<div style="margin-bottom: 10px;">' +
        '<span class="word-count-chip">📝 ' + escapeHtml(wordChipText) + '</span>' +
      '</div>' +
      (didRightHtml ? '<div style="margin-bottom: 12px;"><div style="font-size: 12px; font-weight: 700; color: #34D399; margin-bottom: 6px; text-transform: uppercase;">मुख्य ताकतें (Strengths):</div>' + didRightHtml + '</div>' : '') +
      (vpResultsHtml ? '<div><div style="font-size: 12px; font-weight: 700; color: #38BDF8; margin-bottom: 6px; text-transform: uppercase;">CBSE Value Points Breakdown:</div>' + vpResultsHtml + '</div>' : '') +
    '</div>';

  // ── 2. Step 2: Conceptual Issues vs Zero-Mark Alerts ───────────────
  var step2 = r.step2_issues || {};
  var issues = step2.issues || [];
  var alerts = step2.alerts || [];

  var issuesHtml = '';
  for (var j = 0; j < issues.length; j++) {
    var iss = issues[j];
    issuesHtml +=
      '<div class="mistake-box">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">' +
          '<span style="font-size: 11px; font-weight: 700; color: #EF4444; text-transform: uppercase;">[' + escapeHtml(iss.vp_id || '') + ' • ' + escapeHtml(iss.issue_type || 'Conceptual') + ']</span>' +
        '</div>' +
        (iss.student_line ? '<div style="font-size: 12.5px; color: #FCA5A5; margin-bottom: 4px;"><strong>❌ तुम्हारी लाइन:</strong> "' + escapeHtml(iss.student_line) + '"</div>' : '') +
        '<div class="flaw-text">⚠️ ' + escapeHtml(iss.explain_hi || '') + '</div>' +
        (iss.ncert_keyword ? '<div style="font-size: 12px; color: #FBBF24; margin-top: 4px;"><strong>📌 आवश्यक NCERT कीवर्ड:</strong> <span style="text-decoration: underline;">' + escapeHtml(iss.ncert_keyword) + '</span></div>' : '') +
      '</div>';
  }

  // Alerts: Zero-Mark Warnings (Spelling, Handwriting, Ruling)
  var alertsHtml = '';
  for (var a = 0; a < alerts.length; a++) {
    var alt = alerts[a];
    alertsHtml +=
      '<div class="alert-card">' +
        '<div style="font-weight: 700; font-size: 12px; margin-bottom: 3px;">⚠️ ध्यान दो (बोर्ड में नंबर नहीं कटे) • [' + escapeHtml(alt.type || 'Alert') + ']</div>' +
        (alt.student_line ? '<div style="font-size: 12px; color: #FDE047; opacity: 0.9; margin-bottom: 2px;"><em>"' + escapeHtml(alt.student_line) + '"</em></div>' : '') +
        '<div style="font-size: 12px; color: #FEF08A;">' + escapeHtml(alt.note_hi || '') + '</div>' +
      '</div>';
  }

  if (issues.length === 0 && alerts.length === 0) {
    if (marksEarned >= maxMarks) {
      issuesHtml = '<div style="color: #34D399; font-size: 13.5px; text-align: center; padding: 12px; font-weight: 700;">💯 पूर्ण अंक! कोई मार्क्स काटने वाली वैचारिक गलती नहीं मिली।</div>';
    } else {
      issuesHtml = '<div class="mistake-box"><div class="flaw-text">⚠️ CBSE मार्किंग स्कीम के अनुसार भाषा और कीवर्ड्स में सुधार की ज़रूरत है (विस्तृत मॉडल उत्तर नीचे देखें)।</div></div>';
    }
  }

  var card2Html =
    '<div class="eval-step-card">' +
      '<div class="step-header step-2-header">' +
        '<span>❌ Step 2: मार्क्स कटने वाले मुद्दे vs ध्यान देने योग्य बातें</span>' +
      '</div>' +
      issuesHtml +
      alertsHtml +
    '</div>';

  // ── 3. Step 3: Sentence Upgrades with "क्यों?" ─────────────────────
  var upgrades = r.step3_upgrades || [];
  var upgradesHtml = '';
  for (var u = 0; u < upgrades.length; u++) {
    var up = upgrades[u];
    upgradesHtml +=
      '<div class="correction-row">' +
        (up.student_line ? '<div><span class="was-text">❌ "' + escapeHtml(up.student_line) + '"</span></div>' : '') +
        '<div style="margin-top: 5px;"><span class="should-be-text">✅ बेहतर तरीका: "' + escapeHtml(up.better_line || '') + '"</span></div>' +
        (up.why_hi ? '<div class="why-box">💡 <strong>क्यों?</strong> ' + escapeHtml(up.why_hi) + (up.vp_id ? ' <span style="opacity: 0.7;">[' + escapeHtml(up.vp_id) + ']</span>' : '') + '</div>' : '') +
      '</div>';
  }
  if (upgrades.length === 0) {
    upgradesHtml = '<div style="color: #34D399; font-size: 13.5px; text-align: center; padding: 10px;">🌟 वाक्य संरचना और मुख्य तकनीकी शब्दावली बिल्कुल सही है।</div>';
  }

  var card3Html =
    '<div class="eval-step-card">' +
      '<div class="step-header step-3-header">' +
        '<span>✍️ Step 3: ऐसे नहीं, ऐसे लिखा जाना चाहिए था (Sentence Upgrades)</span>' +
      '</div>' +
      upgradesHtml +
    '</div>';

  // ── 4. Step 4: Collapsible Model Solution with Highlighted Keywords ─
  var modelAnswer = r.step4_model_answer || {};
  var points = modelAnswer.points || [];
  var modelPointsHtml = '';
  for (var p = 0; p < points.length; p++) {
    var pt = points[p];
    var heading = pt.heading ? ('Point ' + (p + 1) + ': ' + pt.heading) : ('Point ' + (p + 1));
    var highlightedText = renderKeywords(pt.text, pt.keywords);

    modelPointsHtml +=
      '<div class="model-point">' +
        '<div class="point-heading">' + escapeHtml(heading) + '</div>' +
        '<div style="line-height: 1.6;">' + highlightedText + '</div>' +
      '</div>';
  }

  var card4Html =
    '<div class="eval-step-card">' +
      '<div class="step-header step-4-header">' +
        '<span>🏆 Step 4: CBSE 100/100 परफेक्ट मॉडल उत्तर</span>' +
      '</div>' +
      '<details class="model-details" open>' +
        '<summary class="model-summary">' +
          '<span>💡 पहले खुद सोचो, फिर मॉडल उत्तर देखो</span>' +
          '<span>▼</span>' +
        '</summary>' +
        '<div class="model-solution-box">' +
          modelPointsHtml +
        '</div>' +
      '</details>' +
    '</div>';

  // ── 5. Step 5: Gyan Sir's Punchline & One Action ───────────────────
  var mentor = r.step5_mentor || {};
  var punchline = mentor.line_hi || 'सही शब्द = पक्के नंबर!';
  var oneAction = mentor.one_action_hi || 'अगली कॉपी में सभी मुख्य NCERT कीवर्ड्स को अंडरलाइन करो।';

  var card5Html =
    '<div class="step-5-card">' +
      '<div style="font-size: 15px; font-weight: 800; color: #FDE047; margin-bottom: 6px;">💪 ' + escapeHtml(punchline) + '</div>' +
      '<div style="font-size: 13.5px; color: #F8FAFC;">🎯 <strong>अगला कदम:</strong> ' + escapeHtml(oneAction) + '</div>' +
    '</div>';

  // "Check Another Copy" Button
  var checkAnotherBtn = '<button type="button" class="btn-check-another" id="btnCheckAnother">📸 एक और कॉपी चेक करें</button>';

  // Assemble Full Report
  resultCard.innerHTML =
    '<div class="redpen-score-header">' +
      '<span class="subject-tag">' + escapeHtml(subjectName + qType) + '</span>' +
      '<span class="score-badge">' + marksEarned + ' / ' + maxMarks + ' Marks</span>' +
    '</div>' +
    card1Html + card2Html + card3Html + card4Html + card5Html + checkAnotherBtn;

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
