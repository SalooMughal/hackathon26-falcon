import { notificationsService } from "@app/modules/notifications/notifications.service";

export const notifications = {
  profileViewed: async (viewerId: string, viewedUserId: string, viewerName: string) => {
    return await notificationsService.createForUser({
      userId: viewedUserId,
      type: "info",
      title: "Profile Viewed",
      message: `${viewerName} viewed your profile.`,
      data: { viewerId, viewerName },
    });
  },
};
