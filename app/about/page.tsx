import Link from "next/link";
import { ArrowRight, Cpu, Zap, Radio, Wrench, Flame, Target, TrendingUp, Share2, Users } from "lucide-react";

const RESEARCH_AREAS = [
    {
        icon: Cpu,
        title: "Hardware Reverse Engineering",
        titleKo: "하드웨어 역공학",
        body: "We dissect the internal architecture of hardware systems. From verifying internal logic to component-level precision analysis, we reveal how systems truly operate.",
        bodyKo: "하드웨어 시스템의 내부 구조를 깊이 들여다봅니다. 내부 로직을 확인하는 것부터 부품 단위의 정밀 분석까지, 시스템이 실제로 어떻게 작동하는지 밝혀냅니다.",
    },
    {
        icon: Zap,
        title: "Side-Channel Analysis & Fault Injection",
        titleKo: "부채널 및 결함 주입 공격",
        body: "We induce micro-perturbations or capture side-channel signals to bypass seemingly impenetrable security boundaries.",
        bodyKo: "시스템에 미세한 자극을 주거나 흘러나오는 신호를 포착하여, 절대 뚫리지 않을 것 같은 보안 벽을 넘어섭니다.",
    },
    {
        icon: Radio,
        title: "Wireless & RF Security",
        titleKo: "무선 및 RF 보안",
        body: "We investigate wireless communication attack vectors, focusing on RF (Radio Frequency) protocols. By reverse engineering proprietary signals and analyzing OTA (Over-the-Air) transmissions, we verify vulnerabilities in wireless control systems.",
        bodyKo: "RF(무선 주파수) 프로토콜을 비롯한 무선 통신에서의 공격 벡터를 탐색합니다. 고유 프로토콜을 역공학하고 무선(OTA) 전송 신호를 분석하여, 무선 제어 시스템에 존재하는 취약점을 실증합니다.",
    },
    {
        icon: Wrench,
        title: "Security Verification Tools",
        titleKo: "보안성 검증 및 도구 개발",
        body: "We do not wait for external tools to be built. By crafting custom security tools and conducting hands-on tests on live hardware, we ensure our security is practical and verifiable.",
        bodyKo: "외부에서 도구가 만들어질 때까지 기다리지 않습니다. 자체적인 보안 도구를 제작하고 실제 시스템을 직접 테스트하며, 우리의 보안이 실질적이고 검증 가능한지 확인합니다.",
    },
];

const TRAITS = [
    {
        icon: Flame,
        title: "Passion for Hardware Hacking",
        titleKo: "하드웨어 해킹에 관심이 있는 사람",
        body: "Individuals with a genuine interest in hardware hacking and physical layer reverse engineering.",
    },
    {
        icon: Target,
        title: "Deep-Dive Experience",
        titleKo: "깊이 있는 몰입",
        body: "Those who have experience diving deep into a topic of interest.",
    },
    {
        icon: TrendingUp,
        title: "Continuous Self-Improvement",
        titleKo: "자율적 성장",
        body: "Proactive learners who pursue self-improvement daily in a self-driven, non-coercive culture.",
    },
    {
        icon: Share2,
        title: "Courage to Share",
        titleKo: "공유와 개방",
        body: "Brave creators willing to share their research, experiences, and failures openly.",
    },
    {
        icon: Users,
        title: "Community Fit",
        titleKo: "일상의 동료",
        body: "Collaborative peers who seek daily community integration and fit smoothly with existing members.",
    },
];

function SectionHeader({ title, meta }: { title: string; meta: string }) {
    return (
        <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-8 flex items-center justify-between font-sans">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
                <span className="w-2 h-2 rounded-full bg-foreground" />
                {title}
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-widest">{meta}</span>
        </div>
    );
}

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-8xl font-eczar mb-4 tracking-tight text-center">ABOUT</h1>
                <p className="text-center text-xs font-sans uppercase tracking-[0.2em] text-gray-400 mb-16">
                    Defining the Frontiers of the Physical Layer
                </p>

                {/* Mission */}
                <section className="mb-20">
                    <SectionHeader title="Mission" meta="우리의 지향" />
                    <div className="text-lg md:text-xl leading-loose text-gray-700 dark:text-gray-300 space-y-6">
                        <p>
                            Physical Lab is a collective of researchers, engineers, and hackers dedicated to
                            exploring the hidden phenomena within hardware and physical systems. In an era where
                            everything is hyper-connected, we believe the physical layer is the frontline where
                            security succeeds or fails, and the final frontier where true innovation begins.
                        </p>
                        <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700" />
                        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                            Physical Lab은 하드웨어와 물리 시스템 속에 숨겨진 다양한 현상을 탐구하는 연구원,
                            엔지니어, 해커들의 공동체입니다. 모든 것이 긴밀하게 연결된 오늘날, 우리는
                            &lsquo;물리 계층(Physical Layer)&rsquo;이야말로 보안의 성패가 결정되는 최전선이자,
                            진정한 혁신이 시작되는 마지막 개척지라고 믿습니다.
                        </p>
                    </div>
                </section>

                {/* Research Areas */}
                <section className="mb-20">
                    <SectionHeader title="Research Areas" meta="주요 연구 분야" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {RESEARCH_AREAS.map((area) => (
                            <div
                                key={area.title}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <area.icon className="w-5 h-5 mt-1 shrink-0 text-gray-400" />
                                    <div>
                                        <h3 className="text-lg font-bold leading-snug">{area.title}</h3>
                                        <p className="text-xs font-sans uppercase tracking-widest text-gray-400 mt-1">
                                            {area.titleKo}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {area.body}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-3">
                                    {area.bodyKo}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Community Vision */}
                <section className="mb-20">
                    <SectionHeader title="Community Vision" meta="커뮤니티 지향점" />
                    <div className="text-lg md:text-xl leading-loose text-gray-700 dark:text-gray-300 space-y-6">
                        <p>
                            Hardware security research requires specialized equipment and environments, which can be
                            difficult for individual researchers to establish. Physical Lab is formed to provide these
                            resources and foster technical exchanges. Rather than short-term project cohorts, we aim to
                            build a daily research community where enthusiasts naturally share findings, inspire one
                            another, and access environments that cannot be built alone.
                        </p>
                        <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-700" />
                        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                            하드웨어 보안 연구는 정밀 장비와 환경이 필요하여 개인 연구자가 독자적으로 구축하기
                            어렵습니다. Physical Lab은 이러한 연구 인프라를 제공하고 기술적 교류를 활성화하기 위해
                            구성되었습니다. 6개월씩 하는 단기 프로젝트성 모임이 아니라, 하드웨어를 좋아하는 사람들이
                            일상에서 자신의 연구 결과를 교류하며 서로에게 영감을 주고, 개인의 힘으로 구성할 수 없는
                            연구 환경을 제공할 수 있는 커뮤니티를 지향합니다.
                        </p>
                    </div>
                </section>

                {/* Ideal Talent Profile */}
                <section className="mb-20">
                    <SectionHeader title="Ideal Talent Profile" meta="인재상" />
                    <div className="space-y-8">
                        {TRAITS.map((trait, index) => (
                            <div
                                key={trait.title}
                                className="flex flex-col md:flex-row gap-2 md:gap-8 items-start group"
                            >
                                <span className="text-lg font-mono font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap group-hover:text-foreground transition-colors">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <trait.icon className="w-4 h-4 text-gray-400" />
                                        {trait.title}
                                    </h3>
                                    <p className="text-xs font-sans uppercase tracking-widest text-gray-400 mt-1">
                                        {trait.titleKo}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                                        {trait.body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Call to Action */}
                <div className="text-center">
                    <Link
                        href="/member"
                        className="inline-flex items-center text-lg uppercase tracking-widest border-b border-black dark:border-white pb-1 hover:pb-2 transition-all"
                    >
                        Meet the Members <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </div>
            </div>
        </main>
    );
}
