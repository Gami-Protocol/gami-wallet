# Welcome to your Bilt project

[![Built with Bilt](https://img.shields.io/endpoint?url=https%3A%2F%2Fapp.bilt.me%2Fapi%2Fbadge)](https://bilt.me)

## Project info

**Preview URL**: https://app.bilt.me/project/d312f89a-a5e9-4586-b30f-a7d34868491d/preview

**Project ID**: `d312f89a-a5e9-4586-b30f-a7d34868491d`

## How can I edit this app?

There are several ways of editing your application.

**Use Bilt**

Simply visit your [Bilt Project](https://app.bilt.me/agent/d312f89a-a5e9-4586-b30f-a7d34868491d) and start sending messages. Describe what you want to change, add, or fix in natural language.

Changes made via Bilt are instant - just send a message and your app updates.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can export the source code from Bilt and make changes directly.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Export and clone your Bilt project.
# (Download source from Bilt or connect to your git repo)
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the Expo development server.
npx expo start
```

Scan the QR code with Expo Go on your phone to see your app running locally.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- React Native
- Expo
- TypeScript
- AsyncStorage (local data persistence)
- Expo Router (navigation)

All generated automatically by Bilt from your natural language instructions.

## How can I test this project?

**Option 1: Instant Preview (Recommended)**

Open the preview URL in your browser: `https://app.bilt.me/project/d312f89a-a5e9-4586-b30f-a7d34868491d/preview`

Scan the QR code with Expo Go ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) on your phone.

**Option 2: Run Locally**

```sh
npm install
npx expo start
```

Then scan the QR code with Expo Go.

## How can I deploy this project?

Go to your [Bilt Project](https://app.bilt.me/agent/d312f89a-a5e9-4586-b30f-a7d34868491d), after that go to Settings -> App Store.

### Deploy with Bilt

Simply send a message to your Bilt project: "Deploy this app to production"

Bilt will handle the build and provide you with download links or submission-ready builds.

## Gami Protocol integrations

The wallet integrates with the Gami Protocol stack. All endpoints are read from
`EXPO_PUBLIC_*` environment variables (inlined at build time) so nothing is
hardcoded. They are optional — each integration degrades gracefully when unset.

| Variable                         | Used by                | Default                 | Description                                                                                                                                                                         |
| -------------------------------- | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_GAMI_RPC_URL`       | gami-protocol-chain    | `http://localhost:8545` | EVM RPC endpoint for the Gami chain (balances + sends).                                                                                                                             |
| `EXPO_PUBLIC_GAMI_CHAIN_ID`      | gami-protocol-chain    | `9000`                  | Numeric EVM chain id used by viem.                                                                                                                                                  |
| `EXPO_PUBLIC_GAMI_EXPLORER_URL`  | gami-protocol-chain    | _(none)_                | Optional block explorer base URL.                                                                                                                                                   |
| `EXPO_PUBLIC_GAMI_MCP_URL`       | gami-protocol-mcp      | _(none)_                | Base URL of the agentic MCP backend. When set, NOVA's offline fallback generates personalized quests via `POST /api/quests/generate`; otherwise it uses the static local responder. |
| `EXPO_PUBLIC_GAMI_DASHBOARD_URL` | v0-gami-protocol-build | _(none)_                | Link to the internal business-monitoring dashboard (also shipped as a Chrome extension), surfaced under Settings → Data & Support.                                                  |

- **Gami chain**: added to `lib/wallet/chains.ts` as a viem custom chain and
  appears first in the chain list alongside Base/Polygon/Arbitrum/Solana.
- **Agentic questing**: `lib/mcp.ts` calls the MCP backend; `lib/nova.ts`'s
  offline responder uses it for quest suggestions with an automatic fallback to
  the static responder. (When signed in, NOVA still streams from the Supabase
  edge function as the primary path.)
- **Dashboard link**: Settings → Data & Support opens
  `EXPO_PUBLIC_GAMI_DASHBOARD_URL` (shows "Not configured" until set).

Set these as [EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
for builds, or in a local `.env` for `npx expo start`.

## How can I make changes to my app?

**Via Bilt (Easiest)**

Visit your [Bilt Project](https://app.bilt.me/agent/d312f89a-a5e9-4586-b30f-a7d34868491d) and send a message describing what you want:

- "Add a dark mode toggle"
- "Change the button color to blue"
- "Add a new screen for user settings"
- "Fix the navigation bar spacing"

Bilt understands natural language and updates your app automatically.

**Via Code**

Export the source, make changes in your IDE, and test locally with `npx expo start`.

## Can I use this with the MCP protocol?

Yes! Bilt is available as a remote MCP server at `https://mcp.bilt.me/mcp`.

Connect any MCP-compatible AI agent (Claude Desktop, OpenClaw, etc.) to programmatically build and modify mobile apps.

**Example MCP integration:**

```json
{
  "mcpServers": {
    "bilt": {
      "transport": {
        "type": "sse",
        "url": "https://mcp.bilt.me/mcp/sse",
        "headers": {
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    }
  }
}
```

Read more:

- [Bilt MCP Documentation](https://bilt.me/docs)
- [MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.buildingapplications%2Fmcp/versions/latest)

## Need help?

- 📚 [Bilt Documentation](https://bilt.me/docs)
- 💬 [Discord Community](https://discord.gg/3FqNgmSYdZ)
- 🐦 [Twitter Updates](https://twitter.com/biltmeanapp)
- 📧 Email: support@bilt.me

---

<div align="center">

**Built by AI. No code required.** ✨

[Try Bilt](https://bilt.me) • [View Docs](https://bilt.me/docs) • [Docs MCP Server](https://bilt.me/docs/mcp)

</div>
