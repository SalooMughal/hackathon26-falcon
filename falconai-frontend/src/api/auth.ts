import { apiRequest } from './client'

export type AuthTokens = {
  access_token: string
  refresh_token: string
}

export type AuthPermission = {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export type AuthFeature = {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type RoleFeaturePermission = {
  id: string
  roleFeatureId: string
  permissionId: string
  permission: AuthPermission
}

export type RoleFeature = {
  id: string
  roleId: string
  featureId: string
  feature: AuthFeature
  roleFeaturePermissions: RoleFeaturePermission[]
}

export type AuthRole = {
  id: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
  roleFeatures?: RoleFeature[]
}

export type AuthUser = {
  id: string
  email: string
  fullName?: string | null
  avatarUrl?: string | null
  emailVerified?: boolean
  phoneVerified?: boolean
  phone?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  country?: string | null
  status?: string | null
  profileComplete?: boolean
  createdAt?: string
  updatedAt?: string
  role?: AuthRole
}

type SigninSuccess = {
  code: number
  message: string
  tokens: AuthTokens
  user: AuthUser
}

type SigninNeedsOtp = {
  code: number
  message: string
  userId: string
}

type VerifySuccess = {
  code: number
  message: string
  tokens: AuthTokens
  user: AuthUser
}

type MessageResponse = {
  code: number
  message: string
}

type ForgotVerifySuccess = {
  code: number
  message: string
  resetToken: string
}

export async function signin(email: string, password: string) {
  return apiRequest<SigninSuccess | SigninNeedsOtp>({
    method: 'POST',
    url: '/v1/auth/signin',
    data: { email, password },
  })
}

export async function verifyUser(userId: string, otp: number) {
  return apiRequest<VerifySuccess>({
    method: 'POST',
    url: '/v1/auth/verify-user',
    data: { userId, otp },
  })
}

export async function resendOtp(userId: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/auth/resend-otp',
    data: { userId },
  })
}

export async function forgotPasswordSend(email: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/auth/forget-password/send',
    data: { email },
  })
}

export async function forgotPasswordVerify(email: string, otp: number) {
  return apiRequest<ForgotVerifySuccess>({
    method: 'POST',
    url: '/v1/auth/forget-password/verify',
    data: { email, otp },
  })
}

export async function forgotPasswordChange(resetToken: string, password: string) {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/auth/forget-password/change',
    data: { resetToken, password },
  })
}

export async function signout() {
  return apiRequest<MessageResponse>({
    method: 'POST',
    url: '/v1/auth/signout',
  })
}
