import httpx
import json
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings


class LLMService:
    def __init__(self):
        self.base_url = settings.LITELLM_URL
        self.primary_model = settings.LLM_PRIMARY_MODEL
        self.fast_model = settings.LLM_FAST_MODEL

    async def _call_llm(self, messages: List[Dict], model: str = None, temperature: float = None) -> str:
        model = model or self.primary_model
        temperature = temperature or settings.LLM_TEMPERATURE

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": settings.LLM_MAX_TOKENS
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    def generate_response(self, user_message: str, chat_history: List[Dict]) -> Dict[str, Any]:
        system_prompt = self._get_system_prompt()

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        for msg in chat_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_message})

        response_text, model_used = self._call_llm_sync(messages, self.primary_model)

        parsed = self._parse_response(response_text)
        parsed["model"] = model_used

        return parsed

    def _call_llm_sync(self, messages: List[Dict], model: str) -> tuple[str, str]:
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.base_url}/v1/chat/completions",
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": settings.LLM_TEMPERATURE,
                        "max_tokens": settings.LLM_MAX_TOKENS
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                model_used = data.get("model", model)
                return content, model_used
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout):
            return self._get_demo_response(messages[-1]["content"]), "demo-model"

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        result = {
            "response": response_text,
            "message_type": "text",
            "metadata": None,
            "sources": None,
            "reasoning": None
        }

        # Извлечение reasoning из <thinking>...</thinking>
        thinking_match = re.search(r'<thinking>(.*?)</thinking>', response_text, re.DOTALL)
        if thinking_match:
            result["reasoning"] = thinking_match.group(1).strip()
            result["response"] = response_text.replace(thinking_match.group(0), "").strip()

        # Извлечение JSON-визуализации из начала ответа
        try:
            json_match = re.match(r'^(\{.*?\})\s*\n', result["response"], re.DOTALL)
            if json_match:
                chart_data = json.loads(json_match.group(1))
                if chart_data.get("type") == "chart":
                    # Автоподбор типа графика если не указан
                    if not chart_data.get("chartType") and chart_data.get("data"):
                        chart_data["chartType"] = self._select_chart_type(chart_data["data"], chart_data.get("xKey"), chart_data.get("yKey"))
                    text_part = result["response"][json_match.end():].strip()
                    result["response"] = text_part
                    result["message_type"] = "chart"
                    result["metadata"] = {"chart": chart_data}
                elif chart_data.get("type") == "table":
                    text_part = result["response"][json_match.end():].strip()
                    result["response"] = text_part
                    result["message_type"] = "table"
                    result["metadata"] = {"table": chart_data}
        except (json.JSONDecodeError, IndexError):
            pass

        # Извлечение источников
        if "[Источник:" in result["response"]:
            sources = []
            source_matches = re.findall(r'\[Источник:\s*([^\]]+)\]', result["response"])
            for source in source_matches:
                sources.append({"name": source, "url": "#"})
            result["sources"] = sources

        return result

    def _select_chart_type(self, data: list, x_key: str, y_key: str) -> str:
        """Автоподбор типа графика на основе структуры данных."""
        if not data or len(data) < 2:
            return "line"

        first = data[0]
        x_val = str(first.get(x_key, "")).lower()

        # Временные ряды → line
        date_indicators = ["date", "дата", "month", "месяц", "year", "год", "quarter", "квартал", "week", "неделя"]
        if any(ind in x_val for ind in date_indicators):
            return "line"

        # Проверка на датоподобные значения (YYYY-MM-DD, DD.MM.YYYY и т.д.)
        if re.match(r'\d{4}[-/]\d{2}[-/]\d{2}', x_val) or re.match(r'\d{2}\.\d{2}\.\d{4}', x_val):
            return "line"

        # Категории (мало уникальных значений) → bar
        x_values = [str(d.get(x_key, "")) for d in data]
        unique_x = len(set(x_values))
        if unique_x <= 15 and unique_x < len(data):
            return "bar"

        return "line"

    def _get_demo_response(self, user_message: str) -> str:
        chart_data = json.dumps({
            "type": "chart",
            "chartType": "line",
            "chartTitle": "Котировка алюминия LME (Q1 2025)",
            "data": [
                {"date": "2025-01-06", "price": 2485},
                {"date": "2025-01-13", "price": 2510},
                {"date": "2025-01-20", "price": 2535},
                {"date": "2025-01-27", "price": 2520},
                {"date": "2025-02-03", "price": 2555},
                {"date": "2025-02-10", "price": 2580},
                {"date": "2025-02-17", "price": 2545},
                {"date": "2025-02-24", "price": 2570},
                {"date": "2025-03-03", "price": 2610},
                {"date": "2025-03-10", "price": 2595},
                {"date": "2025-03-17", "price": 2625},
                {"date": "2025-03-24", "price": 2640}
            ],
            "xKey": "date",
            "yKey": "price"
        }, ensure_ascii=False)

        reasoning = (
            "Анализирую запрос пользователя...\n"
            "Определяю тип данных: временной ряд (котировки по неделям)\n"
            "Выбираю визуализацию: line chart для отображения динамики\n"
            "Формирую ответ с источниками из LME"
        )

        text_response = (
            "**Демо-режим:** LiteLLM недоступен.\n\n"
            "**Анализ котировки алюминия LME за Q1 2025:**\n\n"
            "Котировка алюминия на LME в первом квартале 2025 года "
            "демонстрировала устойчивый восходящий тренд.\n\n"
            "**Ключевые наблюдения:**\n"
            "- Начало квартала: $2,485/т\n"
            "- Конец квартала: $2,640/т\n"
            "- Рост за квартал: **+6.2%**\n"
            "- Максимум: $2,640/т (24 марта)\n"
            "- Минимум: $2,485/т (6 января)\n\n"
            "**Факторы роста:**\n"
            "1. Увеличение спроса со стороны Китая\n"
            "2. Сокращение запасов на складах LME\n"
            "3. Ограничение предложения из-за энергетического кризиса\n\n"
            "[Источник: LME Official Data]"
        )

        return f"<thinking>\n{reasoning}\n</thinking>\n\n{chart_data}\n\n{text_response}"

    def _get_system_prompt(self) -> str:
        return """Ты — аналитик сырьевого обеспечения в крупнейшей алюминиевой компании.

## Доступные данные в Greenplum:
- quotes: дата, металл, биржа, цена_закрытия, объём, изменение
- currencies: дата, валюта_пара, курс
- commodities: дата, наименование, цена, единица
- news: дата, заголовок, источник, категория, влияние
- suppliers: id, наименование, страна, продукт, условия
- purchases: дата, продукт, поставщик, объём, цена, сумма

## База знаний (Knowledge Base):
Перед ответом проверяй релевантные документы из KB. Если есть подходящий документ — 
используй его как источник. Всегда указывай ссылку на документ: [Источник: название_документа]

## Мышление (reasoning):
Перед генерацией ответа записывай свои рассуждения в блоке <thinking>...</thinking>:
- Какой тип данных запрашивает пользователь?
- Какую визуализацию лучше выбрать и почему?
- Какие источники данных использовать?
- Какие ключевые выводы сделать?

## Правила:
1. Генерируй ТОЛЬКО SELECT-запросы. Никаких INSERT/UPDATE/DELETE/DROP.
2. Всегда используй LIMIT для больших выборок.
3. Если запрос неоднозначен — уточни параметры.
4. Формулируй ответ на языке пользователя.
5. Добавляй краткое резюме в конце.
6. Учитывай, что данные в columnar-таблицах — используй агрегаты (SUM, AVG, COUNT) вместо SELECT *.
7. Для фильтрации по датам используй WHERE quote_date BETWEEN '2024-01-01' AND '2024-12-31'.

## Правила выбора визуализации:
- Временные ряды (даты, котировки, курсы по периодам) → line chart
  Формат: {"type": "chart", "chartType": "line", "chartTitle": "...", "data": [{"date": "YYYY-MM-DD", "value": N}, ...], "xKey": "date", "yKey": "value"}
- Сравнение категорий (металлы, поставщики, продукты) → bar chart  
  Формат: {"type": "chart", "chartType": "bar", "chartTitle": "...", "data": [{"name": "...", "value": N}, ...], "xKey": "name", "yKey": "value"}
- Корреляция двух числовых показателей → scatter
  Формат: {"type": "chart", "chartType": "scatter", "chartTitle": "...", "data": [{"x": N, "y": N, "label": "..."}, ...], "xKey": "x", "yKey": "y"}
- Табличные данные с > 5 строками → table
  Формат: {"type": "table", "headers": ["col1", "col2"], "rows": [["val1", "val2"], ...]}
- KPI (одно ключевое число) → текстовая карточка с числом и дельтой

## Защита от искажений:
- Если данные не найдены в KB или DWH — ЧЕСТНО скажи: "У меня нет данных по этому вопросу"
- НЕ ПРИДУМЫВАЙ данные. Если не уверен — так и скажи.
- Всегда проверяй факты: котировки, курсы, даты — они должны совпадать с DWH.
- Если пользователь спрашивает прогноз — предупрежди, что это модельная оценка, а не факт."""
