import { NextRequest, NextResponse } from 'next/server';
import { XiaohongshuService } from '@/services/integrations/xiaohongshu';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const tool = searchParams.get('tool');
  const share_link = searchParams.get('share_link');

  if (!tool || !share_link) {
    return NextResponse.json(
      {
        error: 'Missing parameters',
        usage: '/api/test/test-xiaohongshu?tool=extract_xiaohongshu_text&share_link=Xiaohongshu_video_link&model=sensevoice-v1'
      },
      { status: 400 }
    );
  }

  try {
    const xiaohongshuService = new XiaohongshuService({
      apiKey: process.env.BAILIAN_API_KEY || ''
    });

    let result;

    switch (tool) {
      case 'extract_xiaohongshu_text':
        const model = searchParams.get('model');
        result = await xiaohongshuService.extractText(share_link, model || undefined);
        break;
      default:
        return NextResponse.json(
          {
            error: 'Invalid tool',
            availableTools: ['extract_xiaohongshu_text']
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      tool,
      share_link,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Xiaohongshu test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tool,
        share_link,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
