"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { 
  ArrowRight, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Wrench, 
  Flame, 
  Target, 
  Share2, 
  Users, 
  Network,
  ChevronDown,
  Radio,
  TrendingUp
} from "lucide-react";
import { Logo } from "@/components/Logo";

// Keynote Slide Animation Configs
const slideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const cardFadeIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden relative selection:bg-slate-900 selection:text-white">
      {/* Background Modern Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      {/* Soft Colorful Aura Highlights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-1/4 w-[600px] h-[600px] bg-purple-100/40 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-1/3 w-[500px] h-[500px] bg-cyan-100/50 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Slide 1: Hero Cover */}
      <section className="min-h-screen relative flex flex-col justify-center items-center px-6 py-24 z-10">
        <div className="absolute inset-0 w-full h-full -z-10 opacity-30">
          <Image
            src="/hero.png"
            alt="Physical Lab Hardware Hacking"
            fill
            className="object-cover filter grayscale contrast-125 brightness-110"
            priority
            unoptimized
          />
        </div>
        
        {/* Soft blur overlay to blend the hero image with the white theme */}
        <div className="absolute inset-0 bg-slate-50/75 -z-10 backdrop-blur-sm" />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl w-full text-center flex flex-col items-center space-y-8"
        >
          {/* Logo & Headline */}
          <motion.div variants={cardFadeIn} className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <Logo className="w-16 h-16 md:w-20 md:h-20 text-slate-800" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif tracking-tight mt-4 text-slate-900">
              PHYSICAL LAB
            </h1>
            <div className="space-y-1">
              <p className="text-lg md:text-xl font-bold tracking-widest text-slate-800 uppercase">
                Defining the Frontiers of the Physical Layer
              </p>
              <p className="text-sm md:text-base tracking-widest text-slate-500 font-serif">
                물리 계층의 경계를 정의하다
              </p>
            </div>
          </motion.div>

          {/* Core Mission Block */}
          <motion.div 
            variants={cardFadeIn}
            className="max-w-3xl bg-white/90 border border-slate-200 backdrop-blur-md p-8 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.05)] relative overflow-hidden group"
          >
            <div className="space-y-6">
              {/* English Text First */}
              <p className="text-base md:text-lg text-slate-800 leading-relaxed font-medium">
                "Physical Lab is a collective of researchers, engineers, and hackers dedicated to exploring the hidden phenomena within hardware and physical systems. In an era where everything is hyper-connected, we believe the physical layer is the frontline where security succeeds or fails, and the final frontier where true innovation begins."
              </p>
              
              {/* Subtle Divider */}
              <div className="w-16 h-[1px] bg-slate-200 mx-auto" />

              {/* Korean Text Second */}
              <p className="text-sm md:text-base text-slate-500 leading-relaxed font-serif">
                "Physical Lab은 하드웨어와 물리 시스템 속에 숨겨진 다양한 현상을 탐구하는 연구원, 엔지니어, 해커들의 공동체입니다. 모든 것이 긴밀하게 연결된 오늘날, 우리는 '물리 계층(Physical Layer)'이야말로 보안의 성패가 결정되는 최전선이자, 진정한 혁신이 시작되는 마지막 개척지라고 믿습니다."
              </p>
            </div>
          </motion.div>

          {/* Action & Scroll Indicator */}
          <motion.div variants={cardFadeIn} className="flex flex-col items-center space-y-8 pt-8">
            <Link 
              href="#research" 
              className="px-8 py-3 bg-slate-900 text-white font-semibold uppercase tracking-widest rounded-full hover:bg-slate-800 transition-colors shadow-[0_10px_20px_rgba(15,23,42,0.15)]"
            >
              Explore Overview
            </Link>
            
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-slate-400"
            >
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Slide 2: Research Areas */}
      <section id="research" className="min-h-screen flex flex-col justify-center px-6 py-24 z-10 border-t border-slate-200 bg-white relative">
        <div className="max-w-6xl mx-auto w-full space-y-16">
          
          {/* Header */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideUp}
            className="text-center md:text-left space-y-4"
          >
            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400">Research Focus</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900">
              Research Areas / <span className="text-slate-500 font-normal">주요 연구 분야</span>
            </h2>
            <div className="w-12 h-[2px] bg-slate-900" />
          </motion.div>

          {/* 2x2 Grid */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Card 1: Hardware Reverse Engineering */}
            <motion.div variants={cardFadeIn} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-8 hover:bg-white hover:shadow-[0_15px_40px_rgba(15,23,42,0.05)] transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Hardware Reverse Engineering</h3>
                  <p className="text-xs text-slate-400">하드웨어 역공학</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm md:text-base text-slate-800 font-medium">
                  We dissect the internal architecture of hardware systems. From verifying internal logic to component-level precision analysis, we reveal how systems truly operate.
                </p>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  하드웨어 시스템의 내부 구조를 깊이 들여다봅니다. 내부 로직을 확인하는 것부터 부품 단위의 정밀 분석까지, 시스템이 실제로 어떻게 작동하는지 밝혀냅니다.
                </p>
              </div>
            </motion.div>

            {/* Card 2: Side-Channel Analysis & Fault Injection */}
            <motion.div variants={cardFadeIn} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-8 hover:bg-white hover:shadow-[0_15px_40px_rgba(15,23,42,0.05)] transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Side-Channel Analysis & Fault Injection</h3>
                  <p className="text-xs text-slate-400">부채널 및 결함 주입 공격</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm md:text-base text-slate-800 font-medium">
                  We induce micro-perturbations or capture side-channel signals to bypass seemingly impenetrable security boundaries.
                </p>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  시스템에 미세한 자극을 주거나 흘러나오는 신호를 포착하여, 절대 뚫리지 않을 것 같은 보안 벽을 넘어섭니다.
                </p>
              </div>
            </motion.div>

            {/* Card 3: Wireless & RF Security */}
            <motion.div variants={cardFadeIn} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-8 hover:bg-white hover:shadow-[0_15px_40px_rgba(15,23,42,0.05)] transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Wireless & RF Security</h3>
                  <p className="text-xs text-slate-400">무선 및 RF 보안</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm md:text-base text-slate-800 font-medium">
                  We investigate wireless communication attack vectors, focusing on RF (Radio Frequency) protocols. By reverse engineering proprietary signals and analyzing OTA (Over-the-Air) transmissions, we verify vulnerabilities in wireless control systems.
                </p>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  RF(무선 주파수) 프로토콜을 비롯한 무선 통신에서의 공격 벡터를 탐색합니다. 고유 프로토콜을 역공학하고 무선(OTA) 전송 신호를 분석하여, 무선 제어 시스템에 존재하는 취약점을 실증합니다.
                </p>
              </div>
            </motion.div>

            {/* Card 4: Security Verification Tools */}
            <motion.div variants={cardFadeIn} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-8 hover:bg-white hover:shadow-[0_15px_40px_rgba(15,23,42,0.05)] transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900">Security Verification Tools</h3>
                  <p className="text-xs text-slate-400">보안성 검증 및 도구 개발</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm md:text-base text-slate-800 font-medium">
                  We do not wait for external tools to be built. By crafting custom security tools and conducting hands-on tests on live hardware, we ensure our security is practical and verifiable.
                </p>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  외부에서 도구가 만들어질 때까지 기다리지 않습니다. 자체적인 보안 도구를 제작하고 실제 시스템을 직접 테스트하며, 우리의 보안이 실질적이고 검증 가능한지 확인합니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Slide 3: Community Vision */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-24 z-10 border-t border-slate-200 bg-slate-50 relative">
        <div className="max-w-5xl mx-auto w-full space-y-16">
          {/* Header */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideUp}
            className="text-center space-y-4"
          >
            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400">Our Ecosystem</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900">
              Community Vision / <span className="text-slate-500 font-normal">커뮤니티 지향점</span>
            </h2>
            <div className="w-12 h-[2px] bg-slate-900 mx-auto" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-[0_15px_45px_rgba(15,23,42,0.03)] space-y-8 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 text-slate-800 mb-2">
              <Network className="w-6 h-6" />
              <span className="font-bold text-sm uppercase tracking-wider">Research Environment & Continuity</span>
            </div>
            
            <div className="space-y-6 text-left">
              {/* English First */}
              <div className="space-y-2">
                <p className="text-base md:text-lg text-slate-800 leading-relaxed font-medium">
                  Hardware security research requires specialized equipment and environments, which can be difficult for individual researchers to establish. Physical Lab is formed to provide these resources and foster technical exchanges. Rather than short-term project cohorts, we aim to build a daily research community where enthusiasts naturally share findings, inspire one another, and access environments that cannot be built alone.
                </p>
              </div>

              {/* Light Separator */}
              <div className="w-full h-[1px] bg-slate-100" />

              {/* Korean Second */}
              <div className="space-y-2">
                <p className="text-sm md:text-base text-slate-500 leading-relaxed">
                  하드웨어 보안 연구는 정밀 장비와 환경이 필요하여 개인 연구자가 독자적으로 구축하기 어렵습니다. Physical Lab은 이러한 연구 인프라를 제공하고 기술적 교류를 활성화하기 위해 구성되었습니다. 6개월씩 하는 단기 프로젝트성 모임이 아니라, 하드웨어를 좋아하는 사람들이 일상에서 자신의 연구 결과를 교류하며 서로에게 영감을 주고, 개인의 힘으로 구성할 수 없는 연구 환경을 제공할 수 있는 커뮤니티를 지향합니다.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Slide 4: Ideal Talent Profile */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-24 z-10 border-t border-slate-200 bg-white relative">
        <div className="max-w-5xl mx-auto w-full space-y-16">
          {/* Header */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideUp}
            className="text-center space-y-4"
          >
            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400">Collaboration</span>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900">
              Ideal Talent Profile / <span className="text-slate-500 font-normal">인재상</span>
            </h2>
            <div className="w-12 h-[2px] bg-slate-900 mx-auto" />
          </motion.div>

          {/* 5 Row Elements with Stagger */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="space-y-6"
          >
            {/* Trait 1 */}
            <motion.div variants={cardFadeIn} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start md:items-center gap-4">
                <span className="text-2xl font-bold text-slate-300 font-mono group-hover:text-slate-800 transition-colors">01</span>
                <div className="p-2.5 rounded-xl bg-slate-200/50 text-slate-800">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-bold text-slate-900">
                    Passion for Hardware Hacking
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    하드웨어 해킹에 관심이 있는 사람
                  </p>
                  <p className="text-xs text-slate-400">
                    Individuals with a genuine interest in hardware hacking and physical layer reverse engineering.
                  </p>
                </div>
              </div>
              <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm mt-4 md:mt-0">Passion</span>
            </motion.div>

            {/* Trait 2 */}
            <motion.div variants={cardFadeIn} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start md:items-center gap-4">
                <span className="text-2xl font-bold text-slate-300 font-mono group-hover:text-slate-800 transition-colors">02</span>
                <div className="p-2.5 rounded-xl bg-slate-200/50 text-slate-800">
                  <Target className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-bold text-slate-900">
                    Deep-Dive Experience
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    깊이 있는 몰입
                  </p>
                  <p className="text-xs text-slate-400">
                    Those who have experience diving deep into a topic of interest.
                  </p>
                </div>
              </div>
              <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm mt-4 md:mt-0">Focus</span>
            </motion.div>

            {/* Trait 3 */}
            <motion.div variants={cardFadeIn} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start md:items-center gap-4">
                <span className="text-2xl font-bold text-slate-300 font-mono group-hover:text-slate-800 transition-colors">03</span>
                <div className="p-2.5 rounded-xl bg-slate-200/50 text-slate-800">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-bold text-slate-900">
                    Continuous Self-Improvement
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    자율적 성장
                  </p>
                  <p className="text-xs text-slate-400">
                    Proactive learners who pursue self-improvement daily in a self-driven, non-coercive culture.
                  </p>
                </div>
              </div>
              <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm mt-4 md:mt-0">Growth</span>
            </motion.div>

            {/* Trait 4 */}
            <motion.div variants={cardFadeIn} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start md:items-center gap-4">
                <span className="text-2xl font-bold text-slate-300 font-mono group-hover:text-slate-800 transition-colors">04</span>
                <div className="p-2.5 rounded-xl bg-slate-200/50 text-slate-800">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-bold text-slate-900">
                    Courage to Share
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    공유와 개방
                  </p>
                  <p className="text-xs text-slate-400">
                    Brave creators willing to share their research, experiences, and failures openly.
                  </p>
                </div>
              </div>
              <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm mt-4 md:mt-0">Openness</span>
            </motion.div>

            {/* Trait 5 */}
            <motion.div variants={cardFadeIn} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-300 hover:bg-white hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-start md:items-center gap-4">
                <span className="text-2xl font-bold text-slate-300 font-mono group-hover:text-slate-800 transition-colors">05</span>
                <div className="p-2.5 rounded-xl bg-slate-200/50 text-slate-800">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base md:text-lg font-bold text-slate-900">
                    Community Fit
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    일상의 동료
                  </p>
                  <p className="text-xs text-slate-400">
                    Collaborative peers who seek daily community integration and fit smoothly with existing members.
                  </p>
                </div>
              </div>
              <span className="hidden md:inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm mt-4 md:mt-0">Harmony</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer / Call to Action */}
      <footer className="py-20 border-t border-slate-200 text-center relative z-10 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <Logo className="w-10 h-10 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-bold font-serif text-slate-800">PHYSICAL LAB</h3>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Physical Lab. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-xs text-slate-400 font-mono">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              HOME
            </Link>
            <span>•</span>
            <Link href="/blog" className="hover:text-slate-900 transition-colors">
              BLOG
            </Link>
            <span>•</span>
            <Link href="/notice" className="hover:text-slate-900 transition-colors">
              NOTICES
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
