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
  timeline: [GroupedSegment];
};

export type Segment = {
  _id: string;
  id: number;
  start: number;
  end: number;
  text: string;
};

export type GroupedSegment = {
  _id: string;
  ids: number[];
  duration: number;
  description: string;
};

export type VideoMediaType = {
  _id: string;
  fileId: string;
  fileName: string;
  projectId: string;
  isProcessed: boolean;
  language: string;
  format: {
    size: string;
    [key: string]: string;
  }; // Consider defining a more specific type if the format structure is known
  segments: Segment[];
  groupedSegments: GroupedSegment[];
};

export type VideoRevisionType = {
  _id: string;
  userId: string;
  projectId: string;
  prompt: string;
  fileId: string;
  isPending: boolean;
  segments: Array<{
    fileId: string;
    start: number;
    end: number;
    text: string;
  }>;
};
