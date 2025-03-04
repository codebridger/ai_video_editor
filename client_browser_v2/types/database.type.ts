import { type FileDocument } from '@modular-rest/client/dist/types/types';
import { USER_CONTENT, VIDEO_PROJECT } from '../../server/src/config';

export const DATABASE = {
  USER_CONTENT: USER_CONTENT.DATABASE,
  VIDEO_PROJECT: VIDEO_PROJECT.DATABASE,
};

export const COLLECTIONS = {
  PROFILE: USER_CONTENT.PROFILE_COLLECTION,
  PROJECT_COLLECTION: VIDEO_PROJECT.PROJECT_COLLECTION,
  VIDEO_MEDIA: VIDEO_PROJECT.VIDEO_MEDIA,
  VIDEO_REVISION: VIDEO_PROJECT.VIDEO_REVISION,
};

export interface ProfileType {
  _id: string;
  refId: string;
  name: string;
  gPicture: string;
  images: FileDocument[];
}
