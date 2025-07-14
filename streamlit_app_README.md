# Git Stars - Streamlit Dashboard

A powerful interactive dashboard for visualizing and analyzing your GitHub starred repositories, built with Streamlit.

![Streamlit App Screenshot](https://via.placeholder.com/800x450.png?text=Git+Stars+Streamlit+Dashboard)

## Overview

This Streamlit application provides an interactive interface to explore your GitHub stars data through multiple visualizations and analysis tools. It complements the main Git Stars web application by offering more advanced analytics capabilities.

## Features

- **Repository Explorer**: Browse all your starred repositories with filtering options
- **University Modules**: Connect your academic knowledge with coding projects
- **Research Papers**: Link research papers to related code repositories
- **Project Generator**: Get project ideas by combining insights from different domains
- **Network Graph**: Visualize connections between repos, modules, and papers using an interactive graph

## Installation

### Prerequisites

- Python 3.8 or higher
- Pip package manager

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/KBLLR/git-stars.git
   cd git-stars
   ```

2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Make sure you have generated your data files:
   ```bash
   npm run build:data
   ```

## Running Locally

Start the Streamlit app with:

```bash
streamlit run src/streamlit_app/app.py
```

The app will be available at http://localhost:8501

## Data Files

The app expects the following data files in the `data` directory:

- `code.json`: Your GitHub starred repositories
- `modules.json`: University module information (if applicable)
- `knowledgeBase.json`: Research papers and notes

If these files don't exist, the app will show appropriate error messages.

## Deployment to Streamlit Cloud

1. Fork this repository to your GitHub account
2. Log in to [Streamlit Cloud](https://streamlit.io/cloud)
3. Click "New app" and select your forked repository
4. Set the path to `src/streamlit_app/app.py`
5. Click "Deploy"

## Troubleshooting

### Common Issues

- **"You do not have access to this app or it does not exist"**: Make sure you're logged in with the same GitHub account that owns the app.
- **"Missing data files"**: Ensure you've generated the necessary data files first.
- **"Module not found"**: Check that all dependencies are installed from requirements.txt.

### Data Generation

If you're seeing errors about missing data, run the data generation script:

```bash
npm run build:data
```

## Customization

You can customize the app by modifying:

- `.streamlit/config.toml`: Streamlit app configuration
- `src/streamlit_app/app.py`: Main application code
- `src/streamlit_app/utils.py`: Utility functions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.