'use client'

import React, { useState } from 'react'
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Mail, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Coins, 
  Calendar 
} from 'lucide-react'

export default function Home() {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    need: 'mua ở', // default
    budget: '2 - 3 tỷ', // default
    area: 'Cái Răng', // default
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic Validation
    if (!formData.name.trim()) {
      setError('Vui lòng nhập Họ và Tên.')
      setLoading(false)
      return
    }
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập Số điện thoại.')
      setLoading(false)
      return
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '')
    if (!/^(0|84|\+84)[3-9][0-9]{8}$/.test(cleanPhone)) {
      setError('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678).')
      setLoading(false)
      return
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Địa chỉ email không hợp lệ.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-emerald-700 block uppercase">
                Nhịp Điệu Xanh
              </span>
              <span className="block text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                BĐS Sinh Thái Cần Thơ
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#tong-quan" className="hover:text-emerald-600 transition-colors">Tổng Quan</a>
            <a href="#uu-diem" className="hover:text-emerald-600 transition-colors">Ưu Điểm</a>
            <a href="#dang-ky" className="hover:text-emerald-600 transition-colors">Nhận Tư Vấn</a>
          </div>
          <div>
            <a 
              href="#dang-ky" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Liên Hệ Ngay
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="tong-quan" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-transparent">
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Columns - Text content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/50 px-4 py-1.5 rounded-full text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nền Tảng Phân Phối Bất Động Sản Uy Tín</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Tìm Nhà Cần Thơ <br />
                Dễ Dàng Cùng <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-amber-500">
                  Nhịp Điệu Xanh
                </span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Đồng hành cùng quý khách tìm kiếm tổ ấm sinh thái hoàn hảo tại thủ phủ miền Tây. Cung cấp thông tin quy hoạch minh bạch, bảng giá chuẩn xác và chính sách ưu đãi độc quyền từ chủ đầu tư.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-2 text-left">
                <div className="flex items-center space-x-2 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span className="font-medium">Hỗ trợ pháp lý toàn diện</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span className="font-medium">Chiết khấu tốt nhất thị trường</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span className="font-medium">Xem nhà mẫu trực tiếp</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
                  <span className="font-medium">Lãi suất trả góp ưu đãi 0%</span>
                </div>
              </div>

              <div className="pt-4">
                <a 
                  href="#dang-ky"
                  className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all space-x-2 group"
                >
                  <span>Khám Phá Rổ Hàng Mới Nhất</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Column - Gated Registration Form */}
            <div id="dang-ky" className="lg:col-span-5">
              <div className="relative bg-white border border-slate-200 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 max-w-md mx-auto">
                
                {success ? (
                  // Success State Visual
                  <div className="text-center py-8 space-y-5 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900">Đăng Ký Thành Công!</h3>
                      <p className="text-sm text-slate-500 leading-relaxed px-2">
        <p className="text-sm text-slate-500 leading-relaxed px-2">
          Thông tin nhu cầu của bạn đã được lưu lại. Đội ngũ chuyên viên Nhịp Điệu Xanh sẽ liên hệ gửi rổ hàng và bảng giá chi tiết qua điện thoại/Zalo trong vòng 15 phút.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed px-2 mt-1">
          <MapPin className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5 text-emerald-500" />
          Khu vực quan tâm của bạn: <strong>{formData.area}</strong>
        </p>
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setSuccess(false)
                        setFormData({
                          name: '',
                          phone: '',
                          email: '',
                          need: 'mua ở',
                          budget: '2 - 3 tỷ',
                          area: 'Cái Răng',
                        })
                      }}
                      className="px-6 py-2 border border-slate-200 hover:border-emerald-500 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Đăng ký nhu cầu mới
                    </button>
                  </div>
                ) : (
                  // Main Lead capture form
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Đăng Ký Nhận Tư Vấn VIP</h3>
                      <p className="text-xs text-slate-500 mt-1">Cung cấp nhu cầu của bạn để nhận danh sách nhà phố & căn hộ phù hợp nhất.</p>
                    </div>

                    <div className="border-t border-slate-100 my-4" />

                    {error && (
                      <div className="bg-red-50 text-red-600 text-xs font-semibold p-3.5 rounded-xl border border-red-100">
                        ⚠️ {error}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Họ và Tên *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm" 
                          placeholder="Nguyễn Văn A" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số Điện Thoại *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel" 
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm" 
                          placeholder="0901234567" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email (Không bắt buộc)</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm" 
                          placeholder="nguyenvana@gmail.com" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nhu Cầu</label>
                        <select 
                          name="need"
                          value={formData.need}
                          onChange={handleInputChange}
                          className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
                        >
                          <option value="mua ở">Mua ở định cư</option>
                          <option value="đầu tư">Đầu tư sinh lời</option>
                          <option value="cho con đi học">Cho con đi học</option>
                          <option value="khác">Khác</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khu vực quan tâm</label>
                        <select 
                          name="area"
                          value={formData.area}
                          onChange={handleInputChange}
                          className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
                        >
                          <option value="Cái Răng">Q. Cái Răng</option>
                          <option value="Ninh Kiều">Q. Ninh Kiều</option>
                          <option value="Bình Thủy">Q. Bình Thủy</option>
                          <option value="Khu Nam Cần Thơ">Nam Cần Thơ</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách dự phóng</label>
                      <select 
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm font-medium"
                      >
                        <option value="dưới 1.5 tỷ">Dưới 1.5 Tỷ VNĐ</option>
                        <option value="1.5 - 2 tỷ">1.5 Tỷ - 2 Tỷ VNĐ</option>
                        <option value="2 - 3 tỷ">2 Tỷ - 3 Tỷ VNĐ</option>
                        <option value="3 - 5 tỷ">3 Tỷ - 5 Tỷ VNĐ</option>
                        <option value="trên 5 tỷ">Trên 5 Tỷ VNĐ</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/10 transition-all text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Nhận Thông Tin Ngay</span>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center">
                      * Nhịp Điệu Xanh cam kết bảo mật tuyệt đối dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CORE BENEFITS SECTION */}
      <section id="uu-diem" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-1.5 rounded-full">
              Ưu Thế Nổi Bật
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              An Tâm Đầu Tư - An Cư Thịnh Vượng
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Chúng tôi chắt lọc rổ hàng bất động sản cao cấp, đáp ứng cả tiêu chí sống nghỉ dưỡng trong sạch lẫn tiềm năng phát triển hạ tầng gia tăng giá trị.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl space-y-4">
              <div className="bg-emerald-100 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">100% Pháp Lý An Toàn</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Rổ hàng phân phối chuẩn chỉ, được thẩm định pháp lý nghiêm ngặt. Hợp đồng mua bán minh bạch, cam kết sổ hồng trao tay.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl space-y-4">
              <div className="bg-emerald-100 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Giá Gốc & Ưu Đãi Lớn</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Được bảo chứng giá gốc trực tiếp F0 từ các chủ đầu tư hàng đầu tại Cần Thơ. Hỗ trợ trả góp dài hạn không phát sinh chi phí.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl space-y-4">
              <div className="bg-emerald-100 text-emerald-700 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Cập Nhật Tiến Độ Thực Tế</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Theo dõi sát sao tiến độ xây dựng hạ tầng dự án qua hình ảnh thực tế 3D, giúp khách hàng đưa ra quyết định mua bán chính xác.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 w-6 h-6 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              NĐX
            </div>
            <span className="font-bold text-white uppercase text-[10px]">
              Nhịp Điệu Xanh Cần Thơ
            </span>
          </div>
          <p>© 2026 Nhịp Điệu Xanh Cần Thơ. Bản quyền thuộc về Nhịp Điệu Xanh.</p>
        </div>
      </footer>

    </div>
  )
}
