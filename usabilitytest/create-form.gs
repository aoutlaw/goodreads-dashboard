/**
 * Creates the Google Form behind the Reading Stats usability test website.
 *
 * How to run (once):
 *   1. Go to https://script.google.com and click "New project".
 *   2. Delete the sample code, paste this whole file, and click Save.
 *   3. Pick "createUsabilityForm" in the function menu and click Run.
 *   4. Approve the permissions Google asks for (it's your own script).
 *
 * It creates the form and its response spreadsheet in your class folder, then saves a
 * Google Doc named "Usability test form config" there. That doc holds the IDs the website
 * needs to send answers into the form.
 */
var CLASS_FOLDER_ID = "1j0FhE8hCxdJFsPx5P6zrw_e6skFKrvG7"; // My Drive/School/Fall 2026 - Product, Services, Systems

var TASKS = [
  ["t1", "Task 1: Find your stats", "Where did you click first?"],
  ["t2", "Task 2: Check in on your reading", "Books read, and how you're doing on the goal"],
  ["t3", "Task 3: Look at a shorter time span", "Pages read in the last 3 months"],
  ["t4", "Task 4: Jump to a section", "Desktop: what did you think the squares on the right were for?"],
  ["t5", "Task 5: Find something new to read", "Which book did you pick?"],
  ["t6", "Task 6: Log your progress", "Notes"],
  ["t7", "Task 7: Make it yours", "Where did you look first for dark mode?"],
  ["t8", "Task 8: One more time", "Was it quicker the second time? Notes"]
];
var SUS = [
  "I think that I would like to use this dashboard frequently.",
  "I found the dashboard unnecessarily complex.",
  "I thought the dashboard was easy to use.",
  "I think that I would need the support of a technical person to be able to use this dashboard.",
  "I found the various functions in this dashboard were well integrated.",
  "I thought there was too much inconsistency in this dashboard.",
  "I would imagine that most people would learn to use this dashboard very quickly.",
  "I found the dashboard very cumbersome to use.",
  "I felt very confident using the dashboard.",
  "I needed to learn a lot of things before I could get going with this dashboard."
];
var LOOK = [
  ["lookA", "A. The dashboard is visually appealing."],
  ["lookB", "B. The layout makes it clear what is most important."],
  ["lookC", "C. It was easy to make the page my own, for example changing the goal and switching to dark mode."]
];
var OPEN = [
  ["q1", "Which part of the page were you drawn to most, and why?"],
  ["q2", "What was the most useful information for you?"],
  ["q3", "Was anything less useful, but still worth keeping?"],
  ["q4", "Is anything missing that you'd want to see?"],
  ["q6", "Anything else you'd change?"]
];
var JUMP_OPTIONS = ["A row of section buttons", "A \"Jump to\" button", "No, scrolling is fine"];

function createUsabilityForm() {
  var form = FormApp.create("Reading Stats Dashboard: Usability Test");
  form.setDescription("Responses from the self-guided usability test website. Testers answer on the website; this form stores the results.")
      .setCollectEmail(false)
      .setAllowResponseEdits(false)
      .setProgressBar(false);

  var items = {}; // key -> [item, sampleAnswer]
  function scale(key, title) {
    var it = form.addScaleItem().setTitle(title).setBounds(1, 5).setLabels("Strongly disagree", "Strongly agree");
    items[key] = [it, 3];
  }
  function choice(key, title, options, required) {
    var it = form.addMultipleChoiceItem().setTitle(title).setChoiceValues(options).setRequired(!!required);
    items[key] = [it, options[0]];
  }
  function text(key, title, required) {
    items[key] = [form.addTextItem().setTitle(title).setRequired(!!required), "x"];
  }
  function para(key, title) {
    items[key] = [form.addParagraphTextItem().setTitle(title), "x"];
  }

  form.addSectionHeaderItem().setTitle("About you");
  text("name", "Name", true);
  choice("format", "Which format did you test?", ["Desktop", "Mobile"], true);

  form.addSectionHeaderItem().setTitle("Tasks");
  TASKS.forEach(function (t) {
    choice(t[0] + "_done", t[1] + " — Finished?", ["Yes", "Partly", "No"]);
    var e = form.addScaleItem().setTitle(t[1] + " — How easy?").setBounds(1, 5).setLabels("Very hard", "Very easy");
    items[t[0] + "_ease"] = [e, 3];
    text(t[0] + "_notes", t[1] + " — " + t[2]);
  });

  form.addSectionHeaderItem().setTitle("Survey 1: Ease of use (SUS)");
  SUS.forEach(function (s, i) { scale("sus" + (i + 1), (i + 1) + ". " + s); });
  text("sus_score", "SUS score (0 to 100, calculated by the website)");

  form.addSectionHeaderItem().setTitle("Survey 2: Look and feel");
  LOOK.forEach(function (l) { scale(l[0], l[1]); });

  form.addSectionHeaderItem().setTitle("Your thoughts");
  OPEN.slice(0, 4).forEach(function (q) { para(q[0], q[1]); });
  choice("q5", "Mobile only: did you want a way to jump between sections?", JUMP_OPTIONS);
  para(OPEN[4][0], OPEN[4][1]);

  // Find each question's entry ID by building a pre-filled link for it.
  var entries = {};
  Object.keys(items).forEach(function (key) {
    var item = items[key][0], sample = items[key][1];
    var resp = form.createResponse().withItemResponse(item.createResponse(sample));
    var m = resp.toPrefilledUrl().match(/entry\.(\d+)=/);
    entries[key] = m ? "entry." + m[1] : null;
  });

  // Responses go to a spreadsheet next to the form.
  var sheet = SpreadsheetApp.create("Reading Stats Dashboard: Usability Test (Responses)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  var config = {
    formId: form.getId(),
    editUrl: form.getEditUrl(),
    action: form.getPublishedUrl().replace(/\/viewform.*$/, "/formResponse"),
    responsesSheet: sheet.getUrl(),
    entries: entries
  };

  var doc = DocumentApp.create("Usability test form config");
  doc.getBody().setText(JSON.stringify(config, null, 2));
  doc.saveAndClose();

  var folder = DriveApp.getFolderById(CLASS_FOLDER_ID);
  [form.getId(), sheet.getId(), doc.getId()].forEach(function (id) { DriveApp.getFileById(id).moveTo(folder); });

  Logger.log(JSON.stringify(config, null, 2));
  Logger.log("Done. Form: " + form.getEditUrl());
}
