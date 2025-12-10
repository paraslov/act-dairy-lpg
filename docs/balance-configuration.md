# Balance Configuration System

Система конфигурации баланса для gamified XP progression позволяет централизованно управлять параметрами опыта, рангов, статов и формулами системы развития персонажа.

## Структура конфигурации

Конфигурация хранится в таблице `game_balance_config` в формате JSONB и включает:

### Personal Value Thresholds

XP требования для каждого ранга персональных значений:

- Common: 0
- Rare: 50
- Elite: 150
- Legendary: 300
- Mythic: 500
- Ascended: 750
- AscendedStar1-5: 1050, 1400, 1800, 2250, 2750
- EnlightenmentBase: 2850
- EnlightenmentIncrement: 10

### Core Value Config

- `multiplier`: Множитель XP для Core Values относительно Personal Values (по умолчанию 6x)

### Path Level Config

- `xpPerLevel`: XP, необходимое для повышения Path Level (по умолчанию 600)
- `firstLevelXp`: Опционально, отдельное значение для первого уровня

### Stats Config

- `xpPerPoint`: Коэффициент конвертации XP в стат-поинты (по умолчанию 50)
- `shadowMitigationFactor`: Фактор митигации shadow XP (0-1, по умолчанию 0.1)

### Integrity Rating Weights

Веса для расчета Integrity Rating:

- `pathLevel`: Очки за Path Level (по умолчанию 10)
- `shadowPathLevel`: Штраф за Shadow Path Level (по умолчанию -10)
- `coreValueRank`: Множитель для рангов Core Values (по умолчанию 5)
- `statPoint`: Очки за стат-поинт (по умолчанию 0.5)
- `rankPointMap`: Карта очков для каждого ранга

## API Endpoints

### GET /api/admin/balance

Получить текущую активную конфигурацию.

**Требования:**

- Роль: ADMIN

**Ответ:**

```json
{
  "config": {
    "personalValueThresholds": { ... },
    "coreValueConfig": { ... },
    "pathLevelConfig": { ... },
    "statsConfig": { ... },
    "integrityWeights": { ... }
  }
}
```

### PUT /api/admin/balance

Обновить активную конфигурацию.

**Требования:**

- Роль: ADMIN
- Body: `{ "config": { ... }, "reason": "опциональная причина" }`

**Ответ:**

```json
{
  "config": { ... },
  "message": "Balance configuration updated successfully"
}
```

### GET /api/admin/balance/history

Получить историю изменений конфигурации.

**Требования:**

- Роль: ADMIN
- Query параметры: `configId` (опционально)

**Ответ:**

```json
{
  "history": [
    {
      "id": "...",
      "configId": "...",
      "oldConfig": { ... },
      "newConfig": { ... },
      "changedBy": "...",
      "changeReason": "...",
      "createdAt": "..."
    }
  ]
}
```

## Использование в коде

### Получение конфигурации

```typescript
import { balanceConfigService } from '@/lib/balance/balance-config-service'

const config = await balanceConfigService.getActiveConfig()
```

### Расчет рангов

```typescript
import { getRankFromXp, getRankInfo } from '@/lib/balance/rank-utils'

const rank = getRankFromXp(xp, config.personalValueThresholds)
const rankInfo = getRankInfo(xp, config.personalValueThresholds)
```

### Расчет Integrity Rating

```typescript
import { calculateIntegrityRating } from '@/lib/balance/integrity-rating-utils'

const ir = calculateIntegrityRating(userProgress, config)
```

## Админ-панель

Админ-панель доступна по адресу `/admin/balance` для пользователей с ролью ADMIN.

Функции:

- Просмотр текущей конфигурации
- Редактирование всех параметров баланса
- Валидация на клиенте и сервере
- Автоматическое сохранение истории изменений

## Seed скрипт

Для инициализации дефолтной конфигурации:

```bash
pnpm db:seed:balance <admin-user-id>
```

Или программно:

```typescript
import { seedDefaultBalanceConfig } from '@/lib/balance/seed'

await seedDefaultBalanceConfig(adminUserId)
```

## Кэширование

Конфигурация кэшируется в памяти на 5 минут для оптимизации производительности. Кэш автоматически инвалидируется при обновлении конфигурации.

## Валидация

Все конфигурации валидируются через Zod схемы перед сохранением:

- Проверка типов
- Проверка диапазонов значений
- Проверка логической последовательности (например, XP thresholds должны быть в порядке возрастания)

## Fallback

Если активная конфигурация не найдена в БД, система автоматически использует дефолтные значения из `defaultBalanceConfig`.
