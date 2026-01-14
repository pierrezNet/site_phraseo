/**
 * Types for various components used in the application
 */

/**
 * Type definition for the Tabs component
 */
export interface TabsInstance {
  selectedTab: string;
  filteredPhaseTasks: Array<{
    _id: string;
    [key: string]: any;
  }>;
  logTask: (task: any) => void;
}

/**
 * Type definition for modal components
 */
export interface Modal {
  open: () => void;
  close: () => void;
}
