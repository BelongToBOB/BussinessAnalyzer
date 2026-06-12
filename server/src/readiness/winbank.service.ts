import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

const ANALYZE_PROMPT = `คุณคือ RM WinBank — ผู้เชี่ยวชาญสินเชื่อ SME จากธนาคารชั้นนำ มีประสบการณ์ 15 ปี
อ่านข้อมูล Business MRI แล้ววิเคราะห์จากมุมมอง RM จริงๆ — เปิดแผล ไม่รักษาแผล

เกณฑ์ตัดสิน:
DSCR: ดี>=1.5 | พอใช้ 1.25-1.5 | ต่ำ<1.25 | ไม่มีหนี้=ดี
D/E: ดี<=2 | สูง 2-3 | สูงเกิน>3 | ไม่มีหนี้=ดี
EBITDA Margin: ดี>=15% | บาง 8-15% | ต่ำ<8%
Gross Margin: ดี>=30% | บาง 15-30% | ต่ำ<15%
Current Ratio: ดี>=1.5 | พอใช้ 1.0-1.5 | ต่ำ<1.0
Growth Cash: บวก=ดี | ลบ=รั่ว

4 กลุ่มความพร้อม:
STRONG — ตัวเลขพร้อม จัดแพ็กเกจให้ถูก
READY — พร้อมขยาย วางโครงสร้างวงเงิน
DEVELOPING — เคลียร์งบ/หนี้/กระแสเงินสดก่อน
NEEDS_WORK — ปรับฐานก่อน ยังไม่ควรกู้เพิ่ม

ตอบเป็น JSON เท่านั้น (ไม่มี markdown) กระชับ แต่ละ string ไม่เกิน 80 ตัวอักษร:
{
  "businessSummary": {
    "headline": "สรุป 1 บรรทัด",
    "overallVerdict": "STRONG|READY|DEVELOPING|NEEDS_WORK",
    "verdictThai": "อธิบาย 2-3 ประโยค",
    "keyStrengths": ["จุดแข็ง 3-5 ข้อ อ้างอิงตัวเลข"],
    "keyWeaknesses": ["จุดอ่อน 3-5 ข้อ อ้างอิงตัวเลข"],
    "frsScore": 75,
    "frsBand": "เกือบพร้อม",
    "financialSnapshot": {"ebitda":"...","dscr":"...","deRatio":"...","recommendedLoan":"..."}
  },
  "actionItems": {
    "critical": [{"title":"...","detail":"...","timeline":"...","impact":"..."}],
    "important": [{"title":"...","detail":"...","timeline":"...","impact":"..."}],
    "documents": ["เอกสารที่ต้องเตรียม"],
    "financialFixes": ["สิ่งที่ต้องปรับ"]
  },
  "bankPerspective": {
    "firstImpression": "RM คิดอะไรเมื่อเห็นไฟล์นี้",
    "whatBankLikes": ["ธนาคารชอบ 3-5 ข้อ"],
    "whatBankWorries": ["ธนาคารกังวล 3-5 ข้อ"],
    "approvalOdds": "HIGH|MEDIUM|LOW",
    "approvalOddsThai": "อธิบาย 1 ประโยค",
    "rmAdvice": "คำแนะนำ 3-5 ประโยค",
    "negotiationTips": ["เทคนิคต่อรอง 3-5 ข้อ"],
    "redFlags": ["Red flags ที่ธนาคารจะถาม"]
  }
}

กฎ:
- อ้างอิงตัวเลขจริงเสมอ
- ประเมินตามจริง ไม่อวย ไม่ soften
- ภาษาไทย (ศัพท์อังกฤษมีไทยกำกับ)
- ห้ามใส่เครื่องหมาย " ในค่า string (ใช้ ' แทน)
- ถ้าข้อมูลไม่ครบ ให้ระบุในจุดอ่อน
- คะแนนต่ำ: frame ว่าแก้ได้ ไม่ใช่คำตัดสิน`;

const CHAT_PROMPT = `คุณคือ RM WinBank — ผู้เชี่ยวชาญสินเชื่อ SME
ตอบคำถามเกี่ยวกับธุรกิจนี้จากข้อมูลที่ให้มา อ้างอิงตัวเลขจริง
ตอบภาษาไทย กระชับ ตรงประเด็น`;

@Injectable()
export class WinBankService {
  private anthropic: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) this.anthropic = new Anthropic({ apiKey });
  }

  private async getAssessmentContext(userId: string, assessmentId: string): Promise<string> {
    const assessment = await this.prisma.rdAssessment.findUnique({
      where: { id: assessmentId },
      include: { business: true },
    });
    if (!assessment || assessment.business.userId !== userId) throw new Error('Assessment not found');

    const [s1, s2Rows, s2h, s3sum, s4, s5, scores] = await Promise.all([
      this.prisma.rdS1Mindset.findUnique({ where: { assessmentId } }),
      this.prisma.rdS2Financial.findMany({ where: { assessmentId }, orderBy: { fiscalYear: 'asc' } }),
      this.prisma.rdS2Health.findUnique({ where: { assessmentId } }),
      this.prisma.rdS3Summary.findUnique({ where: { assessmentId } }),
      this.prisma.rdS4Loan.findUnique({ where: { assessmentId } }),
      this.prisma.rdS5Plan.findUnique({ where: { assessmentId } }),
      this.prisma.rdReadinessScore.findUnique({ where: { assessmentId } }),
    ]);

    return JSON.stringify({
      business: { name: assessment.business.name },
      s1_mindset: s1 ? { ownerMindsetScore: s1.ownerMindsetScore, readiness: s1.readiness, verdict: s1.verdict, leverageChoice: s1.leverageChoice } : null,
      s2_financials: s2Rows.map(r => ({ fiscalYear: r.fiscalYear, revenue: r.revenue, ebitda: r.ebitda, netProfit: r.netProfit, totalLiabilities: r.totalLiabilities, equity: r.equity, annualDebtService: r.annualDebtService })),
      s2_health: s2h ? { healthScore: s2h.healthScore, status: s2h.status, redFlags: s2h.redFlags } : null,
      s3_cashflow: s3sum ? { avgMonthlySales: s3sum.avgMonthlySales, avgRealCash: s3sum.avgRealCash, avgGrowth: s3sum.avgGrowth, stabilityScore: s3sum.stabilityScore, trend: s3sum.trend, warnings: s3sum.warnings } : null,
      s4_loan: s4 ? { recommendedAmount: s4.recommendedAmount, dscrBefore: s4.dscrBefore, dscrAfter: s4.dscrAfter, capacityScore: s4.capacityScore, verdict: s4.verdict } : null,
      s5_plan: s5 ? { loanReadinessScore: s5.loanReadinessScore, planCompleteness: s5.planCompleteness } : null,
      readinessScores: scores ? { compositeFrs: scores.compositeFrs, frsBand: scores.frsBand, frsProfile: scores.frsProfile, mindsetScore: scores.mindsetScore, healthScore: scores.healthScore, stabilityScore: scores.stabilityScore, capacityScore: scores.capacityScore, bankReadinessScore: scores.bankReadinessScore } : null,
    }, null, 0);
  }

  async analyze(userId: string, assessmentId: string) {
    if (!this.anthropic) throw new Error('AI ยังไม่พร้อม — ตั้งค่า ANTHROPIC_API_KEY');

    try {
      const context = await this.getAssessmentContext(userId, assessmentId);
      console.log('[WinBank] Analyzing assessment:', assessmentId, 'context length:', context.length);

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: ANALYZE_PROMPT,
        messages: [
          { role: 'user', content: `ข้อมูล Business MRI:\n${context}\n\nวิเคราะห์และตอบเป็น JSON เท่านั้น กระชับ แต่ละ string ไม่เกิน 100 ตัวอักษร ห้ามใส่เครื่องหมาย " ในค่า string` },
          { role: 'assistant', content: '{' },
        ],
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
      const text = '{' + rawText; // prepend { from prefill
      console.log('[WinBank] AI response length:', text.length);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[WinBank] No JSON found in response:', text.slice(0, 200));
        throw new Error('AI ตอบไม่อยู่ในรูปแบบ JSON');
      }

      // Robust JSON extraction — handle unescaped quotes in Thai text
      let jsonStr = jsonMatch[0];

      // Try direct parse first
      try {
        const parsed = JSON.parse(jsonStr);
        await this.saveAnalysis(assessmentId, parsed);
        return parsed;
      } catch {}

      // Fix common issues
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/\n/g, '\\n');

      try {
        const parsed = JSON.parse(jsonStr);
        await this.saveAnalysis(assessmentId, parsed);
        return parsed;
      } catch {}

      // Last resort: use eval-safe parsing with Function
      console.error('[WinBank] Standard parse failed, trying relaxed parse...');
      try {
        // Replace problematic unescaped quotes inside strings
        // by finding JSON structure boundaries
        const fn = new Function('return (' + jsonStr + ')');
        const parsed = fn();
        await this.saveAnalysis(assessmentId, parsed);
        return parsed;
      } catch (finalErr: any) {
        console.error('[WinBank] All parse attempts failed:', finalErr.message);
        // Write raw to temp file for debugging
      require('fs').writeFileSync('/tmp/winbank-raw.json', jsonStr);
      console.error('[WinBank] Raw saved to /tmp/winbank-raw.json');
        throw new Error('AI ตอบ JSON ไม่สมบูรณ์ — กรุณาลองใหม่');
      }
    } catch (err: any) {
      console.error('[WinBank] Error:', err.message, err.status ?? '', err.error?.message ?? '');
      throw err;
    }
  }

  async chat(userId: string, assessmentId: string, message: string, history: { role: string; content: string }[]) {
    if (!this.anthropic) throw new Error('AI ยังไม่พร้อม — ตั้งค่า ANTHROPIC_API_KEY');

    const context = await this.getAssessmentContext(userId, assessmentId);

    const messages = [
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ];

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `${CHAT_PROMPT}\n\nข้อมูลธุรกิจ:\n${context}`,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return { reply };
  }

  // ─── Save / Load Analysis ───────────────────────────────

  private async saveAnalysis(assessmentId: string, data: any) {
    await this.prisma.rdReport.create({
      data: {
        assessmentId,
        type: 'winbank',
        format: 'json',
        content: JSON.stringify(data),
      },
    });
  }

  async getLatestAnalysis(userId: string, assessmentId: string) {
    // Verify ownership
    const assessment = await this.prisma.rdAssessment.findUnique({
      where: { id: assessmentId },
      include: { business: true },
    });
    if (!assessment || assessment.business.userId !== userId) return null;

    const report = await this.prisma.rdReport.findFirst({
      where: { assessmentId, type: 'winbank' },
      orderBy: { generatedAt: 'desc' },
    });
    if (!report?.content) return null;
    return { analysis: JSON.parse(report.content), generatedAt: report.generatedAt };
  }

  async listAnalyses(userId: string, assessmentId: string) {
    const assessment = await this.prisma.rdAssessment.findUnique({
      where: { id: assessmentId },
      include: { business: true },
    });
    if (!assessment || assessment.business.userId !== userId) return [];

    return this.prisma.rdReport.findMany({
      where: { assessmentId, type: 'winbank' },
      orderBy: { generatedAt: 'desc' },
      select: { id: true, generatedAt: true },
      take: 10,
    });
  }
}
