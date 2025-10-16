 Campus Life Planner

A responsive, accessible, and student-friendly task management web application built to help learners organize assignments, study sessions, and campus activities efficiently.

Live Demo
https://youtu.be/1_EW8rV5ksI

GitHub Pages: https://kenny260.github.io/campus-life-planner

Repository: https://github.com/kenny260/campus-life-planner

Table of Contents

Theme

Features

Technologies Used

Regex Catalog

Keyboard Shortcuts

Accessibility

File Structure

Installation & Setup

How to Use

Testing

Browser Support

Author

License

Acknowledgments

Theme

Campus Life Planner is a student-oriented productivity tool that helps manage academic tasks and campus events. It allows users to track deadlines, plan study sessions, set weekly goals, and monitor progress — all in a clean, accessible interface.

Features
Core Functionality

Create, read, update, and delete (CRUD) tasks

Mark tasks as complete or incomplete

Persistent data storage using localStorage

JSON import and export with validation

Advanced regex search with pattern highlighting

Sort tasks by date, title, duration, or tag

Filter tasks by tags and toggle case-sensitive search

Dashboard & Analytics

Total, completed, and upcoming task counters

Visual chart of tasks by category

Weekly task cap tracking with progress updates

Advanced Features

Time unit conversion between minutes and hours

Built-in notifications for success and error messages

Keyboard shortcuts for quick navigation

Fully responsive design (mobile, tablet, desktop)

Accessibility compliant with ARIA live regions and keyboard control

Smooth animations and visual transitions

Technologies Used

HTML5 for semantic structure

CSS3 with Grid, Flexbox, and transitions

Vanilla JavaScript (ES6+) using modular design

localStorage API for client-side persistence

FileReader API for data import/export

RegExp API for validation and searching

Regex Catalog
Pattern	Purpose	Example	Field
/^\S(?:.*\S)?$/	Prevent leading/trailing spaces	“Task Name”	Title
/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/	Letters, spaces, and hyphens only	“Study Group”	Tag
`/^\d{4}-(0[1-9]	1[0-2])-(0[1-9]	[12]\d	3[01])$/`
Number.isInteger() && value > 0 && value <= 1440	Valid duration (1–1440 min)	60	Duration
/\b(\w+)\s+\1\b/i	Detects duplicate words	“the the task”	Title & Notes

Regex Search Examples

urgent|important → Finds high-priority keywords

\b[A-Z]{2,}\b → Finds acronyms such as “CS101”

\d+\s*min → Finds short-duration tasks

Keyboard Shortcuts
Shortcut	Action	Description
Ctrl + F	Focus search bar	Quickly locate tasks
Ctrl + N	New task	Jump to task creation form
Esc	Cancel editing	Resets the form while editing

These shortcuts are available across the entire app interface.

Accessibility

Campus Life Planner follows WCAG 2.1 AA standards:

Semantic HTML5 structure with landmarks

Clear ARIA labels and live region announcements

Fully keyboard-navigable interface

High-contrast design with visible focus states

Screen-reader friendly notifications and error messages

“Skip to Content” link for keyboard users

Screen readers automatically announce updates such as completed tasks, errors, or cap status changes.

File Structure
campus-life-planner/
├── index.html
├── seed.json
├── README.md
├── styles/
│   └── style.css
└── scripts/
    ├── main.js
    └── validators.js

Module Overview

index.html – Main layout and ARIA markup

style.css – Responsive styling and animations

main.js – Task management logic, localStorage, search, sort, and dashboard

validators.js – Input validation and regex patterns

seed.json – Sample dataset for testing

Installation & Setup
Run Locally

Clone the repository:

git clone https://github.com/kenny260/campus-life-planner.git
cd campus-life-planner


Open index.html directly in your browser, or run a local server:

python -m http.server 8000


Visit:

http://localhost:8000

GitHub Pages

View the live demo at
https://kenny260.github.io/campus-life-planner

Requirements

Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

JavaScript and localStorage enabled

How to Use

Add a Task
Fill in task details (title, due date, duration, tag, and priority) and click Save.

Edit or Delete Tasks
Use the edit and delete buttons to modify or remove entries.

Mark as Complete
Click the checkmark to mark tasks complete or incomplete.

Search and Filter
Use text or regex patterns in the search box to find tasks quickly.

Set Weekly Task Cap
Define your weekly workload and monitor progress visually.

Import/Export Data
Save your current data as a JSON file or import existing tasks (like seed.json).

Testing
Manual Testing

Validate all form inputs using regex patterns.

Test search and regex filters with sample data.

Check responsiveness on mobile, tablet, and desktop.

Verify accessibility through keyboard-only navigation.

Try importing invalid JSON to confirm validation errors appear.

Optional Automated Testing

You can run lightweight validation tests using a tests.html page that calls validateTask() and checks expected results in the console.

Browser Support
Browser	Minimum Version	Support
Chrome	90+	Full
Firefox	88+	Full
Safari	14+	Full
Edge	90+	Full
Opera	76+	Full

The app uses ES6 modules, localStorage, FileReader, and CSS Grid.

Author

Developer: BINTHIA NITONDE

Contact: n.binthia@alustudent.com

Version: 1.0.0
Date: October 2025

License

This project was created for academic purposes and is open for educational use.

Acknowledgments

Project: Campus Life Planner

Instructor: [Instructor Name]

Institution: [University Name]

Semester: Fall 2025
