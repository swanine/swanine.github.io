---
title: "别拿“父传子、子传父”吓我了"
date: '2023-12-11'
spoiler: "献给在 props、emit、eventBus、provide/inject 之间迷失的你"
---
我们从小就被告诫，组件之间要“数据单向流动”。Vue 也这样教我们：
**父组件通过 `props` 给子组件传值，子组件通过 `$emit` 通知父组件某个事件发生了**。

但你写久了之后就会发现：
这事儿根本没那么简单。

场景一复杂，层级一多，Vue 的组件通信就会逐渐从“清水煮白菜”变成了“七大姑八大姨串门”——一个 `props` 传了五层，一个 `emit` 被转发三手，一个兄弟组件用全局事件乱吼……

别慌，其实这些情况很常见，只是我们以前在学组件通信的时候，太过理想化了。

这篇文章我就想聊聊：Vue 组件通信这回事，应该怎么看、怎么写、怎么不把自己写崩。

----

#### 🧭 组件通信的五大派别（别背 API，先理解思路）
Vue 组件通信，其实就这几个套路，每一种都有适合它的“场景生态位”：

<table class="grid w-full grid-cols-[auto_auto] border-b border-gray-900/10 dark:border-white/10">
<thead class="col-span-3 grid grid-cols-subgrid">
<tr class="col-span-3 grid grid-cols-subgrid">
    <th class="px-2 py-2.5 text-left text-sm/7 font-semibold text-gray-950 dark:text-white">通信方式</th>
    <th class="px-2 py-2.5 text-left text-sm/7 font-semibold text-gray-950 dark:text-white">适合场景</th>
    <th class="px-2 py-2.5 text-left text-sm/7 font-semibold text-gray-950 dark:text-white">特点</th>
  </tr>
</thead>
<tbody class="col-span-3 grid grid-cols-subgrid border-t border-gray-900/10 dark:border-white/10">
<tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">props / emit</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">父子之间</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">单向传值、简单直白</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">provide / inject</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">跨层级的祖孙关系</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">解耦、隐式依赖</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">事件总线（eventBus）</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">松耦合兄弟、跨组件</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">灵活但容易失控</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">Vuex / Pinia</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">跨页面、跨组件、共享状态</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">官方推荐、适合复杂项目</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid not-last:border-b not-last:border-gray-950/5 dark:not-last:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">自定义 hooks / composables</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">可复用状态逻辑</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">灵活组合、自带响应性</td>
  </tr>
</tbody>
</table>

这些方式没有对错，**关键看你项目的规模和数据流动的复杂度**。

### 🧒 父传子、子传父：新手村里的套路，也有进阶写法
Vue 最基础的通信方式就是 `props` 和 `$emit`，学起来简单，但写起来其实也能很“优雅”。

**✅ 正常写法：**
```vue
<!-- 父组件 -->
<MyInput :value="username" @update="username = $event" />

<!-- 子组件 -->
<template>
  <input :value="value" @input="$emit('update', $event.target.value)" />
</template>

<script setup>
defineProps(['value'])
defineEmits(['update'])
</script>
```
这就是我们常说的“受控组件”：父组件管控数据，子组件通知变化。

**🚀 更进一步：v-model 语法糖**
```vue
<!-- 父组件 -->
<MyInput v-model="username" />
```
你以为这是语法糖，其实底层就是 `:modelValue` + `@update:modelValue`，Vue 帮你自动做了参数和事件名的约定而已。

写起来舒服多了，也方便统一封装一堆表单类组件。

---

### 👴 provide / inject：爷爷给孙子发钱，谁也别告诉爸爸

当你 `props` 传了三四层，组件都在当“中转站”时，就该考虑换个思路了。

Vue 提供了 `provide` / `inject`，可以让**祖先组件向任意后代组件提供数据**，后代随用随取，不需要层层传递。
```js
// App.vue
provide('theme', 'dark')

// Button.vue（第5层）
const theme = inject('theme')
```
这套机制适合“全局但不常变的数据”，比如主题、语言、配置项等等。
> ❗ 提醒：虽然它很方便，但用多了容易让组件间关系变得隐蔽，阅读成本高。所以更适合“结构性通信”，不太适合“业务值通信”。
---

### 🤝 兄弟组件通信：你俩又不认识，别硬聊！
兄弟组件不能直接用 `props/emit`，但有时偏偏要互动，比如：
- 左边的侧边栏点击切换，右边内容区要响应
- 表格和分页是兄弟组件，共享查询参数

这时有几种方式可以解耦：

**✅ 共享父组件作为“中介人”**

父组件统一管理状态，两个兄弟通过 `props` 和 `emit` 各自接入。

**💣 用 eventBus 快速接上（但别上瘾）**

```js
// eventBus.js
export const eventBus = mitt();

// A组件
eventBus.emit('search', '关键词')

// B组件
eventBus.on('search', (val) => { doSearch(val) })
```
这方式快捷灵活，但容易到处注册/解绑，特别容易内存泄漏 or 逻辑混乱。建议小项目或 demo 里用用，别做核心依赖。

---

### 🏢 Pinia / Vuex：让组件都变成“打工人”
如果一个状态不仅要被多个组件使用，还要长期存在（比如用户信息、购物车数据、权限表），这时候你就该上 Pinia 了。

它其实是一个“响应式的数据工厂”：你在里面定义状态、动作，组件从中取用和更新，一切都响应式同步。
```js
// store/user.js
export const useUserStore = defineStore('user', {
  state: () => ({ name: '小张', token: '' }),
  actions: {
    logout() { this.token = '' }
  }
})
```
```vue
<script setup>
const user = useUserStore()
user.name // 响应式的
</script>
```
现在 Vue 的状态管理，已经越来越模块化、组合化，Pinia 比 Vuex 更轻量，语法也更现代。

---

### 🧩 自定义 composable：组件通信之外的终极解耦武器
最后介绍一个高手段：**提取状态和逻辑到** `useXXX()` ** composable 函数中**，多个组件使用同一个逻辑，就天然“通信”了。
```js
// useCounter.js
import { ref } from 'vue'

const count = ref(0)
export function useCounter() {
  return {
    count,
    inc: () => count.value++
  }
}
```
```vue
<script setup>
const { count, inc } = useCounter()
</script>
```
多个组件引入 `useCounter()`，他们看到的是同一个 `count` 实例，就天然共享状态了。

这是一种“状态即服务”的思路，非常适合复杂场景下的组件复用。

---

```text
  简单 ➝ ➝ ➝ ➝ ➝ ➝ ➝ ➝ ➝ 复杂
[props/emit] → [provide/inject] → [eventBus] → [Pinia] → [composables]
   ⬆️适合父子     ⬆️适合祖孙     ⬆️松耦合     ⬆️全局状态     ⬆️抽象逻辑
```
别再纠结“组件通信怎么选”了。选什么方式其实只取决于两件事：
- 谁要通信？
- 状态在哪维护、谁能控制？

把这两个问题答清楚，通信方式自然水落石出。

### 🐾 最后的叮咛
Vue 的组件通信不复杂，复杂的是“业务本身的耦合”。

你与其追求“通信方式要高级”，不如先让你的状态更清晰、结构更合理。通信只是表象，本质上我们是想让状态保持“合理流动”。

用对方式，就像选对交通工具：近就走路，远就开车，再远就坐高铁。别拿走路去赶高铁，别拿高铁去串门。