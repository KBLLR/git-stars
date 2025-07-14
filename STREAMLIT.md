# Deploying Git Stars to Streamlit Cloud

This guide provides instructions for deploying the Git Stars Streamlit dashboard to Streamlit Cloud, and resolving common access issues.

## What is the Git Stars Streamlit Dashboard?

The Git Stars Streamlit dashboard is a companion app to the main Git Stars application. It provides:

- Visual analytics of your GitHub starred repositories
- Interactive network graphs showing relationships between repositories
- Project idea generation based on your interests
- Custom views of your GitHub data

## Prerequisites

Before deploying to Streamlit Cloud, ensure you have:

1. A GitHub account (same one you use for your starred repositories)
2. The Git Stars repository pushed to GitHub
3. Generated your `data.json` file with your starred repositories

## Deployment Steps

### 1. Push Your Repository to GitHub

Ensure your Git Stars project is pushed to a GitHub repository that you own:

```bash
git add .
git commit -m "Prepare for Streamlit deployment"
git push origin main
```

### 2. Deploy to Streamlit Cloud

1. Visit [Streamlit Cloud](https://streamlit.io/cloud)
2. Sign in with your GitHub account
3. Click "New app"
4. Select your Git Stars repository
5. Configure the app:
   - **Main file path**: `src/streamlit_app/app.py`
   - **Branch**: `main` (or whichever branch you're using)
   - **Advanced Settings**: No special configuration needed
6. Click "Deploy"

## Resolving the "You do not have access" Error

If you encounter the error: "You do not have access to this app or it does not exist", this typically means:

### Problem 1: Account Mismatch

The GitHub account you're signed into Streamlit with is different from the one that owns the Streamlit app.

**Solution:**
1. Check which GitHub account you're currently signed in with (shown in the Streamlit Cloud UI)
2. Sign out of Streamlit Cloud
3. Sign back in with the GitHub account that owns the repository containing your Streamlit app
4. If you're using multiple GitHub accounts, ensure you're using the same one (KBLLR) that owns the repository

### Problem 2: Repository Permissions

The Streamlit app may not have permission to access your repository.

**Solution:**
1. Go to your GitHub account settings
2. Navigate to "Applications"
3. Find Streamlit in the list of authorized OAuth Apps
4. Ensure it has access to your Git Stars repository
5. If not, update permissions or re-authorize Streamlit

### Problem 3: Repository Name or Structure Changed

If you renamed your repository or changed its structure, the Streamlit app link might be outdated.

**Solution:**
1. Deploy a new app with the updated repository name/structure
2. Delete the old app if it exists

## Updating Your Streamlit App

When you update your data or code:

1. Push changes to GitHub
2. Streamlit Cloud will automatically redeploy your app

For data-only updates:
1. Run `npm run build:data` to generate a fresh `data.json`
2. Commit and push the updated data file
3. Streamlit Cloud will pick up the changes automatically

## Making Your App Public or Private

By default, Streamlit apps are public.

**To make your app private:**
1. In Streamlit Cloud, go to your app's settings
2. Under "Sharing", select "Private"
3. You can then add specific users who can access the app

**For complete public access:**
1. Ensure the app is set to "Public" in settings
2. Share the URL with anyone you want to access it

## Local Development

To run the Streamlit app locally:

```bash
# Navigate to your git-stars directory
cd git-stars

# Install Streamlit if not already installed
pip install streamlit networkx pyvis

# Run the app
streamlit run src/streamlit_app/app.py
```

## Support

If you continue to experience issues with Streamlit Cloud access:
1. Check the [Streamlit documentation](https://docs.streamlit.io/)
2. Visit [Streamlit Community](https://discuss.streamlit.io/) for help
3. Contact Streamlit support directly through their website