export type SampleKnowledgeDoc = {
  title: string;
  filename: string;
  content: string;
};

export const sampleKnowledgeDocs: SampleKnowledgeDoc[] = [
  {
    title: "Project Overview",
    filename: "project-overview.md",
    content: `# FalconAI Project Overview

FalconAI is a mortgage guidance platform that helps first-time homeowners understand the path to buying a home.

## What we build
- An authenticated web app with role-based access control
- A RAG chatbot that answers new-joiner questions from internal docs
- Admin tools for users, roles, features, and platform settings

## Core principles
- Prefer grounded answers over speculation
- Keep onboarding docs short and actionable
- Ship the minimum that demos well, then iterate
`,
  },
  {
    title: "Local Setup Guide",
    filename: "setup-guide.md",
    content: `# Local Setup Guide

## Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL
- Pinecone account and index
- At least one LLM API key (OpenAI recommended for embeddings)

## Backend
1. \`cd falconai-backend\`
2. Copy \`.env.example\` to \`.env\` and fill values
3. \`pnpm install\`
4. \`pnpm run db:seed\`
5. \`pnpm run dev\` (API on http://localhost:3000)

## Frontend
1. \`cd falconai-frontend\`
2. \`pnpm install\`
3. \`pnpm run dev\` (Vite on http://localhost:5173)

Default super-admin: \`superadmin@falconai.com\` / \`Superadmin@123\`
`,
  },
  {
    title: "Team Norms",
    filename: "team-norms.md",
    content: `# Team Norms

## Communication
- Prefer async updates in the team channel
- Tag owners for blockers within 24 hours
- Keep PR descriptions focused on why, not only what

## Code review
- At least one approval before merge to main
- Prefer small PRs over large dumps
- Do not commit secrets or \`.env\` files

## Working hours
- Core overlap: 11:00–16:00 local time
- Pair when touching auth, payments, or RAG retrieval
`,
  },
  {
    title: "Architecture Notes",
    filename: "architecture.md",
    content: `# Architecture Notes

## Backend stack
- Express + TypeScript
- Drizzle ORM + PostgreSQL
- JWT access/refresh tokens
- Pinecone for vector retrieval
- Platform settings for LLM provider selection

## RAG flow
1. Admin uploads markdown into knowledge-base
2. Docs are chunked and embedded with OpenAI
3. Vectors are stored in Pinecone with document metadata
4. Chat questions retrieve top chunks and call the active LLM
5. Answers must cite source document filenames

## Important constraint
If retrieval scores are too low, the chatbot must refuse instead of guessing.
`,
  },
  {
    title: "Onboarding FAQ",
    filename: "onboarding-faq.md",
    content: `# Onboarding FAQ

## How do I get access?
Ask an admin to create your user and assign the \`user\` role. You can then sign in and use Chat.

## Where are the docs?
Admins manage markdown docs under Knowledge Base. Chat answers are grounded only on those docs.

## Which AI model are we using?
The active chat provider is configured in Platform Settings (\`ai.active_provider\`). Embeddings always use OpenAI.

## Who do I ask for help?
Start with your buddy, then the channel \`#falconai-hackathon\`.
`,
  },
  {
    title: "Support Contacts",
    filename: "support-contacts.md",
    content: `# Support Contacts

## Hackathon team
- Product / demo lead: demo-lead@falconai.com
- Backend owner: backend@falconai.com
- Frontend owner: frontend@falconai.com

## Escalation
For production outages or leaked credentials, message the admin immediately and rotate keys in Platform Settings.

## Useful links
- Swagger: http://localhost:3000/api-docs
- Frontend: http://localhost:5173
`,
  },
  {
    title: "Release Checklist",
    filename: "release-checklist.md",
    content: `# Release Checklist

Before a demo or deploy:
1. Confirm Pinecone index exists and env vars are set
2. Confirm OpenAI key works for embeddings
3. Confirm active chat provider key is set
4. Seed or upload at least 5 knowledge docs
5. Ask 3 sample questions in Chat and verify citations
6. Ask one out-of-scope question and verify refusal
`,
  },
];
