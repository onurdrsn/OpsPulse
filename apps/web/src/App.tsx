import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Server, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Terminal, 
  Layers 
} from 'lucide-react';

interface FormData {
  fullName: string;
  email: string;
  serviceType: string;
  description: string;
  website?: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  serviceType?: string;
  description?: string;
}

const SERVICE_OPTIONS = [
  { id: 'incident-triage', label: 'Otonom Olay & Triage Yönetimi' },
  { id: 'workflow-automation', label: 'Dağıtık Görev & İş Akışı Otomasyonu' },
  { id: 'telemetry-sync', label: 'Telemetri & Kuyruk Entegrasyonu' },
  { id: 'custom-integration', label: 'Özel Mikroservis Entegrasyonu' },
];

export default function App() {
  const [formData, setFormData] = useState<FormData>({
	fullName: '',
	email: '',
	serviceType: 'incident-triage',
	description: '',
	website: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverMessage, setServerMessage] = useState<string>('');
  const [recordId, setRecordId] = useState<string>('');

  // İstemci tarafı doğrulama
  const validate = (): boolean => {
	const newErrors: FormErrors = {};

	if (!formData.fullName.trim()) {
	  newErrors.fullName = 'İsim alanı zorunludur.';
	} else if (formData.fullName.trim().length < 3) {
	  newErrors.fullName = 'İsim en az 3 karakter olmalıdır.';
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!formData.email.trim()) {
	  newErrors.email = 'E-posta alanı zorunludur.';
	} else if (!emailRegex.test(formData.email.trim())) {
	  newErrors.email = 'Lütfen geçerli bir e-posta adresi giriniz.';
	}

	if (!formData.serviceType) {
	  newErrors.serviceType = 'Lütfen bir hizmet türü seçiniz.';
	}

	if (!formData.description.trim()) {
	  newErrors.description = 'Talep açıklaması zorunludur.';
	} else if (formData.description.trim().length < 15) {
	  newErrors.description = 'Lütfen talebinizi en az 15 karakterle açıklayınız.';
	}

	setErrors(newErrors);
	return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
	const { name, value } = e.target;
	setFormData((prev) => ({ ...prev, [name]: value }));
	if (errors[name as keyof FormErrors]) {
	  setErrors((prev) => ({ ...prev, [name]: undefined }));
	}
  };

  const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	if (!validate()) return;

	setStatus('submitting');
	setServerMessage('');

	// Env'dan gelen API URL kısmı
	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

	try {
	  const response = await fetch(`${API_URL}/api/leads`, {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(formData),
	  });

	  const data = await response.json();

	  if (response.status === 201 && data.success) {
		setStatus('success');
		setServerMessage(data.message || 'Talebiniz başarıyla sunucuya kaydedildi.');
		setRecordId(data.recordId || '');
		setFormData({
		  fullName: '',
		  email: '',
		  serviceType: 'incident-triage',
		  description: '',
		  website: ''
		});
	  } else {
		setStatus('error');
		setServerMessage(data.message || 'Kayıt sırasında bir hata oluştu.');
		if (data.errors) {
		  const fieldErrors: FormErrors = {};
		  Object.keys(data.errors).forEach((key) => {
			fieldErrors[key as keyof FormErrors] = data.errors[key][0];
		  });
		  setErrors(fieldErrors);
		}
	  }
	} catch {
	  setStatus('error');
	  setServerMessage('Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyiniz.');
	}
  };

  return (
	<div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
	  {/* Header */}
	  <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
		<div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
		  <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
			<div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
			  <Zap className="w-4 h-4" />
			</div>
			<span>OpsPulse</span>
		  </div>
		  <a 
			href="#request-form" 
			className="text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors border border-slate-700"
		  >
			Talep Oluştur
		  </a>
		</div>
	  </header>

	  {/* Hero Section */}
	  <section className="py-20 px-4 text-center max-w-4xl mx-auto">
		<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
		  <Terminal className="w-3.5 h-3.5" />
		  <span>Yeni Nesil Dağıtık Sistem Otomasyonu</span>
		</div>
		<h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
		  Sistem Arızalarını Tespit Edin, <br />
		  <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">
			Otonom Müdahaleyle Çözün.
		  </span>
		</h1>
		<p className="text-base sm:text-lg text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
		  OpsPulse, mikroservis ve telemetri kuyruklarınızı dinleyerek kritik olayları milisaniyeler içinde sınıflandırır, darboğazları izole eder ve ekiplerinize kesintisiz mühendislik desteği sağlar.
		</p>
		<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
		  <a 
			href="#request-form" 
			className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
		  >
			Hemen Başlayın
			<ArrowRight className="w-4 h-4" />
		  </a>
		  <a 
			href="#features" 
			className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium px-6 py-3 rounded-lg border border-slate-800 transition-colors"
		  >
			Özellikleri İnceleyin
		  </a>
		</div>
	  </section>

	  {/* Features Grid */}
	  <section id="features" className="py-16 max-w-6xl mx-auto px-4 border-t border-slate-900">
		<div className="grid md:grid-cols-3 gap-6">
		  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
			<div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
			  <Server className="w-5 h-5" />
			</div>
			<h3 className="font-semibold text-lg text-white mb-2">Olay & Hata İzolasyonu</h3>
			<p className="text-slate-400 text-sm leading-relaxed">
			  Mikroservis anomalilerini ve telemetri loglarını gerçek zamanlı analiz ederek zincirleme kesintilerin önüne geçer.
			</p>
		  </div>
		  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
			<div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
			  <Layers className="w-5 h-5" />
			</div>
				<h3 className="font-semibold text-lg text-white mb-2">Entegrasyon & Veri Akışı</h3>
				<p className="text-slate-400 text-sm leading-relaxed">
				Servisler arası veri transferlerini ve asenkron istekleri hata toleranslı ve takip edilebilir mekanizmalarla yönetir.
				</p>
		  </div>
		  <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
			<div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
			  <ShieldCheck className="w-5 h-5" />
			</div>
			<h3 className="font-semibold text-lg text-white mb-2">Sıfır Kesinti Garantisi</h3>
			<p className="text-slate-400 text-sm leading-relaxed">
			  Kritik veri tabanı kilitlenmelerini ve yarış durumlarını otomatik tespit edip işlem tutarlılığını korur.
			</p>
		  </div>
		</div>
	  </section>

	  {/* Request Form Section */}
	  <section id="request-form" className="py-20 px-4 max-w-2xl mx-auto">
		<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
		  <div className="mb-8">
			<h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Hizmet Talebi Oluşturun</h2>
			<p className="text-slate-400 text-sm">
			  Sisteminizin ihtiyaçlarını iletin, 24 saat içinde mimari analiz ve yol haritası sunalım.
			</p>
		  </div>

		  {/* Success Banner */}
		  {status === 'success' && (
			<div
				role="alert"
				aria-live="polite"
				className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3"
			>
			  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
			  <div>
				<h4 className="font-semibold text-sm">Kayıt Başarıyla Alındı!</h4>
				<p className="text-xs text-emerald-400/90 mt-1">{serverMessage}</p>
				{recordId && (
				  <p className="text-[11px] font-mono text-emerald-500/80 mt-2">Kayıt No: {recordId}</p>
				)}
			  </div>
			</div>
		  )}

		  {/* Error Banner */}
		  {status === 'error' && (
			<div 
				role="alert" 
				aria-live="assertive" 
				className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3"
			  >
				<AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
				<div>
				  <h4 className="font-semibold text-sm">İşlem Tamamlanamadı</h4>
				  <p className="text-xs text-rose-400/90 mt-1">{serverMessage}</p>
				</div>
			</div>
		  )}

		  <form onSubmit={handleSubmit} noValidate className="space-y-5">
			{/* Full Name */}
			<div>
			  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
				Ad Soyad
			  </label>
			  <input
				type="text"
				id="fullName"
				name="fullName"
				value={formData.fullName}
				onChange={handleChange}
				disabled={status === 'submitting'}
				aria-invalid={!!errors.fullName}
				aria-describedby={errors.fullName ? "fullName-error" : undefined}
				placeholder="Örn: Ayşe Yılmaz"
				className={`w-full bg-slate-950/60 border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
				  errors.fullName 
					? 'border-rose-500/80 focus:ring-rose-500/30' 
					: 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
				}`}
			  />
			  {errors.fullName && (
				<p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
				  <AlertCircle className="w-3 h-3" /> {errors.fullName}
				</p>
			  )}
			</div>

			{/* Email */}
			<div>
			  <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
				Kurumsal E-posta
			  </label>
			  <input
				type="email"
				id="email"
				name="email"
				value={formData.email}
				onChange={handleChange}
				disabled={status === 'submitting'}
				aria-invalid={!!errors.email}
      			aria-describedby={errors.email ? "email-error" : undefined}
				placeholder="ornek@sirketiniz.com"
				className={`w-full bg-slate-950/60 border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
				  errors.email 
					? 'border-rose-500/80 focus:ring-rose-500/30' 
					: 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
				}`}
			  />
			  {errors.email && (
				<p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
				  <AlertCircle className="w-3 h-3" /> {errors.email}
				</p>
			  )}
			</div>

			{/* Service Type */}
			<div>
				<label htmlFor="serviceType" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
					Hizmet Türü
			  	</label>
			  	<select
					id="serviceType"
      				name="serviceType"
      				value={formData.serviceType}
      				onChange={handleChange}
      				disabled={status === 'submitting'}
      				aria-invalid={!!errors.serviceType}
      				aria-describedby={errors.serviceType ? "serviceType-error" : undefined}
      				className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
				>
				{SERVICE_OPTIONS.map((opt) => (
					<option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
					{opt.label}
					</option>
				))}
				</select>
				{errors.serviceType && (
				<p id="serviceType-error" role="alert" className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
					<AlertCircle className="w-3 h-3" /> {errors.serviceType}
				</p>
				)}
			</div>

			{/* Description */}
			<div>
			  <label htmlFor="description" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
				Talep Açıklaması ve Sistem Detayı
			  </label>
			  <textarea
				id="description"
				name="description"
				rows={4}
				value={formData.description}
				onChange={handleChange}
				disabled={status === 'submitting'}
				aria-invalid={!!errors.description}
      			aria-describedby={errors.description ? "description-error" : undefined}
				placeholder="Sisteminizdeki mevcut mimari kısıtlar veya talep ettiğiniz otomasyon kapsamı hakkında kısa bilgi veriniz..."
				className={`w-full bg-slate-950/60 border rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-none ${
					errors.description 
					? 'border-rose-500/80 focus:ring-rose-500/30' 
					: 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20'
				}`}
				/>
				{errors.description && (
				<p id="description-error" role="alert" className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
					<AlertCircle className="w-3 h-3" /> {errors.description}
				</p>
				)}
			</div>
			{/* Honeypot Spam Koruması (CSS ile gizli) */}
			<div className="hidden" aria-hidden="true">
				<label htmlFor="website">Website</label>
				<input
					type="text"
					id="website"
					name="website"
					tabIndex={-1}
					autoComplete="off"
					value={formData.website || ''}
					onChange={handleChange}
				/>
			</div>

			{/* Submit Button */}
			<button
				type="submit"
				disabled={status === 'submitting'}
				className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
			>
				{status === 'submitting' ? (
				<>
					<Loader2 className="w-4 h-4 animate-spin" />
					<span>Kayıt İletiliyor ve Doğrulanıyor...</span>
				</>
				) : (
				<>
					<span>Talebi İlet</span>
					<ArrowRight className="w-4 h-4" />
				</>
				)}
			</button>
		  </form>
		</div>
	  </section>

	  {/* Footer */}
	  <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
		<p>© 2026 OpsPulse Systems. Tüm hakları saklıdır. Bu çalışma teknik değerlendirme amaçlı kurgulanmıştır.</p>
	  </footer>
	</div>
  );
}