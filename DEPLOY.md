# Publish Moment to recruiters

## A. Test locally
1. Install Node.js 20+ if needed.
2. Unzip project and open the `moment-prototype` folder in Codex or VS Code.
3. Run `npm install`, `npm run lint`, `npm run build`, and `npm run dev`.
4. Visit http://localhost:3000; verify Today, Memories, reload persistence, Phrug follow-up and mobile layout.

## B. Publish code to GitHub
1. Create an empty public repo called `moment-journal` on https://github.com/new. Do **not** add a README there because the project already has one.
2. From the project folder:
   ```bash
   git init
   git add .
   git commit -m "Build Moment journaling MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/moment-journal.git
   git push -u origin main
   ```
3. Replace `YOUR_USERNAME` with your account. If you already have `origin`, use `git remote set-url origin ...` instead.
4. Confirm `.env*` files and private entries are not in your commit.

## C. Deploy for free on Vercel
1. Go to https://vercel.com/new, sign in via GitHub, and import `moment-journal`.
2. Framework preset should detect Next.js. Root directory is the repository root.
3. Click Deploy. No environment variables are required for this prototype.
4. Open the generated `.vercel.app` URL in a private browser window and on your phone.
5. Use **Try two fictional demo entries** to verify Phrug's personalized follow-up with reviewers.
6. Add the live link near the top of README.md and push the change.

## D. Resume
Put a short `GitHub | Live Demo` pair beside the project title. Only list features verified in the published app. Do not claim AI/LLM-generated prompts, user retention gains, or user research outcomes unless those have actually happened.
