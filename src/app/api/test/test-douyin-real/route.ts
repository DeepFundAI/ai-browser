import { NextRequest, NextResponse } from 'next/server';
import { DouyinService } from '@/services/integrations/douyin';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const tool = searchParams.get('tool');
  const share_link = searchParams.get('share_link');

  if (!tool || !share_link) {
    return NextResponse.json(
      {
        error: 'Missing parameters',
        usage: '/api/test/test-douyin-real?tool=parse_douyin_video_info&share_link=Douyin_share_link'
      },
      { status: 400 }
    );
  }

  try {
    const douyinService = new DouyinService({
      apiKey: process.env.BAILIAN_API_KEY || ''
    });

    let result;

    switch (tool) {
      case 'parse_douyin_video_info':
        result = await douyinService.getVideoInfo(share_link);
        break;
      case 'get_douyin_download_link':
        result = await douyinService.getDownloadLink(share_link);
        break;
      case 'extract_douyin_text':
        result = await douyinService.extractText(share_link);
        break;
      default:
        return NextResponse.json({ error: 'Invalid tool' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      tool,
      share_link,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Douyin real test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tool,
        share_link
      },
      { status: 500 }
    );
  }
}
