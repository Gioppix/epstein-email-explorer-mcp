import { MCPServer, object } from "mcp-use/server";
import { z } from "zod/v4";
import { stringOrArray } from "./lib/schema-helpers.js";
import emailsData from "./public/files/emails.json" with { type: "json" };

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface EmailParticipant {
  name: string;
  email: string;
}

export interface EmailDocument {
  document_id: string;
  email_text: string;
  source_file: string;
  is_email: boolean;
  participants: EmailParticipant[];
  date: string;
  time: string;
  subject: string;
  has_attachments: boolean;
  attachment_names: string[];
  people_mentioned: string[];
  organizations: string[];
  locations: string[];
  phone_numbers: string[];
  urls: string[];
  notable_figures: string[];
  primary_topic: string;
  topics: string[];
  summary: string;
  key_quotes: string[];
  tone: string;
  potential_crimes: string;
  evidence_strength: string;
  crime_types: string[];
  mentions_victims: boolean;
  victim_names: string[];
  cover_up: string;
}

interface CountedItem {
  name: string;
  count: number;
}

// =============================================================================
// DATA LOADING & INDEX BUILDING
// =============================================================================

const emails = emailsData as EmailDocument[];
console.log(`Loaded ${emails.length} emails`);

// Build document_id -> document hashmap
const documentMap = new Map<string, EmailDocument>();
for (const email of emails) {
  documentMap.set(email.document_id, email);
}

// Helper function to build counted lists
function buildCountedList(
  extractor: (email: EmailDocument) => string[],
): CountedItem[] {
  const counts = new Map<string, number>();
  for (const email of emails) {
    const items = extractor(email);
    for (const item of items) {
      if (item && item.trim()) {
        const normalized = item.trim();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Build counted maps for quick lookup
function buildCountedMap(list: CountedItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of list) {
    map.set(item.name.toLowerCase(), item.count);
  }
  return map;
}

// Pre-compute all lists
console.log("Building indexes...");

const mentionedPeopleList = buildCountedList((e) => e.people_mentioned || []);
const mentionedPeopleMap = buildCountedMap(mentionedPeopleList);
console.log(`Indexed ${mentionedPeopleList.length} unique mentioned people`);

const participantsList = buildCountedList((e) =>
  (e.participants || []).map((p) => p.name).filter((n) => n && n.trim()),
);
const participantsMap = buildCountedMap(participantsList);
console.log(`Indexed ${participantsList.length} unique participants`);

const notableFiguresList = buildCountedList((e) => e.notable_figures || []);
const notableFiguresMap = buildCountedMap(notableFiguresList);
console.log(`Indexed ${notableFiguresList.length} unique notable figures`);

const crimeTypesList = buildCountedList((e) => e.crime_types || []);
console.log(`Indexed ${crimeTypesList.length} unique crime types`);

console.log("Indexes built successfully!");

// =============================================================================
// SCHEMA HELPERS
// =============================================================================

const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .default(100)
    .describe("Max results to return (default 100)."),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of results to skip (default 0)."),
});

// =============================================================================
// MCP SERVER SETUP
// =============================================================================

const server = new MCPServer({
  name: "epstein-email-explorer-mcp",
  title: "Epstein Email Explorer",
  version: "1.0.0",
  description:
    "Search and explore the Epstein email archive by participants, mentioned people, notable figures, and crime types.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// =============================================================================
// TOOLS: LIST RETRIEVAL (with pagination)
// =============================================================================

server.tool(
  {
    name: "get-mentioned-people",
    description:
      "Get people mentioned in email bodies/content. Use these names to filter with get-emails.",
    schema: paginationSchema,
  },
  async (params) => {
    const { limit, offset } = params;
    const paginated = mentionedPeopleList.slice(offset, offset + limit);
    return object({
      total: mentionedPeopleList.length,
      offset,
      returned: paginated.length,
      has_more: offset + paginated.length < mentionedPeopleList.length,
      people: paginated,
    });
  },
);

server.tool(
  {
    name: "get-participants",
    description:
      "Get email senders and recipients. Use these names to filter with get-emails.",
    schema: paginationSchema,
  },
  async (params) => {
    const { limit, offset } = params;
    const paginated = participantsList.slice(offset, offset + limit);
    return object({
      total: participantsList.length,
      offset,
      returned: paginated.length,
      has_more: offset + paginated.length < participantsList.length,
      participants: paginated,
    });
  },
);

server.tool(
  {
    name: "get-notable-figures",
    description:
      "Get notable public figures (politicians, celebrities, etc.) mentioned. Use these names to filter with get-emails.",
    schema: paginationSchema,
  },
  async (params) => {
    const { limit, offset } = params;
    const paginated = notableFiguresList.slice(offset, offset + limit);
    return object({
      total: notableFiguresList.length,
      offset,
      returned: paginated.length,
      has_more: offset + paginated.length < notableFiguresList.length,
      notable_figures: paginated,
    });
  },
);

server.tool(
  {
    name: "get-crime-types",
    description:
      "Get all crime type categories tagged in emails. Use these values to filter with get-emails.",
  },
  async () => {
    return object({
      total: crimeTypesList.length,
      crime_types: crimeTypesList,
    });
  },
);

// =============================================================================
// TOOL: SEARCH PERSON
// =============================================================================

server.tool(
  {
    name: "search-person",
    description:
      "Search for a person across all indexes. Returns matches with mention count, participation count, and whether they're a notable figure.",
    schema: z.object({
      query: z.string().min(1).describe("Name or partial name to search for."),
      limit: z
        .number()
        .int()
        .min(1)
        .default(20)
        .describe("Max results (default 20)."),
    }),
  },
  async (params) => {
    const queryLower = params.query.toLowerCase();
    const results = new Map<
      string,
      {
        name: string;
        mentions: number;
        participations: number;
        is_notable: boolean;
      }
    >();

    // Search mentioned people
    for (const item of mentionedPeopleList) {
      if (item.name.toLowerCase().includes(queryLower)) {
        const key = item.name.toLowerCase();
        const existing = results.get(key);
        if (existing) {
          existing.mentions = item.count;
        } else {
          results.set(key, {
            name: item.name,
            mentions: item.count,
            participations: participantsMap.get(key) || 0,
            is_notable: notableFiguresMap.has(key),
          });
        }
      }
    }

    // Search participants
    for (const item of participantsList) {
      if (item.name.toLowerCase().includes(queryLower)) {
        const key = item.name.toLowerCase();
        const existing = results.get(key);
        if (existing) {
          existing.participations = item.count;
        } else {
          results.set(key, {
            name: item.name,
            mentions: mentionedPeopleMap.get(key) || 0,
            participations: item.count,
            is_notable: notableFiguresMap.has(key),
          });
        }
      }
    }

    // Search notable figures
    for (const item of notableFiguresList) {
      if (item.name.toLowerCase().includes(queryLower)) {
        const key = item.name.toLowerCase();
        const existing = results.get(key);
        if (existing) {
          existing.is_notable = true;
        } else {
          results.set(key, {
            name: item.name,
            mentions: mentionedPeopleMap.get(key) || 0,
            participations: participantsMap.get(key) || 0,
            is_notable: true,
          });
        }
      }
    }

    // Sort by total relevance (mentions + participations) and limit
    const sorted = Array.from(results.values())
      .sort(
        (a, b) =>
          b.mentions + b.participations - (a.mentions + a.participations),
      )
      .slice(0, params.limit);

    return object({
      query: params.query,
      total_matches: results.size,
      returned: sorted.length,
      matches: sorted,
    });
  },
);

// =============================================================================
// TOOL: SEARCH EMAILS (with pagination)
// =============================================================================

server.tool(
  {
    name: "get-emails",
    description:
      "Search emails by filters (all AND logic). Email must match ALL provided values. Use show-emails to display results.",
    schema: z.object({
      participants: stringOrArray.describe(
        "Names from get-participants. Email must have ALL.",
      ),
      mentioned_people: stringOrArray.describe(
        "Names from get-mentioned-people. Email must mention ALL.",
      ),
      notable_figures: stringOrArray.describe(
        "Names from get-notable-figures. Email must mention ALL.",
      ),
      crime_types: stringOrArray.describe(
        "Values from get-crime-types. Email must have ALL.",
      ),
      limit: z
        .number()
        .int()
        .min(1)
        .default(50)
        .describe("Max results (default 50)."),
      offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Number of results to skip (default 0)."),
    }),
  },
  async (params) => {
    let filtered = emails;

    if (params.participants?.length) {
      const lowerNames = params.participants.map((n) => n.toLowerCase());
      filtered = filtered.filter((e) => {
        const emailParticipants =
          e.participants?.map((p) => p.name.toLowerCase()) || [];
        return lowerNames.every((name) => emailParticipants.includes(name));
      });
    }

    if (params.mentioned_people?.length) {
      const lowerNames = params.mentioned_people.map((n) => n.toLowerCase());
      filtered = filtered.filter((e) => {
        const mentioned = e.people_mentioned?.map((p) => p.toLowerCase()) || [];
        return lowerNames.every((name) => mentioned.includes(name));
      });
    }

    if (params.notable_figures?.length) {
      const lowerNames = params.notable_figures.map((n) => n.toLowerCase());
      filtered = filtered.filter((e) => {
        const notable = e.notable_figures?.map((f) => f.toLowerCase()) || [];
        return lowerNames.every((name) => notable.includes(name));
      });
    }

    if (params.crime_types?.length) {
      const lowerTypes = params.crime_types.map((t) => t.toLowerCase());
      filtered = filtered.filter((e) => {
        const crimes = e.crime_types?.map((c) => c.toLowerCase()) || [];
        return lowerTypes.every((type) => crimes.includes(type));
      });
    }

    const total = filtered.length;
    const { limit, offset } = params;
    const paginated = filtered.slice(offset, offset + limit);

    return object({
      total_matches: total,
      offset,
      returned: paginated.length,
      has_more: offset + paginated.length < total,
      emails: paginated.map((e) => ({
        document_id: e.document_id,
        summary: e.summary,
      })),
    });
  },
);

// =============================================================================
// API: Get emails by document IDs (for the show-emails widget)
// =============================================================================

server.get("/api/emails", async (c) => {
  const url = new URL(c.req.url);
  const ids = url.searchParams.get("ids")?.split(",") || [];

  const emailsToShow = ids
    .map((id) => documentMap.get(id.trim()))
    .filter((e): e is EmailDocument => e !== undefined);

  return c.json({ emails: emailsToShow });
});

// =============================================================================
// START SERVER
// =============================================================================

server.listen().then(() => {
  console.log("Epstein Email Explorer MCP server running");
});
