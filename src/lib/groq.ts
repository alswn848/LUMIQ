import type { AISkinResult, SkinTypeValue } from '../types'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `
당신은 15년 이상 경력의 한국 피부과 전문의이자 코스메틱 더마톨로지 전문가입니다.
사용자의 피부 고민 텍스트와 사진을 종합 분석하여 정확한 피부 타입을 진단하고, 근거 기반의 맞춤형 스킨케어 루틴을 처방합니다.

## 언어 규칙 (절대 위반 금지)
- 오직 한글만 사용할 것
- 한자(漢字) 사용 완전 금지: 水分, 油分, 皮膚 같은 표기 절대 금지
- 일본어(ひらがな·カタカナ), 중국어 사용 완전 금지
- 성분명은 반드시 한글 통용명으로 표기: 히알루론산(O), 나이아신아마이드(O), 세라마이드(O)
- 영어 성분명도 한글 발음 변환 필수

## 진단 사고 과정 (Chain-of-Thought)
진단 시 반드시 아래 순서로 분석하라:
1. 사용자가 언급한 증상을 부위별(이마·코·볼·턱)로 분류
2. 유·수분 밸런스 패턴 파악 (번들거림 여부, 당김 여부, 각질 여부)
3. 민감도 평가 (자극 반응, 홍조, 따가움, 트러블 빈도)
4. 사진이 있다면: 모공 크기·분포, 피부 결, 광택 여부, 붉음 여부를 관찰
5. 텍스트 증상과 사진 관찰을 교차 검증하여 최종 타입 결정
6. 진단 확신도가 낮으면 복합 타입(예: 복합성+민감성)을 선택

## 피부 타입 세부 진단 기준

### 악건성
- 하루 종일 심한 당김과 불편함
- 세안 직후 피부가 극도로 조여드는 느낌
- 눈가·입가·볼에 고정각질, 피부가 얇고 투명해 보임
- 보습제 발라도 수분감이 빠르게 사라짐
- 피부 장벽 손상 지표: 트러블 없어도 쉽게 자극받음

### 건성
- 하루 중 여러 번 당김 또는 뻑뻑한 느낌
- 간헐적 각질, 세안 후 건조감 지속
- 유분 과잉 없음, 모공이 거의 보이지 않음
- 화장이 들뜨거나 각질에 묻어남

### 수부지 (수분부족 지성)
- 세안 직후엔 당기지만 시간이 지나면 번들거림
- T존 및 전체에 유분, 그러나 속은 건조한 느낌
- 수분 부족으로 피지 과잉 분비 → 트러블로 이어지기 쉬움
- 보습제를 바르면 번들거림이 줄어드는 특성

### 복합성
- T존(이마·코)은 유분·모공 확장, U존(볼·턱)은 건조·당김
- 부위별 피부 컨디션 차이가 명확
- 세안 후 T존은 금방 번들, 볼은 건조 유지

### 지성
- 하루 종일 전체적 번들거림
- 모공이 눈에 띄게 넓고, 블랙헤드·화이트헤드 동반
- 피지 과잉으로 메이크업 무너짐 잦음
- 트러블(여드름·뾰루지)이 주기적으로 발생

### 민감성
- 외부 자극(바람·온도변화·새 제품)에 즉각 반응
- 홍조, 열감, 따가움, 가려움 중 2가지 이상
- 피부 자체는 건성~복합성일 수 있으나 반응성이 핵심
- 특정 성분(알코올·향료·방부제)에 예민

### 복합성+민감성
- T존 유분 + U존 건조 + 자극 반응 과민
- 제품 선택 시 진정과 밸런스 모두 고려 필요

### 건성+민감성
- 건조한 피부에 자극 반응까지 동반
- 피부 장벽이 약해 보습과 진정이 최우선

## 사진 분석 가이드 (이미지가 있을 때)
- 이마: 광택 여부, 모공 크기, 각질 흔적
- 코: 모공 확장, 블랙헤드, 피지 과잉 여부
- 볼: 건조함·각질·홍조·예민 여부
- 턱·턱선: 트러블, 모공, 유분 여부
- 전반적 피부 결: 매끄러움 vs 거침, 두께감

## 출력 규칙
1. 반드시 순수 JSON만 출력 (마크다운 코드블록·설명 텍스트 절대 금지)
2. 모든 텍스트 값은 한글로만 작성 (한자·일본어·중국어 한 글자도 포함 금지)
3. reason 필드: 사용자가 직접 언급한 증상을 1개 이상 인용하여 구체적으로 작성
4. 성분명 예시: 히알루론산, 나이아신아마이드, 세라마이드, 판테놀, 알란토인, 레티놀, 트레티노인, 아젤라산, 베타글루칸, 마데카소사이드, 센텔라아시아티카 추출물
`

const buildUserPrompt = (
  userInput: string,
  hasImage: boolean,
  repeatSkinType: SkinTypeValue | null,
  repeatCount: number
) => {
  const repeatSection = repeatSkinType && repeatCount >= 3
    ? `
## 반복 진단 정보
이 사용자는 최근 ${repeatCount}회 연속으로 "${repeatSkinType}" 피부로 진단되었습니다.
꾸준히 스킨케어를 관리했음에도 동일한 피부 타입이 반복되고 있습니다.
이 경우 clinicTreatments 필드에 이 피부 타입에 적합한 피부과 시술 3가지를 반드시 추천해주세요.
clinicMessage도 반드시 포함해주세요.
`
    : ''

  return `
${hasImage ? `[사진 분석 요청]
첨부된 사진으로 피부 상태를 분석하라. 판단이 어려운 부분은 텍스트 고민을 우선 참고하여 분석을 계속 진행하라.

아래 두 가지 경우에만 분석을 중단하고 { "imageError": "한국어로 문제 설명 및 재촬영 안내" } 만 반환하라:
1. 사람 얼굴이 전혀 없는 사진 (사물·동물·배경만 있는 경우)
2. 극심한 블러·완전 암흑·완전 과노출로 사진 자체를 전혀 식별할 수 없는 경우

그 외 모든 경우(얼굴이 작거나, 일부 잘리거나, 약간 어둡거나, 마스크 착용 등)는 보이는 부위를 최대한 관찰하여 분석을 진행하라.

사진 관찰 시 이마·코·볼·턱 각 부위의 광택·모공·각질·붉음·트러블을 가능한 만큼 관찰하고 진단에 반영하라.` : '[텍스트 전용 진단] 사진 없이 텍스트만으로 진단합니다. 사용자가 언급한 증상의 부위·빈도·강도를 최대한 분석하세요.'}
${repeatSection}

## 사용자 피부 고민
${userInput}

---

위 고민을 아래 분석 순서로 검토한 뒤, 최종적으로 JSON만 출력하세요.

[분석 순서]
1. 언급된 증상을 부위별로 분류 (이마/코/볼/턱/전체)
2. 유분·수분·민감도 패턴 파악
3. ${hasImage ? '사진에서 관찰된 이마·코·볼·턱 부위별 피부 상태와 텍스트 증상 교차 검증' : '텍스트 증상 강도 및 빈도 평가'}
4. 가장 가능성 높은 피부 타입 결정 (확신도 낮으면 복합 타입 선택)
5. 해당 피부 타입에 최적화된 성분·루틴·생활 습관 도출

[JSON 출력 형식 — 이 형식 그대로 순수 JSON만 반환]
{
  "skinType": "악건성 또는 건성 또는 수부지 또는 복합성 또는 지성 또는 민감성 또는 복합성+민감성 또는 건성+민감성 중 정확히 하나",
  "reason": "사용자가 직접 언급한 증상(예: '이마가 번들거린다', '볼이 당긴다')을 1개 이상 구체적으로 인용하며, ${hasImage ? '사진에서 관찰된 피부 상태를 함께 언급하여 ' : ''}진단 근거를 3-4문장으로 서술. 왜 이 피부 타입인지 논리적으로 설명할 것.",
  "characteristics": [
    "이 피부 타입에서 나타나는 핵심 특징 — 구체적 증상 포함 (한국어)",
    "두 번째 특징 — 다른 피부 타입과 구별되는 점 포함",
    "세 번째 특징 — 계절·환경 변화 시 나타나는 반응 포함",
    "네 번째 특징 — 스킨케어 제품 사용 시 반응 패턴",
    "다섯 번째 특징 — 장기적 피부 트러블 또는 노화 관련 주의사항"
  ],
  "recommendedIngredients": [
    { "name": "1순위 핵심 성분명 (한국어 통용명)", "reason": "이 피부의 가장 큰 문제를 해결하는 구체적 기전 설명" },
    { "name": "2순위 성분명", "reason": "구체적 효과와 이 피부 타입에 적합한 이유" },
    { "name": "3순위 성분명", "reason": "구체적 효과" },
    { "name": "4순위 성분명", "reason": "구체적 효과" },
    { "name": "5순위 성분명", "reason": "구체적 효과" },
    { "name": "6순위 성분명", "reason": "구체적 효과" }
  ],
  "warnings": [
    "가장 위험한 성분 — 왜 피해야 하는지 이유 포함 (한국어)",
    "두 번째 주의 성분 — 이유 포함",
    "세 번째 주의 성분 — 이유 포함",
    "네 번째 주의 성분 — 이유 포함",
    "다섯 번째 주의 성분 또는 제형 타입 — 이유 포함"
  ],
  "morningRoutine": [
    {
      "step": 1,
      "name": "아침 클렌징",
      "product": "이 피부 타입에 맞는 아침 클렌저 (예: 물 세안, 저자극 폼 클렌저, 밀크 클렌저)",
      "description": "아침 세안 방법과 주의사항 — 과세안 금지, 물 온도, 마사지 강도 포함",
      "tip": "이 피부 타입의 아침 세안 전용 실전 팁"
    },
    {
      "step": 2,
      "name": "토너",
      "product": "아침용 추천 토너 제형 (예: 수분 토너, 진정 토너, pH 조절 토너)",
      "description": "아침 토너 사용법과 선택 기준 — 핵심 성분 기준 포함",
      "tip": "코튼패드 vs 손으로 바르기, 흡수 방법 팁"
    },
    {
      "step": 3,
      "name": "세럼/에센스",
      "product": "이 피부 아침용 세럼 타입 (예: 수분 세럼, 진정 세럼, 비타민C 세럼)",
      "description": "아침에 적합한 성분과 기대 효과 — 빛·산화 안정성 고려",
      "tip": "아침에 적합한 세럼 성분과 레이어링 순서 팁"
    },
    {
      "step": 4,
      "name": "수분크림",
      "product": "아침용 크림 질감 (예: 라이트 젤 크림, 수분 크림, 배리어 크림)",
      "description": "아침 보습 방법과 흡수시키는 법 — 적정 사용량 포함",
      "tip": "T존·U존 구분 사용 및 메이크업 전 흡수 팁"
    },
    {
      "step": 5,
      "name": "선크림",
      "product": "이 피부 타입에 최적인 선크림 타입 (예: 무기자차 톤업, 유기자차 워터리 타입)",
      "description": "SPF·PA 기준과 제형 선택법 — 민감성 여부 고려",
      "tip": "덧바르기 방법과 계절별 선크림 교체 기준"
    }
  ],
  "nightRoutine": [
    {
      "step": 1,
      "name": "더블 클렌징",
      "product": "이 피부 타입에 맞는 1단계 클렌저 (예: 클렌징 오일, 클렌징 밤, 마이셀라 워터)",
      "description": "메이크업·선크림 제거 방법 — 피부 타입별 클렌징 오일 선택 기준 포함",
      "tip": "더블 클렌징 필요 여부 판단 기준 및 피부 자극 최소화 팁"
    },
    {
      "step": 2,
      "name": "폼 클렌저",
      "product": "이 피부 타입에 맞는 2단계 폼 클렌저 (예: 저자극 젤 클렌저, 크림 클렌저)",
      "description": "저녁 세안 방법 — 잔여물 제거 포인트와 물 온도 포함",
      "tip": "저녁 세안 시 흔한 실수와 피부 장벽 보호 팁"
    },
    {
      "step": 3,
      "name": "토너",
      "product": "저녁용 토너 (예: 각질 제거 토너, 진정 토너, 수분 토너)",
      "description": "저녁 토너의 역할 — 각질 케어 또는 진정·수분 보충 목적 설명",
      "tip": "이 피부 타입에 저녁 토너로 AHA/BHA 사용 여부 안내"
    },
    {
      "step": 4,
      "name": "트리트먼트 세럼",
      "product": "이 피부 타입 저녁용 집중 세럼 (예: 레티놀 세럼, 나이아신아마이드 세럼, 진정 세럼)",
      "description": "저녁에만 사용하는 기능성 성분과 적정 농도 — 피부 재생 목적 설명",
      "tip": "레티놀 등 자극성 성분의 도입 주기와 초보자 사용법"
    },
    {
      "step": 5,
      "name": "나이트 크림",
      "product": "이 피부 타입 저녁용 크림 (예: 리치 크림, 수면팩, 배리어 크림)",
      "description": "수면 중 피부 재생을 돕는 보습 방법 — 적정 사용량과 바르는 순서 포함",
      "tip": "슬리핑 마스크 vs 나이트 크림 선택 기준 및 이 피부 타입 추천"
    }
  ],
  "lifestyle": [
    "식단 관련 조언 — 이 피부 타입에 좋은 음식과 피해야 할 음식 구체적으로 (한국어)",
    "수면·스트레스 관리 조언 — 피부에 미치는 영향과 개선 방법",
    "생활 환경 조언 — 실내 습도, 세면대 청결, 베개 교체 주기 등",
    "운동·땀 관리 조언 — 운동 후 피부 관리 방법"
  ]${repeatSkinType && repeatCount >= 3 ? `,
  "clinicMessage": "${repeatCount}회 연속 동일한 피부 타입이 진단되었어요. 꾸준한 관리에도 변화가 없다면 피부과 전문의의 직접 진료를 통해 보다 정밀한 치료를 받아보시길 권장드려요.",
  "clinicTreatments": [
    {
      "name": "이 피부 타입에 가장 효과적인 시술명 (한국어)",
      "description": "시술의 원리와 과정 설명 — 어떤 장비·방법을 사용하는지 포함",
      "effect": "이 피부 타입의 핵심 문제를 개선하는 구체적 효과",
      "frequency": "권장 시술 주기 (예: 4주에 1회, 초기 3회 후 유지)",
      "caution": "시술 전후 주의사항과 부작용 가능성"
    },
    {
      "name": "두 번째 추천 시술명",
      "description": "시술 설명",
      "effect": "기대 효과",
      "frequency": "권장 주기",
      "caution": "주의사항"
    },
    {
      "name": "세 번째 추천 시술명",
      "description": "시술 설명",
      "effect": "기대 효과",
      "frequency": "권장 주기",
      "caution": "주의사항"
    }
  ]` : ''}
}
`
}

// 한자·일본어·중국어 문자 제거 (한글만 남김)
function removeNonKoreanCJK(value: unknown): unknown {
  if (typeof value === 'string') {
    // CJK Unified Ideographs, CJK Extension A/B, Hiragana, Katakana 제거
    return value.replace(/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uF900-\uFAFF]/g, '').trim()
  }
  if (Array.isArray(value)) return value.map(removeNonKoreanCJK)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, removeNonKoreanCJK(v)])
    )
  }
  return value
}

// 이미지 파일 → base64 변환
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 반복 진단 여부 확인 (최근 진단 3개 이상 동일 피부 타입)
export function checkRepeatDiagnosis(
  recentSkinTypes: SkinTypeValue[]
): { isRepeat: boolean; skinType: SkinTypeValue | null; count: number } {
  if (recentSkinTypes.length < 3) return { isRepeat: false, skinType: null, count: 0 }

  const latest = recentSkinTypes[0]
  const sameCount = recentSkinTypes.filter(t => t === latest).length

  return {
    isRepeat: sameCount >= 3,
    skinType: sameCount >= 3 ? latest : null,
    count: sameCount,
  }
}

type UserMessageContent =
  | string
  | Array<{ type: 'image_url'; image_url: { url: string } } | { type: 'text'; text: string }>

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

function parseAIResponse(text: string): AISkinResult {
  const tryParse = (jsonStr: string): AISkinResult => {
    const parsed = JSON.parse(jsonStr)
    if (parsed.imageError) throw new Error(parsed.imageError)
    return removeNonKoreanCJK(parsed) as AISkinResult
  }

  try {
    return tryParse(text.replace(/```json|```/g, '').trim())
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return tryParse(match[0])
      } catch (inner) {
        if (!(inner instanceof SyntaxError)) throw inner
      }
    }
    throw new Error('AI 응답 파싱 실패. 다시 시도해주세요.')
  }
}

export async function analyzeSkin(
  userInput: string,
  imageFile?: File | null,
  repeatSkinType?: SkinTypeValue | null,
  repeatCount?: number
): Promise<AISkinResult> {
  const hasImage = !!imageFile
  const userPrompt = buildUserPrompt(
    userInput,
    hasImage,
    repeatSkinType || null,
    repeatCount || 0
  )

  let userContent: UserMessageContent
  if (hasImage && imageFile) {
    const base64 = await fileToBase64(imageFile)
    const mimeType = imageFile.type || 'image/jpeg'
    userContent = [
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
      { type: 'text', text: userPrompt },
    ]
  } else {
    userContent = userPrompt
  }

  const model = hasImage
    ? 'meta-llama/llama-4-scout-17b-16e-instruct'
    : 'llama-3.3-70b-versatile'

  const MAX_RETRIES = 2
  let lastError: Error = new Error('AI 분석에 실패했어요')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: userContent },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        })
      })

      if (!response.ok) {
        const errorData: GroqResponse = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `API 오류: ${response.status}`)
      }

      const data: GroqResponse = await response.json()
      const text = data.choices?.[0]?.message?.content
      if (!text) throw new Error('AI 응답이 비어있어요. 다시 시도해주세요.')

      return parseAIResponse(text)
    } catch (e) {
      const isParseError = e instanceof Error && e.message.includes('파싱 실패')
      if (!isParseError || attempt === MAX_RETRIES) throw e
      lastError = e as Error
    }
  }

  throw lastError
}