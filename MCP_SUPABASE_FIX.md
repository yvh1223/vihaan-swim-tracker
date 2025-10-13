# Supabase MCP Configuration Fix

## Problem
The Supabase MCP server was failing with "Unauthorized" error because it was using the old NPM package approach with an expired access token.

## Solution
Updated to the new **HTTP-based MCP server** that uses browser authentication instead of access tokens.

## Changes Made

### 1. Global Claude Desktop Config
**File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Old Configuration** (lines 121-129):
```json
"supabase": {
  "command": "npx",
  "args": [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    "--access-token",
    "sbp_c55845ba1036d89dd4e35e7c2e1ba40f4e751f9e"
  ]
}
```

**New Configuration**:
```json
"supabase": {
  "type": "http",
  "url": "https://mcp.supabase.com/mcp?project_ref=gwqwpicbtkamojwwlmlp&features=database,debugging,development,docs"
}
```

### 2. Project-Specific Config
**File**: `.mcp.json`

**Updated**: Fixed URL encoding (removed `%2C`, used proper commas)

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=gwqwpicbtkamojwwlmlp&features=database,debugging,development,docs,functions,branching,storage"
    }
  }
}
```

## How It Works Now

### Authentication Flow
1. **No Access Token Needed**: The new HTTP-based server handles authentication through your browser
2. **Auto-Login Prompt**: When you use Supabase MCP commands, it will open your browser
3. **Supabase Login**: Log in to your Supabase account in the browser
4. **Grant Access**: Allow Claude to access your project
5. **Done**: MCP connection is authenticated and ready to use

### Configuration Parameters

- **`type: "http"`**: Specifies HTTP-based MCP server (not command-line)
- **`url`**: The Supabase MCP endpoint with query parameters:
  - `project_ref=gwqwpicbtkamojwwlmlp`: Scopes to your specific project
  - `features=...`: Comma-separated list of enabled features

### Available Features
- `database`: SQL queries, schema management
- `debugging`: Logs and error tracking
- `development`: Development tools
- `docs`: Documentation access
- `functions`: Edge Functions management
- `branching`: Database branching
- `storage`: File storage operations

## Next Steps

### 1. Restart Claude Desktop
Close and reopen Claude Desktop (or Claude Code) to load the new configuration.

### 2. Test the Connection
Try running a simple Supabase query:
```
List all tables in the vihaan-swim-tracker database
```

### 3. First-Time Authentication
If prompted:
1. Browser window will open
2. Log in to Supabase
3. Select your organization
4. Grant access to the project

### 4. Security Recommendations
- ✅ Project scoped to `gwqwpicbtkamojwwlmlp` (safe)
- ⚠️ Consider adding `read_only=true` for safer queries
- ⚠️ Never use with production data (this is development)

## Security: Adding Read-Only Mode (Optional)

If you want to prevent accidental write operations, update the URL:

```json
"url": "https://mcp.supabase.com/mcp?project_ref=gwqwpicbtkamojwwlmlp&read_only=true&features=database,debugging,development,docs"
```

This prevents any write operations and makes the connection safer for exploration.

## Troubleshooting

### If MCP Still Fails
1. **Restart Claude Desktop completely**
2. **Clear browser cache** for Supabase
3. **Re-authenticate** if prompted
4. **Check project access** in Supabase dashboard

### If Authentication Fails
- Make sure you're logged in to Supabase at https://supabase.com
- Verify you have access to project `gwqwpicbtkamojwwlmlp`
- Check that your organization has the project

### Fallback: Use Web UI
If MCP still doesn't work, you can always use:
- **Supabase SQL Editor**: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
- **Direct REST API**: Using curl commands as we did earlier

## References
- Supabase MCP Documentation: https://supabase.com/docs/guides/getting-started/mcp
- GitHub Repo: https://github.com/supabase-community/supabase-mcp
- Official Blog: https://supabase.com/blog/mcp-server

---

**Fixed**: January 2025
**Project**: vihaan-swim-tracker
**MCP Version**: HTTP-based (2025+)
