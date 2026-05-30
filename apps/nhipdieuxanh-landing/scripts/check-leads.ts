import { PrismaClient } from '../generated/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== TRUY VẤN CƠ SỞ DỮ LIỆU ĐỂ KIỂM TRA MASKING ===')
  const leads = await prisma.lead.findMany({
    include: {
      profile: true
    }
  })

  leads.forEach((lead) => {
    console.log(`\nLead ID: ${lead.id}`)
    console.log(`Họ và Tên: ${lead.name}`)
    console.log(`Số điện thoại: ${lead.phone}`)
    console.log(`Email: ${lead.email}`)
    console.log(`Địa điểm: ${lead.location}`)
    console.log(`Nhu cầu: ${lead.intent}`)
    console.log(`Bảo mật (consent): ${lead.consentAt ? 'ĐÃ ĐỒNG Ý' : 'CHƯA ĐỒNG Ý (ĐÃ MASK)'}`)
    console.log(`Nhóm khách hàng (Persona): ${lead.profile?.persona}`)
    console.log(`Điểm số (Score): ${lead.profile?.score} | Xếp hạng: ${lead.profile?.level}`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
