# 2. MobX API参考
[toc]
适用于MobX 4或者更高版本。
+ 使用的是MobX3 ？ 参考版本升级指南来进行升级。
+ MobX3文档
+ 对于MobX2，旧文档亦然可以在github找到。

## 核心API
这里都是MobX中最重要的API。
> 理解了`observable`、`computed`、`reactons`和`actions`的话，说明对于MobX已经足够精通了，在你的应用中使用它吧。

### 创建 observables
### observable(value)
用法：
+ `observable(value)`
+ `@observable classProperty = value`

Observable值可以是JS基本数据类型、引用类型、普通对象、类实例、数组和映射。
**注意：**`observable(value)`是一个便捷的API，此API只由在它可以被制作成可观察的数据解构(数组、映射或observable对象)时才会成功。对于所有其他值，不会执行转换。
匹配类型应用了以下转换规则，但可以通过使用装饰器进行微调。请参见下文。
1. 如果**value**是ES6 Map的实例：会返回一个新的`Observable Map`。如果你不只关注某个特定entry的更改，而且对添加或删除其他entry时也作出反应的话，那么Observable map会非常有用。
2. 如果**value**是数组，会返回一个`Observable Array`。
3. 如果**value**是没有原型的对象或它的原型是`Object.prototype`,那么对象户呗克隆并且所有的属性都会被转换成可观察的。参见Observable Object。
4. 如果**value**是有原型的对象，JavaScript原始数据类型或者函数，值不会发生变化。如果你需要Boxed Observable，你可以采用下列任意方式:
	+ 显式地调用 `observable.box(value)`
	+ 在类定义时试用`@observable`
	+ 调用`devorate()`
	+ 在类中试用`extendObservable()`来引入属性

Mobx不会自动带有原型的对象转变成Observable，因为那是Observable构造函数的职责。在构造函数中使用`extendObservable`或在类定义是使用`@observable`进行替代。
乍看之下，这些规则可能看上去很复杂，但实际桑实践当中你会发现他们是非常直观的。
一些建议：
+ 想要使用`@observable`装饰器，首先要确保在你的编辑器(babel或者typescript)中，装饰器是启用的。
+ 默认情况下降一个数据解构装换成可观察的是**有感染性的**。这意味着`observable`被自动应用于数据解构包含的任何值，或者将来会被该数据解构包含的值。这个行为可以通过使用装饰器来更改。
+ [MobX 4 及以下版本]要创建键是动态的对象时永远都要使用maps！对象上只有初始化时便存在的属性会转换成可观察的，尽管新添加的属性可以通过使用`extendObservable`转换成可观察的。

#### @observable property = value
`observable`也可以用作属性的装饰器。它需要启用装饰器而且它是`extendObservable(this, {property: value})`的语法糖。
#### observable.box(value, options?)
差UN根据爱你一个observable的盒子，它用来存储value的observable引用。使用`get()`方法可以得到盒子中的当前value，而使用`set()`方法可以更新value。这是所有其他observable创建的基础，但实际中你其实很少能使用到它。
通常盒子会自动地尝试把任何还不是observable的新值转换成observable。使用`{deep: false}`选项会禁用这项行为。
#### observable.object(value, decorators?, option?)
为提供的对象创建一个克隆并将其所有的属性转换为observable。默认情况下这些属性中的任何值都会转换成observable，但当使用`{deep: false}`选项时只有属性会转换成observable引用，而值不会改变(这也适用于将来分配的任何值)。
`observable.object()`的第二个参数可以很好地调整装饰器的可观察性。
#### observable.array(value, options?)
基于提供的值来创建一个新的observable数组。
如果你不想数组中的值转换成observable请使用`{deep: false}`选项。
#### observable.map(value, options?)
基于提供的值来创建一个新的observable映射。不过不想映射中的值转换成observable请使用`{deep: false}`选项。当想创建动态的键集合并且需要能观察到键的添加和移除时，请使用`map`。因为内部使用了成熟的ES6 Map，你可以自由使用任何键而**无需局限**于字符串。
#### extendObservable
用法: `extendObservable(target, properties, decorators?, options?)`
对于`propertyMap`中每个键值对，都会作为一个(新)的observable属性引入到target对象中。还可以在构造函数中使用来引入observable属性，这样就不需要用装饰器了。如果`propertyMap`的某个值是一个getter函数，那么会引入一个**computed**属性。
如果新的属性不应该具备感染性(即新分配的值不应该自动地转换成observable)的话，请使用`extendObservable(target, props, decorators?, {deep: false})`。注意`extendObservable`增强了现有的现象，不像`observable.object`是创建一个新对象。
### 装饰器(Decorators)
使用装饰器可以很好地调节通过`observable`、`extendObservable`和`observable.object`定义的属性的可观察行。它们还可以控制特定属性的自动转换规则。
可用的装饰器列表：
+ `observable.deep`:所有observable都使用的默认的修饰器。它可以把任何制定的、非原始数据类型的、非observable得值转换成observable。
+ `observable.ref`:禁用自动的observable转换，指示创建一个observable引用。
+ `observable.shallow`:只能与几何组合使用。将任何分配的几何转换为浅observable(而不是深observable)的集合。换句话说，集合中的值将不会自动变为observable。
+ `computed`:创建一个衍生属性。
+ `action`: 创建以一个动作。
+ `action.bound`:创建有范围的动作。

可以使用`@decorator`语法来应用这些修饰器:
```js
import {observable, action} from 'mobx';

class TaskStore {
    @observable.shallow tasks = []
    @action addTask(task) { /* ... */ }
}
```
或者通过`observabke.object`/`observable.extendObservable`或`decorate()`传入属性装饰器。注意，装饰器总是"附着"在属性上的。因此，即使分配了新值，他们仍将保持有效。
```js
import {observable, action} from 'mobx';

const taskStore = observable({
    tasks: [],
    addTask(task) { /* ... */ }
}, {
    tasks: observable.shallow,
    addTask: action
})
```
### decorate
用法：`decorate(object, decorators)`
这是将可观察性装饰器应用于普通对象或类实例的简便方法，第二个参数是一个属性设置为某些装饰器的对象。
当无法使用@decorate语法或需要对可观察性进行更细颗粒的控制时使用这个方法。
```js
class TodoList {
    todos = {}
    get unfinishedTodoCount() {
        return values(this.todos).filter(todo => !todo.finished).length
    }
    addTodo() {
        const t = new Todo()
        t.title = 'Test_' + Math.random()
        set(this.todos, t.id, t)
    }
}

decorate(TodoList, {
    todos: observable,
    unfinishedTodoCount: computed,
    addTodo: action.bound
})
```
想要在单个属性上应用多个修饰器的话，你可以传入一个修饰器数组。多个修饰器应用的顺序是从右至左。
```js
import { decorate, observable } from 'mobx'
import { serializable, primitive } from 'serializr'
import persist from 'mobx-persist'

class Todo {
    id = Math.random();
    title = '';
    finished = false;
}

decorate(Todo, {
    title: [serializable(primitive), persist('object'), observable],
    finished: [serializable(primitive), observable]
})
```
### Computed values(计算值)
用法:
+ `computed(()=>expression)`
+ `computed(()=>expression,(newValue)=>void)`
+ `computed(()=>expression, options)`
+ `@computed({equals: compareFn} get ClassProperty() {return expression;})`
+ `@computed get classProperty() {return expression;}`

创建计算值，`expression`不应该有任何副作用而只是返回一个值。如果任何`expression`中使用的observable发生改变，它都会自动地重新计算，但前提是计算值被某些`reaction`使用了。
还有各种选项可以控制`computed`的行为。包括:
+ `equals: (value, value) => boolean`:用来重载默认检测规则的比较函数。内置比较器有:`comparer.identity`,`comparer.default`,`comparer.structural`。
+ `requiresReaction: boolean`:在重新计算衍生属性之前，等待跟踪的observables值发生变化。
+ `get: ()=>value`:重载计算属性的getter。
+ `set: ()=>value=>void`:重载计算属性的setter。
+ `keepAlive: boolean`:设置为true以自动保持计算值活动，而不是在没有观察者时暂停。

### Actions(动作)
任何应用都有动作。动作是任何用来修改状态的东西。
使用MobX你可以在代码中显式地标记出动作所在的位置。动作可以有助于更好的组织代码。建议在任何更改observable或者有副作用的函数上使用动作。结合开发者工具的话，动作还能提供非常有用的调试信息。
> 注意： 党启用**严格模式**时，需要强制使用`action`,参见`enforceActions`。

用法:
+ `action(fn)`
+ `action(name, fn)`
+ `@action classMethod`
+ `@action boundClassMethod = (args) => { body }`
+ `@action.bound boundClassMethod(args) { body }`

对于一次性动作，可以使用`runInAction(name?, fn)`,它是`action(name, fn)()`的语法糖。
### Flow
用法: `flow(function* (args) {})`
`flow()`接收generator函数作为它唯一的输入。
当处理**异步操作**时，回调中执行的代码不会被`action`包装。这意味着你修改的observable state无法通过`enforceActions`检查。保留动作语义的简单方法是使用flow来包装异步函数。这将确保所有回调都会被`action()`包装。
> 注意:异步函数必须是*generator*，而且在内部职能*yield promises*。`flow`会返回一个promise,需要的话可以使用`cancel()`进行撤销。

```js
import { configure } from 'mobx';

// 不允许在动作外部修改状态
configure({ enforceActions: true });

class Store {
    @observable githubProjects = [];
    @observable state = "pending"; // "pending" / "done" / "error"


    fetchProjects = flow(function* fetchProjects() { // <- 注意*号，这是生成器函数！
        this.githubProjects = [];
        this.state = "pending";
        try {
            const projects = yield fetchGithubProjectsSomehow(); // 用 yield 代替 await
            const filteredProjects = somePreprocessing(projects);

            // 异步代码自动会被 `action` 包装
            this.state = "done";
            this.githubProjects = filteredProjects;
        } catch (error) {
            this.state = "error";
        }
    })
}
```
> 提示:推荐为generator函数起个名称，此名称将出现在开发工具中。

#### Flows 可以撤销
Flows是可以取消的，这意味着调用返回的promise的`cancel()`方法。这会立即停止generator，但是`finally`子句仍会被处理。返回的promise本身会使用`FLOW_CANCELLED`进行reject。
#### Flows 支持异步迭代器
Flows支持异步迭代器，这意味着可以使用异步generators:
```js
async function* someNumbers() {
    yield Promise.resolve(1)
    yield Promise.resolve(2)
    yield Promise.resolve(3)
}

const count = mobx.flow(async function*() {
    // 使用 await 来循环异步迭代器
    for await (const number of someNumbers()) {
        total += number
    }
    return total
})

const res = await count() // 6
```
### Reactions(反应) & Derivations(衍生)
**计算值**是自动响应状态变化的值。**反应**是自动响应状态变化的**副作用**。反应可以确保党相关状态发生变化时制定的副作用(主要是I/O)可以自动地执行，比如打印日志、网络请求、等等。使用反应最常见的场景是React组件的`observer`装饰器(参见下文)。
#### observer
可以用作包裹React组件的高阶组件。在组件的`render`函数中的任何已使用的observable发生变化时，组件都会自动重新渲染。注意`observer`是由`mobx-react`包提供的，而不是`mobx`本身。
用法:
+ `observer(React.createClass({...}))`
+ `observer((props, context) => ReactElement)`
+ `onserver(class MyComponent extends React.Component {...})`
+ `@observer class MyComponent extends React.Component {...}`

#### autorun
用法:`autorun(()=>{ sideEffect }, options)`。`autorun`负责运行所提供的`sideEffect`并追踪在`sideEffect`运行期间访问过的`observable`的状态。将来如果有其中一个已使用的observable发生变化，同样的`sideEffect`会再运行一遍。`autorun`返回一个清丽函数用来取消副作用。
选项:
+ **`name?: string`**:用于识别和调试的名称。
+ **`delay?: number`**:使副作用延迟和防抖的时间。默认为`0`。
+ **`onError?: (error) => void`**:如果antorun函数抛出异常，则触发错误处理函数。
+ **`scheduler?: (callback) => void`**:设置自定义调度器以决定如何调度autorun函数的重新运行。

#### when
用法: `when(()=>condition, ()=>{ sideEffect }, options)`。`condition`表达式会自动响应任何它所使用的observable。一旦表达式返回的是真值，副作用函数变回立即调用，单只会调用一次。
> 注意: 副作用函数(第二个参数)其实是可选的。如果不提供副作用函数的话。将返回一个可取消的promise(即具有`cancle()`方法的promise)。

`when`返回清理器以尽早地取消操作。
如果没有给`when`传递副作用函数的话，它将返回一个可以等待条件结束的`promise`。
options
+ `name?: string`:用于识别和调试的名称。
+ `onError?: (error) => void`: 如果 *断言函数*或*副作用函数*函数跑出异常，则触发错误处理函数。
+ `timeout: number`:以毫秒未单位的延迟，之后将触发`onError`处理函数，以通知再制定时间内未满足条件。

### reaction
用法:`reaction(()=>data, data=>{sideEffect}, options)`。`reaction`是`autorun`的变种，再如何追踪observable方面给与了更细粒度的控制。它接收两个函数，第一个是追踪并返回数据，该数据用作第二个函数，也就是副作用的输入。与`autorun`不同的是副作用期初不会进行，并且在执行副作用时访问的任何observable都不会被追踪。和`autorunAsync`一样，副作用时可以进行函数去抖的。
options:
+ `fireImmediately?: boolean`:再出发*副作用函数*之前等待变化。默认为`false`。
+ `delay?: number`:使副作用延迟和防抖的时间。默认为**0**。
+ `equals`.自定义相等函数来确定expr函数与之前的结果不同，再决定是否出发副作用。接收与`computed`的equals选项相同的选项。
+ 还接收`autorun`的所有选项。

### onReactionError
用法:`onReactionError(handler: (error: any, derivation) => void)`
此方法附加一个全局错误监听器，对于从reaction抛出的每个错误都会调用该错误监听器。它可以用来监控或者测试。
## 实用工具
有一些工具函数可以使得*observable*或者*计算值*用起来更方便。更多实用工具可以在`mobx-utils`包中找到。
### Provider (mobx-react包)
可以用来实用React的`context`机制来传递store给子组件。
### inject (mobx-react包)
相当于`Provider`的高阶组件。可以用来从React的`context`中挑选store作为prop传递给目标组件。
用法:
+ `inject("store1", "store2")(observer(MyComponent))`
+ `@inject("store1", "store2) @observer MyComponent`
+ `@inject((stores, props, context)=>props) @observer MyComponent`
+ `@observer(["store1","store2"]) MyComponent` is a shorthand for the `@inject() @observer` combo。

### toJS
用法:`toJS(observableDataStructure, options?)`。把observable数据解构转换成普通的JavaScript对象并忽略计算值。
options包括:
+ `detectCycles: boolean`: 检查observable数据解构中的循环引用。默认为`true`。
+ `exportMapsAsObjects: boolean`:将ES6 Map作为普通对象导出。默认为`true`。

### isObservable 和 isObservableProp
用法:`isObservable(thing)`或`isObservableProps(thing, property?)`。如果给定的thing，或者thing制定的`property`是observable的话，返回true。适用于所有的observable、计算值和reaction的清理函数。
### isObservableObject|Array|Map 和 isBoxedObservable
用法: `isObservableObject(thing)`, `isObservableArray(thing)`,`isObvervableMap(thing)`,`isBoxedObservable(thing)`。如果类型匹配的话返回true。
### isArrayLike
用法:`isArrayLike(thing)`。如果给定的thing是JavaScript数组或者observable(MobX的)数组的话，返回true。这个方法更简便。注意，observable数组可以通过`.slice()`转变成JavaScript数组。
### isAction
用法: `isAction(func)`。如果给定函数是用`action`方法包裹的或则是用`@action`装饰的话，返回true。
### isComputed 或 isComputedProp
用法:`isComputed(thing)`或`isComputedProp(thing, property?)`。如果给定的thing是计算值或者thing指定的`property`是计算值的话，返回true。
### itercept
用法:`intercept(object, property?, interceptor)`。这个API可以在应用observable的API之间，拦截更改。对于验证，标准化和取消等操作十分有用。
### observe
用法:`obser(object, property?,listener, fireImmediately = false)`这是一个底层API，用来观察一个单个的observable值。
### onBecomeObserved 和 onBecomeUnobserved
用法: `onBecomeIbserved(observable, property?,listener: ()=>void)`和`onBecomeUnobserved(observable, property?, listener: ()=> void)` 这些函数都是与MobX的观察体系挂钩的,当observable开始/停止被观察时会受到通知。它可以用来执行一些延迟操作或网络资源获取。
返回值为*清理函数*，用来卸载*监听器*。
```js

export class City {
    @observable location
    @observable temperature
    interval

    constructor(location) {
        this.location = location
        // 只有当 temperature 实际使用了才开始获取数据!
        onBecomeObserved(this, 'temperature', this.resume)
        onBecomeUnobserved(this, 'temperature', this.suspend)
    }

    resume = () => {
        log(`Resuming ${this.location}`)
        this.interval = setInterval(() => this.fetchTemperature(), 5000)
    }

    suspend = () => {
        log(`Suspending ${this.location}`)
        this.temperature = undefined
        clearInterval(this.interval)
    }

    @flow fetchTemperature = function*() {
        // 数据获取逻辑
    }
}
```
### configure
用法: `configure(options)`:对活动的MobX进行全局行为的设置。使用它来改变MobX的整体表现。
```js
import { configure } from "mobx";

configure({
	//...
});
```
### arrayBuffer: number
如果没有最大长度的话，则将可观察数组的默认创建长度增加至`arrayBuffer`。
可观察数组会在`ObvervableArray.prototype`上惰性地创建数组项的getters,从第一项开始。还会继续在数组中创建项，知道数组长度为`arrayBuffer`(如果项不存在的话)。如果你清楚通过的最小数组长度，并且不想在主流程代码中创建这些getters的话，请使用`arrayBuffer`。还可以参见`observable`。
### computedRequiresReaction: boolean
禁止访问任何未观察的计算值。如果想检查是否在没有响应式上下文中的使用计算属性的话，请使用它。
```js
configure({ computedRequiresReaction: true });
```
### disableErrorBoundaries: boolean
默认情况下，MobX会捕获并重新抛出代码中发生的异常，从而确保某个异常中的反应(reaction)不会阻止其他可能无关的反应的预定执行。这意味着异常不会传播到原始代码中，因此将无法使用try/catch来捕获它们。
有时你可能想要捕获这些错误，例如在单元测试反应时。此时可以使用`disableErrorBoundaries`来禁用此行为。
```js
configure({ disableErrorBoundaries: true });
```
请注意，使用此配置时，MobX并不会回复错误。处于这个原因，你可能需要在每个异常之后使用`_resetGlobalState`。示例如下:
```js
configure({ disableErrorBoundaries: true })

test('Throw if age is negative', () => {
  expect(() => {
    const age = observable.box(10)
    autorun(() => { if (age.get() < 0) throw new Error('Age should not be negative') })
    age.set(-1)
  }).toThrow()
  _resetGlobalState() // 每个异常过后都需要
})
```
> 在MobX 4之前，`_resetGlobalState`名为`extras.resetGlobalState`。

### enforceActions
也被称为"严格模式"。
在严格模式下，不允许在`action`外更改任何状态。可接收的值:
+ `"never"`(默认)：可以在任意地方修改状态
+ `"observed"`:在某处观察到的所有状态都需要通过动作进行更改。在正式应用中推荐此严格模式。
+ `"always"`:状态始终需要通过动作来更新(实际上还包括创建)。

### isolateGlobalState: boolean
当同一环境中有多个MobX实例时，将MobX的全局状态隔离。当使用MobX的同事还使用了使用MobX的封装库时，这是非常有用的。当在库中调用`configure({isolateGlobalState: true})`时。库内的响应性将保持独立。
使用此选项，如果多个MobX实例正在使用的话，内部状态是会共享的。优点就是两个实例的observables可以协同运行，缺点是MobX的版本必须匹配。
```js
conigure({ isolateGlobalState: true });
```
### reactionScheduler: (f: ()=> void) => void
设置一个新函数，用来执行所有MobX的反应(reactions)。默认情况下，`reactionScheduler`只会运行反应`f`而没有其他任何行为。这对于基本的调试或者减慢反应以使用应用的更新更加可视化来说是非常有用的。
```js
configure({
    reactionScheduler: (f): void => {
        console.log("Running an event after a delay:", f);
        setTimeout(f, 100);
    }
});
```
### 直接操控Observable
现在有一个统一的工具API可以控制observable映射、对象和数组。这些API都是响应式的，这意味着如果使用`set`进行添加，使用`value`或`keys`进行迭代，即便是新属性的声明都可以被MobX检测到。
+ `values(thing)`:将集合中的所有制作为数组返回
+ `keys(thing)`:将集合中的所有键作为数组返回
+ `entries(thing)`:返回集合中的所有项的键值对数组
+ `set(thing, key, value)`或`set(thing, {key:value})`使用提供的键值对来更新给定的集合
+ `remove(thing, key)`从集合中移除指定的项。用于数组对接
+ `has(thing, key)`:如果集合中存在指定的observable属性就返回true

## 开发工具
如果你想在MobX最后那的上层构建一些很酷的工具或者想检查MobX的内部状态的话，下列API可能会派上用场。
### "mobx-react-devtools"包
mobx-react-devtools是个强大的包，它帮助你调查React组件的性能和依赖。还有机遇`spy`的强大的日志功能。
#### trace
用法:
+ `trace(enterDebugger?)`
+ `trace(Reaction object / ComputedValue object / disposer function, enterDebugger?)`
+ `trace(object, computedValuePropertyName, enterDebugger?)`

`trace`是一个可以在计算值或reaction中使用的小工具。如果启用了它，那么当值被无效时，他讲开始记录，以及为什么。如果`enterDebugger`设置为`true`,并且启用开发者工具的话，JavaScript引擎会在出发时在此进行断点调试。
#### spy
用法: `spy(listener)`
它类似于将一个`observe`监听器一次性附加到**所有的**observable上，而且还负责正在运行的动作和计算的通知。用于`mobx-react-devtools`。
#### getAtom
用法:getAtom(thing, property?)
返回给定的observable对象、属性、reaction等的背后作用的`Atom`。
#### getDebugName
用法:`getDebugName(thing, property?)`。
返回observable对象、属性、reaction等(生成的)易读的调试名称。用于`mobx-react-devtools`的示例。
#### getDependencyTree
用法:`getDependencyTree(thing, property?)`
返回给定的reaction/计算 当前依赖的所有observable的树形结构。
#### getObserverTree
用法： `getObservable(thing, property?)`。返回正在观察给定的observable的所有reaction/计算的树型结构。
#### "mobx-react"开发钩子
`mobx-react`包提供了以下几个供`mobx-react-devtools`使用的附加API:
+ `trackComponents()`:启用追踪功能，追踪使用了`observer`的React组件
+ `renderReporter.on(callback)`:使用`observer`的React组件每次渲染都会调用callback，并附带相关的时间信息等等。
+ `componentByNodeRegistery`:使用ES6 WeakMap将DOMNode映射到使用`observer`的React组件实例。

## 内部函数
以下方法都在MobX内部使用，在极少数情况下可能会派上用场。但是通常MobX提供了更多的声明性替代方法来解决同样的问题。如果你尝试拓展MobX的话，它们可能会派上用场。
### transaction
Transaction是底层API，推荐使用actions来替代`transaction(work: ()=>void)`可以用来批量更新而不会通知任何观察者，直到事物结束。
`transaction`接收一个无参的`worker`函数作为参数，并运行它。到这个函数完成前都不糊有任何观察者受到通知。`transaction`返回`worker`函数返回的任意值。注意，`transaction`的运行完全是同步的。transactions可以是嵌套的。只有当最外层的`transaction`完成后，等待中的reactions才会运行。
```js
import {observable, transaction, autorun} from "mobx";

const numbers = observable([]);

autorun(() => console.log(numbers.length, "numbers!"));
// 输出: '0 numbers!'

transaction(() => {
    transaction(() => {
        numbers.push(1);
        numbers.push(2);
    });
    numbers.push(3);
});
// 输出: '3 numbers!'
```
### untracked
untracked允许你在没有观察者的情况下运行一段代码。就像`transaction`,`untracked`由`(@)action`自动应用，所以通常使用动作要比直接`untracked`有意义得多。示例:
```js

const person = observable({
    firstName: "Michel",
    lastName: "Weststrate"
});

autorun(() => {
    console.log(
        person.lastName,
        ",",
        // 这个 untracked 代码块会在没有建立依赖的情况下返回 person 的 firstName
        untracked(() => person.firstName)
    );
});
// 输出: Weststrate, Michel

person.firstName = "G.K.";
// 不输出！

person.lastName = "Chesterton";
// 输出: Chesterton, G.K.
```
### createAtom
实用程序类，可用于创建你自己的observable数据解构，并将它们连接到MobX。在所有observable数据类型的内部使用。