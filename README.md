# My experience with `mcp-use`

Hey, Gio here.
This is my personal experience with MCP Use, a library with over 9k GitHub start to build MCP clients and servers.
To best explain you, I'll walk you through a ChatGPT add I made.

<!--https://www.docetl.org/api/epstein-emails-->

## What I needed

- Basic dependencies (e.g. Node - `v24` in this case)
- MCP Use [could account](https://mcp-use.com/signup) to host the server (it's quite easy to use and free)
- ChatGPT Plus subscription - more on this later

## Setup

Getting started is super easy:

```bash
npx create-mcp-use-app mcp-demo
```

Then, a `npm run dev` is enough to see and debug tools (both classic and UI Widgets) thanks to the inspector.

The inspector is bundled and starts automatically: a very convenient way to test.

## Development

Developing with `mcp-use` is very straightforward. The inspector (paired with HMR, aka "hot module reload") makes iterating VERY fast. However, I had few minor issues with it:

- The setting CSP to "Declared" leads to a violation even in the starter template
- "Hover: Disabled" doesn't actually disable hover effects
- Sometimes, especially when dealing with UI elements, the inspector glitches out - a reload is usually enough

The only big issue I had with the library was related to CSP (content security policy): it was not allowing `fetch` requests. After a few hours of debugging I was ready to open an issue, only to find it already resolved in a development brach by a maintainer (props to Enrico).
To quickly patch it I hardcoded the CSP `connectDomains` urls.

## Deployment

Deploying using `mcp-use`'s cloud offering is super straightforward: `npm run deploy` takes care of everything. It guides trough a login, then allowing access to the GitHub repo, then checking that everything is pushed and finally shows the stream of remote build logs.

It's also nice that they provide documentation on how to self-host (and even made specific helpers) so vendor lock-in is not an issue.

Given the CSP issue I needed a "double deploy" to hardcode the production URL in the widgets code; build environment variables are available but I had a small issue.

## Testing on ChatGPT

When it came time to test, I happily headed to ChatGPT to add my server. It should be easy:

```
Account -> Settings -> Apps -> Advanced Settings -> Enable Dev Mode -> Apps -> Create App
```

_However_, after adding the URL and everything, the app wasn't there. After way too much time I found out that the Free Plan doesn't allow you to add custom apps - with no warning nor anything else [[1](https://community.openai.com/t/chatgpt-apps-sdk-not-creating-a-custom-app-on-my-account/1369338/7)], [[2](https://help.openai.com/en/articles/11487775-apps-in-chatgpt)]. This might change in the future so before upgrading take a look.

> Disclaimer: This is not the library's fault, but rather a rant against ChatGPT

So I had to buy the Plus version (luckily by signing up with a custom domain email I got a month free).
While developing, make sure to hit "refresh" in the app's section if you make any changes.
