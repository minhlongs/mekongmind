'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Calculator, 
  ShieldCheck, 
  Coins, 
  Calendar, 
  Lock, 
  Unlock, 
  MessageSquare, 
  Send, 
  X, 
  ChevronDown, 
  CheckCircle2, 
  User, 
  Phone, 
  Mail, 
  ChevronRight,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react'

// Mock FAQ database for chatbot
const CHATBOT_FAQS = [
  {
    keywords: ['giá', 'gia', 'bao nhieu', 'tiền', 'tien'],
    reply: 'Căn hộ Nhịp Điệu Xanh có giá chỉ từ 1.8 tỷ đồng cho căn 1 phòng ngủ. Hỗ trợ thanh toán trả góp chỉ từ 8 triệu/tháng.'
  },
  {
    keywords: ['pháp lý', 'phap ly', 'sổ hồng', 'so hong', 'quy hoạch', 'giấy phép'],
    reply: 'Dự án đã có đầy đủ Giấy phép xây dựng, Quy hoạch 1/500 và cam kết bàn giao Sổ hồng riêng từng căn sở hữu lâu dài.'
  },
  {
    keywords: ['vị trí', 'vi tri', 'dia chi', 'ở đâu', 'o dau', 'cái răng', 'ninh kiều'],
    reply: 'Dự án nằm ngay mặt tiền Võ Nguyên Giáp, Quận Cái Răng, TP. Cần Thơ — Chỉ cách trung tâm Ninh Kiều 5 phút di chuyển và ĐH Cần Thơ 8 phút.'
  },
  {
    keywords: ['vay', 'ngân hàng', 'hỗ trợ', 'lai suat', 'lãi suất'],
    reply: 'Ngân hàng Vietcombank và BIDV bảo lãnh dự án, hỗ trợ vay đến 70% giá trị căn hộ với lãi suất ưu đãi chỉ 5.5% trong năm đầu tiên.'
  },
  {
    keywords: ['con học', 'đi học', 'sinh viên', 'đại học'],
    reply: 'Với vị trí siêu kết nối gần ĐH Cần Thơ, ĐH Tây Đô, đây là giải pháp nhà ở an toàn, văn minh tuyệt đối cho con em của phụ huynh miền Tây đi học.'
  }
]

export default function LandingPage() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Dynamic Localization State
  const [userLocation, setUserLocation] = useState('can-tho')
  const [localizedBanner, setLocalizedBanner] = useState('Ưu đãi chiết khấu 1% cho cư dân Cần Thơ')

  // Mortgage Calculator States
  const [propertyValue, setPropertyValue] = useState(2000000000) // 2 billion VND
  const [loanPercentage, setLoanPercentage] = useState(70)
  const [loanTerm, setLoanTerm] = useState(20) // 20 years
  const [interestRate, setInterestRate] = useState(6.5) // 6.5%
  const [monthlyPayment, setMonthlyPayment] = useState(0)

  // Blueprint Lock State
  const [isBlueprintLocked, setIsBlueprintLocked] = useState(true)
  const [lockEmail, setLockEmail] = useState('')
  const [lockPhone, setLockPhone] = useState('')
  const [lockError, setLockError] = useState('')
  const [lockSuccess, setLockSuccess] = useState(false)

  // Floor Plan Selector States
  const [activePlanTab, setActivePlanTab] = useState('studio')

  // Lead Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    intent: 'mua ở',
    budget: '2',
    consent: true
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  // Chatbot Widget States
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([])
  const [isTyping, setIsTyping] = useState(false)

  // Sync theme to document body
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  // Update dynamic localization banner based on selected location
  useEffect(() => {
    switch (userLocation) {
      case 'can-tho':
        setLocalizedBanner('🎁 Đặc quyền Cư dân Tây Đô: Chiết khấu 1.5% + Tặng gói nội thất thông minh trị giá 50 triệu.')
        break
      case 'an-giang':
      case 'ca-mau':
      case 'kiên-giang':
        setLocalizedBanner('🎓 Giải pháp an cư lập nghiệp: Tặng 2 năm phí quản lý & ưu đãi gần các trục Đại học lớn cho con đi học.')
        break
      case 'bac-lieu':
      case 'soc-trang':
        setLocalizedBanner('📈 Cơ hội đầu tư thông minh: Cam kết cho thuê lại lợi nhuận 9%/năm từ chủ đầu tư.')
        break
      default:
        setLocalizedBanner('✨ Đô thị sinh thái chuẩn xanh Cần Thơ: Nhận ngay Voucher chiết khấu 1% khi đăng ký sớm.')
    }
  }, [userLocation])

  // Calculate Mortgage Payment
  useEffect(() => {
    const loanAmount = propertyValue * (loanPercentage / 100)
    const monthlyRate = (interestRate / 100) / 12
    const totalPayments = loanTerm * 12

    if (monthlyRate === 0) {
      setMonthlyPayment(loanAmount / totalPayments)
      return
    }

    const payment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                    (Math.pow(1 + monthlyRate, totalPayments) - 1)
    setMonthlyPayment(payment)
  }, [propertyValue, loanPercentage, loanTerm, interestRate])

  // Initialize chatbot messages
  useEffect(() => {
    setChatMessages([
      {
        sender: 'bot',
        text: 'Xin chào! Tôi là trợ lý ảo Nhịp Điệu Xanh BĐS Cần Thơ. Bạn cần hỗ trợ thông tin gì về căn hộ chuẩn xanh của chúng tôi?',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ])
  }, [])

  // Handle Chatbot interactions
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput
    if (!text.trim()) return

    const userMsgTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const newMessages = [...chatMessages, { sender: 'user' as const, text, time: userMsgTime }]
    
    setChatMessages(newMessages)
    if (!textToSend) setChatInput('')
    setIsTyping(true)

    // Simulate bot thinking/typing
    setTimeout(() => {
      let reply = 'Cảm ơn câu hỏi của bạn. Nhịp Điệu Xanh Cần Thơ là tổ hợp đô thị xanh đẳng cấp. Để nhận tư vấn chuyên sâu cùng bảng giá chi tiết nhất, xin vui lòng để lại Số điện thoại hoặc Email ạ!'
      const query = text.toLowerCase()

      for (const faq of CHATBOT_FAQS) {
        if (faq.keywords.some(k => query.includes(k))) {
          reply = faq.reply
          break
        }
      }

      const botMsgTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: botMsgTime }])
      setIsTyping(false)
    }, 1000)
  }

  // Unlock Blueprint
  const handleUnlockBlueprint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lockEmail || !lockPhone) {
      setLockError('Vui lòng điền đầy đủ Email và Số điện thoại.')
      return
    }
    if (!/^[0-9]{10,11}$/.test(lockPhone.replace(/\s+/g, ''))) {
      setLockError('Số điện thoại không hợp lệ.')
      return
    }
    if (!lockEmail.includes('@')) {
      setLockError('Email không hợp lệ.')
      return
    }

    setLockError('')
    setLockSuccess(true)
    setTimeout(() => {
      setIsBlueprintLocked(false)
    }, 800)
  }

  // Submit Lead Registration Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    if (!formData.name || !formData.phone || !formData.location) {
      setFormError('Vui lòng nhập đầy đủ các trường thông tin bắt buộc.')
      setFormLoading(false)
      return
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          location: formData.location,
          intent: formData.intent,
          budget: formData.budget,
          consent: formData.consent,
          workspaceId: 'ndx-can-tho'
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Gửi thông tin thất bại.')
      }

      setFormSuccess(true)
    } catch (err: any) {
      setFormError(err.message || 'Lỗi kết nối. Vui lòng thử lại sau.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#064E3B]/90 backdrop-blur-md border-b border-gray-200/50 dark:border-emerald-800/40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-display">
                NHỊP ĐIỆU XANH
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-[#F59E0B]">
                Bất động sản sinh thái
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            <a href="#tong-quan" className="hover:text-emerald-500 transition-colors">Tổng Quan</a>
            <a href="#tien-ich" className="hover:text-emerald-500 transition-colors">Tiện Ích</a>
            <a href="#mat-bang" className="hover:text-emerald-500 transition-colors">Mặt Bằng</a>
            <a href="#tinh-toan" className="hover:text-emerald-500 transition-colors">Tính Dự Phóng</a>
            <a href="#dang-ky" className="hover:text-emerald-500 transition-colors">Đăng Ký</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-emerald-900/60 text-gray-600 dark:text-emerald-300 hover:ring-2 hover:ring-emerald-400/50 transition-all"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a 
              href="#dang-ky" 
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Nhận Bảng Giá
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="tong-quan" className="relative pt-10 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/20 dark:from-[#064E3B] dark:via-[#043327] dark:to-emerald-950 transition-colors">
        
        {/* Decorative dynamic circles */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Text Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Dynamic Localization Selector Banner */}
              <div className="inline-flex flex-col sm:flex-row items-center sm:space-x-3 bg-white dark:bg-emerald-950/70 p-2 pr-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-md">
                <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1.5 rounded-xl">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Khu vực của bạn:</span>
                  <select 
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="bg-transparent font-extrabold focus:outline-none cursor-pointer pl-1"
                  >
                    <option value="can-tho" className="text-black">Cần Thơ</option>
                    <option value="an-giang" className="text-black">An Giang</option>
                    <option value="ca-mau" className="text-black">Cà Mau</option>
                    <option value="kiên-giang" className="text-black">Kiên Giang</option>
                    <option value="bac-lieu" className="text-black">Bạc Liêu</option>
                    <option value="soc-trang" className="text-black">Sóc Trăng</option>
                    <option value="khac" className="text-black">Khác (Miền Tây)</option>
                  </select>
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-2 sm:mt-0 text-center sm:text-left">
                  {localizedBanner}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-extrabold tracking-tight leading-tight font-display">
                Đô Thị Sinh Thái <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-500 dark:from-emerald-400 dark:to-amber-400">
                  Chuẩn Xanh Thông Minh
                </span> <br />
                Đầu Tiên Tại Cần Thơ
              </h1>

              <p className="text-base sm:text-lg text-gray-600 dark:text-emerald-100/80 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-body">
                Tọa lạc tại vị trí chiến lược kết nối Ninh Kiều & Cái Răng. Tổ hợp căn hộ sinh thái đẳng cấp sở hữu 68% diện tích cảnh quan xanh, mang lại phong vị nghỉ dưỡng thượng lưu giữa lòng Tây Đô năng động.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 pt-4">
                <a 
                  href="# dang-ky"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('dang-ky')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-center flex items-center justify-center space-x-2 group"
                >
                  <span>Đăng Ký Tư Vấn & Nhận Căn Hộ Mẫu</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="#tinh-toan"
                  className="w-full sm:w-auto border-2 border-emerald-500/20 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 dark:hover:text-white dark:hover:bg-emerald-500/10 text-base font-bold px-8 py-4 rounded-2xl transition-all text-center"
                >
                  Tính Lãi Vay Trả Góp
                </a>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[420px] lg:max-w-none">
                {/* Visual Glassmorphic Border Accent */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500 to-amber-400 rounded-3xl opacity-20 dark:opacity-30 blur-lg" />
                
                {/* Main Card Graphic */}
                <div className="relative bg-gradient-to-b from-white to-gray-50 dark:from-emerald-950 dark:to-emerald-900 border border-white/20 dark:border-emerald-800/40 rounded-3xl shadow-2xl p-6 overflow-hidden">
                  <div className="h-64 sm:h-80 bg-gradient-to-br from-emerald-900 to-[#043327] rounded-2xl relative overflow-hidden flex items-center justify-center text-white">
                    {/* Architectural Abstract Layout */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#043327] to-transparent z-10" />
                    
                    {/* SVG Architectural Design Mockup */}
                    <svg className="w-full h-full p-4 relative z-0" viewBox="0 0 400 300" fill="none">
                      {/* Stylized ecological building facade */}
                      <rect x="60" y="80" width="80" height="200" rx="10" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
                      <rect x="160" y="40" width="80" height="240" rx="10" fill="#0F3C28" stroke="#10B981" strokeWidth="2" />
                      <rect x="260" y="100" width="80" height="180" rx="10" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
                      {/* Balconies & green foliage mocks */}
                      <circle cx="100" cy="120" r="8" fill="#F59E0B" opacity="0.8" />
                      <circle cx="200" cy="80" r="8" fill="#F59E0B" opacity="0.8" />
                      <circle cx="300" cy="140" r="8" fill="#F59E0B" opacity="0.8" />
                      {/* River layout mock */}
                      <path d="M 0,270 Q 150,230 400,280" stroke="#0ea5e9" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
                    </svg>

                    <div className="absolute bottom-6 left-6 right-6 z-20">
                      <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                        Phối cảnh Concept
                      </span>
                      <h3 className="text-lg font-bold mt-2">Nhịp Điệu Xanh Riverside</h3>
                      <p className="text-xs text-gray-300">Biểu tượng sinh thái mới tại Tây Nam Bộ</p>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-100/60 dark:bg-emerald-900/40 p-4 rounded-2xl text-center">
                      <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">68%</span>
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mật độ cây xanh</span>
                    </div>
                    <div className="bg-gray-100/60 dark:bg-emerald-900/40 p-4 rounded-2xl text-center">
                      <span className="block text-2xl font-black text-amber-500">1.8 Tỷ</span>
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá khởi điểm từ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="tien-ich" className="py-20 bg-white dark:bg-[#043327] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-1.5 rounded-full">
              Giá Trị Cốt Lõi
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              4 Giá Trị Tạo Nên Sự Khác Biệt
            </h2>
            <p className="text-gray-600 dark:text-emerald-100/60 font-body">
              Nhịp Điệu Xanh mang lại trải nghiệm sống trọn vẹn, pháp lý chuẩn chỉnh từng mét vuông và bảo chứng gia tăng giá trị tài sản vượt trội.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-7 h-7 text-emerald-500" />,
                title: "Pháp Lý Vàng Cứng Cáp",
                desc: "100% căn hộ sở hữu sổ hồng riêng lâu dài. Đã có Quy hoạch chi tiết 1/500 và giấy phép xây dựng đầy đủ."
              },
              {
                icon: <Coins className="w-7 h-7 text-amber-500" />,
                title: "Hỗ Trợ Tài Chính 70%",
                desc: "Liên kết Vietcombank, BIDV hỗ trợ gói vay tối đa 70% trong 25 năm, ân hạn nợ gốc và miễn lãi trong suốt thời gian xây dựng."
              },
              {
                icon: <Building2 className="w-7 h-7 text-emerald-500" />,
                title: "Thiết Kế Sinh Thái Singapore",
                desc: "Đạt chứng chỉ tòa nhà xanh Lotus. Tận dụng tối đa gió sông Hậu, giảm thiểu bức xạ nhiệt và tiết kiệm điện năng 35%."
              },
              {
                icon: <Calendar className="w-7 h-7 text-amber-500" />,
                title: "Bàn Giao Quý 4/2026",
                desc: "Tiến độ xây dựng được giám sát nghiêm ngặt bởi Coninco. Cam kết bàn giao hoàn thiện nội thất cơ bản cao cấp."
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="bg-[#F9FAFB] dark:bg-emerald-950/40 p-6 rounded-2xl border border-gray-100 dark:border-emerald-800/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all hover:-translate-y-1 duration-300"
              >
                <div className="bg-white dark:bg-emerald-900 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 font-display">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-emerald-100/70 leading-relaxed font-body">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Interactive Floor Plans & Gated Blueprint Visual */}
      <section id="mat-bang" className="py-20 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 dark:from-[#064E3B] dark:to-[#043327] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side: Information, Tabs, Selector */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-4 py-1.5 rounded-full">
                Mặt Bằng Điển Hình
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight font-display">
                Kiến Trúc Không Gian <br />
                Đón Nắng & Gió Tự Nhiên
              </h2>
              <p className="text-gray-600 dark:text-emerald-100/70 font-body">
                Mỗi căn hộ được tính toán góc tối ưu đón ánh sáng tự nhiên, logia rộng thoáng hướng sông Cần Thơ hoặc tầm nhìn về cầu Cần Thơ lung linh.
              </p>

              {/* Tabs for floor plan selector */}
              <div className="bg-gray-100 dark:bg-emerald-950/60 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-gray-200/50 dark:border-emerald-800/20">
                {[
                  { id: 'studio', name: 'Studio (35m²)' },
                  { id: '1bed', name: '1 PN+ (52m²)' },
                  { id: '2bed', name: '2 PN (76m²)' },
                  { id: 'penthouse', name: 'Penthouse (120m²)' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePlanTab(tab.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      activePlanTab === tab.id
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-500 dark:text-emerald-300 hover:text-emerald-500'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Details of active plan tab */}
              <div className="bg-white dark:bg-emerald-900/40 border border-gray-100 dark:border-emerald-800/30 p-6 rounded-2xl shadow-sm space-y-4">
                {activePlanTab === 'studio' && (
                  <>
                    <h4 className="text-base font-extrabold text-[#F59E0B]">Căn hộ Studio thông minh</h4>
                    <p className="text-sm text-gray-600 dark:text-emerald-100/70 font-body leading-relaxed">
                      Phù hợp cho người độc thân năng động, chuyên gia hoặc con em tỉnh lẻ đi học tại Cần Thơ. Tối ưu diện tích sử dụng với giường xếp thông minh.
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 dark:text-gray-300">
                      <li>• Giá dự kiến: 1.8 Tỷ VNĐ</li>
                      <li>• Logia thông thoáng</li>
                      <li>• Hướng: Đông Nam</li>
                      <li>• Bàn giao: Đầy đủ nội thất liền tường</li>
                    </ul>
                  </>
                )}
                {activePlanTab === '1bed' && (
                  <>
                    <h4 className="text-base font-extrabold text-[#F59E0B]">Căn hộ 1 Phòng ngủ + 1 Không gian chức năng</h4>
                    <p className="text-sm text-gray-600 dark:text-emerald-100/70 font-body leading-relaxed">
                      Giải pháp hoàn hảo cho gia đình trẻ. Không gian cộng thêm +1 dễ dàng tùy biến thành phòng làm việc riêng biệt hoặc phòng ngủ nhỏ cho bé.
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 dark:text-gray-300">
                      <li>• Giá dự kiến: 2.5 Tỷ VNĐ</li>
                      <li>• Thiết kế đa năng</li>
                      <li>• Hướng: Tây Nam (View sông)</li>
                      <li>• Bàn giao: Tiêu chuẩn Smart Home</li>
                    </ul>
                  </>
                )}
                {activePlanTab === '2bed' && (
                  <>
                    <h4 className="text-base font-extrabold text-[#F59E0B]">Căn hộ 2 Phòng ngủ / 2 WC (Góc)</h4>
                    <p className="text-sm text-gray-600 dark:text-emerald-100/70 font-body leading-relaxed">
                      Căn góc 2 mặt thoáng rộng mở. View trọn vẹn bờ hồ sinh thái trung tâm và công viên cảnh quan. Ban công kép đón gió tự nhiên từ dòng sông Hậu.
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 dark:text-gray-300">
                      <li>• Giá dự kiến: 3.6 Tỷ VNĐ</li>
                      <li>• 2 mặt thoáng khí</li>
                      <li>• Hướng: Đông Bắc</li>
                      <li>• Bàn giao: Khóa vân tay, kính Low-E</li>
                    </ul>
                  </>
                )}
                {activePlanTab === 'penthouse' && (
                  <>
                    <h4 className="text-base font-extrabold text-[#F59E0B]">Tuyệt tác Penthouse Thượng Uyển</h4>
                    <p className="text-sm text-gray-600 dark:text-emerald-100/70 font-body leading-relaxed">
                      Tầm cao độc bản ngắm toàn cảnh thành phố Cần Thơ. Sân vườn riêng rộng mở đón mây trời, khẳng định vị thế chủ nhân thượng lưu đẳng cấp.
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 dark:text-gray-300">
                      <li>• Giá dự kiến: Liên hệ</li>
                      <li>• Sân vườn trên không</li>
                      <li>• Hướng: Hướng sông</li>
                      <li>• Số lượng giới hạn: Chỉ 4 căn</li>
                    </ul>
                  </>
                )}
              </div>
            </div>

            {/* Right side: Blueprint Lock Layout */}
            <div className="lg:col-span-7 relative">
              <div className="relative border border-emerald-500/10 dark:border-emerald-800/30 rounded-3xl bg-white dark:bg-emerald-950 p-4 shadow-xl overflow-hidden min-h-[380px] flex items-center justify-center">
                
                {/* SVG Blueprint Mock (Blurred/Locked conditionally) */}
                <div className={`w-full transition-all duration-700 ${isBlueprintLocked ? 'filter blur-md select-none pointer-events-none opacity-40' : 'filter-none opacity-100'}`}>
                  <svg className="w-full h-full max-h-[350px]" viewBox="0 0 500 350" fill="none">
                    <rect x="10" y="10" width="480" height="330" rx="15" fill="#043327" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                    
                    {/* Grid Layout Line Mock */}
                    <line x1="10" y1="175" x2="490" y2="175" stroke="#10b981" strokeWidth="0.5" opacity="0.3" />
                    <line x1="250" y1="10" x2="250" y2="340" stroke="#10b981" strokeWidth="0.5" opacity="0.3" />
                    
                    {/* Floor Plan Walls (Emerald Line drawing) */}
                    <rect x="50" y="50" width="180" height="110" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <rect x="270" y="50" width="180" height="110" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    <rect x="50" y="190" width="400" height="110" stroke="#10b981" strokeWidth="2.5" fill="none" />
                    
                    {/* Doors and Windows layout */}
                    <path d="M 230,100 A 30,30 0 0 1 200,130" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 270,100 A 30,30 0 0 0 300,130" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                    
                    {/* Architectural Labels */}
                    <text x="140" y="110" fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle">BEDROOM 1</text>
                    <text x="360" y="110" fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle">BEDROOM 2</text>
                    <text x="250" y="250" fill="#10b981" fontSize="16" fontWeight="bold" textAnchor="middle">LIVING & DINING ROOM</text>
                    <text x="410" y="280" fill="#F59E0B" fontSize="10" fontWeight="bold" textAnchor="middle">BALCONY</text>
                    
                    {/* Architectural measurements text */}
                    <text x="55" y="325" fill="#10b981" fontSize="8" opacity="0.6">TI LỆ THỰC TẾ 1/50 - THIẾT KẾ PHÁP LÝ NHỊP ĐIỆU XANH</text>
                  </svg>
                </div>

                {/* Gate Cover overlay */}
                {isBlueprintLocked && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-emerald-950/60 backdrop-blur-[2px] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-emerald-900 border border-gray-100 dark:border-emerald-800/40 max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4 relative z-10">
                      <div className="bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 w-12 h-12 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold font-display">Mở Khóa Bảng Vẽ Chi Tiết</h3>
                        <p className="text-xs text-gray-500 dark:text-emerald-100/60 leading-relaxed font-body">
                          Cung cấp Email & Số điện thoại để mở khóa trực tuyến sơ đồ chi tiết thiết kế tỷ lệ 1/50 của căn hộ.
                        </p>
                      </div>

                      <form onSubmit={handleUnlockBlueprint} className="space-y-3 text-left">
                        <div>
                          <input 
                            type="email"
                            required
                            placeholder="Email nhận file"
                            value={lockEmail}
                            onChange={(e) => setLockEmail(e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-emerald-950 border border-gray-200 dark:border-emerald-800/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <input 
                            type="tel"
                            required
                            placeholder="Số điện thoại nhận SMS OTP"
                            value={lockPhone}
                            onChange={(e) => setLockPhone(e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-emerald-950 border border-gray-200 dark:border-emerald-800/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {lockError && <span className="block text-[11px] font-bold text-red-500">{lockError}</span>}

                        <button 
                          type="submit"
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Mở khóa Ngay & Tải Về</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Unlock Success Anim Notification */}
                {lockSuccess && isBlueprintLocked && (
                  <div className="absolute inset-0 bg-emerald-500 text-white flex flex-col items-center justify-center p-6 z-20 animate-fade-in">
                    <CheckCircle2 className="w-16 h-16 text-white animate-pulse" />
                    <h3 className="text-xl font-bold mt-4 font-display">Mở Khóa Thành Công!</h3>
                    <p className="text-sm text-emerald-100 text-center max-w-xs mt-2 font-body">
                      Bản vẽ thiết kế tỉ lệ 1/50 đã được mở khóa trực quan và file PDF chất lượng cao đã gửi tới {lockEmail}.
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Interactive ROI & Mortgage Calculator */}
      <section id="tinh-toan" className="py-20 bg-white dark:bg-[#043327] transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-1.5 rounded-full">
              Dự Phóng Tài Chính
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              Bảng Tính Trả Góp & Ước Tính Lãi Vay
            </h2>
            <p className="text-gray-600 dark:text-emerald-100/60 font-body">
              Công cụ tính toán số tiền phải trả hàng tháng dựa trên nhu cầu vay ngân hàng hỗ trợ.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-center bg-gray-50 dark:bg-emerald-950/40 p-6 sm:p-10 rounded-3xl border border-gray-100 dark:border-emerald-800/30 shadow-md">
            
            {/* Left side inputs */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Range: Property value */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Giá trị căn hộ:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {(propertyValue / 1000000000).toFixed(1)} Tỷ VNĐ
                  </span>
                </div>
                <input 
                  type="range"
                  min={1500000000}
                  max={8000000000}
                  step={100000000}
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>1.5 Tỷ</span>
                  <span>8.0 Tỷ</span>
                </div>
              </div>

              {/* Range: Loan percentage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Tỷ lệ vay ngân hàng:</span>
                  <span className="text-[#F59E0B]">{loanPercentage}%</span>
                </div>
                <input 
                  type="range"
                  min={30}
                  max={70}
                  step={5}
                  value={loanPercentage}
                  onChange={(e) => setLoanPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>Vay 30%</span>
                  <span>Vay tối đa 70%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Selector: Loan term */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold">Thời hạn vay:</label>
                  <select 
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-emerald-950 border border-gray-200 dark:border-emerald-800/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                  >
                    <option value={5}>5 Năm (60 tháng)</option>
                    <option value={10}>10 Năm (120 tháng)</option>
                    <option value={15}>15 Năm (180 tháng)</option>
                    <option value={20}>20 Năm (240 tháng)</option>
                    <option value={25}>25 Năm (300 tháng)</option>
                  </select>
                </div>

                {/* Selector: Interest rate */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold">Lãi suất năm:</label>
                  <select 
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    className="w-full bg-white dark:bg-emerald-950 border border-gray-200 dark:border-emerald-800/30 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                  >
                    <option value={5.5}>5.5% (Ưu đãi năm 1)</option>
                    <option value={6.5}>6.5% (Vietcombank)</option>
                    <option value={7.5}>7.5% (BIDV)</option>
                    <option value={8.5}>8.5% (Trung bình thả nổi)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Right side outputs */}
            <div className="md:col-span-5 bg-white dark:bg-emerald-900 border border-gray-100 dark:border-emerald-800/30 p-6 rounded-2xl shadow-sm text-center space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Ước tính hàng tháng</span>
                <span className="block text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-display">
                  {monthlyPayment.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-300">VND / Tháng (Dự kiến)</span>
              </div>

              <div className="border-t border-gray-100 dark:border-emerald-800/40 pt-4 text-left space-y-2.5 text-xs font-bold text-gray-500 dark:text-emerald-100/70">
                <div className="flex justify-between">
                  <span>Số tiền tự có (30%):</span>
                  <span className="text-[#111827] dark:text-white">
                    {(propertyValue * (1 - loanPercentage/100)).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hạn mức ngân hàng (70%):</span>
                  <span className="text-[#111827] dark:text-white">
                    {(propertyValue * (loanPercentage/100)).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng lãi thanh toán ước tính:</span>
                  <span className="text-[#111827] dark:text-white">
                    {((monthlyPayment * loanTerm * 12) - (propertyValue * (loanPercentage/100))).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} VNĐ
                  </span>
                </div>
              </div>

              <a 
                href="#dang-ky"
                className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-xs text-center"
              >
                Nhận Báo Giá Trả Góp Chi Tiết
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Lead Registration Form Section */}
      <section id="dang-ky" className="py-20 bg-gradient-to-br from-[#064E3B] to-[#043327] text-white relative overflow-hidden transition-colors">
        
        {/* Abstract design elements */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
                Đăng Ký Đặt Chỗ & Nhận Ưu Đãi Qúy 2/2026
              </h2>
              <p className="text-sm text-emerald-100/70 max-w-xl mx-auto font-body">
                Vui lòng điền thông tin bên dưới để được bộ phận tư vấn chủ đầu tư hỗ trợ chọn căn đẹp nhất, nhận bảng giá gốc và chiết khấu nội bộ.
              </p>
            </div>

            {formSuccess ? (
              <div className="bg-emerald-500 border border-emerald-400 p-8 rounded-2xl text-center space-y-4 animate-scale-up">
                <CheckCircle2 className="w-16 h-16 text-white mx-auto animate-bounce" />
                <h3 className="text-2xl font-bold font-display">Gửi Thông Tin Thành Công!</h3>
                <p className="text-sm text-emerald-100 leading-relaxed font-body max-w-md mx-auto">
                  Cảm ơn Anh/Chị đã đăng ký nhận thông tin dự án Nhịp Điệu Xanh. Bộ phận kinh doanh sẽ liên hệ hỗ trợ Anh/Chị trong vòng 15 phút.
                </p>
                <button 
                  onClick={() => setFormSuccess(false)}
                  className="bg-white text-emerald-600 font-bold px-6 py-2 rounded-xl text-xs hover:bg-emerald-50 transition-all"
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {formError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                      Họ và Tên <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
                      <input 
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full text-sm bg-emerald-950/60 border border-emerald-800/40 p-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                      Số điện thoại <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
                      <input 
                        type="tel"
                        required
                        placeholder="0901234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full text-sm bg-emerald-950/60 border border-emerald-800/40 p-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
                      <input 
                        type="email"
                        placeholder="example@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full text-sm bg-emerald-950/60 border border-emerald-800/40 p-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Location field */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                      Khu vực quan tâm / Tỉnh thành <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-emerald-400" />
                      <input 
                        type="text"
                        required
                        placeholder="Cái Răng, Cần Thơ / Bạc Liêu..."
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full text-sm bg-emerald-950/60 border border-emerald-800/40 p-3.5 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Needs selector */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                      Nhu cầu căn hộ
                    </label>
                    <select 
                      value={formData.intent}
                      onChange={(e) => setFormData({...formData, intent: e.target.value})}
                      className="w-full text-sm bg-emerald-950/60 border border-emerald-800/40 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-emerald-400 font-semibold"
                    >
                      <option value="mua ở" className="text-black bg-white">Mua để định cư ở</option>
                      <option value="đầu tư" className="text-black bg-white">Mua để đầu tư tích lũy</option>
                      <option value="cho con đi học" className="text-black bg-white">Mua cho con đi học đại học</option>
                    </select>
                  </div>

                  {/* Budget selector */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-emerald-300">
                      Tầm ngân sách dự kiến
                    </label>
                    <select 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full text-sm bg-emerald-950/60 border border-emerald-800/40 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-emerald-400 font-semibold"
                    >
                      <option value="1.8" className="text-black bg-white">Dưới 2 Tỷ VNĐ</option>
                      <option value="2.5" className="text-black bg-white">Từ 2 Tỷ - 3 Tỷ VNĐ</option>
                      <option value="4.0" className="text-black bg-white">Từ 3 Tỷ - 5 Tỷ VNĐ</option>
                      <option value="6.0" className="text-black bg-white">Trên 5 Tỷ VNĐ</option>
                    </select>
                  </div>

                </div>

                {/* Decree 13 compliance checkbox */}
                <div className="flex items-start space-x-3 pt-2">
                  <input 
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => setFormData({...formData, consent: e.target.checked})}
                    className="w-4.5 h-4.5 rounded text-emerald-500 bg-emerald-950 border-emerald-800 focus:ring-emerald-400 mt-0.5"
                  />
                  <label htmlFor="consent" className="text-xs text-emerald-200/80 leading-relaxed font-body">
                    Tôi đồng ý để Nhịp Điệu Xanh thu thập và xử lý dữ liệu cá nhân của tôi nhằm phục vụ việc liên hệ tư vấn bất động sản theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân.
                  </label>
                </div>

                <button 
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-amber-500/25 transition-all text-base text-center flex items-center justify-center space-x-2"
                >
                  {formLoading ? (
                    <span>Đang gửi thông tin...</span>
                  ) : (
                    <>
                      <span>Đăng ký Nhận Bảng Giá Chi Tiết & Tài Liệu Pháp Lý</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* 7. Collapsible FAQs Section */}
      <section className="py-20 bg-white dark:bg-[#043327] transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-4 py-1.5 rounded-full">
              Giải Đáp Thắc Mắc
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display">
              Các Câu Hỏi Thường Gặp (FAQs)
            </h2>
            <p className="text-gray-600 dark:text-emerald-100/60 font-body">
              Những thông tin khách hàng quan tâm hàng đầu về dự án Nhịp Điệu Xanh Cần Thơ.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Chủ đầu tư của dự án Nhịp Điệu Xanh Cần Thơ là ai?",
                a: "Dự án được đầu tư bởi Công ty Cổ phần Đầu tư Địa ốc Nhịp Điệu Xanh, doanh nghiệp proptech và phát triển bất động sản sinh thái hàng đầu tại khu vực Tây Nam Bộ."
              },
              {
                q: "Dự án đã có giấy phép xây dựng và pháp lý rõ ràng chưa?",
                a: "Dự án Nhịp Điệu Xanh có pháp lý hoàn chỉnh nhất Cần Thơ hiện nay. Đã có Quy hoạch chi tiết 1/500, Giấy phép xây dựng phần thân tòa nhà và Quyết định giao đất của UBND TP Cần Thơ."
              },
              {
                q: "Tiến độ thi công thực tế hiện tại đến đâu?",
                a: "Đến thời điểm Quý 2/2026, dự án đã thi công xong phần móng cọc hầm và đang triển khai xây dựng lên đến tầng 6. Đảm bảo bàn giao căn hộ hoàn thiện đúng cam kết vào Quý 4/2026."
              },
              {
                q: "Gói vay ưu đãi lãi suất được áp dụng như thế nào?",
                a: "Ngân hàng bảo lãnh Vietcombank hỗ trợ gói vay 70%, ân hạn nợ gốc tối đa 24 tháng và miễn lãi suất cho đến khi bàn giao nhà. Lãi suất sau ưu đãi cam kết không vượt quá biên độ 3.5%."
              }
            ].map((faq, i) => (
              <details 
                key={i} 
                className="group border border-gray-200/60 dark:border-emerald-800/40 rounded-2xl bg-gray-50/50 dark:bg-emerald-950/30 overflow-hidden"
              >
                <summary className="flex justify-between items-center font-bold text-sm sm:text-base p-6 cursor-pointer list-none select-none hover:text-emerald-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-300" />
                </summary>
                <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-emerald-800/20 text-xs sm:text-sm text-gray-600 dark:text-emerald-100/70 leading-relaxed font-body">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

        </div>
      </section>

      {/* 8. Disclosures Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-sm font-bold text-gray-300">
            © 2026 Công ty Cổ phần Đầu tư Địa ốc Nhịp Điệu Xanh. Bảo lưu mọi quyền.
          </p>
          <p className="text-[11px] leading-relaxed max-w-4xl mx-auto">
            Thông tin, hình ảnh, thông số kỹ thuật trên website mang tính chất tham khảo, minh họa tại thời điểm công bố và không cấu thành một văn bản chào bán hay cam kết hợp đồng pháp lý. Chi tiết thiết kế và diện tích căn hộ thực tế có thể thay đổi nhỏ trong quá trình xây dựng theo thẩm quyền của cơ quan quản lý nhà nước.
          </p>
        </div>
      </footer>

      {/* 9. Mock Chatbot (Floating Widget) */}
      <div className="fixed bottom-6 right-6 z-50">
        
        {/* Toggle Chat button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 relative"
          aria-label="Open chat"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {/* Online green indicator */}
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
        </button>

        {/* Chat box container */}
        {isChatOpen && (
          <div className="absolute bottom-20 right-0 w-[340px] sm:w-[380px] bg-white dark:bg-emerald-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-emerald-800/40 overflow-hidden flex flex-col h-[480px] animate-scale-up">
            
            {/* Chat header */}
            <div className="bg-gradient-to-r from-[#064E3B] to-[#043327] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center relative">
                  <Building2 className="w-5 h-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border border-white rounded-full" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">AI Trợ lý Nhịp Điệu Xanh</h4>
                  <span className="text-[10px] text-emerald-300 font-bold block">Đang trực tuyến • Auto RAG</span>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-emerald-950/20 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs sm:text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-500 text-white rounded-tr-none'
                      : 'bg-white dark:bg-emerald-900 text-[#111827] dark:text-white rounded-tl-none border border-gray-100 dark:border-emerald-800/30'
                  }`}>
                    <p className="leading-relaxed font-body">{msg.text}</p>
                    <span className="block text-[8px] text-right mt-1 opacity-60 font-bold">{msg.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-emerald-900 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion Chips */}
            <div className="p-3 bg-white dark:bg-emerald-950 border-t border-gray-100 dark:border-emerald-800/30 flex flex-wrap gap-1.5">
              {[
                { label: '💵 Giá căn hộ?', query: 'Giá bán căn hộ bao nhiêu?' },
                { label: '⚖️ Pháp lý dự án?', query: 'Pháp lý dự án thế nào?' },
                { label: '🏦 Hỗ trợ vay?', query: 'Ngân hàng hỗ trợ vay bao nhiêu?' },
                { label: '🎓 Cho con đi học?', query: 'Mua cho con đi học có hợp lý không?' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  className="bg-gray-100 dark:bg-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-[#111827] dark:text-emerald-200 border border-gray-200/50 dark:border-emerald-800/20 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input box */}
            <div className="p-3 bg-white dark:bg-emerald-950 border-t border-gray-100 dark:border-emerald-800/30 flex space-x-2">
              <input 
                type="text"
                placeholder="Nhập câu hỏi tại đây..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                className="flex-1 bg-gray-100 dark:bg-emerald-900 border border-gray-200/50 dark:border-emerald-800/20 text-xs p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black dark:text-white"
              />
              <button
                onClick={() => handleSendMessage()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  )
}
