---
title: "v-if VS v-show"
date: '2023-12-11'
spoiler: "很多人写 Vue 的时候都会下意识地使用 v-if 或 v-show，但你真的清楚它们的区别和适用场景吗？"
---
我们都听过这句话：
>「切换频繁用 `v-show`，按需渲染用 `v-if`。」

听起来很合理，但实际开发中经常被忽略或者误用。
先上最基本的区别：
```vue
<!-- 条件成立时插入 DOM -->
<div v-if="show" class="text-2xl font-sans text-purple-400 dark:text-purple-500">
  Hello
</div>

<!-- 总是在 DOM 中，只是 display:none -->
<div v-show="show" class="text-2xl font-sans text-purple-400 dark:text-purple-500">
  Hello
</div>
```
- `v-if`：真正从 DOM 中添加/删除节点
- `v-show`：节点始终存在，只是隐藏了
---
### 为什么选择 v-if
你应该在这些场景下优先考虑 `v-if`：
- 初始加载时组件不需要出现
- 组件内部会触发副作用（如发请求、注册监听器）
- 组件体积较大，不希望无意义地一直存在内存中
示例：
```vue
<!-- 条件成立时插入 DOM -->
<!-- 会在切换 tab 时重新创建 -->
<UserList v-if="activeTab === 'user'" />
```
这类组件可能会在 `mounted` 阶段发起请求或渲染大量内容，`v-if` 可避免不必要的开销。

---
### v-show 的误区
`v-show` 很适合高频切换，比如 tab、展开/收起等场景。但它也隐藏了一个坑：
```vue
<!-- 即使默认隐藏，仍会初始化和执行 mounted 生命周期 -->
<BigChart v-show="false" />
```
上面这个组件会消耗大量内存并渲染 Canvas 图表。哪怕你看不到，它也已经加载完了。
### 我的结论
- 优先使用 `v-if`，除非你明确知道你需要更快的 toggle 效果
- `v-show` 适合频繁展示/隐藏、对性能要求极高、组件非常轻量的场景
- 不要仅仅因为“它会被反复切换”就默认选用 `v-show`，先考虑是否有副作用或初始化成本
最重要的是：**写代码时做选择，不要交给习惯**。
---
🧠 你所在的项目是否默认使用某一个？这背后的理由还站得住脚吗？