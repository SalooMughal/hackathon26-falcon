export type Pagination = {
  total: number
  count: number
  page: number
  limit: number
}

export type Permission = {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export type Feature = {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type RoleFeaturePermission = {
  id: string
  roleFeatureId: string
  permissionId: string
  permission: Permission
}

export type RoleFeature = {
  id: string
  roleId: string
  featureId: string
  feature: Feature
  roleFeaturePermissions: RoleFeaturePermission[]
}

export type Role = {
  id: string
  name: string
  description: string
  createdAt?: string
  updatedAt?: string
  roleFeatures?: RoleFeature[]
}

export type ManagedUser = {
  id: string
  email: string
  fullName: string
  roleId?: string
  createdAt?: string
  updatedAt?: string
  role?: {
    id: string
    name: string
    description?: string
  } | null
}

export type NotificationType = 'info' | 'warn' | 'error'
export type NotificationStatus = 'read' | 'un-read' | 'archived'

export type AppNotification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: {
    broadcastId?: string
    authorId?: string
    authorName?: string
    board?: boolean
    [key: string]: unknown
  }
  status: NotificationStatus
  readAt?: string | null
  isDeleted?: boolean
  createdAt: string
  updatedAt?: string
}

export type KnowledgeDocumentStatus = 'pending' | 'indexed' | 'failed'

export type KnowledgeDocument = {
  id: string
  title: string
  filename: string
  content?: string
  status: KnowledgeDocumentStatus
  chunkCount: number
  errorMessage?: string | null
  createdBy?: string | null
  createdAt?: string
  updatedAt?: string
}

export type PlatformSetting = {
  id: string
  settingKey: string
  settingValue: string
  settingType: 'string' | 'number' | 'boolean' | 'json'
  description?: string | null
  updatedBy?: string | null
  updatedAt?: string
}

export type ChatCitation = {
  documentId: string
  title: string
  filename: string
  chunkIndex?: number
  content?: string
}

export type CitationSource = {
  documentId: string
  title: string
  filename: string
  chunkIndex: number
  excerpt: string
  documentContent: string
}

export type ChatConversation = {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
}

export type ChatMessage = {
  id: string
  conversationId?: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  citations: ChatCitation[]
  createdAt: string
}
