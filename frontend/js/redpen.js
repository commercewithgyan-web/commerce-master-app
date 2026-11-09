/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — RED-PEN CONTROLLER (redpen.js)
 * Client-Side HTML5 Canvas Compression Engine (1280px / 70% JPEG)
 * and Real Gemini 2.5 Flash Vision Forensic Evaluation.
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

      // Hide previous reports or rejection cards during analysis
      var reportCard = document.getElementById('reportCard');
      var rejectionCard = document.getElementById('rejectionCard');
      if (reportCard) reportCard.style.display = 'none';
      if (rejectionCard) rejectionCard.style.display = 'none';

      try {
        var res = await API_CLIENT.call('submitRedPenCopy', {
          imageBase64: compressedBase64,
          pagesBase64: [compressedBase64]
        });

        if (!res) {
          throw new Error('No evaluation received from server.');
        }

        // Forensic check: Validate if image is actually a handwritten notebook solution
        if (res.isValidHandwriting === false) {
          TG_APP.hapticError();
          showRejectionNotice(res.rejectionMessage || '⚠️ This is not a handwritten register solution! It looks like a screenshot or printed page. Please upload a clear photo of your handwritten notebook answer.');
        } else {
          TG_APP.hapticSuccess();
          renderRedPenReport(res);
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
 * Compresses raw high-res photo using HTML5 canvas
 * Clamps width to max 1280px at 70% JPEG quality (~200 KB)
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
      var reportCard = document.getElementById('reportCard');
      if (reportCard) reportCard.style.display = 'none';

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
 * @param {string} message
 */
function showRejectionNotice(message) {
  var reportCard = document.getElementById('reportCard');
  if (reportCard) reportCard.style.display = 'none';

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
 * Renders verified handwritten evaluation report
 * @param {Object} data
 */
function renderRedPenReport(data) {
  var rejectionCard = document.getElementById('rejectionCard');
  if (rejectionCard) rejectionCard.style.display = 'none';

  var reportCard = document.getElementById('reportCard');
  if (!reportCard) return;

  reportCard.style.display = 'block';
  reportCard.classList.add('pop-success');

  // Subject Badge
  var subjectBadge = document.getElementById('subjectBadge');
  if (subjectBadge) {
    if (data.detectedSubject) {
      subjectBadge.innerText = data.detectedSubject;
      subjectBadge.style.display = 'inline-block';
    } else {
      subjectBadge.style.display = 'none';
    }
  }

  // Score display
  var displayScore = data.score || (data.estimatedMarks !== undefined ? (data.estimatedMarks + ' / ' + (data.maxMarks || 6.0) + ' Marks') : 'Evaluated');
  var marksEl = document.getElementById('marksDisplay');
  if (marksEl) marksEl.innerText = displayScore;

  // Flawless elements
  var flawlessList = document.getElementById('flawlessList');
  if (flawlessList) {
    flawlessList.innerHTML = '';
    var flawlessItems = data.flawlessElements || [];
    if (flawlessItems.length === 0) {
      var li = document.createElement('li');
      li.innerText = 'Handwriting is clear and solution steps are legible.';
      flawlessList.appendChild(li);
    } else {
      flawlessItems.forEach(function(item) {
        var li = document.createElement('li');
        li.innerText = item;
        flawlessList.appendChild(li);
      });
    }
  }

  // Traps caught
  var trapsList = document.getElementById('trapsList');
  if (trapsList) {
    trapsList.innerHTML = '';
    var trapItems = data.trapsCaught || [];
    if (trapItems.length === 0) {
      var li = document.createElement('li');
      li.innerText = 'No major CBSE presentation traps detected.';
      trapsList.appendChild(li);
    } else {
      trapItems.forEach(function(item) {
        var li = document.createElement('li');
        li.innerText = item;
        trapsList.appendChild(li);
      });
    }
  }

  // Prescription
  var prescEl = document.getElementById('prescriptionText');
  if (prescEl) {
    prescEl.innerText = data.prescription || 'Maintain clean double-underline borders and complete all question parts.';
  }

  reportCard.scrollIntoView({ behavior: 'smooth' });
}
