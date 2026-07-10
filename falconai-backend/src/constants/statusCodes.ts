export interface IStatusCode {
  code: number; // Unique internal error code for debugging
  statusCode: number; // HTTP status code
  message: string; // User-friendly message for frontend
}

const statusCodes = {
  ReqSuccess: { statusCode: 200, code: 1000, message: "Request completed successfully" },
  ReqSuccess201: { statusCode: 201, code: 1001, message: "Request completed successfully" },
  BadRequest: { statusCode: 400, code: 4000, message: "Invalid request. Please check your input and try again" },
  ValidationError: { statusCode: 400, code: 4001, message: "Validation failed. Please check the provided data" },
  MissingAuthHeader: { statusCode: 400, code: 4002, message: "Authorization header is missing or invalid" },
  Unauthorized: { statusCode: 401, code: 4003, message: "User not found. Please check your credentials" },
  InvalidCredentials: { statusCode: 401, code: 4004, message: "Invalid email or password. Please try again" },
  Forbidden: { statusCode: 403, code: 4005, message: "Access forbidden. You don't have permission to access this resource" },
  RoleRestricted: { statusCode: 403, code: 4006, message: "This feature is not accessible with your current role" },
  FeatureDisabled: { statusCode: 403, code: 4007, message: "This feature is currently disabled" },
  PermissionDenied: { statusCode: 403, code: 4008, message: "You don't have permission to perform this action" },
  NotFound: { statusCode: 404, code: 4009, message: "" },
  UserNotFound: { statusCode: 404, code: 4010, message: "User does not exist with this email" },
  RoleNotFound: { statusCode: 404, code: 4011, message: "Role not found" },
  FeatureNotFound: { statusCode: 404, code: 4012, message: "Feature not found" },
  PermissionNotFound: { statusCode: 404, code: 4013, message: "Permission not found" },
  RoleFeatureNotFound: { statusCode: 404, code: 4014, message: "Role-feature association not found" },
  Conflict: { statusCode: 409, code: 4015, message: "The record already exists" },
  UserExists: { statusCode: 409, code: 4016, message: "This user already exists" },
  PhoneExists: { statusCode: 409, code: 4017, message: "An account with this phone number already exists" },
  RoleExists: { statusCode: 409, code: 4018, message: "A role with this name already exists" },
  RoleAssignedToUsers: { statusCode: 409, code: 4019, message: "Cannot delete role as it is assigned to one or more users" },
  FeatureAssignedToRoles: { statusCode: 409, code: 4020, message: "Cannot delete feature as it is assigned to one or more roles. You can deactivate it instead to stop access" },
  InvalidOTP: { statusCode: 400, code: 4021, message: "Invalid verification code. Please try again" },
  OTPExpired: { statusCode: 400, code: 4022, message: "Verification code has expired. Please request a new one" },
  EmailNotVerified: { statusCode: 400, code: 4023, message: "Please verify your email before signing in" },
  SocialLogin: { statusCode: 400, code: 4024, message: "This account was registered via social login. Please use social login to sign in" },
  InvalidUserRole: { statusCode: 400, code: 4025, message: "Invalid user role specified" },
  KnowledgeDocumentNotFound: { statusCode: 404, code: 4026, message: "Knowledge document not found" },
  KnowledgeDocumentExists: { statusCode: 409, code: 4027, message: "A knowledge document with this filename already exists" },
  AiNotConfigured: { statusCode: 503, code: 5031, message: "AI provider is not configured. Check platform settings." },
  PineconeNotConfigured: { statusCode: 503, code: 5032, message: "Pinecone is not configured. Check environment variables." },
  RagIndexingFailed: { statusCode: 500, code: 5002, message: "Failed to index document into the knowledge base" },

  InternalServerError: { statusCode: 500, code: 5000, message: "An unexpected error occurred. Please try again later" },
  DatabaseError: { statusCode: 500, code: 5001, message: "Database operation failed. Please try again later" },
  BadGateway: { statusCode: 502, code: 5020, message: "Bad gateway. Please try again later" },
  ServiceUnavailable: { statusCode: 503, code: 5030, message: "Service temporarily unavailable. Please try again later" },
  // DEDICATED TOKEN ERROR CODE - DO NOT USE 419 ANYWHERE ELSE IN THE APPLICATION
  TokenAuthenticationFailed: { statusCode: 419, code: 4190, message: "Session expired" },
};

export default statusCodes;
