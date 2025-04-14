---
title: "Vue 的响应性系统"
date: '2023-12-11'
spoiler: "写给每一个被 .value 搞烦过但又离不开它的你"
---
Vue 的响应性系统一直是它最核心也最有魅力的部分。从 Vue 2 的 `Object.defineProperty` 到 Vue 3 的 `Proxy`，再到 `Composition API` 中各种 `ref` / `reactive` / `watchEffect` 的使用方式，响应性这个东西，看起来就像魔法一样：你改了个值，页面跟着变；你访问了某个字段，Vue 悄悄记住了你；你什么都没声明，它居然就知道你想监听谁。

但当你深入了解后，会发现它不是魔法，更不是黑盒，而是基于 JavaScript 原生语言能力，精巧构建出来的一套“克制而不失强大”的机制。

这篇文章，我不想从 API 文档的角度复述 Vue 的响应性系统，而是想聊聊：它到底解决了什么问题？我们为什么需要它？我们又该如何更好地理解它、驾驭它？

----

#### 🧠 一切从“声明式”开始
Vue 的设计初衷很简单：**你只需要描述“你想要的界面”，其他的它来负责**。

这是一种“声明式”的思维方式，不是命令浏览器一步步做什么，而是告诉 Vue：“页面长这样，只要我的数据变了，请帮我把页面也变一下”。

举个例子，如果你写：
```vue
<h1 class="text-2xl">{{ user.name }}</h1>
```
你表达的是：“这地方要展示 `user.name`”，你**没有**说“当 `user.name` 改变时，请重新设置 innerText”，这些事情 Vue 自动帮你完成了。

这个自动化背后靠的是什么？就是它的响应性系统。

你每次访问 `user.name`，Vue 都在幕后偷偷地打了个点：“这个组件用了这个数据”，当你以后去改这个值时，Vue 就可以精准地“反查”所有依赖它的地方，然后刷新视图。
这种自动追踪依赖的设计，是 Vue 能做到“声明式更新”的根本支撑。

----
### ⚙️ Proxy 是魔法的底层，但规则比你想的清晰
Vue 3 把响应性的底层换成了 `Proxy`，这带来了很多好处：
- 可以监听属性的添加和删除（`defineProperty` 做不到）
- 可以对数组、`Map`、`Set` 做响应式代理
- 性能更好，语义更清晰

但它也带来了一些“让人头疼”的语法细节，比如 `.value`的出现。
```js
const count = ref(0);
console.log(count.value); // 必须 .value
```
刚开始大家都在问：“为什么不能直接用 count？为啥要多这一层？”
我的理解是这样的：
- `ref` 主要是为了处理**原始类型的响应式**（比如 number、string），而 JavaScript 的原始类型是没办法被代理的；
- 所以 Vue 把它包了一层对象 `{ value: xxx }`，从而实现对它的追踪；
- `.value` 就是你在“取值”的时候，明确告诉 Vue：“我要用这个响应式值的值了”，也让它知道你依赖了它。
这个 .value 看起来有点多余，但它是 Vue 的一种“语言限制下的让步”，也是一种很“克制”的设计。因为你如果直接返回值，Vue 就追踪不了是谁在用它。

---

### 🔁 Vue 不是监听数据，而是监听你“用了什么”
Vue 的响应性系统最厉害的一点，不是“监听数据的变化”，而是“监听**谁用到了这些数据**”。
举个例子：
```js
const state = reactive({ name: 'swanine', age: 18 });

watchEffect(() => {
  console.log(`你好，${state.name}`);
});
```
这个副作用函数里只用到了 `state.name`，所以哪怕你改了 `state.age`，Vue 是不会重新执行 `watchEffect` 的。

这一点很多人第一次接触时会误解，以为只要这个对象改了，副作用函数就会重新运行。但 Vue 的依赖追踪是**精确级别**的，不仅节省了性能，也让你的逻辑更可控。

这是它响应性系统最精妙的地方：它**不是监听对象**，而是监听你“访问了哪些属性”。

----

### 🧩 ref、reactive、computed、watch：各有分工
Vue 3 中响应性相关的 API 很多，初学者经常会迷糊：什么时候用 `ref`，什么时候用 `reactive`，`computed` 和 `watch` 又有什么区别？
下面是我的一点总结：
<table class="grid w-full grid-cols-[auto_auto] border-b border-gray-900/10 dark:border-white/10">
<thead class="col-span-3 grid grid-cols-subgrid">
<tr class="col-span-3 grid grid-cols-subgrid">
    <th class="px-2 py-2.5 text-left text-sm/7 font-semibold text-gray-950 dark:text-white">API</th>
    <th class="px-2 py-2.5 text-left text-sm/7 font-semibold text-gray-950 dark:text-white">适用场景</th>
    <th class="px-2 py-2.5 text-left text-sm/7 font-semibold text-gray-950 dark:text-white">特点</th>
  </tr>
</thead>
<tbody class="col-span-3 grid grid-cols-subgrid border-t border-gray-900/10 dark:border-white/10">
<tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium "><code>ref</code></td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">基础值（number、string、boolean）或你想用 <code>.value</code> 明确引用的情况</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">有 <code>.value</code>，可以包对象</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium "><code>reactive</code></td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">对象或数组整体作为响应式使用时</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">不需要 <code>.value</code>，但不能包基础类型</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid border-b border-gray-950/5 dark:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium "><code>computed</code></td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">需要根据已有状态<b>派生出新状态</b>时</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">自动缓存，只有依赖变化才重新计算</td>
  </tr>
  <tr class="col-span-3 grid grid-cols-subgrid not-last:border-b not-last:border-gray-950/5 dark:not-last:border-white/5">
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium "><code>watch</code></td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">明确观察某个值的变化，并在变化时执行副作用</td>
    <td class="px-2 py-2 align-top font-mono text-xs/6 font-medium ">比 <code>watchEffect</code> 更细粒度，更适合处理异步请求等副作用</td>
  </tr>
</tbody>
</table>

这套 API 听起来有点复杂，但你只要记住：**ref 是数据源，computed 是衍生数据，watch 是监听变化后执行事情**。

一旦理解了这三个角色的分工，写 Vue 的状态管理会变得非常轻松。

---

### 🧨 响应性陷阱：你以为响应了，其实没反应
Vue 的响应性也不是没有坑，下面列几个我踩过的常见误区：

**1. 解构后失去响应性**
```js
const state = reactive({ count: 1 });
const { count } = state;

watchEffect(() => {
  console.log(count); // ❌ 不会响应更新
});
```
这是因为 `count` 只是普通变量，不再是响应式引用。解决方式有两个：
- 不解构，直接用 `state.count`
- 或者用 `toRefs(state)` 转换

**2. reactive 包原始类型失效**
```js
const value = reactive(1); // ❌ 不生效
```
你得用 `ref(1)` 才行。

**3. 非响应式数据写进响应式对象**
如果你往响应式对象里塞一个非响应式的 class 实例，Vue 是不会追踪它内部状态的，因为它没办法代理它。

----

### 🌱 响应性是一种“哲学”，而不是一个工具
用 Vue 时间久了之后，我越来越觉得，响应性并不是一个“功能”，而是一种思维方式：
- 少些 DOM 操作，多些状态描述
- 少些命令式流程控制，多些状态流动
- 少些“先改值再更新视图”，多些“值一改，视图自然跟着变”

Vue 的响应性系统，其实是在鼓励你信任**数据的力量**，而不是把注意力放在“更新页面”这种重复性劳动上。

这也解释了为什么 Vue 能让初学者觉得“好上手”，又让老手觉得“写得顺手”——它并没有强迫你用很重的概念，而是用一种非常自然的方式，把“状态”和“界面”连接起来了。

---

### 🎯 最后想说的
Vue 的响应性系统，是一个**让你更关注业务逻辑、少关注框架细节**的好设计。

它就像一个永远在背后默默记录的帮手，从不插手你要干什么，但你每次写代码的时候，它已经帮你安排好了一切依赖。

我们程序员最怕的，其实是“失控”：不知道哪段逻辑影响了什么，不知道哪段更新会触发什么。但 Vue 的响应性，是可预测的、有限度的、结构清晰的。这种设计本身，就是一种“克制的自由”。

你以为它是魔法，其实它只是太贴心了。