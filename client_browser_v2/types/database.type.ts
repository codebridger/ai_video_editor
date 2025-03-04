import { type FileDocument } from '@modular-rest/client/dist/types/types';

export const DATABASE = {
    USER_CONTENT: 'user_content',
};

export const COLLECTIONS = {
    PROFILE: 'profile',
};

export interface ProfileType {
    _id: string;
    refId: string;
    name: string;
    gPicture: string;
    images: FileDocument[];
}
