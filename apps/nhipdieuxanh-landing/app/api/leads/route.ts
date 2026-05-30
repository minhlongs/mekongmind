import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Vietnamese phone regex validation
const PHONE_REGEX = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LeadInput = {
  workspaceId?: string
  name: string
  phone?: string
  email?: string
  location: string
  budget: string // decimal string
  intent: 'mua ở' | 'đầu tư' | 'cho con đi học' | string
  consent: boolean
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadInput
    const {
      name,
      phone,
      email,
      location,
      budget,
      intent,
      consent,
      workspaceId = 'default-workspace',
      utmSource,
      utmMedium,
      utmCampaign,
    } = body

    // 1. Basic validation
    if (!name || (!phone && !email) || !location || !budget || !intent) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.' },
        { status: 400 }
      )
    }

    // 2. Score calculations
    let score = 0
    
    // Phone validation score (+20)
    const isValidPhone = phone ? PHONE_REGEX.test(phone.replace(/\s+/g, '')) : false
    if (isValidPhone) score += 20

    // Email validation score (+10)
    const isValidEmail = email ? EMAIL_REGEX.test(email) : false
    if (isValidEmail) score += 10

    // Location scoring: Can Tho (+30), Mekong delta (+20)
    const locLower = location.toLowerCase()
    const isCanTho = locLower.includes('cần thơ') || locLower.includes('can tho')
    
    const mekongProvinces = [
      'an giang', 'bạc liêu', 'bến tre', 'cà mau', 'đồng tháp', 
      'hậu giang', 'kiên giang', 'long an', 'sóc trăng', 
      'tiền giang', 'trà vinh', 'vĩnh long'
    ]
    const isMekongDelta = mekongProvinces.some(p => locLower.includes(p))

    if (isCanTho) {
      score += 30
    } else if (isMekongDelta) {
      score += 20
    }

    // Intent scoring: investment (+10)
    if (intent === 'đầu tư' || intent.toLowerCase().includes('đầu tư') || intent.toLowerCase().includes('cho thuê')) {
      score += 10
    }

    // Budget check: high budget (+10)
    const parsedBudget = parseFloat(budget)
    if (!isNaN(parsedBudget) && parsedBudget >= 2) { // 2+ billion VND
      score += 10
    }

    // Determine lead level
    let level = 'COLD'
    if (score >= 70) {
      level = 'HOT'
    } else if (score >= 40) {
      level = 'WARM'
    }

    // 3. Persona Classification
    let persona = 'Chưa phân loại'
    const intentLower = intent.toLowerCase()
    if (intentLower.includes('học') || intentLower.includes('con')) {
      persona = 'Phụ huynh học sinh'
    } else if (intentLower.includes('đầu tư') || intentLower.includes('cho thuê') || intentLower.includes('sinh lời')) {
      persona = 'Nhà đầu tư'
    } else if (intentLower.includes('ở') || intentLower.includes('định cư') || intentLower.includes('sinh sống')) {
      persona = 'Người mua nhà định cư'
    }

    // 4. Unique identification hash to prevent duplicate entries
    const identifier = phone ? phone.trim() : (email ? email.trim() : '')
    const leadHash = crypto.createHash('sha256').update(identifier).digest('hex')

    // 5. Decree 13 PII Redaction/Masking if consent is missing
    let finalName = name
    let finalPhone = phone
    let finalEmail = email
    const consentAt = consent ? new Date() : null

    if (!consent) {
      // Masking logic
      finalName = maskName(name)
      if (phone) finalPhone = maskPhone(phone)
      if (email) finalEmail = maskEmail(email)
      
      console.warn(`[Decree 13 Warning]: Lead registered without privacy consent. PII has been redacted/masked inside the database. Hash: ${leadHash}`)
    }

    // 6. DB operations (Upsert Lead and Profile)
    const result = await prisma.lead.upsert({
      where: { leadHash },
      update: {
        name: finalName,
        phone: finalPhone,
        email: finalEmail,
        location,
        budget: parsedBudget || 0,
        intent,
        consentAt,
        utmSource,
        utmMedium,
        utmCampaign,
        profile: {
          upsert: {
            create: { score, level, persona },
            update: { score, level, persona },
          },
        },
      },
      create: {
        workspaceId,
        name: finalName,
        phone: finalPhone,
        email: finalEmail,
        location,
        budget: parsedBudget || 0,
        intent,
        leadHash,
        consentAt,
        utmSource,
        utmMedium,
        utmCampaign,
        profile: {
          create: { score, level, persona },
        },
      },
      include: {
        profile: true,
      },
    })

    return NextResponse.json({
      success: true,
      leadId: result.id,
      score,
      level,
      persona,
      masked: !consent,
      message: 'Nhận thông tin thành công.',
    })
  } catch (error: any) {
    console.error('[POST /api/leads] Ingestion failure:', error.message)
    return NextResponse.json(
      { error: 'server_error', message: 'Đã xảy ra lỗi trên hệ thống. Thử lại sau.' },
      { status: 500 }
    )
  }
}

// Helpers for PII masking
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return name.slice(0, 1) + '**'
  }
  return parts.map((part, index) => {
    if (index === 0 || index === parts.length - 1) {
      return part[0] + '*'.repeat(Math.max(1, part.length - 1))
    }
    return '*'.repeat(part.length)
  }).join(' ')
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '')
  if (clean.length < 7) return '***'
  return clean.slice(0, 3) + '*****' + clean.slice(-2)
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return '***@***'
  if (user.length <= 2) {
    return user[0] + '***@' + domain
  }
  return user[0] + '***' + user.slice(-1) + '@' + domain
}
