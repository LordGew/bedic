export interface EvidenceImage {
  url: string;
  uploadedAt: string;
  caption?: string;
  size?: number;
  mimeType?: string;
}

export interface Report {
  _id: string;
  contentType: 'PLACE' | 'REVIEW' | 'COMMENT' | 'USER' | 'PHOTO';
  contentId: string;
  reason: 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'VIOLENCE' | 'SEXUAL_CONTENT' | 'FALSE_INFO' | 'COPYRIGHT' | 'OTHER';
  description: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
  user: {
    _id: string;
    username: string;
    name: string;
    avatar_url?: string;
  };
  moderatedBy?: {
    _id: string;
    username: string;
    name: string;
  };
  moderationNotes?: string;
  actions: ReportAction[];
  userNotified: boolean;
  evidenceImages?: EvidenceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportAction {
  type: 'CONTENT_HIDDEN' | 'CONTENT_DELETED' | 'USER_WARNED' | 'USER_MUTED' | 'USER_BANNED' | 'CONTENT_WARNING_ADDED';
  takenBy?: {
    _id: string;
    username: string;
    name: string;
  };
  takenAt: string;
  reason?: string;
  duration?: number;
}

export interface ReportActionRequest {
  actionType: 'CONTENT_HIDDEN' | 'CONTENT_DELETED' | 'USER_WARNED' | 'USER_MUTED' | 'USER_BANNED' | 'CONTENT_WARNING_ADDED';
  reason: string;
  duration?: number;
  moderationNotes: string;
}

export interface ReportStatusUpdate {
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
}

export interface ReportsPaginatedResponse {
  success: boolean;
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
