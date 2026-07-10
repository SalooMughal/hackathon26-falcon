import { IUser } from "@app/schema/types";
import nodemailer from "nodemailer";
import logger from "@app/services/logging/logger";
import generalTemplate from "./general-email-template";
import { getPlatformSettings } from "@app/modules/platform-settings/platform-settings.service";

interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * Get SMTP configuration from platform settings.
 * When `preferredSmtp` is provided it tries that source first then falls back.
 */
const getSMTPConfig = async (): Promise<SMTPConfig | null> => {
  try {
    const keys = ["SMTP.enabled", "SMTP.host", "SMTP.port", "SMTP.secure", "SMTP.user", "SMTP.pass"];

    const settings = await getPlatformSettings(keys);

    const buildSettings = (): SMTPConfig | null => {
      const enabled = settings["SMTP.enabled"]?.toLowerCase() === "true";
      if (enabled && settings["SMTP.host"] && settings["SMTP.user"] && settings["SMTP.pass"]) {
        return {
          enabled: true,
          host: settings["SMTP.host"],
          port: parseInt(settings["SMTP.port"] || "587", 10),
          secure: settings["SMTP.secure"]?.toLowerCase() === "true",
          user: settings["SMTP.user"],
          pass: settings["SMTP.pass"],
        };
      }
      return null;
    };

    // Default: prefer primary
    return buildSettings();
  } catch (error) {
    logger.error("Error getting SMTP configuration:", error);
    return null;
  }
};

export const sendEmail = async (subject: string, content: { heading: string; subHeading?: string; text: string }, user: IUser) => {
  try {
    const smtpConfig = await getSMTPConfig();

    if (!smtpConfig) {
      logger.error("SMTP configuration not available");
      return { success: false, error: "Email service not configured" };
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `My Home Pathway <${smtpConfig.user}>`,
      to: user.email,
      subject: subject,
      html: generalTemplate(content),
    });

    logger.info("Email sent successfully: ", info?.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Error sending email:", error);
    return { success: false, error };
  }
};
