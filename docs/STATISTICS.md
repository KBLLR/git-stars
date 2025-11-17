# Statistics Documentation

## Overview

The git-stars statistics module provides comprehensive analytics about your starred GitHub repositories. Statistics are pre-computed and cached for optimal performance.

## Generation

### Manual Generation

```bash
npm run generate:stats
```

This command:
1. Loads repository data from `data/data.json`
2. Calculates comprehensive statistics
3. Saves results to `data/stats.json`
4. Displays summary in console

### Automatic Generation

Statistics are automatically regenerated when:
- Running `npm run build` (includes data generation + stats)
- GitHub Actions workflows execute
- MCP server calculates them on-demand (if cache missing)

## Statistics Structure

The generated `stats.json` contains the following sections:

### Summary

Overall metrics across all repositories:

```json
{
  "summary": {
    "total_repos": 1880,
    "total_stars": 11738397,
    "total_forks": 1687332,
    "total_open_issues": 171639,
    "average_stars": "6243.83",
    "average_forks": "897.52"
  }
}
```

**Fields**:
- `total_repos`: Total number of starred repositories
- `total_stars`: Sum of all stars across repositories
- `total_forks`: Sum of all forks
- `total_open_issues`: Sum of all open issues
- `average_stars`: Mean stars per repository
- `average_forks`: Mean forks per repository

### Languages

Programming language distribution with detailed metrics:

```json
{
  "languages": {
    "Python": {
      "count": 810,
      "total_stars": 5234567,
      "total_forks": 892341,
      "percentage": "43.09%",
      "repos": [
        {
          "name": "tensorflow",
          "author": "tensorflow",
          "stars": 175000
        },
        ...
      ]
    },
    "JavaScript": { ... },
    "TypeScript": { ... }
  }
}
```

**Fields per language**:
- `count`: Number of repositories using this language
- `total_stars`: Sum of stars for repos in this language
- `total_forks`: Sum of forks for repos in this language
- `percentage`: Percentage of total repositories
- `repos`: Top 10 repositories by stars (name, author, stars)

**Ordered**: Languages sorted by count (descending)

### Topics

Most popular topics/tags across repositories:

```json
{
  "topics": {
    "javascript": {
      "count": 425,
      "total_stars": 3421876,
      "repos": ["react", "vue", "angular", ...]
    },
    "machine-learning": { ... }
  }
}
```

**Fields per topic**:
- `count`: Number of repositories tagged with this topic
- `total_stars`: Sum of stars for repos with this topic
- `repos`: Top 5 repository names

**Ordered**: Topics sorted by count (descending)
**Limited**: Top 100 topics only

### Licenses

License distribution across repositories:

```json
{
  "licenses": {
    "MIT": {
      "count": 892,
      "percentage": "47.45%"
    },
    "Apache-2.0": {
      "count": 234,
      "percentage": "12.45%"
    },
    "None": {
      "count": 156,
      "percentage": "8.30%"
    }
  }
}
```

**Ordered**: Licenses sorted by count (descending)

### Authors

Most prolific repository authors you've starred:

```json
{
  "authors": {
    "google": {
      "count": 45,
      "total_stars": 1234567,
      "repos": ["tensorflow", "chrome", "android", ...]
    },
    "microsoft": { ... }
  }
}
```

**Fields per author**:
- `count`: Number of their repositories you've starred
- `total_stars`: Sum of stars across their repositories
- `repos`: Top 5 repository names

**Ordered**: Authors sorted by count (descending)
**Limited**: Top 50 authors only

### Yearly Activity

Repository activity timeline based on last update:

```json
{
  "yearly_activity": {
    "2025": 834,
    "2024": 542,
    "2023": 341,
    "2022": 163
  }
}
```

**Ordered**: Years sorted descending (most recent first)

### Top Repositories

Three different rankings of top repositories:

#### By Stars

```json
{
  "top_repos": {
    "by_stars": [
      {
        "name": "tensorflow",
        "author": "tensorflow",
        "stars": 175000,
        "forks": 88000,
        "description": "An Open Source Machine Learning Framework",
        "url": "https://github.com/tensorflow/tensorflow",
        "language": "Python",
        "topics": ["machine-learning", "deep-learning", ...]
      },
      ...
    ]
  }
}
```

**Limited**: Top 50 repositories

#### By Forks

```json
{
  "top_repos": {
    "by_forks": [
      {
        "name": "linux",
        "author": "torvalds",
        "stars": 125000,
        "forks": 45000,
        ...
      },
      ...
    ]
  }
}
```

**Limited**: Top 50 repositories

#### By Recent Activity

```json
{
  "top_repos": {
    "by_activity": [
      {
        "name": "gpt-4-turbo",
        "author": "openai",
        "stars": 5000,
        "last_updated": "11/16/2025",
        ...
      },
      ...
    ]
  }
}
```

**Limited**: Top 50 repositories
**Note**: Only includes repos with `last_updated` field

### Distributions

Star and fork distribution ranges:

```json
{
  "distributions": {
    "stars_ranges": {
      "0-10": 234,
      "11-50": 456,
      "51-100": 321,
      "101-500": 543,
      "501-1000": 178,
      "1000+": 148
    },
    "forks_ranges": {
      "0-5": 567,
      "6-25": 432,
      "26-100": 345,
      "101-500": 234,
      "500+": 302
    }
  }
}
```

Useful for understanding the distribution of repository popularity.

## Using Statistics

### Via MCP Server

```javascript
// Get all statistics
const stats = await mcpClient.callTool("get_statistics", {});

// Get language breakdown
const languages = await mcpClient.callTool("get_language_breakdown", {
  topN: 10
});

// Get trending topics
const topics = await mcpClient.callTool("get_trending_topics", {
  limit: 20
});
```

### Via Direct File Access

```javascript
import fs from 'fs/promises';

const stats = JSON.parse(
  await fs.readFile('data/stats.json', 'utf-8')
);

console.log(`Total repos: ${stats.summary.total_repos}`);
console.log(`Top language: ${Object.keys(stats.languages)[0]}`);
```

### In Streamlit App

The Streamlit app automatically loads and displays statistics:

```bash
npm run streamlit
```

Navigate to the Statistics/Analytics section to view interactive visualizations.

## Performance

| Metric | Value |
|--------|-------|
| Generation time | ~2-3 seconds for 1880 repos |
| File size | ~500KB-2MB depending on repo count |
| Load time | < 100ms |

## Customization

### Adding New Statistics

Edit `src/analytics/statistics.js`:

```javascript
function calculateStatistics(repos) {
  const stats = {
    // ... existing stats ...

    // Add your custom statistic
    custom_metric: calculateCustomMetric(repos),
  };

  return stats;
}

function calculateCustomMetric(repos) {
  // Your calculation logic
  return result;
}
```

Then regenerate:
```bash
npm run generate:stats
```

### Filtering Statistics

Generate statistics for a subset of repositories:

```javascript
import { calculateStatistics } from './src/analytics/statistics.js';

// Load repos
const allRepos = JSON.parse(await fs.readFile('data/data.json', 'utf-8'));

// Filter (e.g., only Python repos)
const pythonRepos = allRepos.filter(r =>
  r.languages?.[0]?.language === 'Python'
);

// Calculate
const pythonStats = calculateStatistics(pythonRepos);
```

## Visualizations

The statistics can be visualized in several ways:

### 1. Console Summary

Automatic when running `npm run generate:stats`

### 2. Streamlit Dashboard

```bash
npm run streamlit
```

Interactive charts and graphs for all statistics.

### 3. Custom Visualizations

Example with Chart.js:

```javascript
// Language distribution pie chart
const languageData = Object.entries(stats.languages).map(([lang, data]) => ({
  label: lang,
  value: data.count
}));

// Create chart
new Chart(ctx, {
  type: 'pie',
  data: {
    labels: languageData.map(d => d.label),
    datasets: [{
      data: languageData.map(d => d.value)
    }]
  }
});
```

## Integration Examples

### Python Analysis

```python
import json

with open('data/stats.json', 'r') as f:
    stats = json.load(f)

# Top 5 languages by total stars
languages = stats['languages']
top_langs = sorted(
    languages.items(),
    key=lambda x: x[1]['total_stars'],
    reverse=True
)[:5]

for lang, data in top_langs:
    print(f"{lang}: {data['total_stars']:,} stars across {data['count']} repos")
```

### JavaScript Analysis

```javascript
import stats from './data/stats.json' assert { type: 'json' };

// Find trending topics in 2025
const recentTopics = Object.entries(stats.topics)
  .filter(([topic, data]) =>
    data.repos.some(repo =>
      repo.last_updated?.includes('2025')
    )
  )
  .slice(0, 10);
```

## Troubleshooting

### Statistics not updating

**Solution**: Manually regenerate
```bash
npm run generate:stats
```

### Missing language data

**Cause**: Data file doesn't have language information
**Solution**: Regenerate data with full details
```bash
npm run build:data
npm run generate:stats
```

### Large file size

**Cause**: Too many repositories or verbose data
**Solution**: Customize statistics.js to limit data:
- Reduce `repos` arrays from 10 to 5
- Reduce `top_repos` from 50 to 20
- Reduce `topics` from 100 to 50

## API Reference

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed tool documentation.

## License

ISC - See LICENSE file
