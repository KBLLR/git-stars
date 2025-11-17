# Git Stars - GitHub Repository Browser & MCP Server

[![Total Repos](https://img.shields.io/badge/Total-1880+-green.svg)](https://github.com/KBLLR/git-stars)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

> Browse, search, and query your GitHub starred repositories through a modern web interface, Streamlit dashboard, or MCP server for AI agents.

## 🌟 Features

- **📊 Comprehensive Statistics**: Analyze 1880+ starred repositories with pre-computed metrics
- **🤖 MCP Server**: Query repositories via Model Context Protocol (MLX/OpenAI compatible)
- **🔍 Advanced Search**: Filter by language, topic, stars, license, and more
- **📈 Analytics Dashboard**: Interactive Streamlit visualizations
- **⚡ Fast Performance**: Sub-500ms response times for queries
- **🔄 Auto-Updates**: GitHub Actions automation for daily data refresh

## 🚀 Quick Start

### Prerequisites

- Node.js v16+ and npm
- Python 3.8+ (for Streamlit, optional)
- GitHub Personal Access Token ([create one](https://github.com/settings/tokens))

### Installation

```bash
# Clone the repository
git clone https://github.com/KBLLR/git-stars.git
cd git-stars

# Install dependencies
npm install

# Configure GitHub token
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN
```

### Generate Data

```bash
# Fetch starred repos and generate statistics
npm run build:data
npm run generate:stats
```

This creates:
- `data/data.json` - All repository data (1880 repos, ~1MB)
- `data/stats.json` - Pre-computed statistics (~500KB)

## 📱 Usage

### 1. Web Interface (Vite)

```bash
npm run dev
```

Open http://localhost:5173 to browse your starred repos with:
- Real-time search and filtering
- Sort by stars, forks, or date
- View README files inline
- Multiple visual themes

### 2. Streamlit Dashboard

```bash
npm run streamlit
```

Open http://localhost:8501 for interactive analytics:
- Language distribution charts
- Topic frequency analysis
- Repository timeline views
- Custom filtering and exports

### 3. MCP Server (for AI Agents)

```bash
npm run mcp
```

**Use with Claude Desktop**:

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "git-stars": {
      "command": "node",
      "args": ["/path/to/git-stars/src/mcp-server/index.js"]
    }
  }
}
```

**Use with MLX-Compatible Agents**:

```python
from mcp import StdioServerParameters, stdio_client

server = StdioServerParameters(
    command="node",
    args=["/path/to/git-stars/src/mcp-server/index.js"]
)

async with stdio_client(server) as (read, write):
    result = await write.call_tool("list_starred_repos", {"limit": 10})
```

**Available MCP Tools**:
1. `list_starred_repos` - List all repositories with pagination
2. `search_repos` - Search by name, description, topics
3. `get_repo_details` - Get detailed repo information
4. `get_statistics` - Comprehensive analytics
5. `get_language_breakdown` - Language distribution
6. `get_trending_topics` - Most popular topics
7. `filter_by_criteria` - Multi-criteria filtering

See [MCP_SERVER.md](docs/MCP_SERVER.md) for detailed documentation.

## 📊 Statistics

Current dataset:
- **1,880 repositories**
- **11.7M total stars**
- **1.7M total forks**
- **54 programming languages**
- **100+ topics tracked**

Top languages:
1. Python (43%)
2. JavaScript (23%)
3. TypeScript (15%)

Generate fresh stats:
```bash
npm run generate:stats
```

See [STATISTICS.md](docs/STATISTICS.md) for detailed metrics.

## 🔧 Development

### Project Structure

```
git-stars/
├── data/                    # Centralized data storage
│   ├── data.json           # Repository data
│   └── stats.json          # Statistics cache
├── src/
│   ├── mcp-server/         # MCP server implementation
│   ├── analytics/          # Statistics generation
│   ├── frontend/           # Vite web app
│   └── streamlit_app/      # Streamlit dashboard
├── scripts/                # Data generation scripts
├── docs/                   # Documentation
│   ├── MCP_SERVER.md
│   ├── STATISTICS.md
│   └── adr/                # Architecture decisions
└── .github/workflows/      # CI/CD automation
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run build:data       # Fetch GitHub data
npm run generate:stats   # Generate statistics
npm run mcp              # Start MCP server
npm run streamlit        # Start Streamlit app
npm run lint             # Run ESLint
npm run test             # Run tests
```

### Adding New Features

See our [planning documents](_report/) for the development process:
- [00_intake.md](_report/00_intake.md) - Requirements
- [01_audit.md](_report/01_audit.md) - Codebase analysis
- [02_plan.md](_report/02_plan.md) - Implementation plan

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Detailed installation instructions
- **[MCP Server](docs/MCP_SERVER.md)** - MCP integration guide
- **[Statistics](docs/STATISTICS.md)** - Analytics documentation
- **[Architecture Decision Records](docs/adr/)** - Design decisions
- **[Streamlit App](STREAMLIT.md)** - Dashboard guide

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 🔄 Automation

GitHub Actions automatically:
- **Daily**: Fetch latest starred repos and update data
- **On Push**: Deploy to GitHub Pages
- **On PR**: Run tests and linting

See [.github/workflows/](.github/workflows/) for workflow details.

## 🐛 Troubleshooting

### "Failed to load data"

```bash
npm run build:data
```

### "MCP server won't start"

```bash
npm install
npm run generate:stats
```

### "Statistics showing incorrect data"

```bash
npm run generate:stats
```

For more issues, see the [troubleshooting section](docs/MCP_SERVER.md#troubleshooting) or [open an issue](https://github.com/KBLLR/git-stars/issues).

## 📄 License

ISC © KBLLR

## 🙏 Acknowledgments

- Built with [stargazed](https://github.com/abhijithvijayan/stargazed)
- Powered by [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- UI built with [Vite](https://vitejs.dev/)
- Analytics with [Streamlit](https://streamlit.io/)

## 📖 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop MCP](https://docs.anthropic.com/claude/docs/mcp)
- [GitHub API](https://docs.github.com/en/rest)

---

**Auto-generated list of starred repositories**: See [README.md](README.md) for the complete categorized list.
