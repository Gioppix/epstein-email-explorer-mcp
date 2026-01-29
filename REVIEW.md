## I built an MCP server to explore Epstein's emails. Here's what I learned about the protocol (and OpenAI's paywall)

When I wanted to test mcp-use (9k+ stars on GitHub), I needed a dataset spicy enough to keep me awake.
Enter: 2322 Epstein emails.
What followed was an afternoon of hot module reloading, CSP hell, and discovering OpenAI silently requires Plus to use custom apps.

### What I needed

- Basic dependencies (e.g. Node)
- A `mcp-use` [cloud account](https://mcp-use.com/signup) to host the server (currently free)
- ChatGPT _Plus_ subscription - more on this later
- Epstein's emails: `https://www.docetl.org/api/epstein-emails`

### Setup

Getting started was trivial.
`npx create-mcp-use-app mcp-demo` scaffolds a demo project - I used the `mcp-apps` preset to have both OpenAI Apps SDK integration and a standard MCP server.

Then, a `npm run dev` is enough to see and debug tools (both classic and UI Widgets) thanks to the inspector.
This is bundled and starts automatically: a very convenient way to test.

### Development

Developing with `mcp-use` is very straightforward. The inspector (paired with HMR, aka "hot module reload") makes iterating VERY fast. However, I had a few minor issues with it:

- The setting CSP to "Declared" leads to a violation even in the starter template
- "Hover: Disabled" doesn't actually disable hover effects
- Sometimes, especially when dealing with UI elements, it glitches out - a reload is usually enough

The library itself abstracts away all of the boilerplate and makes the code concise, for both tools and UI elements.
You're writing only the bare minimum: title, description, schema and logic.
It feels like what Stripe did for payments, but for tool definitions.

The best part is that the Model Context Protocol, being very new, hasn't crystallized yet - and you don't have to care.
By using a library you're guaranteed to always be compliant and compatible - for example, I imagine Anthropic/Google creating their own variants for UI components.

The only major issue I had with the library was related to CSP (content security policy): it was not whitelisting the server's domain `fetch` requests.
After a few hours of debugging I was ready to open an issue, only to find it already resolved in a development branch by a maintainer (props to Enrico).
To quickly patch the issue I hardcoded the CSP `connectDomains` urls and used the PR's canary build: `npm i https://pkg.pr.new/mcp-use/mcp-use@911`. However, I'm sure that by the time you read this it will be already merged.

### Deployment

Deploying using `mcp-use`'s cloud offering is super straightforward: `npm run deploy` takes care of everything.
It guides you through login, GitHub repo access, verifies your commits are pushed and finally shows the stream of remote build logs.

It's also nice that they provide documentation on how to self-host (and even made specific helpers) so vendor lock-in is not an issue.
However, I'd still choose their version as it's tailor-made and shows interesting mcp-specific metrics (e.g. client breakdown).

Given the CSP issue I needed a "double deploy" to hardcode the production URL in the widgets code; build environment variables are available but they didn't work consistently for me.

### Testing on ChatGPT

When it came time to test, I happily headed to ChatGPT to add my server. It should be easy:

```
Account -> Settings -> Apps -> Advanced Settings -> Enable Dev Mode -> Apps -> Create App
```

_However_, after adding the URL and everything, the app wasn't there. After way too much time I found out that the Free Plan doesn't allow you to add custom apps [[1](https://community.openai.com/t/chatgpt-apps-sdk-not-creating-a-custom-app-on-my-account/1369338/7), [2](https://help.openai.com/en/articles/11487775-apps-in-chatgpt)] (no warnings whatsoever). This might change in the future so before upgrading take a look.

> Disclaimer: This is not the library's fault, but rather a rant against OpenAI

So, I had to buy the Plus version (luckily by signing up with a custom domain email I got a month free).
While developing, make sure to hit "refresh" in the app's section if you make any changes.

### TL;DR

`mcp-use` = Rails for MCP. You write actual logic, boilerplate is handled. Few bugs, nothing blocking. _Use_ it.
