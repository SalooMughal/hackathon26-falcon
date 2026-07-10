export const features = [
  {
    name: "admin-stats",
    description: "View admin level statistics",
    is_active: true,
  },
  {
    name: "users",
    description: "View and manage users",
    is_active: true,
  },
  {
    name: "profile",
    description: "User Profile",
    is_active: true,
  },
  {
    name: "roles",
    description: "View and Manage User Roles and Permissions",
    is_active: true,
  },
  {
    name: "features",
    description: "View and Manage Features",
    is_active: true,
  },
  {
    name: "notifications",
    description: "View and Manage Notifications",
    is_active: true,
  },
  {
    name: "sessions",
    description: "View and Manage Sessions",
    is_active: true,
  },
  {
    name: "platform-settings",
    description: "View and Manage Platform Settings",
    is_active: true,
  },
  {
    name: "knowledge-base",
    description: "Upload and manage RAG knowledge base documents",
    is_active: true,
  },
  {
    name: "chat",
    description: "Ask grounded questions against the knowledge base",
    is_active: true,
  },
];

export const defaultPlatformSettings = [
  { key: "app.site_name", value: "FalconAI", description: "The name of the platform", type: "string" },
  { key: "app.maintenance_mode", value: "false", description: "Enable or disable maintenance mode", type: "boolean" },
  // AI API keys
  { key: "ai.openai_api_key", value: process.env.OPENAI_API_KEY || "", description: "OpenAI API key for AI services", type: "string" },
  { key: "ai.anthropic_api_key", value: process.env.ANTHROPIC_API_KEY || "", description: "Anthropic API key for AI services", type: "string" },
  { key: "ai.gemini_api_key", value: process.env.GEMINI_API_KEY || "", description: "Gemini API key for AI services", type: "string" },
  // AI provider / model selection
  { key: "ai.active_provider", value: "openai", description: "Active chat LLM provider: openai | gemini | claude", type: "string" },
  { key: "ai.openai_model", value: "gpt-4o-mini", description: "OpenAI chat model", type: "string" },
  { key: "ai.anthropic_model", value: "claude-sonnet-4-20250514", description: "Anthropic Claude chat model", type: "string" },
  { key: "ai.gemini_model", value: "gemini-2.0-flash", description: "Google Gemini chat model", type: "string" },
  { key: "ai.embedding_model", value: "text-embedding-3-small", description: "OpenAI embedding model used for RAG", type: "string" },
  { key: "ai.embedding_dimensions", value: "512", description: "Embedding vector size — must match Pinecone index dimensions", type: "number" },
  { key: "ai.rag_top_k", value: "4", description: "Number of chunks to retrieve for each question", type: "number" },
  { key: "ai.rag_min_score", value: "0.35", description: "Minimum similarity score required to answer from docs", type: "number" },
  // AWS S3 configuration
  { key: "s3.region", value: process.env.S3_REGION || "", description: "AWS S3 region", type: "string" },
  { key: "s3.bucket_name", value: process.env.S3_BUCKET_NAME || "", description: "AWS S3 bucket name", type: "string" },
  { key: "s3.access_key_id", value: process.env.S3_ACCESS_KEY_ID || "", description: "AWS S3 access key ID", type: "string" },
  { key: "s3.secret_access_key", value: process.env.S3_SECRET_ACCESS_KEY || "", description: "AWS S3 secret access key", type: "string" },
  { key: "s3.url", value: process.env.S3_URL || "", description: "AWS S3 endpoint URL", type: "string" },
  // SMTP configuration for sending emails
  { key: "SMTP.enabled", value: process.env.SMTP_ENABLED || "false", description: "Is SMTP enabled (true/false)", type: "boolean" },
  { key: "SMTP.host", value: process.env.SMTP_HOST || "", description: " SMTP host", type: "string" },
  { key: "SMTP.port", value: process.env.SMTP_PORT || "", description: " SMTP port", type: "string" },
  { key: "SMTP.secure", value: "false", description: "Is  SMTP secure (true/false)", type: "boolean" },
  { key: "SMTP.user", value: process.env.SMTP_USER || "", description: " SMTP username", type: "string" },
  { key: "SMTP.pass", value: process.env.SMTP_PASS || "", description: " SMTP password", type: "string" },
];

export const permissions = [
  { name: "create", description: "Create Permission" },
  { name: "update", description: "Update Permission" },
  { name: "delete", description: "Delete Permission" },
  { name: "read", description: "Read Permission" },
  { name: "sudo", description: "Sudo Permission Only for Certain Actions, not included by default." },
];

const adminKbChatFeatures = [
  { feature: "knowledge-base", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
  { feature: "chat", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }] },
];

export const UserRoles = [
  {
    name: "super-admin",
    desription: "Super Admin Role",
    features: [
      { feature: "admin-stats", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "users", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      {
        feature: "profile",
        permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }],
      },
      { feature: "roles", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "features", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "notifications", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "platform-settings", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "sessions", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      ...adminKbChatFeatures,
    ],
  },
  {
    name: "admin",
    desription: "Admin Role",
    features: [
      { feature: "admin-stats", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "users", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      {
        feature: "profile",
        permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }],
      },
      { feature: "roles", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "features", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "notifications", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "platform-settings", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      { feature: "sessions", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "sudo" }] },
      ...adminKbChatFeatures,
    ],
  },
  {
    name: "user",
    desription: "User Role",
    features: [
      { feature: "notifications", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }] },
      { feature: "profile", permissions: [{ name: "read" }, { name: "create" }, { name: "update" }, { name: "delete" }, { name: "update-c" }] },
      { feature: "chat", permissions: [{ name: "read" }, { name: "create" }, { name: "delete" }] },
    ],
  },
];
