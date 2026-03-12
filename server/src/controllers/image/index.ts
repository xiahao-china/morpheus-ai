import { Context } from "koa";

export const generateImage = async (ctx: Context) => {
    // Mock generation
    const { prompt } = ctx.request.body as any;
    
    // Return a dummy URL
    ctx.body = { 
        code: 200, 
        data: { 
            taskId: `task-${Date.now()}`,
            status: 'completed',
            imageUrl: 'https://placehold.co/600x400?text=AI+Generated' 
        } 
    };
}
