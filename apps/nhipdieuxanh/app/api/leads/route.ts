import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, email, need, budget, area, source = 'web' } = body

    // 1. Basic validation
    if (!name || !phone || !need || !budget || !area) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.' },
        { status: 400 }
      )
    }

    // 2. Validate Vietnamese phone pattern (simple check)
    const cleanPhone = phone.replace(/\s+/g, '')
    if (!/^(0|84|\+84)[3-9][0-9]{8}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'invalid_phone', message: 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam.' },
        { status: 400 }
      )
    }

    // 3. Save to database
    const lead = await prisma.lead.create({
      data: {
        name,
        phone: cleanPhone,
        email: email || null,
        need,
        budget,
        area,
        source
      }
    })

    return NextResponse.json(
      { success: true, leadId: lead.id, message: 'Thông tin đăng ký đã được ghi nhận.' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[POST /api/leads] Ingestion error:', error.message)
    return NextResponse.json(
      { error: 'server_error', message: 'Đã xảy ra lỗi trên hệ thống. Xin vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
