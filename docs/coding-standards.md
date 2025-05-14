# 编码规范文档 (Coding Standards)

## 1. 简介

本文档旨在为企业级SaaS管理信息系统平台项目建立一套统一的编码规范。遵循这些规范有助于提高代码的可读性、可维护性、一致性，并促进团队成员之间的有效协作。这些规范覆盖了 TypeScript、Vue.js、SCSS 以及通用编码实践。

所有团队成员都应遵守这些规范。代码审查 (Code Review) 是确保规范得到执行的重要环节。

## 2. 通用规范

### 2.1 命名约定

- **一致性:** 在整个项目中保持命名风格的一致性。
- **描述性:** 名称应清晰、简洁且能准确反映其用途。
- **避免缩写:** 除非是广为人知或项目内约定的缩写，否则使用全名。

| 元素类型          | 约定               | 示例                                  |
| :---------------- | :----------------- | :------------------------------------ |
| **变量**          | camelCase          | `let userName;` `const totalAmount;`   |
| **常量**          | SCREAMING_SNAKE_CASE | `const MAX_USERS = 100;`              |
| **函数/方法**     | camelCase          | `function getUserProfile() {}`          |
| **类/接口/类型别名**| PascalCase         | `class UserAccount {}` `interface IUser {}` `type UserId = string;` |
| **枚举名**        | PascalCase         | `enum UserStatus {}`                  |
| **枚举成员**      | PascalCase (或 SCREAMING_SNAKE_CASE，团队统一) | `UserStatus.Active` `UserStatus.INACTIVE` |
| **文件名 (TS/JS)**| kebab-case (或 camelCase，团队统一，Pure Admin倾向kebab-case) | `user-profile.ts` `userProfile.ts` `utils.ts` |
| **文件名 (Vue)**  | PascalCase         | `UserProfile.vue` `BaseButton.vue`    |
| **CSS 类名**      | kebab-case         | `.user-profile-card {}`               |
| **CSS ID**        | kebab-case         | `#main-navigation {}`                 |
| **路由名称**      | PascalCase/kebab-case (与Vue Router配置一致) | `UserProfile` `user-profile`          |

### 2.2 代码格式化

- **工具:** 使用 **Prettier** 自动格式化代码。Prettier的配置 (`.prettierrc.cjs`) 应提交到版本库，并集成到IDE和Git pre-commit钩子中。
- **缩进:** 使用 2 个空格进行缩进 (由Prettier配置)。
- **行长度:** 建议最大行长度为 100-120 个字符 (由Prettier配置)。
- **分号:** 语句末尾使用分号 (由Prettier配置)。
- **引号:** TypeScript/JavaScript 中优先使用单引号 `'` (由Prettier配置)。HTML/Vue模板中属性值使用双引号 `"`。
- **逗号:** 在多行对象和数组的最后一个元素后添加尾随逗号 (dangling comma) (由Prettier配置)。

### 2.3 注释

- **目的:** 注释是为了解释代码的"为什么"，而不是"做什么"。如果代码本身难以理解其功能，应优先重构代码使其更清晰。
- **类型:**
    - **单行注释:** `// 用于解释复杂逻辑或临时说明`
    - **多行注释:** `/* ... */` 用于较长的解释。
    - **JSDoc/TSDoc:** 用于函数、类、接口和重要变量的注释，以便生成文档和提供类型提示。
- **规范:**
    - 重要的公共API (函数、类、模块) 必须有TSDoc注释。
    - 复杂的业务逻辑、算法或不明显的代码段应添加注释。
    - 过时或无用的注释应及时移除。
    - 避免过多的、解释显而易见代码的注释。

```typescript
/**
 * 获取用户详细信息。
 * @param userId 用户的唯一标识符。
 * @returns 返回包含用户信息的Promise对象，如果用户不存在则返回null。
 */
async function getUserDetails(userId: string): Promise<User | null> {
  // ... 实现逻辑
}
```

### 2.4 错误处理

- **明确性:** 错误应该被捕获并得到妥善处理。
- **用户友好:** 向用户显示的错误信息应该是清晰、友好且可操作的。
- **日志记录:** 在服务器端或需要调试的地方记录详细的错误信息。
- **try...catch:** 合理使用 `try...catch` 块处理可能抛出异常的代码。
- **Promise:** 使用 `.catch()` 处理Promise的拒绝，或在 `async/await` 中使用 `try...catch`。

## 3. TypeScript 规范

- **类型注解:**
    - 尽可能为所有变量、函数参数和返回值添加明确的类型注解。
    - 利用TypeScript的类型推断，但在复杂的场景或公共API中显式声明类型。
- **`any` 和 `unknown`:**
    - 避免使用 `any` 类型，除非在绝对必要且无法确定类型的情况下 (例如，与旧的JS库交互)。使用 `any` 会失去类型安全的好处。
    - 优先使用 `unknown` 类型代替 `any`。`unknown` 类型更安全，因为它要求在使用前进行类型检查或类型断言。
- **接口 (Interface) vs 类型别名 (Type Alias):**
    - **接口:** 优先用于定义对象的结构 (shape)，支持声明合并 (declaration merging)。
    - **类型别名:** 用于定义联合类型、交叉类型、元组、原始类型的别名，以及更复杂的类型组合。
    - 团队内保持一致性，例如：对象结构统一使用 `interface`，其他复杂类型使用 `type`。
- **非空断言 (`!`)**: 谨慎使用非空断言操作符 (`value!`)。只有当你非常确定某个值不会是 `null` 或 `undefined` 时才使用它。滥用可能掩盖潜在的错误。
- **类型断言 (`as Type` 或 `<Type>value`):** 仅在TypeScript无法正确推断类型，且你确信类型正确时使用。优先使用 `as Type` 语法。
- **枚举 (Enum):**
    - 使用枚举定义一组相关的常量。
    - 对于简单的字符串或数字常量集合，可以考虑使用字符串字面量联合类型或 `as const`。
    ```typescript
    // 字符串字面量联合类型
    type Status = 'active' | 'inactive' | 'pending';

    // as const
    const StatusConst = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
    } as const;
    type StatusValue = typeof StatusConst[keyof typeof StatusConst];
    ```
- **模块 (`import`/`export`):**
    - 使用 ES6 模块语法 (`import` 和 `export`)。
    - 优先使用命名导出 (`export const myVar; export function myFunc() {}`)。
    - 默认导出 (`export default`) 应谨慎使用，一个模块最多一个默认导出。
    - 导入路径：优先使用相对路径进行项目内部模块导入，或配置路径别名 (`@/components/...`) 以简化导入。
- **`readonly` 修饰符:** 对于不应被修改的属性，使用 `readonly` 修饰符。
- **代码组织:**
    - 保持文件和模块的职责单一。
    - 相关的类型定义可以放在使用它们的文件顶部，或者集中在 `src/types` 目录下的特定文件中。

## 4. Vue.js 规范 (基于Vue 3 Composition API)

- **Composition API:** 优先使用 Composition API 进行逻辑组织和复用。 `setup()` 函数是主要的入口点。
- **`<script setup>`:** 推荐使用 `<script setup>` 语法糖，它更简洁且性能更好。
- **组件命名:** 单文件组件的文件名使用 `PascalCase.vue` (例如 `UserProfile.vue`)。
- **组件 Props:**
    - 为 Props 提供明确的类型定义。
    - 为非必需的 Props 提供 `default` 值。
    - 使用 `validator` 进行复杂的 Prop 校验。
    ```html
    <script setup lang="ts">
    interface Props {
      title: string;
      count?: number;
      type?: 'primary' | 'secondary';
    }
    const props = withDefaults(defineProps<Props>(), {
      count: 0,
      type: 'primary',
    });
    </script>
    ```
- **组件 Emits:**
    - 使用 `defineEmits` 声明组件触发的事件，并提供类型校验。
    ```html
    <script setup lang="ts">
    const emit = defineEmits<{
      (e: 'change', id: number): void;
      (e: 'update', value: string): void;
    }>();

    function handleClick() {
      emit('change', 123);
    }
    </script>
    ```
- **Refs 和 Reactives:**
    - 基本数据类型使用 `ref()`。
    - 对象和数组使用 `reactive()` 或 `ref()` (根据场景和偏好，`ref()` 对整个对象替换更友好)。
    - 明确变量是响应式的 (例如，通过命名 `userRef` 或 `userState`)。
- **Computed Properties:** 用于派生状态，保持模板逻辑简洁。
- **Watchers:** 谨慎使用 `watch` 和 `watchEffect`。避免创建复杂的依赖关系或副作用。
- **组件结构 (单文件组件):**
    - 推荐顺序: `<script setup lang="ts">`, `<template>`, `<style scoped>`。
    - `<style scoped>`: 默认给组件样式添加 `scoped` 属性，避免全局污染。
- **模板 (`<template>`):**
    - 保持模板简洁，避免过多的逻辑。复杂逻辑应移至 `<script setup>` 中的计算属性或方法。
    - 使用 `v-if` / `v-else-if` / `v-else` 进行条件渲染。
    - 使用 `v-for` 进行列表渲染，并始终提供 `:key`。
    - 属性绑定使用简写形式 (例如 `:prop` 代替 `v-bind:prop`, `@event` 代替 `v-on:event`)。
    - 指令参数和修饰符应清晰明了。
- **Provide / Inject:** 用于跨多层级组件传递数据，但不要滥用，以免造成数据流混乱。优先考虑Props和Emits。
- **生命周期钩子:** 直接在 `<script setup>` 中使用 `onMounted`, `onUnmounted` 等。
- **代码复用:**
    - **Composable Functions (Hooks):** 将可复用的有状态逻辑提取到 `src/hooks/` 目录下的组合式函数中。
    - **通用组件:** 将可复用的UI片段创建为通用组件，存放在 `src/components/`。

## 5. SCSS/CSS 规范

- **模块化:** 使用CSS Modules或Scoped CSS (Vue SFC `scoped` 属性) 来避免样式冲突。
- **命名约定:** CSS类名使用 `kebab-case` (例如 `.my-component__header`)。
- **BEM (Block, Element, Modifier):** 可以考虑使用BEM规范或其变体，以增强CSS结构性和可维护性，尤其是在大型项目中。
- **预处理器 (SCSS):**
    - **变量:** 定义和使用变量 (例如颜色、字体大小、间距) 以方便主题管理和维护。
    - **嵌套:** 合理使用嵌套，避免嵌套过深 (通常不超过3-4层)，以免生成过于复杂的选择器。
    - **Mixins:** 创建可复用的样式片段 (Mixins)。
    - **Functions:** 创建SCSS函数处理复杂的计算。
    - **Partials and Imports:** 将SCSS代码分割成多个 `_partial.scss` 文件，并通过 `@import` (或 `@use` / `@forward` 在新的Sass模块系统中) 引入主文件。
- **避免 `!important`:** 尽量避免使用 `!important`，它会使CSS难以调试和覆盖。
- **注释:** 为复杂的选择器或特殊的样式规则添加注释。

## 6. Git 提交规范

- **Commitizen (可选):** 推荐使用 Commitizen 或类似的工具来规范提交信息格式。
- **Angular Commit Message Conventions:** 推荐遵循 Angular 提交信息约定：
    ```
    <type>(<scope>): <subject>
    <BLANK LINE>
    <body>
    <BLANK LINE>
    <footer>
    ```
    - **Type (类型):**
        - `feat`: 新功能 (feature)
        - `fix`: Bug修复
        - `docs`: 文档变更
        - `style`: 代码格式 (不影响代码运行的变动)
        - `refactor`: 重构 (既不是新增功能，也不是修改bug的代码变动)
        - `perf`: 性能优化
        - `test`: 增加测试
        - `chore`: 构建过程或辅助工具的变动 (例如依赖管理)
        - `revert`: 回滚到上一个版本
    - **Scope (范围):** 本次提交影响的范围，例如模块名 (可选)。
    - **Subject (主题):** 简短描述，不超过50个字符，动词开头，首字母小写。
    - **Body (正文):** 详细描述 (可选)。
    - **Footer (页脚):** 例如关闭的Issue (可选)。

**示例:**
```
feat(auth): add user registration endpoint

Implement the API endpoint for new user registration, including email validation and password hashing.

Closes #123
```

## 7. 代码审查 (Code Review)

- **目标:** 确保代码质量、规范遵循、知识共享和发现潜在问题。
- **流程:**
    - 所有新代码 (features, bug fixes) 都应经过至少一位其他团队成员的审查才能合并到主分支。
    - Reviewer 应关注代码的正确性、效率、可读性、安全性以及是否遵循编码规范。
    - 提交者应积极回应Reviewer的评论并进行必要的修改。
- **建设性反馈:** Reviewer应提供清晰、具体和建设性的反馈。

## 8. 工具集成

- **ESLint:** 用于静态代码分析，发现潜在错误和不规范的代码。
- **Prettier:** 用于代码自动格式化。
- **Stylelint:** 用于CSS/SCSS代码检查和格式化。
- **Husky & lint-staged:** 用于在Git pre-commit阶段自动运行Linters和Formatters，确保提交的代码符合规范。

这些规范是指导性的，目的是促进高质量的软件开发。团队应定期回顾和更新这些规范，以适应项目的演进和技术的变化。 