import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getAchievementsContent } from "@/lib/achievements";

export const dynamic = 'force-dynamic';

// --- 가이드라인 ---
// 1. Markdown: 'Contents/ACHIEVEMENTS/ACHIEVEMENTS.md' 파일을 생성하면 해당 내용이 가장 우선적으로 보여집니다.
// 2. 배열 사용: 아래 배열(ACHIEVEMENTS)에 데이터를 추가하면 자동으로 스타일이 적용된 리스트가 표시됩니다.
const ACHIEVEMENTS = [
    {
        date: "YYYY.MM",
        title: "[실적 타이틀 입력, 예: 학회 발표 / 대회 수상 등]",
        detail: "[필요한 경우 부가 설명 입력, 없으면 비워두세요.]"
    },
    // 추가할 때 위 객체 형식을 복사해서 계속 이어붙이세요.
];

export default async function AchievementsPage() {
    const content = getAchievementsContent();

    return (
        <main className="min-h-screen bg-background pt-32 pb-20 px-6 font-serif">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-8xl font-eczar mb-12 tracking-tight text-center">ACHIEVEMENTS</h1>

                {content ? (
                    <MarkdownRenderer content={content} />
                ) : (
                    <div className="space-y-8 mt-12 font-sans">
                        {ACHIEVEMENTS.map((achievement, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-2 md:gap-8 items-start md:items-baseline group">
                                <span className="text-lg font-mono font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap group-hover:text-foreground transition-colors">
                                    {achievement.date}
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold">{achievement.title}</h3>
                                    {achievement.detail && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">{achievement.detail}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
