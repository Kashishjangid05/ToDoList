# ToDoList
# TaskMaster — To‑Do List Web Application

Overview
--------
TaskMaster is a responsive, user-friendly To‑Do list web application for creating, organizing and tracking tasks. It combines a lightweight frontend (HTML/CSS/JS) and an optional C++ backend that persists data to JSON files.

This README highlights Quick Start steps, the recent UI features (pastel colors, completion toast with Undo, overdue alerts), and development notes to help you change or extend the app.

Table of Contents
-----------------
- Quick Start
- Features
- Project Structure
- Development Notes
- Testing
- Troubleshooting
- Contributing
- License & Contact

Quick Start
-----------
Prerequisites
- Windows (PowerShell examples)
- C++ compiler with C++17 support
- CMake 3.10+

Run the full backend + frontend (recommended):
```powershell
# From the project root
.\build_and_run.bat
```

Front-end only preview (no backend required — uses localStorage):
```powershell
Start-Process index.html
```

Features
--------
- User auth (demo, stored in `localStorage`)
- Create / edit / delete tasks with title, description, due date, priority and category
- Search, filter and sort (priority, due date, creation time)
- Categories: built-in and custom
- Light / Dark theme toggle
- UI enhancements added:
  - Random pastel backgrounds for newly created tasks. (See `js/app.js` — `PASTEL_PALETTE`)
  - Marking a task complete removes it from the list and shows a toast with an `Undo` action.
  - Overdue alerts: when a pending task's due date passes the app shows a warning toast and visually highlights the task.

Project Structure
-----------------
```
OOPs Project/
├── index.html           # Frontend entry
├── css/
│   └── styles.css      # Styles (toasts, task cards, layout)
├── js/
│   └── app.js          # Frontend logic (task CRUD, UI behavior)
├── backend/
│   ├── server.cpp      # C++ backend server (REST API)
│   ├── models.h        # Data models
│   ├── database.h      # File-based JSON DB helpers
│   └── CMakeLists.txt  # CMake build config
├── build_and_run.bat   # Helper to build+run server and open browser (Windows)
└── README.md           # This file
```

Development Notes
-----------------
- Pastel palette: edit `PASTEL_PALETTE` in `js/app.js` to customize colors.
- Task color persistence: the frontend currently assigns `task.color` when creating a task. To persist color server-side, add a `color` field to your C++ `Task` model (see `backend/models.h`) and update `database.h`/`server.cpp` to read/write it.
- Overdue notifications: the frontend tracks newly-overdue tasks while the app is open and shows a single aggregated warning toast; change `checkOverdueTasks()` in `js/app.js` to alter frequency or behavior.
- JSON dependency (nlohmann/json): the C++ backend includes `json.hpp`. If you get a compile error like `json.hpp: No such file or directory`, fix by either:
  1. Adding the single-header `json.hpp` into `backend/` (quick), or
  2. Installing `nlohmann_json` and updating `CMakeLists.txt` to `find_package(nlohmann_json REQUIRED)` and link `nlohmann_json::nlohmann_json`, or
  3. Using CMake's FetchContent to download nlohmann/json at configure time.

Testing
-------
Manual test flow:
1. Start the server (`.\build_and_run.bat`) or open `index.html`.
2. Register/Login (demo accepts arbitrary credentials and stores a demo user in `localStorage`).
3. Add a new task (it gets a random pastel color).
4. Mark a task complete — it will be removed and a toast with `Undo` appears. Click `Undo` to restore.
5. Create or edit a task with a past due date; the task will show an `Overdue` badge and a warning toast will appear.

Troubleshooting
---------------
- `cmake` not found: install CMake and add to PATH.
- `json.hpp` missing: see the JSON dependency note above.
- Backend build/link errors: check `backend/build` output; paste errors here and I can help diagnose (missing includes, linker errors, wrong build config).
- Frontend errors: open browser DevTools (Console) to view errors from `js/app.js` and paste them here if you want help.

Contributing
------------
- Fork, create a feature branch, and open a PR with a clear description.
- Keep commits small and focused; include tests for significant logic changes.

License & Contact
-----------------
This project is MIT licensed.



---
Last updated: November 19, 2025
