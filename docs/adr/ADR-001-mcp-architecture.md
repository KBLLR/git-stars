# ADR-001: MCP Server Architecture for git-stars

**Date**: 2025-11-17

## Status

✅ **Accepted**

## Context

The git-stars project needed to evolve from a simple static site generator into a tool that can be queried by AI agents. The primary requirements were:

1. **Agent Accessibility**: Enable MLX-OpenAI API compatible agents to access repository data
2. **Standards Compliance**: Use established protocols rather than custom APIs
3. **Performance**: Sub-500ms response times for queries
4. **Maintainability**: Clean architecture that's easy to extend
5. **Backward Compatibility**: Preserve existing frontend and Streamlit UIs

### Problem Statement

How do we expose ~2000 starred GitHub repositories to AI agents in a standardized, performant, and maintainable way?

### Constraints

- Must work with MLX-OpenAI API compatible agents
- Cannot require cloud deployment (local-first)
- Must handle 2000+ repositories efficiently
- Should not break existing functionality
- Limited development time (single implementation sprint)

## Decision

We chose to implement a **Model Context Protocol (MCP) server** with the following architecture:

### Core Design Decisions

#### 1. Protocol: MCP (Model Context Protocol)

**Chosen**: MCP over custom REST API, GraphQL, or gRPC

**Rationale**:
- ✅ Standard protocol with growing ecosystem
- ✅ Native support in Claude Desktop and emerging tools
- ✅ Simple stdio transport (no HTTP server needed)
- ✅ Type-safe tool definitions
- ✅ Built-in support for resources, tools, and prompts

**Alternatives Considered**:
- REST API: Requires HTTP server, more complex deployment
- GraphQL: Overkill for read-only data access
- gRPC: Too heavyweight, limited AI agent support
- Custom Protocol: No standardization, poor compatibility

#### 2. Transport: stdio (Standard Input/Output)

**Chosen**: stdio over SSE (Server-Sent Events) or HTTP

**Rationale**:
- ✅ Simplest implementation
- ✅ No port conflicts or networking issues
- ✅ Process isolation and security
- ✅ Easy integration with Claude Desktop
- ✅ Works in any environment (no firewall issues)

#### 3. Data Storage: File-based JSON

**Chosen**: Centralized `data/` directory with JSON files

**Rationale**:
- ✅ Simple to implement and debug
- ✅ Git-friendly (can commit data snapshots)
- ✅ No database setup required
- ✅ Fast enough for 2000 repos (~1MB file, <100ms load)
- ✅ Easy backup and versioning

**Structure**:
```
data/
├── data.json       # All repository data (flattened)
└── stats.json      # Pre-computed statistics
```

**Alternatives Considered**:
- SQLite: Added complexity, minimal performance gain for read-heavy workload
- Redis: Requires external service, overkill for local tool
- In-memory only: No persistence, requires regeneration on restart

#### 4. Statistics: Pre-computed Cache

**Chosen**: Separate statistics generation step with caching

**Rationale**:
- ✅ Sub-100ms response time for statistics queries
- ✅ Reduces computational load during queries
- ✅ Can regenerate independently of data fetch
- ✅ Predictable performance

**Trade-off**: Statistics may be slightly stale (acceptable for this use case)

#### 5. Tool Design: 7 Focused Tools

**Chosen**: Multiple specialized tools vs. single flexible query tool

**Tools**:
1. `list_starred_repos` - Pagination and sorting
2. `search_repos` - Text search
3. `get_repo_details` - Single repo lookup
4. `get_statistics` - Global statistics
5. `get_language_breakdown` - Language analysis
6. `get_trending_topics` - Topic analysis
7. `filter_by_criteria` - Multi-criteria filtering

**Rationale**:
- ✅ Clear, single-responsibility functions
- ✅ Better for AI agents (explicit capabilities)
- ✅ Easier to document and maintain
- ✅ Allows fine-grained permission control

**Alternative**: Single `query` tool with flexible parameters
- ❌ Harder for agents to discover capabilities
- ❌ More complex input validation
- ❌ Less clear documentation

### Implementation Details

#### Server Structure

```javascript
class GitStarsServer {
  constructor() {
    this.server = new Server({ name: "git-stars-mcp", version: "1.0.0" });
    this.repos = [];  // Loaded repository data
    this.stats = null; // Cached statistics
  }

  async run() {
    // Load data once at startup
    this.repos = await loadData();
    this.stats = await loadStats();

    // Connect via stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

**Key Characteristics**:
- Single-threaded, event-driven
- Data loaded once at startup
- Stateless request handling
- Error boundaries on all tool calls

#### Data Flow

```
GitHub API
    ↓
scripts/generator.js (with caching)
    ↓
data/data.json (1880 repos, 964KB)
    ↓
src/analytics/statistics.js
    ↓
data/stats.json (pre-computed metrics)
    ↓
MCP Server (loads at startup)
    ↓
AI Agent (via stdio)
```

#### Error Handling Strategy

1. **Data Loading**: Graceful degradation (empty array if file missing)
2. **Tool Calls**: Try-catch with error objects in response
3. **Validation**: Input parameter validation in each tool
4. **Logging**: All errors to stderr (stdout reserved for MCP protocol)

## Consequences

### Positive

1. **Standardization**: Using MCP provides future compatibility with emerging tools
2. **Simplicity**: stdio transport means no server management
3. **Performance**: Pre-computed stats deliver sub-100ms responses
4. **Extensibility**: Easy to add new tools without breaking existing ones
5. **Zero Dependencies**: No cloud services, databases, or external dependencies
6. **Developer Experience**: MCP Inspector available for testing
7. **Security**: Local-only, read-only, no authentication needed

### Negative

1. **Limited Scalability**: File-based storage won't scale to 100k+ repos
   - *Mitigation*: Acceptable for personal use case (~2k repos)

2. **Stale Statistics**: Stats may lag behind data updates
   - *Mitigation*: Regeneration is fast (<5s), automated in workflows

3. **Stdio Limitation**: Can't expose as HTTP API without additional work
   - *Mitigation*: Not a requirement; MCP clients handle this

4. **Single Process**: No concurrent request handling
   - *Mitigation*: Queries are fast enough that this isn't an issue

5. **No Incremental Updates**: Must reload all data on changes
   - *Mitigation*: Startup is fast (<1s for 2k repos)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MCP protocol changes | Medium | High | Pin SDK version, monitor releases |
| Data file corruption | Low | Medium | Validate JSON on load, keep backups |
| Performance degradation with growth | Medium | Medium | Monitor file sizes, consider SQLite migration path |
| Agent compatibility issues | Low | High | Test with multiple MCP clients |

## Alternatives Considered

### Alternative 1: REST API with Express

**Pros**:
- Familiar technology
- HTTP debugging tools
- Easy to expose publicly

**Cons**:
- Requires port management
- More complex deployment
- Not standard for AI agents
- Overkill for local tool

**Verdict**: ❌ Rejected - Too heavyweight for local-first tool

### Alternative 2: GraphQL Server

**Pros**:
- Flexible queries
- Strong typing
- Introspection

**Cons**:
- Complex setup
- Learning curve
- Not AI agent focused
- Requires HTTP server

**Verdict**: ❌ Rejected - Unnecessary complexity

### Alternative 3: SQLite Database

**Pros**:
- Better for large datasets
- Query optimization
- Transactional updates

**Cons**:
- Binary file (not git-friendly)
- More complex setup
- Unnecessary for read-heavy workload

**Verdict**: 🔮 Future consideration if data exceeds 10k repos

### Alternative 4: Serverless Functions (AWS Lambda)

**Pros**:
- Scalable
- Pay-per-use
- Global availability

**Cons**:
- Violates local-first principle
- Requires cloud account
- Added latency
- Cost for API calls

**Verdict**: ❌ Rejected - Against project goals

## Implementation Notes

### Performance Benchmarks

Target vs. Actual:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Server startup | < 2s | ~1s | ✅ |
| List repos (50) | < 500ms | ~100ms | ✅ |
| Search query | < 500ms | ~200ms | ✅ |
| Get statistics | < 500ms | ~50ms | ✅ |
| Statistics generation | < 60s | ~2s | ✅ |

### Future Enhancements

Potential improvements within this architecture:

1. **Streaming Responses**: For large result sets, use MCP streaming
2. **Resource Support**: Expose individual repos as MCP resources
3. **Prompt Templates**: Add pre-built prompts for common queries
4. **Notification Support**: Notify on data updates
5. **Multiple Data Sources**: Support multiple GitHub users/organizations

### Migration Path

If we outgrow this architecture:

1. **Phase 1**: Current MCP server (2k repos) ✅
2. **Phase 2**: Add SQLite backend (10k+ repos)
3. **Phase 3**: Add SSE transport for web integrations
4. **Phase 4**: Distributed caching (100k+ repos)

Each phase maintains MCP compatibility.

## Related Decisions

- ADR-002: Statistics Caching Strategy (pending)
- ADR-003: Data Generation Pipeline (pending)

## References

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop MCP Integration](https://docs.anthropic.com/claude/docs/mcp)

## Approval

**Decision Date**: 2025-11-17
**Decision Maker**: Development Team
**Review Date**: 2026-05-17 (6 months)
