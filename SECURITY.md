# Security

## Leaked a bot token?

If a token ends up in a commit, screenshot, or chat:

1. Open the [Developer Portal](https://discord.com/developers/applications), select your app, go to **Bot**, and click **Reset Token**. The old token stops working immediately.
2. Update your `.env` with the new token.
3. Deleting the commit is **not** enough. Bots scan GitHub for tokens within seconds of a push. Always reset.

GitHub and Discord work together on secret scanning, so a token pushed to a public repo is often revoked automatically. You'll get a DM from Discord's system account when that happens.

## Reporting a vulnerability in these examples

If you find a security problem in the example code (for example a permission check that can be bypassed), please open a [private security advisory](../../security/advisories/new) instead of a public issue.

See the wiki page [Security Best Practices](wiki/Security-Best-Practices.md) for guidance on writing safe bots.
