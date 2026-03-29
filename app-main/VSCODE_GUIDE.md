# Running TestFlow from VS Code

## 🎯 Method 1: Using Multiple Integrated Terminals (Fastest)

### Step 1: Open VS Code
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main
code .
```

### Step 2: Open Multiple Terminals
1. Press: **Ctrl + `** (backtick) to open terminal
2. Press: **Ctrl + Shift + `** to open second terminal
3. You now have 2 terminals open

### Step 3: Terminal 1 - Backend
```powershell
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Step 4: Terminal 2 - Frontend
```powershell
cd frontend
npm start
```

### Step 5: Open Application
- Click: http://localhost:3000 in VS Code terminal output
- Or manually visit: http://localhost:3000

---

## 🎯 Method 2: Using VS Code Tasks (Automated)

### Step 1: Create Tasks Configuration

In VS Code, press **Ctrl + Shift + P** and search: `Tasks: Configure Task`

Then select: `Create tasks.json from template`

Choose: `Others`

### Step 2: Replace with This Configuration

Create file: `.vscode/tasks.json`

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "🔧 Start Backend",
            "type": "shell",
            "command": "python",
            "args": ["-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
            "cwd": "${workspaceFolder}/backend",
            "isBackground": true,
            "problemMatcher": {
                "pattern": {
                    "regexp": "^.*$",
                    "file": 1,
                    "location": 2,
                    "message": 3
                },
                "background": {
                    "activeOnStart": true,
                    "beginsPattern": "^.*Uvicorn running.*",
                    "endsPattern": "^.*Application startup complete.*"
                }
            },
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            }
        },
        {
            "label": "⚛️ Start Frontend",
            "type": "shell",
            "command": "npm",
            "args": ["start"],
            "cwd": "${workspaceFolder}/frontend",
            "isBackground": true,
            "problemMatcher": {
                "pattern": {
                    "regexp": "^.*$",
                    "file": 1,
                    "location": 2,
                    "message": 3
                },
                "background": {
                    "activeOnStart": true,
                    "beginsPattern": "^.*Starting the development server.*",
                    "endsPattern": "^.*Compiled successfully.*"
                }
            },
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            }
        },
        {
            "label": "🚀 Start All Servers",
            "dependsOn": ["🔧 Start Backend", "⚛️ Start Frontend"],
            "problemMatcher": []
        }
    ]
}
```

### Step 3: Run Tasks in VS Code

**To start everything:**
1. Press **Ctrl + Shift + P**
2. Type: `Tasks: Run Task`
3. Select: `🚀 Start All Servers`

**Or run individual tasks:**
- `🔧 Start Backend`
- `⚛️ Start Frontend`

---

## 🎯 Method 3: Using Launch Configuration (Debugging)

### Step 1: Create Launch Configuration

Press **Ctrl + Shift + D** (Debug view) or create `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: FastAPI Backend",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "server:app",
                "--reload",
                "--host", "0.0.0.0",
                "--port", "8000"
            ],
            "jinja": true,
            "cwd": "${workspaceFolder}/backend",
            "console": "integratedTerminal"
        },
        {
            "name": "Node: React Frontend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/frontend/node_modules/.bin/craco",
            "args": ["start"],
            "cwd": "${workspaceFolder}/frontend",
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        }
    ],
    "compounds": [
        {
            "name": "🚀 Full Stack",
            "configurations": ["Python: FastAPI Backend", "Node: React Frontend"]
        }
    ]
}
```

### Step 2: Start Debugging
1. Press **Ctrl + Shift + D** (Debug view)
2. Select: `🚀 Full Stack`
3. Click green play button or press **F5**

---

## 📋 Keyboard Shortcuts Cheat Sheet

| Action | Shortcut |
|--------|----------|
| Open Terminal | **Ctrl + `** |
| New Terminal | **Ctrl + Shift + `** |
| Close Terminal | **Ctrl + J** then close tab |
| Run Task | **Ctrl + Shift + P** → "Tasks: Run Task" |
| Debug | **F5** |
| Stop Debug | **Shift + F5** |
| View Problems | **Ctrl + Shift + M** |
| View Output | **Ctrl + Shift + U** |

---

## 🎨 VS Code Extensions (Recommended)

Install these for better development experience:

1. **Python** (Microsoft)
   - ID: `ms-python.python`
   - Debugger, linter, formatter support

2. **Pylance** (Microsoft)
   - ID: `ms-python.vscode-pylance`
   - Python code analysis

3. **ES7+ React/Redux/React-Native snippets** (dsznajder)
   - ID: `dsznajder.es7-react-js-snippets`
   - React development helpers

4. **Thunder Client** (Rangav)
   - ID: `rangav.vscode-thunder-client`
   - Test API endpoints from VS Code

5. **REST Client** (Huachao Mao)
   - ID: `humao.rest-client`
   - Quick API testing

### Install Extensions:
```powershell
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension rangav.vscode-thunder-client
code --install-extension humao.rest-client
```

Or install from VS Code Extensions Marketplace (Ctrl + Shift + X)

---

## 📁 Recommended VS Code Workspace Structure

Create: `.vscode/settings.json`

```json
{
    "[python]": {
        "editor.defaultFormatter": "ms-python.python",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.organizeImports": true
        }
    },
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true
    },
    "[json]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": true,
    "files.exclude": {
        "**/__pycache__": true,
        "**/node_modules": true,
        "**/.pytest_cache": true
    },
    "search.exclude": {
        "**/node_modules": true,
        "**/__pycache__": true
    }
}
```

---

## 🔍 Debugging in VS Code

### Debug Python (Backend)

1. Open `backend/server.py`
2. Click line number to add breakpoint (red dot)
3. Press **F5** or Run → Start Debugging
4. Trigger the code to hit breakpoint
5. Use Debug Console to inspect variables

### Debug React (Frontend)

1. Press **F12** in browser (DevTools)
2. OR use VS Code's JavaScript debugger (configured in launch.json)
3. Set breakpoints in your React components
4. Interact with the app to trigger breakpoints

---

## 📊 Useful VS Code Features

### 1. Split Terminal View
- Click terminal tab
- Right-click → "Split Terminal"
- Now run backend and frontend side-by-side

### 2. Rename Terminals
- Right-click terminal tab
- Select "Rename"
- Give meaningful names like "Backend", "Frontend"

### 3. Task Monitoring
- Open Problems panel: **Ctrl + Shift + M**
- See errors and warnings in real-time

### 4. Output Monitoring
- Open Output panel: **Ctrl + Shift + U**
- Select channel from dropdown to view specific output

### 5. Integrated Git
- Source Control: **Ctrl + Shift + G**
- Commit, push, pull without leaving VS Code

---

## 🚀 Quickest Way to Start

### One-Click Start (Save as Macro)

1. **Install** "Makefile" extension
2. Create file: `Makefile` in project root:

```makefile
.PHONY: run
run:
	start powershell -NoExit -Command "cd backend; python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
	start powershell -NoExit -Command "cd frontend; npm start"

.PHONY: dev
dev:
	code .

.PHONY: backend
backend:
	cd backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

.PHONY: frontend
frontend:
	cd frontend && npm start
```

3. Run from terminal:
```bash
make run
```

---

## 🎯 My Recommended Setup

### Step 1: Open VS Code
```powershell
cd c:\Users\Admin\Downloads\GenAiTestFlow\app-main
code .
```

### Step 2: Create .vscode Folder Structure

VS Code automatically creates:
- `.vscode/settings.json` - Editor settings
- `.vscode/tasks.json` - Custom tasks
- `.vscode/launch.json` - Debug configurations

### Step 3: Open Integrated Terminals
- Press **Ctrl + `** for Terminal 1
- Press **Ctrl + Shift + `** for Terminal 2

### Step 4: Start Servers

**Terminal 1:**
```powershell
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2:**
```powershell
cd frontend
npm start
```

### Step 5: Click Link in Terminal
- VS Code shows clickable link: http://localhost:3000
- Click it to open in default browser

---

## 📝 Tips & Tricks

1. **Hover over imports** - See module documentation
2. **Use Intellisense** - Press **Ctrl + Space** for autocomplete
3. **Format code** - Press **Shift + Alt + F** for auto-formatting
4. **Go to definition** - Press **F12** or **Ctrl + Click**
5. **Find all references** - Press **Shift + F12**
6. **Quick fix** - Press **Ctrl + .** for suggestions

---

## ✨ Final Checklist

- [ ] VS Code installed and opened in project folder
- [ ] Python extension installed
- [ ] Node.js path recognized in VS Code
- [ ] `.vscode/tasks.json` created (if using tasks)
- [ ] `.vscode/launch.json` created (if using debug)
- [ ] `.env` file exists with correct MongoDB connection
- [ ] Backend and frontend dependencies installed
- [ ] Terminals ready for commands

---

**You're ready to develop from VS Code!** 🚀

For any issues, check the VS Code Output panel or terminal for error messages.
