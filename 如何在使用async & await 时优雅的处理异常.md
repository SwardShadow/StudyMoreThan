# 如何在使用async & await 时优雅的处理异常
[toc]
在ES7中，我们可以使用async & await 进行编写异步函数，使用这种写法我们的异步函数看起来就跟同步代码一样。
在之前的版本(ES6)，可以使用Promise写法，来简化我们异步变成的流程，同事也避免了**回调地域**。
## 回调地域
回调地域是语义化产生的一个术语,它的释义可以用下面这种情况进行阐述:
```js
function AsyncTask() {
	asyncFuncA(function(err, resultA) {
    	if (err) return cb(err);
        asyncFuncB(function(err, result){
        	if (err) return cb(err);
            asyncFuncC(function(err, resultC) {
            	if (err) return cb(err);
                // And so it goes ...
            });
        });
    });
}
```
上例代码中，不断地回调，使得代码维护和管理控制流程变得十分的困难。我们不妨考虑下这种情况，加入某个if语句需要执行其他的方法，而回调函数Function的结果为foo。
## 使用Promise优化
ES6和Promise的出现，使得我们可以简化之前“回调地狱”般的代码如下:
```js
function asyncTask(cb) {
	asyncFuncA.then(AsyncFuncB)
    	.then(AsyncFuncC)
        .then(AsyncFuncD)
        .then(data => cb(null, data))
        .catch(err => cb(err));
}
```
这样编写是不是看起来舒服多了？
这是在实际的业务场景中，异步流的处理可能会更加复杂一些，举例来说，
假如在你的一个(node.js)服务器中，你可能想要:
1. 将一个数据1保存到数据库中(步骤1)。
2. 根据保存的数据1查找另外一个数据2(步骤2)。
3. 如果查找到了数据2， 执行其他的一些异步任务(其他任务)。
4. 等到所有的任务全部执行完成之后，你可能需要使用你在(步骤1)中得到的结果用来反馈给用户。
5. 如果在执行任务的过程中发生了错误，你得要告诉用户在哪个步骤发生了错误。

在使用了Promise语法后，这样当然看起来更加的简洁了，但是，在我看来仍然有一点混乱。
## ES7 Async/await
> 你需要使用转移其才能使用Async/Await,您可以使用babel插件或TypeScript来添加所需的工具。

此时，若使用async/await，你会发现代码写起来舒服多了，它允许我们像下面一样编写代码:
```js
async function asyncTask(cb) {
	const user = await UserModel.findById(1);
    if (!user) return cb('No user found');
    const savedTask = await TaskModel({userId: user.id, name: 'Demo Task'});
    if (user.notificationEnabled) {
    	await NotificationService.sendNotification(user.id, 'Task Created');
    }
    if (savedTask.assignedUser.id !== user.id) {
    	await NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you');
    }
    cb(null, savedTask);
}
```
上面的代码看起来可读性增强了不少，但是如何处理错误报错呢？
## 异常处理
在执行异步任务使用Promise的时候可能会发生一些错误类似数据库连接错误，数据库模型验证错等情况。
当一个异步函数正在等待Promise返回值的时候，当Promise方法报了错误的时候，它会抛出一样，这个异常可以在catch方法里面捕获到。
在使用Async/Await时，我们通常使用try/catch语句进行异常捕获。
```js
try{
    //do something
}
catch{
   // deal err
}
```
我没有编写强类型语言的背景，因此增加额外的try/catch语句，对我来说增加了额外的代码，这在我看来非常的冗余不干净。
所以之前的代码看起来是这样的：
```js
async function asyncTask(cb) {
    try {
       const user = await UserModel.findById(1);
       if(!user) return cb('No user found');
    } catch(e) {
        return cb('Unexpected error occurred');
    }

    try {
       const savedTask = await TaskModel({userId: user.id, name: 'Demo Task'});
    } catch(e) {
        return cb('Error occurred while saving task');
    }

    if(user.notificationsEnabled) {
        try {
            await NotificationService.sendNotification(user.id, 'Task Created');
        } catch(e) {
            return cb('Error while sending notification');
        }
    }

    if(savedTask.assignedUser.id !== user.id) {
        try {
            await NotificationService.sendNotification(savedTask.assignedUser.id, 'Task was created for you');
        } catch(e) {
            return cb('Error while sending notification');
        }
    }

    cb(null, savedTask);
}
```
## 另想办法
最近我一直在使用go-lang进行编码，并且非常喜欢他们娥解决方案，它的代码看起来像这样:
```go
data, err := db.Query("SELECT ...")
if err != nil { return err }
```
我认为它比使用`try/catch`语句块更加简洁，并且代码量更少，这使得它刻度和可维护更好。
但是使用Await的话，如果没有为其提供try-catch处理异常的话，当程序发生错误的时候，他会默默的退出(你看到不抛出的异常)。如果你没有提供catch语句老捕捉错误的话，你将无法控制它。
**Await 在等待一个Promise的返回值。**
## async & await 异常捕捉工具函数
有了这些知识，我们就可以制作一个小的通用函数来帮助我们捕捉这些错误。
```js
// to.js
export default function to(promise) {
   return promise.then(data => {
      return [null, data];
   })
   .catch(err => [err]);
}
```
这个通用函数接受一个Promise，然后将处理成功的返回值以数组的形式作为附加值返回，并且在catch方法中接受到捕捉到的第一个错误。
```js
import to from './to.js';

async function asyncTask(cb) {
     let err, user, savedTask;

     [err, user] = await to(UserModel.findById(1));
     if(!user) return cb('No user found');

     [err, savedTask] = await to(TaskModel({userId: user.id, name: 'Demo Task'}));
     if(err) return cb('Error occurred while saving task');

    if(user.notificationsEnabled) {
       const [err] = await to(NotificationService.sendNotification(user.id, 'Task Created'));
       if(err) return cb('Error while sending notification');
    }

    cb(null, savedTask);
}
```
上面的例子只是一个使用该解决方案的简单用例，你可以在io.js中添加拦截方法(类似调试的断点)，该方法接受原始错误对象，打印日志或者进行其他任何你想要进行的操作，然后再返回操作后的对象。
我们为这个库创建了一个简单的NPM包(Github Repo),您可以使用以下方法进行安装:
```js
npm i await-to-js
```
这篇文章只是寻找Async/Await功能的一种不同方式，完全善于个人意见。您可以使用Promise，仅使用try-catch和许多其他解决方案来实现类似的结果。只要你喜欢并且它适用。
## 引发思考
async/await 结合promise使用就好了，即异步流程控制的最后加上promise的catch。
```js
async function task(){
    return await req();
}

task().catch(e => console.error(e))
```
结合async/await 结合Promise.all使用时，如何捕获异常&处理？
```js
async function hello(flag){
    return new Promise((resolve, reject) => {
        if(flag) setTimeout(() => resolve('hello'), 100);
        else reject('hello-error');
    })
}

async function demo(flag){
    return new Promise((resolve, reject) => {
        if(flag) setTimeout(() => resolve('demo'), 100);
        else reject('demo-error');
    })
}

async function main(){
    let res = await hello(1).catch(e => console.error(e));
    console.log('res => ', res);
    let result = await Promise.all([hello(1), demo(1)]);
    // let result = await Promise.all([hello(1), demo(0)]).catch(e => console.error('error => ', e));
    console.log('result => ', result);
}

main()
```