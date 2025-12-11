export type DeviceType = 'mobile' | 'desktop';

export type FrameStatus = 'pending' | 'completed' | 'error';

// Single frame within a project
export interface DesignFrame {
    id: string;
    name: string;
    html: string;
    device: DeviceType;
    x: number;  // position on canvas
    y: number;
    status: FrameStatus;
    timestamp: number;
}

// Design project containing multiple frames
export interface DesignProject {
    id: string;
    title: string;          // project name (from first prompt)
    description: string;    // initial prompt
    frames: DesignFrame[];  // multiple frames on same canvas
    timestamp: number;
    activeFrameId?: string; // currently selected frame
}

// Legacy support - keep for backwards compatibility
export interface GeneratedDesign {
    id: string;
    title: string;
    description: string;
    html: string;
    figmaJson?: object;
    device: DeviceType;
    timestamp: number;
    status: FrameStatus;
}
