# Glossary

| Term | Meaning |
|---|---|
| **Application** | Your project in the Developer Portal. Owns the bot user, commands, OAuth2 settings. |
| **Application ID / Client ID** | The application's snowflake. Used in invite links and command registration. |
| **Bot token** | The password your code uses to log in as the bot. Keep it secret. |
| **Guild** | The API's name for a **server**. |
| **Snowflake** | A 64-bit unique ID that also encodes the creation time. |
| **Gateway** | The WebSocket connection over which Discord sends events. |
| **REST API** | HTTPS endpoints the bot calls to perform actions. |
| **Event** | Something that happened, pushed over the gateway (`MESSAGE_CREATE`, `GUILD_MEMBER_ADD`, …). |
| **Intent** | A category of events the bot subscribes to when connecting. |
| **Privileged intent** | Server Members, Message Content and Presence. Must be enabled in the portal. |
| **Interaction** | A user action aimed at your app: slash command, button, select, modal, context menu, autocomplete. |
| **Defer** | Acknowledge an interaction now ("thinking…") and send the real answer later. |
| **Ephemeral** | A response only the invoking user can see. |
| **Follow-up** | An extra message sent after the initial interaction response. |
| **Custom ID** | A string up to 100 characters attached to a component, returned when it's used. Encodes what the click means. |
| **Component** | Interactive message element: button, select menu, text input (and V2 layout components). |
| **Action row** | A container holding up to 5 buttons or 1 select menu. |
| **Modal** | A pop-up form with text inputs. |
| **Embed** | A rich, card-style message attachment. |
| **Cache** | The library's in-memory copy of Discord objects. |
| **Partial / uncached** | An object the library only knows by ID, because it wasn't in the cache. |
| **Shard** | One gateway connection handling a subset of guilds. Needed at 2,500+ guilds. |
| **Rate limit** | A cap on how many requests you can make in a time window. |
| **Role hierarchy** | Roles are ordered. You can only manage roles and members below your highest role. |
| **Permission overwrite** | A channel-specific allow/deny for a role or member. |
| **Default member permissions** | The permission a member needs to see a command by default. |
| **Cog** (Python) | A class grouping commands and listeners, loaded as an extension. |
| **Module** (C#) | A class whose methods are commands in Discord.Net's InteractionService. |
| **Precondition** (C#) | An attribute that must pass before a command runs (permissions, cooldowns). |
| **Migration** | A versioned change to the database schema. |
| **Repository** | A class/object that hides SQL behind named methods. |
| **Composition root** | The single place where an app creates and wires its dependencies. |
| **Mod log** | A channel recording moderation actions taken through the bot. |
| **Audit log** | Discord's record of admin actions, and the expert bots' readable replacement for it. |
