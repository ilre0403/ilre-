
export type CategoryType = 'txt2img' | 'img2img' | 'img2vid' | 'txt2vid' | 'general';

export interface PromptItem {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  category: CategoryType;
  outputMediaUrl?: string; // Optional for General Prompts
  inputMediaUrl?: string; // For img2img or img2vid
  modelUsed?: string;
  tags: string[];
  isVideo?: boolean;
}

export const CATEGORIES: { id: CategoryType; label: string; description: string }[] = [
  { id: 'txt2img', label: '文生图片', description: '文本生成图片' },
  { id: 'img2img', label: '图生图片', description: '图片生成图片' },
  { id: 'img2vid', label: '图生视频', description: '图片生成视频' },
  { id: 'txt2vid', label: '文生视频', description: '文本生成视频' },
  { id: 'general', label: '通用提示词', description: '常用的基础提示词模板与修饰词' },
];
