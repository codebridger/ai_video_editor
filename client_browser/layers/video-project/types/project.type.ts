import { Types } from "@modular-rest/client";

export const VIDEO_PROJECT_DATABASE = {
  DATABASE: "video_project",
  PROJECT_COLLECTION: "project",
  VIDEO_MEDIA: "video_media",
  VIDEO_REVISION: "video_revision",
};

export type ProjectType = {
  _id: string;
  title: string;
  userId: string;
};

export type Segment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type GroupedSegment = {
  ids: number[];
  description: string;
};

export type VideoMediaType = {
  _id: string;
  fileId: string;
  fileName: string;
  projectId: string;
  isProcessed: boolean;
  format: object; // Consider defining a more specific type if the format structure is known
  segments: Segment[];
  groupedSegments: GroupedSegment[];
};
