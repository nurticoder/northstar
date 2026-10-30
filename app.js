const state = {
  view: "overview",
  satScore: Number(localStorage.getItem("northstar-sat-score")) || 1320,
  essayDrafts: Number(localStorage.getItem("northstar-essay-drafts")) || 2,
  savedActivities: JSON.parse(localStorage.getItem("northstar-activities") || "[]"),
  user: null,
  backendAvailable: false,
  practiceQuestion: null,
};

const viewContainer = document.querySelector("#view-container");
const toast = document.querySelector("#toast");
const modalBackdrop = document.querySelector("#modal-backdrop");
const modalContent = document.querySelector("#modal-content");

const fallbackQuestions = [
  {
    id: "fallback-math-1",
    subject: "math",
    domain: "Algebra",
    difficulty: "medium",
    prompt: "A line passes through (2, 9) and (6, 21). Which equation describes the line?",
    choices: ["y = 2x + 5", "y = 3x + 3", "y = 4x + 1", "y = 6x - 3"],
    source: "Northstar original",
  },
  {
    id: "fallback-reading-1",
    subject: "reading",
    domain: "Expression of ideas",
    difficulty: "medium",
    prompt: "The map was visually striking; ______, its labels were too small to help a first-time visitor navigate the station.",
    choices: ["for example", "however", "similarly", "therefore"],
    source: "Northstar original",
  },
];

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function bootAuth() {
  try {
    const payload = await api("/api/session");
    state.backendAvailable = true;
    state.user = payload.user;
    updateAuthChrome();
    if (!state.user) showLoginModal("login");
  } catch {
    state.backendAvailable = false;
    updateAuthChrome();
  }
}

function updateAuthChrome() {
  const authButton = document.querySelector("#auth-button");
  const topAvatar = document.querySelector(".top-avatar");
  if (!authButton) return;
  authButton.textContent = state.user ? "Sign out" : "Sign in";
  topAvatar.textContent = state.user ? state.user.email.slice(0, 2).toUpperCase() : "AM";
}

function showLoginModal(mode = "login", message = "") {
  const isLogin = mode === "login";
  openModal(`
    <p class="eyebrow">Northstar account</p>
    <h2 id="modal-title">${isLogin ? "Pick up where you left off." : "Create your private workspace."}</h2>
    <p class="lede">${message || "Your route, attempts, notes, and university decisions stay in your local SQLite account."}</p>
    <form class="form-grid" id="auth-form">
      <label>Email<input id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com" /></label>
      <label>Password<input id="auth-password" type="password" minlength="8" autocomplete="${isLogin ? "current-password" : "new-password"}" required placeholder="At least 8 characters" /></label>
      <button class="button primary" type="submit">${isLogin ? "Sign in →" : "Create account →"}</button>
      <button class="panel-link" type="button" id="auth-switch">${isLogin ? "Need an account? Create one" : "Already have an account? Sign in"}</button>
    </form>
  `);
  document.querySelector("#auth-switch").addEventListener("click", () => showLoginModal(isLogin ? "signup" : "login"));
  document.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const payload = await api(isLogin ? "/api/login" : "/api/signup", {
        method: "POST",
        body: JSON.stringify({ email: document.querySelector("#auth-email").value, password: document.querySelector("#auth-password").value }),
      });
      state.user = payload.user;
      updateAuthChrome();
      closeModal();
      showToast(isLogin ? "Welcome back to your route." : "Your Northstar workspace is ready.");
    } catch (error) {
      button.disabled = false;
      showLoginModal(mode, error.message);
    }
  });
}

const iconMap = {
  overview: "◒",
  story: "◎",
  sat: "⌁",
  essays: "◌",
  activities: "↗",
  universities: "⌂",
  calendar: "▦",
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function openModal(markup) {
  modalContent.innerHTML = markup;
  modalBackdrop.hidden = false;
  modalBackdrop.querySelector("input, textarea, select, button:not(.modal-close)")?.focus();
}

function closeModal() {
  modalBackdrop.hidden = true;
  modalContent.innerHTML = "";
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function save(key, value) {
  localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

function layout({ eyebrow, title, lede, action = "" }, body) {
  return `
    <div class="page">
      <div class="page-heading">
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <h1>${title}</h1>
          <p class="lede">${lede}</p>
        </div>
        ${action}
      </div>
      ${body}
    </div>
  `;
}

function overviewView() {
  return layout(
    {
      eyebrow: "Tuesday, 30 September 2026",
      title: "Make the next move count.",
      lede: "Your applications get stronger when your preparation, story, and choices point in the same direction. Here’s the honest version of where you are.",
      action: `<button class="button primary" data-action="plan-next">Plan my next move <span>→</span></button>`,
    },
    `
      <div class="dashboard-grid">
        <section class="panel route-panel">
          <div class="panel-head">
            <div>
              <p class="eyebrow">The route map</p>
              <h2 class="panel-title">From curiosity to a clear case.</h2>
            </div>
            <button class="panel-link" data-view-target="story">Open full map →</button>
          </div>
          <p class="route-summary">You do not need a perfect “spike.” You need a pattern a reader can feel: systems thinking, useful design, and community-scale impact.</p>
          <div class="route-track">
            <div class="route-step complete"><div class="route-node">✓</div><strong>Notice</strong><span>done</span></div>
            <div class="route-step complete"><div class="route-node">✓</div><strong>Explore</strong><span>done</span></div>
            <div class="route-step current"><div class="route-node">3</div><strong>Prove</strong><span>in motion</span></div>
            <div class="route-step"><div class="route-node">4</div><strong>Choose</strong><span>next</span></div>
          </div>
        </section>
        <section class="panel next-panel">
          <p class="eyebrow">Your next best move</p>
          <h2 class="panel-title">Turn the transit project into evidence.</h2>
          <div class="next-action">
            <strong>Write the 180-word “why this, why now?” note.</strong>
            <p>One useful artifact will sharpen your activities list, essay material, and university fit at once.</p>
            <button class="button" data-action="start-note">Start the note →</button>
          </div>
          <div class="progress-bar"><i></i></div>
          <div class="progress-label"><span>September route</span><span>68%</span></div>
        </section>
      </div>

      <div class="section-row"><div><h2>Three signals worth trusting</h2><p>Not a score. A read on your current shape.</p></div><button class="panel-link" data-view-target="story">Refresh analysis ↗</button></div>
      <div class="insight-grid">
        <article class="panel insight-card green"><div class="card-icon">◒</div><h3>Systems thinker</h3><p>You keep returning to the invisible layer: the flow, rule, or handoff that makes a public experience better.</p></article>
        <article class="panel insight-card blue"><div class="card-icon">⌁</div><h3>Builder with receipts</h3><p>Your strongest stories include a before-and-after. Capture the measurable change, not only the hours spent.</p></article>
        <article class="panel insight-card yellow"><div class="card-icon">✦</div><h3>Range is an asset</h3><p>Design, debate, and data can read as one profile when the through-line is named clearly.</p></article>
      </div>

      <div class="section-row"><div><h2>Today’s desk</h2><p>Small actions with compounding value.</p></div><button class="panel-link" data-view-target="calendar">View calendar →</button></div>
      <div class="activity-grid">
        <section class="panel activity-list">
          <div class="activity-item"><div class="item-icon">✎</div><div><strong>Draft your opening scene</strong><span>Essay · 20 minutes · use the “crowded platform” memory</span></div><span class="item-status due">Due today</span></div>
          <div class="activity-item"><div class="item-icon">⌁</div><div><strong>Review missed SAT questions</strong><span>Quant · 12 questions · linear equations</span></div><span class="item-status open">Open</span></div>
          <div class="activity-item"><div class="item-icon">↗</div><div><strong>Add one impact metric</strong><span>Activities · transit access project</span></div><span class="item-status">Quick win</span></div>
        </section>
        <section class="panel signal-panel">
          <div class="panel-head"><div><p class="eyebrow">Story signal</p><h2 class="panel-title">76 / 100</h2></div><span class="micro">updated 4m ago</span></div>
          <div class="signal-score"><div class="score-ring"><strong>76</strong></div><div><strong>Coherent and credible.</strong><p>One more proof point will turn “interesting” into “unmistakable.”</p></div></div>
          <div class="signal-bars"><div class="bar-row"><span>Through-line</span><div class="bar"><i style="width: 86%"></i></div><em>86</em></div><div class="bar-row"><span>Evidence</span><div class="bar"><i style="width: 62%"></i></div><em>62</em></div><div class="bar-row"><span>Fit</span><div class="bar"><i style="width: 78%"></i></div><em>78</em></div></div>
        </section>
      </div>

      <div class="section-row"><div><h2>Admissions command center</h2><p>The parts of your application that need a decision, not more tabs.</p></div><button class="panel-link" data-action="open-command">Open command center ↗</button></div>
      <div class="command-grid">
        <article class="panel command-card command-roadmap">
          <div class="command-card-head"><div><p class="eyebrow">Roadmap</p><h3>September → January</h3></div><span class="command-count">4 milestones</span></div>
          <div class="mini-roadmap">
            <div class="mini-step complete"><span>✓</span><div><strong>Profile inventory</strong><small>complete · 12 signals captured</small></div></div>
            <div class="mini-step current"><span>2</span><div><strong>Evidence sprint</strong><small>in motion · 2 artifacts to finish</small></div></div>
            <div class="mini-step"><span>3</span><div><strong>School strategy</strong><small>next · shortlist and story fit</small></div></div>
            <div class="mini-step"><span>4</span><div><strong>Application rooms</strong><small>later · essays and review</small></div></div>
          </div>
        </article>
        <article class="panel command-card deadline-card">
          <div class="command-card-head"><div><p class="eyebrow">Deadline radar</p><h3>What is getting close</h3></div><span class="command-count warning">3 items</span></div>
          <div class="deadline-row"><span class="date-block"><b>18</b><small>OCT</small></span><div><strong>Early list lock</strong><small>Choose 8–10 schools worth researching deeply.</small></div><span class="item-status due">18 days</span></div>
          <div class="deadline-row"><span class="date-block"><b>02</b><small>NOV</small></span><div><strong>Personal statement v1</strong><small>Draft should have a turn, not a conclusion.</small></div><span class="item-status open">33 days</span></div>
          <div class="deadline-row"><span class="date-block"><b>09</b><small>NOV</small></span><div><strong>SAT retake decision</strong><small>Use your error trend, not test-day anxiety.</small></div><span class="item-status">40 days</span></div>
        </article>
        <article class="panel command-card coach-card">
          <p class="eyebrow">Coach note</p>
          <h3>Stop collecting possibilities.</h3>
          <p>Your route is already specific enough to make a shortlist. The next advantage comes from choosing what to deepen.</p>
          <button class="button secondary" data-action="open-coach">Read the reasoning →</button>
        </article>
      </div>
    `,
  );
}

function storyView() {
  return layout(
    { eyebrow: "My story", title: "A story is a pattern, not a slogan.", lede: "Northstar reads your choices together: what you notice, what you build, and the people or systems you keep coming back to." },
    `
      <div class="split-layout">
        <section class="panel wide-panel">
          <div class="panel-head"><div><p class="eyebrow">Working thesis</p><h2 class="panel-title">You make complex things easier to enter.</h2></div><button class="button ghost" data-action="edit-thesis">Edit thesis</button></div>
          <p class="lede" style="font-size:13px;margin:21px 0 18px">Across your transit access project, debate club, and data visualisations, the recurring move is translation: you turn friction into a path someone else can use.</p>
          <div class="tag-list"><span class="tag">systems design</span><span class="tag">public interest</span><span class="tag">clear communication</span><span class="tag coral">evidence needed</span></div>
          <div class="section-row"><div><h2 style="font-size:20px">The evidence web</h2><p>Three moments that currently carry the story.</p></div></div>
          <div class="list-row"><div><strong>Transit access map</strong><span>Built a visual guide used by 180 students to compare routes and costs.</span></div><span class="item-status">Strong</span></div>
          <div class="list-row"><div><strong>Debate club redesign</strong><span>Reworked novice onboarding; weekly attendance rose from 12 to 31.</span></div><span class="item-status">Strong</span></div>
          <div class="list-row"><div><strong>Local data zine</strong><span>Beautiful first issue; capture who it reached and what changed next.</span></div><span class="item-status due">Sharpen</span></div>
        </section>
        <aside class="panel wide-panel">
          <p class="eyebrow">Ikigai lens</p><h2 class="panel-title">The overlap worth testing.</h2>
          <div class="quote-block" style="margin-top:20px">“The work gets interesting when a confusing system becomes a shared tool.”<small>Generated from your notes · revise anytime</small></div>
          <div class="section-row"><div><h2 style="font-size:20px">Route suggestions</h2><p>Directions, not destiny.</p></div></div>
          <div class="list-row"><div><strong>Urban studies + interaction design</strong><span>For the public systems thread.</span></div><span class="fit">High fit</span></div>
          <div class="list-row"><div><strong>Information science + policy</strong><span>For the evidence and access thread.</span></div><span class="fit">High fit</span></div>
          <div class="list-row"><div><strong>Human-centered computing</strong><span>For the builder thread.</span></div><span class="fit">Explore</span></div>
          <button class="button secondary" style="margin-top:18px;width:100%" data-view-target="universities">See matching universities →</button>
        </aside>
      </div>
    `,
  );
}

function satView() {
  return layout(
    { eyebrow: "SAT studio", title: "Practice the question behind the question.", lede: "A focused prep room that turns mistakes into a short, personal queue—not an endless content library.", action: `<button class="button primary" data-action="sat-session">Start 25-minute session</button>` },
    `
      <div class="dashboard-grid">
        <section class="panel wide-panel">
          <div class="panel-head"><div><p class="eyebrow">Current read</p><h2 class="panel-title">${state.satScore} projected</h2></div><span class="item-status">+80 in 5 weeks</span></div>
          <p class="lede" style="font-size:13px;margin:16px 0 24px">Your reading is ahead of your math. The fastest route up is not “more questions”—it is a tighter error log for linear models and transitions.</p>
          <div class="signal-bars"><div class="bar-row"><span>Reading & Writing</span><div class="bar"><i style="width: 84%;background:var(--navy)"></i></div><em>690</em></div><div class="bar-row"><span>Math</span><div class="bar"><i style="width: 71%;background:var(--coral)"></i></div><em>630</em></div></div>
          <div class="section-row"><div><h2 style="font-size:20px">Your next set</h2><p>Personalised from the last 3 reviews.</p></div><button class="button secondary" data-action="load-question">Load adaptive question</button></div>
          ${state.practiceQuestion ? `
            <div class="practice-question">
              <div class="practice-meta"><span>${state.practiceQuestion.domain}</span><span>${state.practiceQuestion.difficulty}</span><span>${state.practiceQuestion.source}</span></div>
              <h3>${state.practiceQuestion.prompt}</h3>
              <div class="answer-grid">${state.practiceQuestion.choices.map((choice, index) => `<button class="answer-choice" data-answer-index="${index}"><b>${String.fromCharCode(65 + index)}</b>${choice}</button>`).join("")}</div>
              <p class="micro">Choose an answer to save this attempt and get a worked explanation.</p>
            </div>
          ` : ""}
          <div class="list-row"><div><strong>Linear equations in context</strong><span>8 questions · medium · accuracy target 75%</span></div><button class="panel-link" data-action="practice">Practice →</button></div>
          <div class="list-row"><div><strong>Transitions and rhetorical purpose</strong><span>6 questions · hard · accuracy target 85%</span></div><button class="panel-link" data-action="practice">Practice →</button></div>
        </section>
        <aside class="panel next-panel"><p class="eyebrow">Coach note</p><h2 class="panel-title">Do not turn prep into a second school day.</h2><div class="next-action"><strong>Three short sessions beat one heroic Saturday.</strong><p>Northstar will keep the queue narrow so your energy stays available for your actual life.</p></div><button class="button" data-action="schedule-sat">Add three sessions →</button></aside>
      </div>
    `,
  );
}

function essaysView() {
  return layout(
    { eyebrow: "Essays", title: "Make the reader feel the turn.", lede: "A small studio for finding the moment your thinking changed—and shaping it without sanding off your voice.", action: `<button class="button primary" data-action="new-essay">New essay room</button>` },
    `
      <div class="split-layout">
        <section class="panel wide-panel">
          <div class="panel-head"><div><p class="eyebrow">In progress</p><h2 class="panel-title">${state.essayDrafts} rooms open</h2></div><span class="micro">last saved just now</span></div>
          <div class="list-row"><div><strong>The long way home</strong><span>Personal statement · 612 words · the “crowded platform” scene</span></div><span class="item-status due">Needs turn</span></div>
          <div class="list-row"><div><strong>Why this major?</strong><span>Supplement · 318 words · connect the zine to urban systems</span></div><span class="item-status open">Outline</span></div>
          <div class="list-row"><div><strong>Community prompt</strong><span>Supplement · not started · debate club onboarding</span></div><span class="item-status">Queued</span></div>
        </section>
        <aside class="panel wide-panel"><p class="eyebrow">Studio prompt</p><h2 class="panel-title">Where did the obvious answer stop being enough?</h2><p class="lede" style="font-size:13px;margin-top:18px">A useful draft usually starts one beat before the lesson. Write the scene, then name the friction you could not ignore.</p><button class="button moss" style="margin-top:19px" data-action="start-note">Open a blank page →</button></aside>
      </div>
    `,
  );
}

function activitiesView() {
  return layout(
    { eyebrow: "Activities", title: "Keep the work. Clarify the impact.", lede: "A living inventory that turns what you actually do into evidence a reader can understand.", action: `<button class="button primary" data-action="new-activity">Add activity</button>` },
    `
      <section class="panel wide-panel">
        <div class="panel-head"><div><p class="eyebrow">Your inventory</p><h2 class="panel-title">${3 + state.savedActivities.length} activities, one through-line</h2></div><button class="panel-link" data-action="sort-activities">Sort by story strength ↕</button></div>
        <div class="list-row"><div><strong>Transit access map</strong><span>Founder · 4 hr/wk · 11th–12th · public interest / design</span></div><span class="item-status">Story anchor</span></div>
        <div class="list-row"><div><strong>Debate club</strong><span>Training lead · 3 hr/wk · 9th–12th · community / communication</span></div><span class="item-status">Story anchor</span></div>
        <div class="list-row"><div><strong>Local data zine</strong><span>Editor · seasonal · 11th–12th · research / visualisation</span></div><span class="item-status due">Add outcome</span></div>
        ${state.savedActivities.map((activity) => `<div class="list-row"><div><strong>${activity.name}</strong><span>${activity.role} · ${activity.time} · added today</span></div><span class="item-status open">New</span></div>`).join("")}
      </section>
      <div class="section-row"><div><h2>What to add next</h2><p>The missing evidence is usually one sentence, not a new activity.</p></div></div>
      <div class="insight-grid"><article class="panel insight-card green"><div class="card-icon">↗</div><h3>Reach</h3><p>Who used it, read it, joined because of it, or kept it going?</p></article><article class="panel insight-card blue"><div class="card-icon">⌁</div><h3>Change</h3><p>What was different after you got involved? Name the before and after.</p></article><article class="panel insight-card yellow"><div class="card-icon">✦</div><h3>Choice</h3><p>What did you decide not to do? Constraints make leadership legible.</p></article></div>
    `,
  );
}

function universitiesView() {
  return layout(
    { eyebrow: "Universities", title: "Build a list around fit, not fame.", lede: "A practical shortlist with reasons you can defend: curriculum, culture, cost, and the kind of work your profile wants to keep doing." },
    `
      <div class="view-toolbar"><button class="tab-button active">Recommended</button><button class="tab-button">Saved</button><button class="tab-button">Compare</button><button class="tab-button">Add a university</button></div>
      <div class="university-grid">
        <article class="panel uni-card"><div class="uni-top"><div class="uni-icon">N</div><span class="fit">92% fit</span></div><h3>University of Michigan</h3><p>Information science, public design, and a strong civic innovation ecosystem.</p><div class="tag-list"><span class="tag">Ann Arbor</span><span class="tag blue">reach-match</span></div></article>
        <article class="panel uni-card"><div class="uni-top"><div class="uni-icon">W</div><span class="fit">89% fit</span></div><h3>University of Washington</h3><p>Human-centered design with a direct route into urban and public-interest work.</p><div class="tag-list"><span class="tag">Seattle</span><span class="tag blue">match</span></div></article>
        <article class="panel uni-card"><div class="uni-top"><div class="uni-icon">T</div><span class="fit">85% fit</span></div><h3>University of Toronto</h3><p>Flexible combinations across data, cities, and policy with serious research depth.</p><div class="tag-list"><span class="tag">Toronto</span><span class="tag blue">match</span></div></article>
        <article class="panel uni-card"><div class="uni-top"><div class="uni-icon">G</div><span class="fit">82% fit</span></div><h3>Georgia Tech</h3><p>For the builder side of your story: systems, computing, and measurable outcomes.</p><div class="tag-list"><span class="tag">Atlanta</span><span class="tag blue">reach</span></div></article>
        <article class="panel uni-card"><div class="uni-top"><div class="uni-icon">U</div><span class="fit">78% fit</span></div><h3>University of Amsterdam</h3><p>Urban futures, social science, and a city that acts as a living laboratory.</p><div class="tag-list"><span class="tag">Amsterdam</span><span class="tag blue">explore</span></div></article>
        <article class="panel uni-card"><div class="uni-top"><div class="uni-icon">R</div><span class="fit">76% fit</span></div><h3>Rice University</h3><p>Close-knit community and interdisciplinary study for a sharper, smaller route.</p><div class="tag-list"><span class="tag">Houston</span><span class="tag blue">explore</span></div></article>
      </div>
    `,
  );
}

function calendarView() {
  return layout(
    { eyebrow: "Calendar", title: "A calm plan beats a crowded one.", lede: "Your next 14 days, ordered by leverage. Drag-and-drop can come later; first, make the commitments honest.", action: `<button class="button primary" data-action="add-calendar">Add commitment</button>` },
    `
      <section class="panel wide-panel">
        <div class="timeline">
          <div class="timeline-item"><div class="timeline-date">Today<br>30 Sep</div><div class="timeline-marker"></div><div class="timeline-content"><strong>Write the “why this, why now?” note</strong><p>20 min · turns one memory into material for three surfaces.</p></div></div>
          <div class="timeline-item"><div class="timeline-date">Thu<br>1 Oct</div><div class="timeline-marker" style="background:var(--moss);box-shadow:0 0 0 5px var(--moss-soft)"></div><div class="timeline-content"><strong>Math error-log session</strong><p>25 min · linear equations in context.</p></div></div>
          <div class="timeline-item"><div class="timeline-date">Sat<br>3 Oct</div><div class="timeline-marker" style="background:var(--butter);box-shadow:0 0 0 5px #fbf5df"></div><div class="timeline-content"><strong>Transit project check-in</strong><p>45 min · ask one user what changed for them.</p></div></div>
          <div class="timeline-item"><div class="timeline-date">Mon<br>5 Oct</div><div class="timeline-marker" style="background:var(--navy);box-shadow:0 0 0 5px var(--blue-soft)"></div><div class="timeline-content"><strong>Essay room: find the turn</strong><p>30 min · draft past the lesson, not toward it.</p></div></div>
        </div>
      </section>
    `,
  );
}

function render() {
  const views = { overview: overviewView, story: storyView, sat: satView, essays: essaysView, activities: activitiesView, universities: universitiesView, calendar: calendarView };
  viewContainer.innerHTML = (views[state.view] || overviewView)();
  bindActions();
}

function bindActions() {
  document.querySelectorAll("[data-view-target]").forEach((element) => {
    element.addEventListener("click", () => setView(element.dataset.viewTarget));
  });
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", () => handleAction(element.dataset.action));
  });
  document.querySelectorAll("[data-answer-index]").forEach((element) => {
    element.addEventListener("click", () => submitAnswer(Number(element.dataset.answerIndex)));
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      showToast(`${button.textContent} view selected`);
    });
  });
}

async function loadQuestion() {
  try {
    state.practiceQuestion = state.backendAvailable
      ? await api("/api/questions/next?subject=math")
      : fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  } catch (error) {
    showToast(error.message);
    return;
  }
  render();
}

async function submitAnswer(selectedAnswer) {
  if (!state.practiceQuestion) return;
  if (!state.backendAvailable) {
    showToast("Demo answer recorded locally. Run server.py to save progress to SQLite.");
    state.practiceQuestion = null;
    render();
    return;
  }
  try {
    const result = await api("/api/attempts", {
      method: "POST",
      body: JSON.stringify({ questionId: state.practiceQuestion.id, selectedAnswer }),
    });
    showToast(result.correct ? `Correct — ${result.scoreDelta} route points.` : `Not quite — ${result.explanation}`);
    state.practiceQuestion = null;
    render();
  } catch (error) {
    showToast(error.message);
  }
}

function handleAction(action) {
  if (action === "plan-next") setView("story");
  if (action === "sat-session" || action === "practice") {
    openModal(`<p class="eyebrow">SAT studio</p><h2 id="modal-title">A focused 25-minute set</h2><p class="lede">We’ll start with 8 linear-equation questions, then pause after each miss to name the trap.</p><div class="form-grid"><label>Session intention<input value="Notice the setup before calculating" /></label><button class="button primary" data-action="finish-session">Begin set →</button></div>`);
    bindActions();
  }
  if (action === "load-question") loadQuestion();
  if (action === "finish-session") { closeModal(); showToast("Session queued — your first set is ready."); }
  if (action === "schedule-sat") { showToast("Three short SAT sessions added to your calendar."); setView("calendar"); }
  if (action === "start-note") {
    openModal(`<p class="eyebrow">A useful note</p><h2 id="modal-title">Where did you notice the friction?</h2><p class="lede">Keep it concrete. Write for 180 words, then save; Northstar will surface places this could support your essay and activity descriptions.</p><div class="form-grid"><label>Your note<textarea placeholder="I noticed..."></textarea></label><button class="button primary" data-action="save-note">Save note →</button></div>`);
    bindActions();
  }
  if (action === "save-note") { closeModal(); showToast("Note saved to your story evidence."); }
  if (action === "edit-thesis") {
    openModal(`<p class="eyebrow">Working thesis</p><h2 id="modal-title">Say it in your own words.</h2><div class="form-grid"><label>Thesis<textarea> You make complex things easier to enter.</textarea></label><button class="button primary" data-action="save-thesis">Save thesis →</button></div>`);
    bindActions();
  }
  if (action === "save-thesis") { closeModal(); showToast("Thesis updated across your route."); }
  if (action === "new-essay") { state.essayDrafts += 1; save("northstar-essay-drafts", state.essayDrafts); showToast("New essay room opened."); render(); }
  if (action === "new-activity") {
    openModal(`<p class="eyebrow">Add activity</p><h2 id="modal-title">Keep the work visible.</h2><div class="form-grid two"><label>Name<input id="activity-name" placeholder="e.g. Community garden" /></label><label>Your role<input id="activity-role" placeholder="e.g. Volunteer coordinator" /></label></div><div class="form-grid" style="margin-top:14px"><label>Time / rhythm<input id="activity-time" placeholder="e.g. 2 hr/wk · 10th–12th" /></label><button class="button primary" data-action="save-activity">Add activity →</button></div>`);
    bindActions();
  }
  if (action === "save-activity") {
    const name = document.querySelector("#activity-name")?.value.trim();
    const role = document.querySelector("#activity-role")?.value.trim();
    const time = document.querySelector("#activity-time")?.value.trim();
    if (!name || !role || !time) { showToast("Add a name, role, and rhythm first."); return; }
    state.savedActivities = [...state.savedActivities, { name, role, time }];
    save("northstar-activities", state.savedActivities);
    closeModal(); showToast("Activity added to your inventory."); render();
  }
  if (action === "sort-activities") { showToast("Sorted by story strength."); }
  if (action === "add-calendar") { showToast("Commitment added — keep the week breathable."); }
  if (action === "open-command") {
    openModal(`<p class="eyebrow">Admissions command center</p><h2 id="modal-title">Choose the decision that unlocks the next layer.</h2><p class="lede">Northstar is most useful when it narrows the field. Pick one and the workspace will keep the rest visible without letting it steal the week.</p><div class="form-grid"><button class="button secondary" data-view-target="story">Clarify my story →</button><button class="button ghost" data-view-target="universities">Build my shortlist →</button><button class="button ghost" data-view-target="essays">Open an essay room →</button></div>`);
    modalContent.querySelectorAll("[data-view-target]").forEach((element) => element.addEventListener("click", () => { closeModal(); setView(element.dataset.viewTarget); }));
  }
  if (action === "open-coach") {
    openModal(`<p class="eyebrow">Coach note</p><h2 id="modal-title">Depth is your differentiator now.</h2><p class="lede">You already have enough range to look interesting. The higher-value move is to make two experiences undeniably yours: document the transit project’s user impact, and explain what the debate onboarding changed in your way of thinking.</p><div class="quote-block">“A good application does not prove that you did everything. It makes the reader curious about what you will do next.”<small>Northstar route principle</small></div><button class="button primary" style="margin-top:20px" data-action="save-note">Add this to my route →</button>`);
    bindActions();
  }
}

document.querySelector("#nav-list").addEventListener("click", (event) => {
  const item = event.target.closest("[data-view]");
  if (item) setView(item.dataset.view);
});
document.querySelector("#modal-close").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (event) => { if (event.target === modalBackdrop) closeModal(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openModal(`<p class="eyebrow">Quick jump</p><h2 id="modal-title">Where should we go?</h2><div class="form-grid"><button class="button ghost" data-view-target="story">My story</button><button class="button ghost" data-view-target="sat">SAT studio</button><button class="button ghost" data-view-target="essays">Essays</button><button class="button ghost" data-view-target="universities">Universities</button></div>`);
    document.querySelectorAll("[data-view-target]").forEach((element) => element.addEventListener("click", () => { closeModal(); setView(element.dataset.viewTarget); }));
  }
});
document.querySelector("#command-button").addEventListener("click", () => {
  const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
  document.dispatchEvent(event);
});
document.querySelector("#auth-button").addEventListener("click", async () => {
  if (!state.user) return showLoginModal("login");
  try {
    await api("/api/logout", { method: "POST" });
    state.user = null;
    updateAuthChrome();
    showToast("Signed out. Your local workspace is still on disk.");
  } catch {
    showToast("Sign out is available when running server.py.");
  }
});

render();
bootAuth();
