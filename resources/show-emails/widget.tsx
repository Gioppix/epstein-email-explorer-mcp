import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useEffect, useState } from "react";
import "../styles.css";
import { stringOrArray } from "../../lib/schema-helpers.js";
import { z } from "zod/v4";
import { EmailDocument } from "../../index";
import { EmailList, EmailDetail } from "./components";

const propSchema = z.object({
  document_ids: stringOrArray.describe(
    "Array of document_ids from get-emails results.",
  ),
});

type ShowEmailsProps = z.infer<typeof propSchema>;

// Hardcoded domains (tunnel + prod) to patch CSP issues
const CSP_DOMAINS = [
  "https://self-hosted-tunnel-production.up.railway.app",
  "https://lively-poetry-gt8c1.mcp-use.run",
];

export const widgetMetadata: WidgetMetadata = {
  description:
    "Display emails in an email client UI. Pass document_ids from get-emails results.",
  props: propSchema,
  metadata: {
    csp: {
      connectDomains: CSP_DOMAINS,
      resourceDomains: CSP_DOMAINS,
    },
  },
};

const ShowEmails: React.FC = () => {
  const { props, mcp_url, isPending } = useWidget<ShowEmailsProps>();
  const [emails, setEmails] = useState<EmailDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailDocument | null>(
    null,
  );

  useEffect(() => {
    const documentIds = props.document_ids ?? [];
    if (isPending || !documentIds.length) return;

    const fetchEmails = async () => {
      setLoading(true);
      try {
        const ids = documentIds.join(",");
        const res = await fetch(
          `${mcp_url}/api/emails?ids=${encodeURIComponent(ids)}`,
        );
        const data = await res.json();
        setEmails(data.emails || []);
      } catch (err) {
        setError("Error fetching");
        console.error("Failed to fetch emails:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [isPending, props, mcp_url]);

  const renderContent = () => {
    if (error)
      return (
        <div className="p-4 text-center text-secondary">
          Error loading emails
        </div>
      );
    if (selectedEmail)
      return (
        <EmailDetail
          email={selectedEmail}
          onBack={() => setSelectedEmail(null)}
        />
      );
    return (
      <EmailList
        emails={emails}
        loading={isPending || loading}
        onSelect={setSelectedEmail}
      />
    );
  };

  return <McpUseProvider autoSize>{renderContent()}</McpUseProvider>;
};

export default ShowEmails;
