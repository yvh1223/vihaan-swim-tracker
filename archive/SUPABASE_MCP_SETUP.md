# Supabase MCP Server Setup

## ✅ Installation Complete

The Supabase MCP server has been successfully installed and configured for the vihaan-swim-tracker project.

## Configuration Details

### Installation Method
- **Tool**: pipx
- **Package**: supabase-mcp-server v0.4
- **Binary Location**: `/Users/yhuchchannavar/.local/bin/supabase-mcp-server`

### Project Configuration
- **Project**: vihaan-swim-tracker
- **Supabase Project**: gwqwpicbtkamojwwlmlp
- **Region**: us-east-1
- **Config File**: `~/.config/supabase-mcp/.env`
- **MCP Config**: `~/.cursor/mcp.json` (Cursor IDE)

### Environment Variables
```bash
QUERY_API_KEY=qry_v1_PJddiwrbaizZA10fRGjDqYJHCcpqKhPrvHZbrtcirOU
SUPABASE_PROJECT_REF=gwqwpicbtkamojwwlmlp
SUPABASE_REGION=us-east-1
SUPABASE_DB_PASSWORD=Vihaan@123
SUPABASE_SERVICE_ROLE_KEY=[configured]
SUPABASE_ACCESS_TOKEN=[configured]
```

## Services Initialized

✅ PostgreSQL client - Remote project: gwqwpicbtkamojwwlmlp (us-east-1)
✅ Management API client
✅ Supabase SDK client
✅ Safety configurations
✅ Query API client - https://api.thequery.dev/v1

## Usage in Claude Code / Cursor

The MCP server is now available in Claude Code and Cursor. After restarting your IDE, you can:

1. **Query Database**:
   ```
   Query the competition_results table for swimmer_id = 1
   ```

2. **Execute SQL**:
   ```
   Execute this SQL: [paste SQL from scripts/]
   ```

3. **Manage Data**:
   - View tables and schemas
   - Execute queries safely
   - Update records with validation

## Database Access

### Tables
- `swimmers` - Swimmer profiles
- `competition_results` - All meet results with time standards
- `time_standards` - USA Swimming motivational standards

### Latest SQL Scripts
- `scripts/FIX_TIME_STANDARDS_MOTIVATIONAL.sql` - Includes 500 FR SCY standard
- `scripts/RECALCULATE_ALL_TIME_STANDARDS.sql` - Comprehensive recalculation

## Testing MCP

To test the MCP server manually:

```bash
export QUERY_API_KEY="qry_v1_PJddiwrbaizZA10fRGjDqYJHCcpqKhPrvHZbrtcirOU"
export SUPABASE_PROJECT_REF="gwqwpicbtkamojwwlmlp"
export SUPABASE_DB_PASSWORD="Vihaan@123"
export SUPABASE_REGION="us-east-1"

# Test initialization
supabase-mcp-server
```

## Alternative Access Methods

### Direct REST API
```bash
curl "https://gwqwpicbtkamojwwlmlp.supabase.co/rest/v1/swimmers?select=*" \
  -H "apikey: [anon-key]" \
  -H "Authorization: Bearer [service-role-key]"
```

### Supabase Dashboard
- SQL Editor: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
- Table Editor: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/editor
- Settings: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/settings

## Next Steps

1. **Restart Claude Code / Cursor** to load the MCP configuration
2. **Test MCP** by asking Claude to query the database
3. **Execute SQL** scripts as needed via MCP or dashboard
4. **Verify data** using the web application at http://localhost:8000

## Troubleshooting

### MCP Not Loading
- Restart Cursor/Claude Code
- Check `~/.cursor/mcp.json` for syntax errors
- Verify credentials in `~/.config/supabase-mcp/.env`

### Query Errors
- Verify project reference is correct
- Check database password
- Ensure Query API key is valid (thequery.dev)

### Alternative Methods
- Use Supabase SQL Editor for complex operations
- Use direct REST API for simple queries
- Check browser console for frontend issues

## Security Notes

- Credentials stored in `~/.config/supabase-mcp/.env`
- Service role key has full database access
- Query API key required for MCP v0.4+
- Use read-only mode for safety when possible

---

**Setup Date**: October 13, 2025
**MCP Version**: supabase-mcp-server 0.4
**Status**: ✅ Active and configured
