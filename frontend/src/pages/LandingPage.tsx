import { Brand, SiteHeader } from '../components/SiteHeader'
import { Icon } from '../components/Icons'

const specialties = [
  { title: 'Medicina general', note: 'Un punto de partida para tu atención', icon: 'stethoscope' as const, color: 'mint' },
  { title: 'Cardiología', note: 'Salud del corazón y circulación', icon: 'heart' as const, color: 'rose' },
  { title: 'Pediatría', note: 'Cuidado de niñas, niños y adolescentes', icon: 'user' as const, color: 'blue' },
  { title: 'Medicina interna', note: 'Atención integral para personas adultas', icon: 'shield' as const, color: 'amber' },
]

export function LandingPage() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <SiteHeader />
      <main id="contenido">
        <section className="hero relative overflow-hidden" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-6 lg:px-8 lg:py-24">
            <div className="relative z-10 max-w-[610px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b5e8e5] bg-[#eaf9f7] px-4 py-2 text-[11px] font-bold uppercase tracking-[.19em] text-[#087c7d]">
                <span className="h-2 w-2 rounded-full bg-[#0F8B8D]" />
                Un directorio pensado para personas
              </div>
              <h1 id="hero-title" className="max-w-[620px] text-[clamp(2.8rem,5.8vw,5.45rem)] leading-[1.03] font-bold tracking-[-.065em] text-[#173454]">
                Encontrar atención empieza por <span className="text-[#0F8B8D]">encontrar claridad.</span>
              </h1>
              <p className="mt-7 max-w-[520px] text-[16px] leading-7 text-[#536a7a] sm:text-[18px] sm:leading-8">
                Un espacio para conocer especialidades y, próximamente, descubrir profesionales de salud según lo que necesitas.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#1E3A5F] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_28px_-13px_#1E3A5F] transition hover:-translate-y-0.5 hover:bg-[#143453] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0F8B8D]" href="#especialidades">
                  Conoce las especialidades <Icon name="arrow" className="h-4 w-4" />
                </a>
                <a className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-[#1E3A5F] underline decoration-[#90c8c7] decoration-2 underline-offset-4 transition hover:text-[#0F8B8D] focus-visible:outline-3 focus-visible:outline-[#0F8B8D]" href="#para-medicos">
                  Soy profesional de salud <Icon name="arrow" className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-12 flex max-w-[520px] items-start gap-3 border-t border-[#dce8e8] pt-6 text-[13px] leading-6 text-[#607685]">
                <Icon name="spark" className="mt-0.5 h-5 w-5 shrink-0 text-[#0F8B8D]" />
                <p>Estamos preparando el directorio. La búsqueda de médicos y el asistente orientativo llegarán en próximas etapas.</p>
              </div>
            </div>
            <HeroIllustration />
          </div>
        </section>

        <section className="border-y border-[#e4eeee] bg-white" aria-label="Principios del directorio">
          <div className="mx-auto grid max-w-[1240px] gap-5 px-5 py-7 text-center sm:grid-cols-3 sm:text-left lg:px-8">
            <div className="flex items-center justify-center gap-3 sm:justify-start"><Icon name="search" className="h-5 w-5 shrink-0 text-[#0F8B8D]" /><span className="text-sm font-semibold text-[#36516b]">Información fácil de explorar</span></div>
            <div className="flex items-center justify-center gap-3 sm:justify-start"><Icon name="shield" className="h-5 w-5 shrink-0 text-[#0F8B8D]" /><span className="text-sm font-semibold text-[#36516b]">Credenciales con estado claro</span></div>
            <div className="flex items-center justify-center gap-3 sm:justify-start"><Icon name="heart" className="h-5 w-5 shrink-0 text-[#0F8B8D]" /><span className="text-sm font-semibold text-[#36516b]">Decisiones informadas</span></div>
          </div>
        </section>

        <section id="especialidades" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="specialty-title">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">EXPLORA POR ESPECIALIDAD</p>
              <h2 id="specialty-title" className="mt-3 max-w-[690px] text-[clamp(2rem,4vw,3.4rem)] leading-[1.12] font-bold tracking-[-.05em] text-[#173454]">Cada necesidad merece un buen punto de partida.</h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#eaf7f6] px-4 py-2 text-xs font-bold text-[#087c7d]"><Icon name="clock" className="h-4 w-4" /> Especialidades ilustrativas</span>
          </div>
          <p className="mt-4 max-w-[670px] text-[15px] leading-7 text-[#667d8b]">Estas categorías ilustran cómo podrás explorar el directorio. La búsqueda pública forma parte de otra etapa.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialties.map((item) => (
              <article key={item.title} className="specialty-card group rounded-[24px] border border-[#e1ecee] bg-white p-6 shadow-[0_18px_50px_-38px_#173454]">
                <span className={`specialty-icon specialty-${item.color}`}><Icon name={item.icon} className="h-7 w-7" /></span>
                <h3 className="mt-9 text-[19px] font-bold tracking-tight text-[#173454]">{item.title}</h3>
                <p className="mt-2 min-h-[48px] text-[13px] leading-6 text-[#637986]">{item.note}</p>
                <div className="mt-7 flex items-center justify-between border-t border-[#e9f0f1] pt-5 text-[12px] font-bold text-[#0F8B8D]">
                  <span>Próximamente</span><Icon name="arrow" className="h-4 w-4" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 bg-[#edf7f6] py-20 lg:py-24" aria-labelledby="steps-title">
          <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
            <p className="eyebrow">UNA EXPERIENCIA MÁS SIMPLE</p>
            <h2 id="steps-title" className="mt-3 max-w-[660px] text-[clamp(2rem,4vw,3.4rem)] leading-[1.12] font-bold tracking-[-.05em] text-[#173454]">Un camino claro para encontrar a quién consultar.</h2>
            <p className="mt-4 max-w-[700px] text-[15px] leading-7 text-[#5a7280]">Así está prevista la experiencia del directorio. Sus funciones se habilitarán de forma gradual en los siguientes sprints.</p>
            <div className="mt-11 grid gap-5 md:grid-cols-3">
              <Step number="01" icon="search" title="Explora" description="Busca por nombre, especialidad, ubicación o colegiatura cuando se habilite el directorio." />
              <Step number="02" icon="file" title="Conoce su perfil" description="Consulta la trayectoria y el estado de verificación informado para cada profesional." />
              <Step number="03" icon="heart" title="Decide con confianza" description="Compara información relevante antes de elegir cómo continuar." />
            </div>
          </div>
        </section>

        <section id="para-medicos" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="doctor-title">
          <div className="relative overflow-hidden rounded-[32px] bg-[#1E3A5F] px-7 py-12 text-white sm:px-12 lg:grid lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-16 lg:py-16">
            <div className="doctor-glow" aria-hidden="true" />
            <div className="relative z-10 max-w-[640px]">
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#8ce2de]">PARA PROFESIONALES DE SALUD</p>
              <h2 id="doctor-title" className="mt-4 text-[clamp(2rem,4vw,3.65rem)] leading-[1.1] font-bold tracking-[-.05em]">Tu experiencia merece un espacio propio.</h2>
              <p className="mt-5 max-w-[580px] text-[15px] leading-7 text-[#d4e4eb]">Regístrate y gestiona tu presentación profesional, colegiatura, especialidades y centros de atención desde un mismo lugar.</p>
              <a href="/registro/medico" className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20"><Icon name="arrow" className="h-4 w-4 text-[#8ce2de]" /> Regístrate como médico</a>
            </div>
            <div className="relative z-10 mt-12 flex justify-center lg:mt-0 lg:justify-end" aria-hidden="true">
              <div className="profile-preview w-full max-w-[330px] rounded-[24px] bg-white p-5 text-[#173454] shadow-[0_30px_70px_-35px_#001a30]">
                <div className="flex items-center gap-3 border-b border-[#e5eeee] pb-5"><div className="h-12 w-12 rounded-full bg-[#d8efec]" /><div className="space-y-2"><div className="h-3 w-28 rounded-full bg-[#d9e8e8]" /><div className="h-2 w-20 rounded-full bg-[#e9f0f1]" /></div></div>
                <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-[#e9f8f6] px-3 py-2 text-[11px] font-bold text-[#0F8B8D]">Perfil profesional</span><span className="rounded-full bg-[#edf3f7] px-3 py-2 text-[11px] font-bold text-[#5b7283]">Especialidades</span></div>
                <div className="mt-6 h-2 w-full rounded-full bg-[#e9f0f1]" /><div className="mt-2 h-2 w-4/5 rounded-full bg-[#e9f0f1]" /><div className="mt-2 h-2 w-2/3 rounded-full bg-[#e9f0f1]" />
                <p className="mt-6 border-t border-[#e5eeee] pt-4 text-[11px] font-semibold text-[#6a8290]">Vista conceptual del futuro perfil</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#dce9e9] bg-[#f7fbfa]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Brand />
          <p className="text-xs leading-6 text-[#708591]">Proyecto académico en desarrollo · Universidad Nacional de Ingeniería</p>
          {import.meta.env.DEV && <a href="/demo/auditoria" className="text-xs font-bold text-[#0F8B8D] underline underline-offset-4">Demo de auditoría</a>}
        </div>
      </footer>
    </>
  )
}

function Step({ number, icon, title, description }: { number: string; icon: 'search' | 'file' | 'heart'; title: string; description: string }) {
  return (
    <article className="rounded-[24px] border border-[#d9eae9] bg-white p-7 shadow-[0_16px_40px_-35px_#1E3A5F]">
      <div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4f5f3] text-[#0F8B8D]"><Icon name={icon} /></span><span className="text-3xl font-bold tracking-[-.05em] text-[#d3e4e5]">{number}</span></div>
      <h3 className="mt-7 text-xl font-bold text-[#173454]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#5d7482]">{description}</p>
    </article>
  )
}

function HeroIllustration() {
  return (
    <div className="hero-art relative mx-auto flex h-[440px] w-full max-w-[550px] items-center justify-center sm:h-[500px] lg:h-[550px]" aria-hidden="true">
      <div className="absolute inset-[8%_7%_4%_10%] rounded-[48%] bg-[#d5efed]" />
      <div className="absolute inset-[13%_13%_10%_16%] rounded-[47%] border border-white/70" />
      <div className="absolute right-[5%] bottom-[10%] h-32 w-32 rounded-full bg-[#b9e4df]/60 blur-2xl" />
      <div className="absolute top-[8%] left-[5%] flex h-16 w-16 rotate-[-12deg] items-center justify-center rounded-[20px] bg-white text-[#0F8B8D] shadow-[0_20px_40px_-20px_#1E3A5F]"><Icon name="heart" className="h-8 w-8" /></div>
      <div className="absolute right-[3%] bottom-[20%] flex h-14 w-14 rotate-[12deg] items-center justify-center rounded-[18px] bg-[#0F8B8D] text-white shadow-[0_20px_40px_-20px_#1E3A5F]"><Icon name="spark" className="h-7 w-7" /></div>
      <div className="relative z-10 w-[77%] rotate-[-3deg] rounded-[30px] border border-white bg-white p-5 shadow-[0_28px_80px_-30px_#1E3A5F] sm:p-7">
        <div className="flex items-center justify-between border-b border-[#e7eff0] pb-5"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f7f5] text-[#0F8B8D]"><Icon name="search" className="h-5 w-5" /></span><span className="text-[13px] font-bold text-[#173454]">Explora con claridad</span></div><span className="h-2 w-2 rounded-full bg-[#5bc6bd]" /></div>
        <div className="mt-6 rounded-2xl border border-[#dce9eb] bg-[#f9fcfc] px-4 py-4 text-[12px] text-[#8296a0]">Especialidad, nombre o ubicación...</div>
        <div className="mt-6 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#94a7af]">Ejemplos de búsqueda</span><span className="h-1.5 w-8 rounded-full bg-[#d7e8e9]" /></div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-[#e7eff0] px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7f6f4] text-[#0F8B8D]"><Icon name="stethoscope" className="h-5 w-5" /></span><span className="text-xs font-bold text-[#36536c]">Medicina general</span><Icon name="arrow" className="ml-auto h-4 w-4 text-[#86b6b5]" /></div>
          <div className="flex items-center gap-3 rounded-xl border border-[#e7eff0] px-3 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fbeceb] text-[#d17977]"><Icon name="heart" className="h-5 w-5" /></span><span className="text-xs font-bold text-[#36536c]">Cardiología</span><Icon name="arrow" className="ml-auto h-4 w-4 text-[#86b6b5]" /></div>
        </div>
        <p className="mt-6 text-center text-[10px] font-semibold text-[#9baeb5]">Vista ilustrativa · búsqueda aún no disponible</p>
      </div>
      <div className="absolute right-[1%] top-[18%] z-20 hidden rotate-[6deg] items-center gap-2 rounded-2xl border border-[#e9f1f1] bg-white px-4 py-3 text-xs font-bold text-[#36536c] shadow-[0_15px_40px_-25px_#1E3A5F] sm:flex"><Icon name="pin" className="h-4 w-4 text-[#0F8B8D]" /> Cerca de ti</div>
    </div>
  )
}
