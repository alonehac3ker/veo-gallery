/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Interface defining the structure of a video object, including its ID, URL,
 * title, and description.
 */
export interface Video {
  id: string;
  videoUrl: string;
  title: string;
  description: string;
}

/**
 * Represents a generated video with its creation timestamp.
 */
export interface HistoryVideo extends Video {
  createdAt: Date;
}
