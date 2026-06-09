# How to remove committed secrets from history and prevent re-committing them

This repository previously contained a `.env` file with secrets. We have removed the values from the file in a later commit and added a `.gitignore` entry, but the secrets may still exist in the repository history. To fully remove them from all commits, follow the steps below.

WARNING: Rewriting history is destructive: it will change commit SHAs and requires everyone who uses this repository to re-clone. Only proceed if you understand the consequences.

Preferred approach: git-filter-repo (recommended)

1. Install git-filter-repo
   - macOS (Homebrew): `brew install git-filter-repo`
   - Linux: follow the project instructions: https://github.com/newren/git-filter-repo

2. Run the cleanup (from any machine with your GitHub access):

```bash
# Make a backup of your repo first!
git clone --mirror git@github.com:ipanjul21/Auto-posting-.git
cd Auto-posting-.git
# Remove the .env file from all commits
git filter-repo --invert-paths --path .env
# Force-push the rewritten history back to GitHub
git push --force
```

Alternative: BFG Repo-Cleaner

1. Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:

```bash
git clone --mirror git@github.com:ipanjul21/Auto-posting-.git
java -jar bfg.jar --delete-files .env Auto-posting-.git
cd Auto-posting-.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

After the rewrite

- Notify all collaborators to re-clone the repository: `git clone git@github.com:ipanjul21/Auto-posting-.git`
- Rotate/revoke any API keys or client secrets that were previously committed. Treat them as compromised.
- Set new secrets in your hosting provider (Heroku/Vercel/GitHub Actions secrets) or keep them locally in a `.env` file that is in `.gitignore`.

Security checklist

- `.env` is listed in `.gitignore` (added in this commit).
- `.env.example` exists with placeholders (no secret values).
- Do NOT commit secrets in the future. Use secret management solutions.

If you want, I can:
- Prepare the git-filter-repo/BFG commands customized for other file paths or patterns.
- Walk you through running the cleanup on your machine (step-by-step).
