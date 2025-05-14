import { pgTable, text, serial, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  youtubeChannelId: text("youtube_channel_id"),
  displayName: text("display_name"),
  profileImage: text("profile_image"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Video Schema
export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  duration: text("duration"),
  durationSeconds: integer("duration_seconds"),
  userId: integer("user_id").references(() => users.id),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
});

// Retention Data Schema
export const retentionPoints = pgTable("retention_points", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").references(() => videos.id),
  timestamp: real("timestamp").notNull(),
  percentage: real("percentage").notNull(),
});

export const insertRetentionPointSchema = createInsertSchema(retentionPoints).omit({
  id: true,
});

// Captions Schema
export const captionEntries = pgTable("caption_entries", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").references(() => videos.id),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  text: text("text").notNull(),
});

export const insertCaptionEntrySchema = createInsertSchema(captionEntries).omit({
  id: true,
});

// Hotspot Schema
export const hotspots = pgTable("hotspots", {
  id: text("id").primaryKey(),
  videoId: text("video_id").references(() => videos.id),
  type: text("type").notNull(),
  timestamp: real("timestamp").notNull(),
  percentageChange: real("percentage_change").notNull(),
  transcriptText: text("transcript_text"),
  reasons: text("reasons").array(),
  suggestion: text("suggestion"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHotspotSchema = createInsertSchema(hotspots).omit({
  id: true,
  createdAt: true,
});

// Reports Schema
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  videoId: text("video_id").references(() => videos.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  sentTo: text("sent_to"),
  videoTitle: text("video_title"),
  toAvoid: text("to_avoid").array(),
  toInclude: text("to_include").array(),
  aiRecommendation: text("ai_recommendation"),
  estimatedImprovement: text("estimated_improvement"),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  generatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type RetentionPoint = typeof retentionPoints.$inferSelect;
export type InsertRetentionPoint = z.infer<typeof insertRetentionPointSchema>;

export type CaptionEntry = typeof captionEntries.$inferSelect;
export type InsertCaptionEntry = z.infer<typeof insertCaptionEntrySchema>;

export enum HotspotType {
  SIGNIFICANT_DROP = "SIGNIFICANT_DROP",
  INTEREST_POINT = "INTEREST_POINT",
  ENGAGEMENT_PEAK = "ENGAGEMENT_PEAK"
}

export type Hotspot = typeof hotspots.$inferSelect;
export type InsertHotspot = z.infer<typeof insertHotspotSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Additional composite types for API responses
export interface RetentionData {
  videoId: string;
  points: RetentionPoint[];
}

export interface Captions {
  videoId: string;
  entries: CaptionEntry[];
}

export interface ActionableInsight {
  toAvoid: string[];
  toInclude: string[];
  aiRecommendation: string;
  estimatedImprovement: string;
}

export interface VideoAnalysisResponse {
  video: Video;
  retentionData: RetentionData;
  captions: Captions;
  hotspots: Hotspot[];
}
