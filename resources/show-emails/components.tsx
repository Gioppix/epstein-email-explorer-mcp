import React from "react";
import { EmailDocument } from "../../index";

export const EmailContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="bg-surface-elevated border border-default rounded-xl h-96 overflow-y-auto">
    {children}
  </div>
);

const EmailListItem: React.FC<{
  email: EmailDocument;
  onClick: () => void;
}> = ({ email, onClick }) => (
  <div
    onClick={onClick}
    className="px-4 py-3 border-b border-default last:border-0 cursor-pointer hover:bg-surface"
  >
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm font-medium text-primary truncate max-w-[70%]">
        {email.participants?.[0]?.name || "Unknown"}
      </span>
      <span className="text-xs text-secondary">{email.date}</span>
    </div>
    <div className="text-sm text-primary truncate">{email.subject}</div>
  </div>
);

export const EmailList: React.FC<{
  emails: EmailDocument[];
  loading?: boolean;
  onSelect: (email: EmailDocument) => void;
}> = ({ emails, loading, onSelect }) => (
  <EmailContainer>
    {loading ? (
      <div className="h-full flex items-center justify-center text-secondary">
        Loading emails...
      </div>
    ) : emails.length === 0 ? (
      <div className="h-full flex items-center justify-center text-secondary">
        No emails found.
      </div>
    ) : (
      emails.map((email) => (
        <EmailListItem
          key={email.document_id}
          email={email}
          onClick={() => onSelect(email)}
        />
      ))
    )}
  </EmailContainer>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-0.5 bg-surface rounded text-xs text-secondary">
    {children}
  </span>
);

export const EmailDetail: React.FC<{
  email: EmailDocument;
  onBack: () => void;
}> = ({ email, onBack }) => (
  <EmailContainer>
    <div className="h-full">
      {/* Header */}
      <div className="sticky top-0 bg-surface-elevated border-b border-default px-4 py-3">
        <button
          onClick={onBack}
          className="text-sm text-secondary hover:text-primary mb-2"
        >
          ← Back
        </button>
        <h2 className="text-base font-medium text-primary leading-tight">
          {email.subject}
        </h2>
      </div>

      {/* Meta */}
      <div className="px-4 py-3 border-b border-default space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xs text-secondary w-12 shrink-0">From</span>
          <span className="text-sm text-primary">
            {email.participants?.[0]?.name || "Unknown"}
            {email.participants?.[0]?.email && (
              <span className="text-secondary ml-1">
                {"<"}
                {email.participants[0].email}
                {">"}
              </span>
            )}
          </span>
        </div>
        {email.participants && email.participants.length > 1 && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-secondary w-12 shrink-0">To</span>
            <span className="text-sm text-primary">
              {email.participants
                .slice(1)
                .map((p) => p.name)
                .join(", ")}
            </span>
          </div>
        )}
        <div className="flex items-start gap-2">
          <span className="text-xs text-secondary w-12 shrink-0">Date</span>
          <span className="text-sm text-primary">
            {email.date} {email.time}
          </span>
        </div>
        {email.topics && email.topics.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {email.topics.map((topic) => (
              <Tag key={topic}>{topic}</Tag>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {email.summary && (
        <div className="px-4 py-3 border-b border-default bg-surface">
          <p className="text-sm text-secondary italic">{email.summary}</p>
        </div>
      )}

      {/* Body */}
      <div className="px-4 py-3 text-sm text-primary whitespace-pre-wrap">
        {email.email_text}
      </div>
    </div>
  </EmailContainer>
);
