export type SkinTypeValue =
  | '악건성'
  | '건성'
  | '수부지'
  | '복합성'
  | '지성'
  | '민감성'
  | '복합성+민감성'
  | '건성+민감성'

export interface RecommendedIngredient {
  name: string
  reason: string
}

export interface RoutineStep {
  step: number
  name: string
  product: string
  description: string
  tip: string
  product_memo?: string
}

export interface ClinicTreatment {
  name: string           // 시술명
  description: string    // 시술 설명
  effect: string         // 기대 효과
  frequency: string      // 권장 주기
  caution: string        // 주의사항
}

export interface AISkinResult {
  skinType: SkinTypeValue
  reason: string
  characteristics: string[]
  recommendedIngredients: RecommendedIngredient[]
  warnings: string[]
  routine: RoutineStep[]
  lifestyle: string[]
  clinicTreatments?: ClinicTreatment[]  // 피부과 시술 추천 (반복 진단 시)
  clinicMessage?: string                 // 피부과 추천 메시지
}

export interface SkinDiagnosis {
  id: string
  user_id: string
  skin_type: SkinTypeValue
  reason: string
  concerns: string
  ai_result: AISkinResult
  created_at: string
}

export interface Routine {
  id: string
  user_id: string
  diagnosis_id: string
  steps: RoutineStep[]
  created_at: string
}

export interface RoutineCheck {
  id: string
  user_id: string
  routine_id: string
  step_index: number
  checked_at: string
  is_done: boolean
}

export interface DiaryEntry {
  id: string
  user_id: string
  date: string
  condition: number
  memo?: string
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  nickname: string
  skin_type: string
  skin_concerns: string[]
  created_at?: string
}