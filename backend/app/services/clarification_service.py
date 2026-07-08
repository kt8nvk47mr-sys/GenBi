import httpx
import json
from typing import List, Dict, Any
from app.core.config import settings


class ClarificationService:
    def __init__(self):
        self.base_url = settings.LITELLM_URL
        self.clarification_model = settings.LLM_CLARIFICATION_MODEL
    
    def analyze_and_clarify(self, user_message: str, chat_history: List[Dict]) -> Dict[str, Any]:
        system_prompt = self._get_clarification_prompt()
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        for msg in chat_history[-5:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        messages.append({"role": "user", "content": user_message})
        
        response_text = self._call_llm(messages)
        
        try:
            result = json.loads(response_text)
            return result
        except json.JSONDecodeError:
            return {
                "needs_clarification": False,
                "answer": response_text
            }
    
    def _call_llm(self, messages: List[Dict]) -> str:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": self.clarification_model,
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 1000
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    def _get_clarification_prompt(self) -> str:
        return """Ты — аналитик сырьевого обеспечения. Твоя задача — проанализировать запрос пользователя 
и определить, нужны ли уточнения для формирования точного ответа.

## Доступные данные:
- quotes: котировки металлов (AL, CU, ZN и др.)
- currencies: курсы валют
- commodities: товары/сырьё
- purchases: закупки
- news: новости

## Твои действия:
1. Проанализируй запрос пользователя
2. Определи, все ли параметры указаны:
   - Период (дата начала, дата конца)
   - Металл/актив
   - Источник данных (LME, SHFE, ЦБ)
   - Единицы измерения (USD, RUB, тонна)
3. Если параметры не указаны — задай уточняющие вопросы
4. Если запрос полный — верни {"needs_clarification": false}

## Формат ответа (строго JSON):
{
  "needs_clarification": true/false,
  "questions": [
    {
      "field": "period",
      "question": "За какой период показать данные?",
      "options": ["Январь 2025", "Q1 2025", "Полгода", "Год", "Произвольный"]
    },
    {
      "field": "metal",
      "question": "Какой металл интересует?",
      "options": ["Алюминий", "Медь", "Цинк", "Все металлы"]
    }
  ]
}

## Важно:
- Максимум 3 вопроса за раз
- Формулируй кратко и friendly
- Давай варианты ответов (кнопки) когда возможно
- Не задавай вопросов если все параметры ясны из контекста
- Отвечай ТОЛЬКО валидным JSON без дополнительного текста"""
