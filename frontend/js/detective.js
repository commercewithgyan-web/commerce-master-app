/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v3.2 — CASE STUDY LAB (detective.js)
 * CBSE Competency Case Studies (Business Studies, Accountancy, Economics)
 * 2 Structured Questions (Identify Concept + Quote Line),
 * Official CBSE Marking Scheme Breakdown, Confetti & +25 CG Coins.
 * ═══════════════════════════════════════════════════════════════════════
 */

var CASE_VAULT = {
  BST: [
    {
      id: 'BST-01',
      subject: 'Business Studies',
      chapter: 'Principles of Management (Class 12)',
      marks: '4 Marks',
      title: 'Delta Tech Solutions: Team Incentive vs Individual Rivalry',
      scenario: 'Aman is the CEO of "Delta Tech Solutions Ltd.", an enterprise software company. During a critical product rollout, the engineering team worked round the clock to hit customer deadlines. Aman noticed that individual programmers were withholding critical code components from peers to claim individual recognition and bonuses, causing bitter internal friction and deployment delays. Aman immediately assembled all project leads and engineers, introduced a team incentive model where 70% of performance bonuses were linked to collective sprint delivery, and passionately urged employees to replace "I" with "We" to foster mutual trust and belongingness. Furthermore, he mandated fair compensation for all overtime hours worked within the financial capacity of the firm.',
      q1: 'Identify the principle of management highlighted when Aman urged the engineering team to replace "I" with "We" and foster mutual trust.',
      q2: 'Quote the exact line from the case that supports your answer.',
      scheme: {
        conceptTitle: 'Esprit De Corps (Fayol\'s 14th Principle of Management)',
        conceptMarks: '+1 Mark',
        quotedLine: '"Aman immediately assembled all project leads and engineers, introduced a team incentive model where 70% of performance bonuses were linked to collective sprint delivery, and passionately urged employees to replace \'I\' with \'We\' to foster mutual trust and belongingness."',
        quotedMarks: '+1 Mark',
        explanation: 'According to Henri Fayol, management should promote a team spirit of unity and harmony among employees. In large organizations, substituting \'We\' for \'I\' builds mutual trust and belongingness, eliminating the need for formal penalties.',
        explanationMarks: '+2 Marks',
        examinerTip: 'CBSE Examiner Tip: In case-based questions, always give the exact principle heading first, followed by the verbatim sentence quoted in double quotation marks.'
      }
    },
    {
      id: 'BST-02',
      subject: 'Business Studies',
      chapter: 'Planning (Class 12)',
      marks: '4 Marks',
      title: 'Suvidha Garments: Strict Plans vs Fast Fashion Trends',
      scenario: 'Suvidha Garments Ltd. is an ethnic wear brand based in Surat. At the start of the financial year, senior leadership formulated a rigid 12-month operational blueprint specifying fabric purchase schedules, fixed stitching volumes, and unalterable marketing allocations. Four months later, a sudden youth craze for Indo-western fusion wear erupted on social media. Regional store managers petitioned headquarters to modify the production lines to cater to the viral fusion demand. However, the top management strictly denied permission, stating that the annual blueprint was approved by the Board and must be followed without any deviations. Consequently, unsold traditional inventory accumulated, and the company posted massive markdown losses.',
      q1: 'Identify the two limitations of planning depicted in Suvidha Garments Ltd.',
      q2: 'Quote the exact line from the case that demonstrates planning creating internal rigidity.',
      scheme: {
        conceptTitle: 'Limitations of Planning: 1. Planning leads to rigidity & 2. Planning may not work in a dynamic environment',
        conceptMarks: '+2 Marks',
        quotedLine: '"However, the top management strictly denied permission, stating that the annual blueprint was approved by the Board and must be followed without any deviations."',
        quotedMarks: '+1 Mark',
        explanation: 'Planning forces managers to follow pre-determined paths. In dynamic business environments characterized by viral consumer shifts, inflexible plans prevent agile adaptation and lead to substantial business losses.',
        explanationMarks: '+1 Mark',
        examinerTip: 'CBSE Examiner Tip: When asked for two limitations, separate them with distinct subheadings: (a) Planning leads to rigidity, (b) Planning may not work in a dynamic environment.'
      }
    }
  ],
  ACC: [
    {
      id: 'ACC-01',
      subject: 'Accountancy',
      chapter: 'Accounting for Partnership: Fundamentals (Class 12)',
      marks: '4 Marks',
      title: 'Radha & Shyam: Net Loss and Partner\'s Loan Claim',
      scenario: 'Radha and Shyam formed a partnership firm on 1st April, 2023 contributing capitals of ₹5,00,000 and ₹3,00,000 respectively, without executing a Partnership Deed. On 1st October, 2023, Radha advanced a loan of ₹2,00,000 to the firm to fund urgent factory repairs. For the financial year ended 31st March, 2024, the business incurred a Net Loss of ₹20,000 before considering interest on Radha\'s loan. Shyam vehemently argued that since the firm is in the red, Radha is entitled to zero interest. Additionally, Shyam demanded a 10% managerial commission on gross revenue for his tireless 12-hour daily store management.',
      q1: 'Is Radha entitled to interest on her loan despite the Net Loss? State the legal rate under the Indian Partnership Act, 1932.',
      q2: 'Quote the legal principle deciding Shyam\'s claim for managerial commission in the absence of a partnership deed.',
      scheme: {
        conceptTitle: 'Interest on Partner\'s Loan is a "Charge Against Profits" @ 6% p.a.',
        conceptMarks: '+1.5 Marks',
        quotedLine: 'Legal Provision: Section 13(d) of the Indian Partnership Act, 1932 mandates interest on partner\'s loan @ 6% p.a., irrespective of whether the firm earns a profit or incurs a loss. Interest = ₹2,00,000 × 6% × 6/12 = ₹6,000 (debited to P&L A/c).',
        quotedMarks: '+1 Mark',
        explanation: 'Under Section 13(a) of the Indian Partnership Act, 1932, no partner is entitled to receive any salary, remuneration, or commission for taking part in the conduct of the business unless expressly agreed in the Partnership Deed. Shyam\'s claim is totally invalid.',
        explanationMarks: '+1.5 Marks',
        examinerTip: 'CBSE Examiner Tip: Always remember that Interest on Partner\'s Loan goes to Profit and Loss Account (Charge), NOT Profit and Loss Appropriation Account!'
      }
    },
    {
      id: 'ACC-02',
      subject: 'Accountancy',
      chapter: 'Cash Flow Statement (AS-3 / Ind AS 7)',
      marks: '4 Marks',
      title: 'Apex Diagnostic: Sale of Old Machinery at Loss',
      scenario: 'Apex Diagnostic Care Ltd. reported a Net Profit before Tax of ₹6,50,000 for the year ended 31st March, 2024. During the year, the company disposed of an obsolete ultrasound machine having a written down book value of ₹2,40,000 for ₹1,90,000 cash. The resulting loss on disposal of ₹50,000 was debited to the Statement of Profit and Loss. During the same fiscal, the company received ₹35,000 dividend on non-current equity shares and paid ₹80,000 interest on bank term loans.',
      q1: 'Classify the cash inflow of ₹1,90,000 from the sale of the ultrasound machine under Cash Flow Statement as per AS-3.',
      q2: 'Explain how the Loss on Sale of Machinery (₹50,000) will be adjusted while calculating Cash Flows from Operating Activities under the Indirect Method.',
      scheme: {
        conceptTitle: 'Classification: Cash Flow from Investing Activities (Inflow of ₹1,90,000)',
        conceptMarks: '+1 Mark',
        quotedLine: 'Treatment in Operating Activities: The Loss on Sale of Machine (₹50,000) is a Non-Operating Expense already debited to Net Profit.',
        quotedMarks: '+1 Mark',
        explanation: 'To compute Cash Flows from Operating Activities using the Indirect Method, the ₹50,000 loss must be ADDED BACK to Net Profit before Tax. This ensures operating profit reflects only pure operational cash inflows, preventing double-counting since the total gross realization (₹1,90,000) is reported under Investing Activities.',
        explanationMarks: '+2 Marks',
        examinerTip: 'CBSE Examiner Tip: Remember the Golden Rule: Losses on fixed assets are ADDED back to Net Profit; gains on fixed assets are DEDUCTED.'
      }
    }
  ],
  ECON: [
    {
      id: 'ECON-01',
      subject: 'Economics',
      chapter: 'Money & Banking: Macroeconomics (Class 12)',
      marks: '4 Marks',
      title: 'RBI Monetary Action: Cooling Credit Expansion',
      scenario: 'In response to persistent consumer inflation exceeding 6.8%, the Monetary Policy Committee (MPC) of the Reserve Bank of India announced an aggressive policy intervention. The Central Bank hiked the Cash Reserve Ratio (CRR) from 4.0% to 5.0% and increased the Statutory Liquidity Ratio (SLR) from 18% to 19.5%. A commercial bank branch manager explained to corporate loan applicants that their branch lending ceiling had contracted significantly, leading to higher benchmark lending rates and tighter collateral conditions.',
      q1: 'Identify whether the instrument utilized by the RBI is a Quantitative or Qualitative monetary tool.',
      q2: 'Explain how an increase in Legal Reserve Ratio (LRR = CRR + SLR) curtails the credit creation capacity of commercial banks using the Money Multiplier formula.',
      scheme: {
        conceptTitle: 'Instrument: Quantitative Credit Control (Legal Reserve Requirements — CRR & SLR)',
        conceptMarks: '+1 Mark',
        quotedLine: '"The Central Bank hiked the Cash Reserve Ratio (CRR) from 4.0% to 5.0% and increased the Statutory Liquidity Ratio (SLR) from 18% to 19.5%."',
        quotedMarks: '+1 Mark',
        explanation: 'Money Multiplier is given by: k = 1 / LRR. When LRR (CRR + SLR) increases, the Money Multiplier falls. Commercial banks are compulsorily required to lock a greater proportion of customer deposits with RBI and in liquid statutory assets. Consequently, loanable excess reserves shrink, reducing credit creation and cooling aggregate demand.',
        explanationMarks: '+2 Marks',
        examinerTip: 'CBSE Examiner Tip: Always write the formula (k = 1/LRR) clearly with a mini numerical example (e.g., LRR 20% gives multiplier 5; LRR 25% drops multiplier to 4).'
      }
    },
    {
      id: 'ECON-02',
      subject: 'Economics',
      chapter: 'Human Capital Formation in India (Class 12 IED)',
      marks: '4 Marks',
      title: 'Digital Village Initiative: Infrastructure vs Human Capital',
      scenario: 'Under the "Pradhan Mantri Rural Digital Mission", the central government disbursed ₹18,000 crore to construct regional polytechnics, install STEM labs in secondary schools, and set up telemedicine centers in tier-3 districts. A report by NITI Aayog highlighted that while laying physical freight corridors provides immediate transport capacity, sustained investments in education, teacher pedagogy, and preventive immunization yield enduring generational returns by enhancing labor productivity and fostering indigenous innovation.',
      q1: 'Identify the two primary sources of Human Capital Formation referred to in the passage.',
      q2: 'Quote the line explaining why investment in human capital has an enduring economic advantage over mere physical capital.',
      scheme: {
        conceptTitle: 'Sources of Human Capital Formation: 1. Investment in Education & 2. Investment in Health',
        conceptMarks: '+1.5 Marks',
        quotedLine: '"while laying physical freight corridors provides immediate transport capacity, sustained investments in education, teacher pedagogy, and preventive immunization yield enduring generational returns by enhancing labor productivity and fostering indigenous innovation."',
        quotedMarks: '+1 Mark',
        explanation: 'Human capital formation builds knowledge, skills, and health in workers. Unlike physical machinery which suffers depreciation, an educated and healthy human mind creates endogenous technological breakthroughs, raising total factor productivity (TFP) across the entire economy.',
        explanationMarks: '+1.5 Marks',
        examinerTip: 'CBSE Examiner Tip: The 5 sources of human capital formation are: Education, Health, On-the-job training, Migration, and Information.'
      }
    }
  ]
};

var activeSubject = 'BST';
var activeCaseIndex = 0;
var hasRevealed = false;

document.addEventListener('DOMContentLoaded', function() {
  TG_APP.hapticLight();

  // Telegram Back Button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = 'index.html';
      });
    } catch (e) {}
  }

  // Subject Filter Pill Event Listeners
  var btnBST = document.getElementById('btnFilterBST');
  var btnACC = document.getElementById('btnFilterACC');
  var btnECON = document.getElementById('btnFilterECON');

  function setSubject(sub) {
    TG_APP.hapticLight();
    activeSubject = sub;
    activeCaseIndex = 0;
    hasRevealed = false;

    [btnBST, btnACC, btnECON].forEach(function(b) {
      if (b) b.classList.remove('active');
    });

    if (sub === 'BST' && btnBST) btnBST.classList.add('active');
    if (sub === 'ACC' && btnACC) btnACC.classList.add('active');
    if (sub === 'ECON' && btnECON) btnECON.classList.add('active');

    renderActiveCase();
  }

  if (btnBST) btnBST.addEventListener('click', function() { setSubject('BST'); });
  if (btnACC) btnACC.addEventListener('click', function() { setSubject('ACC'); });
  if (btnECON) btnECON.addEventListener('click', function() { setSubject('ECON'); });

  renderActiveCase();
});

function renderActiveCase() {
  var container = document.getElementById('caseStudyContainer');
  var schemeContainer = document.getElementById('markingSchemeContainer');
  if (!container) return;

  if (schemeContainer) {
    schemeContainer.style.display = 'none';
    schemeContainer.innerHTML = '';
  }

  hasRevealed = false;
  var cases = CASE_VAULT[activeSubject] || CASE_VAULT['BST'];
  var c = cases[activeCaseIndex % cases.length];

  var html =
    '<div class="card card-violet" style="margin-bottom: 14px;">' +
      '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
        '<span class="pill pill-violet">' + escapeHtml(c.chapter) + '</span>' +
        '<span class="pill pill-gold">' + escapeHtml(c.marks) + '</span>' +
      '</div>' +
      '<h3 style="font-size: 1.05rem; margin-bottom: 10px; color: #F8FAFC;">' + escapeHtml(c.title) + '</h3>' +
      '<div class="case-scenario-box">' +
        escapeHtml(c.scenario) +
      '</div>' +
    '</div>' +

    '<div class="case-question-card">' +
      '<div style="font-size: 0.8rem; font-weight: 700; color: #818CF8; margin-bottom: 4px; text-transform: uppercase;">Question 1 (Concept Identification):</div>' +
      '<div style="font-size: 0.92rem; color: #FFFFFF; font-weight: 600; line-height: 1.4; margin-bottom: 10px;">' +
        escapeHtml(c.q1) +
      '</div>' +
      '<div style="font-size: 0.8rem; font-weight: 700; color: #818CF8; margin-bottom: 4px; text-transform: uppercase;">Question 2 (Quote Supporting Line):</div>' +
      '<div style="font-size: 0.92rem; color: #FFFFFF; font-weight: 600; line-height: 1.4; margin-bottom: 12px;">' +
        escapeHtml(c.q2) +
      '</div>' +
      '<div style="margin-bottom: 12px;">' +
        '<textarea id="studentCaseNotes" placeholder="Type your answers or notes here before verifying with CBSE scheme..." style="width: 100%; box-sizing: border-box; background: #0B0E14; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; color: #F8FAFC; padding: 10px; font-size: 0.85rem; min-height: 75px; resize: vertical;"></textarea>' +
      '</div>' +
      '<button type="button" class="btn btn-gold" id="btnVerifyScheme" style="font-size: 0.95rem; font-weight: 700; padding: 12px;">' +
        '🔍 Verify Official CBSE Marking Scheme' +
      '</button>' +
    '</div>';

  container.innerHTML = html;

  var verifyBtn = document.getElementById('btnVerifyScheme');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', function() {
      revealMarkingScheme(c);
    });
  }
}

function revealMarkingScheme(c) {
  if (hasRevealed) return;
  hasRevealed = true;
  TG_APP.hapticSuccess();

  // Multi-color Confetti Burst
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#818CF8', '#10B981', '#F43F5E']
    });
  }

  var s = c.scheme;
  var schemeContainer = document.getElementById('markingSchemeContainer');
  if (!schemeContainer) return;

  schemeContainer.innerHTML =
    '<div class="marking-scheme-card pop-success">' +
      '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
        '<div style="display: flex; align-items: center; gap: 8px;">' +
          '<span style="font-size: 1.3rem;">📋</span>' +
          '<strong style="font-size: 1rem; color: #FDE047;">Official CBSE Marking Scheme</strong>' +
        '</div>' +
        '<span class="pill pill-green">+25 CG Coins</span>' +
      '</div>' +

      '<!-- Step 1: Concept Identification -->' +
      '<div class="scheme-step">' +
        '<div class="scheme-step-title" style="color: #38BDF8;">' +
          '<span>🎯 Step 1: Concept Identification</span>' +
          '<span class="pill pill-violet" style="font-size: 10px;">' + escapeHtml(s.conceptMarks) + '</span>' +
        '</div>' +
        '<div style="font-size: 0.92rem; font-weight: 700; color: #F8FAFC;">' + escapeHtml(s.conceptTitle) + '</div>' +
      '</div>' +

      '<!-- Step 2: Quoted Line -->' +
      '<div class="scheme-step">' +
        '<div class="scheme-step-title" style="color: #FBBF24;">' +
          '<span>📌 Step 2: Exact Line Quoted from Case</span>' +
          '<span class="pill pill-gold" style="font-size: 10px;">' + escapeHtml(s.quotedMarks) + '</span>' +
        '</div>' +
        '<div style="font-size: 0.85rem; color: #FDE68A; line-height: 1.5; font-style: italic;">' + escapeHtml(s.quotedLine) + '</div>' +
      '</div>' +

      '<!-- Step 3: Explanation & Keywords -->' +
      '<div class="scheme-step">' +
        '<div class="scheme-step-title" style="color: #34D399;">' +
          '<span>💡 Step 3: NCERT Keyword Explanation</span>' +
          '<span class="pill pill-green" style="font-size: 10px;">' + escapeHtml(s.explanationMarks) + '</span>' +
        '</div>' +
        '<div style="font-size: 0.86rem; color: #CBD5E1; line-height: 1.5; margin-bottom: 8px;">' + escapeHtml(s.explanation) + '</div>' +
        '<div style="font-size: 0.78rem; color: #94A3B8; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; border-left: 2px solid #38BDF8;">' +
          escapeHtml(s.examinerTip) +
        '</div>' +
      '</div>' +

      '<div style="display: flex; gap: 10px; margin-top: 14px;">' +
        '<button type="button" class="btn btn-outline" id="btnNextCase" style="flex: 1; border-color: rgba(212,175,55,0.4); color: #F8FAFC;">' +
          '➡️ Next Case Study' +
        '</button>' +
        '<button type="button" class="btn btn-primary" onclick="window.location.href=\'index.html\'" style="flex: 1;">' +
          '🏠 Home' +
        '</button>' +
      '</div>' +
    '</div>';

  schemeContainer.style.display = 'block';
  schemeContainer.scrollIntoView({ behavior: 'smooth' });

  // Next Case Button
  var nextBtn = document.getElementById('btnNextCase');
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      TG_APP.hapticLight();
      activeCaseIndex++;
      renderActiveCase();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
