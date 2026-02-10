# MCP Server Documentation

## Overview

The git-stars MCP (Model Context Protocol) server provides a standardized interface for AI agents to query and analyze GitHub starred repository data. It implements the MCP specification, allowing compatible agents (including MLX-local systems) to seamlessly access comprehensive repository information and statistics.

## Features

- **7 Core Tools**: List, search, filter, and analyze repositories
- **Comprehensive Statistics**: Pre-computed analytics for fast responses
- **Flexible Querying**: Multiple filter criteria and sorting options
- **Standards Compliant**: Full MCP protocol implementation
- **High Performance**: Response times < 500ms for most queries

## Installation

### Prerequisites

- Node.js v16 or newer
- npm (included with Node.js)
- GitHub Personal Access Token (for data generation)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate data** (if not already done):
   ```bash
   npm run build:data
   ```

3. **Generate statistics**:
   ```bash
   npm run generate:stats
   ```

## Running the MCP Server

### Standalone Mode

```bash
npm run mcp
```

The server runs on stdio transport and will log to stderr:
```
Loading repository data...
Loaded 1880 repositories
MCP Server running on stdio
```

### Integration with MCP Clients

#### Desktop MCP Client

Add to your MCP desktop client configuration:

```json
{
  "mcpServers": {
    "git-stars": {
      "command": "node",
      "args": ["/path/to/git-stars/src/mcp-server/index.js"],
      "env": {}
    }
  }
}
```

#### MLX-Compatible Agents

For MLX-compatible agents, configure the MCP server as a tool provider:

```python
from mcp import StdioServerParameters, stdio_client

# Configure server
server = StdioServerParameters(
    command="node",
    args=["/path/to/git-stars/src/mcp-server/index.js"],
    env={}
)

# Use with MLX agent
async with stdio_client(server) as (read, write):
    # Initialize
    await write.initialize()

    # List tools
    tools = await write.list_tools()

    # Call tool
    result = await write.call_tool("list_starred_repos", {
        "limit": 10,
        "sortBy": "stars"
    })
```

#### Custom Integration

Any MCP-compatible client can connect via stdio:

```javascript
import { spawn } from 'child_process';

const server = spawn('node', ['src/mcp-server/index.js']);

// Read from stdout, write to stdin
server.stdout.on('data', (data) => {
  // Handle MCP responses
});

server.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  method: "tools/list",
  id: 1
}));
```

## Available Tools

### 1. list_starred_repos

List all starred repositories with pagination and sorting.

**Parameters**:
- `limit` (number, optional): Maximum repos to return (default: 50)
- `offset` (number, optional): Number to skip (default: 0)
- `sortBy` (string, optional): Sort field - `stars`, `forks`, `name`, `date` (default: `stars`)

**Example**:
```json
{
  "name": "list_starred_repos",
  "arguments": {
    "limit": 10,
    "offset": 0,
    "sortBy": "stars"
  }
}
```

**Response**:
```json
{
  "total": 1880,
  "offset": 0,
  "limit": 10,
  "count": 10,
  "repositories": [...]
}
```

---

### 2. search_repos

Search repositories by name, description, author, or topics.

**Parameters**:
- `query` (string, required): Search term
- `language` (string, optional): Filter by programming language
- `minStars` (number, optional): Minimum stars (default: 0)
- `maxResults` (number, optional): Max results (default: 50)

**Example**:
```json
{
  "name": "search_repos",
  "arguments": {
    "query": "machine learning",
    "language": "Python",
    "minStars": 100
  }
}
```

**Response**:
```json
{
  "query": "machine learning",
  "count": 42,
  "repositories": [...]
}
```

---

### 3. get_repo_details

Get detailed information about a specific repository.

**Parameters**:
- `name` (string, required): Repository name
- `author` (string, optional): Repository owner/author

**Example**:
```json
{
  "name": "get_repo_details",
  "arguments": {
    "name": "tensorflow",
    "author": "tensorflow"
  }
}
```

**Response**: Full repository object with all metadata.

---

### 4. get_statistics

Get comprehensive statistics about all starred repositories.

**Parameters**: None

**Example**:
```json
{
  "name": "get_statistics",
  "arguments": {}
}
```

**Response**:
```json
{
  "generated_at": "2025-11-17T00:27:21.978Z",
  "summary": {
    "total_repos": 1880,
    "total_stars": 11738397,
    "total_forks": 1687332,
    "average_stars": "6243.83",
    ...
  },
  "languages": {...},
  "topics": {...},
  "licenses": {...},
  "top_repos": {...},
  "distributions": {...}
}
```

---

### 5. get_language_breakdown

Get breakdown of repositories by programming language.

**Parameters**:
- `topN` (number, optional): Return top N languages (default: 20)

**Example**:
```json
{
  "name": "get_language_breakdown",
  "arguments": {
    "topN": 10
  }
}
```

**Response**:
```json
{
  "languages": [
    {
      "language": "Python",
      "count": 810,
      "percentage": "43.09%"
    },
    ...
  ]
}
```

---

### 6. get_trending_topics

Get the most popular topics across starred repositories.

**Parameters**:
- `limit` (number, optional): Number of topics (default: 20)

**Example**:
```json
{
  "name": "get_trending_topics",
  "arguments": {
    "limit": 10
  }
}
```

**Response**:
```json
{
  "topics": [
    {
      "topic": "javascript",
      "count": 425
    },
    ...
  ]
}
```

---

### 7. filter_by_criteria

Filter repositories by multiple criteria.

**Parameters**:
- `language` (string, optional): Programming language
- `topic` (string, optional): Topic/tag
- `license` (string, optional): License type
- `minStars` (number, optional): Minimum stars
- `maxStars` (number, optional): Maximum stars
- `minForks` (number, optional): Minimum forks
- `author` (string, optional): Repository author

**Example**:
```json
{
  "name": "filter_by_criteria",
  "arguments": {
    "language": "TypeScript",
    "topic": "react",
    "minStars": 1000,
    "license": "MIT"
  }
}
```

**Response**:
```json
{
  "criteria": {...},
  "count": 24,
  "repositories": [...]
}
```

## Performance

| Operation | Target | Actual |
|-----------|--------|--------|
| Tool response time | < 500ms | ~100-300ms |
| Server startup | < 2s | ~1s |
| Statistics generation | < 60s | ~2s for 1880 repos |

## Data Updates

To refresh the repository data:

```bash
# Fetch latest starred repos
npm run build:data

# Regenerate statistics
npm run generate:stats

# Restart MCP server
npm run mcp
```

## Troubleshooting

### Server won't start

**Error**: `Cannot find module`
**Solution**: Run `npm install` to install dependencies

**Error**: `Error loading data`
**Solution**: Ensure `data/data.json` exists by running `npm run build:data`

### No results returned

**Check**: Verify data file has content
```bash
ls -lh data/data.json
```

**Check**: Verify statistics are generated
```bash
ls -lh data/stats.json
```

### Performance issues

- Regenerate statistics cache: `npm run generate:stats`
- Reduce query result limits
- Use specific filters to narrow results

## Development

### Adding New Tools

1. Add tool definition in `setupToolHandlers()` method
2. Implement handler method (e.g., `handleCustomTool`)
3. Add to switch statement in `CallToolRequestSchema` handler
4. Update this documentation

### Testing

Manual test with MCP inspector:

```bash
npx @modelcontextprotocol/inspector node src/mcp-server/index.js
```

## Security

- No authentication required (local-only access)
- Read-only operations (no data modification)
- No secrets exposed (data is public GitHub info)
- Input validation on all parameters

## License

ISC - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/KBLLR/git-stars/issues
- Documentation: https://github.com/KBLLR/git-stars
