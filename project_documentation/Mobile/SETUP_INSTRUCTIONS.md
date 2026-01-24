# Mobile Project Setup Script

## PowerShell Execution Policy Issue

You encountered a PowerShell execution policy restriction. Here are the solutions:

---

## Solution 1: Enable Script Execution (Recommended)

**Step 1:** Run PowerShell as Administrator

**Step 2:** Execute this command:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Step 3:** Navigate to project folder and create Expo app:
```bash
cd c:\laragon\www\ramouse
npx create-expo-app@latest mobile --template blank-typescript
```

---

## Solution 2: Use Command Prompt (Easiest)

**Step 1:** Open Command Prompt (cmd.exe) - NOT PowerShell

**Step 2:** Run these commands:
```bash
cd c:\laragon\www\ramouse
npx create-expo-app@latest mobile --template blank-typescript
```

---

## Solution 3: Bypass Policy for Single Command

In PowerShell, run:
```powershell
cd c:\laragon\www\ramouse
powershell -ExecutionPolicy Bypass -Command "npx create-expo-app@latest mobile --template blank-typescript"
```

---

## After Project Creation

Once the Expo project is created, let me know and I'll help you:

1. ✅ Set up the complete folder structure
2. ✅ Install all dependencies (~30 packages)
3. ✅ Configure environment variables
4. ✅ Create configuration files (tsconfig, babel, etc.)
5. ✅ Set up TypeScript path aliases
6. ✅ Create API client with interceptors
7. ✅ Set up authentication store
8. ✅ Configure role-based navigation
9. ✅ Create base components
10. ✅ Set up development environment

---

## Expected Output

When successful, you should see:
```
✔ Downloaded and extracted project files.
✔ Installed JavaScript dependencies.

Your project is ready!

To run your project, navigate to the directory and run one of the following npm commands.

- cd mobile
- npm start # you can open iOS, Android, or web from here, or run them directly with the commands below.
- npm run android
- npm run ios
- npm run web
```

---

## Next Steps After Creation

1. Navigate to mobile folder: `cd mobile`
2. Let me know it's created
3. I'll set up the complete architecture
4. Start development server: `npm start`

---

**Choose your preferred solution and run the commands. Let me know when the project is created!**
